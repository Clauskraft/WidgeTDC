import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ForceGraph3D, { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-3d';
import * as THREE from 'three';
import {
  RefreshCw,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Database,
  GitBranch,
  Info,
  AlertTriangle,
  RotateCcw,
  Eye,
  Layers,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface GraphNode extends NodeObject {
  id: string;
  label: string;
  labels: string[];
  nodeType: 'Persona' | 'File' | 'Leak' | 'Directory' | 'Identity' | 'Unknown';
  properties: Record<string, unknown>;
  color?: string;
  size?: number;
}

interface GraphLink extends LinkObject {
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface NodeDetails {
  id: string;
  labels: string[];
  nodeType: string;
  properties: Record<string, unknown>;
}

interface Neo4jStats {
  totalNodes: number;
  totalRelationships: number;
  filesByType: Record<string, number>;
  importGraph: { from: string; to: string }[];
  nodesByLabel?: Record<string, number>;
}

// ============================================
// CYBERPUNK STAR MAP COLOR PALETTE
// ============================================
const NODE_TYPE_COLORS: Record<string, string> = {
  Persona: '#a855f7',      // Purple - Neon violet
  File: '#22c55e',         // Green - Matrix green
  Leak: '#ef4444',         // Red - Alert crimson
  LeakSource: '#ef4444',   // Red - Alert crimson
  Directory: '#06b6d4',    // Cyan - Electric blue
  Identity: '#f59e0b',     // Amber - Warning gold
  Unknown: '#6366f1',      // Indigo - Mystery blue
};

const NODE_TYPE_GLOW: Record<string, number> = {
  Persona: 0.9,
  File: 0.6,
  Leak: 1.0,
  LeakSource: 1.0,
  Directory: 0.5,
  Identity: 0.8,
  Unknown: 0.4,
};

// ============================================
// NEURAL GRAPH 3D COMPONENT
// ============================================
export default function NeuralGraph3D() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeDetails | null>(null);
  const [stats, setStats] = useState({ nodes: 0, relationships: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on resize with ResizeObserver for robustness
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Only update if dimensions actually changed to prevent render loops
        setDimensions(prev => {
          if (Math.abs(prev.width - width) > 1 || Math.abs(prev.height - height) > 1) {
            return { width, height };
          }
          return prev;
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Auto-rotation effect
  useEffect(() => {
    if (!graphRef.current || !autoRotate) return;

    let angle = 0;
    const distance = 400;
    let frameId: number;

    const animate = () => {
      angle += 0.002;
      const camera = graphRef.current?.camera();
      if (camera) {
        camera.position.x = distance * Math.sin(angle);
        camera.position.z = distance * Math.cos(angle);
        camera.lookAt(0, 0, 0);
      }
      frameId = requestAnimationFrame(animate);
    };

    // Use requestAnimationFrame instead of setInterval for smoother, non-blocking animation
    animate();

    return () => cancelAnimationFrame(frameId);
  }, [autoRotate, graphRef.current]); // Added graphRef.current dependency

  // Determine node type from labels
  const getNodeType = (labels: string[]): GraphNode['nodeType'] => {
    if (labels.includes('Persona')) return 'Persona';
    if (labels.includes('LeakSource') || labels.includes('Leak')) return 'Leak';
    if (labels.includes('Identity')) return 'Identity';
    if (labels.includes('Directory')) return 'Directory';
    if (labels.includes('File')) return 'File';
    return 'Unknown';
  };

  // Transform Neo4j data to 3D graph format
  const transformToGraphData = useCallback((neo4jStats: Neo4jStats): GraphData => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, string>();
    let nodeId = 1;

    // Create nodes from import graph
    const uniqueFiles = new Set<string>();
    neo4jStats.importGraph?.forEach(({ from, to }) => {
      uniqueFiles.add(from);
      uniqueFiles.add(to);
    });

    uniqueFiles.forEach((fileName) => {
      const id = String(nodeId++);
      nodeMap.set(fileName, id);

      // Determine node type based on filename patterns
      let nodeType: GraphNode['nodeType'] = 'File';
      const lowerName = fileName.toLowerCase();

      if (lowerName.includes('persona') || lowerName.includes('agent')) {
        nodeType = 'Persona';
      } else if (lowerName.includes('leak') || lowerName.includes('breach') || lowerName.includes('credential')) {
        nodeType = 'Leak';
      } else if (lowerName.includes('identity') || lowerName.includes('user')) {
        nodeType = 'Identity';
      } else if (fileName.endsWith('/') || !fileName.includes('.')) {
        nodeType = 'Directory';
      }

      nodes.push({
        id,
        label: fileName.split('/').pop() || fileName,
        labels: ['File'],
        nodeType,
        properties: { fullPath: fileName },
        color: NODE_TYPE_COLORS[nodeType],
        size: nodeType === 'Leak' ? 12 : nodeType === 'Persona' ? 10 : 6,
      });
    });

    // Create links
    neo4jStats.importGraph?.forEach(({ from, to }) => {
      const sourceId = nodeMap.get(from);
      const targetId = nodeMap.get(to);
      if (sourceId && targetId && sourceId !== targetId) {
        links.push({
          source: sourceId,
          target: targetId,
          type: 'IMPORTS',
          properties: {},
        });
      }
    });

    // If no import graph, create sample visualization from filesByType
    if (nodes.length === 0 && Object.keys(neo4jStats.filesByType || {}).length > 0) {
      const nodeTypes: GraphNode['nodeType'][] = ['Persona', 'File', 'Leak', 'Identity'];

      Object.entries(neo4jStats.filesByType).forEach(([ext, count]) => {
        const maxNodes = Math.min(count, 50);
        for (let i = 0; i < maxNodes; i++) {
          const id = String(nodeId++);
          // Distribute node types for visual variety
          const typeIdx = Math.floor(Math.random() * 100);
          let nodeType: GraphNode['nodeType'];
          if (typeIdx < 5) nodeType = 'Leak';
          else if (typeIdx < 15) nodeType = 'Persona';
          else if (typeIdx < 25) nodeType = 'Identity';
          else nodeType = 'File';

          nodes.push({
            id,
            label: `${ext.replace('.', '')}_${i}`,
            labels: ['File'],
            nodeType,
            properties: { extension: ext, index: i },
            color: NODE_TYPE_COLORS[nodeType],
            size: nodeType === 'Leak' ? 12 : nodeType === 'Persona' ? 10 : 6,
          });
        }
      });

      // Create constellation-like connections
      for (let i = 0; i < nodes.length; i++) {
        const connections = Math.floor(Math.random() * 4) + 1;
        for (let j = 0; j < connections; j++) {
          const targetIdx = Math.floor(Math.random() * nodes.length);
          if (targetIdx !== i) {
            links.push({
              source: nodes[i].id,
              target: nodes[targetIdx].id,
              type: 'CONNECTED',
              properties: {},
            });
          }
        }
      }
    }

    return { nodes, links };
  }, []);

  // Fetch graph data
  const loadGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/evolution/graph/stats');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch graph stats`);
      }

      const neo4jStats: Neo4jStats = await response.json();
      const data = transformToGraphData(neo4jStats);
      setGraphData(data);
      setStats({
        nodes: neo4jStats.totalNodes,
        relationships: neo4jStats.totalRelationships,
      });
    } catch (err) {
      console.error('Failed to load graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Neo4j');
      setGraphData({ nodes: [], links: [] });
      setStats({ nodes: 0, relationships: 0 });
    } finally {
      setLoading(false);
    }
  }, [transformToGraphData]);

  // Initial load
  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  // Handle node click
  const handleNodeClick = useCallback((node: NodeObject) => {
    const graphNode = node as GraphNode;
    setSelectedNode({
      id: graphNode.id,
      labels: graphNode.labels,
      nodeType: graphNode.nodeType,
      properties: { name: graphNode.label, ...graphNode.properties },
    });

    // Focus camera on clicked node
    if (graphRef.current) {
      const distance = 150;
      const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);
      graphRef.current.cameraPosition(
        {
          x: (node.x || 0) * distRatio,
          y: (node.y || 0) * distRatio,
          z: (node.z || 0) * distRatio,
        },
        node as { x: number; y: number; z: number },
        2000
      );
    }
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    if (graphRef.current) {
      const camera = graphRef.current.camera();
      const pos = camera.position;
      graphRef.current.cameraPosition(
        { x: pos.x * 0.7, y: pos.y * 0.7, z: pos.z * 0.7 },
        undefined,
        500
      );
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const camera = graphRef.current.camera();
      const pos = camera.position;
      graphRef.current.cameraPosition(
        { x: pos.x * 1.4, y: pos.y * 1.4, z: pos.z * 1.4 },
        undefined,
        500
      );
    }
  };

  const handleResetView = () => {
    if (graphRef.current) {
      graphRef.current.cameraPosition({ x: 0, y: 0, z: 400 }, undefined, 1000);
    }
  };

  // Custom 3D node object - Glowing spheres
  const nodeThreeObject = useCallback(
    (node: NodeObject) => {
      const graphNode = node as GraphNode;
      const color = graphNode.color || NODE_TYPE_COLORS.Unknown;
      const size = graphNode.size || 6;
      const glowIntensity = NODE_TYPE_GLOW[graphNode.nodeType] || 0.5;

      // Create group to hold sphere and glow
      const group = new THREE.Group();

      // Core sphere with emissive material
      const coreGeometry = new THREE.SphereGeometry(size, 32, 32);
      const coreMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.95,
      });
      const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
      group.add(coreMesh);

      // Inner glow layer
      const glowGeometry = new THREE.SphereGeometry(size * 1.3, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.3 * glowIntensity,
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      group.add(glowMesh);

      // Outer glow layer
      const outerGlowGeometry = new THREE.SphereGeometry(size * 2, 32, 32);
      const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.1 * glowIntensity,
      });
      const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
      group.add(outerGlowMesh);

      // Add label sprite if enabled
      if (showLabels) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = 256;
          canvas.height = 64;
          context.fillStyle = 'transparent';
          context.fillRect(0, 0, canvas.width, canvas.height);

          context.font = 'bold 24px JetBrains Mono, monospace';
          context.textAlign = 'center';
          context.textBaseline = 'middle';

          // Text glow effect
          context.shadowColor = color;
          context.shadowBlur = 10;
          context.fillStyle = color;
          context.fillText(
            graphNode.label.length > 15 ? graphNode.label.substring(0, 12) + '...' : graphNode.label,
            128,
            32
          );

          const texture = new THREE.CanvasTexture(canvas);
          const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
          });
          const sprite = new THREE.Sprite(spriteMaterial);
          sprite.scale.set(40, 10, 1);
          sprite.position.y = size * 3;
          group.add(sprite);
        }
      }

      return group;
    },
    [showLabels]
  );

  // Custom link styling
  const linkColor = useCallback((link: LinkObject) => {
    const source = link.source as GraphNode;
    const target = link.target as GraphNode;

    // Use source node color with transparency
    const sourceColor = typeof source === 'object' ? source.color : NODE_TYPE_COLORS.File;
    return sourceColor ? `${sourceColor}60` : '#22c55e40';
  }, []);

  // Background particles effect (stars)
  const backgroundParticles = useMemo(() => {
    const particles = new THREE.BufferGeometry();
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;

      // Random star colors (white, blue-ish, purple-ish)
      const colorType = Math.random();
      if (colorType < 0.6) {
        colors[i * 3] = 0.8;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 1.0;
      } else if (colorType < 0.8) {
        colors[i * 3] = 0.6;
        colors[i * 3 + 1] = 0.7;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 0.8;
        colors[i * 3 + 1] = 0.5;
        colors[i * 3 + 2] = 1.0;
      }
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return particles;
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#030308]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-purple-500/30 bg-[#0a0a15]/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <GitBranch className="w-5 h-5 text-purple-400" />
            <div className="absolute inset-0 blur-sm bg-purple-500/50" />
          </div>
          <span className="text-purple-300 font-medium tracking-wider">NEURAL GRAPH // 3D</span>
          <div className="flex items-center gap-4 text-xs text-purple-400/60">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              {stats.nodes.toLocaleString()} nodes
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              {stats.relationships.toLocaleString()} connections
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`p-2 rounded transition-colors ${
              showLabels
                ? 'bg-purple-500/30 border border-purple-400/50 text-purple-300'
                : 'hover:bg-purple-500/10 text-purple-400/60 hover:text-purple-300'
            }`}
            title="Toggle Labels"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded transition-colors ${
              autoRotate
                ? 'bg-purple-500/30 border border-purple-400/50 text-purple-300'
                : 'hover:bg-purple-500/10 text-purple-400/60 hover:text-purple-300'
            }`}
            title="Auto Rotate"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-purple-500/30 mx-1" />
          <button
            onClick={handleZoomOut}
            className="p-2 rounded hover:bg-purple-500/10 text-purple-400/60 hover:text-purple-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded hover:bg-purple-500/10 text-purple-400/60 hover:text-purple-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 rounded hover:bg-purple-500/10 text-purple-400/60 hover:text-purple-300 transition-colors"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={loadGraphData}
            disabled={loading}
            className="p-2 rounded hover:bg-purple-500/10 text-purple-400/60 hover:text-purple-300 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-3 mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Graph Container */}
      <div ref={containerRef} className="flex-1 relative min-h-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#030308]">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
                <div className="absolute inset-0 blur-xl bg-purple-500/30 animate-pulse" />
              </div>
              <span className="text-purple-400/70 tracking-wider">INITIALIZING NEURAL MESH...</span>
            </div>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#030308]">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <Database className="w-20 h-20 text-purple-500/30" />
                <div className="absolute inset-0 blur-xl bg-purple-500/10" />
              </div>
              <div>
                <p className="text-purple-400/70 mb-2">NEURAL MESH EMPTY</p>
                <p className="text-purple-500/50 text-sm">Awaiting data harvest from Neo4j</p>
              </div>
            </div>
          </div>
        ) : (
          <ForceGraph3D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height - 60}
            backgroundColor="#030308"
            nodeThreeObject={nodeThreeObject}
            nodeThreeObjectExtend={false}
            linkColor={linkColor}
            linkWidth={1}
            linkOpacity={0.4}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleColor={(link) => {
              const source = link.source as GraphNode;
              return typeof source === 'object' ? source.color || '#22c55e' : '#22c55e';
            }}
            linkDirectionalParticleSpeed={0.005}
            onNodeClick={handleNodeClick}
            onNodeHover={(node) => {
              document.body.style.cursor = node ? 'pointer' : 'default';
            }}
            cooldownTicks={100}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            warmupTicks={50}
            onEngineStop={() => {
              if (graphRef.current) {
                graphRef.current.cameraPosition({ x: 0, y: 0, z: 400 }, undefined, 0);
              }
            }}
          />
        )}

        {/* Background Stars Layer - CSS Fallback */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at center, #0a0015 0%, #030308 100%),
                radial-gradient(2px 2px at 20px 30px, #a855f7, transparent),
                radial-gradient(2px 2px at 40px 70px, #22c55e, transparent),
                radial-gradient(1px 1px at 90px 40px, #ef4444, transparent),
                radial-gradient(2px 2px at 160px 120px, #a855f7, transparent),
                radial-gradient(1px 1px at 230px 50px, #22c55e, transparent)
              `,
              backgroundSize: '100% 100%, 200px 200px, 200px 200px, 200px 200px, 200px 200px, 200px 200px',
            }}
          />
        </div>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 w-80 p-4 bg-[#0a0a15]/95 border border-purple-500/30 rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 font-medium">NODE INSPECTION</span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-purple-500/50 hover:text-purple-300 text-xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-purple-500/50">Type:</span>
              <div className="flex gap-1 mt-1">
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${NODE_TYPE_COLORS[selectedNode.nodeType as keyof typeof NODE_TYPE_COLORS] || NODE_TYPE_COLORS.Unknown}30`,
                    color: NODE_TYPE_COLORS[selectedNode.nodeType as keyof typeof NODE_TYPE_COLORS] || NODE_TYPE_COLORS.Unknown,
                    border: `1px solid ${NODE_TYPE_COLORS[selectedNode.nodeType as keyof typeof NODE_TYPE_COLORS] || NODE_TYPE_COLORS.Unknown}50`,
                  }}
                >
                  {selectedNode.nodeType}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-purple-500/20">
              <span className="text-purple-500/50">Properties:</span>
              <div className="mt-1 space-y-1 font-mono text-xs max-h-40 overflow-y-auto">
                {Object.entries(selectedNode.properties).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="text-purple-400">{key}:</span>
                    <span className="text-green-400 ml-2 truncate">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-3 bg-[#0a0a15]/90 border border-purple-500/30 rounded-lg backdrop-blur-sm">
        <div className="text-xs text-purple-300 font-bold mb-2 flex items-center gap-2 tracking-wider">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          NODE TYPES
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {Object.entries(NODE_TYPE_COLORS).slice(0, 5).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}80, 0 0 16px ${color}40`,
                }}
              />
              <span className="text-purple-400/80">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats HUD */}
      <div className="absolute top-16 left-4 p-2 bg-[#0a0a15]/80 border border-purple-500/20 rounded text-xs font-mono">
        <div className="text-purple-500/60">
          <span className="text-purple-400">FPS:</span> 60
        </div>
        <div className="text-purple-500/60">
          <span className="text-purple-400">NODES:</span> {graphData.nodes.length}
        </div>
        <div className="text-purple-500/60">
          <span className="text-purple-400">LINKS:</span> {graphData.links.length}
        </div>
      </div>
    </div>
  );
}
