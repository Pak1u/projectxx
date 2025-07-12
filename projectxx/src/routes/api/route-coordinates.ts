import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAuth, requireRole } from '../../middleware/auth';

const prisma = new PrismaClient();

const router = Router();

// GET /api/route-coordinates
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // console.log('🔍 Backend: Fetching coordinates from database...');
    
    // Get all warehouses with coordinates
    const warehouses = await prisma.warehouse.findMany({
      where: {
        latitude: { not: undefined },
        longitude: { not: undefined }
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true
      }
    });

    // console.log(`📦 Backend: Found ${warehouses.length} warehouses with coordinates`);

    // Get all vendors with coordinates (through their user accounts)
    const vendors = await prisma.vendor.findMany({
      include: {
        user: {
          select: {
            latitude: true,
            longitude: true
          }
        }
      },
      where: {
        user: {
          latitude: { not: undefined },
          longitude: { not: undefined }
        }
      }
    });

    // console.log(`🏪 Backend: Found ${vendors.length} vendors with coordinates`);

    // Filter vendors that have coordinates
    const vendorsWithCoords = vendors.filter(vendor => 
      vendor.user?.latitude !== undefined && vendor.user?.longitude !== undefined
    ).map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      latitude: vendor.user!.latitude!,
      longitude: vendor.user!.longitude!
    }));

    // console.log(`✅ Backend: Returning ${warehouses.length} warehouses and ${vendorsWithCoords.length} stores`);

    res.json({
      warehouses,
      stores: vendorsWithCoords
    });
  } catch (err: any) {
    // console.error('❌ Backend: Error fetching coordinates:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to fetch coordinates',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// GET /api/route-coordinates/employee - Get employee's assigned warehouse and available stores
router.get('/employee', authenticateToken, requireAuth, requireRole('EMPLOYEE'), async (req: Request, res: Response): Promise<void> => {
  try {
    // console.log('🔍 Backend: Fetching employee coordinates...');
    
    const userId = req.user?.userId;
    
    // Get employee's warehouse
    const employee = await prisma.walmartEmployee.findFirst({
      where: { user: { id: userId } },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true
          }
        }
      }
    });
    
    if (!employee || !employee.warehouse) {
      // console.log('❌ Backend: Employee not assigned to a warehouse');
      res.status(403).json({ error: 'Employee not assigned to a warehouse' });
      return;
    }
    
    // console.log(`📦 Backend: Employee assigned to warehouse: ${employee.warehouse.name}`);
    
    // Get all vendors with coordinates (through their user accounts)
    const vendors = await prisma.vendor.findMany({
      include: {
        user: {
          select: {
            latitude: true,
            longitude: true
          }
        }
      },
      where: {
        user: {
          latitude: { not: undefined },
          longitude: { not: undefined }
        }
      }
    });
    
    // console.log(`🏪 Backend: Found ${vendors.length} vendors with coordinates`);
    
    // Filter vendors that have coordinates
    const vendorsWithCoords = vendors.filter(vendor => 
      vendor.user?.latitude !== undefined && vendor.user?.longitude !== undefined
    ).map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      latitude: vendor.user!.latitude!,
      longitude: vendor.user!.longitude!
    }));
    
    // console.log(`✅ Backend: Returning warehouse and ${vendorsWithCoords.length} stores for employee`);
    
    res.json({
      warehouse: employee.warehouse,
      stores: vendorsWithCoords
    });
  } catch (err: any) {
    // console.error('❌ Backend: Error fetching employee coordinates:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to fetch employee coordinates',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ORS API key
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImEyMzliY2QwNjhjMDQzYjVhNjk1YTRiMGJmM2ExNTc5IiwiaCI6Im11cm11cjY0In0=";

// Simple cache for route segments to avoid repeated API calls
const routeCache = new Map();

// Rate limiting - track API calls
let apiCallCount = 0;
const MAX_API_CALLS = 50; // Conservative limit
const RESET_INTERVAL = 60000; // Reset every minute

setInterval(() => {
  apiCallCount = 0;
}, RESET_INTERVAL);

// Calculate route between two points
router.post('/route-segment', async (req: Request, res: Response): Promise<void> => {
  try {
    const { coord1, coord2 } = req.body;
    
    if (!coord1 || !coord2 || typeof coord1.lat !== 'number' || typeof coord1.lon !== 'number' || typeof coord2.lat !== 'number' || typeof coord2.lon !== 'number') {
      res.status(400).json({ error: 'Invalid coordinates' });
      return;
    }

    // Check rate limit
    if (apiCallCount >= MAX_API_CALLS) {
      res.status(429).json({ error: 'API rate limit exceeded. Please try again later.' });
      return;
    }

    // Create cache key
    const cacheKey = `${coord1.lat},${coord1.lon}-${coord2.lat},${coord2.lon}`;
    
    // Check cache first
    if (routeCache.has(cacheKey)) {
      // console.log('Using cached route for:', cacheKey);
      res.json(routeCache.get(cacheKey));
      return;
    }

    // Calculate straight-line distance as fallback
    const calculateStraightLine = () => {
      const lat1 = coord1.lat * Math.PI / 180;
      const lat2 = coord2.lat * Math.PI / 180;
      const deltaLat = (coord2.lat - coord1.lat) * Math.PI / 180;
      const deltaLon = (coord2.lon - coord1.lon) * Math.PI / 180;
      
      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = 6371000 * c; // Earth radius in meters
      const duration = distance / 13.89; // Assume 50 km/h average speed
      
      return {
        coordinates: [[coord1.lon, coord1.lat], [coord2.lon, coord2.lat]],
        distance: distance,
        duration: duration
      };
    };

    // Try ORS API if we have calls remaining
    if (apiCallCount < MAX_API_CALLS) {
      try {
        apiCallCount++;
        
        const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
        const body = {
          coordinates: [
            [coord1.lon, coord1.lat],
            [coord2.lon, coord2.lat]
          ],
          instructions: false,
          geometry: true
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': ORS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const coordinates = feature.geometry.coordinates;
            const properties = feature.properties;

            let distance = 0;
            let duration = 0;

            if (properties.summary) {
              distance = properties.summary.distance || 0;
              duration = properties.summary.duration || 0;
            } else if (properties.segments && properties.segments.length > 0) {
              distance = properties.segments.reduce((sum: number, seg: any) => sum + (seg.distance || 0), 0);
              duration = properties.segments.reduce((sum: number, seg: any) => sum + (seg.duration || 0), 0);
            }

            const result = {
              coordinates: coordinates,
              distance: distance,
              duration: duration
            };

            // Cache the result
            routeCache.set(cacheKey, result);
            res.json(result);
            return;
          }
        }
      } catch (orsError: any) {
        // console.log('ORS API failed, using fallback:', orsError.message);
      }
    }

    // Fallback to straight line
    const result = calculateStraightLine();
    routeCache.set(cacheKey, result);
    res.json(result);

  } catch (error: any) {
    // console.error('Error calculating route segment:', error);
    res.status(500).json({ error: 'Failed to calculate route' });
  }
});

