import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { getSpriteUrl, ARCHITECTURE_COLORS } from '../data/pokemon';
import { TEST_REVEAL_IMAGES } from '../data/gameImages';

const CORK      = '#5D4037';
const CORK_DARK = '#1A1A1A';
const POLA      = '#f5ede0';
const STICKY_Y  = '#F9E97E';
const MANILLA   = '#D5BCA4';
const MANILLA_DK= '#C4AB93';
const FONT      = "'Courier New', monospace";
const RED       = '#C62828';

type FightStage = 'intro' | 'fight' | 'winner' | 'annotate' | 'done';

const GHOST = { id: 94, name: 'NeuroGhost_X', color: '#b879ff', acc: 72 };

export function Results() {
  const nav = useNavigate();
  const { activePokemon, lastRoundScore, roundResults, cardCombat, updateLeaderboard } = useGame();

  const [fightStage, setFightStage] = useState<FightStage>('intro');
  const [revealIdx, setRevealIdx]   = useState(0);
  const [showMetrics, setShowMetrics] = useState(false);

  const metrics = useMemo(() => {
    const base     = cardCombat.trustScore / 100;
    const streak   = Math.min(1, cardCombat.honeypotStreak / 5);
    const precision = Math.round((0.58 + base * 0.32 + streak * 0.08) * 100);
    const recall    = Math.round((0.52 + base * 0.28 + Math.random() * 0.05) * 100);
    const accuracy  = Math.round((0.50 + base * 0.34 + streak * 0.12) * 100);
    const f1        = Math.round((2 * precision * recall) / Math.max(1, precision + recall));
    const playerWins = accuracy >= 65;
    return { precision, recall, accuracy, f1, playerWins };
  }, [cardCombat]);

  useEffect(() => { updateLeaderboard(lastRoundScore); }, []);

  // Fight animation sequence loops through all images
  useEffect(() => {
    let timer: any;
    if (fightStage === 'intro') {
      timer = setTimeout(() => setFightStage('fight'), 1000);
    } else if (fightStage === 'fight') {
      timer = setTimeout(() => setFightStage('winner'), 1800);
    } else if (fightStage === 'winner') {
      timer = setTimeout(() => setFightStage('annotate'), 1500);
    } else if (fightStage === 'annotate') {
      timer = setTimeout(() => {
        if (revealIdx < TEST_REVEAL_IMAGES.length - 1) {
          setRevealIdx(r => r + 1);
          setFightStage('fight');
        } else {
          setFightStage('done');
        }
      }, 2000);
    } else if (fightStage === 'done') {
      timer = setTimeout(() => setShowMetrics(true), 400);
    }
    return () => clearTimeout(timer);
  }, [fightStage, revealIdx]);

  const reveal = TEST_REVEAL_IMAGES[revealIdx % TEST_REVEAL_IMAGES.length];
  const arch   = activePokemon ? ARCHITECTURE_COLORS[activePokemon.architecture] : ARCHITECTURE_COLORS.CNN;

  const rocPoints = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 20; i++) {
      const fpr = i / 20;
      const tpr = Math.min(1, Math.pow(fpr, 0.4 + (100 - metrics.accuracy) / 180));
      pts.push([fpr, tpr]);
    }
    return pts;
  }, [metrics.accuracy]);

  return (
    <div style={{
      minHeight: '100vh', padding: '0',
      background: `
        radial-gradient(circle at 18% 22%, rgba(0,0,0,0.1) 1.5px, transparent 2px),
        radial-gradient(circle at 72% 38%, rgba(0,0,0,0.15) 1px, transparent 1.5px),
        linear-gradient(135deg, ${CORK} 0%, ${CORK_DARK} 100%)`,
      fontFamily: FONT,
    }}>
      {/* Folder page flip intro */}
      <AnimatePresence>
        {fightStage === 'intro' && (
          <motion.div
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position:'fixed', inset:0, zIndex:100,
              background: MANILLA, display:'flex', alignItems:'center', justifyContent:'center',
              flexDirection:'column', gap:12,
            }}>
            <div style={{ fontSize:28, fontWeight:900, color:'#2a1a0a', fontFamily:FONT, letterSpacing:'0.1em' }}>
              CASE RESULTS
            </div>
            <div style={{ fontSize:12, color:'rgba(80,40,10,0.6)', letterSpacing:'0.2em' }}>
              OPENING EVALUATION FILE...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div style={{ padding:'20px 24px 40px' }}>
        {/* Header */}
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.8 }}
          style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            marginBottom:18, background:POLA, padding:'12px 24px', borderRadius:2,
            transform:'rotate(-0.5deg)', boxShadow:'3px 5px 16px rgba(0,0,0,0.5)',
            position:'relative',
          }}>
          <RealisticPin color={RED} style={{ position:'absolute', top:8, left:10 }} />
          <div style={{ marginLeft:16 }}>
            <div style={{ fontSize:11, color:RED, letterSpacing:'0.18em', fontWeight:900 }}>OFFICIAL DISPATCH DEBRIEF</div>
            <div style={{ fontSize:32, fontWeight:900, color:'#1a1a1a', letterSpacing:'-0.02em' }}>CASE CLOSED</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:10, color:'#555', letterSpacing:'0.1em', fontWeight:800 }}>FINAL SCORE</div>
            <div style={{ fontSize:44, fontWeight:900, color:RED, fontFamily:"'Courier New', monospace" }}>
              {lastRoundScore.toLocaleString()}
            </div>
          </div>
        </motion.div>

        {/* Two-column layout: LEFT=exhibit+fight+slip, RIGHT=dossier */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>

          {/* LEFT: Exhibit + Fight + Compensation + Metrics */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* EXHIBIT + FIGHT ANIMATION */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.9 }}
              style={{
                background:'#1a1a1a', border:`6px solid #2a1a08`, borderRadius:4, overflow:'hidden',
                boxShadow:'0 8px 24px rgba(0,0,0,0.6)', position:'relative',
              }}>
              <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:RED, color:'#fff', padding:'3px 14px', fontSize:10, fontWeight:900, letterSpacing:'0.18em', zIndex:2 }}>
                EXHIBIT — FIELD TEST
              </div>

              {/* Image with annotation markers appearing */}
              <div style={{ position:'relative', overflow:'hidden' }}>
                <img src={reveal.url} style={{ width:'100%', height:200, objectFit:'cover', display:'block', filter: fightStage === 'fight' ? 'brightness(0.6)' : 'brightness(1)', transition:'filter 0.8s' }} />

                {/* Annotation markers appearing during annotate stage */}
                <AnimatePresence>
                  {(fightStage === 'annotate' || fightStage === 'done') && (
                    <>
                      {reveal.probeTargets.map((pt, i) => (
                        <motion.div key={i}
                          initial={{ scale:0, opacity:0 }}
                          animate={{ scale:1, opacity:1 }}
                          transition={{ delay: i * 0.15, type:'spring' }}
                          style={{
                            position:'absolute', left:`${pt.x}%`, top:`${pt.y}%`,
                            transform:'translate(-50%,-50%)',
                            width:20, height:20, borderRadius:'50%',
                            border:'2.5px solid #E53935', boxShadow:'0 0 8px rgba(229,57,53,0.8)',
                          }}>
                          <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', fontSize:7, color:'#fff', fontWeight:900, whiteSpace:'nowrap', background:'rgba(0,0,0,0.7)', padding:'1px 4px', borderRadius:2 }}>
                            {pt.label}
                          </div>
                        </motion.div>
                      ))}
                      {reveal.sweepRegions.map((r, i) => (
                        <motion.div key={i}
                          initial={{ opacity:0, scale:0.8 }}
                          animate={{ opacity:1, scale:1 }}
                          transition={{ delay: 0.6 + i * 0.2 }}
                          style={{
                            position:'absolute', left:`${r.x}%`, top:`${r.y}%`,
                            width:`${r.w}%`, height:`${r.h}%`,
                            border:'2px dashed #1565C0', background:'rgba(21,101,192,0.12)',
                            borderRadius:2, boxShadow:'0 0 8px rgba(21,101,192,0.4)',
                          }}>
                          <div style={{ position:'absolute', top:2, left:3, fontSize:7, color:'#90caf9', fontWeight:900 }}>{r.label}</div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </AnimatePresence>

                {/* FIGHT animation overlay */}
                <AnimatePresence>
                  {(fightStage === 'fight') && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                      style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 20px' }}>
                      {/* Player pokemon */}
                      <motion.div
                        animate={{ x:[0, 20, -8, 12, 0], rotate:[-2, 4, -3, 2, 0] }}
                        transition={{ duration:1.5, repeat:1 }}
                        style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                        {activePokemon && (
                          <img src={getSpriteUrl(activePokemon.id)}
                            style={{ width:80, height:80, imageRendering:'pixelated', filter:`drop-shadow(0 0 12px ${arch.color})` }} />
                        )}
                        <div style={{ color:'#fff', fontSize:9, fontWeight:900, marginTop:4, background:'rgba(0,0,0,0.6)', padding:'2px 8px', borderRadius:2 }}>
                          {activePokemon?.name.toUpperCase()}
                        </div>
                      </motion.div>

                      {/* VS */}
                      <motion.div
                        animate={{ scale:[1, 1.6, 0.9, 1.4, 1], rotate:[0, 10, -8, 5, 0] }}
                        transition={{ duration:1.5, repeat:1 }}
                        style={{ fontSize:28, fontWeight:900, color:RED, textShadow:`0 0 20px ${RED}`, fontFamily:FONT }}>
                        VS
                      </motion.div>

                      {/* Ghost opponent */}
                      <motion.div
                        animate={{ x:[0, -20, 8, -12, 0], rotate:[2, -4, 3, -2, 0] }}
                        transition={{ duration:1.5, repeat:1 }}
                        style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <img src={getSpriteUrl(GHOST.id)}
                          style={{ width:80, height:80, imageRendering:'pixelated', filter:`drop-shadow(0 0 12px ${GHOST.color})` }} />
                        <div style={{ color:'#fff', fontSize:9, fontWeight:900, marginTop:4, background:'rgba(0,0,0,0.6)', padding:'2px 8px', borderRadius:2 }}>
                          {GHOST.name.toUpperCase()}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Winner announcement */}
                <AnimatePresence>
                  {fightStage === 'winner' && (
                    <motion.div initial={{ scale:0.5, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:1.2, opacity:0 }}
                      transition={{ type:'spring', stiffness:300 }}
                      style={{
                        position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                        background:'rgba(0,0,0,0.75)',
                      }}>
                      <div style={{ textAlign:'center' }}>
                        {activePokemon && (
                          <img src={getSpriteUrl(metrics.playerWins ? activePokemon.id : GHOST.id)}
                            style={{ width:90, height:90, imageRendering:'pixelated',
                              filter:`drop-shadow(0 0 20px ${metrics.playerWins ? arch.color : GHOST.color})` }} />
                        )}
                        <div style={{ fontSize:16, fontWeight:900, color:'#fff', marginTop:8, fontFamily:FONT, letterSpacing:'0.2em' }}>
                          {metrics.playerWins ? '🏆 VICTORY' : '💀 CASE UNSOLVED'}
                        </div>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:4, fontFamily:FONT }}>
                          {metrics.playerWins ? (activePokemon?.name ?? '') + ' SOLVES THE CASE' : GHOST.name + ' PREVAILS'}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Image thumbnails to switch exhibit */}
              <div style={{ display:'flex', gap:6, padding:'8px 12px', background:'rgba(0,0,0,0.3)', alignItems:'center' }}>
                <span style={{ fontSize:8, fontWeight:900, color:'#888', letterSpacing:'0.15em' }}>EXHIBITS:</span>
                {TEST_REVEAL_IMAGES.map((_, i) => (
                  <button key={i} onClick={() => setRevealIdx(i)} style={{
                    width:28, height:28, borderRadius:3, overflow:'hidden', border:`2px solid ${revealIdx === i ? RED : 'transparent'}`,
                    cursor:'pointer', padding:0, flexShrink:0,
                    boxShadow: revealIdx === i ? `0 0 8px ${RED}88` : 'none',
                  }}>
                    <img src={TEST_REVEAL_IMAGES[i].url} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Compensation Slip */}
            <AnimatePresence>
              {(fightStage === 'done' || fightStage === 'annotate') && (
                <motion.div initial={{ opacity:0, y:20, rotate:-2 }} animate={{ opacity:1, y:0, rotate:-1 }} transition={{ delay:0.3 }}
                  style={{
                    background: STICKY_Y, borderRadius:2, padding:'14px 18px',
                    boxShadow:'3px 5px 14px rgba(0,0,0,0.3)', position:'relative',
                  }}>
                  <div style={{ fontSize:11, fontWeight:900, color:'#2a1a08', letterSpacing:'0.12em', marginBottom:10, borderBottom:'2px solid rgba(0,0,0,0.1)', paddingBottom:8 }}>
                    COMPENSATION SLIP
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    <RewardItem icon="💰" label="Bounty Paid"     value={`+$${Math.floor(lastRoundScore/8).toLocaleString()}`}   color="#2e7d32" />
                    <RewardItem icon="💎" label="Gems Recovered"  value={`+${Math.floor(lastRoundScore/500)}`}                    color="#1565C0" />
                    <RewardItem icon="✨" label="Bond Exp"        value="+4 XP"                                                    color={RED} />
                  </div>
                  <div style={{ position:'absolute', bottom:-8, right:-8, fontSize:28, color:`${RED}88`, transform:'rotate(-15deg)', fontWeight:900, fontFamily:FONT, pointerEvents:'none' }}>
                    PAID
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Evidence Metrics Board */}
            <AnimatePresence>
              {showMetrics && (
                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
                  style={{
                    background:'#1a1a1a', border:`6px solid #2a1a08`, borderRadius:4, padding:'20px',
                    boxShadow:'0 8px 24px rgba(0,0,0,0.6)', position:'relative',
                  }}>
                  <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:RED, color:'#fff', padding:'3px 14px', fontSize:10, fontWeight:900, letterSpacing:'0.18em' }}>
                    EVIDENCE STRENGTH METRICS
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginTop:10 }}>
                    <MetricBar label="PRECISION" value={metrics.precision} color="#2196F3" />
                    <MetricBar label="RECALL"    value={metrics.recall}    color="#9C27B0" />
                    <MetricBar label="ACCURACY"  value={metrics.accuracy}  color="#4CAF50" />
                    <MetricBar label="F1 SCORE"  value={metrics.f1}        color="#FFEB3B" />
                  </div>
                  {/* ROC Curve */}
                  <div style={{ marginTop:16, background:POLA, borderRadius:2, padding:14, display:'flex', gap:16, alignItems:'center' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:900, color:'#1a1a1a', letterSpacing:'0.08em', marginBottom:4 }}>ROC ANALYSIS</div>
                      <div style={{ fontSize:10, color:'#555', lineHeight:1.4 }}>
                        Receiver Operating Characteristic curve confirms agent diagnostic validity against standard baselines.
                      </div>
                    </div>
                    <div style={{ width:130, height:90, background:'#111', border:'2px solid #444', position:'relative', padding:8, flexShrink:0, borderRadius:2 }}>
                      <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%' }}>
                        <line x1={0} y1={100} x2={100} y2={0} stroke="#555" strokeWidth="1" strokeDasharray="4 4" />
                        <polyline points={rocPoints.map(([x,y]) => `${x*100},${100-y*100}`).join(' ')} fill="none" stroke={RED} strokeWidth="3" />
                        <polyline points={[[0,0],...rocPoints,[1,0]].map(([x,y]) => `${x*100},${100-y*100}`).join(' ')} fill="rgba(198,40,40,0.18)" stroke="none" />
                        <text x={2} y={10} fill="#888" fontSize="8" fontFamily="sans-serif">TPR</text>
                        <text x={78} y={96} fill="#888" fontSize="8" fontFamily="sans-serif">FPR</text>
                      </svg>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* RIGHT: Agent Dossier */}
          <div>
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:1.0 }}
              style={{
                background:MANILLA, border:`1px solid ${MANILLA_DK}`, borderRadius:'0 4px 4px 4px',
                padding:16, position:'relative',
                boxShadow:'4px 6px 18px rgba(0,0,0,0.4)', transform:'rotate(0.5deg)',
              }}>
              <div style={{
                position:'absolute', top:-26, left:-1, background:MANILLA,
                padding:'5px 14px', border:`1px solid ${MANILLA_DK}`, borderBottom:'none',
                borderRadius:'6px 6px 0 0', fontSize:11, fontWeight:900, color:'#3a2a1a', letterSpacing:'0.1em',
              }}>AGENT DOSSIER</div>

              {activePokemon && (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={{ background:'#1a1a1a', padding:6, borderRadius:2, transform:'rotate(-2deg)', boxShadow:'2px 3px 8px rgba(0,0,0,0.4)', border:`2px solid ${arch.color}44`, flexShrink:0 }}>
                      <img src={getSpriteUrl(activePokemon.id)} style={{ width:56, height:56, imageRendering:'pixelated' }} />
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:8, color:'#666', fontWeight:900, letterSpacing:'0.1em' }}>CODENAME</div>
                      <div style={{ fontSize:18, fontWeight:900, color:'#1a1a1a', lineHeight:1 }}>{activePokemon.name}</div>
                      <div style={{ fontSize:9, color:arch.color, fontWeight:900, marginTop:3 }}>[ {arch.label} ]</div>
                    </div>
                  </div>

                  {/* Archetype badge */}
                  <div style={{ display:'inline-block', padding:'3px 8px', borderRadius:2, background:'#1a1a1a', color:'#FFEB3B', fontSize:9, fontWeight:900, letterSpacing:'0.08em', alignSelf:'flex-start' }}>
                    CLASS: {metrics.playerWins ? 'SNIPER' : 'ROOKIE'}
                  </div>

                  {/* Status note */}
                  <div style={{ background:'rgba(255,255,255,0.45)', padding:10, borderRadius:2, borderLeft:`3px solid ${RED}`, fontSize:10, color:'#2a1a0a', lineHeight:1.5, fontWeight:600 }}>
                    <strong>STATUS:</strong> Returned from dispatch. +4 bond. -15 stamina.
                  </div>

                  {/* Mini stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:5 }}>
                    {(['pace','verbal','spatial','accuracy'] as const).map(k => (
                      <div key={k} style={{ background:'rgba(0,0,0,0.06)', borderRadius:2, padding:'4px 6px' }}>
                        <div style={{ fontSize:7, color:'rgba(80,40,10,0.5)', fontWeight:900, letterSpacing:'0.1em' }}>{k.toUpperCase()}</div>
                        <div style={{ fontSize:16, fontWeight:900, color:'#2a1a0a' }}>{activePokemon.stats[k]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* CTAs */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.5 }}
          style={{ display:'flex', gap:14, justifyContent:'center', marginTop:28 }}>
          <CTA_Button color={RED}       icon="📍" label="NEXT ASSIGNMENT" onClick={() => nav('/map')} />
          <CTA_Button color="#1a1a1a"   icon="🧠" label="RETURN TO HUB"   onClick={() => nav('/hub')} />
          <CTA_Button color="#1a1a1a"   icon="📁" label="CASE ARCHIVES"   onClick={() => nav('/leaderboard')} />
        </motion.div>
      </div>
    </div>
  );
}

