import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useGame } from '../context/GameContext';
import {
  Pokemon, getSpriteUrl, overallRating, ARCHITECTURE_COLORS, rarityColors,
} from '../data/pokemon';

const PANEL = '#D5BCA4';
const PANEL_INNER = '#C4AB93';
const BG_DARK   = '#141414';
const BG_MID    = '#1F1A17';
const CORK = BG_MID;
const CORK_DARK = BG_DARK;
const FELT = '#0f3d26';
const AMBER = '#C62828'; // RED
const PAPER = '#f4e9ce';
const INK = '#1a120a';
const FONT = "'Courier New', monospace";
const MONO = "'Courier New', monospace";
const POLAROID = '#f8f2e6';

function RealisticPin({ color, style }: { color: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      position:'absolute', width:14, height:14, borderRadius:'50%', zIndex:10,
      background:`radial-gradient(circle at 35% 30%, #fff 0%, ${color} 35%, rgba(0,0,0,0.5) 100%)`,
      boxShadow:`0 2px 5px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.15)`,
      ...style
    }}>
      <div style={{ position:'absolute', top:'90%', left:'50%', transform:'translateX(-50%)', width:2, height:5, background:'#999' }} />
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

const MOOD: Record<string, string> = { content:'😊', hyped:'🤩', tired:'😴', dazed:'😵', confused:'🥴' };

type Filter = 'all' | 'onCase' | 'atAgency' | 'recovering';

