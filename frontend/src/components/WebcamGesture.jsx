import { useRef, useEffect, useState, useCallback } from 'react';
import { FilesetResolver, GestureRecognizer, HandLandmarker } from '@mediapipe/tasks-vision';
import axios from 'axios';
import { 
  Camera, 
  CameraOff, 
  AlertTriangle, 
  Hand, 
  Activity,
  Zap,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Gesture mapping for display
const GESTURE_DISPLAY = {
  'Closed_Fist': { name: 'STOP', icon: '✋', color: 'text-red-500', risk: 'low' },
  'Open_Palm': { name: 'STOP', icon: '🛑', color: 'text-red-500', risk: 'low' },
  'Pointing_Up': { name: 'POINT', icon: '☝️', color: 'text-optimus-cyan', risk: 'medium' },
  'Thumb_Up': { name: 'PROCEED', icon: '👍', color: 'text-optimus-green', risk: 'low' },
  'Thumb_Down': { name: 'SLOW DOWN', icon: '👎', color: 'text-optimus-warning', risk: 'medium' },
  'Victory': { name: 'OK', icon: '✌️', color: 'text-optimus-green', risk: 'low' },
  'ILoveYou': { name: 'WAVE', icon: '🤟', color: 'text-optimus-cyan', risk: 'low' },
  'None': { name: 'UNKNOWN', icon: '❓', color: 'text-optimus-steel', risk: 'high' }
};

// Map MediaPipe gestures to our gesture types
const GESTURE_TYPE_MAP = {
  'Closed_Fist': 'stop',
  'Open_Palm': 'stop',
  'Pointing_Up': 'point',
  'Thumb_Up': 'proceed',
  'Thumb_Down': 'slow_down',
  'Victory': 'proceed',
  'ILoveYou': 'wave',
  'None': 'unknown'
};

export default function WebcamGesture({ onGestureDetected, onRiskUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const gestureRecognizerRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [gestureHistory, setGestureHistory] = useState([]);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [handLandmarks, setHandLandmarks] = useState([]);
  const [error, setError] = useState(null);

  // Initialize MediaPipe
  useEffect(() => {
    initializeMediaPipe();
    return () => {
      stopCamera();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const initializeMediaPipe = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Initialize Gesture Recognizer
      gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2
      });

      // Initialize Hand Landmarker for drawing
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2
      });

      setIsLoading(false);
      toast.success('MediaPipe initialized successfully');
    } catch (err) {
      console.error('MediaPipe init error:', err);
      setError('Failed to initialize gesture recognition. Please refresh.');
      setIsLoading(false);
      toast.error('Failed to initialize MediaPipe');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          setIsStreaming(true);
          detectGestures();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera permissions.');
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const detectGestures = useCallback(() => {
    if (!videoRef.current || !gestureRecognizerRef.current || !isStreaming) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (video.readyState >= 2) {
      const startTimeMs = performance.now();
      
      // Detect gestures
      const gestureResults = gestureRecognizerRef.current.recognizeForVideo(video, startTimeMs);
      
      // Detect hand landmarks for drawing
      const landmarkResults = handLandmarkerRef.current?.detectForVideo(video, startTimeMs);

      // Draw video and landmarks
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Draw hand landmarks
        if (landmarkResults?.landmarks) {
          setHandLandmarks(landmarkResults.landmarks);
          landmarkResults.landmarks.forEach(landmarks => {
            drawLandmarks(ctx, landmarks, canvas.width, canvas.height);
          });
        }
      }

      // Process gesture results
      if (gestureResults?.gestures?.length > 0) {
        const gesture = gestureResults.gestures[0][0];
        const gestureName = gesture.categoryName;
        const gestureConfidence = gesture.score;

        setCurrentGesture(gestureName);
        setConfidence(gestureConfidence);

        // Add to history
        const newGesture = {
          gesture_type: GESTURE_TYPE_MAP[gestureName] || 'unknown',
          confidence: gestureConfidence,
          position: landmarkResults?.landmarks?.[0]?.[0] 
            ? { 
                x: (landmarkResults.landmarks[0][0].x * 4) - 2,
                y: (1 - landmarkResults.landmarks[0][0].y) * 2,
                z: landmarkResults.landmarks[0][0].z || 0
              }
            : { x: 0, y: 1, z: 0 },
          timestamp: new Date().toISOString(),
          source: 'mediapipe_webcam'
        };

        setGestureHistory(prev => {
          const updated = [...prev, newGesture].slice(-50); // Keep last 50
          return updated;
        });

        if (onGestureDetected) {
          onGestureDetected(newGesture);
        }
      } else {
        setCurrentGesture('None');
        setConfidence(0);
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectGestures);
  }, [isStreaming, onGestureDetected]);

  const drawLandmarks = (ctx, landmarks, width, height) => {
    // Draw connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17] // Palm
    ];

    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    });

    // Draw points
    landmarks.forEach((landmark, idx) => {
      ctx.beginPath();
      ctx.arc(landmark.x * width, landmark.y * height, 4, 0, 2 * Math.PI);
      ctx.fillStyle = idx === 0 ? '#FF4D00' : '#00FF9D';
      ctx.fill();
    });
  };

  const analyzeGestureHistory = async () => {
    if (gestureHistory.length < 10) {
      toast.error('Need at least 10 gestures for analysis');
      return;
    }

    try {
      const response = await axios.post(`${API}/gestures/analyze`, gestureHistory);
      setRiskAnalysis(response.data);
      
      if (onRiskUpdate) {
        onRiskUpdate(response.data);
      }

      const riskLevel = response.data.risk_level;
      if (riskLevel === 'critical' || riskLevel === 'high') {
        toast.error(`High risk detected: ${(response.data.risk_score * 100).toFixed(0)}%`);
      } else {
        toast.success(`Risk analysis complete: ${riskLevel} risk`);
      }
    } catch (err) {
      toast.error('Failed to analyze gestures');
      console.error(err);
    }
  };

  const clearHistory = () => {
    setGestureHistory([]);
    setRiskAnalysis(null);
  };

  const gestureDisplay = currentGesture ? GESTURE_DISPLAY[currentGesture] || GESTURE_DISPLAY['None'] : null;

  return (
    <div className="space-y-4" data-testid="webcam-gesture">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 border",
            isStreaming ? "bg-optimus-green/10 border-optimus-green/30" : "bg-optimus-cyan/10 border-optimus-cyan/30"
          )}>
            {isStreaming ? <Camera className="h-5 w-5 text-optimus-green" /> : <CameraOff className="h-5 w-5 text-optimus-cyan" />}
          </div>
          <div>
            <h3 className="font-rajdhani text-lg font-semibold text-optimus-silver uppercase">
              Live Gesture Detection
            </h3>
            <p className="text-xs text-optimus-steel">
              {isLoading ? 'Initializing MediaPipe...' : isStreaming ? 'Detecting gestures...' : 'Camera ready'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isStreaming ? (
            <Button
              onClick={startCamera}
              disabled={isLoading}
              className="btn-primary flex items-center gap-2"
              data-testid="start-camera-btn"
            >
              <Camera className="h-4 w-4" />
              Start Camera
            </Button>
          ) : (
            <Button
              onClick={stopCamera}
              className="btn-danger flex items-center gap-2"
              data-testid="stop-camera-btn"
            >
              <CameraOff className="h-4 w-4" />
              Stop Camera
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 border border-optimus-orange/30 bg-optimus-orange/10 text-optimus-orange text-sm">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video Feed */}
        <div className="lg:col-span-2">
          <div className="relative bg-black aspect-video overflow-hidden border border-optimus-border">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-0"
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full object-cover"
            />
            
            {!isStreaming && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-optimus-card">
                <div className="text-center">
                  <Hand className="h-16 w-16 mx-auto mb-4 text-optimus-cyan opacity-50" />
                  <p className="text-optimus-steel">Click "Start Camera" to begin gesture detection</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-optimus-card">
                <div className="text-center">
                  <div className="spinner mx-auto mb-4" />
                  <p className="text-optimus-cyan">Loading MediaPipe models...</p>
                </div>
              </div>
            )}

            {/* Gesture Overlay */}
            {isStreaming && gestureDisplay && (
              <div className="absolute top-4 left-4 p-3 bg-black/80 backdrop-blur-sm border border-optimus-cyan/30">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{gestureDisplay.icon}</span>
                  <div>
                    <p className={cn("font-rajdhani text-xl font-bold uppercase", gestureDisplay.color)}>
                      {gestureDisplay.name}
                    </p>
                    <p className="text-xs text-optimus-steel font-mono">
                      Confidence: {(confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Corner decorations */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-optimus-cyan/50" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-optimus-cyan/50" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-optimus-cyan/50" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-optimus-cyan/50" />
          </div>
        </div>

        {/* Stats Panel */}
        <div className="space-y-4">
          {/* Current Detection */}
          <div className="hud-card p-4">
            <h4 className="text-xs text-optimus-steel uppercase tracking-wider mb-3">Current Detection</h4>
            {gestureDisplay ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{gestureDisplay.icon}</span>
                  <span className={cn("font-rajdhani text-2xl font-bold", gestureDisplay.color)}>
                    {gestureDisplay.name}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-optimus-steel">Confidence</span>
                    <span className="text-optimus-cyan">{(confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={confidence * 100} className="h-2 bg-optimus-border" />
                </div>
              </div>
            ) : (
              <p className="text-optimus-steel text-sm">No gesture detected</p>
            )}
          </div>

          {/* Gesture History */}
          <div className="hud-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs text-optimus-steel uppercase tracking-wider">Gesture Buffer</h4>
              <span className="text-xs font-mono text-optimus-cyan">{gestureHistory.length}/50</span>
            </div>
            <Progress value={(gestureHistory.length / 50) * 100} className="h-2 bg-optimus-border mb-3" />
            
            <div className="flex flex-wrap gap-1">
              {gestureHistory.slice(-20).map((g, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-xs px-1 py-0.5 border",
                    g.gesture_type === 'stop' ? 'border-red-500/30 text-red-400' :
                    g.gesture_type === 'proceed' ? 'border-green-500/30 text-green-400' :
                    g.gesture_type === 'point' ? 'border-cyan-500/30 text-cyan-400' :
                    'border-optimus-border text-optimus-steel'
                  )}
                >
                  {g.gesture_type.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={analyzeGestureHistory}
              disabled={gestureHistory.length < 10}
              className="w-full btn-primary flex items-center justify-center gap-2"
              data-testid="analyze-gestures-btn"
            >
              <Activity className="h-4 w-4" />
              Analyze via ESN ({gestureHistory.length}/10 min)
            </Button>
            <Button
              onClick={clearHistory}
              className="w-full btn-secondary"
              data-testid="clear-history-btn"
            >
              Clear Buffer
            </Button>
          </div>

          {/* Risk Analysis Result */}
          {riskAnalysis && (
            <div className={cn(
              "hud-card p-4 border",
              riskAnalysis.risk_level === 'critical' ? 'border-red-500/50 bg-red-500/10' :
              riskAnalysis.risk_level === 'high' ? 'border-optimus-orange/50 bg-optimus-orange/10' :
              riskAnalysis.risk_level === 'medium' ? 'border-optimus-warning/50 bg-optimus-warning/10' :
              'border-optimus-green/50 bg-optimus-green/10'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Radio className="h-4 w-4 text-optimus-cyan animate-pulse" />
                <h4 className="text-xs text-optimus-cyan uppercase tracking-wider">ESN Analysis</h4>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-optimus-steel">Risk Score</span>
                  <span className={cn(
                    "font-mono font-bold",
                    riskAnalysis.risk_level === 'low' ? 'text-optimus-green' :
                    riskAnalysis.risk_level === 'medium' ? 'text-optimus-warning' :
                    'text-optimus-orange'
                  )}>
                    {(riskAnalysis.risk_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-optimus-steel">Risk Level</span>
                  <span className="text-xs uppercase font-bold text-optimus-silver">
                    {riskAnalysis.risk_level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-optimus-steel">Reservoir</span>
                  <span className="text-xs font-mono text-optimus-cyan">
                    {(riskAnalysis.reservoir_activation * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-optimus-steel">Anomalies</span>
                  <span className={cn(
                    "text-xs font-mono",
                    riskAnalysis.anomalies?.length > 0 ? 'text-optimus-orange' : 'text-optimus-green'
                  )}>
                    {riskAnalysis.anomalies?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 border border-optimus-border bg-optimus-subtle">
        <h4 className="text-xs text-optimus-cyan uppercase tracking-wider mb-2">Supported Gestures</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span>✋</span>
            <span className="text-optimus-silver">Open Palm = STOP</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👍</span>
            <span className="text-optimus-silver">Thumb Up = PROCEED</span>
          </div>
          <div className="flex items-center gap-2">
            <span>☝️</span>
            <span className="text-optimus-silver">Point Up = POINT</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👎</span>
            <span className="text-optimus-silver">Thumb Down = SLOW</span>
          </div>
        </div>
      </div>
    </div>
  );
}
