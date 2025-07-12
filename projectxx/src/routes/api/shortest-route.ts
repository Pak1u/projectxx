import { Router, Request, Response } from 'express';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

interface MatrixInput {
  n: number;
  matrix: number[][];
}

interface RouteResult {
  minimumCost: number;
  tour: number[];
  success: boolean;
  error?: string;
}

// POST /api/shortest-route
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { n, matrix }: MatrixInput = req.body;
    
    if (!n || !matrix || n <= 0 || matrix.length !== n) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid matrix input' 
      });
      return;
    }

    console.log(`🚀 Running route algorithm for ${n} nodes...`);

    // Create input file for the C++ program
    const inputFile = path.join(__dirname, '../../../routealgo_input.txt');
    let inputContent = `${n}\n`;
    
    // Write matrix in the format expected by routealgo.cpp
    for (let i = 0; i < n; ++i) {
      for (let j = i + 1; j < n; ++j) {
        inputContent += `${matrix[i][j]} `;
      }
      inputContent += '\n';
    }

    writeFileSync(inputFile, inputContent);
    console.log(`📝 Input file created: ${inputFile}`);

    // Run the C++ executable
    const executablePath = path.join(__dirname, './routealgo.exe');
    
    // Check if the executable exists
    if (!existsSync(executablePath)) {
      console.error(`❌ C++ executable not found at: ${executablePath}`);
      console.error(`🔍 Current directory: ${__dirname}`);
      console.error(`📁 Files in current directory:`, require('fs').readdirSync(__dirname));
      res.status(500).json({ 
        success: false,
        minimumCost: 0,
        tour: [],
        error: `C++ executable not found at: ${executablePath}`
      });
      return;
    }
    
    console.log(`✅ C++ executable found at: ${executablePath}`);
    
    const cppProcess = spawn(executablePath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.dirname(executablePath)
    });

    // Send input to the C++ program
    cppProcess.stdin.write(inputContent);
    cppProcess.stdin.end();

    let output = '';
    let errorOutput = '';

    cppProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    cppProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Wait for the process to complete
    const result = await new Promise<RouteResult>((resolve) => {
      cppProcess.on('close', (code) => {
        console.log(`🔚 C++ process exited with code ${code}`);
        
        if (code !== 0) {
          resolve({
            success: false,
            minimumCost: 0,
            tour: [],
            error: `C++ program failed with exit code ${code}. Error: ${errorOutput}`
          });
          return;
        }

        try {
          // Parse the output
          const lines = output.trim().split('\n');
          console.log('📋 C++ Output:', output);

          // Find the tour line (contains node sequence)
          let tourLine = '';
          let costLine = '';
          
          for (const line of lines) {
            if (line.includes('Approximate tour visiting all nodes:')) {
              // Next line contains the tour
              const tourIndex = lines.indexOf(line) + 1;
              if (tourIndex < lines.length) {
                tourLine = lines[tourIndex];
              }
            } else if (line.includes('Total cost:')) {
              costLine = line;
            }
          }

          if (!tourLine || !costLine) {
            resolve({
              success: false,
              minimumCost: 0,
              tour: [],
              error: 'Could not parse C++ output'
            });
            return;
          }

          // Parse tour (space-separated numbers)
          const tour = tourLine.trim().split(' ').map(num => parseInt(num)).filter(num => !isNaN(num));
          
          // Parse cost (extract number after "Total cost: ")
          const costMatch = costLine.match(/Total cost:\s*([\d.]+)/);
          const minimumCost = costMatch ? parseFloat(costMatch[1]) : 0;

          console.log(`✅ Parsed result: Cost=${minimumCost}, Tour=${tour.join(' -> ')}`);

          resolve({
            success: true,
            minimumCost,
            tour
          });

        } catch (parseError) {
          resolve({
            success: false,
            minimumCost: 0,
            tour: [],
            error: `Failed to parse output: ${parseError}`
          });
        }
      });
    });

    // Clean up input file
    try {
      unlinkSync(inputFile);
      console.log('🗑️ Input file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up input file:', cleanupError);
    }

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (err: any) {
    console.error('❌ Error in shortest-route API:', err);
    res.status(500).json({ 
      success: false,
      minimumCost: 0,
      tour: [],
      error: err.message || 'Unknown error'
    });
  }
});

export default router; 