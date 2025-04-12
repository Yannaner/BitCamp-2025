import React, { useState, useEffect } from 'react';
import './App.css';
import { generateSimulationData } from './utils/simulation';
import { FlowVisualizer } from './components/FlowVisualizer';
import { DistrictFlow } from './types';  // Add this import

interface SimulationData {
  populationDensity: number[][];
  flowData: number[][];
  timeFaktors: {
    business: number;
    residential: number;
  };
  counts: { [key: string]: number };
  district_info?: { [key: number]: { district: string; type: string; bikes_available: number } };
  districtFlows: DistrictFlow[];  // Update this type
}

const getTimeOfDay = (hour: number) => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const getFlowEmoji = (flow: number) => {
  const abs = Math.abs(flow);
  if (abs > 0.7) return flow > 0 ? '🔼' : '🔽';
  if (abs > 0.3) return flow > 0 ? '⬆️' : '⬇️';
  return '•';
};

const getDistrictEmoji = (type: string) => {
  switch (type) {
    case 'business': return '🏢';
    case 'residential': return '🏘️';
    case 'mixed': return '🏙️';
    default: return '🚲';
  }
};

function App() {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    // Update simulation every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSimulationData(generateSimulationData());
    }, 1000); // Changed from 60000 to 1000

    // Initial simulation
    setSimulationData(generateSimulationData());

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚲 NYC Bike Share Simulation</h1>
        <div className="time-display">
          🕒 {currentTime.toLocaleTimeString()}
        </div>
      </header>
      <main>
        {!simulationData && <div className="loading">Loading simulation...</div>}
        {simulationData && (
          <>
            <div className="simulation-grid">
              {simulationData.populationDensity.map((row, i) => (
                <div key={i} className="grid-row">
                  {row.map((density, j) => {
                    const stationId = i * 4 + j;
                    const districtInfo = simulationData.district_info?.[stationId];
                    const flow = simulationData.flowData[i][j];
                    const timeOfDay = getTimeOfDay(currentTime.getHours());
                    
                    return (
                      <div
                        key={`${i}-${j}`}
                        className={`grid-cell 
                          district-${districtInfo?.district} 
                          ${timeOfDay}
                          ${flow > 0 ? 'flow-out' : 'flow-in'}`}
                      >
                        <div className="district-name">
                          {getDistrictEmoji(districtInfo?.type || 'mixed')} 
                          {districtInfo?.district.toUpperCase()}
                        </div>
                        <div className="station-label">Station {stationId + 1}</div>
                        <div className="bikes-available">
                          🚲 {districtInfo?.bikes_available || 0} bikes
                        </div>
                        <div className={`flow-indicator flow-${Math.abs(flow) > 0.5 ? 'high' : 'low'}`}>
                          {getFlowEmoji(flow)}
                          {Math.abs(flow) > 0.3 ? 
                            `${(Math.abs(flow) * 100).toFixed(0)}% ${flow > 0 ? 'out' : 'in'}` 
                            : 'Stable'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            
            <FlowVisualizer 
              flows={simulationData.districtFlows}
              timeOfDay={getTimeOfDay(currentTime.getHours())}
            />

            <div className="legend">
              <div className="legend-section">
                <h3>Districts</h3>
                <div className="legend-item">
                  <span>🏢 Business</span>
                  <span>🏘️ Residential</span>
                  <span>🏙️ Mixed</span>
                </div>
              </div>
              <div className="legend-section">
                <h3>Flow Patterns</h3>
                <div className="legend-item">
                  <span>🔼 High Outflow</span>
                  <span>🔽 High Inflow</span>
                  <span>• Stable</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
