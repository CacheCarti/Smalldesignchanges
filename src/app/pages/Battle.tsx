import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { BATTLE_IMAGES } from '../data/gameImages';
import { getSpriteUrl, ARCHITECTURE_COLORS } from '../data/pokemon';
import {
  GameCard, CARD_FAMILY_CONFIG, CARD_RARITY_COLORS, BODY_PART_CONFIG,
  BodyPart, generateHand,
} from '../data/cards';
import { CircuitSkillTree } from '../components/CircuitSkillTree';
import { ActivePetGuide } from '../components/ActivePetGuide';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const BG_DARK   = '#141414';
const BG_MID    = '#1F1A17';
const CORK      = BG_MID;
const CORK_DARK = BG_DARK;
const POLA      = '#f5ede0';
const STICKY_Y  = '#F9E97E';
const STICKY_R  = '#FFCDD2';
const STICKY_B  = '#BBDEFB';
const STICKY_G  = '#C8E6C9';
const MANILLA   = '#D5BCA4';
const FONT      = "'Courier New', monospace";
const RED_STR   = '#C62828';

const ROUND_TIME   = 120;
const NUM_IMAGES   = 4;
const FOCUS_DRAIN  = 0.35;
const FOCUS_GAIN   = 7;
const HONEYPOT_IDX = 2;
const MAX_CARDS    = 5;

type Phase = 'intro' | 'playing' | 'dispatch' | 'done';
type Mode  = 'probe' | 'sweep' | 'neg_sweep' | 'logic_link' | 'lasso' | 'trajectory' | 'grab';

interface Annotation {
  mode: Mode; x: number; y: number; w?: number; h?: number;
  qIdx: 0|1|2; correct?: boolean;
}

const MOCK_OPPONENTS = [
  { name: 'NeuroDetective_X', color: '#b879ff', progress: 0, acc: 72 },
  { name: 'DragonMaster99',   color: '#22d3ee', progress: 0, acc: 65 },
  { name: 'ShadowSniper',     color: '#ef4637', progress: 0, acc: 58 },
  { name: 'AgentGhost',       color: '#a3a3a3', progress: 0, acc: 88 },
];

const Q_COLORS  = [STICKY_R, STICKY_B, STICKY_G];
const Q_TOOLS: Mode[] = ['probe', 'lasso', 'probe'];
const Q_TOOL_LABELS = ['📍 PROBE', '✏️ LASSO', '📍 PROBE'];

