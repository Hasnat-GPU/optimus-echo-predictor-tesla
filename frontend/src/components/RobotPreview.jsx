import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function WireframeRobot() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
      // Floating animation
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshBasicMaterial color="#00F0FF" wireframe />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.2, 2.3, 0.4]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#00FF9D" />
      </mesh>
      <mesh position={[0.2, 2.3, 0.4]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#00FF9D" />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1.2, 1.6, 0.6]} />
        <meshBasicMaterial color="#00F0FF" wireframe />
      </mesh>
      
      {/* Core glow */}
      <mesh position={[0, 1.2, 0.31]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#00F0FF" />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.9, 1.2, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.3]} />
        <meshBasicMaterial color="#4A5568" wireframe />
      </mesh>
      <mesh position={[-1.3, 0.8, 0]}>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshBasicMaterial color="#4A5568" wireframe />
      </mesh>
      <mesh position={[0.9, 1.2, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.3]} />
        <meshBasicMaterial color="#4A5568" wireframe />
      </mesh>
      <mesh position={[1.3, 0.8, 0]}>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshBasicMaterial color="#4A5568" wireframe />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.35, -0.4, 0]}>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshBasicMaterial color="#4A5568" wireframe />
      </mesh>
      <mesh position={[0.35, -0.4, 0]}>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshBasicMaterial color="#4A5568" wireframe />
      </mesh>
      
      {/* Feet */}
      <mesh position={[-0.35, -1.1, 0.1]}>
        <boxGeometry args={[0.5, 0.2, 0.6]} />
        <meshBasicMaterial color="#4A5568" wireframe />
      </mesh>
      <mesh position={[0.35, -1.1, 0.1]}>
        <boxGeometry args={[0.5, 0.2, 0.6]} />
        <meshBasicMaterial color="#4A5568" wireframe />
      </mesh>
    </group>
  );
}

function EchoWaves() {
  const wave1Ref = useRef();
  const wave2Ref = useRef();
  const wave3Ref = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (wave1Ref.current) {
      const scale = 1 + Math.sin(time * 2) * 0.3;
      wave1Ref.current.scale.set(scale, scale, scale);
      wave1Ref.current.material.opacity = 0.3 - Math.sin(time * 2) * 0.2;
    }
    if (wave2Ref.current) {
      const scale = 1 + Math.sin(time * 2 + 1) * 0.3;
      wave2Ref.current.scale.set(scale, scale, scale);
      wave2Ref.current.material.opacity = 0.3 - Math.sin(time * 2 + 1) * 0.2;
    }
    if (wave3Ref.current) {
      const scale = 1 + Math.sin(time * 2 + 2) * 0.3;
      wave3Ref.current.scale.set(scale, scale, scale);
      wave3Ref.current.material.opacity = 0.3 - Math.sin(time * 2 + 2) * 0.2;
    }
  });

  return (
    <>
      <mesh ref={wave1Ref} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 2.1, 64]} />
        <meshBasicMaterial color="#00F0FF" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={wave2Ref} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.6, 64]} />
        <meshBasicMaterial color="#00F0FF" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={wave3Ref} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 3.1, 64]} />
        <meshBasicMaterial color="#00F0FF" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
      <planeGeometry args={[20, 20, 20, 20]} />
      <meshBasicMaterial color="#1F2937" wireframe />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00F0FF" />
      <pointLight position={[-10, 5, -10]} intensity={0.3} color="#00FF9D" />
      
      <WireframeRobot />
      <EchoWaves />
      <GridFloor />
      
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

function ErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return fallback;
  }
  
  return children;
}

export default function RobotPreview({ className }) {
  const [showCanvas, setShowCanvas] = useState(true);

  const fallbackUI = (
    <div className="w-full h-full flex items-center justify-center bg-optimus-bg relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      
      {/* Static wireframe robot representation */}
      <div className="relative z-10 text-center">
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <div className="absolute inset-0 border-2 border-optimus-cyan animate-pulse-glow" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-optimus-cyan" />
          <div className="absolute top-14 left-1/2 -translate-x-1/2 w-12 h-12 border-2 border-optimus-cyan" />
          <div className="absolute top-6 left-[35%] w-2 h-2 bg-optimus-green rounded-full animate-pulse" />
          <div className="absolute top-6 right-[35%] w-2 h-2 bg-optimus-green rounded-full animate-pulse" />
        </div>
        <p className="text-optimus-cyan font-rajdhani text-lg uppercase tracking-wider">
          OPTIMUS UNIT
        </p>
        <p className="text-optimus-steel text-xs mt-2 font-mono">
          Echo State Active
        </p>
      </div>
      
      {/* Echo waves */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-40 h-40 border border-optimus-cyan/30 rounded-full animate-echo-wave" />
        <div className="absolute w-40 h-40 border border-optimus-cyan/20 rounded-full animate-echo-wave" style={{ animationDelay: '0.5s' }} />
        <div className="absolute w-40 h-40 border border-optimus-cyan/10 rounded-full animate-echo-wave" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );

  if (!showCanvas) {
    return (
      <div className={className} data-testid="robot-preview">
        {fallbackUI}
      </div>
    );
  }

  return (
    <div className={className} data-testid="robot-preview">
      <Canvas
        camera={{ position: [4, 3, 5], fov: 50 }}
        style={{ background: 'transparent' }}
        onCreated={() => {}}
        onError={() => setShowCanvas(false)}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
