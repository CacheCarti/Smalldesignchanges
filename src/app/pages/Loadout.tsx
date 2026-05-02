import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useGame } from '../context/GameContext';
import { Pokemon, getSpriteUrl, overallRating, ARCHITECTURE_COLORS } from '../data/pokemon';
import { BATTLE_IMAGES } from '../data/gameImages';
import { motion, AnimatePresence } from 'motion/react';

const MANILLA      = '#C9A96E';
const MANILLA_LIGHT= '#D4B88A';
const MANILLA_DARK = '#A07840';
const MANILLA_INNER= '#E8D0A8';
const FONT         = "'Courier New', monospace";
const AMBER        = '#f5a742';

const MOOD_EMOJI: Record<string, string> = {
  content:'😊', hyped:'🤩', tired:'😴', dazed:'😵', confused:'🥴'
};

export function Loadout() {
  const nav = useNavigate();
  const { inventory, companions, activePokemon, setActivePokemon, initCardCombat } = useGame();
  const [flipping, setFlipping] = useState(false);

  const preview = BATTLE_IMAGES[0];

  const handleEnterArena = () => {
    if (!activePokemon) return;
    initCardCombat(activePokemon);
    setFlipping(true);
    // After flip animation, navigate
    setTimeout(() => nav('/battle'), 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse at 20% 30%, rgba(100,60,20,0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 70%, rgba(60,30,10,0.2) 0%, transparent 50%),
        linear-gradient(160deg, #2a1a0a 0%, #1a0f05 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT, padding: '20px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Cork wall background texture */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse at center, rgba(100,60,20,0.08) 0%, transparent 70%)',
      }} />

      {/* Back button */}
      <button onClick={() => nav('/map')} style={{
        position:'absolute', top:20, left:20, zIndex:10,
        background:'rgba(200,160,80,0.2)', border:`1px solid ${MANILLA_DARK}`,
        color: MANILLA_LIGHT, padding:'6px 14px', borderRadius:4,
        fontSize:11, fontWeight:800, letterSpacing:'0.15em', cursor:'pointer',
      }}>← MAP</button>

      {/* Manila Folder - Full Page */}
      <motion.div
        animate={flipping ? { rotateY: 180, opacity: 0 } : { rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
        style={{
          width: '92vw', maxWidth: 1100, minHeight: '80vh',
          position: 'relative', transformStyle: 'preserve-3d',
        }}
      >
        {/* Folder Outer */}
        <div style={{
          position:'relative',
          background: `linear-gradient(160deg, ${MANILLA_LIGHT} 0%, ${MANILLA} 40%, ${MANILLA_DARK} 100%)`,
          borderRadius:'4px 4px 8px 8px',
          boxShadow:'0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 8px rgba(0,0,0,0.2)',
          minHeight:'80vh',
          border:`1px solid ${MANILLA_DARK}`,
        }}>
          {/* Folder Tab */}
          <div style={{
            position:'absolute', top:-32, left:30,
            background:`linear-gradient(180deg, ${MANILLA_LIGHT} 0%, ${MANILLA} 100%)`,
            padding:'8px 28px', borderRadius:'6px 6px 0 0',
            border:`1px solid ${MANILLA_DARK}`, borderBottom:'none',
            fontSize:13, fontWeight:900, color:'#3a2a0a', letterSpacing:'0.15em',
            boxShadow:'0 -4px 12px rgba(0,0,0,0.3)',
          }}>
            ANNOTOPIA — CASE #{Math.floor(Math.random() * 9000) + 1000}
          </div>

          {/* Tab label 2 */}
          <div style={{
            position:'absolute', top:-32, right:80,
            background:MANILLA_DARK, padding:'6px 20px', borderRadius:'6px 6px 0 0',
            fontSize:9, fontWeight:900, color: MANILLA_LIGHT, letterSpacing:'0.2em',
            border:`1px solid ${MANILLA_DARK}66`,
          }}>
            RESTRICTED
          </div>

          {/* Folder fold line */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:1,
            background:`linear-gradient(90deg, transparent, ${MANILLA_DARK}88, transparent)`,
          }} />

          {/* Horizontal rule lines on folder */}
          {[0.12,0.18,0.24,0.30].map((pct, i) => (
            <div key={i} style={{
              position:'absolute', top:`${pct * 100}%`, left:16, right:16, height:1,
              background:'rgba(100,60,20,0.12)', pointerEvents:'none',
            }} />
          ))}

          {/* Sticker/tape corner decorations */}
          <div style={{
            position:'absolute', top:-3, right:16,
            width:80, height:18, background:'rgba(200,180,100,0.6)',
            transform:'skewX(-15deg)', borderRadius:2,
          }} />

          {/* FILE STAMP in corner */}
          <div style={{
            position:'absolute', top:14, right:20, transform:'rotate(-8deg)',
            border:'3px solid rgba(180,40,40,0.6)', color:'rgba(180,40,40,0.7)',
            padding:'4px 10px', fontSize:13, fontWeight:900, letterSpacing:'0.1em',
            fontFamily: FONT, borderRadius:3, pointerEvents:'none',
          }}>CLASSIFIED</div>

          {/* Inner content area */}
          <div style={{ padding:'32px 36px 36px', position:'relative' }}>
            {/* Header */}
            <div style={{ marginBottom:24, borderBottom:`2px solid rgba(100,60,20,0.2)`, paddingBottom:12 }}>
              <div style={{ fontSize:9, fontWeight:900, color:'rgba(100,60,20,0.6)', letterSpacing:'0.3em', marginBottom:4 }}>
                FIELD OPERATIVE SELECTION — PICK ONE COMPANION FOR THIS CASE
              </div>
              <div style={{ fontSize:26, fontWeight:900, color:'#2a1a0a', letterSpacing:'0.05em', fontFamily: FONT }}>
                ASSEMBLE THE SQUAD
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:24 }}>
              {/* Pokemon Sticker Grid */}
              <div>
                <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.2em', color:'rgba(80,50,20,0.7)', marginBottom:14 }}>
                  ACTIVE OPERATIVES — TAP TO SELECT
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:14 }}>
                  {inventory.map(p => {
                    const active = activePokemon?.id === p.id;
                    const c = companions[p.id];
                    const arch = ARCHITECTURE_COLORS[p.architecture];
                    const ovr = overallRating(p.stats);
                    return (
                      <PokemonSticker
                        key={p.id}
                        pokemon={p}
                        active={active}
                        bond={c?.bond ?? 0}
                        stamina={c?.stamina ?? 100}
                        morale={c?.morale ?? 'content'}
                        ovr={ovr}
                        arch={arch}
                        onClick={() => setActivePokemon(p)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Right Panel — Selected + Preview + CTA */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {/* Selected Pokemon dossier */}
                <div style={{
                  background:'rgba(100,60,20,0.08)', border:`1px solid rgba(100,60,20,0.2)`,
                  borderRadius:4, padding:14, minHeight:140,
                }}>
                  <div style={{ fontSize:9, letterSpacing:'0.22em', fontWeight:900, color:'rgba(80,40,10,0.6)', marginBottom:8 }}>
                    DOSSIER — ACTIVE OPERATIVE
                  </div>
                  {activePokemon ? (
                    <div>
                      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                        <div style={{
                          background:'#1a1a1a', padding:6, borderRadius:2,
                          transform:'rotate(-2deg)', boxShadow:'2px 3px 8px rgba(0,0,0,0.4)',
                          border:`2px solid ${ARCHITECTURE_COLORS[activePokemon.architecture].color}66`,
                        }}>
                          <img src={getSpriteUrl(activePokemon.id)} style={{ width:60, height:60, objectFit:'contain', imageRendering:'pixelated' }} />
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:18, fontWeight:900, color:'#2a1a0a', lineHeight:1 }}>{activePokemon.name}</div>
                          <div style={{ fontSize:9, color: ARCHITECTURE_COLORS[activePokemon.architecture].color, fontWeight:900, marginTop:3, letterSpacing:'0.12em' }}>
                            {ARCHITECTURE_COLORS[activePokemon.architecture].label} · {activePokemon.rarity.toUpperCase()}
                          </div>
                          <div style={{ fontSize:9, color:'rgba(80,40,10,0.7)', marginTop:4, lineHeight:1.4 }}>
                            {activePokemon.description}
                          </div>
                        </div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4, marginTop:10 }}>
                        {(['pace','verbal','spatial','accuracy'] as const).map(k => (
                          <div key={k} style={{ background:'rgba(0,0,0,0.08)', borderRadius:3, padding:'4px 6px', textAlign:'center' }}>
                            <div style={{ fontSize:7, color:'rgba(80,40,10,0.55)', letterSpacing:'0.1em', fontWeight:900 }}>{k.slice(0,3).toUpperCase()}</div>
                            <div style={{ fontSize:17, fontWeight:900, color:'#2a1a0a' }}>{activePokemon.stats[k]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color:'rgba(80,40,10,0.45)', fontSize:12, padding:'20px 0', textAlign:'center', lineHeight:1.5 }}>
                      Select an operative from<br />the roster on the left
                    </div>
                  )}
                </div>

                {/* Case Preview */}
                <div style={{
                  background:'rgba(0,0,0,0.12)', border:`1px solid rgba(100,60,20,0.2)`,
                  borderRadius:4, overflow:'hidden',
                }}>
                  <img src={preview.url} style={{ width:'100%', height:100, objectFit:'cover', display:'block' }} />
                  <div style={{ padding:'8px 12px' }}>
                    <div style={{ fontSize:11, fontWeight:900, color:'#2a1a0a' }}>{preview.label}</div>
                    <div style={{ fontSize:9, color:'rgba(80,40,10,0.65)', marginTop:2, lineHeight:1.3 }}>{preview.mission}</div>
                  </div>
                </div>

                {/* Enter Arena CTA */}
                <motion.button
                  disabled={!activePokemon}
                  whileHover={activePokemon ? { scale: 1.03, y: -2 } : {}}
                  whileTap={activePokemon ? { scale: 0.97 } : {}}
                  onClick={handleEnterArena}
                  style={{
                    background: activePokemon
                      ? `linear-gradient(180deg, #d4a043 0%, #a06820 100%)`
                      : 'rgba(100,60,20,0.15)',
                    color: activePokemon ? '#1a0f05' : 'rgba(80,40,10,0.35)',
                    border: 'none', padding:'16px 0', borderRadius:4,
                    fontSize:14, fontWeight:900, letterSpacing:'0.22em',
                    cursor: activePokemon ? 'pointer' : 'not-allowed',
                    fontFamily: FONT,
                    boxShadow: activePokemon ? '0 6px 18px rgba(160,104,32,0.4)' : 'none',
                    textShadow: activePokemon ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                  }}>
                  ▶ ENTER THE ARENA
                </motion.button>

                {!activePokemon && (
                  <div style={{ fontSize:9, color:'rgba(80,40,10,0.5)', textAlign:'center', letterSpacing:'0.1em' }}>
                    SELECT AN OPERATIVE FIRST
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Flipping overlay */}
      <AnimatePresence>
        {flipping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position:'fixed', inset:0, zIndex:100,
              background:'rgba(200,160,80,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center',
              backdropFilter:'blur(2px)',
            }}>
            <div style={{ fontSize:18, fontWeight:900, color:MANILLA_LIGHT, letterSpacing:'0.3em', fontFamily:FONT, textShadow:'0 2px 8px rgba(0,0,0,0.6)' }}>
              OPENING CASE FILE...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PokemonSticker({ pokemon, active, bond, stamina, morale, ovr, arch, onClick }: {
  pokemon: Pokemon; active: boolean; bond: number; stamina: number;
  morale: string; ovr: number; arch: { color: string; label: string }; onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, rotate: 0, scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        position:'relative', cursor:'pointer',
        background: active
          ? `linear-gradient(160deg, #fff8ee 0%, #fff0d0 100%)`
          : `linear-gradient(160deg, #f8f0e0 0%, #ede4cc 100%)`,
        border: active ? `2.5px solid ${AMBER}` : `1.5px solid rgba(120,80,30,0.3)`,
        boxShadow: active
          ? `0 8px 22px rgba(160,104,32,0.45), 0 2px 6px rgba(0,0,0,0.25)`
          : `0 3px 10px rgba(0,0,0,0.2), 1px 1px 0 rgba(255,255,255,0.5)`,
        borderRadius:3,
        padding:'10px 10px 8px',
        transform: `rotate(${pokemon.id % 2 === 0 ? -1.5 : 1.5}deg)`,
        transition:'border 0.15s, box-shadow 0.15s',
      }}>
      {/* Active ribbon */}
      {active && (
        <div style={{
          position:'absolute', top:-9, left:8,
          background: AMBER, color:'#1a0f05',
          fontSize:8, fontWeight:900, letterSpacing:'0.15em',
          padding:'2px 8px', borderRadius:3, zIndex:3,
          boxShadow:'0 2px 6px rgba(160,104,32,0.5)',
        }}>ACTIVE</div>
      )}

      {/* Arch badge */}
      <div style={{ fontSize:8, fontWeight:900, color:arch.color, letterSpacing:'0.1em', marginBottom:4 }}>
        {arch.label}
      </div>

      {/* Sprite on dark polaroid-like bg */}
      <div style={{
        background:'linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%)',
        borderRadius:2, padding:4, marginBottom:6,
        boxShadow:'inset 0 2px 6px rgba(0,0,0,0.6)',
        display:'flex', alignItems:'center', justifyContent:'center',
        height:72,
      }}>
        <img
          src={getSpriteUrl(pokemon.id)}
          style={{ width:64, height:64, objectFit:'contain', imageRendering:'pixelated', filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
        />
      </div>

      {/* Name + mood */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:11, fontWeight:900, color:'#2a1a0a', fontFamily:FONT, letterSpacing:'0.02em' }}>
          {pokemon.name}
        </div>
        <span style={{ fontSize:12 }}>{MOOD_EMOJI[morale]}</span>
      </div>

      {/* Stats bar */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:8, color:'rgba(80,40,10,0.7)', fontWeight:800 }}>
        <span>OVR <span style={{ color:'#2a1a0a', fontWeight:900 }}>{ovr}</span></span>
        <span>STM <span style={{ color:'#2e7d32' }}>{stamina}</span></span>
        <span>BND <span style={{ color:'#c62828' }}>{bond}</span></span>
      </div>

      {/* Stamina bar */}
      <div style={{ marginTop:5, height:3, background:'rgba(0,0,0,0.1)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${stamina}%`, height:'100%', background: stamina > 60 ? '#5db44b' : stamina > 30 ? '#f5a742' : '#c62828', borderRadius:2 }} />
      </div>
    </motion.div>
  );
}

export default Loadout;
