import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pokemon, getSpriteUrl } from '../data/pokemon';
import { TEST_REVEAL_IMAGES, Q_COLORS } from '../data/gameImages';

type Phase = 'predictions' | 'keys' | 'victor';

interface Props {
  player: Pokemon;
  ghost: { id: number; name: string; color: string; acc: number };
  won: boolean;
  revealIdx?: number;
}

const POLAROID = '#f8f2e6';
const PIN_RED = '#e43939';
const MARKER_RED = '#D32F2F';
const MARKER_GHOST = '#9C27B0';
const HIGHLIGHT_YELLOW = '#FFEB3B';
const FONT = "'Courier New', monospace";

export function BattleArena({ player, ghost, won, revealIdx = 0 }: Props) {
  const [phase, setPhase] = useState<Phase>('predictions');
  const reveal = TEST_REVEAL_IMAGES[revealIdx % TEST_REVEAL_IMAGES.length];

  useEffect(() => {
    const steps: [Phase, number][] = [
      ['predictions', 2800],
      ['keys', 2800],
      ['victor', 9999],
    ];
    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      setPhase(steps[i][0]);
      if (i < steps.length - 1) {
        const t = setTimeout(() => { i++; tick(); }, steps[i][1]);
        (tick as any)._t = t;
      }
    };
    tick();
    return () => { cancelled = true; clearTimeout((tick as any)._t); };
  }, [revealIdx]); // restart on revealIdx change

  const playerCrosshairs = reveal.probeTargets.slice(0, 4);
  const answerCrosshairs = reveal.probeTargets2;

  return (
    <div style={{
      background: '#d5bca4',
      border: '1px solid #b39a82',
      borderRadius: 2,
      padding: 14,
      position: 'relative',
      boxShadow: '0 4px 10px rgba(0,0,0,0.3), inset 0 0 40px rgba(0,0,0,0.1)',
      fontFamily: FONT,
    }}>
      {/* Evidence folder tab */}
      <div style={{
        position: 'absolute', top: -20, left: 20, background: '#d5bca4',
        padding: '2px 14px', border: '1px solid #b39a82', borderBottom: 'none',
        borderRadius: '4px 4px 0 0', fontSize: 10, fontWeight: 900, color: '#3a2a1a'
      }}>
        CASE REVEAL BOARD
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['predictions','keys','victor'] as Phase[]).map(p => (
            <div key={p} style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
              padding: '2px 6px', borderRadius: 2,
              background: phase === p ? '#D32F2F' : 'transparent',
              color: phase === p ? '#fff' : '#8a7a6a',
              border: `1px solid ${phase === p ? '#D32F2F' : '#b39a82'}`,
            }}>{p.toUpperCase()}</div>
          ))}
        </div>
      </div>

      {/* ─── Evidence Photo ───────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        background: POLAROID,
        padding: '12px 12px 30px 12px',
        boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
        transform: 'rotate(-1deg)',
        margin: '0 auto', maxWidth: 400
      }}>
        {/* Pushpin */}
        <Pin color={PIN_RED} style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)' }} />

        <div style={{
          position: 'relative',
          width: '100%', aspectRatio: '16/9',
          background: '#000', overflow: 'hidden',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.4)',
        }}>
          <img src={reveal.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: phase === 'victor' ? 0.6 : 0.85 }} />

          {/* Player Predictions (Red Marker) */}
          <AnimatePresence>
            {(phase === 'predictions' || phase === 'victor') && playerCrosshairs.map((t, i) => (
              <motion.div key={`pc-${i}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: phase === 'victor' && !won ? 0.3 : 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ delay: phase === 'predictions' ? i * 0.18 : 0 }}
                style={{
                  position: 'absolute', left: `${t.x}%`, top: `${t.y}%`,
                  transform: 'translate(-50%,-50%)', width: 36, height: 36, pointerEvents: 'none',
                }}>
                <MarkerCircle color={MARKER_RED} />
                <div style={{
                  position: 'absolute', top: 38, left: '50%', transform: 'translateX(-50%)',
                  color: MARKER_RED, fontSize: 11, fontWeight: 900,
                  whiteSpace: 'nowrap', fontFamily: "'Nanum Pen Script', 'Caveat', cursive",
                }}>Mark {i+1}</div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Answer Keys (Evidence Tags / Tracing Paper) */}
          <AnimatePresence>
            {(phase === 'keys' || phase === 'victor') && answerCrosshairs.map((t, i) => (
              <motion.div key={`ak-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: phase === 'victor' && won ? 0.4 : 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ delay: phase === 'keys' ? i * 0.18 : 0, type: 'spring' }}
                style={{
                  position: 'absolute', left: `${t.x}%`, top: `${t.y}%`,
                  transform: 'translate(-50%,-50%)', pointerEvents: 'none',
                }}>
                <div style={{
                  width: 20, height: 20, background: HIGHLIGHT_YELLOW,
                  border: '1px solid #111', color: '#111', fontSize: 12, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '2px 2px 0 rgba(0,0,0,0.5)', transform: `rotate(${Math.random() * 20 - 10}deg)`
                }}>
                  {i+1}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Victor Stamp Overlay */}
          <AnimatePresence>
            {phase === 'victor' && (
              <motion.div
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-15deg)',
                  border: '6px solid #D32F2F', color: '#D32F2F', padding: '10px 20px',
                  fontSize: 36, fontWeight: 900, borderRadius: 4, zIndex: 10,
                  pointerEvents: 'none', background: 'rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}
              >
                CASE CLOSED
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Polaroid label */}
        <div style={{ position: 'absolute', bottom: 6, left: 12, fontFamily: "'Nanum Pen Script', 'Caveat', cursive", fontSize: 18, color: '#1a1a1a', fontWeight: 800 }}>
          Exhibit A - Ref #{revealIdx+1}
        </div>
      </div>

      {/* ─── Suspect / Detective Profiles ─────────────────────────────────────── */}
      <div style={{
        marginTop: 20, display: 'flex', justifyContent: 'center', gap: 20
      }}>
        {/* player fighter */}
        <DetectiveProfile
          sprite={getSpriteUrl(player.id)}
          name={player.name}
          color={MARKER_RED}
          isWinner={won}
          phase={phase}
        />
        <div style={{ fontSize: 24, fontWeight: 900, color: '#8a7a6a', display: 'flex', alignItems: 'center' }}>VS</div>
        {/* ghost fighter */}
        <DetectiveProfile
          sprite={getSpriteUrl(ghost.id)}
          name={ghost.name}
          color={MARKER_GHOST}
          isWinner={!won}
          phase={phase}
        />
      </div>
    </div>
  );
}

