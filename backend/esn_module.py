"""
Echo State Network (ESN) Module for Optimus Echo Predictor
Uses ReservoirPy for real echo state network predictions
"""
import numpy as np
from reservoirpy.nodes import Reservoir, Ridge
import reservoirpy as rpy
import logging
from typing import List, Dict, Tuple, Optional
import pickle
import os
from pathlib import Path

# Suppress ReservoirPy verbose output
rpy.verbosity(0)

logger = logging.getLogger(__name__)

# Gesture type encoding
GESTURE_TYPES = ['stop', 'proceed', 'slow_down', 'handover', 'point', 'wave', 'emergency']
GESTURE_TO_IDX = {g: i for i, g in enumerate(GESTURE_TYPES)}
IDX_TO_GESTURE = {i: g for i, g in enumerate(GESTURE_TYPES)}

class EchoStatePredictor:
    """
    Echo State Network for predicting human-robot interaction risks.
    Uses reservoir computing to detect anomalies in gesture sequences.
    """
    
    def __init__(self, units: int = 100, lr: float = 0.3, sr: float = 0.9):
        """
        Initialize the Echo State Network.
        
        Args:
            units: Number of reservoir units
            lr: Leak rate (0-1), controls how fast the reservoir forgets
            sr: Spectral radius, controls reservoir dynamics stability
        """
        self.units = units
        self.lr = lr
        self.sr = sr
        self.reservoir = None
        self.readout = None
        self.is_trained = False
        self.model_path = Path(__file__).parent / "models" / "esn_model.pkl"
        
        self._initialize_network()
    
    def _initialize_network(self):
        """Initialize the reservoir and readout layers."""
        self.reservoir = Reservoir(
            units=self.units,
            lr=self.lr,
            sr=self.sr,
            input_scaling=0.5,
            seed=42
        )
        self.readout = Ridge(ridge=1e-5)
        
    def generate_training_data(self, n_sequences: int = 500, seq_length: int = 50) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generate synthetic training data for gesture sequences.
        Creates normal patterns and anomalous patterns for training.
        
        Returns:
            X: Input sequences (n_sequences, seq_length, n_features)
            y: Target labels (n_sequences, 1) - risk scores
        """
        np.random.seed(42)
        n_gestures = len(GESTURE_TYPES)
        
        X_list = []
        y_list = []
        
        for _ in range(n_sequences):
            # Generate sequence
            sequence = np.zeros((seq_length, n_gestures + 3))  # gesture + confidence + position (x,y)
            
            # Randomly decide if this is a normal or risky sequence
            is_risky = np.random.random() < 0.3
            
            for t in range(seq_length):
                # Select gesture type
                if is_risky:
                    # Risky: rapid changes, low confidence, erratic positions
                    gesture_idx = np.random.randint(0, n_gestures)
                    confidence = np.random.uniform(0.3, 0.7)  # Lower confidence
                    pos_x = np.random.uniform(-2, 2)
                    pos_y = np.random.uniform(0, 2) + np.random.normal(0, 0.5)  # Erratic
                else:
                    # Normal: smooth transitions, high confidence
                    if t == 0:
                        gesture_idx = np.random.randint(0, n_gestures)
                    else:
                        # Smooth transitions - same gesture or gradual change
                        if np.random.random() < 0.8:
                            gesture_idx = int(np.argmax(sequence[t-1, :n_gestures]))
                        else:
                            gesture_idx = np.random.randint(0, n_gestures)
                    
                    confidence = np.random.uniform(0.8, 0.99)
                    pos_x = np.sin(t / 10) * 1.5
                    pos_y = 1.0 + np.cos(t / 10) * 0.3
                
                # One-hot encode gesture
                sequence[t, gesture_idx] = 1.0
                sequence[t, n_gestures] = confidence
                sequence[t, n_gestures + 1] = pos_x
                sequence[t, n_gestures + 2] = pos_y
            
            X_list.append(sequence)
            
            # Calculate risk score based on sequence characteristics
            if is_risky:
                risk_score = np.random.uniform(0.6, 1.0)
            else:
                risk_score = np.random.uniform(0.0, 0.4)
            
            y_list.append([risk_score])
        
        return np.array(X_list), np.array(y_list)
    
    def train(self, X: Optional[np.ndarray] = None, y: Optional[np.ndarray] = None):
        """
        Train the ESN on gesture sequence data.
        
        Args:
            X: Training sequences. If None, generates synthetic data.
            y: Target risk scores. If None, generates synthetic data.
        """
        if X is None or y is None:
            logger.info("Generating synthetic training data...")
            X, y = self.generate_training_data(n_sequences=500, seq_length=50)
        
        logger.info(f"Training ESN on {len(X)} sequences...")
        
        # Process each sequence through reservoir
        states_list = []
        for seq in X:
            # Run sequence through reservoir, get final state
            states = self.reservoir.run(seq)
            # Use mean of states as representation
            states_list.append(np.mean(states, axis=0))
        
        states = np.array(states_list)
        
        # Train readout layer
        self.readout.fit(states, y.reshape(-1, 1))
        self.is_trained = True
        
        # Save model
        self._save_model()
        logger.info("ESN training complete!")
    
    def predict_risk(self, sequence: np.ndarray) -> Dict:
        """
        Predict risk score for a gesture sequence.
        
        Args:
            sequence: Gesture sequence (seq_length, n_features)
            
        Returns:
            Dict with risk_score, anomaly_indices, and details
        """
        if not self.is_trained:
            self._load_or_train()
        
        # Run through reservoir
        states = self.reservoir.run(sequence)
        mean_state = np.mean(states, axis=0).reshape(1, -1)
        
        # Get prediction
        risk_score = float(self.readout.run(mean_state)[0, 0])
        risk_score = np.clip(risk_score, 0.0, 1.0)
        
        # Analyze sequence for specific anomalies
        anomalies = self._detect_anomalies(sequence, states)
        
        return {
            "risk_score": risk_score,
            "anomalies": anomalies,
            "reservoir_activation": float(np.mean(np.abs(states))),
            "state_variance": float(np.var(states))
        }
    
    def _detect_anomalies(self, sequence: np.ndarray, states: np.ndarray) -> List[Dict]:
        """Detect specific anomalies in the sequence."""
        anomalies = []
        n_gestures = len(GESTURE_TYPES)
        
        # Check for rapid gesture changes
        gesture_changes = 0
        for t in range(1, len(sequence)):
            prev_gesture = np.argmax(sequence[t-1, :n_gestures])
            curr_gesture = np.argmax(sequence[t, :n_gestures])
            if prev_gesture != curr_gesture:
                gesture_changes += 1
        
        change_rate = gesture_changes / (len(sequence) - 1)
        if change_rate > 0.5:
            anomalies.append({
                "type": "rapid_gesture_changes",
                "severity": min(change_rate, 1.0),
                "description": f"High gesture change rate: {change_rate:.2%}"
            })
        
        # Check for low confidence periods
        confidences = sequence[:, n_gestures]
        low_conf_periods = np.sum(confidences < 0.7) / len(confidences)
        if low_conf_periods > 0.3:
            anomalies.append({
                "type": "low_confidence",
                "severity": low_conf_periods,
                "description": f"Low confidence in {low_conf_periods:.1%} of sequence"
            })
        
        # Check for erratic positioning
        positions = sequence[:, n_gestures+1:n_gestures+3]
        pos_variance = np.var(positions)
        if pos_variance > 1.0:
            anomalies.append({
                "type": "erratic_movement",
                "severity": min(pos_variance / 2, 1.0),
                "description": f"High position variance: {pos_variance:.2f}"
            })
        
        # Check reservoir state anomalies (high activation = unusual pattern)
        state_activation = np.mean(np.abs(states))
        if state_activation > 0.5:
            anomalies.append({
                "type": "unusual_pattern",
                "severity": min(state_activation, 1.0),
                "description": f"Unusual gesture pattern detected (activation: {state_activation:.2f})"
            })
        
        return anomalies
    
    def _save_model(self):
        """Save trained model to disk."""
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        model_data = {
            "reservoir_state": self.reservoir,
            "readout_state": self.readout,
            "is_trained": self.is_trained
        }
        with open(self.model_path, 'wb') as f:
            pickle.dump(model_data, f)
        logger.info(f"Model saved to {self.model_path}")
    
    def _load_or_train(self):
        """Load model from disk or train new one."""
        if self.model_path.exists():
            try:
                with open(self.model_path, 'rb') as f:
                    model_data = pickle.load(f)
                self.reservoir = model_data["reservoir_state"]
                self.readout = model_data["readout_state"]
                self.is_trained = model_data["is_trained"]
                logger.info("Loaded pre-trained ESN model")
                return
            except Exception as e:
                logger.warning(f"Failed to load model: {e}")
        
        # Train new model
        self.train()


def gestures_to_sequence(gestures: List[Dict]) -> np.ndarray:
    """
    Convert gesture data to sequence format for ESN.
    
    Args:
        gestures: List of gesture dicts with gesture_type, confidence, position
        
    Returns:
        np.ndarray of shape (len(gestures), n_features)
    """
    n_gestures = len(GESTURE_TYPES)
    n_features = n_gestures + 3  # gesture one-hot + confidence + x + y
    
    sequence = np.zeros((len(gestures), n_features))
    
    for i, g in enumerate(gestures):
        # One-hot encode gesture type
        gesture_idx = GESTURE_TO_IDX.get(g.get("gesture_type", "stop"), 0)
        sequence[i, gesture_idx] = 1.0
        
        # Add confidence
        sequence[i, n_gestures] = g.get("confidence", 0.9)
        
        # Add position
        pos = g.get("position", {"x": 0, "y": 1})
        sequence[i, n_gestures + 1] = pos.get("x", 0)
        sequence[i, n_gestures + 2] = pos.get("y", 1)
    
    return sequence


# Global ESN instance
_esn_predictor = None

def get_esn_predictor() -> EchoStatePredictor:
    """Get or create the global ESN predictor instance."""
    global _esn_predictor
    if _esn_predictor is None:
        _esn_predictor = EchoStatePredictor()
    return _esn_predictor


def predict_echo_risk(gestures: List[Dict]) -> Dict:
    """
    Main API function to predict echo risk from gestures.
    
    Args:
        gestures: List of gesture dicts
        
    Returns:
        Risk prediction results
    """
    esn = get_esn_predictor()
    sequence = gestures_to_sequence(gestures)
    return esn.predict_risk(sequence)
