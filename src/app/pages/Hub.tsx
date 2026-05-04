import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useGame } from '../context/GameContext';

const BG_DARK   = '#141414';
const BG_MID    = '#1F1A17';
const BG_LIGHT  = '#2A2421';
const CORK      = BG_MID;
const CORK_DARK = BG_DARK;
const POLA      = '#f5ede0';
const STICKY_Y  = '#F9E97E';
const STICKY_B  = '#B3E5FC';
const STICKY_G  = '#C8E6C9';
const STICKY_P  = '#E1BEE7';
const RED       = '#D32F2F';
const FONT      = "'Courier New', monospace";
const AMBER     = '#f5a742';
const MANILLA   = '#D5BCA4';

const QUICK_LAUNCH = [
  { path:'/loadout?target=evidence',   icon:'🔍', label:'EVIDENCE MODE',  subtext:'Geoguessr Style', bg: STICKY_G, rot:-2   },
  { path:'/map',        icon:'🗺️', label:'TRAINING MAP',   subtext:'Case board',  bg: STICKY_Y, rot:-1.5 },
  { path:'/loadout',    icon:'🐾', label:'ASSEMBLE SQUAD', subtext:'Pick operative', bg: STICKY_B, rot:1   },
  { path:'/market',     icon:'🔦', label:'BLACK MARKET',   subtext:'Trade & acquire', bg: '#FFCDD2', rot:-0.8 },
  { path:'/agency',     icon:'🕵️', label:'AGENCY ROSTER',  subtext:'Agent profiles', bg: STICKY_P, rot:1.5  },
  { path:'/leaderboard',icon:'📁', label:'CASE FILES',     subtext:'Rankings',      bg: STICKY_Y, rot:-1   },
];

const CASE_LOG = [
  '▸ Asset acquisition at Black Market — 12 drones available',
  '▸ Training trail: THE KITCHEN — 4 nodes remaining',
  '▸ Agency power: 14 active operatives on standby',
  '▸ Ghost signal detected in Sector 7 datasets',
  '▸ Next benchmark: 3 cases to qualification',
];

function RealisticPin({ color, style }: { color: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      width:14, height:14, borderRadius:'50%', position:'absolute', zIndex:5,
      background:`radial-gradient(circle at 35% 30%, #fff 0%, ${color} 35%, rgba(0,0,0,0.5) 100%)`,
      boxShadow:'0 2px 5px rgba(0,0,0,0.5)',
      ...style,
    }}>
      <div style={{ position:'absolute', top:'80%', left:'50%', transform:'translateX(-50%)', width:2, height:5, background:'#999' }} />
    </div>
  );
}

function Paperclip({ angle = 0, style }: { angle?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      position:'absolute', width:12, height:38, border:'2.5px solid #d4d4d4', borderRadius:6,
      borderBottomRightRadius:4, borderBottomLeftRadius:4, zIndex:15,
      boxShadow:'2px 4px 6px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.8)',
      transform:`rotate(${angle}deg)`, ...style
    }}>
      <div style={{ position:'absolute', top:2, left:2, right:2, bottom:6, border:'2px solid #d4d4d4', borderRadius:4, borderBottom:'none' }} />
    </div>
  );
}

