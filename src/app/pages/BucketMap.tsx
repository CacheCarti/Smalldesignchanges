import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useGame } from '../context/GameContext';
import { generateBucketMap, MapNode, MAP_NODE_CONFIG } from '../data/cards';
import { motion } from 'motion/react';

const BG_DARK   = '#141414';
const BG_MID    = '#1F1A17';
const CORK      = BG_MID;
const CORK_DARK = BG_DARK;
const POLA      = '#f5ede0';
const MANILLA   = '#D5BCA4';
const RED       = '#D32F2F';
const FONT      = "'Courier New', monospace";

const ROW_H = 128;

export function BucketMap() {
  const { currentMapNodeId, setCurrentMapNodeId } = useGame();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const nodes = useMemo(() => generateBucketMap(), []);
  const maxRow = Math.max(...nodes.map(n => n.y));

  const go = (node: MapNode) => {
    if (node.state === 'locked') return;
    setCurrentMapNodeId(node.id);
    switch (node.type) {
      case 'subset': case 'elite': case 'boss': case 'dojo': navigate('/loadout'); break;
      case 'market':    navigate('/market'); break;
      case 'miner':     navigate('/dispatch'); break;
      case 'benchmark': navigate('/leaderboard'); break;
    }
  };

  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <div style={{
      minHeight:'100vh',
      background:`linear-gradient(135deg, ${BG_DARK} 0%, ${BG_MID} 50%, ${BG_DARK} 100%)`,
      fontFamily:FONT, position:'relative', overflow:'hidden', padding:'0 0 40px',
    }}>
      {/* Cork grain */}
      <svg style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.12, zIndex:0 }}>
        <filter id="map-noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="n" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#map-noise)" />
      </svg>

      {/* Vignette */}
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)', pointerEvents:'none', zIndex:0 }} />

      <div style={{ position:'relative', zIndex:1, padding:'20px 24px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{
            background:POLA, padding:'10px 20px', borderRadius:2,
            transform:'rotate(-1deg)', boxShadow:'3px 5px 14px rgba(0,0,0,0.5)',
            position:'relative',
          }}>
            <div style={{ position:'absolute', top:6, left:10, width:10, height:10, borderRadius:'50%', background:RED, boxShadow:'0 2px 4px rgba(0,0,0,0.5)' }} />
            <div style={{ marginLeft:12 }}>
              <div style={{ fontSize:9, color:RED, letterSpacing:'0.25em', fontWeight:900 }}>EXPEDITION · SEASON 1</div>
              <div style={{ fontSize:24, fontWeight:900, color:'#1a1a1a' }}>THE KITCHEN TRAIL</div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', maxWidth:400 }}>
            {(['dojo','subset','elite','market','miner','benchmark','boss'] as const).map(t => {
              const c = MAP_NODE_CONFIG[t];
              return (
                <div key={t} title={c.blurb} style={{
                  display:'flex', alignItems:'center', gap:3,
                  background:'rgba(200,160,80,0.12)', border:`1px solid ${c.color}44`, borderRadius:2,
                  padding:'3px 7px', fontSize:8, fontWeight:900, color:c.color, letterSpacing:'0.1em',
                  fontFamily:FONT, boxShadow:'1px 1px 4px rgba(0,0,0,0.25)',
                }}>
                  <span>{c.icon}</span>{c.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Map Canvas — looks like a road map pinned to cork board */}
        <div style={{
          position:'relative',
          background:`linear-gradient(160deg, ${MANILLA} 0%, #c9a870 100%)`,
          border:`2px solid rgba(200,160,80,0.4)`, borderRadius:4,
          padding:24, height:(maxRow+1)*ROW_H + 60,
          overflow:'hidden',
          boxShadow:'4px 8px 24px rgba(0,0,0,0.6), inset 0 0 60px rgba(100,60,20,0.15)',
        }}>
          {/* Map paper texture */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.06, backgroundImage:'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(0,0,0,0.5) 30px, rgba(0,0,0,0.5) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(0,0,0,0.3) 30px, rgba(0,0,0,0.3) 31px)' }} />

          {/* Map title watermark */}
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <div style={{ fontSize:80, fontWeight:900, color:'rgba(100,60,20,0.04)', letterSpacing:'0.1em', transform:'rotate(-25deg)', fontFamily:FONT }}>
              ANNOTOPIA
            </div>
          </div>

          {/* CONFIDENTIAL stamp */}
          <div style={{ position:'absolute', top:16, right:16, border:`3px solid rgba(180,40,40,0.4)`, color:'rgba(180,40,40,0.35)', padding:'5px 12px', fontSize:14, fontWeight:900, transform:'rotate(8deg)', fontFamily:FONT, borderRadius:2, pointerEvents:'none' }}>
            CLASSIFIED
          </div>

          {/* Edges (red strings) */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
            <defs>
              <filter id="map-str-shadow"><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.4" /></filter>
            </defs>
            {nodes.map(n => n.connections.map(cid => {
              const to = nodeById[cid]; if (!to) return null;
              const live = n.state === 'completed' || to.state !== 'locked';
              const x1 = `${n.x}%`;  const y1 = (n.y + 0.5) * ROW_H - 20;
              const x2 = `${to.x}%`; const y2 = (to.y + 0.5) * ROW_H - 20;
              // Curved connection
              const mx = (parseFloat(n.x.toString()) + parseFloat(to.x.toString())) / 2;
              const my = ((n.y + to.y) / 2 + 0.5) * ROW_H - 20 - 15;
              return (
                <g key={`${n.id}-${cid}`}>
                  <path
                    d={`M ${x1} ${y1} Q ${mx}% ${my} ${x2} ${y2}`}
                    fill="none"
                    stroke={live ? RED : 'rgba(100,60,20,0.3)'}
                    strokeWidth={live ? 1.5 : 1}
                    strokeDasharray={live ? 'none' : '4 6'}
                    opacity={live ? 0.75 : 0.35}
                    filter="url(#map-str-shadow)"
                  />
                  {/* Push pins at endpoints */}
                  {live && (
                    <circle cx={x1} cy={y1} r={2.5} fill={RED} opacity={0.6} />
                  )}
                </g>
              );
            }))}
          </svg>

          {/* Nodes */}
          {nodes.map(n => {
            const conf = MAP_NODE_CONFIG[n.type];
            const isCurrent = n.id === currentMapNodeId;
            const clickable = n.state !== 'locked';
            return (
              <motion.div key={n.id}
                whileHover={clickable ? { scale:1.1, zIndex:20 } : {}}
                onClick={() => go(n)}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position:'absolute',
                  left:`calc(${n.x}% - 34px)`,
                  top:(n.y + 0.5) * ROW_H - 52,
                  width:68, height:80, borderRadius:2,
                  background: n.state === 'completed' ? '#1a1a1a' : POLA,
                  border: `${isCurrent ? 3 : 1}px solid ${isCurrent ? RED : '#ccc'}`,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
                  cursor: clickable ? 'pointer' : 'not-allowed',
                  opacity: n.state === 'locked' ? 0.4 : 1,
                  boxShadow: isCurrent
                    ? `0 0 20px ${conf.color}88, 0 0 4px ${conf.color}66, 4px 6px 14px rgba(0,0,0,0.4)`
                    : clickable ? `3px 4px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
                  transition:'box-shadow 0.2s', transform:`rotate(${(n.id.charCodeAt(0) % 7) - 3}deg)`,
                  zIndex: isCurrent ? 5 : 2, padding:'6px 6px 14px',
                }}>
                {n.state !== 'completed' && <div style={{ position:'absolute', top:4, left:'50%', transform:'translateX(-50%)', width:10, height:10, borderRadius:'50%', background:RED, boxShadow:'0 2px 4px rgba(0,0,0,0.5)' }}><div style={{ position:'absolute', top:'75%', left:'50%', transform:'translateX(-50%)', width:2, height:4, background:'#999' }}/></div>}
                
                <div style={{ flex:1, width:'100%', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:2, marginTop:10 }}>
                  <div style={{ fontSize:22, filter:n.state === 'completed' ? 'grayscale(1)' : 'none' }}>{conf.icon}</div>
                </div>
                
                <div style={{ fontSize:7, fontWeight:900, color: n.state === 'completed' ? '#888' : '#1a1a1a', letterSpacing:'0.1em', textAlign:'center', lineHeight:1.1, marginTop:4 }}>
                  {conf.label}
                </div>
                {n.state === 'completed' && (
                  <div style={{ position:'absolute', top:40, left:'50%', transform:'translate(-50%,-50%) rotate(-15deg)', border:'2px solid #2e7d32', color:'#2e7d32', padding:'2px 4px', fontSize:10, fontWeight:900, background:'rgba(255,255,255,0.9)' }}>CLEARED</div>
                )}
                {isCurrent && (
                  <div style={{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', background:RED, color:'#fff', fontSize:6, fontWeight:900, padding:'1px 5px', borderRadius:2, letterSpacing:'0.1em', whiteSpace:'nowrap' }}>
                    CURRENT
                  </div>
                )}

                {/* Tooltip */}
                {hovered === n.id && (
                  <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                    style={{
                      position:'absolute', top:74, left:'50%', transform:'translateX(-50%)',
                      background:POLA, border:`1px solid ${conf.color}55`, borderRadius:2,
                      padding:'8px 12px', width:180, zIndex:30, pointerEvents:'none',
                      boxShadow:'3px 5px 14px rgba(0,0,0,0.5)', fontFamily:FONT,
                    }}>
                    <div style={{ fontSize:11, fontWeight:900, color:'#1a1a1a' }}>{n.label}</div>
                    <div style={{ fontSize:8, color:conf.color, letterSpacing:'0.1em', fontWeight:900, marginTop:2 }}>
                      {conf.label} {n.difficulty && `· ${n.difficulty.toUpperCase()}`}
                    </div>
                    <div style={{ fontSize:9, color:'rgba(0,0,0,0.55)', marginTop:4, lineHeight:1.4 }}>{conf.blurb}</div>
                    {n.flavor && <div style={{ fontSize:8, color:RED, fontStyle:'italic', marginTop:3 }}>{n.flavor}</div>}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div style={{ marginTop:14, display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(200,160,80,0.5)', fontFamily:FONT }}>
          <span>Advance through subsets · build bond · evolve at the Brain apex</span>
          <span onClick={() => navigate('/hub')} style={{ cursor:'pointer', color:'rgba(200,160,80,0.7)', fontWeight:700 }}>← RETURN TO HUB</span>
        </div>
      </div>
    </div>
  );
}

export default BucketMap;
