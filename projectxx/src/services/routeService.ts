import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// OpenRouteService API configuration
const OPENROUTE_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImEyMzliY2QwNjhjMDQzYjVhNjk1YTRiMGJmM2ExNTc5IiwiaCI6Im11cm11cjY0In0=';
const OPENROUTE_BASE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

// Database-based route caching (permanent storage)

interface RouteData {
  time: number | null; // travel time in seconds
  distance: number | null; // distance in meters
  reachable: boolean;
}

interface Coordinates {
  lat: number;
  lng: number;
}

// Calculate straight-line distance between two points (Haversine formula)
export function calculateStraightLineDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Call OpenRouteService API to get actual route data
async function callOpenRouteServiceAPI(start: Coordinates, end: Coordinates): Promise<RouteData> {
  console.log(`🌐 [RouteService] Calling OpenRouteService API...`);
  console.log(`📍 [RouteService] Start coordinates: ${start.lat}, ${start.lng}`);
  console.log(`🏢 [RouteService] End coordinates: ${end.lat}, ${end.lng}`);
  
  try {
    const response = await fetch(OPENROUTE_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': OPENROUTE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat], // OpenRouteService expects [lng, lat] format
          [end.lng, end.lat]
        ]
      })
    });

    if (!response.ok) {
      console.log(`❌ [RouteService] API request failed: ${response.status} ${response.statusText}`);
      throw new Error(`OpenRouteService API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const durationInSeconds = data.routes[0].summary.duration;
      const distanceInMeters = data.routes[0].summary.distance;
      
      console.log(`⏱️  [RouteService] API Response Details:`);
      console.log(`   - Duration: ${durationInSeconds} seconds`);
      console.log(`   - Duration: ${(durationInSeconds / 60).toFixed(2)} minutes`);
      console.log(`   - Duration: ${(durationInSeconds / 3600).toFixed(2)} hours`);
      console.log(`   - Distance: ${distanceInMeters} meters`);
      console.log(`   - Distance: ${(distanceInMeters / 1000).toFixed(2)} km`);
      console.log(`✅ [RouteService] Successfully calculated route data`);
      
      return {
        time: durationInSeconds, // seconds
        distance: distanceInMeters, // meters
        reachable: true
      };
    } else {
      console.log(`❌ [RouteService] No route found in API response`);
      console.log(`📋 [RouteService] API Response:`, JSON.stringify(data, null, 2));
      return {
        time: null,
        distance: null,
        reachable: false
      };
    }
  } catch (error) {
    console.error('❌ [RouteService] Error calling OpenRouteService API:', error);
    return {
      time: null,
      distance: null,
      reachable: false
    };
  }
}

// Get route data for vendor-warehouse pair
export async function getRouteData(vendorId: string, warehouseId: string): Promise<RouteData> {
  // Check if already cached in database
  const cachedRoute = await prisma.routeDistance.findUnique({
    where: {
      vendorId_warehouseId: {
        vendorId,
        warehouseId
      }
    }
  });
  
  if (cachedRoute) {
    return {
      time: cachedRoute.travelTime,
      distance: cachedRoute.distance,
      reachable: cachedRoute.reachable
    };
  }
  
  // Get vendor and warehouse coordinates
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: { user: true }
  });
  
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId }
  });
  
  if (!vendor || !warehouse || !vendor.user?.latitude || !vendor.user?.longitude || !warehouse.latitude || !warehouse.longitude) {
    const unreachableData = { time: null, distance: null, reachable: false };
    // routeCache.set(cacheKey, unreachableData); // <-- REMOVE
    return unreachableData;
  }
  
  const vendorCoords = { lat: vendor.user.latitude, lng: vendor.user.longitude };
  const warehouseCoords = { lat: warehouse.latitude, lng: warehouse.longitude };
  
  // Calculate straight-line distance first
  const straightLineDistance = calculateStraightLineDistance(vendorCoords, warehouseCoords);
  const straightLineDistanceMeters = straightLineDistance * 1000; // Convert to meters
  
  if (straightLineDistance > 500) {
    // Beyond delivery radius - cache with straight-line distance only
    const unreachableData = { 
      time: null, 
      distance: straightLineDistanceMeters, 
      reachable: false 
    };
    
    // Save to database
    await prisma.routeDistance.upsert({
      where: {
        vendorId_warehouseId: {
          vendorId,
          warehouseId
        }
      },
      update: {
        distance: straightLineDistanceMeters,
        travelTime: null,
        reachable: false
      },
      create: {
        vendorId,
        warehouseId,
        distance: straightLineDistanceMeters,
        travelTime: null,
        reachable: false
      }
    });
    
    return unreachableData;
  }
  
  // Within delivery radius - call API and cache result
  const routeData = await callOpenRouteServiceAPI(vendorCoords, warehouseCoords);
  
  // Save to database
  await prisma.routeDistance.upsert({
    where: {
      vendorId_warehouseId: {
        vendorId,
        warehouseId
      }
    },
    update: {
      distance: routeData.distance || straightLineDistanceMeters,
      travelTime: routeData.time,
      reachable: routeData.reachable
    },
    create: {
      vendorId,
      warehouseId,
      distance: routeData.distance || straightLineDistanceMeters,
      travelTime: routeData.time,
      reachable: routeData.reachable
    }
  });
  
  return routeData;
}

// Pre-cache all vendor-warehouse routes within 500km
export async function preCacheAllRoutes(): Promise<void> {
  console.log('🚀 Starting route pre-caching...');
  
  const vendors = await prisma.vendor.findMany({
    include: { user: true }
  });
  
  const warehouses = await prisma.warehouse.findMany();
  
  console.log(`📊 Found ${vendors.length} vendors and ${warehouses.length} warehouses`);
  
  let cachedCount = 0;
  let unreachableCount = 0;
  let skippedCount = 0;
  
  for (const vendor of vendors) {
    for (const warehouse of warehouses) {
      if (!vendor.user?.latitude || !vendor.user?.longitude || !warehouse.latitude || !warehouse.longitude) {
        skippedCount++;
        continue; // Skip if coordinates are missing
      }
      
      const vendorCoords = { lat: vendor.user.latitude, lng: vendor.user.longitude };
      const warehouseCoords = { lat: warehouse.latitude, lng: warehouse.longitude };
      
      const straightLineDistance = calculateStraightLineDistance(vendorCoords, warehouseCoords);
      const straightLineDistanceMeters = straightLineDistance * 1000; // Convert to meters
      
      console.log(`🔄 Processing vendor ${vendor.id} to warehouse ${warehouse.id}: ${straightLineDistance.toFixed(2)}km`);
      
      if (straightLineDistance <= 500) {
        // Within delivery radius - cache route with API data
        console.log(`🌐 Calculating route for ${straightLineDistance.toFixed(2)}km distance...`);
        const routeData = await callOpenRouteServiceAPI(vendorCoords, warehouseCoords);
        
        // Save to database
        await prisma.routeDistance.upsert({
          where: {
            vendorId_warehouseId: {
              vendorId: vendor.id,
              warehouseId: warehouse.id
            }
          },
          update: {
            distance: routeData.distance || straightLineDistanceMeters,
            travelTime: routeData.time,
            reachable: routeData.reachable
          },
          create: {
            vendorId: vendor.id,
            warehouseId: warehouse.id,
            distance: routeData.distance || straightLineDistanceMeters,
            travelTime: routeData.time,
            reachable: routeData.reachable
          }
        });
        
        cachedCount++;
        console.log(`✅ Cached route ${cachedCount}: ${routeData.time ? `${routeData.time}s` : 'N/A'} travel time`);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        // Beyond delivery radius - cache with straight-line distance only
        console.log(`❌ Distance too far (${straightLineDistance.toFixed(2)}km > 500km), marking as unreachable`);
        await prisma.routeDistance.upsert({
          where: {
            vendorId_warehouseId: {
              vendorId: vendor.id,
              warehouseId: warehouse.id
            }
          },
          update: {
            distance: straightLineDistanceMeters,
            travelTime: null,
            reachable: false
          },
          create: {
            vendorId: vendor.id,
            warehouseId: warehouse.id,
            distance: straightLineDistanceMeters,
            travelTime: null,
            reachable: false
          }
        });
        
        unreachableCount++;
      }
    }
  }
  
  console.log(`🎯 Route pre-caching complete:`);
  console.log(`   - Routes cached: ${cachedCount}`);
  console.log(`   - Routes unreachable: ${unreachableCount}`);
  console.log(`   - Routes skipped (no coordinates): ${skippedCount}`);
  console.log(`   - Total processed: ${cachedCount + unreachableCount + skippedCount}`);
}

// Remove getCachedRouteData and getCacheStats functions, as they are no longer needed
// export function getCachedRouteData(vendorId: string, warehouseId: string): RouteData | null {
//   const cacheKey = `${vendorId}-${warehouseId}`;
//   return routeCache.get(cacheKey) || null;
// }

// export function getCacheStats() {
//   return {
//     totalCached: routeCache.size,
//     reachable: Array.from(routeCache.values()).filter(route => route.reachable).length,
//     unreachable: Array.from(routeCache.values()).filter(route => !route.reachable).length
//   };
// } 