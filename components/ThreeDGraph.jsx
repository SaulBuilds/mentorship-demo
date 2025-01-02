// ThreeDGraph.jsx
import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export default function ThreeDGraph({ nodes, edges }) {
  function GraphNode({ node }) {
    const meshRef = useRef(null);
    const nodeColor = useMemo(() => new THREE.Color(node.color), [node.color]);

    useFrame((_, delta) => {
      if (meshRef.current) {
        meshRef.current.rotation.y += delta * 0.5;
        const mat = meshRef.current.material;
        if (!Array.isArray(mat)) {
          mat.color.set(nodeColor);
        }
      }
    });

    return (
      <mesh ref={meshRef} position={[node.x, node.y, node.z]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial />
      </mesh>
    );
  }

  function GraphEdge({ start, end }) {
    const points = useMemo(() => [start, end], [start, end]);
    return (
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flat())}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#888" />
      </line>
    );
  }

  return (
    <div style={{ width: "100%", height: "300px" }}>
      <Canvas style={{ background: "#222" }} camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <OrbitControls makeDefault />
        {nodes.map((node) => (
          <GraphNode key={node.id} node={node} />
        ))}
        {edges.map((edge, idx) => {
          const fromNode = nodes.find((n) => n.id === edge.from);
          const toNode = nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;
          return (
            <GraphEdge
              key={idx}
              start={[fromNode.x, fromNode.y, fromNode.z]}
              end={[toNode.x, toNode.y, toNode.z]}
            />
          );
        })}
      </Canvas>
    </div>
  );
}
