import numpy as np
import cirq
import matplotlib.pyplot as plt
from typing import List, Dict, Tuple
import json
import matplotlib.cm as cm
from matplotlib.patches import FancyArrowPatch

class BikeRentalSimulation:
    """
    A quantum-enhanced Markov Chain simulation for bike rental systems.
    Uses Cirq for quantum operations to enhance the simulation capabilities.
    """
    
    def __init__(self, num_stations: int, num_bikes: int):
        """
        Initialize the bike rental simulation.
        
        Args:
            num_stations: Number of bike stations
            num_bikes: Total number of bikes in the system
        """
        self.num_stations = num_stations
        self.num_bikes = num_bikes
        self.transition_matrix = None
        self.current_distribution = None
        self.station_capacities = None
        self.station_locations = None
        self.time_of_day_factors = None
        self.weather_factors = None
        self.current_weather = "sunny"
        self.current_time = 8  # 8 AM
        
    def initialize_system(self):
        """Initialize the system with default parameters."""
        # Set station capacities (maximum number of bikes each station can hold)
        self.station_capacities = np.random.randint(5, 20, size=self.num_stations)
        
        # Initialize station locations (x, y coordinates) with 1-based indexing
        # Creating a more map-like distribution of stations
        self.station_locations = {}
        city_centers = [(2.5, 2.5), (7.5, 7.5), (2.5, 7.5), (7.5, 2.5)]
        
        for i in range(self.num_stations):
            # Choose a city center to cluster around
            center = city_centers[i % len(city_centers)]
            # Add some randomness around the center
            x = center[0] + np.random.normal(0, 1.0)
            y = center[1] + np.random.normal(0, 1.0)
            # Keep within map boundaries
            x = max(0, min(10, x))
            y = max(0, min(10, y))
            # Store with 1-based index
            self.station_locations[i + 1] = (x, y)
        
        # Initialize bikes distribution across stations
        remaining_bikes = self.num_bikes
        self.current_distribution = np.zeros(self.num_stations, dtype=int)
        
        for i in range(self.num_stations - 1):
            max_bikes = min(remaining_bikes, self.station_capacities[i])
            if max_bikes > 0:
                bikes_at_station = np.random.randint(0, max_bikes + 1)
                self.current_distribution[i] = bikes_at_station
                remaining_bikes -= bikes_at_station
        
        # Put remaining bikes in the last station
        self.current_distribution[-1] = min(remaining_bikes, self.station_capacities[-1])
        
        # Time of day factors (how likely users are to rent/return bikes based on time)
        # 24 hours, with factors representing demand
        self.time_of_day_factors = {
            0: 0.1, 1: 0.05, 2: 0.02, 3: 0.01, 4: 0.02, 5: 0.1,
            6: 0.3, 7: 0.6, 8: 0.9, 9: 0.7, 10: 0.5, 11: 0.5,
            12: 0.6, 13: 0.5, 14: 0.4, 15: 0.5, 16: 0.7, 17: 0.9,
            18: 0.8, 19: 0.6, 20: 0.5, 21: 0.4, 22: 0.3, 23: 0.2
        }
        
        # Weather factors
        self.weather_factors = {
            "sunny": 1.2,
            "cloudy": 1.0,
            "rainy": 0.6,
            "snowy": 0.3,
            "stormy": 0.2
        }
        
        # Create initial transition matrix based on distances
        self._create_transition_matrix()
    
    def _create_transition_matrix(self):
        """Create the Markov transition matrix based on station distances and other factors."""
        # Initialize matrix
        self.transition_matrix = np.zeros((self.num_stations, self.num_stations))
        
        # Calculate distances between stations
        distances = np.zeros((self.num_stations, self.num_stations))
        
        for i in range(self.num_stations):
            for j in range(self.num_stations):
                if i != j:
                    # Euclidean distance
                    x1, y1 = self.station_locations[i+1]  # 1-based indexing
                    x2, y2 = self.station_locations[j+1]  # 1-based indexing
                    distances[i, j] = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        
        # Convert distances to transition probabilities (closer = more likely)
        for i in range(self.num_stations):
            for j in range(self.num_stations):
                if i != j:
                    # Inverse of distance (farther stations are less likely)
                    self.transition_matrix[i, j] = 1.0 / (distances[i, j] + 0.1)
            
            # Normalize each row to sum to 1
            if np.sum(self.transition_matrix[i]) > 0:
                self.transition_matrix[i] /= np.sum(self.transition_matrix[i])
    
    def apply_time_and_weather_factors(self):
        """Apply time of day and weather factors to the transition matrix."""
        time_factor = self.time_of_day_factors[self.current_time]
        weather_factor = self.weather_factors[self.current_weather]
        
        # Scale the transition probabilities based on time and weather
        # We don't modify the diagonal elements (probability of staying)
        for i in range(self.num_stations):
            for j in range(self.num_stations):
                if i != j:
                    self.transition_matrix[i, j] *= time_factor * weather_factor
            
            # Recalculate probability of staying to ensure row sums to 1
            self.transition_matrix[i, i] = 1 - sum(self.transition_matrix[i, j] for j in range(self.num_stations) if j != i)
    
    def run_classical_step(self):
        """Run one step of the classical Markov chain simulation."""
        # Calculate how many bikes will move from each station
        moves = np.zeros((self.num_stations, self.num_stations), dtype=int)
        
        for i in range(self.num_stations):
            available_bikes = self.current_distribution[i]
            if available_bikes > 0:
                # Determine how many bikes will leave this station
                departing_bikes = np.random.binomial(available_bikes, 
                                                    self.time_of_day_factors[self.current_time] * 
                                                    self.weather_factors[self.current_weather] * 0.3)
                
                if departing_bikes > 0:
                    # Distribute departing bikes according to transition probabilities
                    destination_probs = self.transition_matrix[i]
                    destinations = np.random.choice(self.num_stations, 
                                                  size=departing_bikes, 
                                                  p=destination_probs)
                    
                    # Count moves to each destination
                    for dest in destinations:
                        moves[i, dest] += 1
        
        # Apply the moves
        new_distribution = self.current_distribution.copy()
        
        for i in range(self.num_stations):
            # Subtract departing bikes
            departing = sum(moves[i, :])
            new_distribution[i] -= departing
            
            # Add arriving bikes, limited by station capacity
            for j in range(self.num_stations):
                arriving = moves[j, i]
                # Limit by remaining capacity
                actual_arriving = min(arriving, self.station_capacities[i] - new_distribution[i])
                new_distribution[i] += actual_arriving
                
                # If there's overflow (station full), redistribute
                overflow = arriving - actual_arriving
                if overflow > 0:
                    # Find nearest stations with capacity
                    for k in np.argsort([self._distance(i, s) for s in range(self.num_stations)]):
                        if k != i and new_distribution[k] < self.station_capacities[k]:
                            space_available = self.station_capacities[k] - new_distribution[k]
                            bikes_to_add = min(overflow, space_available)
                            new_distribution[k] += bikes_to_add
                            overflow -= bikes_to_add
                            
                            if overflow == 0:
                                break
        
        self.current_distribution = new_distribution
        return self.current_distribution
    
    def _distance(self, station1, station2):
        """Calculate distance between two stations."""
        # Convert from 0-based to 1-based indexing
        x1, y1 = self.station_locations[station1+1]
        x2, y2 = self.station_locations[station2+1]
        return np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    
    def run_quantum_step(self):
        """
        Run a quantum-enhanced simulation step using Cirq.
        This uses quantum random walks to model bike movement patterns.
        """
        # Number of qubits needed to represent all stations
        num_qubits = int(np.ceil(np.log2(self.num_stations)))
        
        # Create qubits
        qubits = [cirq.GridQubit(0, i) for i in range(num_qubits)]
        
        # Track new distribution
        new_distribution = self.current_distribution.copy()
        
        # For each station with bikes, simulate quantum movement
        for source_station in range(self.num_stations):
            if self.current_distribution[source_station] == 0:
                continue
                
            # Determine how many bikes may leave based on time and weather
            potential_departures = np.random.binomial(
                self.current_distribution[source_station],
                self.time_of_day_factors[self.current_time] * 
                self.weather_factors[self.current_weather] * 0.3
            )
            
            if potential_departures == 0:
                continue
                
            # For each potentially departing bike, use quantum circuit
            for _ in range(potential_departures):
                # Create quantum circuit
                circuit = cirq.Circuit()
                
                # Start with superposition
                circuit.append(cirq.H.on_each(*qubits))
                
                # Apply station preference operations
                # More popular destinations get rotation gates to increase probability
                for i in range(self.num_stations):
                    if i == source_station:
                        continue
                        
                    # Convert transition probability to rotation angle
                    angle = self.transition_matrix[source_station, i] * np.pi
                    
                    # Get binary representation of destination
                    bin_dest = format(i, f'0{num_qubits}b')
                    
                    # Apply controlled rotations based on binary representation
                    for j, bit in enumerate(bin_dest):
                        if bit == '1':
                            circuit.append(cirq.ry(angle).on(qubits[j]))
                
                # Measure
                circuit.append(cirq.measure(*qubits, key='result'))
                
                # Simulate
                simulator = cirq.Simulator()
                result = simulator.run(circuit, repetitions=1)
                
                # Get measurement result
                measurement = result.measurements['result'][0]
                destination = int(''.join(str(bit) for bit in measurement), 2) % self.num_stations
                
                # If destination is valid and not the same as source, move a bike
                if destination != source_station and new_distribution[destination] < self.station_capacities[destination]:
                    new_distribution[source_station] -= 1
                    new_distribution[destination] += 1
        
        self.current_distribution = new_distribution
        return self.current_distribution
    
    def advance_time(self, hours=1):
        """Advance the simulation time by the specified number of hours."""
        for _ in range(hours):
            self.current_time = (self.current_time + 1) % 24
            self.apply_time_and_weather_factors()
    
    def set_weather(self, weather):
        """Set the current weather condition."""
        if weather in self.weather_factors:
            self.current_weather = weather
            self.apply_time_and_weather_factors()
            return True
        return False
    
    def get_station_info(self):
        """Get information about all stations for visualization."""
        return {
            "stations": [
                {
                    "id": i+1,  # 1-based indexing
                    "bikes": int(self.current_distribution[i]),
                    "capacity": int(self.station_capacities[i]),
                    "location": {"x": float(self.station_locations[i+1][0]), "y": float(self.station_locations[i+1][1])}
                }
                for i in range(self.num_stations)
            ],
            "time": self.current_time,
            "weather": self.current_weather,
            "total_bikes": int(np.sum(self.current_distribution))
        }
    
    def visualize_system(self, ax=None, show_flows=True):
        """Visualize the bike stations on a map with optional flow indicators."""
        if ax is None:
            fig, ax = plt.subplots(figsize=(12, 10))
        else:
            fig = ax.figure
        
        # Plot the map background
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 10)
        ax.grid(True, linestyle='--', alpha=0.7)
        ax.set_title(f'Bike Rental System State at {self.current_time}:00 - Weather: {self.current_weather}')
        ax.set_xlabel('X coordinate')
        ax.set_ylabel('Y coordinate')
        
        # Normalize station bike counts for coloring
        max_capacity = max(self.station_capacities)
        
        # Plot stations
        for i in range(self.num_stations):
            station_id = i + 1  # 1-based ID
            x, y = self.station_locations[station_id]
            bikes = self.current_distribution[i]
            capacity = self.station_capacities[i]
            
            # Color based on fullness (red = empty, green = full)
            fill_ratio = bikes / capacity if capacity > 0 else 0
            color = cm.RdYlGn(fill_ratio)
            
            # Size based on capacity
            size = 100 + (capacity / max_capacity) * 300
            
            # Plot the station
            ax.scatter(x, y, s=size, color=color, alpha=0.7, edgecolors='black', zorder=5)
            
            # Add station label
            ax.text(x, y, f"{station_id}", fontsize=10, ha='center', va='center', fontweight='bold', zorder=10)
            
            # Add bike count label
            ax.text(x, y-0.3, f"{bikes}/{capacity}", fontsize=8, ha='center', va='center', zorder=10)
        
        # Plot flow arrows if requested
        if show_flows and self.transition_matrix is not None:
            # Scale arrow opacity by transition probability
            max_prob = self.transition_matrix.max() if self.transition_matrix.size > 0 else 1
            threshold = max_prob * 0.15  # Only show significant flows
            
            for i in range(self.num_stations):
                if self.current_distribution[i] == 0:
                    continue  # No bikes to move from empty stations
                    
                start_x, start_y = self.station_locations[i+1]
                
                for j in range(self.num_stations):
                    if i != j and self.transition_matrix[i, j] > threshold:
                        end_x, end_y = self.station_locations[j+1]
                        
                        # Create curved arrows
                        prob = self.transition_matrix[i, j]
                        opacity = min(1.0, prob / max_prob + 0.1)
                        width = 1 + prob * 5
                        
                        # Calculate midpoint with offset to curve the arrow
                        dx = end_x - start_x
                        dy = end_y - start_y
                        dist = np.sqrt(dx**2 + dy**2)
                        
                        # More curved arrows for distant stations
                        curve_factor = min(0.5, dist/10)
                        mid_x = (start_x + end_x) / 2 - dy * curve_factor
                        mid_y = (start_y + end_y) / 2 + dx * curve_factor
                        
                        # Define curved path
                        arrow = FancyArrowPatch(
                            (start_x, start_y),
                            (end_x, end_y),
                            connectionstyle=f"arc3,rad={curve_factor}",
                            arrowstyle='-|>',
                            alpha=opacity,
                            lw=width,
                            color='blue',
                            zorder=2
                        )
                        ax.add_patch(arrow)
        
        plt.tight_layout()
        return fig, ax
    
    def simulate_and_visualize_step(self, use_quantum=True):
        """Simulate one step and visualize the result."""
        if use_quantum:
            self.run_quantum_step()
        else:
            self.run_classical_step()
            
        fig, ax = plt.subplots(figsize=(12, 10))
        self.visualize_system(ax)
        return fig

    def simulate_day(self, use_quantum=True):
        """Simulate a full day (24 hours) and return the results."""
        results = []
        original_time = self.current_time
        
        for _ in range(24):
            if use_quantum:
                self.run_quantum_step()
            else:
                self.run_classical_step()
            
            results.append(self.get_station_info())
            self.advance_time()
        
        # Reset time to original
        self.current_time = original_time
        return results
    
    def export_simulation_data(self):
        """Export the current simulation state as JSON for the frontend."""
        return json.dumps(self.get_station_info())

# For testing
if __name__ == "__main__":
    simulation = BikeRentalSimulation(num_stations=10, num_bikes=100)
    simulation.initialize_system()
    print("Initial distribution:", simulation.current_distribution)
    
    # Visualize initial state
    fig, ax = plt.subplots(figsize=(12, 10))
    simulation.visualize_system(ax)
    plt.savefig("initial_state.png")
    
    # Run a quantum step
    simulation.run_quantum_step()
    print("After quantum step:", simulation.current_distribution)
    
    # Visualize after quantum step
    fig, ax = plt.subplots(figsize=(12, 10))
    simulation.visualize_system(ax)
    plt.savefig("after_quantum_step.png")
    
    # Export data for frontend
    print(simulation.export_simulation_data())
