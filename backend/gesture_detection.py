"""
MediaPipe Gesture Detection Module for Optimus Echo Predictor
Provides hand landmark detection for real-time gesture recognition
"""
import numpy as np
import cv2
import mediapipe as mp
from typing import List, Dict, Optional, Tuple
import base64
import logging
from io import BytesIO

logger = logging.getLogger(__name__)

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Gesture classification based on hand landmarks
GESTURE_CONFIGS = {
    'stop': {
        'fingers_extended': [True, True, True, True, True],
        'palm_facing': 'front'
    },
    'proceed': {
        'fingers_extended': [False, True, False, False, False],
        'palm_facing': 'front'
    },
    'slow_down': {
        'fingers_extended': [True, True, True, True, True],
        'palm_facing': 'down'
    },
    'handover': {
        'fingers_extended': [True, True, True, True, True],
        'palm_facing': 'up'
    },
    'point': {
        'fingers_extended': [False, True, False, False, False],
        'palm_facing': 'side'
    },
    'wave': {
        'fingers_extended': [True, True, True, True, True],
        'palm_facing': 'front',
        'movement': 'horizontal'
    },
    'emergency': {
        'fingers_extended': [True, False, False, False, False],
        'palm_facing': 'front'
    }
}


class GestureDetector:
    """Real-time gesture detection using MediaPipe Hands."""
    
    def __init__(self, max_num_hands: int = 2, min_detection_confidence: float = 0.7):
        """
        Initialize the gesture detector.
        
        Args:
            max_num_hands: Maximum number of hands to detect
            min_detection_confidence: Minimum confidence for detection
        """
        self.max_num_hands = max_num_hands
        self.min_detection_confidence = min_detection_confidence
        self.hands = mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=0.5
        )
        self.previous_landmarks = []
        
    def detect_from_image(self, image: np.ndarray) -> Dict:
        """
        Detect gestures from an image.
        
        Args:
            image: BGR image from OpenCV
            
        Returns:
            Detection results with gestures and annotated image
        """
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.hands.process(image_rgb)
        
        detected_gestures = []
        annotated_image = image.copy()
        
        if results.multi_hand_landmarks:
            for hand_idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                # Draw landmarks
                mp_drawing.draw_landmarks(
                    annotated_image,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS,
                    mp_drawing_styles.get_default_hand_landmarks_style(),
                    mp_drawing_styles.get_default_hand_connections_style()
                )
                
                # Classify gesture
                gesture_data = self._classify_gesture(hand_landmarks, image.shape)
                handedness = results.multi_handedness[hand_idx].classification[0]
                
                gesture_data['hand'] = handedness.label
                gesture_data['hand_confidence'] = handedness.score
                detected_gestures.append(gesture_data)
        
        return {
            'gestures': detected_gestures,
            'annotated_image': annotated_image,
            'num_hands': len(detected_gestures)
        }
    
    def detect_from_base64(self, base64_image: str) -> Dict:
        """
        Detect gestures from a base64-encoded image.
        
        Args:
            base64_image: Base64-encoded image string
            
        Returns:
            Detection results
        """
        # Decode base64 image
        try:
            image_data = base64.b64decode(base64_image)
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                return {'error': 'Failed to decode image', 'gestures': []}
            
            result = self.detect_from_image(image)
            
            # Encode annotated image back to base64
            _, buffer = cv2.imencode('.jpg', result['annotated_image'], [cv2.IMWRITE_JPEG_QUALITY, 80])
            result['annotated_image_base64'] = base64.b64encode(buffer).decode('utf-8')
            del result['annotated_image']
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing base64 image: {e}")
            return {'error': str(e), 'gestures': []}
    
    def _classify_gesture(self, hand_landmarks, image_shape: Tuple[int, int, int]) -> Dict:
        """
        Classify the gesture based on hand landmarks.
        
        Args:
            hand_landmarks: MediaPipe hand landmarks
            image_shape: Shape of the source image
            
        Returns:
            Gesture classification with confidence
        """
        h, w, _ = image_shape
        
        # Extract landmark positions
        landmarks = []
        for lm in hand_landmarks.landmark:
            landmarks.append({
                'x': lm.x * w,
                'y': lm.y * h,
                'z': lm.z,
                'visibility': lm.visibility if hasattr(lm, 'visibility') else 1.0
            })
        
        # Calculate finger extension states
        fingers_extended = self._check_fingers_extended(landmarks)
        
        # Calculate palm orientation
        palm_facing = self._get_palm_orientation(landmarks)
        
        # Calculate hand center position (normalized)
        center_x = np.mean([lm['x'] for lm in landmarks]) / w
        center_y = np.mean([lm['y'] for lm in landmarks]) / h
        
        # Classify gesture
        gesture_type, confidence = self._match_gesture(fingers_extended, palm_facing)
        
        return {
            'gesture_type': gesture_type,
            'confidence': confidence,
            'fingers_extended': fingers_extended,
            'palm_orientation': palm_facing,
            'position': {
                'x': round(center_x * 4 - 2, 2),  # Normalize to -2 to 2 range
                'y': round((1 - center_y) * 2, 2),  # Normalize to 0 to 2 range, flip y
                'z': round(np.mean([lm['z'] for lm in landmarks]), 3)
            },
            'landmarks_count': len(landmarks)
        }
    
    def _check_fingers_extended(self, landmarks: List[Dict]) -> List[bool]:
        """
        Check which fingers are extended.
        
        Returns:
            List of 5 booleans [thumb, index, middle, ring, pinky]
        """
        # Finger tip and pip indices in MediaPipe
        finger_tips = [4, 8, 12, 16, 20]
        finger_pips = [2, 6, 10, 14, 18]
        
        extended = []
        
        # Thumb (compare x for left/right hand orientation)
        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        thumb_mcp = landmarks[2]
        
        # Simple thumb extension check
        thumb_extended = abs(thumb_tip['x'] - thumb_mcp['x']) > abs(thumb_ip['x'] - thumb_mcp['x']) * 0.8
        extended.append(thumb_extended)
        
        # Other fingers (compare y - tip should be above pip if extended)
        for tip_idx, pip_idx in zip(finger_tips[1:], finger_pips[1:]):
            tip_y = landmarks[tip_idx]['y']
            pip_y = landmarks[pip_idx]['y']
            extended.append(tip_y < pip_y)  # In image coords, y increases downward
        
        return extended
    
    def _get_palm_orientation(self, landmarks: List[Dict]) -> str:
        """
        Determine palm orientation based on landmarks.
        
        Returns:
            One of 'front', 'back', 'up', 'down', 'side'
        """
        # Use wrist and middle finger MCP to determine palm plane
        wrist = landmarks[0]
        middle_mcp = landmarks[9]
        index_mcp = landmarks[5]
        
        # Calculate palm normal (simplified)
        palm_vector_y = middle_mcp['y'] - wrist['y']
        palm_vector_z = middle_mcp['z'] - wrist['z']
        
        # Determine orientation
        if abs(palm_vector_z) > 0.1:
            return 'front' if palm_vector_z > 0 else 'back'
        elif palm_vector_y > 0.1:
            return 'down'
        elif palm_vector_y < -0.1:
            return 'up'
        else:
            return 'side'
    
    def _match_gesture(self, fingers: List[bool], palm: str) -> Tuple[str, float]:
        """
        Match detected features to known gestures.
        
        Returns:
            Tuple of (gesture_type, confidence)
        """
        best_match = 'unknown'
        best_score = 0.0
        
        for gesture_name, config in GESTURE_CONFIGS.items():
            score = 0.0
            
            # Check finger positions
            target_fingers = config.get('fingers_extended', [True] * 5)
            finger_match = sum(1 for a, b in zip(fingers, target_fingers) if a == b) / 5
            score += finger_match * 0.7
            
            # Check palm orientation
            target_palm = config.get('palm_facing', 'front')
            if palm == target_palm:
                score += 0.3
            elif (palm in ['front', 'back'] and target_palm in ['front', 'back']):
                score += 0.15
            
            if score > best_score:
                best_score = score
                best_match = gesture_name
        
        # Convert score to confidence
        confidence = min(best_score, 1.0)
        
        # If confidence is too low, mark as unknown
        if confidence < 0.5:
            return 'unknown', confidence
        
        return best_match, confidence
    
    def close(self):
        """Release resources."""
        self.hands.close()


