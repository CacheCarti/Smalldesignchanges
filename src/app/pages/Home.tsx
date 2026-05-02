import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// Noir Dark Theme
const BG_DARK   = '#141414';
const BG_MID    = '#1F1A17';
const BG_LIGHT  = '#2A2421';

const RED       = '#D32F2F'; // Vibrant string red
const PIN_RED   = '#E53935';
const PIN_GOLD  = '#F9A825';
const PIN_BLUE  = '#1E88E5';
const PIN_GREEN = '#43A047';
const POLA      = '#f4ece1'; // Aged white paper
const STICKY_Y  = '#F2E288';
const STICKY_B  = '#A7D4E8';

interface NavNode {
  id: string; path: string; label: string; subtext: string; icon: string | JSX.Element;
  type: 'polaroid' | 'sticky' | 'map' | 'folder'; x: number; y: number; rot: number; pin: string;
  solved?: boolean; w?: number;
}

const TYPEWRITER_LINES = [
  'CASE #4471-B — OPEN',
  'SUSPECT: NEURAL GHOST X',
  'LAST SEEN: SECTOR 7 DATASET',
  '...PROCEED WITH CAUTION...',
];

const MAP_IMG = "https://images.unsplash.com/photo-1722888896738-393cc9724e55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwY2l0eSUyMG1hcCUyMGJsYWNrJTIwYW5kJTIwd2hpdGV8ZW58MXx8fHwxNzc3MTY2NjI5fDA&ixlib=rb-4.1.0&q=80&w=1080";

