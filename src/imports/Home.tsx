import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useGame } from '../context/GameContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// Theme Colors
const BG_CORK   = '#c29b70'; 
const RED       = '#b71c1c'; 
const PIN_RED   = '#E53935';
const PIN_GOLD  = '#F9A825';
const PIN_BLUE  = '#1E88E5';
const PIN_GREEN = '#43A047';
const POLA      = '#f4ece1';
const STICKY_Y  = '#F2E288';
const STICKY_B  = '#A7D4E8';
const STICKY_P  = '#ffb7b2';

interface NavNode {
  id: string; path: string; label: string; subtext: string; icon: string | JSX.Element;
  type: 'polaroid' | 'sticky' | 'map' | 'folder'; x: number; y: number; rot: number; pin: string;
  solved?: boolean; w?: number;
}

const TYPEWRITER_LINES = [
  'CASE #4471-B — OPEN',
  'SUSPECT: NEURAL GHOST X',
  'LAST SEEN: SECTOR 7 DATASET',
  'TOO MANY COINCIDENCES...',
  '...CONNECTING THE DOTS...',
];

const MAP_IMG = "https://images.unsplash.com/photo-1722888896738-393cc9724e55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwY2l0eSUyMG1hcCUyMGJsYWNrJTIwYW5kJTIwd2hpdGV8ZW58MXx8fHwxNzc3MTY2NjI5fDA&ixlib=rb-4.1.0&q=80&w=1080";

