import { SimulationData } from '../types';

const NYC_DISTRICTS = {
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

export function generateSimulationData(): SimulationData {
  const gridSize = 4;
  const density = Array(gridSize).fill(0).map(() => 
    Array(gridSize).fill(0).map(() => Math.random() * 0.5 + 0.3)
  );
  
  // Apply district-specific densities
  Object.values(NYC_DISTRICTS).forEach(district => {
    const [min, max] = district.density_range;
    district.stations.forEach(([x, y]) => {
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

  return {
    populationDensity: density,
    flowData,
    timeFaktors: {
      business: currentHour >= 9 && currentHour <= 17 ? 0.8 : 0.3,
      residential: currentHour >= 18 || currentHour <= 7 ? 0.7 : 0.4,
      mixed: 0.5
    },
    counts: {}
  };
}
