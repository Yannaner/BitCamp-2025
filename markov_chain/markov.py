import cirq
import numpy as np

# Define qubits
coin = cirq.LineQubit(0)        # 1 qubit for the coin
position = [cirq.LineQubit(1), cirq.LineQubit(2)]  # 2 qubits for position (3 stations)

# Create circuit
circuit = cirq.Circuit()

# Initialize position to station A (|00>)
circuit.append(cirq.ops.I(position[0]))
circuit.append(cirq.ops.I(position[1]))

# Apply Hadamard to create superposition in the coin
circuit.append(cirq.H(coin))

# Define coin-controlled shift
def shift_operator():
    # This will conditionally increment or decrement position
    ops = []

    # If coin is |0> (move left), decrement station (00 -> 10, 01 -> 00, 10 -> 01)
    ops += [
        cirq.CNOT(coin, position[1]),  # simple mock logic for decrement
    ]
    # If coin is |1> (move right), increment station
    ops += [
        cirq.X(coin),
        cirq.CNOT(coin, position[0]),
        cirq.X(coin)
    ]

    return ops

# Add shift operator
circuit.append(shift_operator())

# Measure
circuit.append(cirq.measure(coin, key='coin'))
circuit.append(cirq.measure(*position, key='position'))

# Simulate
simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions=100)

print(result.histogram(key='position'))
