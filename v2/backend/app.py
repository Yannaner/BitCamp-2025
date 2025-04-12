from flask import Flask, jsonify, request
from flask_cors import CORS
from quantum import BikeRentalSimulation
import json
from gemini_service import get_all_explanations

#APP.py

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the simulation
simulation = BikeRentalSimulation(num_stations=20, num_bikes=250)
simulation.initialize_system()

@app.route('/api/explain', methods=['POST'])
def explain_simulation():
    """Generate AI explanations of the simulation using Gemini API."""
    data = request.json
    explanation_type = data.get('type', 'both')  # 'technical', 'non-technical', or 'both'
    
    # Get current simulation state for context
    simulation_state = json.loads(simulation.export_simulation_data())
    
    try:
        # Get explanations from the Gemini service
        explanations = get_all_explanations(explanation_type, simulation_state)
        print("Simulation State:", simulation_state)
        
        return jsonify({
            'explanations': explanations,
            'simulation_state': simulation_state
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'explanations': {
                'technical': 'Error generating technical explanation.' if explanation_type in ['technical', 'both'] else '',
                'non_technical': 'Error generating non-technical explanation.' if explanation_type in ['non-technical', 'both'] else ''
            }
        }), 500

@app.route('/api/init', methods=['GET'])
def initialize_simulation():
    """Initialize or reset the simulation with default parameters."""
    global simulation
    simulation = BikeRentalSimulation(num_stations=20, num_bikes=250)
    simulation.initialize_system()
    return jsonify(json.loads(simulation.export_simulation_data()))

@app.route('/api/config', methods=['POST'])
def configure_simulation():
    """Configure the simulation with custom parameters."""
    global simulation
    data = request.json
    
    num_stations = data.get('numStations', 20)
    num_bikes = data.get('numBikes', 250)
    
    simulation = BikeRentalSimulation(num_stations=num_stations, num_bikes=num_bikes)
    simulation.initialize_system()
    
    if 'weather' in data:
        simulation.set_weather(data['weather'])
    
    if 'time' in data:
        simulation.current_time = data['time'] % 24
        simulation.apply_time_and_weather_factors()
    
    return jsonify(json.loads(simulation.export_simulation_data()))

@app.route('/api/step', methods=['POST'])
def simulation_step():
    """Run a single simulation step."""
    data = request.json
    use_quantum = data.get('useQuantum', True)
    
    if use_quantum:
        simulation.run_quantum_step()
    else:
        simulation.run_classical_step()
    
    return jsonify(json.loads(simulation.export_simulation_data()))

@app.route('/api/advance_time', methods=['POST'])
def advance_time():
    """Advance the simulation time."""
    data = request.json
    hours = data.get('hours', 1)
    simulation.advance_time(hours)
    return jsonify(json.loads(simulation.export_simulation_data()))

@app.route('/api/set_weather', methods=['POST'])
def set_weather():
    """Set the current weather condition."""
    data = request.json
    weather = data.get('weather', 'sunny')
    success = simulation.set_weather(weather)
    return jsonify({
        'success': success,
        'data': json.loads(simulation.export_simulation_data())
    })

@app.route('/api/simulate_day', methods=['POST'])
def simulate_day():
    """Simulate a full day of bike rentals."""
    data = request.json
    use_quantum = data.get('useQuantum', True)
    results = simulation.simulate_day(use_quantum)
    return jsonify(results)

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get the current status of the simulation."""
    return jsonify(json.loads(simulation.export_simulation_data()))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
