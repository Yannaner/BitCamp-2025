import { SimulationData } from '../types';

interface DistrictData {
  density_range: [number, number];
  type: 'business' | 'residential' | 'mixed';
  stations: [number, number][];
}

interface Districts {
  manhattan: DistrictData;
  brooklyn: DistrictData;
  queens: DistrictData;
}

const NYC_DISTRICTS: Districts = {
  manhattan: {
    density_range: [0.7, 0.9],
    type: 'business',
    stations: [[0,0], [0,1], [1,0], [1,1]]
  },
  brooklyn: {
    density_range: [0.5, 0.7],
    type: 'mixed',
    stations: [[2,0], [2,1], [3,0]]
  },
  queens: {
    density_range: [0.4, 0.6],
    type: 'residential',
    stations: [[0,2], [0,3], [1,2]]
  }
};

function getInitialBikes(district: keyof Districts | 'other'): number {
  switch (district) {
    case 'manhattan':
      return Math.floor(Math.random() * 10) + 25; // 25-35 bikes
    case 'brooklyn':
    case 'queens':
      return Math.floor(Math.random() * 10) + 15; // 15-25 bikes
    default:
      return Math.floor(Math.random() * 10) + 10; // 10-20 bikes
  }
}

interface DistrictFlow {
  from: string;
  to: string;
  amount: number;
  bikes: number;
}

/**
 * Flow Visualization Guide:
 * 
 * Morning Rush Hour (7-9 AM):
 * Residential → Business
 * Queens -----→ Manhattan
 *    ↘         ↗
 *      Brooklyn
 * 
 * Evening Rush Hour (5-7 PM):
 * Business → Residential
 * Manhattan -----→ Queens
 *    ↘         ↗
 *      Brooklyn
 * 
 * Normal Hours:
 * Mixed flows between all districts with lower intensity
 * 
 * Flow Intensity:
 * - High: > 0.7 (🔼/🔽)
 * - Medium: 0.3-0.7 (⬆️/⬇️)
 * - Low: < 0.3 (•)
 */

/**
 * Quantum Bike Flow Simulation Logic:
 * 
 * Each station is represented by 2 qubits:
 * - Qubit 1: Station occupancy (|0⟩ = low, |1⟩ = high)
 * - Qubit 2: Flow direction (|0⟩ = outflow, |1⟩ = inflow)
 * 
 * Quantum Circuit Representation:
 * 
 * Station A: |q0⟩ ─■─────────
 *              │
 * Flow A:  |q1⟩ ─┼──■────── (Measure)
 *                 │  │
 * Station B: |q2⟩ ─┼──┼──■── 
 *                 │  │  │
 * Flow B:   |q3⟩ ─■──■──■── (Measure)
 * 
 * Flow States:
 * |00⟩ - Low occupancy, outflow
 * |01⟩ - Low occupancy, inflow
 * |10⟩ - High occupancy, outflow
 * |11⟩ - High occupancy, inflow
 * 
 * Time-Dependent Flow Patterns:
 * Morning (7-9 AM):
 *   Residential → Business
 *   |ψ₁⟩ = √0.7|10⟩ + √0.3|01⟩  (70% outflow from residential)
 *   |ψ₂⟩ = √0.8|01⟩ + √0.2|10⟩  (80% inflow to business)
 * 
 *   Queens (R) ----→ Manhattan (B)
 *        ↓70%         ↑80%
 *     Brooklyn (M)
 * 
 * Evening (5-7 PM):
 *   Business → Residential
 *   |ψ₁⟩ = √0.8|10⟩ + √0.2|01⟩  (80% outflow from business)
 *   |ψ₂⟩ = √0.7|01⟩ + √0.3|10⟩  (70% inflow to residential)
 * 
 *   Manhattan (B) ----→ Queens (R)
 *        ↓80%         ↑70%
 *     Brooklyn (M)
 * 
 * Superposition States:
 * During transition periods, stations can be in superposition
 * of inflow/outflow states, representing uncertainty in flow
 * direction until measured.
 */

/**
 * Flow Intensity Matrix:
 * [From/To]   Business  Mixed     Residential
 * Business    [-]       [0.5→]    [0.8→]
 * Mixed       [0.6→]    [-]       [0.4→]
 * Residential [0.7→]    [0.5→]    [-]
 * 
 * Arrow thickness represents flow strength:
 * →  : Low flow (0.1-0.3)
 * ⟹  : Medium flow (0.4-0.6)
 * ⟹⟹ : High flow (0.7-1.0)
 */

