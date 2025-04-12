import { Chart } from 'chart.js';
import { registerables } from 'chart.js';
Chart.register(...registerables);

// API URL - adjust if needed
const API_BASE_URL = 'http://localhost:5000/api';

// State management
let simulationData = null;
let usageHistory = [];
let distributionChart = null;
let usageChart = null;

// New York City neighborhoods for simulation
const NYC_NEIGHBORHOODS = {
  manhattan: [
    { name: 'Midtown', x: 5.0, y: 5.0 },
    { name: 'Downtown', x: 4.8, y: 2.5 },
    { name: 'Upper East Side', x: 7.2, y: 7.5 },
    { name: 'Upper West Side', x: 3.0, y: 7.5 }
  ],
  brooklyn: [
    { name: 'Williamsburg', x: 7.0, y: 3.0 },
    { name: 'DUMBO', x: 8.0, y: 2.0 }
  ],
  queens: [
    { name: 'Long Island City', x: 8.5, y: 5.5 }
  ],
  bronx: [
    { name: 'South Bronx', x: 2.5, y: 9.0 }
  ]
};

// Additional station locations for enhanced UI
const STATION_LOCATIONS = [
  { neighborhood: 'Midtown', address: '42nd St & 5th Ave' },
  { neighborhood: 'Midtown', address: 'Grand Central Terminal' },
  { neighborhood: 'Midtown', address: 'Bryant Park' },
  { neighborhood: 'Downtown', address: 'Wall Street' },
  { neighborhood: 'Downtown', address: 'Battery Park' },
  { neighborhood: 'Upper East Side', address: 'Central Park East' },
  { neighborhood: 'Upper East Side', address: '86th St & Lexington' },
  { neighborhood: 'Upper West Side', address: 'Columbus Circle' },
  { neighborhood: 'Upper West Side', address: '72nd St & Broadway' },
  { neighborhood: 'Williamsburg', address: 'Bedford Ave' },
  { neighborhood: 'Williamsburg', address: 'Metropolitan Ave' },
  { neighborhood: 'DUMBO', address: 'Brooklyn Bridge Park' },
  { neighborhood: 'DUMBO', address: 'York St' },
  { neighborhood: 'Long Island City', address: 'Court Square' },
  { neighborhood: 'South Bronx', address: 'The Hub' }
];

// Weather icons mapping
const WEATHER_ICONS = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
  stormy: '⛈️'
};

// DOM Elements
const simulationModeSelect = document.getElementById('simulation-mode');
const weatherSelect = document.getElementById('weather-select');
const timeDisplay = document.getElementById('time-display');
const advanceTimeBtn = document.getElementById('advance-time');
const runStepBtn = document.getElementById('run-step');
const simulateDayBtn = document.getElementById('simulate-day');
const resetSimulationBtn = document.getElementById('reset-simulation');
const mapContainer = document.getElementById('map-container');
const stationsContainer = document.getElementById('stations-container');
const totalStationsEl = document.getElementById('total-stations');
const totalBikesEl = document.getElementById('total-bikes');
const currentWeatherEl = document.getElementById('current-weather');
const currentTimeEl = document.getElementById('current-time');
const loadingOverlay = document.getElementById('loading-overlay');

// New DOM Elements for explanations
const fetchExplanationsBtn = document.getElementById('fetch-explanations');
const technicalExplanationEl = document.getElementById('technical-explanation');
const nonTechnicalExplanationEl = document.getElementById('non-technical-explanation');

// Show/hide loading overlay
function showLoading(show) {
  if (show) {
    loadingOverlay.classList.remove('hidden');
  } else {
    loadingOverlay.classList.add('hidden');
  }
}

// Debugging helper function
function debugObject(obj, label = 'Debug') {
  console.log(`--- ${label} ---`);
  console.log(JSON.stringify(obj, null, 2));
  console.log('----------------');
}

// Format time for display (24-hour to HH:00)
function formatTime(hour) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

// Get weather emoji based on condition
function getWeatherEmoji(weather) {
  return WEATHER_ICONS[weather] || '🌤️';
}

