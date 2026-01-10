import { useState } from 'react';
import { 
  Camera, 
  Radio, 
  AlertTriangle,
  ShieldCheck,
  Zap,
  Bot
} from 'lucide-react';
import { HUDCard } from '@/components/HUDCard';
import WebcamGesture from '@/components/WebcamGesture';
import { cn } from '@/lib/utils';

export default function LiveDetection() {
  const [latestGesture, setLatestGesture] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [robotState, setRobotState] = useState('idle');

  const handleGestureDetected = (gesture) => {
    setLatestGesture(gesture);
    
    // Update robot state based on gesture
    const stateMap = {
      'stop': 'stopped',
      'proceed': 'moving',
      'slow_down': 'slowing',
      'point': 'following',
      'wave': 'greeting',
      'handover': 'receiving'
    };
    setRobotState(stateMap[gesture.gesture_type] || 'idle');
  };

  const handleRiskUpdate = (risk) => {
    setRiskData(risk);
  };

  const getRobotStateDisplay = () => {
    const states = {
      idle: { icon: '🤖', text: 'IDLE', color: 'text-optimus-steel' },
      stopped: { icon: '🛑', text: 'STOPPED', color: 'text-red-500' },
      moving: { icon: '🚀', text: 'MOVING', color: 'text-optimus-green' },
      slowing: { icon: '⚠️', text: 'SLOWING', color: 'text-optimus-warning' },
      following: { icon: '👆', text: 'FOLLOWING', color: 'text-optimus-cyan' },
      greeting: { icon: '👋', text: 'GREETING', color: 'text-optimus-cyan' },
      receiving: { icon: '🤲', text: 'RECEIVING', color: 'text-optimus-green' }
    };
    return states[robotState] || states.idle;
  };

  const robotDisplay = getRobotStateDisplay();

  return (
    <div className="space-y-6" data-testid="live-detection-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-rajdhani text-2xl font-bold text-optimus-silver uppercase tracking-wide">
            Live Gesture Detection
          </h2>
          <p className="text-sm text-optimus-steel mt-1">
            Real-time MediaPipe hand tracking with ESN risk analysis
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-optimus-cyan/10 border border-optimus-cyan/30">
          <Radio className="h-4 w-4 text-optimus-cyan animate-pulse" />
          <span className="text-xs font-mono text-optimus-cyan tracking-wider">
            MEDIAPIPE + RESERVOIRPY ESN
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Webcam Section - Takes 3 columns */}
        <div className="xl:col-span-3">
          <HUDCard>
            <WebcamGesture 
              onGestureDetected={handleGestureDetected}
              onRiskUpdate={handleRiskUpdate}
            />
          </HUDCard>
        </div>

        {/* Robot Reaction Panel */}
        <div className="space-y-4">
          {/* Robot State */}
          <HUDCard 
            title="Optimus Unit Status" 
            icon={Bot}
            glow={robotState === 'stopped' ? 'orange' : robotState === 'moving' ? 'green' : 'cyan'}
          >
            <div className="text-center py-6">
              <div className="text-6xl mb-4">{robotDisplay.icon}</div>
              <p className={cn("font-rajdhani text-2xl font-bold uppercase", robotDisplay.color)}>
                {robotDisplay.text}
              </p>
              <p className="text-xs text-optimus-steel mt-2 font-mono">
                Reaction: {robotState === 'idle' ? 'Awaiting command' : `Executing ${robotState}`}
              </p>
            </div>
            
            {/* Animated indicator */}
            <div className="mt-4 h-1 bg-optimus-border overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300",
                  robotState === 'stopped' ? 'w-0 bg-red-500' :
                  robotState === 'moving' ? 'w-full bg-optimus-green animate-pulse' :
                  robotState === 'slowing' ? 'w-1/2 bg-optimus-warning' :
                  'w-1/4 bg-optimus-cyan'
                )}
              />
            </div>
          </HUDCard>

          {/* Quick Stats */}
          <HUDCard title="Detection Stats" icon={Zap}>
            <div className="space-y-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-optimus-steel">Last Gesture</span>
                <span className="text-xs font-mono text-optimus-cyan">
                  {latestGesture?.gesture_type || 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-optimus-steel">Confidence</span>
                <span className="text-xs font-mono text-optimus-green">
                  {latestGesture ? `${(latestGesture.confidence * 100).toFixed(0)}%` : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-optimus-steel">Position X</span>
                <span className="text-xs font-mono text-optimus-silver">
                  {latestGesture?.position?.x?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-optimus-steel">Position Y</span>
                <span className="text-xs font-mono text-optimus-silver">
                  {latestGesture?.position?.y?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </HUDCard>

          {/* Risk Summary */}
          {riskData && (
            <HUDCard 
              title="Risk Assessment" 
              icon={riskData.risk_level === 'low' ? ShieldCheck : AlertTriangle}
              status={riskData.risk_level === 'low' ? 'online' : riskData.risk_level === 'medium' ? 'warning' : 'danger'}
            >
              <div className="space-y-3 mt-2">
                <div className="text-center py-2">
                  <p className={cn(
                    "font-rajdhani text-4xl font-bold",
                    riskData.risk_level === 'low' ? 'text-optimus-green' :
                    riskData.risk_level === 'medium' ? 'text-optimus-warning' :
                    'text-optimus-orange'
                  )}>
                    {(riskData.risk_score * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-optimus-steel uppercase tracking-wider">
                    {riskData.risk_level} Risk
                  </p>
                </div>
                
                {riskData.anomalies?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-optimus-orange uppercase">Anomalies:</p>
                    {riskData.anomalies.slice(0, 2).map((a, i) => (
                      <p key={i} className="text-[10px] text-optimus-steel">
                        • {a.type.replace('_', ' ')}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </HUDCard>
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-optimus-border bg-optimus-subtle">
          <div className="flex items-center gap-3 mb-2">
            <Camera className="h-5 w-5 text-optimus-cyan" />
            <h4 className="font-rajdhani text-sm font-semibold text-optimus-silver uppercase">
              Real-Time Detection
            </h4>
          </div>
          <p className="text-xs text-optimus-steel">
            MediaPipe hand landmarker processes 21 landmarks at 30+ FPS for instant gesture recognition
          </p>
        </div>
        
        <div className="p-4 border border-optimus-border bg-optimus-subtle">
          <div className="flex items-center gap-3 mb-2">
            <Radio className="h-5 w-5 text-optimus-cyan" />
            <h4 className="font-rajdhani text-sm font-semibold text-optimus-silver uppercase">
              ESN Analysis
            </h4>
          </div>
          <p className="text-xs text-optimus-steel">
            ReservoirPy Echo State Network analyzes gesture sequences to predict interaction risks
          </p>
        </div>
        
        <div className="p-4 border border-optimus-border bg-optimus-subtle">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="h-5 w-5 text-optimus-cyan" />
            <h4 className="font-rajdhani text-sm font-semibold text-optimus-silver uppercase">
              Robot Reaction
            </h4>
          </div>
          <p className="text-xs text-optimus-steel">
            Simulated Optimus unit responds to detected gestures for symbiosis preview
          </p>
        </div>
      </div>
    </div>
  );
}
