import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ALL_POKEMON, overallRating } from '../data/pokemon';
import { motion } from 'motion/react';

const CORK      = '#5D4037';
const CORK_DARK = '#1A1A1A';
const POLA      = '#f5ede0';
const STICKY_Y  = '#F9E97E';
const MANILLA   = '#D5BCA4';
const RED       = '#C62828';
const FONT      = "'Courier New', monospace";

const RANK_LABELS: Record<number, { badge: string; color: string; title: string }> = {
  1: { badge:'#F9A825', color:'#F9A825', title:'LEAD INSPECTOR' },
  2: { badge:'#9CA3AF', color:'#9CA3AF', title:'SENIOR DETECTIVE' },
  3: { badge:'#92400E', color:'#CD7F32', title:'DETECTIVE FIRST CLASS' },
};

const DETECTIVE_RANKS = [
  { min:0,     max:999,    label:'CADET',              icon:'🔍', color:'#9CA3AF' },
  { min:1000,  max:4999,   label:'FIELD AGENT',        icon:'🕵️', color:'#60A5FA' },
  { min:5000,  max:14999,  label:'DETECTIVE',          icon:'🔎', color:'#34D399' },
  { min:15000, max:39999,  label:'SENIOR DETECTIVE',   icon:'🗂️', color:'#F59E0B' },
  { min:40000, max:99999,  label:'CHIEF INSPECTOR',    icon:'📋', color:'#A78BFA' },
  { min:100000,max:Infinity,label:'DIRECTOR',          icon:'👑', color:'#EF4444' },
];

function getDetectiveRank(score: number) {
  return DETECTIVE_RANKS.find(r => score >= r.min && score <= r.max) ?? DETECTIVE_RANKS[0];
}

const MOCK_TRENDS = [3,-1,2,0,1,-2,0,3,-1,2,0,-1,1,0,2];

function TrendBadge({ change }: { change: number }) {
  if (change > 0) return <span style={{ color:'#2e7d32', fontSize:9, fontWeight:900 }}>▲{change}</span>;
  if (change < 0) return <span style={{ color:RED, fontSize:9, fontWeight:900 }}>▼{Math.abs(change)}</span>;
  return <span style={{ color:'#888', fontSize:9 }}>—</span>;
}

