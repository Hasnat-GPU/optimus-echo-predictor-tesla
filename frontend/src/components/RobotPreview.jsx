import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Text3D, Center } from '@react-three/drei';

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
        <meshStandardMaterial color="#00F0FF" wireframe />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.2, 2.3, 0.4]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#00FF9D" emissive="#00FF9D" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.2, 2.3, 0.4]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#00FF9D" emissive="#00FF9D" emissiveIntensity={2} />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1.2, 1.6, 0.6]} />
        <meshStandardMaterial color="#00F0FF" wireframe />
      </mesh>
      
      {/* Core glow */}
      <mesh position={[0, 1.2, 0.31]}>
        <circleGeometry args={[0.2, 32]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={3} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.9, 1.2, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.3]} />
        <meshStandardMaterial color="#4A5568" wireframe />
      </mesh>
      <mesh position={[-1.3, 0.8, 0]}>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color="#4A5568" wireframe />
      </mesh>
      <mesh position={[0.9, 1.2, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.3]} />
        <meshStandardMaterial color="#4A5568" wireframe />
      </mesh>
      <mesh position={[1.3, 0.8, 0]}>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color="#4A5568" wireframe />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.35, -0.4, 0]}>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshStandardMaterial color="#4A5568" wireframe />
      </mesh>
      <mesh position={[0.35, -0.4, 0]}>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshStandardMaterial color="#4A5568" wireframe />
      </mesh>
      
      {/* Feet */}
      <mesh position={[-0.35, -1.1, 0.1]}>
        <boxGeometry args={[0.5, 0.2, 0.6]} />
        <meshStandardMaterial color="#4A5568" wireframe />
      </mesh>
      <mesh position={[0.35, -1.1, 0.1]}>
        <boxGeometry args={[0.5, 0.2, 0.6]} />
        <meshStandardMaterial color="#4A5568" wireframe />
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
      wave1Ref.current.scale.setScalar(1 + Math.sin(time * 2) * 0.3);
      wave1Ref.current.material.opacity = 0.3 - Math.sin(time * 2) * 0.2;
    }
    if (wave2Ref.current) {
      wave2Ref.current.scale.setScalar(1 + Math.sin(time * 2 + 1) * 0.3);
      wave2Ref.current.material.opacity = 0.3 - Math.sin(time * 2 + 1) * 0.2;
    }
    if (wave3Ref.current) {
      wave3Ref.current.scale.setScalar(1 + Math.sin(time * 2 + 2) * 0.3);
      wave3Ref.current.material.opacity = 0.3 - Math.sin(time * 2 + 2) * 0.2;
    }
  });

  return (
    <>
      <mesh ref={wave1Ref} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 2.1, 64]} />
        <meshBasicMaterial color="#00F0FF" transparent opacity={0.3} />
      </mesh>
      <mesh ref={wave2Ref} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.6, 64]} />
        <meshBasicMaterial color="#00F0FF" transparent opacity={0.2} />
      </mesh>
      <mesh ref={wave3Ref} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 3.1, 64]} />
        <meshBasicMaterial color="#00F0FF" transparent opacity={0.1} />
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

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00F0FF" wireframe />
    </mesh>
  );
}

export default function RobotPreview({ className }) {
  return (
    <div className={className} data-testid="robot-preview">
      <Canvas
        camera={{ position: [4, 3, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="#00F0FF" />
          <pointLight position={[-10, 5, -10]} intensity={0.3} color="#00FF9D" />
          <spotLight
            position={[0, 10, 0]}
            angle={0.3}
            penumbra={1}
            intensity={0.5}
            color="#00F0FF"
          />
          
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
        </Suspense>
      </Canvas>
    </div>
  );
}