export function Agency() {
  const nav = useNavigate();
  const { inventory, companions, activePokemon, setActivePokemon, feedCompanion, playerName } = useGame();
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Pokemon | null>(activePokemon ?? inventory[0] ?? null);

  // ─── Classify agents by status ──────────────────────────────────────
  const buckets = useMemo(() => {
    const onCase: Pokemon[] = [];
    const atAgency: Pokemon[] = [];
    const recovering: Pokemon[] = [];
    inventory.forEach(p => {
      const c = companions[p.id];
      const stam = c?.stamina ?? 100;
      if (activePokemon?.id === p.id) onCase.push(p);
      else if (stam < 50) recovering.push(p);
      else atAgency.push(p);
    });
    return { onCase, atAgency, recovering };
  }, [inventory, companions, activePokemon]);

  // ─── Agency-wide stats ──────────────────────────────────────────────
  const avgOVR = Math.round(
    inventory.reduce((s, p) => s + overallRating(p.stats), 0) / Math.max(1, inventory.length)
  );
  const avgBond = Math.round(
    inventory.reduce((s, p) => s + (companions[p.id]?.bond ?? 0), 0) / Math.max(1, inventory.length)
  );
  const topSpec = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach(p => { counts[p.architecture] = (counts[p.architecture] ?? 0) + 1; });
    const [arch] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ['CNN', 0];
    return arch;
  }, [inventory]);

  const visible = useMemo(() => {
    if (filter === 'onCase') return buckets.onCase;
    if (filter === 'atAgency') return buckets.atAgency;
    if (filter === 'recovering') return buckets.recovering;
    return inventory;
  }, [filter, buckets, inventory]);

  return (
    <div style={{
      minHeight: '100%',
      background: `linear-gradient(135deg, ${BG_DARK} 0%, ${BG_MID} 50%, ${BG_DARK} 100%)`,
      fontFamily: FONT, color: INK,
      padding: '22px 28px 50px',
      position: 'relative'
    }}>
      {/* Cork grain */}
      <svg style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.12, zIndex:0 }}>
        <filter id="map-noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="n" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#map-noise)" />
      </svg>
      {/* Vignette */}
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)', pointerEvents:'none', zIndex:0 }} />
      
      <div style={{ position:'relative', zIndex:1 }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.35em', color: '#ffb74d', fontWeight: 800 }}>
              ANNOTOPIA BUREAU OF INVESTIGATION · EST. 1996
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#f5ede0', letterSpacing: '0.02em', lineHeight: 1, textShadow:'0 2px 8px rgba(0,0,0,0.6)' }}>
              THE DETECTIVE AGENCY
            </div>
            <div style={{ fontSize: 12, color: '#d7ccc8', marginTop: 4, fontWeight:600 }}>
              Agent dossiers, field assignments, and recovery logs — all in one place.
            </div>
          </div>
          <button onClick={() => nav('/map')} style={{
            background: `linear-gradient(180deg, ${AMBER} 0%, #8e0000 100%)`,
            color: '#fff', border: 'none', padding: '12px 22px', borderRadius: 2,
            fontSize: 12, fontWeight: 900, letterSpacing: '0.2em', cursor: 'pointer', fontFamily: FONT,
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}>DEPLOY TO FIELD →</button>
        </div>

        {/* agency-wide stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10,
          background: PANEL, border: `2px solid ${PANEL_INNER}`, borderRadius: 2, padding: 12,
          marginBottom: 16, boxShadow: '4px 6px 14px rgba(0,0,0,0.4)', position:'relative'
        }}>
          <RealisticPin color="#1565C0" style={{ top:4, left:10 }} />
          <RealisticPin color="#1565C0" style={{ top:4, right:10 }} />
          
          <AgencyStat label="ACTIVE ROSTER" value={inventory.length} suffix="agents" color="#2e7d32" />
          <AgencyStat label="AVG RATING" value={avgOVR} color="#1a1a1a" />
          <AgencyStat label="AVG BOND" value={avgBond} suffix="%" color="#6a1b9a" />
          <AgencyStat label="TOP SPECIALTY" value={topSpec} color={AMBER} small />
          <AgencyStat
            label="IN RECOVERY"
            value={buckets.recovering.length}
            suffix={`/ ${inventory.length}`}
            color={AMBER}
          />
        </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 360px', gap: 16, alignItems: 'flex-start' }}>
        
        {/* ── Left: Detective Persona & Progress ── */}
        <div style={{
          background: PANEL, border: `2px solid ${PANEL_INNER}`, borderRadius: 2, padding: 14,
          display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '4px 6px 14px rgba(0,0,0,0.4)',
          position:'relative'
        }}>
          <Paperclip angle={15} style={{ top:-10, left:20 }} />
          {/* Detective ID Card */}
          <div style={{ background: PAPER, padding: 12, borderRadius: 8, color: INK, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 40, height: 12, background: '#1a1a1a', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
            
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <div style={{ width: 70, height: 85, background: '#2a1a08', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #8a7040' }}>
                <div style={{ fontSize: 60, opacity: 0.8, filter: 'grayscale(100%) contrast(200%)' }}>🕵️</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#5a4a2a', fontWeight: 900 }}>LICENSE #49281</div>
                <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 900, marginTop: 2, lineHeight: 1.1 }}>DETECTIVE<br/>{(playerName || 'GUEST').toUpperCase()}</div>
                <div style={{ fontSize: 10, color: '#D32F2F', fontWeight: 900, marginTop: 6, border: '1px solid #D32F2F', padding: '2px 4px', display: 'inline-block', borderRadius: 2 }}>
                  CHIEF INVESTIGATOR
                </div>
              </div>
            </div>
            {/* Signature */}
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 4, textAlign: 'right' }}>
               <span style={{ fontFamily: "'Caveat', cursive", fontSize: 20, opacity: 0.8, marginRight: 10 }}>{(playerName || 'Guest')}</span>
            </div>
          </div>

          {/* Certificates & Badges */}
          <div style={{ background: '#222d30', borderRadius: 8, padding: 12, border: '1px solid #334043' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#8ba5a0', fontWeight: 900, marginBottom: 8 }}>COMMENDATIONS</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ background: '#111', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #f5a742', boxShadow: '0 0 10px rgba(245,167,66,0.2)', fontSize: 20 }} title="High Accuracy">🎯</div>
              <div style={{ background: '#111', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #22d3ee', boxShadow: '0 0 10px rgba(34,211,238,0.2)', fontSize: 20 }} title="Speed Demon">⚡</div>
              <div style={{ background: '#111', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #5db44b', boxShadow: '0 0 10px rgba(93,180,75,0.2)', fontSize: 20 }} title="Top Bond">🤝</div>
            </div>
          </div>

          {/* Newspaper Clippings */}
          <div style={{ background: '#e8e0d5', padding: 12, borderRadius: 2, border: '1px solid #ccc', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transform: 'rotate(1deg)', fontFamily: "'Times New Roman', serif", color: '#111' }}>
            <div style={{ fontSize: 18, fontWeight: 900, textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: 4, marginBottom: 6, lineHeight: 1 }}>THE ANNOTOPIA TIMES</div>
            <div style={{ fontSize: 12, fontWeight: 700, fontStyle: 'italic', textAlign: 'center', marginBottom: 6 }}>"ROOKIE CRACKS THE CASE!"</div>
            <div style={{ fontSize: 9, columnCount: 2, columnGap: 10, textAlign: 'justify' }}>
              Local detective {(playerName || 'Guest')} was seen securing 100% accuracy in the recent downtown dataset sweep. The drones performed flawlessly, establishing a new bureau record. "We've never seen such high-fidelity bounds," stated the Chief.
            </div>
          </div>
        </div>

        {/* ── Center: Roster board with status columns ── */}
        <div style={{
          background: PANEL, border: `2px solid ${PANEL_INNER}`, borderRadius: 2, padding: 14,
          boxShadow: '4px 6px 14px rgba(0,0,0,0.4)', position:'relative'
        }}>
          <RealisticPin color="#E53935" style={{ top:4, left:4 }} />
          <RealisticPin color="#FDD835" style={{ top:4, right:4 }} />
          {/* filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, borderBottom: `1px solid ${PANEL_INNER}`, paddingBottom: 10 }}>
            {([
              ['all', 'ALL AGENTS', inventory.length],
              ['onCase', 'ON CASE', buckets.onCase.length],
              ['atAgency', 'AT AGENCY', buckets.atAgency.length],
              ['recovering', 'RECOVERING', buckets.recovering.length],
            ] as [Filter, string, number][]).map(([k, label, n]) => {
              const active = filter === k;
              return (
                <button key={k} onClick={() => setFilter(k)} style={{
                  background: active ? AMBER : 'rgba(255,255,255,0.4)',
                  color: active ? '#fff' : '#4e342e',
                  border: `2px solid ${active ? AMBER : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: 2, padding: '7px 12px', fontFamily: FONT,
                  fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', cursor: 'pointer',
                }}>
                  {label} · {n}
                </button>
              );
            })}
          </div>

          {/* Status column layout when "all" */}
          {filter === 'all' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <StatusColumn
                title="ON CASE" tint="#C62828"
                note="Deployed in the field"
                agents={buckets.onCase}
                companions={companions}
                selected={selected}
                onSelect={setSelected}
              />
              <StatusColumn
                title="AT THE AGENCY" tint="#1565C0"
                note="Ready for assignment"
                agents={buckets.atAgency}
                companions={companions}
                selected={selected}
                onSelect={setSelected}
              />
              <StatusColumn
                title="RECOVERING" tint="#F57F17"
                note="Stamina below 50%"
                agents={buckets.recovering}
                companions={companions}
                selected={selected}
                onSelect={setSelected}
              />
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 12,
            }}>
              {visible.map(p => (
                <DossierCard key={p.id}
                  pokemon={p}
                  companion={companions[p.id]}
                  selected={selected?.id === p.id}
                  onClick={() => setSelected(p)}
                />
              ))}
              {visible.length === 0 && (
                <div style={{ color: '#8ba5a0', fontSize: 12, padding: 12 }}>No agents in this bucket.</div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Case file for selected agent ── */}
        {selected && (
          <CaseFile
            pokemon={selected}
            companion={companions[selected.id]}
            isActive={activePokemon?.id === selected.id}
            onAssign={() => setActivePokemon(selected)}
            onFeed={() => feedCompanion(selected.id, 25)}
          />
        )}
      </div>
    </div>
  </div>
  );
}

function AgencyStat({ label, value, suffix, color, small }: {
  label: string; value: React.ReactNode; suffix?: string; color: string; small?: boolean;
}) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 4, padding: 10 }}>
      <div style={{ fontSize: 9, color: '#3e2723', letterSpacing: '0.2em', fontWeight: 900 }}>{label}</div>
      <div style={{ fontSize: small ? 18 : 26, fontWeight: 900, color, marginTop: 2, textShadow:'0 1px 2px rgba(0,0,0,0.1)' }}>
        {value}
        {suffix && <span style={{ fontSize: 10, color: '#4e342e', marginLeft: 4 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function StatusColumn({
  title, tint, note, agents, companions, selected, onSelect,
}: {
  title: string; tint: string; note: string;
  agents: Pokemon[]; companions: Record<number, any>;
  selected: Pokemon | null; onSelect: (p: Pokemon) => void;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.4)', borderRadius: 2, padding: 10,
      border: `1px solid ${tint}55`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{
          fontSize: 10, fontWeight: 900, letterSpacing: '0.22em', color: tint, textShadow:'0 1px 2px rgba(0,0,0,0.1)'
        }}>{title}</div>
        <div style={{
          background: `${tint}22`, color: tint, border: `1px solid ${tint}55`,
          fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 2,
        }}>{agents.length}</div>
      </div>
      <div style={{ fontSize: 9, color: '#4e342e', marginBottom: 10, letterSpacing: '0.1em', fontWeight:600 }}>{note}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {agents.length === 0 && (
          <div style={{ fontSize: 11, color: '#a1887f', fontStyle: 'italic', textAlign: 'center', padding: 14 }}>
            — vacant —
          </div>
        )}
        {agents.map(p => (
          <DossierCard key={p.id}
            pokemon={p}
            companion={companions[p.id]}
            selected={selected?.id === p.id}
            onClick={() => onSelect(p)}
            compact
          />
        ))}
      </div>
    </div>
  );
}

function DossierCard({ pokemon, companion, selected, onClick, compact }: {
  pokemon: Pokemon; companion: any; selected: boolean; onClick: () => void; compact?: boolean;
}) {
  const arch = ARCHITECTURE_COLORS[pokemon.architecture];
  const rarity = rarityColors[pokemon.rarity];
  const stam = companion?.stamina ?? 100;
  const bond = companion?.bond ?? 0;
  const ovr = overallRating(pokemon.stats);
  const id = String(pokemon.id).padStart(4, '0');

  return (
    <motion.div
      whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        background: PAPER,
        border: `2px solid ${selected ? AMBER : 'rgba(0,0,0,0.1)'}`,
        boxShadow: selected ? `0 0 14px ${AMBER}77` : '0 3px 8px rgba(0,0,0,0.4)',
        borderRadius: 2, padding: 8, cursor: 'pointer', position: 'relative',
        color: INK, fontFamily: MONO,
      }}>
      {/* staple corner */}
      <div style={{
        position: 'absolute', top: -3, right: 10, width: 20, height: 6, background: '#9a9a9a',
        borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }} />
      {/* dossier header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, letterSpacing: '0.1em', color: '#5a4a2a' }}>
        <span>AGENT #{id}</span>
        <span>{pokemon.rarity.toUpperCase()}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
        <div style={{
          width: compact ? 44 : 60, height: compact ? 44 : 60,
          background: '#dcc79c', borderRadius: 4, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid #8a7040',
        }}>
          <img src={getSpriteUrl(pokemon.id)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: FONT, fontSize: compact ? 12 : 15, fontWeight: 900, color: INK,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{pokemon.name}</div>
          <div style={{ fontSize: 8, color: arch.color, fontWeight: 900, letterSpacing: '0.15em' }}>
            {arch.label}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 2, fontSize: 9, color: '#5a4a2a' }}>
            <span>OVR <b style={{ color: INK }}>{ovr}</b></span>
            <span>{MOOD[companion?.morale ?? 'content']}</span>
          </div>
        </div>
      </div>
      {/* stamina + bond bars */}
      <div style={{ marginTop: 6 }}>
        <Bar label="STAM" value={stam} color={stam < 50 ? '#ef4637' : '#5db44b'} />
        <Bar label="BOND" value={bond} color="#ff6dae" />
      </div>
    </motion.div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
      <span style={{ fontSize: 7, fontWeight: 900, color: '#5a4a2a', width: 26, letterSpacing: '0.1em' }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: '#dcc79c', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color }} />
      </div>
      <span style={{ fontSize: 8, fontWeight: 900, color: INK, width: 22, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function CaseFile({ pokemon, companion, isActive, onAssign, onFeed }: {
  pokemon: Pokemon; companion: any; isActive: boolean;
  onAssign: () => void; onFeed: () => void;
}) {
  const arch = ARCHITECTURE_COLORS[pokemon.architecture];
  const rarity = rarityColors[pokemon.rarity];
  const id = String(pokemon.id).padStart(4, '0');
  const stam = companion?.stamina ?? 100;
  const bond = companion?.bond ?? 0;

  return (
    <motion.div
      key={pokemon.id}
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      style={{
        background: PAPER, color: INK,
        borderRadius: 2, padding: 16,
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        fontFamily: MONO,
        position: 'sticky', top: 20, border: '1px solid #c7a977'
      }}>
      <RealisticPin color="#FDD835" style={{ top:6, left:8 }} />
      <RealisticPin color="#1565C0" style={{ top:6, right:8 }} />
      {/* CLASSIFIED stamp */}
      <motion.div
        initial={{ rotate: -20, scale: 1.2, opacity: 0 }}
        animate={{ rotate: -12, scale: 1, opacity: 0.7 }}
        style={{
          position: 'absolute', top: 14, right: 14,
          border: '2px solid #a33', padding: '4px 10px', borderRadius: 3,
          color: '#a33', fontSize: 10, fontWeight: 900, letterSpacing: '0.25em',
        }}>CLASSIFIED</motion.div>

      <div style={{ fontSize: 9, letterSpacing: '0.25em', color: '#5a4a2a' }}>
        CASE FILE · AGENT #{id}
      </div>
      <div style={{
        fontFamily: FONT, fontSize: 28, fontWeight: 900, color: INK, marginTop: 2, letterSpacing: '-0.01em',
      }}>{pokemon.name}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
        <Tag color={arch.color}>{arch.label}</Tag>
        <Tag color={rarity.color}>{pokemon.rarity.toUpperCase()}</Tag>
        {isActive && <Tag color={AMBER}>ON CASE</Tag>}
      </div>

      {/* mugshot */}
      <div style={{
        marginTop: 10,
        background: '#dcc79c', border: '2px solid #8a7040',
        borderRadius: 6, padding: 8,
        display: 'flex', justifyContent: 'center', overflow: 'hidden'
      }}>
        <img src={getSpriteUrl(pokemon.id)}
          style={{ width: 120, height: 120, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
      </div>

      {/* typewriter brief */}
      <div style={{
        marginTop: 10, padding: 10, background: '#f8efd6',
        border: '1px dashed #8a7040', borderRadius: 4,
        fontSize: 11, lineHeight: 1.5, color: INK,
      }}>
        <span style={{ fontWeight: 900 }}>BRIEF:</span> {pokemon.description}
      </div>

      {/* stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 10 }}>
        {(['pace','verbal','spatial','accuracy'] as const).map(k => (
          <div key={k} style={{
            background: '#f8efd6', border: '1px solid #c7a977', borderRadius: 4,
            padding: 6, textAlign: 'center',
          }}>
            <div style={{ fontSize: 7, fontWeight: 900, color: '#5a4a2a', letterSpacing: '0.1em' }}>{k.toUpperCase()}</div>
            <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, color: INK }}>{pokemon.stats[k]}</div>
          </div>
        ))}
      </div>

      {/* vitals */}
      <div style={{ marginTop: 10 }}>
        <Bar label="STAM" value={stam} color={stam < 50 ? '#c23' : '#2a8' } />
        <Bar label="BOND" value={bond} color="#d06" />
      </div>

      {/* notes */}
      <div style={{
        marginTop: 10, fontSize: 10, lineHeight: 1.5, color: '#5a4a2a',
        borderTop: '1px dashed #8a7040', paddingTop: 8,
      }}>
        <span style={{ fontWeight: 900, color: INK }}>FIELD NOTES.</span>{' '}
        {stam < 50 ? 'Agent is fatigued. Feed treats before redeploying.'
          : bond < 30 ? 'Bond still forming. A few cases together will tighten trust.'
          : 'In top form. Can be dispatched immediately.'}
      </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={onAssign} disabled={isActive} style={{
            flex: 1,
            background: isActive ? '#c7a977' : INK,
            color: isActive ? '#5a4a2a' : PAPER,
            border: 'none', padding: '10px 0', borderRadius: 6,
            fontSize: 10, fontWeight: 900, letterSpacing: '0.22em',
            cursor: isActive ? 'default' : 'pointer', fontFamily: FONT,
          }}>{isActive ? '✓ ASSIGNED' : 'ASSIGN TO CASE'}</button>
          <button onClick={onFeed} style={{
            flex: 1, background: 'transparent', color: INK,
            border: `2px solid ${INK}`, padding: '10px 0', borderRadius: 6,
            fontSize: 10, fontWeight: 900, letterSpacing: '0.22em', cursor: 'pointer', fontFamily: FONT,
          }}>🍖 FEED TREAT</button>
        </div>

        {/* Skill Tree / Evolution Branch */}
        <EvolutionTree pokemon={pokemon} />
      </motion.div>
  );
}

function EvolutionTree({ pokemon }: { pokemon: Pokemon }) {
  // Mock three branches like a skill tree
  const arch = ARCHITECTURE_COLORS[pokemon.architecture];
  const branches = ['DETECTION', 'GENERATION', 'SEQUENCE'];
  
  return (
    <div style={{ marginTop: 16, borderTop: '1px dashed #8a7040', paddingTop: 12, paddingBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: INK, letterSpacing: '0.1em', marginBottom: 12 }}>
        EVOLUTION LOGIC
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
        {branches.map((b, i) => {
          const isActivePath = i === (pokemon.id % 3); // mock active path
          return (
            <div key={b} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {/* node */}
              <div style={{ 
                width: 32, height: 32, borderRadius: '50%', background: isActivePath ? arch.color : '#e0ccaa',
                border: `2px solid ${isActivePath ? '#fff' : '#a88a50'}`,
                boxShadow: isActivePath ? `0 0 10px ${arch.color}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: isActivePath ? '#fff' : '#c8ac76' }} />
              </div>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.05em', color: isActivePath ? arch.color : '#8a7040', textAlign: 'center' }}>
                {b}
              </div>
              {/* sub nodes */}
              <div style={{ width: 2, height: 12, background: isActivePath ? arch.color : '#c8ac76' }} />
              <div style={{ 
                width: 20, height: 20, borderRadius: '50%', background: isActivePath ? arch.color : '#e0ccaa',
                border: `2px solid ${isActivePath ? '#fff' : '#a88a50'}`,
                opacity: isActivePath ? 0.5 : 1
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 900, letterSpacing: '0.18em',
      background: `${color}22`, color, border: `1px solid ${color}66`,
      padding: '2px 8px', borderRadius: 4,
    }}>{children}</span>
  );
}

export default Agency;
