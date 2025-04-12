from qiskit import QuantumCircuit, Aer, execute
import numpy as np
from datetime import datetime, time
from .nyc_data import generate_nyc_population_density, NYC_DISTRICTS

class BikeRentalSimulation:
    def __init__(self, grid_size=4):
        self.grid_size = grid_size
        self.num_qubits = grid_size * grid_size
        self.population_density = generate_nyc_population_density(grid_size)
        self.time_patterns = self._initialize_time_patterns()
        self.flow_matrix = self._initialize_flow_matrix()
        self.bikes_per_station = self._initialize_bikes()
        
    def _initialize_bikes(self):
        bikes = np.zeros((self.grid_size, self.grid_size))
        # More bikes in denser areas
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                base_bikes = int(20 * self.population_density[i][j])
                bikes[i][j] = max(5, base_bikes)  # Minimum 5 bikes per station
        return bikes

    def _initialize_time_patterns(self):
        return {
            'business': {
                'morning_rush': (time(7), time(10), 0.9),    # High inflow
                'lunch_time': (time(11), time(14), 0.5),     # Moderate flow
                'evening_rush': (time(16), time(19), -0.9),  # High outflow
                'night_time': (time(22), time(5), 0.1)       # Low flow
            },
            'residential': {
                'morning_rush': (time(7), time(10), -0.8),   # High outflow
                'lunch_time': (time(11), time(14), 0.2),     # Low flow
                'evening_rush': (time(16), time(19), 0.8),   # High inflow
                'night_time': (time(22), time(5), -0.1)      # Low flow
            },
            'mixed': {
                'morning_rush': (time(7), time(10), 0.4),    # Moderate flow
                'lunch_time': (time(11), time(14), 0.6),     # Moderate flow
                'evening_rush': (time(16), time(19), 0.4),   # Moderate flow
                'night_time': (time(22), time(5), 0.1)       # Low flow
            }
        }

    def _initialize_flow_matrix(self):
        # Initialize bike flow probabilities between stations
        flow = np.zeros((self.grid_size * self.grid_size, self.grid_size * self.grid_size))
        for i in range(self.grid_size * self.grid_size):
            for j in range(self.grid_size * self.grid_size):
                if i != j:
                    # Distance-based probability
                    distance = np.sqrt(((i // self.grid_size) - (j // self.grid_size))**2 + 
                                    ((i % self.grid_size) - (j % self.grid_size))**2)
                    flow[i][j] = 1 / (1 + distance)
        return flow

    def _get_district_type(self, i, j):
        for district, data in NYC_DISTRICTS.items():
            if (i, j) in data['stations']:
                return data['type']
        return 'mixed'  # Default type

    def get_time_factor(self, current_time, location_type):
        # Get demand modifier based on time of day
        patterns = self.time_patterns[location_type]
        for period, (start, end, factor) in patterns.items():
            if start <= current_time <= end:
                return factor
        return 0.1  # Base factor for off-hours

    def simulate_flow(self, current_time):
        flow_results = np.zeros((self.grid_size, self.grid_size))
        
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                station_idx = i * self.grid_size + j
                location_type = self._get_district_type(i, j)
                time_factor = self.get_time_factor(current_time, location_type)
                
                # Calculate flow based on time and population density
                flow_results[i][j] = (self.population_density[i][j] * time_factor * 
                                    np.sum(self.flow_matrix[station_idx]))
        
        return flow_results

    def create_quantum_circuit(self, current_time):
        qc = QuantumCircuit(self.num_qubits * 2, self.num_qubits)  # Double qubits for flow representation
        
        # First register: Station occupancy
        # Second register: Flow direction
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                idx = i * self.grid_size + j
                # Station occupancy based on density and time
                location_type = self._get_district_type(i, j)
                time_factor = self.get_time_factor(current_time, location_type)
                combined_factor = self.population_density[i][j] * (1 + time_factor)
                
                # Apply rotation for station state
                qc.ry(combined_factor * np.pi, idx)
                # Apply rotation for flow direction
                qc.ry(time_factor * np.pi, idx + self.num_qubits)
                
                # Entangle station state with flow
                qc.cx(idx, idx + self.num_qubits)

        # Entangle adjacent stations
        for i in range(self.num_qubits - 1):
            qc.cx(i, i + 1)
            qc.cx(i + self.num_qubits, i + 1 + self.num_qubits)

        qc.measure(range(self.num_qubits), range(self.num_qubits))
        return qc

    def run_simulation(self, current_time=None, shots=1000):
        if current_time is None:
            current_time = datetime.now().time()
        
        qc = self.create_quantum_circuit(current_time)
        backend = Aer.get_backend('qasm_simulator')
        result = execute(qc, backend, shots=shots).result()
        counts = result.get_counts()
        
        flow_data = self.simulate_flow(current_time)
        
        # Add NYC-specific metadata to the response
        district_info = {}
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                station_id = i * self.grid_size + j
                district_info[station_id] = {
                    'type': self._get_district_type(i, j),
                    'bikes_available': int(self.bikes_per_station[i][j]),
                    'district': next((d for d, data in NYC_DISTRICTS.items() 
                                   if (i,j) in data['stations']), 'other')
                }

        return {
            'counts': counts,
            'population_density': self.population_density,
            'flow_data': flow_data,
            'district_info': district_info,
            'time_factors': {
                'business': self.get_time_factor(current_time, 'business'),
                'residential': self.get_time_factor(current_time, 'residential'),
                'mixed': self.get_time_factor(current_time, 'mixed')
            }
        }
