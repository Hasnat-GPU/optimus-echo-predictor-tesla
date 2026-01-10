import { useEffect, useState } from 'react';

export default function RobotPreview({ className }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(t => t + 0.05);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const floatY = Math.sin(time) * 10;
  const pulse = 0.5 + Math.sin(time * 2) * 0.3;

  return (
    <div className={`${className} relative overflow-hidden`} data-testid="robot-preview">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      
      {/* Echo waves */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="absolute border border-optimus-cyan/30 rounded-full"
          style={{
            width: `${200 + Math.sin(time) * 50}px`,
            height: `${200 + Math.sin(time) * 50}px`,
            opacity: 0.3 - Math.sin(time) * 0.2,
          }}
        />
        <div 
          className="absolute border border-optimus-cyan/20 rounded-full"
          style={{
            width: `${280 + Math.sin(time + 1) * 50}px`,
            height: `${280 + Math.sin(time + 1) * 50}px`,
            opacity: 0.2 - Math.sin(time + 1) * 0.15,
          }}
        />
        <div 
          className="absolute border border-optimus-cyan/10 rounded-full"
          style={{
            width: `${360 + Math.sin(time + 2) * 50}px`,
            height: `${360 + Math.sin(time + 2) * 50}px`,
            opacity: 0.15 - Math.sin(time + 2) * 0.1,
          }}
        />
      </div>

      {/* 3D-like robot using CSS */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{ transform: `translate(-50%, calc(-50% + ${floatY}px))` }}
      >
        <div className="relative" style={{ perspective: '1000px' }}>
          {/* Robot container */}
          <div 
            className="relative"
            style={{ 
              transform: `rotateY(${time * 20}deg)`,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Head */}
            <div className="relative mx-auto w-24 h-24 mb-2" style={{ transformStyle: 'preserve-3d' }}>
              <div className="absolute inset-0 border-2 border-optimus-cyan bg-optimus-card/50 backdrop-blur-sm" 
                style={{ transform: 'translateZ(12px)' }} />
              <div className="absolute inset-0 border-2 border-optimus-cyan/50" 
                style={{ transform: 'translateZ(-12px)' }} />
              
              {/* Eyes */}
              <div 
                className="absolute top-6 left-5 w-4 h-4 rounded-full"
                style={{ 
                  backgroundColor: '#00FF9D',
                  boxShadow: `0 0 ${10 + pulse * 10}px #00FF9D`,
                  transform: 'translateZ(14px)'
                }}
              />
              <div 
                className="absolute top-6 right-5 w-4 h-4 rounded-full"
                style={{ 
                  backgroundColor: '#00FF9D',
                  boxShadow: `0 0 ${10 + pulse * 10}px #00FF9D`,
                  transform: 'translateZ(14px)'
                }}
              />
              
              {/* Visor line */}
              <div 
                className="absolute top-5 left-3 right-3 h-px bg-optimus-cyan"
                style={{ transform: 'translateZ(13px)' }}
              />
            </div>

            {/* Neck */}
            <div className="mx-auto w-8 h-4 border-l-2 border-r-2 border-optimus-steel" />

            {/* Body */}
            <div className="relative mx-auto w-36 h-44" style={{ transformStyle: 'preserve-3d' }}>
              <div className="absolute inset-0 border-2 border-optimus-cyan bg-optimus-card/50 backdrop-blur-sm"
                style={{ transform: 'translateZ(10px)' }} />
              <div className="absolute inset-0 border-2 border-optimus-cyan/50"
                style={{ transform: 'translateZ(-10px)' }} />
              
              {/* Core */}
              <div 
                className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-optimus-cyan"
                style={{ 
                  transform: 'translateZ(12px)',
                  boxShadow: `0 0 ${15 + pulse * 15}px rgba(0, 240, 255, ${pulse})`,
                  backgroundColor: `rgba(0, 240, 255, ${pulse * 0.3})`
                }}
              />
              
              {/* Core inner */}
              <div 
                className="absolute top-10 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-optimus-cyan"
                style={{ 
                  transform: 'translateZ(14px)',
                  opacity: pulse
                }}
              />
              
              {/* Chest panels */}
              <div className="absolute top-24 left-4 right-4 space-y-2" style={{ transform: 'translateZ(11px)' }}>
                <div className="h-1 bg-optimus-steel/50" />
                <div className="h-1 bg-optimus-steel/30" />
                <div className="h-1 bg-optimus-steel/20" />
              </div>
            </div>

            {/* Arms */}
            <div className="absolute top-32 -left-8 w-6 h-32 border-2 border-optimus-steel bg-optimus-card/30"
              style={{ 
                transform: `rotateX(${Math.sin(time) * 10}deg)`,
                transformOrigin: 'top center'
              }}
            >
              <div className="absolute bottom-0 w-full h-8 border-t-2 border-optimus-cyan/50" />
            </div>
            <div className="absolute top-32 -right-8 w-6 h-32 border-2 border-optimus-steel bg-optimus-card/30"
              style={{ 
                transform: `rotateX(${Math.sin(time + Math.PI) * 10}deg)`,
                transformOrigin: 'top center'
              }}
            >
              <div className="absolute bottom-0 w-full h-8 border-t-2 border-optimus-cyan/50" />
            </div>
          </div>
        </div>

        {/* Shadow */}
        <div 
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-4 rounded-full bg-optimus-cyan/20 blur-lg"
          style={{ 
            transform: `translate(-50%, 0) scale(${1 - floatY / 50})`,
            opacity: 0.3 + floatY / 50
          }}
        />
      </div>

      {/* HUD Elements */}
      <div className="absolute top-8 left-8 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-optimus-green rounded-full animate-pulse" />
          <span className="text-xs font-mono text-optimus-steel">UNIT STATUS: ONLINE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-optimus-cyan rounded-full" style={{ opacity: pulse }} />
          <span className="text-xs font-mono text-optimus-steel">ECHO NETWORK: ACTIVE</span>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 text-right">
        <p className="text-xs font-mono text-optimus-steel">MODEL: OPTIMUS GEN-2</p>
        <p className="text-xs font-mono text-optimus-cyan">SYMBIOSIS: {(75 + Math.sin(time) * 5).toFixed(1)}%</p>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-optimus-cyan/30" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-optimus-cyan/30" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-optimus-cyan/30" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-optimus-cyan/30" />
    </div>
  );
}