export function Home() {
  const nav = useNavigate();
  const { playerName } = useGame();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [typed, setTyped] = useState('');
  const [lineIdx, setLineIdx] = useState(0);

  // Spotlight Effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  // Typewriter animation
  useEffect(() => {
    const line = TYPEWRITER_LINES[lineIdx % TYPEWRITER_LINES.length];
    if (typed.length < line.length) {
      const t = setTimeout(() => setTyped(line.slice(0, typed.length + 1)), 50);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setTyped(''); setLineIdx(i => i + 1); }, 2000);
      return () => clearTimeout(t);
    }
  }, [typed, lineIdx]);

  // Main Interactive Navigation Nodes (Kept relatively central)
  const nodes: NavNode[] = useMemo(() => [
    { id: 'hub',       path: '/hub',        label: 'CENTRAL HUB',   subtext: 'Quick launch · ops',    icon: '🧠', type: 'sticky',   x: 48, y: 50, rot: -3, pin: PIN_RED,   solved: true },
    { id: 'map',       path: '/map',        label: 'TRAINING MAP',  subtext: 'Sector 7 Grid',         icon: <ImageWithFallback src={MAP_IMG} alt="Map" style={{width:'100%', height:'100%', objectFit:'cover', filter:'sepia(0.8) contrast(1.4) brightness(0.7)'}}/>, type: 'map', x: 26, y: 40, rot: 2,  pin: PIN_BLUE, w: 180 },
    { id: 'agency',    path: '/agency',     label: 'AGENCY ROSTER', subtext: 'Field Operatives',      icon: '🕵️', type: 'folder',   x: 72, y: 32, rot: -6, pin: PIN_GOLD,  solved: true },
    { id: 'market',    path: '/market',     label: 'BLACK MARKET',  subtext: 'Acquire Assets',        icon: '🔦', type: 'polaroid', x: 65, y: 72, rot: 5,  pin: PIN_GOLD  },
    { id: 'ranks',     path: '/leaderboard',label: 'CASE FILES',    subtext: 'Global Standings',      icon: '📁', type: 'sticky',   x: 85, y: 58, rot: 3,  pin: PIN_GOLD  },
    { id: 'pvp',       path: '/pvp',        label: 'PVP ARENA',     subtext: 'Inter-agency Skirmish', icon: '⚔️', type: 'polaroid', x: 32, y: 75, rot: -8, pin: PIN_GREEN  },
  ], []);

  // HYPER-DENSE Static Background Decor
  const decorItems = useMemo(() => [
    { id: 'd1',  type: 'newspaper',  x: 12, y: 18, rot: -12 },
    { id: 'd2',  type: 'suspect',    x: 88, y: 16, rot: 8,  icon: '👤', text: 'Suspect?' },
    { id: 'd3',  type: 'note_p',     x: 82, y: 82, rot: -5, text: "WHO IS X?" },
    { id: 'd4',  type: 'redacted',   x: 14, y: 85, rot: 6 },
    { id: 'd5',  type: 'torn',       x: 45, y: 15, rot: 3,  text: "55-291-0" },
    { id: 'd6',  type: 'suspect',    x: 58, y: 18, rot: -4, icon: '🚗', text: 'Getaway?' },
    { id: 'd7',  type: 'blueprint',  x: 50, y: 45, rot: -1, z: 2 }, // Background centerpiece behind nodes
    { id: 'd8',  type: 'note_y',     x: 20, y: 60, rot: 15, text: "CHECK ACCOUNTS" },
    { id: 'd9',  type: 'newspaper2', x: 88, y: 38, rot: -4 },
    { id: 'd10', type: 'torn',       x: 35, y: 22, rot: -20, text: "LIE." },
    { id: 'd11', type: 'note_b',     x: 78, y: 20, rot: 12, text: "Missing at 22:00" },
    { id: 'd12', type: 'suspect',    x: 10, y: 45, rot: 5,  icon: '🩸', text: 'Evidence A' },
    { id: 'd13', type: 'redacted2',  x: 55, y: 88, rot: -7 },
    { id: 'd14', type: 'note_y',     x: 38, y: 88, rot: 4, text: "HE KNOWS." },
  ], []);

  // CHAOTIC Red String Web
  const stringPaths = useMemo(() => {
    // We define a bunch of connections to make it look like a madman's web
    const points: Record<string, { x: number; y: number }> = {
      hub: { x: 48, y: 46 }, map: { x: 26, y: 36 }, agency: { x: 72, y: 28 },
      market: { x: 65, y: 68 }, pvp: { x: 32, y: 71 }, ranks: { x: 85, y: 54 },
      d1: { x: 12, y: 14 }, d2: { x: 88, y: 12 }, d3: { x: 82, y: 78 },
      d4: { x: 14, y: 80 }, d5: { x: 45, y: 15 }, d6: { x: 58, y: 14 },
      d8: { x: 20, y: 56 }, d10: { x: 35, y: 22 }, d11: { x: 78, y: 16 }, d12: { x: 10, y: 41 }
    };

    const connections = [
      ['hub', 'map'], ['hub', 'agency'], ['hub', 'market'], ['hub', 'pvp'], ['hub', 'ranks'],
      ['map', 'd1'], ['map', 'd10'], ['map', 'd8'], ['map', 'd12'],
      ['agency', 'd2'], ['agency', 'd6'], ['agency', 'd11'],
      ['ranks', 'd9'], ['ranks', 'd3'], ['ranks', 'd2'],
      ['market', 'd3'], ['market', 'hub'],
      ['pvp', 'd4'], ['pvp', 'd8'],
      ['d5', 'hub'], ['d6', 'd5'], ['d10', 'd5'], ['d8', 'd12'], ['d1', 'd12']
    ];
    
    return connections.map(([start, end], i) => {
      const s = points[start];
      const e = points[end];
      if(!s || !e) return null;
      // Calculate a slight curve for gravity/sag
      const midX = (s.x + e.x) / 2;
      const sag = Math.abs(s.x - e.x) > 30 ? 6 : 2; // Longer strings sag more
      const midY = (s.y + e.y) / 2 + sag; 
      return { id: `path-${i}`, d: `M ${s.x} ${s.y} Q ${midX} ${midY} ${e.x} ${e.y}` };
    }).filter(Boolean);
  }, []);

  return (
    <div 
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative', width: '100%', minHeight: 'calc(100vh - 110px)',
        overflow: 'hidden', fontFamily: "'Courier New', monospace",
        backgroundColor: BG_CORK,
      }}
    >
      {/* Realistic Corkboard Texture */}
      <div style={{ 
        position:'absolute', inset:0, opacity:0.85, 
        backgroundImage:`radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)`,
        backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px',
        pointerEvents:'none' 
      }} />
      <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 0 150px rgba(0,0,0,0.95)', pointerEvents:'none' }} />
      
      {/* Dynamic Flashlight/Spotlight */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', zIndex:40,
        background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, transparent 10%, rgba(0,0,0,0.85) 60%)` 
      }} />

      {/* Case Board Header */}
      <div style={{
        position:'absolute', top: 20, left: 30,
        background: '#e8e0d5', padding: '10px 15px', transform: 'rotate(-2deg)',
        boxShadow: '2px 4px 10px rgba(0,0,0,0.5)', zIndex: 12, borderLeft: '6px solid #8b0000', fontFamily: 'sans-serif'
      }}>
        <Tape />
        <div style={{ fontSize:10, fontWeight:900, color:'#8b0000', letterSpacing: 1 }}>DOSSIER: CLASSIFIED</div>
        <div style={{ fontSize:18, fontWeight:900, color:'#1a1a1a', textTransform: 'uppercase' }}>AGENT: {playerName || 'UNKNOWN'}</div>
      </div>

      {/* STATIC DECOR LAYER (Background props) */}
      <div style={{ position:'absolute', inset:0, zIndex:5, pointerEvents:'none' }}>
        {decorItems.map((item) => (
          <div key={item.id} style={{
            position: 'absolute', left: `${item.x}%`, top: `${item.y}%`,
            transform: `translate(-50%, -50%) rotate(${item.rot}deg)`,
            zIndex: item.z || 5
          }}>
            {item.type === 'blueprint' && (
              <div style={{ width: 450, height: 300, background: '#1c3d5a', border: '2px solid #fff', opacity: 0.6, padding: 10, backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                 <Tape style={{top:-10, left:'10%'}}/><Tape style={{top:-10, left:'90%'}}/>
                 <Tape style={{bottom:-10, left:'10%', transform:'rotate(10deg)'}}/><Tape style={{bottom:-10, left:'90%', transform:'rotate(-10deg)'}}/>
                 <h2 style={{color:'#fff', fontFamily:'sans-serif', margin:0, opacity:0.5}}>SECTOR 7 SCHEMATIC</h2>
              </div>
            )}
            {item.type === 'newspaper' && (
              <div style={{ 
                background: '#e0dcd3', 
                padding: 12, 
                width: 130, 
                fontSize: 7, 
                color: '#222', 
                boxShadow: '2px 3px 6px rgba(0,0,0,0.4)', 
                clipPath: 'polygon(0% 0%, 100% 0%, 98% 10%, 100% 20%, 97% 30%, 100% 40%, 98% 50%, 100% 60%, 97% 70%, 100% 80%, 98% 90%, 100% 100%, 0% 100%, 2% 90%, 0% 80%, 3% 70%, 0% 60%, 2% 50%, 0% 40%, 3% 30%, 0% 20%, 2% 10%)',
                filter: 'sepia(0.2) contrast(1.05)',
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
                backgroundSize: '2px 2px',
                position: 'relative'
              }}>
                <RealisticPin color={PIN_BLUE} />
                <strong style={{fontSize:11, borderBottom:'2px solid #333', display:'block', marginBottom:4, fontFamily: 'Times New Roman, serif'}}>LOCAL HEIST</strong>
                <div style={{fontFamily: 'Times New Roman, serif', lineHeight: 1.4}}>
                  Authorities remain baffled after the sudden disappearance of the artifact from the museum vault...
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 10,
                  width: 20,
                  height: 8,
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%)',
                  filter: 'blur(2px)',
                  pointerEvents: 'none'
                }} />
              </div>
            )}
            {item.type === 'newspaper2' && (
              <div style={{ 
                background: '#e0dcd3', 
                padding: 10, 
                width: 100, 
                fontSize: 6, 
                color: '#222', 
                boxShadow: '2px 3px 6px rgba(0,0,0,0.4)', 
                clipPath: 'polygon(0% 0%, 95% 5%, 100% 100%, 5% 95%)',
                filter: 'sepia(0.15) contrast(1.08)',
                fontFamily: 'Times New Roman, serif',
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
                backgroundSize: '2px 2px'
              }}>
                <Tape />
                <strong style={{fontSize:9, display:'block', marginBottom:2, fontFamily: 'Times New Roman, serif'}}>COVER UP?</strong>
                <div style={{lineHeight: 1.3}}>
                  City officials deny all allegations regarding the sub-level labs and missing personnel...
                </div>
              </div>
            )}
            {item.type === 'suspect' && (
              <div style={{ 
                background: POLA, 
                padding: '6px 6px 20px 6px', 
                width: 80, 
                boxShadow: '2px 3px 6px rgba(0,0,0,0.4)',
                filter: 'sepia(0.3) contrast(1.1)',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '4px 4px'
              }}>
                <RealisticPin color={PIN_RED} />
                <div style={{ 
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                  height: 70, 
                  display: 'flex', 
                  alignItems:'center', 
                  justifyContent:'center', 
                  color:'#888',
                  fontSize: 32,
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  letterSpacing: 2,
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  border: '1px solid #333',
                  position: 'relative'
                }}>
                  ?
                </div>
                <div style={{ 
                  textAlign:'center', 
                  marginTop: 5, 
                  fontSize: 9, 
                  fontFamily: 'Courier New, monospace', 
                  color: '#8b0000',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: 1
                }}>{item.text}</div>
              </div>
            )}
            {(item.type === 'note_p' || item.type === 'note_y' || item.type === 'note_b') && (
              <div style={{ 
                background: item.type === 'note_p' ? STICKY_P : item.type === 'note_y' ? STICKY_Y : STICKY_B, 
                padding: 10, 
                width: 90, 
                height: 90, 
                boxShadow: '2px 3px 6px rgba(0,0,0,0.4)', 
                fontFamily: '"Courier New", monospace', 
                fontSize: 11, 
                color: '#111', 
                display:'flex', 
                alignItems:'center', 
                justifyContent:'center', 
                textAlign:'center',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: 1,
                lineHeight: 1.3,
                filter: 'contrast(1.1)',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                backgroundSize: '3px 3px',
                position: 'relative'
              }}>
                <RealisticPin color={item.type === 'note_b' ? PIN_BLUE : PIN_GREEN} />
                <div style={{
                  position: 'absolute',
                  bottom: 5,
                  right: 5,
                  width: 25,
                  height: 25,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(139, 69, 19, 0.12) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} />
                {item.text}
              </div>
            )}
            {item.type === 'torn' && (
              <div style={{ 
                background: '#f5f5f0', 
                padding: '6px 12px', 
                fontSize: 16, 
                fontFamily: '"Courier New", monospace', 
                color: '#8b0000', 
                fontWeight: 'bold', 
                boxShadow: '1px 2px 4px rgba(0,0,0,0.3)', 
                clipPath: 'polygon(0% 10%, 100% 0%, 90% 100%, 5% 90%)',
                filter: 'sepia(0.1) contrast(1.15)',
                textTransform: 'uppercase',
                letterSpacing: 2,
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
                backgroundSize: '3px 3px',
                position: 'relative'
              }}>
                <Tape />
                <div style={{
                  position: 'absolute',
                  top: 5,
                  right: 8,
                  width: 15,
                  height: 15,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(139, 0, 0, 0.08) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} />
                {item.text}
              </div>
            )}
            {(item.type === 'redacted' || item.type === 'redacted2') && (
              <div style={{ 
                background: '#f8f6f0', 
                padding: 12, 
                width: 130, 
                fontSize: 8, 
                fontFamily: '"Courier New", monospace', 
                boxShadow: '2px 3px 6px rgba(0,0,0,0.4)',
                filter: 'sepia(0.05) contrast(1.05)',
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
                backgroundSize: '2px 2px',
                position: 'relative'
              }}>
                <Tape />
                <h4 style={{margin:'0 0 5px 0', fontSize: 9, fontFamily: '"Courier New", monospace', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #333', paddingBottom: 2}}>INCIDENT REPORT</h4>
                <div style={{lineHeight: 1.5}}>
                  Subject <span style={{background:'#111', color:'#111', padding: '0 2px', letterSpacing: 1}}>███████</span> was seen entering the facility at <span style={{background:'#111', color:'#111', padding: '0 2px', letterSpacing: 1}}>██:██</span> hours. <span style={{background:'#111', color:'#111', padding: '0 2px', letterSpacing: 1}}>Clearance denied.</span>
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 15,
                  right: 10,
                  border: '2px solid #8b0000',
                  color: '#8b0000',
                  padding: '2px 4px',
                  fontSize: 6,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  transform: 'rotate(-15deg)',
                  opacity: 0.7,
                  fontFamily: '"Courier New", monospace'
                }}>
                  CLASSIFIED
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* THE RED STRINGS (Dense Web) */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{
        position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:8,
      }}>
        <filter id="string-shadow"><feDropShadow dx="1" dy="3" stdDeviation="2" floodOpacity="0.6"/></filter>
        {stringPaths.map((line: any, i: number) => (
          <React.Fragment key={i}>
            <path
              d={line.d} fill="none" stroke="#400" strokeWidth="0.3"
            />
            <path
              d={line.d} fill="none" stroke={RED} strokeWidth="0.15" filter="url(#string-shadow)"
            />
          </React.Fragment>
        ))}
      </svg>

      {/* INTERACTIVE NODES LAYER */}
      <div style={{ position:'absolute', inset:0, zIndex:10 }}>
        {nodes.map(node => (
          <NodeComponent
            key={node.id}
            node={node}
            isHovered={hoveredNode === node.id}
            onHover={() => setHoveredNode(node.id)}
            onLeave={() => setHoveredNode(null)}
            onClick={() => nav(node.path)}
          />
        ))}
      </div>

      {/* Terminal Footer */}
      <div style={{
        position:'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.9)', padding: '12px 24px', border: '1px solid #333',
        color: '#0f0', fontSize: 13, borderRadius: 4, zIndex: 45, width: 350,
        boxShadow: '0 0 15px rgba(0,255,0,0.1)'
      }}>
        &gt; {typed}<span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}

function NodeComponent({ node, isHovered, onHover, onLeave, onClick }: any) {
  const useTape = node.type === 'polaroid' || node.type === 'folder';

  return (
    <motion.div
      onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}
      style={{
        position: 'absolute', left: `${node.x}%`, top: `${node.y}%`,
        cursor: 'pointer', zIndex: isHovered ? 50 : 10,
        originX: 0.5, originY: 0.5,
      }}
      initial={{ x: '-50%', y: '-50%', rotate: node.rot, scale: 1 }}
      whileHover={{ 
        scale: 1.15, 
        rotate: 0, 
        boxShadow: '0 20px 40px rgba(139, 0, 0, 0.5)',
        zIndex: 50 
      }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
    >
      {useTape ? <Tape /> : <RealisticPin color={node.pin} />}
      
      <div style={{
        background: node.type === 'polaroid' ? POLA : node.type === 'sticky' ? (node.id === 'hub' ? STICKY_Y : STICKY_B) : '#d4c09b',
        padding: node.type === 'polaroid' ? '10px 10px 28px 10px' : '12px',
        boxShadow: '3px 6px 15px rgba(0,0,0,0.6)',
        width: node.w || 120,
        borderRadius: node.type === 'sticky' ? '0 0 12px 0' : '2px',
        border: '3px solid #8b0000',
        position: 'relative',
        fontFamily: 'sans-serif'
      }}>
        {/* Inner highlight border for clickable nodes */}
        <div style={{
          position: 'absolute', inset: 2, border: '1px dashed rgba(139, 0, 0, 0.4)', pointerEvents: 'none',
          borderRadius: node.type === 'sticky' ? '0 0 10px 0' : '1px'
        }} />
        {node.type === 'map' ? (
          <div style={{ height: 80, overflow: 'hidden', background: '#000', marginBottom: 8, border: '1px solid #999' }}>
            {node.icon}
          </div>
        ) : (
          <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 8, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' }}>{node.icon}</div>
        )}
        <div style={{ fontSize: 11, fontWeight: 900, color: '#1a1a1a', textAlign:'center', letterSpacing: 0.5 }}>{node.label}</div>
        <div style={{ fontSize: 9, color: '#555', textAlign:'center', marginTop: 2 }}>{node.subtext}</div>
      </div>

      {node.solved && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)',
          border: '3px solid #b71c1c', color: '#b71c1c', padding: '2px 6px', fontWeight: 900, fontSize: 16,
          opacity: 0.9, pointerEvents: 'none', textTransform: 'uppercase', fontFamily: "'Courier New', monospace",
          background: 'rgba(255,255,255,0.7)'
        }}>RESOLVED</div>
      )}
    </motion.div>
  );
}

function RealisticPin({ color }: { color: string }) {
  return (
    <div style={{ 
      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', 
      zIndex: 60 
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, #fff 0%, ${color} 60%, #000 100%)`,
        boxShadow: '2px 4px 6px rgba(0,0,0,0.7)'
      }} />
      <div style={{ width: 2, height: 8, background: '#777', margin: '0 auto', marginTop: -2, boxShadow: '1px 1px 2px rgba(0,0,0,0.6)' }} />
    </div>
  );
}

function Tape({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotate(-4deg)',
      width: 50, height: 16, background: 'rgba(255,255,255,0.4)',
      borderLeft: '2px dashed rgba(0,0,0,0.15)', borderRight: '2px dashed rgba(0,0,0,0.15)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)', zIndex: 60, ...style
    }} />
  );
}

export default Home;