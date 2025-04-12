import React from 'react';
import './FlowVisualizer.css';
import { DistrictFlow } from '../types';

interface FlowVisualizerProps {
  flows: DistrictFlow[];
  timeOfDay: string;
}

export const FlowVisualizer: React.FC<FlowVisualizerProps> = ({ flows, timeOfDay }) => {
  return (
    <div className="flow-visualizer">
      <div className="flow-grid">
        <div className="manhattan district">Manhattan
          <div className="quantum-state">
            {timeOfDay === 'morning' ? '|ψ⟩ = √0.8|01⟩ + √0.2|10⟩' : 
             timeOfDay === 'evening' ? '|ψ⟩ = √0.8|10⟩ + √0.2|01⟩' : 
             '|ψ⟩ = |balanced⟩'}
          </div>
        </div>
        <div className="brooklyn district">Brooklyn
          <div className="quantum-state">
            {timeOfDay === 'morning' ? '|ψ⟩ = √0.5|01⟩ + √0.5|10⟩' : 
             timeOfDay === 'evening' ? '|ψ⟩ = √0.5|01⟩ + √0.5|10⟩' : 
             '|ψ⟩ = |balanced⟩'}
          </div>
        </div>
        <div className="queens district">Queens
          <div className="quantum-state">
            {timeOfDay === 'morning' ? '|ψ⟩ = √0.7|10⟩ + √0.3|01⟩' : 
             timeOfDay === 'evening' ? '|ψ⟩ = √0.7|01⟩ + √0.3|10⟩' : 
             '|ψ⟩ = |balanced⟩'}
          </div>
        </div>
        
        {flows.map((flow, i) => (
          <div key={i} className="flow-arrow">
            <div className={`arrow ${flow.amount > 0.7 ? 'high' : flow.amount > 0.3 ? 'medium' : 'low'}`}>
              <div className="arrow-label">
                {flow.bikes} bikes/hour
                <br />
                {(flow.amount * 100).toFixed(0)}% capacity
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flow-explanation">
        <h4>Current Flow Pattern: {timeOfDay}</h4>
        <div className="quantum-explanation">
          <p><strong>Morning Rush (7-9 AM):</strong></p>
          <ul>
            <li>Residential areas (Queens) collapse to |10⟩ (high outflow)</li>
            <li>Business areas (Manhattan) collapse to |01⟩ (high inflow)</li>
            <li>Mixed areas (Brooklyn) remain in superposition</li>
          </ul>
          
          <p><strong>Evening Rush (5-7 PM):</strong></p>
          <ul>
            <li>Business areas collapse to |10⟩ (high outflow)</li>
            <li>Residential areas collapse to |01⟩ (high inflow)</li>
            <li>Mixed areas facilitate balanced flow distribution</li>
          </ul>

          <p><strong>Flow Quantum States:</strong></p>
          <ul>
            <li>|00⟩: Low occupancy, outflow</li>
            <li>|01⟩: Low occupancy, inflow</li>
            <li>|10⟩: High occupancy, outflow</li>
            <li>|11⟩: High occupancy, inflow</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
