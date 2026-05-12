import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { BATTLE_IMAGES } from '../data/gameImages';
import { getSpriteUrl, ARCHITECTURE_COLORS } from '../data/pokemon';
import {
  GameCard, CARD_FAMILY_CONFIG, BODY_PART_CONFIG, BodyPart, generateHand,
} from '../data/cards';
import { CircuitSkillTree } from '../components/CircuitSkillTree';
import { ActivePetGuide } from '../components/ActivePetGuide';

const POLA = '#f5ede0';
const STICKY_Y = '#F9E97E';
const STICKY_R = '#FFCDD2';
const STICKY_B = '#BBDEFB';
const STICKY_G = '#C8E6C9';
const MANILLA = '#D5BCA4';
const LEGAL = '#FFF9C4';
const FONT = "'Courier New', 'Special Elite', monospace";
const FONT_STENCIL = "'Bebas Neue', 'Impact', sans-serif";
const RED = '#C62828';
const NEON_G = '#4ade80';

const ROUND_TIME = 120;
const NUM_IMAGES = 4;
const FOCUS_DRAIN = 0.35;
const FOCUS_GAIN = 7;
const HONEYPOT_IDX = 2;
const MAX_CARDS = 5;

type Phase = 'intro' | 'playing' | 'dispatch' | 'done';
type Mode = 'probe' | 'lasso';

interface Annotation { mode: Mode; x: number; y: number; w?: number; h?: number; qIdx: 0|1|2; correct?: boolean; }

const MOCK_OPPONENTS = [
  { name: 'NeuroDetective_X', color: '#b879ff', progress: 0, acc: 72 },
  { name: 'DragonMaster99',   color: '#22d3ee', progress: 0, acc: 65 },
  { name: 'ShadowSniper',     color: '#ef4637', progress: 0, acc: 58 },
  { name: 'AgentGhost',       color: '#a3a3a3', progress: 0, acc: 88 },
];

const Q_COLORS = [STICKY_R, STICKY_B, STICKY_G];
const Q_TOOLS: Mode[] = ['probe', 'lasso', 'probe'];
const Q_TOOL_LABELS = ['📍 PROBE', '✏️ LASSO', '📍 PROBE'];

