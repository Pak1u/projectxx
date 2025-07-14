import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAuth, requireRole } from '../../../middleware/auth';
import { spawn } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

const router = Router();

// POST /api/employee/assign-trucks
router.post('/', authenticateToken, requireAuth, requireRole('EMPLOYEE'), async (req: Request, res: Response) => {
  try {
    const { vendors, truckVolume, cppInput } = req.body;

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      res.status(400).json({ error: 'No vendors provided' });
      return;
    }

    if (!truckVolume || truckVolume <= 0) {
      res.status(400).json({ error: 'Invalid truck volume' });
      return;
    }

    // Prepare input for C++ program
    let input = cppInput;
    if (!input) {
      const n = vendors.length; // number of stores/vendors
      input = `${n}\n`;
      for (const vendor of vendors) {
        input += `${vendor.vendorId}\n`;
        const itemCount = vendor.items.length;
        input += `${itemCount}\n`;
        for (const item of vendor.items) {
          input += `${item.itemId} ${item.quantity} ${item.volume}\n`;
        }
      }
      input += `${truckVolume}\n`;

      // === NEW: Build the distance matrix ===
      try {
        // 1. Get warehouse and vendor coordinates
        const warehouse = req.body.warehouse; // { lat, lon }
        if (!warehouse || typeof warehouse.lat !== 'number' || typeof warehouse.lon !== 'number') {
          res.status(400).json({ error: 'Warehouse coordinates are required in the request body.' });
          return;
        }
        const vendorCoords = vendors.map((v: any) => {
          if (typeof v.lat !== 'number' || typeof v.lon !== 'number') {
            throw new Error('Each vendor must have lat and lon fields.');
          }
          return { lat: v.lat, lon: v.lon };
        });

        // 2. Build locations array: [warehouse, ...vendors]
        const locations = [warehouse, ...vendorCoords];
        const m = locations.length;

        // 3. Build distance matrix
        const distanceMatrix: number[][] = [];
        for (let i = 0; i < m; ++i) {
          distanceMatrix[i] = [];
          for (let j = 0; j < m; ++j) {
            if (i === j) {
              distanceMatrix[i][j] = 0;
            } else {
              try {
                const data = await fetchWithRetry(
                  'http://localhost:4000/api/ors-distance',
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ coord1: locations[i], coord2: locations[j] }),
                  }
                );
                if (typeof data.distance !== 'number') {
                  throw new Error(data.error || 'Failed to fetch distance');
                }
                distanceMatrix[i][j] = data.distance;
              } catch (fetchErr) {
                console.error(`Error fetching distance for (${i},${j}):`, fetchErr);
                res.status(500).json({ error: `Failed to fetch distance for (${i},${j})`, details: (fetchErr as Error).message });
                return;
              }
            }
          }
        }

        // 4. Append to input
        console.log('Distance matrix to be appended:', distanceMatrix);
        input += `${m}\n`;
        for (let i = 0; i < m; ++i) {
          for (let j = 0; j < m; ++j) {
            input += `${distanceMatrix[i][j]} `;
          }
          input += '\n';
        }
      } catch (err) {
        console.error('Error building distance matrix:', err);
        res.status(500).json({ error: 'Failed to build distance matrix', details: (err as Error).message });
        return;
      }
    }

    console.log('Final input for C++ program:\n', input);

    // Run the C++ program
    const cppExecutablePath = path.join(__dirname, '../truck-distribute-optimised.exe');
    await new Promise<void>((resolve, reject) => {
      const cppProcess = spawn(cppExecutablePath);
      
      let output = '';
      let errorOutput = '';

      cppProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      cppProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      cppProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('C++ program error:', errorOutput);
          res.status(500).json({ error: 'Failed to run truck assignment algorithm' });
          resolve();
          return;
        }

        console.log('C++ program output:', output);

        // Parse the output
        try {
          const trucks = parseCppOutput(output, vendors);
          res.json({ trucks });
          resolve();
          return;
        } catch (parseError) {
          console.error('Error parsing C++ output:', parseError);
          res.status(500).json({ error: 'Failed to parse truck assignment results' });
          resolve();
          return;
        }
      });

      cppProcess.on('error', (error) => {
        console.error('Error spawning C++ process:', error);
        res.status(500).json({ error: 'Failed to execute truck assignment algorithm' });
        resolve();
        return;
      });

      // Send input to C++ program
      cppProcess.stdin.write(input);
      cppProcess.stdin.end();
    });
  } catch (error) {
    console.error('Error in assign-trucks endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add fetchWithRetry helper
async function fetchWithRetry(url: string, options: any, retries = 5, delayMs = 1000): Promise<any> {
  for (let attempt = 0; attempt < retries; ++attempt) {
    const resp = await fetch(url, options);
    if (resp.ok) {
      return await resp.json();
    }
    // If rate limited or failed, wait and retry
    await new Promise(res => setTimeout(res, delayMs));
  }
  throw new Error('Failed to fetch after retries');
}

// Helper function to parse C++ program output
function parseCppOutput(output: string, vendors: any[]): any[] {
  const lines = output.trim().split('\n');
  const trucks: any[] = [];

  // Find the line with number of trucks
  const truckCountLine = lines.find(line => line.includes('Number of trucks needed:'));
  if (!truckCountLine) {
    throw new Error('Could not find truck count in output');
  }

  const truckCount = parseInt(truckCountLine.split(':')[1].trim());
  
  // Parse each truck's information
  for (let i = 0; i < truckCount; i++) {
    const truckLine = lines.find(line => line.startsWith(`Truck ${i + 1}`));
    if (!truckLine) {
      throw new Error(`Could not find information for truck ${i + 1}`);
    }

    // Extract destinations
    const destinationsMatch = truckLine.match(/Destinations: (.*?)\):/);
    const destinations = destinationsMatch 
      ? destinationsMatch[1].split(', ').map(dest => dest.trim())
      : [];

    // Extract items in the new format: Item <itemId> from <vendorId> (qty: <qty>)
    const items: { vendorId: string; itemId: string; quantity: number }[] = [];
    const itemRegex = /Item ([^ ]+) from ([^ ]+) \(qty: (\d+)\)/g;
    let match;
    while ((match = itemRegex.exec(truckLine)) !== null) {
      items.push({
        itemId: match[1],
        vendorId: match[2],
        quantity: parseInt(match[3])
      });
    }

    trucks.push({
      truckNumber: i + 1,
      destinations,
      items
    });
  }

  return trucks;
}

export default router; 