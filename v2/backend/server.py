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
    
    if use_quantum:
        simulation.run_quantum_step()
    else:
        simulation.run_classical_step()
        
    return simulation.get_station_info()

@app.route('/api/advance_time', methods=['POST'])
def advance_time():
    data = request.get_json()
    hours = data.get('hours', 1)
    simulation.advance_time(hours)
    return simulation.get_station_info()

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
    results = simulation.simulate_day(use_quantum)
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