export function LeaderboardPage() {
  const { leaderboard, playerName, teamEnsembles, totalScore } = useGame();
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const playerEntry = leaderboard.find(e => e.isPlayer);
  const playerRank  = playerEntry?.rank || 'N/A';
  const playerDetRank = getDetectiveRank(totalScore);

  const topThree = leaderboard.slice(0, 3);

  return (
    <div style={{
      minHeight:'100vh',
      background:`radial-gradient(circle at 25% 30%, rgba(93,64,55,0.3) 0%, transparent 45%), linear-gradient(135deg, ${CORK} 0%, ${CORK_DARK} 100%)`,
      fontFamily:FONT, padding:'20px 24px 40px',
    }}>
      {/* Cork noise */}
      <svg style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.10, zIndex:0 }}>
        <filter id="lb-noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="n" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#lb-noise)" />
      </svg>

      <div style={{ position:'relative', zIndex:1, maxWidth:900, margin:'0 auto' }}>
        {/* Header Polaroid */}
        <motion.div initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }}
          style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{
            display:'inline-block', background:POLA, padding:'16px 40px', borderRadius:2,
            transform:'rotate(-0.5deg)', boxShadow:'4px 6px 16px rgba(0,0,0,0.5)',
            position:'relative',
          }}>
            <div style={{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', width:12, height:12, borderRadius:'50%', background:RED, boxShadow:'0 2px 4px rgba(0,0,0,0.5)' }} />
            <div style={{ fontSize:10, color:RED, letterSpacing:'0.3em', fontWeight:900, marginBottom:4, marginTop:8 }}>
              INTERDEPARTMENTAL RANKINGS
            </div>
            <div style={{ fontSize:30, fontWeight:900, color:'#1a1a1a', letterSpacing:'0.06em' }}>
              CASE FILE RANKINGS
            </div>
            <div style={{ fontSize:10, color:'#555', marginTop:4 }}>Annotate, train, and climb to Director rank</div>
          </div>
        </motion.div>

        {/* Player quick stats — looks like an ID card */}
        <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.1 }}
          style={{
            background:MANILLA, border:`1px solid rgba(200,160,80,0.5)`, borderRadius:2,
            padding:'14px 20px', marginBottom:20, transform:'rotate(-0.3deg)',
            boxShadow:'3px 5px 14px rgba(0,0,0,0.4)',
            display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12,
          }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* Detective badge */}
            <div style={{
              width:56, height:56, borderRadius:2, background:'#1a1a1a',
              border:`2px solid ${playerDetRank.color}`, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:26, boxShadow:`0 0 12px ${playerDetRank.color}55`,
            }}>
              {playerDetRank.icon}
            </div>
            <div>
              <div style={{ fontSize:7, color:'rgba(58,42,26,0.6)', fontWeight:900, letterSpacing:'0.15em' }}>DETECTIVE ID</div>
              <div style={{ fontSize:18, fontWeight:900, color:'#1a1a1a', lineHeight:1 }}>{playerName}</div>
              <div style={{ fontSize:9, color:playerDetRank.color, fontWeight:900, marginTop:2, letterSpacing:'0.08em' }}>
                {playerDetRank.icon} {playerDetRank.label}
              </div>
              <div style={{ fontSize:7, color:'rgba(58,42,26,0.5)', marginTop:1 }}>
                GLOBAL RANK: <span style={{ fontWeight:900, color:'#1a1a1a' }}>{typeof playerRank === 'number' ? `#${playerRank}` : 'UNRANKED'}</span>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:16 }}>
            {[
              { label:'CASE SCORE',   value: totalScore.toLocaleString(),  color:'#1a1a1a' },
              { label:'TEAM POWER',   value: teamEnsembles.flat().reduce((s,p) => s + overallRating(p.stats), 0) || '—', color:'#2e7d32' },
              { label:'NEXT RANK AT', value: `${Math.max(0, (DETECTIVE_RANKS.find(r => totalScore < r.min)?.min ?? 0)).toLocaleString()}`, color:RED },
            ].map(item => (
              <div key={item.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:900, color:item.color, fontFamily:FONT }}>{item.value}</div>
                <div style={{ fontSize:7, color:'rgba(58,42,26,0.55)', fontWeight:900, letterSpacing:'0.1em' }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* Rank badge for this detective */}
          <div style={{ transform:'rotate(8deg)', border:`3px solid ${playerDetRank.color}`, color:playerDetRank.color, padding:'4px 10px', fontSize:11, fontWeight:900, borderRadius:3, fontFamily:FONT }}>
            {playerDetRank.label}
          </div>
        </motion.div>

        {/* Top 3 Podium — as polaroid frames */}
        <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.2 }} style={{ marginBottom:20 }}>
          <div style={{ fontSize:9, fontWeight:900, color:'rgba(200,160,80,0.5)', letterSpacing:'0.2em', marginBottom:12, textAlign:'center' }}>
            ── TOP DETECTIVES ──
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center', alignItems:'flex-end', flexWrap:'wrap' }}>
            {[topThree[1], topThree[0], topThree[2]].filter(Boolean).map((entry, podiumIdx) => {
              if (!entry) return null;
              const actualRank = entry.rank;
              const rl = RANK_LABELS[actualRank] ?? { badge:'#555', color:'#555', title:'AGENT' };
              const isPlayer = entry.isPlayer;
              const entryPokemons = ALL_POKEMON.filter(p => entry.pokemon.includes(p.id)).slice(0, 3);

              return (
                <motion.div key={entry.name} initial={{ y:30, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.1 * podiumIdx }}
                  style={{
                    flex:'1 1 180px', maxWidth:220,
                    background: isPlayer ? POLA : '#f0e8d4',
                    border:`2px solid ${isPlayer ? '#F9A825' : 'rgba(200,160,80,0.3)'}`,
                    borderRadius:2, padding:'14px 12px',
                    boxShadow: actualRank===1 ? `4px 6px 20px rgba(0,0,0,0.5), 0 0 0 1px ${rl.badge}44` : '3px 4px 12px rgba(0,0,0,0.35)',
                    position:'relative', textAlign:'center',
                    transform:`rotate(${podiumIdx === 0 ? -2 : podiumIdx === 1 ? 0.5 : 2}deg)`,
                  }}>
                  {isPlayer && (
                    <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', background:'#F9A825', borderRadius:3, padding:'2px 8px', fontSize:7, fontWeight:900, color:'#1a1a1a', letterSpacing:'0.1em' }}>
                      YOU
                    </div>
                  )}
                  <div style={{ fontSize:24, marginBottom:3 }}>
                    {actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : '🥉'}
                  </div>
                  <div style={{ fontSize:13, fontWeight:900, color:'#1a1a1a', marginBottom:2 }}>{entry.name}</div>
                  <div style={{ fontSize:9, color:rl.color, fontWeight:900, letterSpacing:'0.1em', marginBottom:4 }}>{rl.title}</div>
                  <div style={{ fontSize:20, fontWeight:900, color:rl.badge, fontFamily:FONT }}>{entry.score.toLocaleString()}</div>
                  <div style={{ fontSize:7, color:'rgba(0,0,0,0.4)', marginTop:2 }}>{entry.wins} cases solved</div>
                  <div style={{ display:'flex', justifyContent:'center', gap:4, marginTop:8 }}>
                    {entryPokemons.map(p => (
                      <img key={p.id} src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                        alt={p.name} style={{ width:24, height:24, objectFit:'contain', imageRendering:'pixelated' }} />
                    ))}
                  </div>
                  {/* Gold/silver/bronze bar */}
                  <div style={{ height:5, background:`linear-gradient(90deg, ${rl.badge}aa, ${rl.badge})`, borderRadius:2, marginTop:10, boxShadow:`0 0 6px ${rl.badge}66` }} />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Rank guide */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
          {DETECTIVE_RANKS.map(r => (
            <div key={r.label} style={{
              display:'flex', alignItems:'center', gap:4, background:POLA,
              border:`1px solid ${r.color}44`, borderRadius:2, padding:'3px 8px',
              boxShadow:'1px 2px 5px rgba(0,0,0,0.2)',
              opacity: totalScore >= r.min ? 1 : 0.4,
              transform:'rotate(0.5deg)',
            }}>
              <span style={{ fontSize:10 }}>{r.icon}</span>
              <span style={{ fontSize:7, fontWeight:900, color:r.color, letterSpacing:'0.06em' }}>{r.label}</span>
              <span style={{ fontSize:7, color:'rgba(0,0,0,0.35)', fontWeight:700 }}>{r.min.toLocaleString()}+</span>
            </div>
          ))}
        </div>

        {/* View toggle */}
        <div style={{ display:'flex', gap:4, marginBottom:10 }}>
          {(['full','compact'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              background: viewMode === m ? POLA : 'rgba(200,160,80,0.1)',
              border:`1px solid ${viewMode === m ? 'rgba(200,160,80,0.4)' : 'transparent'}`,
              color: viewMode === m ? '#1a1a1a' : 'rgba(200,160,80,0.5)',
              padding:'4px 12px', borderRadius:2, fontSize:9, fontWeight:900, cursor:'pointer',
              letterSpacing:'0.12em', fontFamily:FONT,
            }}>{m.toUpperCase()}</button>
          ))}
        </div>

        {/* Leaderboard table — looks like a classified dossier list */}
        <div style={{ background:POLA, borderRadius:2, overflow:'hidden', boxShadow:'3px 4px 14px rgba(0,0,0,0.4)', transform:'rotate(-0.2deg)' }}>
          {/* Header row */}
          <div style={{
            display:'grid',
            gridTemplateColumns: viewMode === 'full' ? '44px 1fr 90px 70px 70px 70px' : '44px 1fr 110px 70px',
            gap:8, padding:'8px 14px',
            background:'rgba(0,0,0,0.08)', borderBottom:'1px solid rgba(0,0,0,0.1)',
            fontSize:8, fontWeight:900, color:'rgba(0,0,0,0.45)', letterSpacing:'0.12em',
          }}>
            <span>RANK</span><span>DETECTIVE</span>
            <span style={{ textAlign:'right' }}>SCORE</span>
            <span style={{ textAlign:'right' }}>ROUND</span>
            {viewMode === 'full' && <><span style={{ textAlign:'right' }}>CASES</span><span style={{ textAlign:'center' }}>SQUAD</span></>}
          </div>

          {leaderboard.map((entry, idx) => {
            const rl = RANK_LABELS[entry.rank];
            const isPlayer = entry.isPlayer;
            const trend = MOCK_TRENDS[idx % MOCK_TRENDS.length];
            const entryPokemons = ALL_POKEMON.filter(p => entry.pokemon.includes(p.id)).slice(0, 3);
            const detRank = getDetectiveRank(entry.score);

            return (
              <motion.div key={entry.name} initial={{ x:-20, opacity:0 }} animate={{ x:0, opacity:1 }} transition={{ delay:idx*0.03 }}
                onMouseEnter={() => setHoveredRow(idx)} onMouseLeave={() => setHoveredRow(null)}
                style={{
                  display:'grid',
                  gridTemplateColumns: viewMode === 'full' ? '44px 1fr 90px 70px 70px 70px' : '44px 1fr 110px 70px',
                  gap:8, padding:'10px 14px',
                  borderBottom:'1px solid rgba(0,0,0,0.06)',
                  background: isPlayer ? 'rgba(249,168,37,0.12)' : hoveredRow === idx ? 'rgba(0,0,0,0.03)' : 'transparent',
                  alignItems:'center', transition:'background 0.15s',
                  outline: isPlayer ? '1px solid rgba(249,168,37,0.2)' : 'none',
                }}>
                {/* Rank */}
                <div style={{ fontSize:entry.rank<=3 ? 16 : 11, fontWeight:900, color:rl?.badge ?? '#888', textAlign:'center', fontFamily:FONT }}>
                  {entry.rank<=3 ? (entry.rank===1 ? '🥇' : entry.rank===2 ? '🥈' : '🥉') : `#${entry.rank}`}
                </div>

                {/* Name */}
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{
                    width:26, height:26, borderRadius:2,
                    background: isPlayer ? '#1a1a1a' : 'rgba(0,0,0,0.1)',
                    border:`1.5px solid ${isPlayer ? '#F9A825' : 'rgba(0,0,0,0.15)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:12,
                  }}>
                    {isPlayer ? '🎮' : detRank.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:900, color: isPlayer ? '#1a1a1a' : '#2a1a0a', fontFamily:FONT }}>
                      {entry.name} {isPlayer && <span style={{ fontSize:7, color:'#F9A825', marginLeft:4 }}>YOU</span>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <span style={{ fontSize:7, color:detRank.color, fontWeight:900 }}>{detRank.label}</span>
                      <TrendBadge change={isPlayer ? 0 : trend} />
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign:'right', fontSize:13, fontWeight:900, color:'#1a1a1a', fontFamily:FONT }}>
                  {entry.score.toLocaleString()}
                </div>
                <div style={{ textAlign:'right', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.45)', fontFamily:FONT }}>
                  {entry.roundScore.toLocaleString()}
                </div>

                {viewMode === 'full' && (
                  <>
                    <div style={{ textAlign:'right', fontSize:10, color:'rgba(0,0,0,0.45)', fontWeight:700 }}>{entry.wins}W</div>
                    <div style={{ display:'flex', justifyContent:'center', gap:3 }}>
                      {entryPokemons.map(p => (
                        <img key={p.id} src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                          alt={p.name} style={{ width:20, height:20, objectFit:'contain', imageRendering:'pixelated' }} title={p.name} />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Season footer */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
          style={{
            marginTop:16, background:POLA, borderRadius:2, padding:'12px 18px',
            boxShadow:'2px 3px 10px rgba(0,0,0,0.35)', transform:'rotate(0.3deg)',
            display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10,
          }}>
          <div>
            <div style={{ fontSize:10, fontWeight:900, color:'rgba(0,0,0,0.45)', letterSpacing:'0.12em' }}>SEASON 1 — ANNOTOPIA FIELD OPS</div>
            <div style={{ fontSize:9, color:'rgba(0,0,0,0.35)', marginTop:2 }}>Rankings reset monthly. Top 3 earn legendary bonuses.</div>
          </div>
          <div style={{ display:'flex', gap:14 }}>
            {[{ label:'ACTIVE DETECTIVES', value:leaderboard.length }, { label:'TOP SCORE', value:leaderboard[0]?.score.toLocaleString() }].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:900, color:'#1a1a1a', fontFamily:FONT }}>{s.value}</div>
                <div style={{ fontSize:7, color:'rgba(0,0,0,0.4)', fontWeight:900, letterSpacing:'0.1em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default LeaderboardPage;
