from qiskit import QuantumCircuit
from qiskit_aer import Aer
from qiskit.visualization import plot_histogram
import matplotlib.pyplot as plt
import numpy as np
import hashlib

# Classical to quantum encoder (ASCII angle encoding)
def text_to_qubits(text):
    circuit = QuantumCircuit(len(text), len(text))
    for i, char in enumerate(text):
        ascii_val = ord(char)
        theta = (ascii_val % 256) / 255 * np.pi  # Normalize to [0, π]
        circuit.ry(theta, i)  # Encode as rotation around Y-axis
    return circuit

# Quantum hash function (adds randomness and entanglement)
def quantum_hash_circuit(text):
    qc = text_to_qubits(text)
    # Add Hadamard and CNOT gates for randomness and entanglement
    for i in range(len(text)):
        qc.h(i)
        if i < len(text) - 1:
            qc.cx(i, i+1)
    qc.barrier()
    qc.measure(range(len(text)), range(len(text)))
    return qc

# Execute circuit and return hash-like result
def get_quantum_hash(text):
    qc = quantum_hash_circuit(text)
    backend = Aer.get_backend('qasm_simulator')
    job = backend.run(qc, shots=1)
    result = job.result().get_counts()
    return list(result.keys())[0]  # One measurement = one hash value

# Check for probabilistic collision over multiple hashes
def collision_test(text, trials=100):
    results = [get_quantum_hash(text) for _ in range(trials)]
    unique = len(set(results))
    return {
        "unique_hashes": unique,
        "collision_rate": 1 - unique / trials,
        "hashes": results
    }

# Visual test panel with explanation and classic hashes
def test_panel(input_text):
    print(f"Input: {input_text}\n")

    # Classical hashes
    sha256_hash = hashlib.sha256(input_text.encode()).hexdigest()
    sha3_hash = hashlib.sha3_256(input_text.encode()).hexdigest()
    print("Classical Hashes:")
    print(f"SHA-256      : {sha256_hash}")
    print(f"SHA3-256     : {sha3_hash}\n")

    # Single quantum hash
    hash_val = get_quantum_hash(input_text)
    print(f"Quantum Hash Output (1 shot): {hash_val}\n")

    # Collision test
    test_results = collision_test(input_text)
    print("Quantum Collision Test (100 runs):")
    print(f"- Unique Quantum Hashes : {test_results['unique_hashes']}")
    print(f"- Collision Rate         : {test_results['collision_rate']:.2f}\n")
    print("Hash Frequency Table:")

    values, counts = np.unique(test_results['hashes'], return_counts=True)
    histogram = dict(zip(values, counts))
    for val, count in histogram.items():
        print(f"{val} : {count} times")

    plot_histogram(histogram)
    plt.title("Quantum Hash Distribution (100 runs)")
    plt.show()

# Example usage
test_panel("QuantumCryptography123!")