export function Hub() {
  const nav = useNavigate();
  const { playerName, coins, diamonds, inventory, totalScore, leaderboard } = useGame();
  const [clock, setClock] = useState('');
  const [logLine, setLogLine] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setLogLine(l => (l + 1) % CASE_LOG.length), 3000);
    return () => clearInterval(iv);
  }, []);

  const playerRank = leaderboard.find(e => e.isPlayer)?.rank ?? '—';

  return (
    <div style={{
      minHeight:'100vh',
      background:`linear-gradient(135deg, ${BG_DARK} 0%, ${BG_MID} 50%, ${BG_DARK} 100%)`,
      fontFamily:FONT, overflow:'hidden', position:'relative',
    }}>
      {/* Cork grain */}
      <svg style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.12, zIndex:0 }}>
        <filter id="hub-noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="n" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#hub-noise)" />
      </svg>

      {/* Vignette */}
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)', pointerEvents:'none', zIndex:0 }} />

      <div style={{ position:'relative', zIndex:1, padding:'20px 28px 40px', maxWidth:1100, margin:'0 auto' }}>
        {/* Coffee Stain */}
        <svg style={{ position:'absolute', top:50, right:150, width:200, height:200, pointerEvents:'none', opacity:0.15, transform:'rotate(20deg)' }}>
          <path d="M 100 10 C 130 15 160 30 180 60 C 200 90 190 140 160 170 C 130 190 80 190 40 160 C 10 130 5 80 30 40 C 50 15 80 5 100 10 Z" fill="none" stroke="#2a1a0a" strokeWidth="8" />
          <path d="M 100 20 C 120 22 150 40 160 65 C 180 90 180 130 150 150 C 120 170 70 170 40 140 C 20 110 15 70 40 40 C 55 25 80 15 100 20 Z" fill="rgba(42,26,10,0.4)" stroke="none" />
        </svg>

        {/* ─── Header ─── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          {/* ID Card */}
          <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
            style={{
              background:POLA, padding:'12px 24px 14px', borderRadius:2,
              transform:'rotate(-1.5deg)', boxShadow:'4px 6px 18px rgba(0,0,0,0.55)',
              minWidth:260, position:'relative', border:'1px solid #d4c4b4'
            }}>
            <Paperclip angle={20} style={{ top:-12, right:20 }} />
            <div style={{ position:'absolute', top:8, left:8, width:10, height:10, borderRadius:'50%', background:RED, boxShadow:'0 2px 4px rgba(0,0,0,0.5)' }} />
            <div style={{ marginLeft:14 }}>
              <div style={{ fontSize:8, letterSpacing:'0.3em', color:RED, fontWeight:900 }}>HQ OPERATIONS CENTER</div>
              <div style={{ fontSize:24, fontWeight:900, color:'#1a1a1a', marginTop:2 }}>THE HUB</div>
              <div style={{ fontSize:9, color:'#555', marginTop:3, lineHeight:1.5 }}>
                {CASE_LOG[logLine]}
              </div>
            </div>
          </motion.div>

          {/* Status clock */}
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
            style={{
              background:'rgba(10,5,2,0.7)', border:`2px solid rgba(200,160,80,0.4)`,
              padding:'10px 18px', borderRadius:4, textAlign:'right',
              boxShadow:'inset 0 0 20px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)', position:'relative'
            }}>
            <RealisticPin color="#FDD835" style={{ top:4, left:6 }} />
            <div style={{ fontSize:9, color:'rgba(200,160,80,0.55)', letterSpacing:'0.3em', marginBottom:4 }}>[ SYSTEM CLOCK ]</div>
            <div style={{ fontSize:28, fontWeight:900, color:AMBER, fontFamily:FONT, letterSpacing:'0.08em', textShadow:`0 0 12px ${AMBER}66` }}>
              {clock}
            </div>
            <div style={{ fontSize:8, color:'rgba(200,160,80,0.4)', marginTop:4 }}>ANNOTOPIA — FIELD OPS</div>
          </motion.div>
        </div>

        {/* ─── Main Grid ─── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 300px', gap:20 }}>

          {/* LEFT: Quick Launch Board */}
          <div style={{ gridColumn:'1 / 3' }}>
            <div style={{ fontSize:9, color:'rgba(200,160,80,0.5)', letterSpacing:'0.25em', marginBottom:14, fontWeight:900 }}>
              ── QUICK LAUNCH ──
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
              {QUICK_LAUNCH.map((item, i) => (
                <motion.button
                  key={item.path}
                  initial={{ opacity:0, y:20 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay:i * 0.06 }}
                  whileHover={{ scale:1.06, y:-4 }}
                  whileTap={{ scale:0.95 }}
                  onClick={() => nav(item.path)}
                  style={{
                    background:item.bg, borderRadius:2, padding:'14px 12px',
                    transform:`rotate(${item.rot}deg)`, cursor:'pointer', border:'none',
                    boxShadow:'3px 4px 12px rgba(0,0,0,0.35)', position:'relative',
                    display:'flex', flexDirection:'column', alignItems:'flex-start', gap:4,
                    textAlign:'left', fontFamily:FONT,
                  }}>
                  <RealisticPin color={i % 2 === 0 ? "#1565C0" : "#E53935"} style={{ top:4, left:10 }} />
                  <span style={{ fontSize:28, filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.2))', marginTop:8 }}>{item.icon}</span>
                  <div style={{ fontSize:12, fontWeight:900, color:'#1a1a1a', letterSpacing:'0.06em', lineHeight:1 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize:9, color:'rgba(0,0,0,0.6)', lineHeight:1.2, fontWeight:600 }}>{item.subtext}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* RIGHT: Status + Stats */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Detective Stats */}
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15 }}
              style={{
                background:POLA, borderRadius:2, padding:'12px 14px', border:'1px solid #d4c4b4',
                transform:'rotate(0.8deg)', boxShadow:'3px 4px 12px rgba(0,0,0,0.35)', position:'relative'
              }}>
              <Paperclip angle={-15} style={{ top:-10, right:30 }} />
              <div style={{ fontSize:8, fontWeight:900, color:RED, letterSpacing:'0.2em', marginBottom:8 }}>DETECTIVE STATUS</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {[
                  { label:'SCORE',     value: totalScore.toLocaleString(),      color:'#1a1a1a' },
                  { label:'RANK',      value: typeof playerRank === 'number' ? `#${playerRank}` : '—', color:RED },
                  { label:'BALANCE',   value: `$${coins.toLocaleString()}`,      color:'#2e7d32' },
                  { label:'GEMS',      value: `💎${diamonds}`,                   color:'#1565C0' },
                  { label:'OPERATIVES',value: inventory.length.toString(),        color:'#7b1fa2' },
                  { label:'CODENAME',  value: playerName.slice(0,8),             color:'#1a1a1a' },
                ].map(s => (
                  <div key={s.label} style={{ background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:2, padding:'5px 8px' }}>
                    <div style={{ fontSize:7, color:'rgba(0,0,0,0.5)', fontWeight:900, letterSpacing:'0.1em' }}>{s.label}</div>
                    <div style={{ fontSize:14, fontWeight:900, color:s.color, fontFamily:FONT, lineHeight:1.1, marginTop:1 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Case Log Sticky */}
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.25 }}
              style={{
                background:STICKY_Y, borderRadius:2, padding:'10px 12px',
                transform:'rotate(-1deg)', boxShadow:'2px 3px 10px rgba(0,0,0,0.3)', position:'relative'
              }}>
              <RealisticPin color="#E53935" style={{ top:4, left:'50%', transform:'translateX(-50%)' }} />
              <div style={{ fontSize:8, fontWeight:900, color:'rgba(0,0,0,0.5)', letterSpacing:'0.2em', marginBottom:7, borderBottom:'1px dashed rgba(0,0,0,0.15)', paddingBottom:5, marginTop:8 }}>
                FIELD BRIEF
              </div>
              {CASE_LOG.map((line, i) => (
                <div key={i} style={{ fontSize:9, color:'#2a1a08', lineHeight:1.6, fontWeight: i === logLine ? 900 : 600, opacity: i === logLine ? 1 : 0.55 }}>
                  {line}
                </div>
              ))}
            </motion.div>

          </div>
        </div>

        {/* ─── Map Preview ─── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          style={{ marginTop:24 }}>
          <div style={{ fontSize:9, color:'rgba(200,160,80,0.5)', letterSpacing:'0.25em', marginBottom:12, fontWeight:900 }}>
            ── CURRENT ASSIGNMENT ──
          </div>
          <div style={{
            background:`linear-gradient(160deg, #D5BCA4 0%, #C4AB93 100%)`,
            borderRadius:4, padding:'14px 20px',
            boxShadow:'4px 6px 18px rgba(0,0,0,0.5)', border:'1px solid rgba(200,160,80,0.3)',
            display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14,
          }}>
            <div>
              <div style={{ fontSize:9, color:'rgba(58,42,26,0.55)', letterSpacing:'0.2em', fontWeight:900 }}>ACTIVE TRAIL</div>
              <div style={{ fontSize:20, fontWeight:900, color:'#2a1a0a', marginTop:2 }}>THE KITCHEN TRAIL · SEASON 1</div>
              <div style={{ fontSize:10, color:'rgba(58,42,26,0.55)', marginTop:3 }}>Advance through subsets · build bond · reach the Brain apex</div>
            </div>
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.96 }} onClick={() => nav('/map')} style={{
              background:'#2a1a0a', color:POLA, border:'none', padding:'11px 22px', borderRadius:2,
              fontSize:12, fontWeight:900, letterSpacing:'0.15em', cursor:'pointer', fontFamily:FONT,
              boxShadow:'2px 3px 10px rgba(0,0,0,0.4)',
            }}>
              OPEN MAP →
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Hub;