// Get route segments for a complete tour
router.post('/route-segments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { coordinates, tour } = req.body;
    
    // console.log('🔍 Route segments request received:');
    // console.log('  - Tour:', tour);
    // console.log('  - Coordinates:', coordinates);
    
    if (!coordinates || !tour || tour.length < 2) {
      // console.log('❌ Invalid tour data');
      res.status(400).json({ error: 'Invalid tour data' });
      return;
    }

    const segments = [];
    
    // console.log('🔄 Processing tour segments...');
    
    for (let i = 0; i < tour.length - 1; i++) {
      const fromIndex = tour[i];
      const toIndex = tour[i + 1];
      
      const fromCoord = coordinates[fromIndex];
      const toCoord = coordinates[toIndex];
      
      // console.log(`  - Segment ${i}: ${fromIndex} -> ${toIndex}`);
      // console.log(`    From:`, fromCoord);
      // console.log(`    To:`, toCoord);
      
      if (!fromCoord || !toCoord) {
        // console.log(`    ❌ Skipping segment ${i} - missing coordinates`);
        continue;
      }
      
      // Use ORS API for route segments (no fallback)
      const cacheKey = `${fromCoord.lat},${fromCoord.lon}-${toCoord.lat},${toCoord.lon}`;
      
      if (routeCache.has(cacheKey)) {
        segments.push(routeCache.get(cacheKey));
        continue;
      }

      // Call ORS API for real driving route
      try {
        const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
        const body = {
          coordinates: [
            [fromCoord.lon, fromCoord.lat],
            [toCoord.lon, toCoord.lat]
          ],
          instructions: false,
          geometry: true
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': ORS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const coordinates = feature.geometry.coordinates;
            const properties = feature.properties;

            let distance = 0;
            let duration = 0;

            if (properties.summary) {
              distance = properties.summary.distance || 0;
              duration = properties.summary.duration || 0;
            } else if (properties.segments && properties.segments.length > 0) {
              distance = properties.segments.reduce((sum: number, seg: any) => sum + (seg.distance || 0), 0);
              duration = properties.segments.reduce((sum: number, seg: any) => sum + (seg.duration || 0), 0);
            }

            const segment = {
              coordinates: coordinates,
              distance: distance,
              duration: duration
            };
            
            routeCache.set(cacheKey, segment);
            segments.push(segment);
            // console.log(`    ✅ Segment ${i} added (ORS):`, segment);
          } else {
            // console.log(`    ❌ No route found for segment ${i}`);
          }
        } else {
          // console.log(`    ❌ ORS API failed for segment ${i}: ${response.status}`);
        }
      } catch (error) {
        // console.log(`    ❌ ORS API error for segment ${i}:`, error);
      }
    }
    
    // console.log('📊 Final segments:', segments);
    res.json({ segments });

  } catch (error: any) {
    // console.error('Error calculating route segments:', error);
    res.status(500).json({ error: 'Failed to calculate route segments' });
  }
});

export default router; 