function calculateDistrictFlows(density: number[][], timeOfDay: string): DistrictFlow[] {
  const flows: DistrictFlow[] = [];
  const districts = Object.keys(NYC_DISTRICTS);

  const getFlowDirection = (from: string, to: string, timeOfDay: string): number => {
    if (timeOfDay === 'morning') {
      // Strong flow from residential to business areas
      if (from === 'residential' && to === 'business') return 2.0;
      if (from === 'residential' && to === 'mixed') return 1.5;
      if (from === 'mixed' && to === 'business') return 1.5;
    } else if (timeOfDay === 'evening') {
      // Strong flow from business to residential areas
      if (from === 'business' && to === 'residential') return 2.0;
      if (from === 'business' && to === 'mixed') return 1.5;
      if (from === 'mixed' && to === 'residential') return 1.5;
    }
    return 1.0; // Normal flow
  };

  districts.forEach(from => {
    districts.forEach(to => {
      if (from !== to) {
        const fromStations = NYC_DISTRICTS[from as keyof Districts].stations;
        const toStations = NYC_DISTRICTS[to as keyof Districts].stations;

        // Calculate flow based on station proximity
        let flowAmount = 0;
        fromStations.forEach(([fx, fy]) => {
          toStations.forEach(([tx, ty]) => {
            const distance = Math.sqrt(Math.pow(fx - tx, 2) + Math.pow(fy - ty, 2));
            flowAmount += 1 / (1 + distance);
          });
        });

        // Adjust flow based on time of day
        const flowDirection = getFlowDirection(
          NYC_DISTRICTS[from as keyof Districts].type,
          NYC_DISTRICTS[to as keyof Districts].type,
          timeOfDay
        );
        flowAmount *= flowDirection;

        flows.push({
          from,
          to,
          amount: flowAmount,
          bikes: Math.floor(flowAmount * 5)
        });
      }
    });
  });

  return flows;
}

// Add more detailed time periods for better flow simulation
function getTimeOfDay(currentHour: number): string {
  if (currentHour >= 7 && currentHour <= 9) return 'morning';
  if (currentHour >= 9 && currentHour <= 16) return 'midday';
  if (currentHour >= 17 && currentHour <= 19) return 'evening';
  if (currentHour >= 20 || currentHour <= 6) return 'night';
  return 'normal';
}

export function generateSimulationData(): SimulationData {
  const gridSize = 4;
  const density = Array(gridSize).fill(0).map(() => 
    Array(gridSize).fill(0).map(() => Math.random() * 0.5 + 0.3)
  );
  
  // Apply district-specific densities
  Object.values(NYC_DISTRICTS).forEach(district => {
    const [min, max] = district.density_range;
    district.stations.forEach(([x, y]: [number, number]) => {
      density[x][y] = Math.random() * (max - min) + min;
    });
  });

  const currentHour = new Date().getHours();
  const flowData = density.map(row => 
    row.map(d => {
      // Morning rush hour
      if (currentHour >= 7 && currentHour <= 9) {
        return d * (Math.random() - 0.7);
      }
      // Evening rush hour
      if (currentHour >= 17 && currentHour <= 19) {
        return d * (Math.random() - 0.3);
      }
      // Normal hours
      return d * (Math.random() - 0.5);
    })
  );

  const district_info: { [key: number]: any } = {};
  density.forEach((row, i) => {
    row.forEach((d, j) => {
      const station_id = i * 4 + j;
      const district = Object.entries(NYC_DISTRICTS).find(([_, data]) => 
        data.stations.some(([x, y]: [number, number]) => x === i && y === j)
      )?.[0] as keyof Districts | undefined;
      
      district_info[station_id] = {
        type: district ? NYC_DISTRICTS[district].type : 'mixed',
        bikes_available: getInitialBikes(district || 'other'),
        district: district || 'other'
      };
    });
  });

  const timeOfDay = getTimeOfDay(currentHour);
  const districtFlows = calculateDistrictFlows(density, timeOfDay);

  return {
    populationDensity: density,
    flowData,
    timeFaktors: {
      business: currentHour >= 9 && currentHour <= 17 ? 0.8 : 0.3,
      residential: currentHour >= 18 || currentHour <= 7 ? 0.7 : 0.4,
      mixed: 0.5
    },
    counts: {},
    district_info,
    districtFlows,
    timeOfDay
  };
}
