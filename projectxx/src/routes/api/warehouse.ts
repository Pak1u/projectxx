// API route for warehouse management: Admin can create, anyone can fetch warehouses
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole, authenticateToken } from '../../middleware/auth';
import { setTimeout } from 'timers';
import { emitOfferAccepted, emitTransitComplete, emitOfferCreated } from '../../socket';
import { Server as SocketIOServer } from 'socket.io';
import { preCacheAllRoutes, getRouteData, calculateStraightLineDistance } from '../../services/routeService';

const DEFAULT_TRANSIT_TIME_MS = 30000; // 30 seconds fallback

const prisma = new PrismaClient();

export default function warehouseRouter(io: SocketIOServer) {
  const router = Router();

  // Admin: Create a new warehouse
  router.post('/', authenticateToken, requireAuth, requireRole('ADMIN'), async (req: Request, res: Response): Promise<void> => {
    const { name, latitude, longitude, employeeIds } = req.body;
    if (!name || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    try {
      // Create the warehouse
      const warehouse = await prisma.warehouse.create({
        data: { name, latitude, longitude },
      });
      // Assign employees if provided
      if (Array.isArray(employeeIds) && employeeIds.length > 0) {
        // Only assign employees not already assigned to a warehouse
        await prisma.walmartEmployee.updateMany({
          where: {
            id: { in: employeeIds },
            warehouseId: null,
          },
          data: { warehouseId: warehouse.id },
        });
      }
      res.status(201).json(warehouse);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create warehouse', details: err });
    }
  });

  // Anyone: Get all warehouses
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const warehouses = await prisma.warehouse.findMany({
        include: {
          walmartEmployees: {
            include: { user: true },
          },
        },
      });
      res.json(warehouses);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch warehouses', details: err });
    }
  });

  // Get all unassigned employees
  router.get('/unassigned-employees', authenticateToken, requireAuth, requireRole('ADMIN'), async (req: Request, res: Response): Promise<void> => {
    try {
      const employees = await prisma.walmartEmployee.findMany({
        where: { warehouseId: null },
        include: { user: true },
      });
      res.json(employees);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch unassigned employees', details: err });
    }
  });

  // Employees and Vendors: Get item requests
  router.get('/item-requests', authenticateToken, requireAuth, requireRole('VENDOR', 'EMPLOYEE'), async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      let itemRequests;
      if (req.user.role === 'VENDOR') {
        // Vendors see all requests (only PENDING)
        itemRequests = await prisma.itemRequest.findMany({
          where: { status: { equals: 'PENDING' } },
          include: {
            warehouse: true,
            employee: true,
            offers: { 
              include: { 
                vendor: { 
                  include: { user: true } 
                } 
              }
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        // Add acceptance time for requests with accepted offers
        for (const request of itemRequests) {
          const acceptedOffers = request.offers?.filter((offer: any) => offer.status === 'ACCEPTED') || [];
          if (acceptedOffers.length > 0) {
            const mostRecentAccepted = acceptedOffers.sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            (request as any).acceptanceTime = mostRecentAccepted.createdAt;
          }
        }
      } else if (req.user.role === 'EMPLOYEE') {
        // Employees see only their warehouse's requests (only PENDING)
        const employee = await prisma.walmartEmployee.findFirst({
          where: { user: { id: req.user.userId } },
        });
        if (!employee || !employee.warehouseId) {
          res.status(403).json({ error: 'Employee not assigned to a warehouse' });
          return;
        }
        itemRequests = await prisma.itemRequest.findMany({
          where: { warehouseId: employee.warehouseId, status: { equals: 'PENDING' } },
          include: {
            warehouse: true,
            employee: true,
            offers: { 
              include: { 
                vendor: { 
                  include: { user: true } 
                } 
              }
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        // Add acceptance time for requests with accepted offers
        for (const request of itemRequests) {
          const acceptedOffers = request.offers?.filter((offer: any) => offer.status === 'ACCEPTED') || [];
          if (acceptedOffers.length > 0) {
            const mostRecentAccepted = acceptedOffers.sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            (request as any).acceptanceTime = mostRecentAccepted.createdAt;
          }
        }
      } else {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }
      res.json(itemRequests);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch item requests', details: err });
    }
  });

  // Employees: Create a new item request for their warehouse
  router.post('/item-requests', authenticateToken, requireAuth, requireRole('EMPLOYEE'), async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { itemName, quantity } = req.body;
    try {
      const employee = await prisma.walmartEmployee.findFirst({
        where: { user: { id: req.user.userId } },
      });
      if (!employee || !employee.warehouseId) {
        res.status(403).json({ error: 'Employee not assigned to a warehouse' });
        return;
      }
      if (!itemName || !quantity || quantity < 1) {
        res.status(400).json({ error: 'Invalid item name or quantity' });
        return;
      }
      const itemRequest = await prisma.itemRequest.create({
        data: {
          itemName,
          quantity,
          warehouseId: employee.warehouseId,
          employeeId: employee.id,
        },
      });
      res.status(201).json(itemRequest);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create item request', details: err });
    }
  });

  // Vendors: Submit an offer for an item request
  router.post('/item-requests/:id/offer', authenticateToken, requireAuth, requireRole('VENDOR'), async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { quantity } = req.body;
    const vendorId = req.user.userId;
    const itemRequestId = req.params.id;
    try {
      // Find the item request and warehouse
      const itemRequest = await prisma.itemRequest.findUnique({ where: { id: itemRequestId } });
      if (!itemRequest) {
        res.status(404).json({ error: 'Item request not found' });
        return;
      }
      // Check if quantity is valid
      if (!quantity || quantity < 1 || quantity > itemRequest.quantity) {
        res.status(400).json({ error: 'Invalid offer quantity' });
        return;
      }
      // Find the vendor
      const vendor = await prisma.vendor.findFirst({ where: { user: { id: vendorId } } });
      if (!vendor) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }
      // Get price from vendor inventory
      const inventory = await prisma.vendorInventory.findFirst({ where: { vendorId: vendor.id, itemName: itemRequest.itemName } });
      if (!inventory) {
        res.status(400).json({ error: 'Vendor does not have this item in inventory' });
        return;
      }
      if (typeof inventory.price !== 'number') {
        res.status(400).json({ error: 'No price found for this item in vendor inventory' });
        return;
      }
      // Create the offer with price
      const offer = await prisma.offer.create({
        data: {
          vendorId: vendor.id,
          itemRequestId: itemRequest.id,
          warehouseId: itemRequest.warehouseId,
          quantity,
          price: inventory.price,
        },
        include: {
          vendor: true,
          itemRequest: {
            include: {
              warehouse: true,
              employee: true
            }
          }
        }
      });
      
      // Emit WebSocket event for new offer
      emitOfferCreated(io, offer, offer.itemRequest);
      
      res.status(201).json(offer);
    } catch (err) {
      res.status(500).json({ error: 'Failed to submit offer', details: err });
    }
  });

  // PATCH: Employee accepts/rejects an offer
  router.patch('/offers/:offerId/status', authenticateToken, requireAuth, requireRole('EMPLOYEE'), async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { offerId } = req.params;
    const { status } = req.body; // status: 'ACCEPTED' | 'REJECTED'
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    try {
      // Find the offer and related data
      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: { itemRequest: true, vendor: true, warehouse: true },
      });
      if (!offer) {
        res.status(404).json({ error: 'Offer not found' });
        return;
      }
      // Only allow employees of the warehouse to accept/reject
      const employee = await prisma.walmartEmployee.findFirst({ where: { user: { id: req.user.userId } } });
      if (!employee || offer.warehouseId !== employee.warehouseId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      // Prevent accepting more offers if request is fulfilled
      if (status === 'ACCEPTED') {
        const acceptedOffers = await prisma.offer.findMany({
          where: { itemRequestId: offer.itemRequestId, status: 'ACCEPTED' },
        });
        const totalAccepted = acceptedOffers.reduce((sum, o) => sum + o.quantity, 0);
        if (totalAccepted >= offer.itemRequest.quantity) {
          res.status(400).json({ error: 'Request already fulfilled. No more offers can be accepted.' });
          return;
        }
        // If this offer would over-fulfill, prevent it
        if (totalAccepted + offer.quantity > offer.itemRequest.quantity) {
          res.status(400).json({ error: 'Accepting this offer would exceed the requested quantity.' });
          return;
        }
      }
      // Update offer status
      await prisma.offer.update({ where: { id: offerId }, data: { status } });
      if (status === 'ACCEPTED') {
        // Subtract from vendor inventory
        await prisma.vendorInventory.updateMany({
          where: { vendorId: offer.vendorId, itemName: offer.itemRequest.itemName },
          data: { quantity: { decrement: offer.quantity } },
        });
        // Add to VendorTransitInventory
        const transit = await prisma.vendorTransitInventory.create({
          data: {
            vendorId: offer.vendorId,
            warehouseId: offer.warehouseId,
            itemName: offer.itemRequest.itemName,
            quantity: offer.quantity,
          },
        });
        
        // Emit WebSocket event for offer acceptance
        const updatedItemRequest = await prisma.itemRequest.findUnique({
          where: { id: offer.itemRequestId },
          include: {
            warehouse: true,
            employee: true,
            offers: { 
              include: { 
                vendor: { 
                  include: { user: true } 
                } 
              },
              where: { status: 'ACCEPTED' }
            },
          },
        });
        if (updatedItemRequest) {
          // Use the current time as the acceptance time (when the offer was actually accepted)
          const acceptanceTime = new Date();
          
          emitOfferAccepted(io, {
            ...updatedItemRequest,
            acceptanceTime: acceptanceTime
          });
        }
        
        // Calculate travel time when offer is accepted
        let transitTimeMs = DEFAULT_TRANSIT_TIME_MS;
        
        console.log(`🚀 Starting travel time calculation for offer ${offer.id}`);
        console.log(`📊 Default transit time: ${DEFAULT_TRANSIT_TIME_MS}ms (${DEFAULT_TRANSIT_TIME_MS/1000}s)`);
        
        try {
          // Get vendor and warehouse coordinates
          const vendor = await prisma.vendor.findUnique({
            where: { id: offer.vendorId },
            include: { user: true }
          });
          
          const warehouse = await prisma.warehouse.findUnique({
            where: { id: offer.warehouseId }
          });
          
          if (vendor?.user?.latitude && vendor.user.longitude && warehouse?.latitude && warehouse.longitude) {
            const vendorCoords = { lat: vendor.user.latitude, lng: vendor.user.longitude };
            const warehouseCoords = { lat: warehouse.latitude, lng: warehouse.longitude };
            
            console.log(`📍 Vendor coordinates: ${vendorCoords.lat}, ${vendorCoords.lng}`);
            console.log(`🏢 Warehouse coordinates: ${warehouseCoords.lat}, ${warehouseCoords.lng}`);
            
            const straightLineDistance = calculateStraightLineDistance(vendorCoords, warehouseCoords);
            console.log(`📏 Straight-line distance: ${straightLineDistance.toFixed(2)}km`);
            
            if (straightLineDistance <= 500) {
              // Call OpenRouteService API to get actual travel time
              console.log(`🌐 Calling OpenRouteService API for ${straightLineDistance.toFixed(2)}km distance...`);
              
              const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
                method: 'POST',
                headers: {
                  'Authorization': 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImEyMzliY2QwNjhjMDQzYjVhNjk1YTRiMGJmM2ExNTc5IiwiaCI6Im11cm11cjY0In0=',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  coordinates: [
                    [vendorCoords.lng, vendorCoords.lat],
                    [warehouseCoords.lng, warehouseCoords.lat]
                  ]
                })
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.routes && data.routes.length > 0) {
                  const durationInSeconds = data.routes[0].summary.duration;
                  const distanceInMeters = data.routes[0].summary.distance;
                  
                  transitTimeMs = durationInSeconds * 1000; // Convert to milliseconds
                  
                  console.log(`⏱️  API Response Details:`);
                  console.log(`   - Duration: ${durationInSeconds} seconds`);
                  console.log(`   - Duration: ${(durationInSeconds / 60).toFixed(2)} minutes`);
                  console.log(`   - Duration: ${(durationInSeconds / 3600).toFixed(2)} hours`);
                  console.log(`   - Distance: ${distanceInMeters} meters`);
                  console.log(`   - Distance: ${(distanceInMeters / 1000).toFixed(2)} km`);
                  console.log(`   - Transit time (ms): ${transitTimeMs}`);
                  console.log(`✅ Final transit time set to: ${transitTimeMs}ms (${(transitTimeMs/1000).toFixed(2)}s)`);
                  
                  // Save the calculated transit time to the RouteDistance table
                  try {
                    await prisma.routeDistance.upsert({
                      where: {
                        vendorId_warehouseId: {
                          vendorId: offer.vendorId,
                          warehouseId: offer.warehouseId
                        }
                      },
                      update: {
                        travelTime: durationInSeconds,
                        reachable: true
                      },
                      create: {
                        vendorId: offer.vendorId,
                        warehouseId: offer.warehouseId,
                        distance: distanceInMeters,
                        travelTime: durationInSeconds,
                        reachable: true
                      }
                    });
                    console.log(`💾 Saved transit time to database: ${durationInSeconds}s for vendor ${offer.vendorId} to warehouse ${offer.warehouseId}`);
                  } catch (error) {
                    console.error('❌ Failed to save transit time to database:', error);
                  }
                } else {
                  console.log(`❌ No route found in API response`);
                  console.log(`📋 API Response:`, JSON.stringify(data, null, 2));
                }
              } else {
                console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
                console.log(`📋 Response body:`, await response.text());
              }
            } else {
              console.log(`❌ Distance too far (${straightLineDistance.toFixed(2)}km > 500km), using default time`);
              console.log(`⏱️  Using default transit time: ${transitTimeMs}ms (${(transitTimeMs/1000).toFixed(2)}s)`);
            }
          } else {
            console.log(`❌ Missing coordinates, using default time`);
            console.log(`📍 Vendor coordinates available: ${!!vendor?.user?.latitude && !!vendor.user.longitude}`);
            console.log(`🏢 Warehouse coordinates available: ${!!warehouse?.latitude && !!warehouse.longitude}`);
            console.log(`⏱️  Using default transit time: ${transitTimeMs}ms (${(transitTimeMs/1000).toFixed(2)}s)`);
          }
        } catch (error) {
          console.error('❌ Error calculating travel time:', error);
          console.log(`⏱️  Using default transit time due to error: ${transitTimeMs}ms (${(transitTimeMs/1000).toFixed(2)}s)`);
        }
        
        console.log(`🎯 Final transit time for offer ${offer.id}: ${transitTimeMs}ms (${(transitTimeMs/1000).toFixed(2)}s)`);
        console.log(`⏰ Transit will complete at: ${new Date(Date.now() + transitTimeMs).toLocaleString()}`);
        
        setTimeout(async () => {
          await prisma.$transaction([
            prisma.warehouseInventory.upsert({
              where: { warehouseId_itemName: { warehouseId: offer.warehouseId, itemName: offer.itemRequest.itemName } },
              update: { quantity: { increment: offer.quantity } },
              create: {
                warehouseId: offer.warehouseId,
                itemName: offer.itemRequest.itemName,
                quantity: offer.quantity,
              },
            }),
            prisma.vendorTransitInventory.delete({ where: { id: transit.id } }),
          ]);
          // After inventory is moved, check if request is fulfilled and update status/create billing if needed
          const acceptedOffers = await prisma.offer.findMany({
            where: { itemRequestId: offer.itemRequestId, status: 'ACCEPTED' },
          });
          const totalAccepted = acceptedOffers.reduce((sum, o) => sum + o.quantity, 0);
          if (totalAccepted >= offer.itemRequest.quantity) {
            // Set status to FULFILLED
            await prisma.itemRequest.update({
              where: { id: offer.itemRequestId },
              data: { status: { set: 'FULFILLED' } },
            });
            // Create BillingRecord if not already created
            const existingBilling = await prisma.billingRecord.findFirst({ where: { itemRequestId: offer.itemRequestId } });
            if (!existingBilling) {
              const acceptedOffersForBilling = await prisma.offer.findMany({ where: { itemRequestId: offer.itemRequestId, status: { equals: 'ACCEPTED' } } });
              const amount = acceptedOffersForBilling.reduce((sum, o) => sum + (o.quantity * o.price), 0);
              await prisma.billingRecord.create({
                data: {
                  warehouseId: offer.warehouseId,
                  itemRequestId: offer.itemRequestId,
                  generatedById: offer.itemRequest.employeeId,
                  amount,
                },
              });
            }
          }
          
          // Emit WebSocket event for transit completion
          emitTransitComplete(io, offer.itemRequestId);
        }, transitTimeMs);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update offer', details: err });
    }
  });

  // Pre-cache all vendor-warehouse routes
  router.post('/pre-cache-routes', authenticateToken, requireAuth, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    try {
      // Start pre-caching in the background (don't wait for it to complete)
      preCacheAllRoutes().catch(err => {
        console.error('Route pre-caching failed:', err);
      });
      
      res.json({ message: 'Route pre-caching initiated' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to initiate route pre-caching', details: err });
    }
  });

  // Get route data for a specific vendor-warehouse pair
  router.get('/route-data/:vendorId/:warehouseId', authenticateToken, requireAuth, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { vendorId, warehouseId } = req.params;
    
    try {
      // Use the getRouteData function which checks cache and calculates if needed
      const routeData = await getRouteData(vendorId, warehouseId);
      
      res.json({
        time: routeData.time,
        distance: routeData.distance,
        reachable: routeData.reachable
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get route data', details: err });
    }
  });

  // Get distances for vendor to all warehouses (for marketplace display)
  router.get('/vendor-distances', authenticateToken, requireAuth, requireRole('VENDOR'), async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    try {
      const vendor = await prisma.vendor.findFirst({
        where: { user: { id: req.user.userId } },
        include: { user: true }
      });
      
      if (!vendor || !vendor.user?.latitude || !vendor.user?.longitude) {
        res.status(400).json({ error: 'Vendor location not set' });
        return;
      }
      
      const warehouses = await prisma.warehouse.findMany();
      const distances = [];
      
      for (const warehouse of warehouses) {
        if (!warehouse.latitude || !warehouse.longitude) continue;
        
        // Calculate distance directly
        const vendorCoords = { lat: vendor.user.latitude, lng: vendor.user.longitude };
        const warehouseCoords = { lat: warehouse.latitude, lng: warehouse.longitude };
        
        const straightLineDistance = calculateStraightLineDistance(vendorCoords, warehouseCoords);
        const straightLineDistanceMeters = straightLineDistance * 1000;
        
        distances.push({
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          distance: straightLineDistanceMeters,
          reachable: straightLineDistance <= 500
        });
      }
      
      res.json({ distances });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get vendor distances', details: err });
    }
  });

  // Get distances for offers (for employee marketplace display)
  router.get('/offer-distances/:itemRequestId', authenticateToken, requireAuth, requireRole('EMPLOYEE'), async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { itemRequestId } = req.params;
    
    try {
      const offers = await prisma.offer.findMany({
        where: { itemRequestId },
        include: {
          vendor: {
            include: { user: true }
          },
          warehouse: true
        }
      });
      
      const distances = [];
      
      for (const offer of offers) {
        if (!offer.vendor?.user?.latitude || !offer.vendor.user.longitude || !offer.warehouse?.latitude || !offer.warehouse.longitude) {
          distances.push({
            offerId: offer.id,
            vendorId: offer.vendorId,
            warehouseId: offer.warehouseId,
            distance: null,
            reachable: false
          });
          continue;
        }
        
        // Calculate distance directly
        const vendorCoords = { lat: offer.vendor.user.latitude, lng: offer.vendor.user.longitude };
        const warehouseCoords = { lat: offer.warehouse.latitude, lng: offer.warehouse.longitude };
        
        const straightLineDistance = calculateStraightLineDistance(vendorCoords, warehouseCoords);
        const straightLineDistanceMeters = straightLineDistance * 1000;
        
        distances.push({
          offerId: offer.id,
          vendorId: offer.vendorId,
          warehouseId: offer.warehouseId,
          distance: straightLineDistanceMeters,
          reachable: straightLineDistance <= 500
        });
      }
      
      res.json({ distances });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get offer distances', details: err });
    }
  });

  return router;
} 