export function Battle() {
  const nav = useNavigate();
  const { activePokemon, cardCombat, initCardCombat, playCard, addFocus, drainFocus, registerHoneypot, recordRound } = useGame();

  const [phase, setPhase] = useState<Phase>('intro');
  const [imageIdx, setImageIdx] = useState(0);
  const [qIdx, setQIdx] = useState<0|1|2>(0);
  const [time, setTime] = useState(ROUND_TIME);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [opponents, setOpponents] = useState(MOCK_OPPONENTS);
  const [pokemonFaded, setPokemonFaded] = useState(false);
  const [showHoneypotWarning, setShowHoneypotWarning] = useState(false);
  const [displayedHand, setDisplayedHand] = useState<GameCard[]>([]);
  const [sweepDrag, setSweepDrag] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [lastClickPos, setLastClickPos] = useState<{ x: number; y: number } | null>(null);
  const [lastAnnotationTime, setLastAnnotationTime] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [stampPressed, setStampPressed] = useState(false);

  const image = BATTLE_IMAGES[imageIdx % BATTLE_IMAGES.length];
  const activeTool: Mode = Q_TOOLS[qIdx];

  useEffect(() => { setDisplayedHand(cardCombat.hand.slice(0, MAX_CARDS)); }, [cardCombat.hand]);

  const shuffleCards = useCallback(() => setDisplayedHand(generateHand(MAX_CARDS)), []);

  useEffect(() => {
    if (!activePokemon) { nav('/loadout'); return; }
    if (!cardCombat.activePokemonId) initCardCombat(activePokemon);
    const t = setTimeout(() => setPhase('playing'), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const updateRect = () => { if (canvasRef.current) setCanvasRect(canvasRef.current.getBoundingClientRect()); };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const iv = setInterval(() => {
      setTime(t => { if (t <= 1) { clearInterval(iv); setPhase('dispatch'); return 0; } return t - 1; });
      drainFocus(FOCUS_DRAIN);
      setOpponents(prev => prev.map(o => ({ ...o, progress: Math.min(100, o.progress + 0.4 + Math.random() * 1.2) })));
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, drainFocus]);

  useEffect(() => {
    if (phase !== 'dispatch') return;
    const t = setTimeout(() => {
      recordRound([{
        imageId: image.id, annotations: annotations.length,
        score: annotations.length * 60 + cardCombat.trustScore * 6,
        pokemonUsed: activePokemon ? [activePokemon.id] : [],
        honeypotHits: cardCombat.honeypotStreak,
      }]);
      setPhase('done');
      setTimeout(() => nav('/results'), 2200);
    }, 3000);
    return () => clearTimeout(t);
  }, [phase]);

  const triggerHoneypot = () => { setShowHoneypotWarning(true); setTimeout(() => setShowHoneypotWarning(false), 2800); };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (phase !== 'playing' || activeTool !== 'probe') return;
    const r = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    const isHoney = imageIdx === HONEYPOT_IDX;
    const correct = Math.random() > 0.25;
    setAnnotations(prev => [...prev, { mode: 'probe', x, y, qIdx, correct }]);
    addFocus(FOCUS_GAIN);
    if (isHoney) { registerHoneypot(correct); if (!correct) triggerHoneypot(); }
    setLastAnnotationTime(Date.now());
    setLastClickPos({ x, y });
    setPokemonFaded(true);
    setTimeout(() => setPokemonFaded(false), 800);
  };

  const handleSweepStart = (e: React.MouseEvent) => {
    if (phase !== 'playing' || activeTool !== 'lasso') return;
    const r = canvasRef.current!.getBoundingClientRect();
    setSweepDrag({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, w: 0, h: 0 });
  };
  const handleSweepMove = (e: React.MouseEvent) => {
    if (!sweepDrag || activeTool !== 'lasso') return;
    const r = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setSweepDrag({ ...sweepDrag, w: x - sweepDrag.x, h: y - sweepDrag.y });
  };
  const handleSweepEnd = () => {
    if (!sweepDrag) return;
    if (Math.abs(sweepDrag.w) > 2 && Math.abs(sweepDrag.h) > 2) {
      setAnnotations(prev => [...prev, { mode: 'lasso', ...sweepDrag, qIdx, correct: Math.random() > 0.3 }]);
      addFocus(FOCUS_GAIN);
      setLastAnnotationTime(Date.now());
      setLastClickPos({ x: sweepDrag.x + sweepDrag.w / 2, y: sweepDrag.y + sweepDrag.h / 2 });
      if (imageIdx === HONEYPOT_IDX) { const c = Math.random() > 0.25; registerHoneypot(c); if (!c) triggerHoneypot(); }
    }
    setSweepDrag(null);
  };

  const tryPlayCard = useCallback((cardId: string, nodeId: string) => {
    const ok = playCard(cardId, nodeId);
    if (ok) {
      setSelectedCard(null);
      if (Math.random() > 0.7) setOpponents(prev => prev.map(o => o.name === 'AgentGhost' ? o : { ...o, progress: Math.max(0, o.progress - 10) }));
    }
    return ok;
  }, [playCard]);

  const nextImage = () => {
    if (imageIdx >= NUM_IMAGES - 1) { setPhase('dispatch'); return; }
    const ni = imageIdx + 1;
    setImageIdx(ni);
    setQIdx(0);
    if (ni === 2) shuffleCards();
    setAnnotations([]);
  };

  const arch = activePokemon ? ARCHITECTURE_COLORS[activePokemon.architecture] : ARCHITECTURE_COLORS.CNN;
  const selCard = selectedCard ? displayedHand.find(c => c.id === selectedCard) : null;

  const thinking = useMemo(() => {
    const lines: string[] = [];
    image.questions.forEach((qq, i) => {
      const n = annotations.filter(a => a.qIdx === i).length;
      lines.push(`Q${i + 1}: ${qq.short} · ${n ? n + ' marks' : 'scanning'}`);
    });
    if (imageIdx === HONEYPOT_IDX) lines.push('⚠ Honeypot suspected');
    return lines;
  }, [image, annotations, imageIdx]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: FONT, position: 'relative',
                  display: 'flex', flexDirection: 'column' }}>
      <AnimatePresence>
        {phase === 'intro' && <IntroOverlay pokemon={activePokemon} />}
        {phase === 'dispatch' && <DispatchOverlay annotations={annotations} />}
        {phase === 'done' && <DoneOverlay />}
        {showHoneypotWarning && <HoneypotWarning />}
      </AnimatePresence>

      {/* ========================= ZONE 1 — PINBOARD (Top 70%) ========================= */}
      <div style={{
        flex: '0 0 70%', position: 'relative', overflow: 'hidden',
        background: '#5D4037',
        backgroundImage:
          `radial-gradient(rgba(40,22,10,0.55) 1px, transparent 1.4px),
           radial-gradient(rgba(255,220,170,0.16) 1px, transparent 1px),
           radial-gradient(rgba(20,12,6,0.6) 0.6px, transparent 0.8px)`,
        backgroundSize: '7px 7px, 11px 11px, 4px 4px',
        backgroundPosition: '0 0, 3px 5px, 1px 2px',
        boxShadow: 'inset 0 0 150px rgba(0,0,0,0.9)',
      }}>
        {/* warm desk-lamp wash */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
                      background: 'radial-gradient(ellipse at 50% 45%, rgba(255,210,150,0.18) 0%, transparent 55%)' }} />

        {/* TOP HUD strip on pinboard (timer + image counter) */}
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%) rotate(-1deg)',
                      zIndex: 20, display: 'flex', gap: 8 }}>
          <div style={{ background: POLA, padding: '6px 14px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 8, color: '#7a6a55', letterSpacing: '0.3em', fontWeight: 900 }}>TIME ON CASE</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#1a0f05', letterSpacing: '0.05em', lineHeight: 1 }}>
              {String(Math.floor(time / 60)).padStart(2, '0')}:{String(time % 60).padStart(2, '0')}
            </div>
          </div>
          <div style={{ background: STICKY_Y, padding: '6px 12px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                        transform: 'rotate(2deg)' }}>
            <div style={{ fontSize: 8, color: '#5a3e20', fontWeight: 900, letterSpacing: '0.2em' }}>EXHIBIT</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#1a0f05', lineHeight: 1 }}>{imageIdx + 1} / {NUM_IMAGES}</div>
          </div>
        </div>

        {/* ABORT */}
        <button onClick={() => nav('/hub')}
                style={{ position: 'absolute', top: 14, right: 14, zIndex: 20,
                         background: '#1a1410', color: POLA, border: '1px solid #5a3e20',
                         padding: '6px 14px', fontFamily: FONT, fontSize: 11,
                         fontWeight: 900, letterSpacing: '0.2em', cursor: 'pointer',
                         boxShadow: '0 4px 10px rgba(0,0,0,0.55)' }}>
          ABORT
        </button>

        {/* ============== 3-COLUMN PINBOARD GRID ============== */}
        <div style={{ position: 'absolute', inset: 0, display: 'grid',
                      gridTemplateColumns: '270px 1fr 290px', gap: 16,
                      padding: '70px 24px 24px 24px' }}>

          {/* === LEFT COLUMN === */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>

            {/* Player ID Badge */}
            <div style={{ position: 'relative', transform: 'rotate(-2deg)' }}>
              <BinderClip style={{ top: -10, left: '50%', transform: 'translateX(-50%) rotate(-2deg)' }} />
              <div style={{ background: '#FFFFFF', borderRadius: 8, padding: '12px 12px 10px',
                            boxShadow: '0 10px 22px rgba(0,0,0,0.55)',
                            border: '1px solid #d8d8d8', position: 'relative', overflow: 'hidden' }}>
                {/* glossy sheen */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                              background: 'linear-gradient(180deg, rgba(255,255,255,0.6), transparent)',
                              pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <motion.div animate={{ opacity: pokemonFaded ? 0.3 : 1 }}
                              style={{ width: 56, height: 56, background: '#f0f0f0', borderRadius: 4,
                                       border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activePokemon && <img src={getSpriteUrl(activePokemon.id)}
                                           style={{ width: 50, height: 50, imageRendering: 'pixelated' }} />}
                  </motion.div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: '#000', letterSpacing: '0.25em' }}>ID: DETECTIVE</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#1a1a1a', letterSpacing: '0.05em',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activePokemon?.name?.toUpperCase() || 'PARTNER'}
                    </div>
                    <div style={{ fontSize: 9, color: '#666', fontWeight: 700 }}>{arch.label}</div>
                  </div>
                </div>
                <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed #bbb',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 8, color: '#666', letterSpacing: '0.2em', fontWeight: 900 }}>CREDIBILITY</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: RED, letterSpacing: '0.05em', lineHeight: 1 }}>
                      {cardCombat.trustScore}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: '#666', letterSpacing: '0.2em', fontWeight: 900, textAlign: 'right' }}>STREAK</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#1a3a5c', textAlign: 'right', lineHeight: 1 }}>
                      ×{cardCombat.honeypotStreak}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manila Folder — Pet Guide + Circuit */}
            <div style={{ position: 'relative', flex: 1, minHeight: 0, transform: 'rotate(1deg)' }}>
              <div style={{ position: 'absolute', top: -14, left: 16, width: 80, height: 18,
                            background: MANILLA, borderRadius: '3px 3px 0 0',
                            border: '1px solid #A88A4A', borderBottom: 'none' }} />
              <div style={{ background: MANILLA, borderRadius: '2px 8px 6px 4px',
                            border: '1px solid #A88A4A', padding: '12px 10px 10px',
                            boxShadow: '4px 8px 18px rgba(0,0,0,0.55)',
                            backgroundImage: 'repeating-linear-gradient(180deg, transparent 0, transparent 22px, rgba(168,138,74,0.18) 22px, rgba(168,138,74,0.18) 23px)',
                            display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 8, color: '#7a4a1a', letterSpacing: '0.3em', fontWeight: 900 }}>FILE</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#3a2008', letterSpacing: '0.1em' }}>
                      PET GUIDE · CIRCUIT
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#7a4a1a' }}>F-{imageIdx + 1}</div>
                </div>
                <div style={{ flex: 1, minHeight: 0, background: '#120e0a', borderRadius: 3,
                              border: '1px solid rgba(0,0,0,0.4)',
                              boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
                  <CircuitSkillTree
                    board={cardCombat.circuit}
                    hand={displayedHand}
                    selectedCard={selCard || null}
                    focus={cardCombat.focus}
                    architecture={activePokemon?.architecture ?? 'MLP'}
                    pulsing={cardCombat.pulsingNodeId}
                    onSlotClick={(nodeId) => { if (selectedCard) tryPlayCard(selectedCard, nodeId); }}
                  />
                </div>
                <div style={{ marginTop: 6, fontSize: 8, color: '#5a3e20', fontWeight: 700, letterSpacing: '0.15em' }}>
                  WIRE CARDS → BODY PARTS · TAP SLOT
                </div>
              </div>
            </div>
          </div>

          {/* === CENTER COLUMN — Polaroid Case File === */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Stamp style={{ position: 'absolute', top: 0, left: 40, transform: 'rotate(-8deg)', zIndex: 8 }} text="CONFIDENTIAL" />
            <Stamp style={{ position: 'absolute', bottom: -10, right: 30, transform: 'rotate(6deg)', zIndex: 8 }} text="URGENT" />

            <div style={{ position: 'relative' }}>
              {/* masking tape */}
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%) rotate(-2deg)',
                            width: 110, height: 22, background: 'rgba(255,250,210,0.6)',
                            border: '1px solid rgba(180,160,90,0.4)',
                            boxShadow: '0 3px 6px rgba(0,0,0,0.4)', zIndex: 15 }} />
              <motion.div
                key={imageIdx}
                initial={{ scale: 0.9, opacity: 0, rotate: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: imageIdx % 2 === 0 ? -1 : 1 }}
                style={{ background: POLA, padding: '14px 14px 56px 14px',
                         boxShadow: '0 15px 35px rgba(0,0,0,0.6), 0 4px 10px rgba(0,0,0,0.4)',
                         position: 'relative', maxWidth: 440 }}>
                {/* corner stamp */}
                <div style={{ position: 'absolute', top: 18, right: 18, padding: '3px 8px',
                              border: `2.5px solid ${RED}`, color: RED, fontFamily: FONT_STENCIL,
                              fontSize: 13, fontWeight: 900, letterSpacing: '0.2em', transform: 'rotate(8deg)',
                              opacity: 0.78, zIndex: 14, pointerEvents: 'none', background: 'rgba(245,237,224,0.4)' }}>
                  EXHIBIT 1
                </div>

                <div ref={canvasRef}
                     onClick={handleCanvasClick}
                     onMouseDown={handleSweepStart}
                     onMouseMove={handleSweepMove}
                     onMouseUp={handleSweepEnd}
                     style={{ width: 400, height: 400, background: '#111', position: 'relative',
                              overflow: 'hidden', cursor: activeTool === 'lasso' ? 'crosshair' : 'cell',
                              boxShadow: 'inset 0 0 18px rgba(0,0,0,0.55)' }}>
                  <img src={image.url} alt={image.label}
                       style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', display: 'block' }} />

                  {annotations.map((a, i) => {
                    const c = a.qIdx === 0 ? '#E53935' : a.qIdx === 1 ? '#1565C0' : '#2E7D32';
                    if (a.mode === 'probe') {
                      return <div key={i} style={{
                        position: 'absolute', left: `${a.x}%`, top: `${a.y}%`,
                        transform: 'translate(-50%, -50%)', width: 26, height: 26,
                        borderRadius: '50%', border: `3px solid ${c}`,
                        boxShadow: `0 0 8px ${c}88`, pointerEvents: 'none' }} />;
                    }
                    return <div key={i} style={{
                      position: 'absolute',
                      left: `${a.w && a.w < 0 ? a.x + a.w : a.x}%`,
                      top: `${a.h && a.h < 0 ? a.y + a.h : a.y}%`,
                      width: `${Math.abs(a.w || 0)}%`, height: `${Math.abs(a.h || 0)}%`,
                      border: `2px dashed ${c}`, background: `${c}18`,
                      pointerEvents: 'none', borderRadius: 2 }} />;
                  })}

                  {sweepDrag && (
                    <div style={{ position: 'absolute',
                                  left: `${sweepDrag.w < 0 ? sweepDrag.x + sweepDrag.w : sweepDrag.x}%`,
                                  top: `${sweepDrag.h < 0 ? sweepDrag.y + sweepDrag.h : sweepDrag.y}%`,
                                  width: `${Math.abs(sweepDrag.w)}%`, height: `${Math.abs(sweepDrag.h)}%`,
                                  border: '2px dashed #1565C0', background: 'rgba(21,101,192,0.15)',
                                  pointerEvents: 'none' }} />
                  )}

                  {activePokemon && phase === 'playing' && (
                    <ActivePetGuide pokemonId={activePokemon.id} pokemonName={activePokemon.name}
                                    architecture={activePokemon.architecture}
                                    canvasRect={canvasRect} lastClickPos={lastClickPos}
                                    onAnnotation={lastAnnotationTime} trustScore={cardCombat.trustScore} />
                  )}
                </div>

                {/* Polaroid caption */}
                <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20,
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 900, color: '#2a1a08',
                                letterSpacing: '0.05em' }}>
                    CASE #{String(imageIdx + 1).padStart(3, '0')} — {image.label}
                  </div>
                  <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                                 onClick={nextImage}
                                 style={{ background: '#1a1410', color: POLA, border: 'none',
                                          padding: '5px 14px', fontSize: 11, fontWeight: 900,
                                          letterSpacing: '0.18em', cursor: 'pointer', fontFamily: FONT,
                                          boxShadow: '0 3px 6px rgba(0,0,0,0.5)' }}>
                    NEXT →
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* === RIGHT COLUMN === */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>

            {/* Boss Memo — Yellow Legal Pad */}
            <div style={{ position: 'relative', transform: 'rotate(2deg)' }}>
              <Pin color={RED} style={{ top: -6, left: '50%', transform: 'translateX(-50%)' }} />
              <div style={{ background: LEGAL, padding: '18px 14px 14px',
                            boxShadow: '0 10px 24px rgba(0,0,0,0.55)',
                            backgroundImage: 'repeating-linear-gradient(180deg, transparent 0, transparent 19px, rgba(60,120,200,0.25) 19px, rgba(60,120,200,0.25) 20px)',
                            borderLeft: `3px solid ${RED}80`, position: 'relative' }}>
                <div style={{ fontFamily: FONT_STENCIL, fontSize: 14, fontWeight: 900,
                              color: RED, letterSpacing: '0.25em', borderBottom: `1px solid ${RED}55`,
                              paddingBottom: 4 }}>
                  CONFIDENTIAL MEMO
                </div>
                <div style={{ marginTop: 6, fontFamily: FONT, fontSize: 11, color: '#1a3060',
                              fontWeight: 700, lineHeight: 1.55 }}>
                  Boss —<br />
                  Target moves between exhibits. Mark anything unusual on the photo.
                  Watch the red signals on #{HONEYPOT_IDX + 1}: <strong>honeypot</strong>.
                </div>
                <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed rgba(60,120,200,0.4)' }}>
                  <div style={{ fontSize: 8, color: '#7a3a2a', fontWeight: 900, letterSpacing: '0.25em' }}>WEAKNESSES</div>
                  <div style={{ fontSize: 10, color: '#1a3060', fontFamily: FONT, fontWeight: 700, marginTop: 2, lineHeight: 1.4 }}>
                    {thinking.map((t, i) => <div key={i}>· {t}</div>)}
                  </div>
                </div>
              </div>
            </div>

            {/* Question Sticky Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {image.questions.map((qq, i) => {
                const active = qIdx === i;
                return (
                  <motion.div key={i} onClick={() => setQIdx(i as 0|1|2)}
                              animate={{ scale: active ? 1.03 : 1 }}
                              style={{ background: Q_COLORS[i], padding: '8px 10px',
                                       boxShadow: active ? '0 6px 14px rgba(0,0,0,0.45)' : '0 3px 8px rgba(0,0,0,0.3)',
                                       cursor: 'pointer', position: 'relative',
                                       transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
                                       border: active ? '2px solid rgba(0,0,0,0.3)' : '1px solid rgba(0,0,0,0.1)' }}>
                    <Pin color={active ? RED : '#8a8a8a'} style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: '#2a1a08', letterSpacing: '0.2em' }}>Q{i + 1}</span>
                      <span style={{ fontSize: 8, fontWeight: 900, color: 'rgba(0,0,0,0.6)' }}>{Q_TOOL_LABELS[i]}</span>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.75)',
                                  marginTop: 3, lineHeight: 1.3 }}>{qq.short}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Rivals */}
            <div style={{ background: POLA, padding: '8px 10px',
                          boxShadow: '0 6px 14px rgba(0,0,0,0.5)',
                          transform: 'rotate(-1.5deg)', position: 'relative' }}>
              <Pin color="#1565C0" style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }} />
              <div style={{ fontSize: 8, fontWeight: 900, color: '#1a1a1a', letterSpacing: '0.25em',
                            textAlign: 'center', marginTop: 4, borderBottom: '1px dashed rgba(0,0,0,0.15)', paddingBottom: 3 }}>
                RIVAL AGENCIES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 5 }}>
                {opponents.map(o => (
                  <div key={o.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, fontWeight: 900 }}>
                      <span style={{ color: o.color }}>{o.name.split('_')[0]}</span>
                      <span style={{ color: '#555' }}>{Math.round(o.progress)}%</span>
                    </div>
                    <div style={{ height: 3, background: '#ddd', marginTop: 1 }}>
                      <motion.div animate={{ width: `${o.progress}%` }}
                                  style={{ height: '100%', background: o.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================= ZONE 2 — DETECTIVE DESK (Bottom 30%) ========================= */}
      <div style={{
        flex: '0 0 30%', position: 'relative',
        background: '#161210',
        backgroundImage:
          `repeating-linear-gradient(92deg, rgba(70,40,20,0.18) 0, rgba(70,40,20,0.18) 2px, transparent 2px, transparent 7px),
           repeating-linear-gradient(178deg, rgba(0,0,0,0.25) 0, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 14px),
           radial-gradient(ellipse at 50% 0%, rgba(120,75,35,0.35) 0%, transparent 60%)`,
        borderTop: '6px solid #2d1b15',
        boxShadow: '0 -8px 22px rgba(0,0,0,0.7) inset, 0 -2px 0 rgba(255,210,150,0.08) inset',
        display: 'grid',
        gridTemplateColumns: '220px 1fr 240px',
        alignItems: 'center',
        padding: '14px 28px',
        gap: 18,
      }}>
        {/* warm desk-lamp wash on desk */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
                      background: 'radial-gradient(ellipse at 50% -10%, rgba(255,200,140,0.18) 0%, transparent 60%)' }} />

        {/* === LEFT: Focus Counter === */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12 }}>
          <div style={{ background: '#0a0a0a', border: '2px solid #2a2a2a',
                        borderRadius: 6, padding: '10px 14px',
                        boxShadow: '0 6px 14px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
                        minWidth: 150 }}>
            <div style={{ fontSize: 8, color: '#5a5a5a', letterSpacing: '0.3em', fontWeight: 900 }}>FOCUS</div>
            <div style={{ fontFamily: 'monospace', fontSize: 30, fontWeight: 900, color: NEON_G,
                          letterSpacing: '0.08em', textShadow: `0 0 8px ${NEON_G}, 0 0 14px ${NEON_G}66`, lineHeight: 1 }}>
              {Math.round(cardCombat.focus)} / 100
            </div>
            <div style={{ marginTop: 6, height: 5, background: '#1a1a1a', borderRadius: 1,
                          border: '1px solid #2a2a2a', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${Math.min(100, cardCombat.focus)}%` }}
                          style={{ height: '100%',
                                   background: `linear-gradient(90deg, ${NEON_G}, #16a34a)`,
                                   boxShadow: `0 0 8px ${NEON_G}` }} />
            </div>
            <div style={{ marginTop: 4, fontSize: 7, color: '#5a5a5a', letterSpacing: '0.2em', fontWeight: 900 }}>
              TRUST · {cardCombat.trustScore}%
            </div>
          </div>
        </div>

        {/* === CENTER: Fanned Cards === */}
        <div style={{ position: 'relative', height: '100%', display: 'flex',
                      alignItems: 'flex-end', justifyContent: 'center' }}>
          {displayedHand.map((card, i) => (
            <DeskCard key={card.id} card={card} index={i} total={displayedHand.length}
                      selected={selectedCard === card.id}
                      hovered={hoveredCard === card.id}
                      canAfford={cardCombat.focus >= card.focusCost}
                      onSelect={() => setSelectedCard(card.id === selectedCard ? null : card.id)}
                      onHover={(v) => setHoveredCard(v ? card.id : null)} />
          ))}
        </div>

        {/* === RIGHT: Action Stamp === */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <motion.button
            onMouseDown={() => setStampPressed(true)}
            onMouseUp={() => setStampPressed(false)}
            onMouseLeave={() => setStampPressed(false)}
            onClick={() => phase === 'playing' && setPhase('dispatch')}
            whileTap={{ y: 6 }}
            style={{
              background: `linear-gradient(180deg, #D63A2E 0%, ${RED} 50%, #8B0000 100%)`,
              color: POLA, border: '2px solid #4A0000',
              padding: '14px 24px',
              fontFamily: FONT_STENCIL, fontWeight: 900, fontSize: 18,
              letterSpacing: '0.25em',
              borderRadius: 4,
              cursor: 'pointer',
              boxShadow: stampPressed
                ? '0 2px 0 #4A0000, 0 4px 10px rgba(0,0,0,0.55)'
                : '0 8px 0 #8B0000, 0 12px 22px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18)',
              transform: stampPressed ? 'translateY(6px)' : 'translateY(0)',
              transition: 'transform 0.08s, box-shadow 0.08s',
              textShadow: '0 2px 0 rgba(0,0,0,0.5)',
            }}>
            FILE REPORT →
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ================== sub-components ==================

function DeskCard({ card, index, total, selected, hovered, canAfford, onSelect, onHover }: {
  card: GameCard; index: number; total: number; selected: boolean; hovered: boolean;
  canAfford: boolean; onSelect: () => void; onHover: (v: boolean) => void;
}) {
  const center = (total - 1) / 2;
  const dist = index - center;
  const angle = dist * 6; // up to ±6° on outer cards
  const spread = 86;
  const x = dist * spread;
  const yArc = Math.abs(dist) * 8;
  const fam = CARD_FAMILY_CONFIG[card.family];
  const bodyColor = card.slot in BODY_PART_CONFIG ? BODY_PART_CONFIG[card.slot as BodyPart].color : '#8ba5a0';
  const lifted = selected || hovered;

  return (
    <motion.div
      onClick={canAfford ? onSelect : undefined}
      onMouseEnter={() => canAfford && onHover(true)}
      onMouseLeave={() => onHover(false)}
      initial={{ y: 200, opacity: 0 }}
      animate={{
        x, y: lifted ? -54 : yArc,
        rotate: lifted ? 0 : angle,
        opacity: 1,
        scale: selected ? 1.1 : hovered ? 1.06 : 1,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        position: 'absolute', bottom: 0,
        width: 100, height: 138,
        background: '#fdfbf6',
        borderRadius: 6,
        cursor: canAfford ? 'pointer' : 'not-allowed',
        opacity: canAfford ? 1 : 0.45,
        transformOrigin: 'bottom center',
        boxShadow: lifted
          ? `0 18px 30px rgba(0,0,0,0.65), 0 0 0 2px ${NEON_G}, 0 0 18px ${NEON_G}66`
          : '0 6px 14px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.25)',
        zIndex: lifted ? 50 : index,
        overflow: 'hidden',
        border: '1px solid #d8c8a8',
      }}>
      <div style={{ background: `linear-gradient(90deg, ${fam.color}, ${bodyColor})`, height: 5 }} />
      <div style={{ padding: '5px 7px', display: 'flex', flexDirection: 'column', height: 'calc(100% - 5px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 7, fontWeight: 900, color: fam.color, letterSpacing: '0.1em' }}>{fam.label}</div>
          <div style={{ background: RED, color: '#fff', borderRadius: 3, fontSize: 9, fontWeight: 900,
                        padding: '1px 5px', lineHeight: 1.2 }}>{card.focusCost}</div>
        </div>
        <div style={{ fontSize: 26, textAlign: 'center', margin: '4px 0',
                      filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))' }}>{card.icon}</div>
        <div style={{ fontSize: 9, fontWeight: 900, textAlign: 'center', color: '#1a0f05', lineHeight: 1.15 }}>{card.name}</div>
        <div style={{ fontSize: 7, fontWeight: 900, textAlign: 'center', color: bodyColor,
                      letterSpacing: '0.1em', marginTop: 2 }}>→ {card.slot.replace('fuse_', '')}</div>
        <div style={{ fontSize: 7, color: 'rgba(26,15,5,0.65)', textAlign: 'center',
                      marginTop: 'auto', lineHeight: 1.3, paddingBottom: 2 }}>{card.effect}</div>
      </div>
    </motion.div>
  );
}

function Pin({ color, style }: { color: string; style?: React.CSSProperties }) {
  return <div style={{
    position: 'absolute', width: 14, height: 14, borderRadius: '50%', zIndex: 12,
    background: `radial-gradient(circle at 32% 28%, #fff 0%, ${color} 38%, rgba(0,0,0,0.55) 100%)`,
    boxShadow: '0 2px 4px rgba(0,0,0,0.55), inset 0 -1px 1px rgba(0,0,0,0.3)',
    ...style
  }} />;
}

function BinderClip({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', zIndex: 14, width: 38, height: 22, ...style }}>
      <div style={{ position: 'absolute', top: 6, left: 0, width: '100%', height: 14,
                    background: 'linear-gradient(180deg, #9ea4ab 0%, #4a4f56 100%)',
                    borderRadius: 2, border: '1px solid #2a2e34',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'absolute', top: 0, left: 5, width: 28, height: 9,
                    border: '1.5px solid #b8bdc4', borderBottom: 'none', borderRadius: '20px 20px 0 0',
                    background: 'transparent' }} />
    </div>
  );
}

function Stamp({ style, text }: { style?: React.CSSProperties; text: string }) {
  return (
    <div style={{
      padding: '3px 10px', border: `3px double ${RED}`,
      fontFamily: FONT_STENCIL, fontWeight: 900, fontSize: 14,
      letterSpacing: '0.25em', color: RED, opacity: 0.78,
      background: 'rgba(245,237,224,0.05)', ...style
    }}>{text}</div>
  );
}

function IntroOverlay({ pokemon }: { pokemon: any }) {
  return (
    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(8,5,3,0.96)', fontFamily: FONT }}>
      <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        style={{ width: 480, padding: '36px 40px', background: MANILLA,
                 boxShadow: '0 24px 60px rgba(0,0,0,0.85)', border: '1px solid #A88A4A',
                 textAlign: 'center', position: 'relative' }}>
        {pokemon && <img src={getSpriteUrl(pokemon.id)} style={{ width: 100, height: 100, imageRendering: 'pixelated' }} />}
        <div style={{ fontFamily: FONT_STENCIL, fontSize: 22, fontWeight: 900,
                      color: '#3a2008', letterSpacing: '0.3em', marginTop: 10 }}>CASE FILE OPENED</div>
        {pokemon && <div style={{ fontSize: 12, fontWeight: 900, color: '#5a3e20', marginTop: 4, letterSpacing: '0.15em' }}>
          LEAD DETECTIVE: {pokemon.name.toUpperCase()}
        </div>}
      </motion.div>
    </motion.div>
  );
}

function DispatchOverlay({ annotations }: { annotations: Annotation[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(8,5,3,0.94)', fontFamily: FONT }}>
      <div style={{ width: 480, padding: '32px 40px', background: MANILLA,
                    border: '1px solid #A88A4A', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                    textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_STENCIL, fontSize: 14, fontWeight: 900,
                      color: '#3a2008', letterSpacing: '0.3em' }}>DISPATCH COMPLETE</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#1a0f05', marginTop: 6 }}>{annotations.length} MARKS</div>
        <div style={{ fontSize: 11, color: '#7a4a1a', marginTop: 4 }}>Filing report...</div>
      </div>
    </motion.div>
  );
}

function DoneOverlay() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', fontFamily: FONT }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: POLA, letterSpacing: '0.3em' }}>TRANSFERRING TO RESULTS...</div>
    </motion.div>
  );
}

function HoneypotWarning() {
  return (
    <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3"
      style={{ background: RED, color: '#fff', fontFamily: FONT_STENCIL,
               fontWeight: 900, fontSize: 14, letterSpacing: '0.2em',
               boxShadow: '0 6px 18px rgba(0,0,0,0.6)' }}>
      ⚠ HONEYPOT DETECTED — VERIFY THIS CALL
    </motion.div>
  );
}

export default Battle;
