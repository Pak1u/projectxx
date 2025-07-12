import { Router, Request, Response } from 'express';
import { callOpenRouteServiceAPI } from '../../services/routeService';

const router = Router();

// POST /api/ors-distance
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { coord1, coord2 } = req.body;
    
    if (!coord1 || !coord2 || typeof coord1.lat !== 'number' || typeof coord1.lon !== 'number' || typeof coord2.lat !== 'number' || typeof coord2.lon !== 'number') {
      res.status(400).json({ error: 'Invalid coordinates' });
      return;
    }

    console.log(`🔍 Calculating distance between (${coord1.lat}, ${coord1.lon}) and (${coord2.lat}, ${coord2.lon})`);

    // Use the correct function for coordinates
    const routeData = await callOpenRouteServiceAPI(
      { lat: coord1.lat, lng: coord1.lon },
      { lat: coord2.lat, lng: coord2.lon }
    );

    if (routeData.distance === null) {
      res.status(500).json({ error: 'Failed to calculate distance' });
      return;
    }

    console.log(`✅ Distance calculated: ${routeData.distance} meters`);

    res.json({
      distance: routeData.distance, // in meters
      time: routeData.time, // in seconds
      reachable: routeData.reachable
    });

  } catch (err: any) {
    console.error('❌ Error calculating distance:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to calculate distance',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export default router; 