export function Battle() {
  const nav = useNavigate();
  const { activePokemon, cardCombat, initCardCombat, playCard, addFocus, drainFocus, registerHoneypot, recordRound } = useGame();

  const [phase, setPhase] = useState<Phase>('intro');
  const [imageIdx, setImageIdx] = useState(0);
  const [qIdx, setQIdx] = useState<0|1|2>(0);
  const [openNote, setOpenNote] = useState<number | null>(0);  // Q1 auto-open
  const [time, setTime] = useState(ROUND_TIME);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [opponents, setOpponents] = useState(MOCK_OPPONENTS);
  const [pokemonFaded, setPokemonFaded] = useState(false);
  const [showHoneypotWarning, setShowHoneypotWarning] = useState(false);
  const [displayedHand, setDisplayedHand] = useState<GameCard[]>([]);
  const [bagOpen, setBagOpen] = useState(false);

  const [sweepDrag, setSweepDrag] = useState<{ x:number; y:number; w:number; h:number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [lastClickPos, setLastClickPos] = useState<{ x:number; y:number } | null>(null);
  const [lastAnnotationTime, setLastAnnotationTime] = useState<number>(0);

  const image = BATTLE_IMAGES[imageIdx % BATTLE_IMAGES.length];
  // Q1 and Q3 are probe, Q2 is lasso
  const activeTool: Mode = Q_TOOLS[qIdx];

  // Build visible hand (max 5 cards)
  useEffect(() => {
    const hand = cardCombat.hand.slice(0, MAX_CARDS);
    setDisplayedHand(hand);
  }, [cardCombat.hand]);

  // Shuffle cards after 2 images
  const shuffleCards = useCallback(() => {
    const newHand = generateHand(MAX_CARDS);
    setDisplayedHand(newHand);
  }, []);

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
    }, 3200);
    return () => clearTimeout(t);
  }, [phase]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (phase !== 'playing') return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const isHoneypot = imageIdx === HONEYPOT_IDX;
    const correct = Math.random() > 0.25;

    if (activeTool === 'probe' || activeTool === 'logic_link' || activeTool === 'grab') {
      setAnnotations(prev => [...prev, { mode: activeTool, x, y, qIdx, correct }]);
      addFocus(FOCUS_GAIN);
      if (isHoneypot) { registerHoneypot(correct); if (!correct) triggerHoneypot(); }
      setLastAnnotationTime(Date.now());
      setLastClickPos({ x, y });
      // Fade pokemon sprite
      setPokemonFaded(true);
      setTimeout(() => setPokemonFaded(false), 1000);
    }
  };

  const handleSweepStart = (e: React.MouseEvent) => {
    if (phase !== 'playing' || activeTool !== 'lasso') return;
    const rect = canvasRef.current!.getBoundingClientRect();
    setSweepDrag({ x: ((e.clientX - rect.left)/rect.width)*100, y: ((e.clientY - rect.top)/rect.height)*100, w:0, h:0 });
  };
  const handleSweepMove = (e: React.MouseEvent) => {
    if (!sweepDrag || activeTool !== 'lasso') return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left)/rect.width)*100;
    const y = ((e.clientY - rect.top)/rect.height)*100;
    setSweepDrag({ ...sweepDrag, w: x - sweepDrag.x, h: y - sweepDrag.y });
  };
  const handleSweepEnd = () => {
    if (!sweepDrag) return;
    if (Math.abs(sweepDrag.w) > 2 && Math.abs(sweepDrag.h) > 2) {
      setAnnotations(prev => [...prev, { mode: 'lasso', ...sweepDrag, qIdx, correct: Math.random() > 0.3 }]);
      addFocus(FOCUS_GAIN);
      setLastAnnotationTime(Date.now());
      setLastClickPos({ x: sweepDrag.x + sweepDrag.w / 2, y: sweepDrag.y + sweepDrag.h / 2 });
      if (imageIdx === HONEYPOT_IDX) { const c = Math.random()>0.25; registerHoneypot(c); if(!c) triggerHoneypot(); }
    }
    setSweepDrag(null);
  };

  const triggerHoneypot = () => { setShowHoneypotWarning(true); setTimeout(() => setShowHoneypotWarning(false), 3000); };

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
    const nextIdx = imageIdx + 1;
    setImageIdx(nextIdx);
    setQIdx(0);
    setOpenNote(0);
    // Shuffle cards after 2 images
    if (nextIdx === 2) shuffleCards();
    setAnnotations([]);
  };

  const selCard = selectedCard ? displayedHand.find(c => c.id === selectedCard) : null;
  const arch = activePokemon ? ARCHITECTURE_COLORS[activePokemon.architecture] : ARCHITECTURE_COLORS.CNN;

  // Thinking log lines
  const thinking = useMemo(() => {
    const lines: string[] = [];
    image.questions.forEach((qq, i) => {
      const n = annotations.filter(a => a.qIdx === i).length;
      lines.push(`Q${i+1}: ${qq.short} · ${n ? n + ' marks' : 'scanning…'}`);
    });
    if (imageIdx === HONEYPOT_IDX) lines.push('⚠ Honeypot suspected');
    if (cardCombat.honeypotStreak > 0) lines.push(`${cardCombat.honeypotStreak}× decoy streak`);
    if (annotations.length > 6) lines.push('Strong dataset forming');
    return lines;
  }, [image, annotations, imageIdx, cardCombat]);

  const handleNoteClick = (i: number) => {
    setQIdx(i as 0|1|2);
    setOpenNote(openNote === i ? null : i);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{
      background: `linear-gradient(135deg, ${BG_DARK} 0%, ${BG_MID} 50%, ${BG_DARK} 100%)`,
      fontFamily: FONT,
    }}>
      <AnimatePresence>
        {phase === 'intro' && <IntroOverlay pokemon={activePokemon} />}
        {phase === 'dispatch' && <DispatchOverlay pokemon={activePokemon} annotations={annotations} />}
        {phase === 'done' && <DoneOverlay />}
        {showHoneypotWarning && <HoneypotWarning />}
      </AnimatePresence>

      {/* TOP HUD */}
      <div className="flex items-center justify-between px-4 py-1.5 z-10 shrink-0" style={{
        background: 'rgba(15,8,3,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
      }}>
        <div className="flex items-center gap-3">
          {activePokemon && (
            <motion.div
              animate={{ opacity: pokemonFaded ? 0.2 : 1, scale: pokemonFaded ? 0.9 : 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 px-2.5 py-1 rounded shadow-md"
              style={{ background: POLA, transform:'rotate(-1deg)' }}>
              <img src={getSpriteUrl(activePokemon.id)} className="w-8 h-8 object-contain" style={{ imageRendering:'pixelated' }} />
              <div>
                <div className="text-xs font-black text-gray-900 tracking-tight leading-none">{activePokemon.name}</div>
                <div className="text-[9px] font-bold text-gray-500 leading-none mt-0.5">{arch.label}</div>
              </div>
            </motion.div>
          )}
          <StickyStat label="TRUST" value={`${cardCombat.trustScore}%`} color="#2e7d32" />
          <StickyStat label="FOCUS" value={`${Math.round(cardCombat.focus)}`} color="#C62828" />
          <StickyStat label="×STREAK" value={`${cardCombat.honeypotStreak}`} color="#7b1fa2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded shadow-md" style={{ background: POLA, transform:'rotate(1.5deg)' }}>
            <span className="text-base">⏱</span>
            <span className="text-xl font-black tracking-tight text-gray-900">
              {String(Math.floor(time/60)).padStart(2,'0')}:{String(time%60).padStart(2,'0')}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded shadow-md" style={{ background: STICKY_Y }}>
            <span className="text-[9px] font-black text-gray-700">IMG {imageIdx+1}/{NUM_IMAGES}</span>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 flex flex-row relative min-h-0 overflow-hidden" style={{ 
        gap:6, padding:'20px 24px 120px 24px', 
        background: '#D4C09B', // Manila folder inside base
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6)',
        backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.05) 100%)',
      }}>
        {/* Background folder texture & crease */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.04 }}>
          <filter id="folder-noise"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" stitchTiles="stitch" result="n" /><feColorMatrix type="saturate" values="0" /></filter>
          <rect width="100%" height="100%" filter="url(#folder-noise)" />
        </svg>
        <div style={{ position: 'absolute', top: 0, left: '50%', bottom: 0, width: 40, background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.12) 60%, transparent)', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 0 }} />
        
        {/* Background Props */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          {/* Dispersed Notes */}
          <div style={{ position: 'absolute', top: '8%', left: '10%', width: 110, height: 100, background: '#F9E97E', transform: 'rotate(-10deg)', boxShadow: '2px 4px 12px rgba(0,0,0,0.3)', padding: 10, fontSize: 8, color: '#5a3e20', fontFamily: "'Courier New', monospace" }}>
            <div style={{ borderBottom: '1px solid rgba(0,0,0,0.15)', paddingBottom: 4, marginBottom: 4, fontWeight: 900 }}>OBSERVATION</div>
            Target pattern shows recurring loops. Look closely at the edges!
          </div>
          <div style={{ position: 'absolute', bottom: '25%', right: '14%', width: 90, height: 90, background: '#BBDEFB', transform: 'rotate(12deg)', boxShadow: '2px 4px 12px rgba(0,0,0,0.3)', padding: 10, fontSize: 8, color: '#1565C0', fontFamily: "'Courier New', monospace" }}>
            <RealisticPin color="#E53935" style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }} />
            Do not trust the red signals... they are honeypots.
          </div>

          {/* Polaroid with thumbprint */}
          <div style={{ position: 'absolute', top: '12%', right: '22%', width: 140, height: 160, background: '#f5ede0', padding: '8px 8px 30px 8px', transform: 'rotate(15deg)', boxShadow: '3px 6px 15px rgba(0,0,0,0.4)' }}>
            <div style={{ width: '100%', height: '100%', background: '#222', overflow: 'hidden', position: 'relative' }}>
              <ImageWithFallback src="https://images.unsplash.com/photo-1600176970141-60a670821dfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb2xhcm9pZCUyMHZpbnRhZ2UlMjBwaG90b3xlbnwxfHx8fDE3NzcyMDk5MjR8MA&ixlib=rb-4.1.0&q=80&w=1080" alt="polaroid" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) contrast(1.2)' }} />
              {/* Thumbprint overlay */}
              <ImageWithFallback src="https://images.unsplash.com/photo-1611330500121-d9439ddc3d9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aHVtYnByaW50JTIwbWFjcm8lMjBpc29sYXRlZHxlbnwxfHx8fDE3NzcyMDk5Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080" alt="thumbprint" style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, mixBlendMode: 'multiply', opacity: 0.65, transform: 'rotate(-30deg)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, fontFamily: "'Courier New', monospace", fontWeight: 900, color: '#111', transform: 'rotate(-2deg)' }}>SUSPECT</div>
            <Paperclip angle={10} style={{ top: -10, left: 20 }} />
          </div>

          {/* Generic Polaroid pinned */}
          <div style={{ position: 'absolute', bottom: '30%', left: '20%', width: 110, height: 130, background: '#f5ede0', padding: '6px 6px 24px 6px', transform: 'rotate(-6deg)', boxShadow: '2px 5px 12px rgba(0,0,0,0.4)' }}>
            <RealisticPin color="#F9A825" style={{ top: 4, left: '50%', transform: 'translateX(-50%)' }} />
            <div style={{ width: '100%', height: '100%', background: '#222', overflow: 'hidden' }}>
              <ImageWithFallback src="https://images.unsplash.com/photo-1639617004859-e9713f75af0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZnV0dXJpc3RpYyUyMGNpdHklMjBhbGxleSUyMGJsdXJ8ZW58MXx8fHwxNzc3MjEwMTM4fDA&ixlib=rb-4.1.0&q=80&w=1080" alt="generic location" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.4) contrast(1.2)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 8, fontFamily: "'Courier New', monospace", color: '#555', fontWeight: 900 }}>SECTOR 7</div>
          </div>
        </div>

        {/* LEFT COLUMN — Detective Log + Questions + Rivals */}
        <div style={{ width:130, minWidth:130, display:'flex', flexDirection:'column', gap:6, zIndex: 10 }}>

          {/* Detective Log header */}
          <div style={{
            background: STICKY_Y, padding:'8px 8px 6px', borderRadius:2,
            boxShadow:'2px 3px 8px rgba(0,0,0,0.3), inset 0 -1px 4px rgba(0,0,0,0.05)',
            transform:'rotate(-1.5deg)', position:'relative', flexShrink:0,
          }}>
            <RealisticPin color="#1565C0" />
            <div style={{ fontSize:8, fontWeight:900, letterSpacing:'0.2em', color:'#2a1a08', textAlign:'center', marginTop:6, borderBottom:'1px dashed rgba(0,0,0,0.15)', paddingBottom:4, marginBottom:6 }}>
              DETECTIVE LOG
            </div>

            {/* 3 Sticky Note Questions */}
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {image.questions.map((qq, i) => {
                const isActive = qIdx === i;
                const isOpen = openNote === i;
                const bg = Q_COLORS[i];
                const toolLabel = Q_TOOL_LABELS[i];
                return (
                  <motion.div
                    key={i}
                    layout
                    onClick={() => handleNoteClick(i)}
                    animate={{ scale: isActive ? 1.02 : 1 }}
                    style={{
                      background: bg,
                      borderRadius:2, padding: isOpen ? '7px 8px' : '5px 8px',
                      cursor:'pointer', position:'relative',
                      boxShadow: isActive ? '0 3px 8px rgba(0,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.15)',
                      border: isActive ? '2px solid rgba(0,0,0,0.2)' : '1px solid rgba(0,0,0,0.1)',
                      transform: `rotate(${i%2===0 ? -0.5 : 0.5}deg)`,
                    }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:8, fontWeight:900, color:'rgba(0,0,0,0.5)', letterSpacing:'0.1em' }}>Q{i+1}</span>
                      <span style={{ fontSize:8, fontWeight:900, color:'rgba(0,0,0,0.6)' }}>{toolLabel.split(' ')[0]}</span>
                      {isActive && <span style={{ width:5, height:5, borderRadius:'50%', background:'#C62828', display:'inline-block' }} />}
                    </div>
                    {isOpen && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                        <div style={{ fontSize:8, fontWeight:700, color:'rgba(0,0,0,0.7)', marginTop:4, lineHeight:1.4 }}>
                          {qq.text}
                        </div>
                        <div style={{ fontSize:8, fontWeight:900, color:'rgba(0,0,0,0.5)', marginTop:4, letterSpacing:'0.12em' }}>
                          TOOL: {toolLabel}
                        </div>
                      </motion.div>
                    )}
                    {!isOpen && (
                      <div style={{ fontSize:8, fontWeight:700, color:'rgba(0,0,0,0.55)', marginTop:2, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                        {qq.short}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Thinking log */}
            <div style={{ marginTop:8, borderTop:'1px dashed rgba(0,0,0,0.12)', paddingTop:5, fontSize:8, color:'rgba(42,26,8,0.7)', lineHeight:1.5 }}>
              {thinking.map((t, i) => (
                <div key={i} style={{ display:'flex', gap:3 }}>
                  <span style={{ opacity:0.5 }}>·</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rival Agencies — slim */}
          <div style={{
            background: POLA, borderRadius:2, padding:'7px 8px',
            boxShadow:'2px 3px 8px rgba(0,0,0,0.3)',
            transform:'rotate(0.8deg)', position:'relative', flex:1, overflow:'hidden',
          }}>
            <RealisticPin color="#E53935" />
            <div style={{ fontSize:8, fontWeight:900, letterSpacing:'0.15em', color:'#1a1a1a', textAlign:'center', marginTop:6, borderBottom:'1px dashed rgba(0,0,0,0.15)', paddingBottom:4, marginBottom:5 }}>
              RIVAL AGENCIES
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {opponents.map(o => (
                <div key={o.name} style={{ display:'flex', flexDirection:'column', gap:1.5 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:7, fontWeight:900, color: o.color, maxWidth:70, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                      {o.name.split('_')[0]}
                    </span>
                    <span style={{ fontSize:7, fontWeight:700, color:'#555' }}>{Math.round(o.progress)}%</span>
                  </div>
                  <div style={{ height:3, background:'#ddd', borderRadius:2, overflow:'hidden' }}>
                    <motion.div animate={{ width:`${o.progress}%` }} style={{ height:'100%', background: o.color, borderRadius:2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER — The Big Polaroid Canvas */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10" style={{ alignItems:'center', justifyContent: 'center' }}>
          <motion.div
            className="w-full relative flex flex-col shadow-2xl"
            style={{
              background: POLA,
              padding:'6px 6px 40px 6px',
              maxWidth: 480,
              maxHeight: 480,
              aspectRatio: '1/1',
              flex:1,
              transform:`rotate(${imageIdx % 2 === 0 ? '-0.8deg' : '0.8deg'})`,
              boxShadow:'0 16px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)',
              borderRadius:2,
            }}
          >
            <RealisticPin color="#E53935" style={{ position:'absolute', top:4, left:'50%', transform:'translateX(-50%)' }} />
            <RealisticPin color="#F9A825" style={{ position:'absolute', top:4, left:16 }} />
            <RealisticPin color="#1565C0" style={{ position:'absolute', top:4, right:16 }} />

            {/* The image canvas */}
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleSweepStart}
              onMouseMove={handleSweepMove}
              onMouseUp={handleSweepEnd}
              style={{
                flex:1, width:'100%', position:'relative', background:'#111',
                overflow:'hidden', cursor: activeTool === 'lasso' ? 'crosshair' : 'cell',
                boxShadow:'inset 0 0 16px rgba(0,0,0,0.5)',
                minHeight:0,
              }}
            >
              <img src={image.url} style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} />

              {/* Annotations */}
              {annotations.map((a, i) => {
                const c = a.qIdx === 0 ? '#E53935' : a.qIdx === 1 ? '#1565C0' : '#2E7D32';
                if (a.mode === 'probe' || a.mode === 'logic_link' || a.mode === 'grab') {
                  return (
                    <div key={i} style={{
                      position:'absolute', left:`${a.x}%`, top:`${a.y}%`,
                      transform:'translate(-50%,-50%)', width:24, height:24,
                      borderRadius:'50%', border:`3px solid ${c}`,
                      boxShadow:`0 0 6px ${c}88`, pointerEvents:'none', opacity:0.9,
                    }} />
                  );
                }
                // Lasso sweep
                return (
                  <div key={i} style={{
                    position:'absolute',
                    left:`${a.w && a.w < 0 ? a.x + a.w : a.x}%`,
                    top:`${a.h && a.h < 0 ? a.y + a.h : a.y}%`,
                    width:`${Math.abs(a.w||0)}%`, height:`${Math.abs(a.h||0)}%`,
                    border:`2px dashed ${c}`, background:`${c}18`,
                    pointerEvents:'none', boxShadow:`0 0 8px ${c}44`,
                    borderRadius:2,
                  }} />
                );
              })}

              {sweepDrag && (
                <div style={{
                  position:'absolute',
                  left:`${sweepDrag.w < 0 ? sweepDrag.x + sweepDrag.w : sweepDrag.x}%`,
                  top:`${sweepDrag.h < 0 ? sweepDrag.y + sweepDrag.h : sweepDrag.y}%`,
                  width:`${Math.abs(sweepDrag.w)}%`, height:`${Math.abs(sweepDrag.h)}%`,
                  border:`2px dashed #1565C0`, background:'rgba(21,101,192,0.15)',
                  pointerEvents:'none', borderRadius:2,
                }} />
              )}

              {activePokemon && phase === 'playing' && (
                <ActivePetGuide
                  pokemonId={activePokemon.id}
                  pokemonName={activePokemon.name}
                  architecture={activePokemon.architecture}
                  canvasRect={canvasRect}
                  lastClickPos={lastClickPos}
                  onAnnotation={lastAnnotationTime}
                  trustScore={cardCombat.trustScore}
                />
              )}
            </div>

            {/* Caption + NEXT bottom */}
            <div style={{ position:'absolute', bottom:4, left:10, right:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontFamily:"'Courier New', monospace", fontSize:12, fontWeight:900, color:'#555', letterSpacing:'0.03em' }}>
                Case #{imageIdx+1} — {image.label}
              </div>
              <motion.button
                whileHover={{ scale:1.08 }} whileTap={{ scale:0.94 }}
                onClick={nextImage}
                style={{
                  background: '#1a1a1a', color:'#f5ede0', border:'none',
                  padding:'4px 14px', borderRadius:3, fontSize:11, fontWeight:900,
                  letterSpacing:'0.12em', cursor:'pointer', fontFamily:FONT,
                  boxShadow:'0 2px 6px rgba(0,0,0,0.4)',
                }}>
                NEXT →
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN — Circuit Skill Tree in Folder */}
        <div style={{ width:220, minWidth:180, display:'flex', flexDirection:'column', gap:6, zIndex: 10 }}>
          <div style={{
            flex:1, display:'flex', flexDirection:'column', position:'relative',
            background:MANILLA, borderRadius:'0 4px 4px 4px',
            border:`1px solid #C4AB93`, padding:'24px 10px 10px',
            boxShadow:'3px 4px 14px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              position:'absolute', top:-24, right:8, background:MANILLA,
              padding:'5px 14px', borderRadius:'4px 4px 0 0', fontSize:9,
              fontWeight:900, color:'#3a2a1a', letterSpacing:'0.1em',
              border:'1px solid #C4AB93', borderBottom:'none',
            }}>
              ANATOMICAL CIRCUIT
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div>
                <div style={{ fontSize:8, fontWeight:900, color:'#3a2a1a', letterSpacing:'0.1em' }}>LEAD AUGMENTS</div>
                <div style={{ fontSize:7, color:'rgba(58,42,26,0.6)', marginTop:1 }}>Wire cards to body parts</div>
              </div>
              {activePokemon && (
                <img src={getSpriteUrl(activePokemon.id)} style={{ width:30, height:30, objectFit:'contain', imageRendering:'pixelated' }} />
              )}
            </div>
            <div style={{ flex:1, background:'#120e0a', borderRadius:4, overflow:'hidden', minHeight:0, border:'2px solid rgba(0,0,0,0.3)', boxShadow:'inset 0 4px 12px rgba(0,0,0,0.5)' }}>
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
          </div>
        </div>
      </div>

      {/* BOTTOM EVIDENCE BAG */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%', height: 200, zIndex: 30,
        pointerEvents: 'none', display: 'flex', justifyContent: 'center'
      }}>
        {/* The Bag Itself */}
        <motion.div
          onClick={() => setBagOpen(!bagOpen)}
          animate={{ y: bagOpen ? 80 : 0 }}
          style={{
            position: 'absolute', bottom: 0, width: 360, height: 120,
            background: 'linear-gradient(170deg, #A27E5A 0%, #755638 100%)',
            borderRadius: '8px 8px 0 0', cursor: 'pointer',
            borderTop: '3px dashed rgba(255,255,255,0.4)',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.7), inset 0 4px 10px rgba(255,255,255,0.15)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16,
            border: '2px solid rgba(90,60,30,0.9)', borderBottom: 'none', zIndex: 40,
            pointerEvents: 'auto',
          }}
        >
          <div style={{ padding: '2px 8px', border: '2px solid rgba(0,0,0,0.4)', transform: 'rotate(-2deg)', marginBottom: 8, background: 'rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#2a1a0a', letterSpacing: '0.2em' }}>EVIDENCE</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em', fontWeight: 'bold' }}>
            {bagOpen ? 'TAP TO STASH' : 'TAP TO OPEN DECK'} ({displayedHand.length}/{MAX_CARDS})
          </div>
        </motion.div>

        {/* The Cards inside the bag */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', zIndex: 35, overflow: 'visible' }}>
          {displayedHand.map((card, i) => (
            <CardInHand
              key={card.id} card={card} index={i} total={displayedHand.length}
              selected={selectedCard === card.id}
              canAfford={cardCombat.focus >= card.focusCost}
              onSelect={() => setSelectedCard(card.id === selectedCard ? null : card.id)}
              hidden={!bagOpen}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function StickyStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: STICKY_Y, padding:'3px 8px', borderRadius:2,
      display:'flex', flexDirection:'column', alignItems:'center',
      boxShadow:'1px 2px 5px rgba(0,0,0,0.2)', transform:'rotate(-0.5deg)',
    }}>
      <div style={{ fontSize:7, color:'#555', fontWeight:900, letterSpacing:'0.1em' }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:900, color, lineHeight:1 }}>{value}</div>
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

// Card rarity gradients
const RARITY_GRADIENTS: Record<string, string> = {
  common: 'linear-gradient(160deg, #f5f5f5 0%, #e8e8e8 100%)',
  rare:   'linear-gradient(160deg, #e8f4ff 0%, #c8e4ff 100%)',
  epic:   'linear-gradient(160deg, #f4e8ff 0%, #dfc0ff 100%)',
};
const RARITY_ACCENTS: Record<string, string> = {
  common: '#9CA3AF', rare: '#3B82F6', epic: '#A855F7',
};

function CardInHand({ card, index, total, selected, canAfford, onSelect, hidden }: {
  card: GameCard; index: number; total: number; selected: boolean; canAfford: boolean; onSelect: () => void; hidden?: boolean;
}) {
  const spread = Math.min(55, 480 / Math.max(total, MAX_CARDS));
  const offset = (index - (total - 1) / 2) * spread;
  const angle  = (index - (total - 1) / 2) * 3.5;
  const fam    = CARD_FAMILY_CONFIG[card.family];
  const bodyColor = card.slot in BODY_PART_CONFIG ? BODY_PART_CONFIG[card.slot as BodyPart].color : '#8ba5a0';
  const accentColor = RARITY_ACCENTS[card.rarity];

  return (
    <motion.div
      onClick={canAfford && !hidden ? onSelect : undefined}
      initial={{ y: 200, opacity: 0 }}
      animate={{ 
        x: `calc(50vw + ${offset}px - 56px)`, 
        y: hidden ? 200 : (selected ? -80 : -20), 
        rotate: selected ? 0 : angle, 
        opacity: hidden ? 0 : 1, 
        scale: selected ? 1.12 : 1 
      }}
      whileHover={canAfford && !hidden ? { y: selected ? -80 : -66, scale: 1.06, zIndex: 99 } : {}}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      style={{
        position:'absolute', bottom:8, left:0,
        width:92, height:120,
        background: RARITY_GRADIENTS[card.rarity],
        borderRadius:6, cursor: canAfford ? 'pointer' : 'not-allowed',
        opacity: canAfford ? 1 : 0.5,
        display:'flex', flexDirection:'column', padding:0, color:'#1a0f05',
        transformOrigin:'bottom center',
        boxShadow: selected
          ? `0 12px 28px rgba(0,0,0,0.55), 0 0 0 2px ${accentColor}`
          : `0 4px 10px rgba(0,0,0,0.3), 0 0 0 1px ${accentColor}44`,
        overflow:'hidden',
      }}>
      {/* Colorful header band */}
      <div style={{
        background:`linear-gradient(90deg, ${fam.color}, ${bodyColor})`,
        height:5, width:'100%', opacity:0.85,
      }} />
      <div style={{ flex:1, padding:'4px 6px', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:6, fontWeight:900, letterSpacing:'0.08em', color:fam.color }}>{fam.label}</div>
          <div style={{
            background: '#C62828', color:'#fff', borderRadius:3,
            fontSize:8, fontWeight:900, padding:'1px 4px', lineHeight:1.2,
          }}>{card.focusCost}</div>
        </div>
        <div style={{ fontSize:22, textAlign:'center', margin:'3px 0', filter:'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' }}>{card.icon}</div>
        <div style={{ fontSize:8, fontWeight:900, textAlign:'center', lineHeight:1.2, color:'#1a0f05' }}>{card.name}</div>
        <div style={{ fontSize:7, fontWeight:900, textAlign:'center', marginTop:2, color:bodyColor, letterSpacing:'0.08em' }}>
          → {card.slot.replace('fuse_','')}
        </div>
        <div style={{ fontSize:6, color:'rgba(26,15,5,0.65)', textAlign:'center', marginTop:'auto', lineHeight:1.3 }}>{card.effect}</div>
      </div>
      {/* Rarity gem at bottom */}
      <div style={{ display:'flex', justifyContent:'center', paddingBottom:5, gap:2 }}>
        {Array.from({ length: card.rarity === 'common' ? 1 : card.rarity === 'rare' ? 2 : 3 }).map((_,i) => (
          <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:accentColor, boxShadow:`0 0 4px ${accentColor}` }} />
        ))}
      </div>
    </motion.div>
  );
}

function IntroOverlay({ pokemon }: { pokemon: any }) {
  return (
    <motion.div initial={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.7 }}
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" style={{ fontFamily:FONT, perspective:1000 }}>
      <motion.div initial={{ scale:0.8, rotateX:40, y:40 }} animate={{ scale:1, rotateX:0, y:0 }} transition={{ type:'spring', damping:20, stiffness:100 }}
        className="relative flex flex-col items-center justify-center"
        style={{
          width:480, height:320, background:`linear-gradient(160deg, #d4b895 0%, #c4a87a 100%)`,
          borderRadius:4, boxShadow:'0 24px 60px rgba(0,0,0,0.8)', border:'1px solid #b39b7d',
        }}>
        <div className="absolute inset-3 border border-dashed" style={{ borderColor:'rgba(100,60,30,0.25)' }} />
        {pokemon && <img src={getSpriteUrl(pokemon.id)} className="w-28 h-28 z-10" style={{ imageRendering:'pixelated', filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }} />}
        <div className="text-xl font-black text-amber-950 mt-4 tracking-widest z-10" style={{ fontFamily:FONT }}>CASE FILE OPENED</div>
        {pokemon && <div className="text-sm font-bold text-amber-900 mt-1 z-10" style={{ fontFamily:FONT }}>LEAD DETECTIVE: {pokemon.name.toUpperCase()}</div>}
        <motion.div initial={{ scale:3.5, opacity:0 }} animate={{ scale:1, opacity:0.8 }} transition={{ delay:0.6, type:'spring', stiffness:300, damping:14 }}
          className="absolute top-6 right-6 border-4 rounded px-4 py-2 text-2xl font-black transform rotate-12 pointer-events-none z-20"
          style={{ borderColor:'#C62828', color:'#C62828', fontFamily:FONT }}>
          ACTIVE
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function DispatchOverlay({ pokemon, annotations }: { pokemon: any; annotations: Annotation[] }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.5 }}
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center flex-col" style={{ fontFamily:FONT }}>
      <motion.div initial={{ scale:1 }} animate={{ scale:0.85, y:-40 }} transition={{ delay:0.8, type:'spring', damping:20 }}
        style={{ width:480, height:300, background:'#d4b895', borderRadius:4, position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'1px solid #b39b7d', boxShadow:'0 20px 50px rgba(0,0,0,0.7)' }}>
        <div style={{ fontSize:13, fontWeight:900, color:'#3a2a1a', letterSpacing:'0.2em', fontFamily:FONT }}>DISPATCH COMPLETE</div>
        <div style={{ fontSize:36, fontWeight:900, color:'#1a0f05', marginTop:8, letterSpacing:'-0.02em', fontFamily:FONT }}>
          {annotations.length} MARKS
        </div>
        <div style={{ fontSize:11, color:'rgba(58,42,26,0.7)', marginTop:6, fontFamily:FONT }}>Processing results...</div>
        <motion.div initial={{ scale:3, opacity:0 }} animate={{ scale:1, opacity:0.85 }} transition={{ delay:1.2, type:'spring', stiffness:400, damping:14 }}
          className="absolute bottom-6 right-6 text-2xl font-black transform -rotate-8 pointer-events-none"
          style={{ border:'3px solid #C62828', color:'#C62828', padding:'3px 10px', borderRadius:3, fontFamily:FONT }}>
          FILED
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function DoneOverlay() {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" style={{ fontFamily:FONT }}>
      <div style={{ fontSize:18, fontWeight:900, color:'#f5ede0', letterSpacing:'0.3em' }}>TRANSFERRING TO RESULTS...</div>
    </motion.div>
  );
}

function HoneypotWarning() {
  return (
    <motion.div initial={{ y:-60, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:-60, opacity:0 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded shadow-xl"
      style={{ background:'#C62828', color:'#fff', fontFamily:FONT, fontWeight:900, fontSize:13, letterSpacing:'0.15em' }}>
      ⚠ HONEYPOT DETECTED — VERIFY THIS CALL
    </motion.div>
  );
}

export default Battle;
