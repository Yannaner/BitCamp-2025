import os
from google import genai
from google.genai import types  # Import types for configuration
from google.genai.types import HttpOptions
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Retrieve the API key from the environment variables
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found in environment variables")

# Generation configuration using the documented types.GenerateContentConfig
GENERATION_CONFIG = types.GenerateContentConfig(
    temperature=0.7,
    top_p=1,
    top_k=32,
    max_output_tokens=1024
)

def generate_technical_prompt(simulation_state):
    """Generate a technical explanation prompt for the simulation."""
    num_stations = len(simulation_state.get('stations', []))
    total_bikes = simulation_state.get('total_bikes', 0)
    current_time = simulation_state.get('time', 0)
    weather = simulation_state.get('weather', 'unknown')
    
    return f"""
    Analyze bike-sharing data with {num_stations} stations, {total_bikes} bikes, at {current_time}:00 during {weather} conditions.
    
    Provide technical analysis:
    1. Quantify distribution balance using statistics (mean={10.5}, variance={35.08}, σ={5.92}, CV={0.56})
    2. Identify under/overstocked stations and contributing factors
    3. Explain quantum random walk advantages over classical algorithms
    4. Extract actionable insights from current trends
    
    Use precise technical language with quantum computing concepts.
    """

def generate_non_technical_prompt(simulation_state):
    """Generate a non-technical explanation prompt for the simulation."""
    num_stations = len(simulation_state.get('stations', []))
    total_bikes = simulation_state.get('total_bikes', 0)
    current_time = simulation_state.get('time', 0)
    weather = simulation_state.get('weather', 'unknown')
    
    return f"""
    Explain NYC's bike-sharing system with {num_stations} stations, {total_bikes} bikes, at {current_time}:00 during {weather} weather.
    
    In simple, conversational language:
    1. Describe current system performance and balance
    2. Identify neighborhoods with bike shortages or surpluses
    3. Explain quantum prediction benefits using everyday analogies
    4. Suggest practical improvements for rider experience
    
    Keep explanation friendly, jargon-free, and relatable.
    """
import logging

# Create a logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create a file handler and a stream handler
file_handler = logging.FileHandler('explanation_generator.log')
stream_handler = logging.StreamHandler()

# Create a formatter and add it to the handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)

# Add the handlers to the logger
logger.addHandler(file_handler)
logger.addHandler(stream_handler)

def generate_technical_prompt(simulation_state):
    """Generate a technical explanation prompt for the simulation."""
    num_stations = len(simulation_state.get('stations', []))
    total_bikes = simulation_state.get('total_bikes', 0)
    current_time = simulation_state.get('time', 0)
    weather = simulation_state.get('weather', 'unknown')
    
    # Calculate statistics
    station_bikes = [s.get('bikes', 0) for s in simulation_state.get('stations', [])]
    variance = sum((b - sum(station_bikes)/len(station_bikes))**2 for b in station_bikes) / len(station_bikes) if station_bikes else 0
    std_dev = variance**0.5 if variance > 0 else 0
    cv = std_dev / (sum(station_bikes)/len(station_bikes)) if sum(station_bikes) > 0 else 0
    
    print("Technical Simulation State", simulation_state)
    
    return f"""
    Analyze NYC bike-sharing data with {num_stations} stations, {total_bikes} bikes, at {current_time}:00 during {weather} conditions.
    
    Current statistics: mean bikes per station: {sum(station_bikes)/len(station_bikes):.1f}, variance: {variance:.2f}, standard deviation: {std_dev:.2f}, CV: {cv:.2f}
    
    Provide a clear technical analysis that:
    1. Evaluates the current distribution balance using statistical measures
    2. Identifies stations with potential supply issues
    3. Explains quantum random walk advantages over classical algorithms
    4. Suggests optimization strategies based on current patterns
    
    Keep your explanation concise, well-structured, and focused on quantitative insights without asterisks, stars or other formatting symbols.
    """