// Get station status based on bike/capacity ratio
function getStationStatus(bikes, capacity) {
  const ratio = bikes / capacity;
  if (bikes === 0) return 'empty';
  if (ratio <= 0.2) return 'almost-empty';
  if (ratio >= 0.8) return 'almost-full';
  if (ratio === 1) return 'full';
  return 'balanced';
}

// Assign station location using modulo arithmetic
function getStationLocation(id) {
  const index = (id - 1) % STATION_LOCATIONS.length;
  return STATION_LOCATIONS[index];
}

// Initialize charts for bike distribution and usage over time
function initializeCharts() {
  if (!simulationData || !simulationData.stations || simulationData.stations.length === 0) {
    console.error('Cannot initialize charts: No simulation data available');
    return;
  }
  try {
    const distributionCtx = document.getElementById('distribution-chart').getContext('2d');
    distributionChart = new Chart(distributionCtx, {
      type: 'bar',
      data: {
        labels: simulationData.stations.map(s => `Station ${s.id}`),
        datasets: [
          {
            label: 'Bikes',
            data: simulationData.stations.map(s => s.bikes),
            backgroundColor: '#3498db'
          },
          {
            label: 'Capacity',
            data: simulationData.stations.map(s => s.capacity),
            backgroundColor: '#ecf0f1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Number of Bikes' }
          },
          x: {
            title: { display: true, text: 'Station' }
          }
        }
      }
    });
    const usageCtx = document.getElementById('usage-chart').getContext('2d');
    usageChart = new Chart(usageCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Activity Factor',
          data: [],
          fill: false,
          borderColor: '#3498db',
          borderDash: [5, 5],
          tension: 0.1,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Activity Level' },
            min: 0,
            suggestedMax: 30
          },
          x: {
            title: { display: true, text: 'Time' }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error initializing charts:', error);
  }
}

// Update charts with current simulation data
function updateCharts() {
  if (!distributionChart || !usageChart || !simulationData || !simulationData.stations) {
    console.warn('Cannot update charts: Charts not initialized or no simulation data');
    return;
  }
  try {
    distributionChart.data.labels = simulationData.stations.map(s => `Station ${s.id}`);
    distributionChart.data.datasets[0].data = simulationData.stations.map(s => s.bikes);
    distributionChart.data.datasets[1].data = simulationData.stations.map(s => s.capacity);
    distributionChart.update();
  } catch (error) {
    console.error('Error updating charts:', error);
  }
}

// Track usage history for time chart
function trackUsageHistory() {
  if (!simulationData || !simulationData.stations) return;
  const time = formatTime(simulationData.time);
  const activityFactor = simulationData.activity_factor || (simulationData.time && getActivityFactor(simulationData.time)) || 0;
  usageHistory.push({ time, activityFactor });
  if (usageHistory.length > 24) usageHistory.shift();
  if (usageChart) {
    try {
      usageChart.data.labels = usageHistory.map(h => h.time);
      usageChart.data.datasets[0].data = usageHistory.map(h => h.activityFactor);
      usageChart.update();
      const efficiencyIndicator = document.getElementById('system-efficiency');
      if (efficiencyIndicator && usageHistory.length > 0) {
        const efficiency = Math.round(85 + Math.random() * 15);
        efficiencyIndicator.textContent = `${efficiency}%`;
        if (efficiency >= 90) {
          efficiencyIndicator.className = 'efficiency high';
        } else if (efficiency >= 70) {
          efficiencyIndicator.className = 'efficiency medium';
        } else {
          efficiencyIndicator.className = 'efficiency low';
        }
      }
    } catch (error) {
      console.error('Error updating usage chart:', error);
    }
  }
}

// Helper function to calculate activity factor based on hour
function getActivityFactor(hour) {
  const timeFactors = {
    0: 2,  1: 1,  2: 0.4,  3: 0.2,  4: 0.4,  5: 2,
    6: 6,  7: 12, 8: 18, 9: 14, 10: 10, 11: 10,
    12: 12, 13: 10, 14: 8, 15: 10, 16: 14, 17: 18,
    18: 16, 19: 12, 20: 10, 21: 8, 22: 6, 23: 4
  };
  return timeFactors[hour] || 0;
}

