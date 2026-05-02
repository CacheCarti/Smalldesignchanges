import React from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

const CORK      = '#5D4037';
const CORK_DARK = '#1A1A1A';
const POLA      = '#f5ede0';
const STICKY_Y  = '#F9E97E';
const RED       = '#C62828';
const FONT      = "'Courier New', monospace";

export function DispatchMode() {
  const nav = useNavigate();

  return (
    <div style={{
      minHeight:'100vh',
      background:`radial-gradient(circle at 30% 35%, rgba(93,64,55,0.45) 0%, transparent 50%), linear-gradient(155deg, ${CORK} 0%, ${CORK_DARK} 100%)`,
      fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center',
      position:'relative', overflow:'hidden',
    }}>
      {/* Cork grain */}
      <svg style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.12, zIndex:0 }}>
        <filter id="dispatch-noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="n" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#dispatch-noise)" />
      </svg>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6) 100%)', pointerEvents:'none', zIndex:0 }} />

      {/* Decorative red strings */}
      <svg style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:1 }}>
        <motion.path d="M 15 25 Q 45 55 20 85" fill="none" stroke={RED} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"
          initial={{ pathLength:0 }} animate={{ pathLength:1 }} transition={{ duration:2 }} />
        <motion.path d="M 85 15 Q 65 50 80 80" fill="none" stroke={RED} strokeWidth="0.6" opacity="0.2" strokeLinecap="round"
          initial={{ pathLength:0 }} animate={{ pathLength:1 }} transition={{ duration:2.5, delay:0.4 }} />
      </svg>

      <div style={{ position:'relative', zIndex:2, textAlign:'center', maxWidth:480, padding:'20px' }}>

        <motion.div
          initial={{ scale:0.85, opacity:0 }}
          animate={{ scale:1, opacity:1 }}
          transition={{ type:'spring', damping:18, stiffness:100 }}
          style={{
            background:POLA, padding:'28px 36px 36px',
            borderRadius:2, transform:'rotate(1.5deg)',
            boxShadow:'5px 8px 24px rgba(0,0,0,0.6)', position:'relative',
          }}>
          {/* Pin */}
          <div style={{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', width:14, height:14, borderRadius:'50%', background:`radial-gradient(circle at 35% 30%, #fff 0%, ${RED} 35%, rgba(0,0,0,0.5) 100%)`, boxShadow:'0 2px 5px rgba(0,0,0,0.5)' }} />

          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:10, color:RED, letterSpacing:'0.3em', fontWeight:900, marginBottom:8 }}>
              AUTONOMOUS TESTING MODULE
            </div>
            <div style={{ fontSize:44, marginBottom:12 }}>📡</div>
            <div style={{ fontSize:30, fontWeight:900, color:'#1a1a1a', letterSpacing:'0.04em', lineHeight:1 }}>
              DISPATCH MODE
            </div>

            <div style={{
              display:'inline-block', marginTop:16, padding:'6px 16px',
              border:`3px solid ${RED}`, color:RED, fontSize:14, fontWeight:900,
              letterSpacing:'0.2em', transform:'rotate(-3deg)',
              borderRadius:3, fontFamily:FONT, boxShadow:`0 0 10px ${RED}33`,
            }}>
              COMING SOON
            </div>

            <div style={{ marginTop:16, fontSize:11, color:'#555', lineHeight:1.7 }}>
              Autonomous testing arena for deploying<br />
              trained operatives against live datasets.<br />
              <span style={{ color:RED, fontWeight:900 }}>No manual annotation required.</span>
            </div>

            <div style={{
              background:STICKY_Y, marginTop:20, padding:'10px 14px', borderRadius:2,
              transform:'rotate(-1deg)', boxShadow:'2px 3px 8px rgba(0,0,0,0.2)', textAlign:'left',
            }}>
              <div style={{ fontSize:9, fontWeight:900, color:'rgba(0,0,0,0.5)', letterSpacing:'0.15em', marginBottom:6 }}>PLANNED FEATURES</div>
              {['Autonomous agent evaluation', 'Batch dataset processing', 'Performance benchmarking', 'Auto-submission to leaderboard'].map((f, i) => (
                <div key={i} style={{ fontSize:9, color:'#2a1a08', lineHeight:1.7 }}>— {f}</div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale:1.04, y:-2 }} whileTap={{ scale:0.96 }}
          onClick={() => nav('/hub')} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          style={{
            marginTop:18, background:'rgba(200,160,80,0.15)', border:'1px solid rgba(200,160,80,0.3)',
            color:'rgba(200,160,80,0.8)', padding:'10px 24px', borderRadius:2,
            fontSize:11, fontWeight:900, letterSpacing:'0.2em', cursor:'pointer', fontFamily:FONT,
          }}>
          ← BACK TO HUB
        </motion.button>
      </div>
    </div>
  );
}

export default DispatchMode;
