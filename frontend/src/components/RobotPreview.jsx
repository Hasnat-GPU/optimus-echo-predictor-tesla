import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

function WireframeRobot() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
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
      
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <WireframeRobot />
      </Float>
      
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

export default function RobotPreview({ className }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={className} data-testid="robot-preview">
        <div className="w-full h-full flex items-center justify-center bg-optimus-card">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-2 border-optimus-cyan animate-spin" style={{ borderTopColor: 'transparent' }} />
            <p className="text-optimus-steel text-sm">3D Preview Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} data-testid="robot-preview">
      <Canvas
        camera={{ position: [4, 3, 5], fov: 50 }}
        style={{ background: 'transparent' }}
        onError={() => setHasError(true)}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