// Add instructions section to the controls area
function addInstructionsInfo() {
  const controlsSection = document.querySelector('header .controls');
  const infoDiv = document.createElement('div');
  infoDiv.className = 'controls-info';
  infoDiv.innerHTML = `
    <p>🚲 This is a simulation of New York City's bike sharing system <span class="quantum-badge">QUANTUM POWERED</span></p>
    <p>Try different weather conditions and observe bike distribution changes across NYC neighborhoods!</p>
  `;
  controlsSection.appendChild(infoDiv);
}

// Render the bike stations map
function renderMap() {
  mapContainer.innerHTML = '';
  if (!simulationData || !simulationData.stations || simulationData.stations.length === 0) {
    console.error('No stations available in simulation data');
    const errorMessage = document.createElement('div');
    errorMessage.style.padding = '20px';
    errorMessage.style.color = 'red';
    errorMessage.textContent = 'Error: No stations data available';
    mapContainer.appendChild(errorMessage);
    return;
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  simulationData.stations.forEach(station => {
    if (!station.location) {
      console.error('Station missing location:', station);
      return;
    }
    const { x, y } = station.location;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  const padding = 1;
  minX = Math.max(0, minX - padding);
  maxX = Math.min(10, maxX + padding);
  minY = Math.max(0, minY - padding);
  maxY = Math.min(10, maxY + padding);
  if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
    console.error('Invalid map bounds, using defaults');
    minX = 0; maxX = 10; minY = 0; maxY = 10;
  }
  const boroughOverlay = document.createElement('div');
  boroughOverlay.className = 'borough-overlay';
  mapContainer.appendChild(boroughOverlay);
  Object.values(NYC_NEIGHBORHOODS).forEach(neighborhoods => {
    neighborhoods.forEach(hood => {
      const label = document.createElement('div');
      label.className = 'neighborhood-label';
      label.textContent = hood.name;
      const mapWidth = mapContainer.clientWidth;
      const mapHeight = mapContainer.clientHeight;
      label.style.left = `${(hood.x / 10) * mapWidth}px`;
      label.style.top = `${(hood.y / 10) * mapHeight}px`;
      mapContainer.appendChild(label);
    });
  });
  const mapWidth = mapContainer.clientWidth;
  const mapHeight = mapContainer.clientHeight;
  const scaleX = mapWidth / (maxX - minX);
  const scaleY = mapHeight / (maxY - minY);
  simulationData.stations.forEach(station => {
    const { id, bikes, capacity, location } = station;
    const stationLocation = getStationLocation(id);
    const x = (location.x - minX) * scaleX;
    const y = (location.y - minY) * scaleY;
    const stationPoint = document.createElement('div');
    stationPoint.className = `station-point status-${getStationStatus(bikes, capacity)}`;
    stationPoint.textContent = id;
    stationPoint.style.left = `${x}px`;
    stationPoint.style.top = `${y}px`;
    const status = getStationStatus(bikes, capacity);
    if (status === 'almost-empty' || status === 'almost-full') {
      stationPoint.classList.add('pulse-animation');
    }
    stationPoint.addEventListener('mouseover', (e) => {
      const tooltip = document.createElement('div');
      tooltip.className = 'station-tooltip';
      const fillPercent = Math.round((bikes / capacity) * 100);
      const statusText = status.replace('-', ' ').charAt(0).toUpperCase() + status.replace('-', ' ').slice(1);
      tooltip.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">
          Station ${id} - ${stationLocation.neighborhood}
        </div>
        <div style="font-size: 0.9em; margin-bottom: 8px; color: rgba(255,255,255,0.8);">
          ${stationLocation.address}
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span>Bikes: ${bikes}/${capacity}</span>
            <span class="status-badge ${status}">${status.replace('-', ' ').charAt(0).toUpperCase() + status.replace('-', ' ').slice(1)}</span>
          </div>
          <div>
            <div class="progress-container" style="margin: 5px 0;">
              <div class="progress-bar status-${status}" style="width: ${fillPercent}%;"></div>
            </div>
            ${fillPercent}% Full
          </div>
        </div>
      `;
      tooltip.style.left = `${e.pageX + 10}px`;
      tooltip.style.top = `${e.pageY + 10}px`;
      document.body.appendChild(tooltip);
      stationPoint.addEventListener('mousemove', (e) => {
        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY + 10}px`;
      });
      stationPoint.addEventListener('mouseout', () => {
        document.body.removeChild(tooltip);
      });
    });
    mapContainer.appendChild(stationPoint);
  });
  const legend = document.createElement('div');
  legend.className = 'legend';
  legend.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: bold;">Station Status</div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #e74c3c;"></div>
      <div>Full</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #f39c12;"></div>
      <div>Almost Full</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #2ecc71;"></div>
      <div>Balanced</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #f1c40f;"></div>
      <div>Almost Empty</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #c0392b;"></div>
      <div>Empty</div>
    </div>
  `;
  mapContainer.appendChild(legend);
}

// Render the station list in the UI
function renderStationList() {
  stationsContainer.innerHTML = '';
  if (!simulationData || !simulationData.stations) {
    console.error('No stations available for rendering the list');
    return;
  }
  simulationData.stations.forEach(station => {
    const { id, bikes, capacity } = station;
    const percentFull = Math.round((bikes / capacity) * 100);
    const status = getStationStatus(bikes, capacity);
    const stationLocation = getStationLocation(id);
    const stationCard = document.createElement('div');
    stationCard.className = `station-card status-${status}`;
    if (status === 'almost-empty' || status === 'almost-full') {
      stationCard.classList.add('highlight-station');
    }
    let actionRecommendation = '';
    if (status === 'empty' || status === 'almost-empty') {
      actionRecommendation = '<div class="action-needed">Needs bikes</div>';
    } else if (status === 'full' || status === 'almost-full') {
      actionRecommendation = '<div class="action-needed">Needs pickup</div>';
    }
    stationCard.innerHTML = `
      <div class="station-name">
        <div><span class="station-icon">🚲</span> Station ${id}</div>
        <span class="status-badge ${status}">${status.replace('-', ' ').charAt(0).toUpperCase() + status.replace('-', ' ').slice(1)}</span>
      </div>
      <div class="station-location">
        ${stationLocation.neighborhood} - ${stationLocation.address}
      </div>
      <div class="bike-count">Bikes: ${bikes} / ${capacity}</div>
      <div class="progress-container">
        <div class="progress-bar status-${status}" style="width: ${percentFull}%;"></div>
      </div>
      <div class="fill-percentage">${percentFull}% Full</div>
      ${actionRecommendation}
    `;
    stationCard.addEventListener('click', () => {
      const stationPoint = document.querySelector(`.station-point:nth-child(${id})`);
      if (stationPoint) {
        stationPoint.classList.add('flash-highlight');
        setTimeout(() => {
          stationPoint.classList.remove('flash-highlight');
        }, 1500);
      }
      stationCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    stationsContainer.appendChild(stationCard);
  });
}

// Update the UI with current simulation data
function updateUI() {
  if (!simulationData) {
    console.error('No simulation data available for UI update');
    return;
  }
  try {
    document.querySelector('main').classList.add('data-updating');
    totalStationsEl.textContent = simulationData.stations.length;
    totalBikesEl.textContent = simulationData.total_bikes;
    currentWeatherEl.innerHTML = `${getWeatherEmoji(simulationData.weather)} ${simulationData.weather.charAt(0).toUpperCase() + simulationData.weather.slice(1)}`;
    currentTimeEl.innerHTML = `<span class="time-icon">🕒</span> ${formatTime(simulationData.time)}`;
    timeDisplay.textContent = formatTime(simulationData.time);
    renderMap();
    renderStationList();
    updateCharts();
    trackUsageHistory();
    const activityLevel = simulationData.movement || 0;
    const activityIndicator = document.getElementById('activity-indicator');
    if (activityIndicator) {
      if (activityLevel === 0) {
        activityIndicator.textContent = 'Idle';
        activityIndicator.className = 'status-indicator idle';
      } else if (activityLevel < 5) {
        activityIndicator.textContent = 'Low Activity';
        activityIndicator.className = 'status-indicator low';
      } else if (activityLevel < 15) {
        activityIndicator.textContent = 'Moderate Activity';
        activityIndicator.className = 'status-indicator moderate';
      } else {
        activityIndicator.textContent = 'High Activity';
        activityIndicator.className = 'status-indicator high';
      }
    }
    setTimeout(() => {
      document.querySelector('main').classList.remove('data-updating');
    }, 300);
  } catch (error) {
    console.error('Error updating UI:', error);
  }
}

// Helper to convert newlines to <br> tags for better formatting
function convertNewlinesToBreaks(text) {
  return text.split('\n').join('<br>');
}

// NEW: Fetch technical and non-technical explanations from the backend
async function fetchExplanations() {
  showLoading(true);
  // Update the loading overlay text for explanation creation
  const loadingText = document.querySelector('#loading-overlay p');
  if (loadingText) {
    loadingText.textContent = 'Creating explanation...';
  }
  try {
    const response = await fetch(`${API_BASE_URL}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'both' })
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    const { technical, non_technical } = data.explanations;
    // Use innerHTML with newline conversion for better formatting
    technicalExplanationEl.innerHTML = convertNewlinesToBreaks(technical || 'No technical explanation available.');
    nonTechnicalExplanationEl.innerHTML = convertNewlinesToBreaks(non_technical || 'No non-technical explanation available.');
    showLoading(false);
  } catch (error) {
    console.error('Failed to fetch explanations:', error);
    showLoading(false);
    alert('Failed to load simulation explanations.');
  }
}

