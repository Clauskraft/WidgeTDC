import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { NeuralNode } from './NeuralNode';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

interface GraphNode {
    id: string | number;
    name: string;
    type: 'file' | 'directory';
    color?: string;
    position?: [number, number, number];
}

interface GraphLink {
    source: string | number;
    target: string | number;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export const ThreeBrain: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      // Fetch data from the backend via Proxy
      // ✅ NEURAL LINK PATCH: Using relative path to respect proxy settings
      fetch('/api/evolution/graph/stats')
        .then(res => {
            if (!res.ok) throw new Error(`Neural Link Error: ${res.status}`);
            return res.json();
        })
        .then(data => {
            console.log(`🧠 Neural Link Active: Received ${data.nodes?.length || 0} nodes`);
            
            // Assign random 3D positions to nodes for visualization if not present
            const nodesWithPos = (data.nodes || []).map((node: any) => ({
                ...node,
                id: node.id, // Ensure ID is preserved
                position: [
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20
                ]
            }));
            
            // Handle links - use 'links' or fallback to 'importGraph'
            const rawLinks = data.links || data.importGraph || [];
            const formattedLinks = rawLinks.map((l: any) => ({
                source: l.source || l.from,
                target: l.target || l.to
            }));

            setGraphData({ 
                nodes: nodesWithPos, 
                links: formattedLinks
            });
            setLoading(false);
        })
        .catch(err => {
            console.error("❌ Neural Link Severed:", err);
            setLoading(false);
        });
  }, []);

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden border border-white/10 relative">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-cyan-400 z-50">
                Loading Neural Map...
            </div>
        )}
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 30]} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate={true} autoRotateSpeed={0.5} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <group>
          {graphData.nodes.map((node) => (
            <NeuralNode 
              key={node.id} 
              position={node.position as [number, number, number]} 
              label={node.name} 
              color={node.color || '#00B5CB'}
              size={node.type === 'directory' ? 0.8 : 0.3}
            />
          ))}
          
          {/* Connecting Lines */}
          {graphData.links.map((link, i) => {
             const sourceNode = graphData.nodes.find(n => n.id === link.source);
             const targetNode = graphData.nodes.find(n => n.id === link.target);

             if (!sourceNode?.position || !targetNode?.position) return null;

             return (
               <line key={`line-${i}`}>
                 <bufferGeometry attach="geometry" onUpdate={self => {
                    self.setFromPoints([
                        new THREE.Vector3(...sourceNode.position!),
                        new THREE.Vector3(...targetNode.position!)
                    ])
                 }} />
                 <lineBasicMaterial attach="material" color="rgba(255,255,255,0.1)" transparent opacity={0.1} />
               </line>
             )
          })}
        </group>

        <Suspense fallback={null}>
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
          </EffectComposer>
        </Suspense>
      </Canvas>
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <h3 className="text-white font-bold text-lg tracking-widest drop-shadow-md">NEURAL INTERFACE V1</h3>
        <p className="text-cyan-400 text-xs">
            {loading ? 'CONNECTING...' : `SYSTEM ONLINE • ${graphData.nodes.length} NODES`}
        </p>
      </div>
    </div>
  );
};
