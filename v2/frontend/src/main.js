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

// Initialize the application
async function initializeApp() {
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/init`);
    simulationData = await response.json();
    updateUI();
    initializeCharts();
    showLoading(false);
  } catch (error) {
    console.error('Failed to initialize simulation:', error);
    showLoading(false);
    alert('Failed to connect to simulation server. Please make sure the backend is running.');
  }
}

// Format time for display (24-hour format to HH:MM)
function formatTime(hour) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

// Update the UI with current simulation data
function updateUI() {
  if (!simulationData) return;
  
  // Update stats
  totalStationsEl.textContent = simulationData.stations.length;
  totalBikesEl.textContent = simulationData.total_bikes;
  currentWeatherEl.textContent = simulationData.weather.charAt(0).toUpperCase() + simulationData.weather.slice(1);
  currentTimeEl.textContent = formatTime(simulationData.time);
  timeDisplay.textContent = formatTime(simulationData.time);
  
  // Update map
  renderMap();
  
  // Update station list
  renderStationList();
  
  // Update charts
  updateCharts();
  
  // Track history for usage chart
  trackUsageHistory();
}

// Render the bike stations map
function renderMap() {
  mapContainer.innerHTML = '';
  mapContainer.style.position = 'relative';
  
  // Find the bounds of the map
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  simulationData.stations.forEach(station => {
    const { x, y } = station.location;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  
  // Add some padding
  const padding = 1;
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;
  
  // Map width and height
  const mapWidth = mapContainer.clientWidth;
  const mapHeight = mapContainer.clientHeight;
  
  // Scale factor to convert coordinates to pixels
  const scaleX = mapWidth / (maxX - minX);
  const scaleY = mapHeight / (maxY - minY);
  
  // Render each station as a point
  simulationData.stations.forEach(station => {
    const { id, bikes, capacity, location } = station;
    
    // Calculate position
    const x = (location.x - minX) * scaleX;
    const y = (location.y - minY) * scaleY;
    
    // Create station point
    const stationPoint = document.createElement('div');
    stationPoint.className = 'station-point';
    stationPoint.textContent = id;
    stationPoint.style.left = `${x}px`;
    stationPoint.style.top = `${y}px`;
    
    // Calculate fill ratio for color
    const fillRatio = bikes / capacity;
    let color;
    
    if (fillRatio > 0.8) {
      color = '#e74c3c'; // Red for almost full
    } else if (fillRatio < 0.2) {
      color = '#f39c12'; // Orange for almost empty
    } else {
      color = '#2ecc71'; // Green for normal
    }
    
    stationPoint.style.backgroundColor = color;
    
    // Add tooltip on hover
    stationPoint.addEventListener('mouseover', (e) => {
      const tooltip = document.createElement('div');
      tooltip.className = 'station-tooltip';
      tooltip.innerHTML = `
        <div>Station ${id}</div>
        <div>Bikes: ${bikes}/${capacity}</div>
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
}

// Render the station list
function renderStationList() {
  stationsContainer.innerHTML = '';
  
  simulationData.stations.forEach(station => {
    const { id, bikes, capacity } = station;
    const percentFull = Math.round((bikes / capacity) * 100);
    
    const stationCard = document.createElement('div');
    stationCard.className = 'station-card';
    stationCard.innerHTML = `
      <div class="station-name">Station ${id}</div>
      <div>Bikes: ${bikes} / ${capacity}</div>
      <div class="progress-container">
        <div class="progress-bar" style="width: ${percentFull}%"></div>
      </div>
      <div>${percentFull}% Full</div>
    `;
    
    stationsContainer.appendChild(stationCard);
  });
}

// Initialize charts
function initializeCharts() {
  // Bike distribution chart
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
          title: {
            display: true,
            text: 'Number of Bikes'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Station'
          }
        }
      }
    }
  });
  
  // Usage over time chart
  const usageCtx = document.getElementById('usage-chart').getContext('2d');
  usageChart = new Chart(usageCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Bike Usage',
        data: [],
        fill: false,
        borderColor: '#2ecc71',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: {
            display: true,
            text: 'Bikes in Use'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time'
          }
        }
      }
    }
  });
}

// Update charts with new data
function updateCharts() {
  if (!distributionChart || !usageChart) return;
  
  // Update distribution chart
  distributionChart.data.labels = simulationData.stations.map(s => `Station ${s.id}`);
  distributionChart.data.datasets[0].data = simulationData.stations.map(s => s.bikes);
  distributionChart.data.datasets[1].data = simulationData.stations.map(s => s.capacity);
  distributionChart.update();
  
  // The usage chart is updated in trackUsageHistory()
}

// Track usage history for the time chart
function trackUsageHistory() {
  const time = formatTime(simulationData.time);
  const totalCapacity = simulationData.stations.reduce((sum, s) => sum + s.capacity, 0);
  const bikesInUse = totalCapacity - simulationData.total_bikes;
  
  // Add data to history
  usageHistory.push({
    time,
    bikesInUse
  });
  
  // Limit history to 24 hours
  if (usageHistory.length > 24) {
    usageHistory.shift();
  }
  
  // Update usage chart
  if (usageChart) {
    usageChart.data.labels = usageHistory.map(h => h.time);
    usageChart.data.datasets[0].data = usageHistory.map(h => h.bikesInUse);
    usageChart.update();
  }
}

// Show/hide loading overlay
function showLoading(show) {
  if (show) {
    loadingOverlay.classList.remove('hidden');
  } else {
    loadingOverlay.classList.add('hidden');
  }
}

// Event listeners
runStepBtn.addEventListener('click', async () => {
  showLoading(true);
  try {
    const useQuantum = simulationModeSelect.value === 'quantum';
    const response = await fetch(`${API_BASE_URL}/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
      headers: {
        'Content-Type': 'application/json'
      },
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
      headers: {
        'Content-Type': 'application/json'
      },
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
  showLoading(true);
  try {
    const useQuantum = simulationModeSelect.value === 'quantum';
    const response = await fetch(`${API_BASE_URL}/simulate_day`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ useQuantum })
    });
    const dayResults = await response.json();
    
    // Animate through the day results
    let index = 0;
    const interval = setInterval(() => {
      if (index >= dayResults.length) {
        clearInterval(interval);
        showLoading(false);
        return;
      }
      
      simulationData = dayResults[index];
      updateUI();
      index++;
    }, 500); // Update every 500ms
  } catch (error) {
    console.error('Failed to simulate day:', error);
    showLoading(false);
    alert('Failed to simulate a full day. Please try again.');
  }
});

resetSimulationBtn.addEventListener('click', initializeApp);

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);