function MarkerCircle({ color }: { color: string }) {
  // SVG drawing of a hand-drawn circle
  return (
    <svg viewBox="0 0 40 40" style={{ width: '100%', height: '100%' }}>
      <path d="M 20 2 C 30 2, 38 10, 38 20 C 38 30, 30 38, 20 38 C 10 38, 2 30, 2 20 C 2 12, 10 3, 21 4" 
        fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
        style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.3))' }} />
    </svg>
  );
}

function DetectiveProfile({ sprite, name, color, isWinner, phase }: {
  sprite: string; name: string; color: string; isWinner: boolean; phase: Phase;
}) {
  const isVictorPhase = phase === 'victor';
  const opacity = isVictorPhase && !isWinner ? 0.4 : 1;
  const scale = isVictorPhase && isWinner ? 1.1 : 1;

  return (
    <motion.div
      animate={{ opacity, scale }}
      transition={{ duration: 0.5 }}
      style={{
        background: POLAROID, padding: '6px', borderRadius: 2,
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)', width: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', transform: `rotate(${Math.random() * 4 - 2}deg)`
      }}>
      <Pin color={PIN_RED} style={{ position: 'absolute', top: -5 }} />
      <div style={{ width: '100%', height: 70, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={sprite} style={{ width: 64, height: 64, objectFit: 'contain' }} />
      </div>
      <div style={{
        marginTop: 6, fontSize: 11, fontWeight: 900, color: '#1a1a1a',
        textAlign: 'center', wordBreak: 'break-all', width: '100%'
      }}>
        {name.toUpperCase()}
      </div>
      {isVictorPhase && isWinner && (
        <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 24, transform: 'rotate(15deg)' }}>🏆</div>
      )}
    </motion.div>
  );
}

function Pin({ color, style }: { color: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: 10, height: 10, borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, #fff 0%, ${color} 40%, #222 100%)`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.5)', zIndex: 5,
      ...style
    }} />
  );
}

export default BattleArena;