def generate_non_technical_prompt(simulation_state):
    """Generate a non-technical explanation prompt for the simulation."""
    num_stations = len(simulation_state.get('stations', []))
    total_bikes = simulation_state.get('total_bikes', 0)
    current_time = simulation_state.get('time', 0)
    weather = simulation_state.get('weather', 'unknown')
    
    print("Non Technical Simulation State", simulation_state)
    
    return f"""
    Explain NYC's bike-sharing system with {num_stations} stations, {total_bikes} bikes, at {current_time}:00 during {weather} weather.
    
    In simple, conversational language:
    1. How well is the system currently performing?
    2. Which neighborhoods might have bike shortages or surpluses?
    3. How does quantum prediction help improve the system?
    4. What practical improvements would make the rider experience better?
    
    Write your explanation in a friendly, accessible style without any special formatting characters (no asterisks, stars or numbered lists). Use everyday examples that make the concepts easy to understand.
    """


def get_explanation(prompt_type, simulation_state):
    """
    Get an explanation from Gemini based on the prompt type and simulation state.
    
    Args:
        prompt_type: Either 'technical' or 'non-technical'
        simulation_state: Current state of the simulation
        
    Returns:
        A string containing the explanation, or an error message if generation fails.
    """
    logger.info('Getting explanation')
    try:
        # Create a client instance, passing in the API key and HTTP options
        client = genai.Client(api_key=api_key, http_options=HttpOptions(api_version="v1"))
        
        # Generate the appropriate prompt based on the type
        if prompt_type == 'technical':
            prompt = generate_technical_prompt(simulation_state)
        else:  # non-technical
            prompt = generate_non_technical_prompt(simulation_state)
        
        # Generate the content using the updated API with contents as a list
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt],
            config=GENERATION_CONFIG
        )
        
        # Return the generated text response
        logger.info('Explanation generated successfully')
        return response.text
        
    except Exception as e:
        logger.error(f'Error generating {prompt_type} explanation: {str(e)}')
        return f"Error generating {prompt_type} explanation: {str(e)}"

def get_all_explanations(explanation_type, simulation_state):
    """
    Get all requested explanations based on the explanation type.
    
    Args:
        explanation_type: 'technical', 'non-technical', or 'both'
        simulation_state: Current state of the simulation
        
    Returns:
        A dictionary containing the requested explanations.
    """
    logger.info('Getting all explanations')
    explanations = {}
    
    if explanation_type in ['technical', 'both']:
        explanations['technical'] = get_explanation('technical', simulation_state)
        
    if explanation_type in ['non-technical', 'both']:
        explanations['non_technical'] = get_explanation('non-technical', simulation_state)
    
    logger.info('All explanations generated successfully')
    return explanations

def get_explanation(prompt_type, simulation_state):
    """
    Get an explanation from Gemini based on the prompt type and simulation state.
    
    Args:
        prompt_type: Either 'technical' or 'non-technical'
        simulation_state: Current state of the simulation
        
    Returns:
        A string containing the explanation, or an error message if generation fails.
    """
    print("STEP 2")
    try:
        # Create a client instance, passing in the API key and HTTP options
        client = genai.Client(api_key=api_key, http_options=HttpOptions(api_version="v1"))
        
        # Generate the appropriate prompt based on the type
        if prompt_type == 'technical':
            prompt = generate_technical_prompt(simulation_state)
        else:  # non-technical
            prompt = generate_non_technical_prompt(simulation_state)
        
        # Generate the content using the updated API with contents as a list
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt],
            config=GENERATION_CONFIG
        )
        
        # Return the generated text response
        return response.text
        
    except Exception as e:
        error_message = f"Error generating {prompt_type} explanation: {str(e)}"
        print(error_message)
        return error_message

def get_all_explanations(explanation_type, simulation_state):
    """
    Get all requested explanations based on the explanation type.
    
    Args:
        explanation_type: 'technical', 'non-technical', or 'both'
        simulation_state: Current state of the simulation
        
    Returns:
        A dictionary containing the requested explanations.
    """
    explanations = {}
    print("STEP 1")
    
    if explanation_type in ['technical', 'both']:
        explanations['technical'] = get_explanation('technical', simulation_state)
        
    if explanation_type in ['non-technical', 'both']:
        explanations['non_technical'] = get_explanation('non-technical', simulation_state)
    
    return explanations

