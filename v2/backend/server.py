from flask import Flask, jsonify, request
from flask_cors import CORS
from quantum import BikeRentalSimulation
import json

app = Flask(__name__)
CORS(app)

# Initialize the simulation
simulation = BikeRentalSimulation(num_stations=10, num_bikes=100)
simulation.initialize_system()

@app.route('/api/init', methods=['GET'])
def initialize():
    global simulation
    simulation = BikeRentalSimulation(num_stations=10, num_bikes=100)
    simulation.initialize_system()
    return simulation.get_station_info()

@app.route('/api/step', methods=['POST'])
def step():
    data = request.get_json()
    use_quantum = data.get('useQuantum', True)
    
    # Store previous distribution to calculate movement
    previous_distribution = simulation.current_distribution.copy()
    
    if use_quantum:
        simulation.run_quantum_step()
    else:
        simulation.run_classical_step()
    
    # Calculate actual bike movements
    result = simulation.get_station_info()
    
    # Add movement data
    movement_count = 0
    for i in range(simulation.num_stations):
        movement_count += abs(int(simulation.current_distribution[i]) - int(previous_distribution[i]))
    
    # Each bike counts twice (once leaving, once arriving)
    result['movement'] = movement_count // 2
    
    return jsonify(result)

@app.route('/api/advance_time', methods=['POST'])
def advance_time():
    data = request.get_json()
    hours = data.get('hours', 1)
    
    # Store previous distribution
    previous_distribution = simulation.current_distribution.copy()
    
    simulation.advance_time(hours)
    
    # Get result with movement data
    result = simulation.get_station_info()
    
    # No movement occurs just from advancing time
    result['movement'] = 0
    
    return jsonify(result)

@app.route('/api/set_weather', methods=['POST'])
def set_weather():
    data = request.get_json()
    weather = data.get('weather')
    success = simulation.set_weather(weather)
    
    if success:
        return jsonify({
            "status": "success",
            "message": f"Weather set to {weather}",
            "data": simulation.get_station_info()
        })
    else:
        return jsonify({
            "status": "error",
            "message": f"Invalid weather: {weather}"
        }), 400

@app.route('/api/simulate_day', methods=['POST'])
def simulate_day():
    data = request.get_json()
    use_quantum = data.get('useQuantum', True)
    
    # Track movement data for better usage metrics
    results = []
    
    # Save original time
    original_time = simulation.current_time
    
    # Run simulation for 24 hours
    for hour in range(24):
        # Store previous distribution
        previous_distribution = simulation.current_distribution.copy()
        
        # Run simulation step
        if use_quantum:
            simulation.run_quantum_step()
        else:
            simulation.run_classical_step()
        
        # Get state with movement data
        result = simulation.get_station_info()
        
        # Calculate actual bike movements
        movement_count = 0
        for i in range(simulation.num_stations):
            movement_count += abs(int(simulation.current_distribution[i]) - int(previous_distribution[i]))
        
        # Each bike counts twice (once leaving, once arriving)
        result['movement'] = movement_count // 2
        
        # Add time-of-day factor to show expected activity levels
        result['activity_factor'] = simulation.time_of_day_factors[simulation.current_time] * 20
        
        results.append(result)
        simulation.advance_time(1)
    
    # Restore original time but keep final distribution
    simulation.current_time = original_time
    simulation.apply_time_and_weather_factors()
    
    return jsonify(results)

@app.route('/api/debug', methods=['GET'])
def debug_info():
    """Endpoint to help debug station placement issues"""
    debug_data = {
        "stations": [{
            "id": i+1,
            "location": {
                "x": float(simulation.station_locations[i+1][0]),
                "y": float(simulation.station_locations[i+1][1])
            },
            "bikes": int(simulation.current_distribution[i]),
            "capacity": int(simulation.station_capacities[i])
        } for i in range(simulation.num_stations)],
        "map_dimensions": "10x10",
        "station_locations_raw": {str(k): [float(v[0]), float(v[1])] for k, v in simulation.station_locations.items()}
    }
    return jsonify(debug_data)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
