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
    print("Technical Simulation State")
    
    return f"""
    Given the simulation state with:
    - {num_stations} stations,
    - {total_bikes} bikes in total,
    - Current time: {current_time}:00,
    - Weather: {weather},
    
    Please analyze the numerical data and explain in technical detail:
    1. How the data indicates the current distribution balance or imbalance among stations.
    2. Which stations might be overfull or understocked, and why.
    3. How a quantum random walk algorithm helps in making predictions more accurate compared to a classical random walk.
    4. Any insights you can extract from the current numerical trends in the simulation state.
    Use precise language suitable for someone with a technical background.
    """

def generate_non_technical_prompt(simulation_state):
    """Generate a non-technical explanation prompt for the simulation."""
    num_stations = len(simulation_state.get('stations', []))
    total_bikes = simulation_state.get('total_bikes', 0)
    current_time = simulation_state.get('time', 0)
    weather = simulation_state.get('weather', 'unknown')
    print("Non Technical Simulation State")
    
    return f"""
    The current simulation state is:
    - {num_stations} stations,
    - {total_bikes} bikes available,
    - Time: {current_time}:00,
    - Weather: {weather}.
    
    Please provide an explanation in simple, easy-to-understand terms:
    1. What do these numbers tell us about the current performance of the bike sharing system?
    2. Are there any stations that might be running low or have too many bikes?
    3. How could this information be used to improve service and customer satisfaction?
    Use simple language and relevant analogies to clearly explain what the data is saying.
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