export function Home() {
  const nav = useNavigate();
  const { playerName } = useGame();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [lineIdx, setLineIdx] = useState(0);

  // Typewriter animation
  useEffect(() => {
    const line = TYPEWRITER_LINES[lineIdx % TYPEWRITER_LINES.length];
    if (typed.length < line.length) {
      const t = setTimeout(() => setTyped(line.slice(0, typed.length + 1)), 65);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setTyped(''); setLineIdx(i => i + 1); }, 2200);
      return () => clearTimeout(t);
    }
  }, [typed, lineIdx]);

  const nodes: NavNode[] = useMemo(() => [
    { id: 'hub',       path: '/hub',        label: 'CENTRAL HUB',   subtext: 'Quick launch · ops',    icon: '🧠', type: 'sticky',   x: 48, y: 50, rot: -3, pin: PIN_RED,   solved: true },
    { id: 'map',       path: '/map',        label: 'TRAINING MAP',  subtext: 'Sector 7 Grid',         icon: <ImageWithFallback src={MAP_IMG} alt="Map" style={{width:'100%', height:'100%', objectFit:'cover', filter:'sepia(0.6) contrast(1.2) brightness(0.9)', opacity: 0.85}}/>, type: 'map', x: 26, y: 38, rot: 2,  pin: PIN_BLUE, w: 180 }, // smaller map width 180 instead of huge
    { id: 'agency',    path: '/agency',     label: 'AGENCY ROSTER', subtext: 'Field Operatives',      icon: '🕵️', type: 'folder',   x: 75, y: 32, rot: -6, pin: PIN_GOLD,  solved: true },
    { id: 'market',    path: '/market',     label: 'BLACK MARKET',  subtext: 'Acquire Assets',        icon: '🔦', type: 'polaroid', x: 74, y: 72, rot: 5,  pin: PIN_GOLD  },
    { id: 'ranks',     path: '/leaderboard',label: 'CASE FILES',    subtext: 'Global Standings',      icon: '📁', type: 'sticky',   x: 85, y: 52, rot: 3,  pin: PIN_GOLD  },
    { id: 'pvp',       path: '/pvp',        label: 'PVP ARENA',     subtext: 'Inter-agency Skirmish', icon: '⚔️', type: 'polaroid', x: 32, y: 74, rot: -4, pin: PIN_GREEN  },
  ], []);

  // Complex red string web (more realistic criss-cross)
  const stringPaths = useMemo(() => {
    const hub = { x: 48, y: 50 };
    const targets: Record<string, { x: number; y: number }> = {
      map: { x: 26, y: 38 }, agency: { x: 75, y: 32 },
      market: { x: 74, y: 72 }, pvp: { x: 32, y: 74 }, ranks: { x: 85, y: 52 }
    };
    
    // Main paths from hub
    const paths = Object.keys(targets).map(id => {
      const t = targets[id];
      const cx = (hub.x + t.x) / 2 + (Math.random() * 6 - 3);
      const cy = (hub.y + t.y) / 2 + (Math.random() * 6 - 3);
      return { id, d: `M ${hub.x} ${hub.y} Q ${cx} ${cy} ${t.x} ${t.y}`, targetId: id };
    });

    // Cross connections to make it look like a real web
    paths.push({ id: 'map-pvp', d: `M 26 38 Q 28 56 32 74`, targetId: 'map' });
    paths.push({ id: 'agency-market', d: `M 75 32 Q 80 52 74 72`, targetId: 'agency' });
    paths.push({ id: 'map-agency', d: `M 26 38 Q 50 30 75 32`, targetId: 'map' });

    return paths;
  }, []);

  return (
    <div style={{
      position: 'relative', width: '100%', minHeight: 'calc(100vh - 110px)',
      overflow: 'hidden', fontFamily: "'Courier New', monospace",
      background: `linear-gradient(135deg, ${BG_DARK} 0%, ${BG_MID} 50%, ${BG_DARK} 100%)`,
      boxShadow: 'inset 0 0 160px rgba(0,0,0,0.95)',
    }}>
      {/* Dark Board Texture */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.18 }}>
        <filter id="cork-noise-dark"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" result="noise" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#cork-noise-dark)" />
      </svg>
      {/* Grid Lines faint */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />

      {/* Vignette */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 100%)', pointerEvents:'none', zIndex:5 }} />

      {/* Coffee Stain 1 */}
      <div style={{
        position:'absolute', top:'12%', right:'18%', width:90, height:90,
        borderRadius:'50%', border:'3px solid rgba(100,55,20,0.45)',
        boxShadow:'0 0 0 6px rgba(100,55,20,0.15), inset 0 0 20px rgba(100,55,20,0.25)',
        background:'radial-gradient(circle, rgba(100,55,20,0.1) 0%, transparent 70%)',
        transform:'rotate(-12deg) scale(1,0.85)', pointerEvents:'none', zIndex:1,
      }} />

      {/* Torn newspaper clipping */}
      <div style={{
        position:'absolute', top:'8%', left:'45%', width:140, height:65,
        background:'#d9cfc1', transform:'rotate(3deg)', pointerEvents:'none', zIndex:2,
        boxShadow:'3px 4px 10px rgba(0,0,0,0.6)', border:'1px solid rgba(0,0,0,0.1)',
        clipPath:'polygon(0 0, 100% 2%, 98% 100%, 2% 97%)',
      }}>
        <div style={{ padding:'8px 10px', fontSize:6.5, color:'#2a2a2a', fontFamily:"'Courier New', monospace", lineHeight:1.5, opacity:0.9 }}>
          <span style={{ fontSize:10, fontWeight:900, display:'block', marginBottom:2, borderBottom:'1px solid #2a2a2a' }}>THE OBSERVER</span>
          Neural anomaly in Sector 7 linked to missing agents.<br/>"We are not alone," says rogue synth.
        </div>
      </div>

      {/* Typewriter block */}
      <div style={{
        position:'absolute', bottom:'10%', left:'40%', width:220,
        background:'rgba(10,10,10,0.85)', border:'1px solid #4a3a2a',
        padding:'10px 14px', borderRadius:2, zIndex:3, pointerEvents:'none',
        boxShadow:'0 6px 16px rgba(0,0,0,0.7), inset 0 0 10px rgba(0,0,0,0.8)',
      }}>
        <div style={{ fontSize:9, color:'#C62828', letterSpacing:'0.2em', marginBottom:4, fontWeight:900 }}>[ TERMINAL UPLINK ]</div>
        <div style={{ fontSize:11, color:'#e0e0e0', fontFamily:"'Courier New', monospace", minHeight:16 }}>
          {typed}<span style={{ animation:'blink 0.8s step-end infinite', color:'#C62828' }}>_</span>
        </div>
      </div>

      {/* Case board header Sticky */}
      <div style={{
        position:'absolute', top:22, left:32,
        background: STICKY_Y, padding:'10px 18px', transform:'rotate(-2deg)',
        boxShadow:'3px 5px 14px rgba(0,0,0,0.6), -1px -1px 0 rgba(255,255,255,0.4)',
        borderRadius:2, zIndex:12, minWidth:160,
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)',
        backgroundSize: '100% 16px',
      }}>
        <RealisticPin color={PIN_RED} />
        <div style={{ fontSize:9, fontWeight:900, color:'#5a4a3a', letterSpacing:'0.2em', marginBottom:4, marginTop:8 }}>PRIMARY DOSSIER</div>
        <div style={{ fontSize:18, fontWeight:900, color:'#1a1a1a', letterSpacing:'-0.03em', lineHeight:1 }}>
          DET. {(playerName || 'GHOST').toUpperCase()}
        </div>
        <div style={{ fontSize:9, color:'#C62828', fontWeight:900, marginTop:4, letterSpacing:'0.1em' }}>
          ██ RESTRICTED ██
        </div>
      </div>

      {/* Red Strings Layer */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{
        position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:4,
      }}>
        <defs>
          <filter id="string-glow"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor={RED} floodOpacity="0.4" /><feDropShadow dx="0.5" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.7" /></filter>
        </defs>
        {stringPaths.map((line, i) => {
          const isActive = hoveredNode === line.targetId || hoveredNode === 'hub' || hoveredNode === line.id.split('-')[1];
          return (
            <motion.path
              key={i}
              d={line.d}
              fill="none"
              stroke={RED}
              strokeWidth={isActive ? '0.6' : '0.35'}
              opacity={isActive ? 1 : 0.7}
              strokeLinecap="round"
              filter="url(#string-glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: isActive ? 1 : 0.7 }}
              transition={{ duration: 1.2, delay: i * 0.1, ease: 'easeOut' }}
            />
          );
        })}
      </svg>

      {/* Nodes Layer */}
      <div style={{ position:'absolute', inset:0, zIndex:6 }}>
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

      <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>
    </div>
  );
}