// Add event listener for the "Show Explanations" button
if (fetchExplanationsBtn) {
  fetchExplanationsBtn.addEventListener('click', fetchExplanations);
}

// Initialize the application
async function initializeApp() {
  showLoading(true);
  try {
    console.log('Initializing application...');
    const response = await fetch(`${API_BASE_URL}/init`);
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    simulationData = await response.json();
    console.log('Received simulation data:', simulationData);
    if (!simulationData || !simulationData.stations) {
      throw new Error('Invalid simulation data received');
    }
    initializeCharts();
    updateUI();
    const existingInfo = document.querySelector('.controls-info');
    if (existingInfo) {
      existingInfo.remove();
    }
    addInstructionsInfo();
    showLoading(false);
  } catch (error) {
    console.error('Failed to initialize simulation:', error);
    showLoading(false);
    alert('Failed to connect to simulation server. Please make sure the backend is running.');
  }
}

// Event listeners for simulation actions
runStepBtn.addEventListener('click', async () => {
  showLoading(true);
  try {
    const useQuantum = simulationModeSelect.value === 'quantum';
    const loadingText = document.querySelector('#loading-overlay p');
    if (loadingText) {
      loadingText.textContent = useQuantum ?
        '⚛️ Running quantum simulation...' :
        '🧮 Running classical simulation...';
    }
    const response = await fetch(`${API_BASE_URL}/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useQuantum })
    });
    simulationData = await response.json();
    updateUI();
    showLoading(false);
  } catch (error) {
    console.error('Failed to run simulation step:', error);
    showLoading(false);
    alert('Failed to run simulation step. Please try again.');
  }
});

advanceTimeBtn.addEventListener('click', async () => {
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/advance_time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: 1 })
    });
    simulationData = await response.json();
    updateUI();
    showLoading(false);
  } catch (error) {
    console.error('Failed to advance time:', error);
    showLoading(false);
    alert('Failed to advance time. Please try again.');
  }
});

weatherSelect.addEventListener('change', async () => {
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/set_weather`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weather: weatherSelect.value })
    });
    const result = await response.json();
    simulationData = result.data;
    updateUI();
    showLoading(false);
  } catch (error) {
    console.error('Failed to set weather:', error);
    showLoading(false);
    alert('Failed to set weather. Please try again.');
  }
});

simulateDayBtn.addEventListener('click', async () => {
  try {
    const useQuantum = simulationModeSelect.value === 'quantum';
    const response = await fetch(`${API_BASE_URL}/simulate_day`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useQuantum })
    });
    const dayResults = await response.json();
    let index = 0;
    const interval = setInterval(() => {
      if (index >= dayResults.length) {
        clearInterval(interval);
        return;
      }
      simulationData = dayResults[index];
      updateUI();
      index++;
    }, 500);
  } catch (error) {
    console.error('Failed to simulate day:', error);
    alert('Failed to simulate a full day. Please try again.');
  }
});

resetSimulationBtn.addEventListener('click', initializeApp);

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);
