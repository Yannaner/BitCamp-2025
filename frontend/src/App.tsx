import React, { useState, useEffect } from 'react';
import './App.css';
import { generateSimulationData } from './utils/simulation';

interface SimulationData {
  populationDensity: number[][];
  flowData: number[][];
  timeFaktors: {
    business: number;
    residential: number;
  };
  counts: { [key: string]: number };
}

function App() {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    // Update simulation every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSimulationData(generateSimulationData());
    }, 60000);

    // Initial simulation
    setSimulationData(generateSimulationData());

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Quantum Bike Rental Simulation</h1>
        <div className="time-display">
          Current Time: {currentTime.toLocaleTimeString()}
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
                    const flow = simulationData.flowData[i][j];
                    const isBusinessArea = density > 0.6;
                    return (
                      <div
                        key={`${i}-${j}`}
                        className={`grid-cell ${flow > 0 ? 'flow-out' : flow < 0 ? 'flow-in' : ''}`}
                        style={{
                          backgroundColor: `rgba(${isBusinessArea ? '0,128,255' : '255,128,0'}, ${density})`,
                        }}
                      >
                        <span className="station-label">Station {i*4 + j + 1}</span>
                        <span className="density-label">{(density * 100).toFixed(1)}%</span>
                        <span className="flow-indicator">
                          {Math.abs(flow) > 0.3 ? (flow > 0 ? '↑' : '↓') : '•'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="legend">
              <div className="legend-item">
                <div className="color-box business"></div>
                <span>Business District</span>
              </div>
              <div className="legend-item">
                <div className="color-box residential"></div>
                <span>Residential Area</span>
              </div>
              <div className="legend-item">
                <span>↑ High Outflow</span>
              </div>
              <div className="legend-item">
                <span>↓ High Inflow</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