function NodeComponent({ node, isHovered, onHover, onLeave, onClick }: {
  node: NavNode; isHovered: boolean; onHover: () => void; onLeave: () => void; onClick: () => void;
}) {
  return (
    <motion.div
      onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      whileHover={{ scale: 1.05, zIndex: 20 }}
      style={{
        position: 'absolute', left: `${node.x}%`, top: `${node.y}%`,
        transform: `translate(-50%, -50%) rotate(${node.rot}deg)`,
        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
        zIndex: isHovered ? 20 : 8,
      }}
    >
      <RealisticPin color={node.pin} />

      {node.type === 'map' && (
        <motion.div
          animate={{ boxShadow: isHovered ? '4px 10px 25px rgba(0,0,0,0.8), 0 0 15px rgba(211,47,47,0.3)' : '3px 8px 18px rgba(0,0,0,0.6)' }}
          style={{
            background: '#e0d8c8', padding: '6px',
            borderRadius: 2, width: node.w || 140,
            border: '1px solid rgba(0,0,0,0.2)',
          }}>
          <div style={{
            width: '100%', height: 90,
            background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.7)', position:'relative', overflow:'hidden',
          }}>
            {node.icon}
            {/* Map Grid overlay */}
            <div style={{position:'absolute', inset:0, background:'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize:'15px 15px', pointerEvents:'none'}} />
            {/* Target Reticle */}
            <div style={{position:'absolute', top:'40%', left:'60%', width:16, height:16, border:'1.5px solid #D32F2F', borderRadius:'50%', pointerEvents:'none', boxShadow:'0 0 5px rgba(0,0,0,0.8)'}} />
            <div style={{position:'absolute', top:'40%', left:'60%', width:4, height:4, background:'#D32F2F', borderRadius:'50%', transform:'translate(6px, 6px)', pointerEvents:'none'}} />
          </div>
          <div style={{
            fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: 900,
            marginTop: 6, color: '#1a1a1a', letterSpacing: '0.04em', textAlign: 'center',
          }}>{node.label}</div>
          <div style={{ fontSize: 8, color: '#666', textAlign: 'center', marginTop: 2, lineHeight: 1.3 }}>
            {node.subtext}
          </div>
        </motion.div>
      )}

      {node.type === 'folder' && (
        <motion.div
          animate={{ boxShadow: isHovered ? '4px 10px 25px rgba(0,0,0,0.8)' : '3px 8px 18px rgba(0,0,0,0.6)' }}
          style={{
            background: '#D4C09B', // Manila Folder Base
            padding: '12px 14px',
            borderRadius: '2px 8px 2px 2px', width: node.w || 120,
            border: '1px solid #B09B7A', borderTop:'none',
            position:'relative',
          }}>
          {/* Folder Tab */}
          <div style={{
            position:'absolute', top:-10, left:-1, width:'45%', height:10,
            background:'#D4C09B', border:'1px solid #B09B7A', borderBottom:'none',
            borderRadius:'4px 6px 0 0',
          }} />
          {/* Inside papers sticking out */}
          <div style={{ position:'absolute', top:2, right:8, width:20, height:30, background:'#fff', transform:'rotate(12deg)', zIndex:-1, border:'1px solid #ccc', boxShadow:'1px 1px 3px rgba(0,0,0,0.2)' }} />
          
          <div style={{ fontSize: 32, marginBottom: 8, textAlign:'center', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>{node.icon}</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#312311', fontFamily: "'Courier New', monospace", letterSpacing: '0.04em', textAlign:'center', borderBottom:'1px solid rgba(0,0,0,0.1)', paddingBottom:4 }}>{node.label}</div>
          <div style={{ fontSize: 8, color: '#5C4A33', marginTop: 4, lineHeight: 1.3, textAlign:'center' }}>{node.subtext}</div>
          
          <div style={{position:'absolute', bottom:6, right:8, fontSize:8, color:'#D32F2F', fontWeight:900, border:'1px solid #D32F2F', padding:'1px 3px', transform:'rotate(-8deg)', opacity:0.8}}>TOP SECRET</div>
        </motion.div>
      )}

      {node.type === 'polaroid' && (
        <motion.div
          animate={{ boxShadow: isHovered ? '4px 10px 25px rgba(0,0,0,0.8)' : '3px 6px 16px rgba(0,0,0,0.6)' }}
          style={{
            background: POLA, padding: '7px 7px 24px 7px',
            borderRadius: 2, width: node.w || 110,
            border: '1px solid rgba(0,0,0,0.15)',
          }}>
          <div style={{
            width: '100%', height: 75,
            background: 'linear-gradient(135deg, #111 0%, #1a1a2e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.8)',
          }}>
            {node.icon}
          </div>
          <div style={{
            fontFamily: "'Courier New', monospace", fontSize: 10, fontWeight: 900,
            marginTop: 8, color: '#1a1a1a', letterSpacing: '0.04em', textAlign: 'center',
          }}>{node.label}</div>
          <div style={{ fontSize: 7.5, color: '#666', textAlign: 'center', marginTop: 2, lineHeight: 1.3 }}>
            {node.subtext}
          </div>
        </motion.div>
      )}

      {node.type === 'sticky' && (
        <motion.div
          animate={{ boxShadow: isHovered ? '3px 8px 20px rgba(0,0,0,0.7)' : '2px 5px 12px rgba(0,0,0,0.5)' }}
          style={{
            background: node.id === 'hub' ? STICKY_Y : STICKY_B, padding: '10px 14px',
            borderRadius: '1px 1px 8px 2px', minWidth: 100, maxWidth: 120,
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
            backgroundSize: '100% 16px', border:'1px solid rgba(0,0,0,0.05)'
          }}>
          <div style={{ fontSize: 24, marginBottom: 6, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))', textAlign:'center' }}>{node.icon}</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#2a1a08', fontFamily: "'Courier New', monospace", letterSpacing: '0.02em', textAlign:'center', lineHeight:1.2 }}>{node.label}</div>
          <div style={{ fontSize: 8, color: '#5a3e20', marginTop: 4, lineHeight: 1.3, textAlign:'center' }}>{node.subtext}</div>
        </motion.div>
      )}

      <AnimatePresence>
        {node.solved && (
          <motion.div
            initial={{ scale: 2.5, opacity: 0, rotate: -25 }}
            animate={{ scale: 1, opacity: 0.9, rotate: -15 }}
            style={{
              position: 'absolute', bottom: node.type === 'polaroid' ? 16 : -2, right: -12,
              border: '2.5px solid #D32F2F', color: '#D32F2F',
              padding: '2px 8px', fontSize: 10, fontWeight: 900,
              transform: 'rotate(-15deg)', borderRadius: 3,
              fontFamily: "'Courier New', monospace", pointerEvents: 'none',
              background: 'rgba(255,255,255,0.95)', boxShadow:'0 2px 5px rgba(0,0,0,0.3)'
            }}
          >SOLVED</motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RealisticPin({ color }: { color: string }) {
  return (
    <div style={{ position: 'relative', width: 16, height: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 15, marginBottom: -6 }}>
      {/* Pin head */}
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, #fff 0%, ${color} 40%, #000 100%)`,
        boxShadow: `0 3px 6px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.3), inset 0 -1px 3px rgba(0,0,0,0.4)`,
        position: 'relative', zIndex: 2,
      }} />
      {/* Pin needle */}
      <div style={{
        width: 2, height: 10, marginTop: -2,
        background: 'linear-gradient(90deg, #999 0%, #eee 50%, #666 100%)',
        boxShadow: '1px 1px 2px rgba(0,0,0,0.6)',
        zIndex: 1, borderRadius: '0 0 2px 2px',
      }} />
      {/* Shadow on board */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-30%)',
        width: 10, height: 4, borderRadius: '50%',
        background: 'rgba(0,0,0,0.5)', filter: 'blur(1.5px)',
      }} />
    </div>
  );
}

export default Home;