# Global detector instance
_gesture_detector = None

def get_gesture_detector() -> GestureDetector:
    """Get or create the global gesture detector instance."""
    global _gesture_detector
    if _gesture_detector is None:
        _gesture_detector = GestureDetector()
    return _gesture_detector


def detect_gestures_from_base64(base64_image: str) -> Dict:
    """
    Main API function to detect gestures from base64 image.
    
    Args:
        base64_image: Base64-encoded image
        
    Returns:
        Detection results
    """
    detector = get_gesture_detector()
    return detector.detect_from_base64(base64_image)


def generate_synthetic_gesture_sequence(
    n_frames: int = 50,
    gesture_type: str = 'random',
    add_noise: bool = True
) -> List[Dict]:
    """
    Generate a synthetic gesture sequence for testing.
    
    Args:
        n_frames: Number of frames in sequence
        gesture_type: Type of gesture or 'random' for mixed
        add_noise: Whether to add noise to simulate real conditions
        
    Returns:
        List of gesture dicts
    """
    np.random.seed(None)  # Use random seed for variety
    
    gesture_types = ['stop', 'proceed', 'slow_down', 'handover', 'point', 'wave', 'emergency']
    
    gestures = []
    current_gesture = gesture_type if gesture_type != 'random' else np.random.choice(gesture_types)
    
    for i in range(n_frames):
        # Occasionally change gesture
        if gesture_type == 'random' and np.random.random() < 0.1:
            current_gesture = np.random.choice(gesture_types)
        
        # Base confidence
        confidence = 0.85 + np.random.uniform(-0.1, 0.1)
        if add_noise:
            confidence += np.random.normal(0, 0.05)
        confidence = np.clip(confidence, 0.5, 0.99)
        
        # Position with smooth movement
        t = i / n_frames
        x = np.sin(t * 2 * np.pi) * 1.5
        y = 1.0 + np.cos(t * np.pi) * 0.3
        
        if add_noise:
            x += np.random.normal(0, 0.1)
            y += np.random.normal(0, 0.05)
        
        gestures.append({
            'gesture_type': current_gesture,
            'confidence': round(confidence, 3),
            'position': {
                'x': round(x, 2),
                'y': round(y, 2),
                'z': round(np.random.uniform(-0.1, 0.1), 3)
            },
            'frame': i,
            'timestamp': f"2026-01-10T10:00:{i:02d}Z",
            'source': 'synthetic'
        })
    
    return gestures
