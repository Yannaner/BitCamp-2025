## Inspiration
Urban bike-sharing systems are a sustainable, healthy alternative to cars—but in busy cities like NYC, they’re often frustratingly unreliable. You arrive at a station only to find no bikes… or ride to your destination and can't dock because it’s full.
We asked ourselves: Can we predict and fix this chaos before it happens? That question led us to combine newly learned quantum computing concepts and urban systems modeling to tackle a real-world mobility problem.

## What it does
Qubikel is a quantum-powered simulation tool designed to predict bike-sharing station behavior across NYC. It models how bikes move between stations based on population density and inferred commuting patterns.

With Markov Chains enhanced by Quantum Walks, Qubikel can:

i) Forecast station depletion and overflow
ii) Suggest bike rebalancing strategies with GenAI
iii) Simulate new infrastructure scenarios
iv) Monitor overall bike traffic

## How we built it
We developed Qubikel using a stack that combines quantum simulation with modern web technologies:
![image](https://github.com/user-attachments/assets/e44f7a58-03f6-4cea-9ad3-aa9cf4d4ab72)

In the backend, we used Python and Flask for the server alongside implementing quantum random walks using Google's Cirq framework for quantum computing. We have Implemented both classical Markov Chain models and quantum-enhanced versions to compare effectiveness. 

In the frontend, we created interactive dashboard with react & vite for data visualization, and responsive design. 

We also added the power of Google Gemini to explain complex quantum simulation results to users with varying technical backgrounds. 

The simulation engine processes geographic data, weather conditions, and time-of-day factors to create realistic transition matrices that govern bike movement patterns. We implemented quantum random walks that leverage superposition to model the complex, non-deterministic nature of urban bike movement.

## Challenges we ran into
This project represented our first dive into quantum computing and working with Cirq, which presented a steep learning curve. Despite having strong software engineering backgrounds, translating classical algorithms into quantum equivalents required a fundamental shift in thinking about computation.  As newcomers to quantum computing, understanding concepts like superposition, quantum gates, and circuit design in Cirq required extensive research and experimentation. Also, adapting classical Markov Chain methodologies to quantum random walks proved much more complex than anticipated.

## Accomplishments that we're proud of
Despite these challenges, we achieved several significant milestones:

i) Successfully implemented quantum algorithms despite being first-time users of quantum libraries

ii ) Created a working quantum-enhanced simulation that outperforms classical methods in prediction accuracy

iii) Developed an intuitive, responsive interface that clearly visualizes complex system dynamics

## What we learned from the Bitcamp UQA workshops
This project taught us valuable lessons across multiple domains:

i ) Fundamentals of quantum computing and practical application through Cirq

ii) Methods for effectively comparing classical vs. quantum approaches to demonstrate quantum 
advantage

iii) Quantum and its future (next Nvdia engineer)

iv) Grover's Algorithm

## What's next for Qubikel
Our roadmap:

i) Connect with actual bike-sharing APIs to test our predictions against real-world usage patterns
ii) Implement more sophisticated quantum algorithms to further improve prediction accuracy
iii) Continue optimizing our quantum simulations for better scalability
iv) Combine our quantum approach with machine learning to identify hidden patterns in usage data

v) Rewatch Intersteller after having understanding of both quantum mechanics and relativity

![image](https://github.com/user-attachments/assets/711cb459-5061-4c2e-b0cf-424eef709a01)