function RealisticPin({ color, style }: { color: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      width:12, height:12, borderRadius:'50%', position:'absolute', zIndex:5,
      background:`radial-gradient(circle at 35% 30%, #fff 0%, ${color} 35%, rgba(0,0,0,0.5) 100%)`,
      boxShadow:'0 2px 5px rgba(0,0,0,0.5)',
      ...style,
    }} />
  );
}

function RewardItem({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 4px', background:'rgba(0,0,0,0.06)', borderRadius:3 }}>
      <div style={{ fontSize:18 }}>{icon}</div>
      <div style={{ fontSize:8, color:'rgba(42,26,8,0.6)', fontWeight:900, marginTop:2, letterSpacing:'0.08em' }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:900, color, marginTop:1, fontFamily:FONT }}>{value}</div>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background:'#111', borderRadius:2, padding:10, border:'1px solid #2a2a2a' }}>
      <div style={{ fontSize:8, color:'#666', letterSpacing:'0.1em', fontWeight:900 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:900, color, marginTop:3 }}>{value}<span style={{ fontSize:11, color:'#555' }}>%</span></div>
      <div style={{ height:5, background:'#222', borderRadius:3, marginTop:6, overflow:'hidden' }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${value}%` }} transition={{ duration:1, delay:0.3 }}
          style={{ height:'100%', background:color, boxShadow:`0 0 8px ${color}` }} />
      </div>
    </div>
  );
}

function CTA_Button({ color, icon, label, onClick }: { color: string; icon: string; label: string; onClick: () => void }) {
  return (
    <motion.button whileHover={{ y:-2, scale:1.04 }} whileTap={{ scale:0.96 }} onClick={onClick} style={{
      background:color, color:'#fff', border:'none', padding:'13px 22px', borderRadius:2,
      fontSize:12, fontWeight:900, letterSpacing:'0.1em', cursor:'pointer', fontFamily:FONT,
      boxShadow:'0 5px 12px rgba(0,0,0,0.4)',
    }}>
      {icon} {label}
    </motion.button>
  );
}

export default Results;
