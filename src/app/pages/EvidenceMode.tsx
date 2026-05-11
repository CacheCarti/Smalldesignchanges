import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { getSpriteUrl } from '../data/pokemon';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const POLA = '#f5ede0';
const PAPER = '#f1e6cf';
const STICKY_Y = '#F9E97E';
const STICKY_B = '#BBDEFB';
const FONT = "'Courier New', monospace";
const FONT_HAND = "'Comic Sans MS', 'Chalkboard SE', sans-serif";
const RED = '#B23A2E';
const NAVY = '#1A3A5C';

type Klass = 'Senegal' | 'France' | 'Japan' | 'Brazil';
const CLASSES: Klass[] = ['Senegal', 'France', 'Japan', 'Brazil'];

type EvidencePoint = { id: string; x: number; y: number; label: string; petQuip: string };
type Case = { id: string; url: string; truth: Klass; evidence: EvidencePoint[]; petGuess?: { klass: Klass; conf: number } };

const TRAIN: Case[] = [
  { id: 'tr1', url: 'https://images.unsplash.com/photo-1547471080-7cb2ac6470b9?w=900', truth: 'Senegal',
    evidence: [
      { id: 'a', x: 62, y: 78, label: 'red dirt road', petQuip: "Boss says red dirt = Senegal. Noted." },
      { id: 'b', x: 22, y: 34, label: 'acacia trees', petQuip: "Thin acacias logged under 'Sahel'." },
    ]},
  { id: 'tr2', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900', truth: 'France',
    evidence: [
      { id: 'a', x: 50, y: 55, label: 'eiffel tower', petQuip: "Wrought-iron lattice → France. Got it." },
      { id: 'b', x: 28, y: 80, label: 'cobblestone', petQuip: "Cobblestone pattern noted." },
    ]},
  { id: 'tr3', url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=900', truth: 'Japan',
    evidence: [
      { id: 'a', x: 55, y: 45, label: 'pagoda roof', petQuip: "Curved pagoda eaves → Japan." },
      { id: 'b', x: 30, y: 70, label: 'cherry blossom', petQuip: "Pink petals. Filing under 'sakura'." },
    ]},
  { id: 'tr4', url: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=900', truth: 'Brazil',
    evidence: [
      { id: 'a', x: 50, y: 50, label: 'favela tile roofs', petQuip: "Stacked tile roofs → Brazil. Got it." },
      { id: 'b', x: 70, y: 25, label: 'palm trees', petQuip: "Coastal palms cross-referenced." },
    ]},
  { id: 'tr5', url: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=900', truth: 'Senegal',
    evidence: [
      { id: 'a', x: 45, y: 60, label: 'dusty haze', petQuip: "Harmattan haze. Sahel signature." },
      { id: 'b', x: 75, y: 80, label: 'baobab silhouette', petQuip: "Baobab! Dead giveaway." },
    ]},
  { id: 'tr6', url: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=900', truth: 'Japan',
    evidence: [
      { id: 'a', x: 40, y: 55, label: 'neon kanji', petQuip: "Neon kanji signs → Japan, urban." },
      { id: 'b', x: 65, y: 75, label: 'narrow alley', petQuip: "Cramped alley geometry noted." },
    ]},
  { id: 'tr7', url: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=900', truth: 'France',
    evidence: [
      { id: 'a', x: 50, y: 40, label: 'haussmann facade', petQuip: "Haussmann balconies → Paris-coded." },
      { id: 'b', x: 30, y: 80, label: 'café awning', petQuip: "Striped awning. Très français." },
    ]},
];

const TEST: Case[] = [
  { id: 'te1', url: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=1080', truth: 'Senegal',
    evidence: [
      { id: 'a', x: 55, y: 70, label: 'reddish soil', petQuip: "Reddish lateritic soil — Senegal training match." },
      { id: 'b', x: 25, y: 40, label: 'thin trees', petQuip: "Thin acacia silhouettes — savanna." },
    ], petGuess: { klass: 'Senegal', conf: 0.87 }},
  { id: 'te2', url: 'https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?w=1080', truth: 'France',
    evidence: [
      { id: 'a', x: 50, y: 50, label: 'stone arch', petQuip: "Stone arch + slate roof = France." },
      { id: 'b', x: 75, y: 75, label: 'vine row', petQuip: "Vineyard rows. Bordeaux-shaped." },
    ], petGuess: { klass: 'France', conf: 0.81 }},
  { id: 'te3', url: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1080', truth: 'Japan',
    evidence: [
      { id: 'a', x: 60, y: 40, label: 'cedar slope', petQuip: "Cedar-covered slope. Honshu vibes." },
      { id: 'b', x: 30, y: 70, label: 'torii red', petQuip: "Red torii in frame — Japan, confident." },
    ], petGuess: { klass: 'Japan', conf: 0.92 }},
  { id: 'te4', url: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=1080', truth: 'Brazil',
    evidence: [
      { id: 'a', x: 50, y: 55, label: 'beach skyline', petQuip: "Beach-meets-skyline. Copacabana energy." },
      { id: 'b', x: 25, y: 35, label: 'sugarloaf', petQuip: "Granite dome silhouette — Sugarloaf?" },
    ], petGuess: { klass: 'Brazil', conf: 0.78 }},
  { id: 'te5', url: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=1080', truth: 'Senegal',
    evidence: [
      { id: 'a', x: 50, y: 70, label: 'dirt road', petQuip: "Dirt road tone matches training set 1 + 5." },
      { id: 'b', x: 70, y: 30, label: 'baobab', petQuip: "Baobab again. Two cases in, I know this." },
    ], petGuess: { klass: 'Senegal', conf: 0.84 }},
];

type Phase = 'intro' | 'train' | 'test' | 'done';

type PadEntry = { id: string; text: string; klass: Klass };
type StickyData = { id: string; text: string; imgX: number; imgY: number; side: 'L' | 'R'; kind: 'player' | 'ai' };

export function EvidenceMode() {
  const nav = useNavigate();
  const { activePokemon } = useGame();

  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0); // round index within phase
  const [petMsg, setPetMsg] = useState('');

  const [playerGuess, setPlayerGuess] = useState<Klass | null>(null);
  const [markedIds, setMarkedIds] = useState<string[]>([]);
  const [stickies, setStickies] = useState<StickyData[]>([]);
  const [pad, setPad] = useState<PadEntry[]>([]);
  const [showHeat, setShowHeat] = useState(false);
  const [petAnswered, setPetAnswered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const stickyRefs = useRef<{ [k: string]: HTMLDivElement | null }>({});
  const [conns, setConns] = useState<{ sx: number; sy: number; ex: number; ey: number; color: string }[]>([]);

  const currentSet = phase === 'train' ? TRAIN : TEST;
  const current = currentSet[idx];
  const trainTotal = TRAIN.length;
  const testTotal = TEST.length;

  useEffect(() => {
    if (!activePokemon) { nav('/loadout?target=evidence'); return; }
    const t = setTimeout(() => {
      setPhase('train');
      setPetMsg(`Round 1 of ${trainTotal}. Pick the country, then circle the clues. I'll take notes.`);
    }, 1300);
    return () => clearTimeout(t);
  }, []);

  // Strings
  const recompute = () => {
    if (!containerRef.current || !imageRef.current) return;
    const c = containerRef.current.getBoundingClientRect();
    const im = imageRef.current.getBoundingClientRect();
    const next: typeof conns = [];
    stickies.forEach(n => {
      const el = stickyRefs.current[n.id];
      if (!el) return;
      const r = el.getBoundingClientRect();
      const sx = (n.side === 'L' ? r.right : r.left) - c.left;
      const sy = r.top + r.height / 2 - c.top;
      const ex = im.left + (n.imgX / 100) * im.width - c.left;
      const ey = im.top + (n.imgY / 100) * im.height - c.top;
      next.push({ sx, sy, ex, ey, color: n.kind === 'player' ? RED : NAVY });
    });
    setConns(next);
  };
  useEffect(() => {
    const t = setTimeout(recompute, 60);
    window.addEventListener('resize', recompute);
    return () => { clearTimeout(t); window.removeEventListener('resize', recompute); };
  }, [stickies, phase, idx]);

  // ---------- TRAINING interactions ----------
  const slotsL = useRef(0);
  const slotsR = useRef(0);

  const resetRound = () => {
    setPlayerGuess(null);
    setMarkedIds([]);
    setStickies([]);
    setShowHeat(false);
    setPetAnswered(false);
    slotsL.current = 0;
    slotsR.current = 0;
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const r = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;

    if (phase === 'train') {
      if (!playerGuess) { setPetMsg("Pick the country first, Boss."); return; }
      const ev = current.evidence.find(p => Math.hypot(p.x - x, p.y - y) < 13);
      if (!ev) { setPetMsg("Nothing on the board there, Boss."); return; }
      if (markedIds.includes(ev.id)) return;
      const side: 'L' | 'R' = ev.x > 50 ? 'R' : 'L';
      setMarkedIds(prev => [...prev, ev.id]);
      setStickies(prev => [...prev, { id: `pl-${current.id}-${ev.id}`, text: `BOSS: ${ev.label}`, imgX: ev.x, imgY: ev.y, side, kind: 'player' }]);
      setPad(p => [...p, { id: `${current.id}-${ev.id}`, text: ev.petQuip, klass: current.truth }]);
      setPetMsg(ev.petQuip);
    }
  };

  const submitGuess = (k: Klass) => {
    if (phase !== 'train' || playerGuess) return;
    setPlayerGuess(k);
    const correct = k === current.truth;
    setPetMsg(correct
      ? `${k}? Yes Boss. I'll remember the look of this one.`
      : `${k}? Hm. Truth is ${current.truth}. Filing the correction.`);
    setPad(p => [...p, { id: `${current.id}-meta`, text: correct ? `Boss called ${k}. ✓` : `Boss said ${k}, actually ${current.truth}.`, klass: current.truth }]);
  };

  const nextTrain = () => {
    if (idx + 1 < trainTotal) {
      setIdx(idx + 1);
      resetRound();
      setPetMsg(`Round ${idx + 2} of ${trainTotal}. Show me another, Boss.`);
    } else {
      setIdx(0);
      resetRound();
      setPhase('test');
      setPetMsg(`Training done. Test photo 1 of ${testTotal} — let me work.`);
      setTimeout(() => runInference(0), 900);
    }
  };

  // ---------- TESTING ----------
  const runInference = (i: number) => {
    const c = TEST[i];
    setShowHeat(true);
    setPetMsg("Activating attention map...");
    slotsL.current = 0;
    slotsR.current = 0;
    c.evidence.forEach((ev, k) => {
      setTimeout(() => {
        const side: 'L' | 'R' = ev.x > 50 ? 'R' : 'L';
        setStickies(prev => [...prev, { id: `ai-${c.id}-${ev.id}`, text: ev.petQuip, imgX: ev.x, imgY: ev.y, side, kind: 'ai' }]);
        setPetMsg(ev.petQuip);
      }, 700 + k * 1300);
    });
    setTimeout(() => {
      setPetAnswered(true);
      const g = c.petGuess!;
      setPetMsg(`Verdict: ${g.klass}. ${(g.conf * 100).toFixed(0)}% confidence.`);
    }, 700 + c.evidence.length * 1300 + 700);
  };

  const nextTest = () => {
    if (idx + 1 < testTotal) {
      const next = idx + 1;
      setIdx(next);
      resetRound();
      setPetMsg(`Test photo ${next + 1} of ${testTotal}.`);
      setTimeout(() => runInference(next), 700);
    } else {
      setPhase('done');
      setPetMsg("All five cases closed, Boss. Coffee time.");
    }
  };

  return (
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden" style={{ fontFamily: FONT, ...corkboardBg }}>
      <div style={corkSpeckle} />
      <div style={vignette} />

      {/* ============== DESK PROPS ============== */}
      <CornerProp src="https://images.unsplash.com/photo-1500634245200-e5245c7574ef?w=300"
                  style={{ top: 72, left: 18, width: 130, height: 95, transform: 'rotate(-7deg)' }} caption="EXHIBIT A" />
      <CornerProp src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=300"
                  style={{ bottom: 175, left: 16, width: 150, height: 105, transform: 'rotate(5deg)' }} caption="ARCHIVE" />
      <CornerProp src="https://images.unsplash.com/photo-1505764706515-aa95265c5abc?w=300"
                  style={{ top: 195, left: 28, width: 120, height: 88, transform: 'rotate(-2deg)' }} caption="WITNESS" />
      <ManilaFolder style={{ top: 70, right: 22 }} />
      <Newspaper style={{ bottom: 18, right: 36 }} />
      <MagnifyingGlass style={{ top: 320, right: 60 }} />
      <CoffeeStain style={{ top: 470, right: 220 }} />
      <CoffeeStain style={{ bottom: 230, left: 230 }} small />
      <Paperclip style={{ top: 60, left: 280, transform: 'rotate(28deg)' }} />
      <Paperclip style={{ bottom: 320, right: 280, transform: 'rotate(-60deg)' }} />
      <Stamp style={{ top: 28, right: 200 }} text="CLASSIFIED" />
      <Stamp style={{ bottom: 30, left: 200, transform: 'rotate(-12deg)' }} text="EVIDENCE" tone="navy" />
      <Pencil style={{ top: 450, left: 220, transform: 'rotate(40deg)' }} />
      <Pencil style={{ top: 28, right: 380, transform: 'rotate(-20deg)' }} />
      <Postcard style={{ bottom: 200, right: 200, transform: 'rotate(8deg)' }} />
      <InkBottle style={{ bottom: 22, left: 420 }} />
      <Matchbook style={{ top: 200, right: 230, transform: 'rotate(14deg)' }} />

      {/* SVG strings */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 6, pointerEvents: 'none' }}>
        <defs>
          <filter id="stringShadow"><feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.55"/></filter>
        </defs>
        {conns.map((c, i) => {
          const mx = (c.sx + c.ex) / 2;
          const my = Math.min(c.sy, c.ey) - 20;
          return <path key={i} d={`M ${c.sx} ${c.sy} Q ${mx} ${my} ${c.ex} ${c.ey}`}
                       fill="none" stroke={c.color} strokeWidth={2.5} strokeLinecap="round" filter="url(#stringShadow)" />;
        })}
      </svg>

      {/* HEADER */}
      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 30 }}>
        <div style={headerCard}>
          <div style={{ fontSize: 11, color: '#a08a6a', letterSpacing: '0.3em' }}>CASE #8402 / EVIDENCE MODE</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: POLA, letterSpacing: '0.15em', marginTop: 2 }}>
            {phase === 'intro' && '— BOOTING —'}
            {phase === 'train' && `PHASE I · TRAINING ${idx + 1}/${trainTotal}`}
            {phase === 'test' && `PHASE II · INFERENCE ${idx + 1}/${testTotal}`}
            {phase === 'done' && 'CASE CLOSED'}
          </div>
        </div>
      </div>

      <button onClick={() => nav('/hub')}
              style={{ position: 'absolute', top: 14, right: 14, zIndex: 30,
                       background: '#1a1410', color: POLA, border: '1px solid #5a3e20',
                       padding: '8px 18px', borderRadius: 3, fontFamily: FONT, fontSize: 12,
                       fontWeight: 900, letterSpacing: '0.15em', cursor: 'pointer',
                       boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        ABORT CASE
      </button>

      {/* INTRO */}
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 flex items-center justify-center"
                      style={{ background: 'rgba(10,7,5,0.92)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#a08a6a', letterSpacing: '0.4em' }}>ANNOTOPIA</div>
              <h2 style={{ fontSize: 36, color: POLA, fontWeight: 900, letterSpacing: '0.25em', marginTop: 8 }}>
                THE DETECTIVE'S BOARD
              </h2>
              <p style={{ color: '#7a6a55', marginTop: 12, fontFamily: FONT_HAND }}>
                7 training rounds · 5 test cases
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============== CENTER PHOTO (Train + Test) ============== */}
      {(phase === 'train' || phase === 'test') && current && (
        <div style={{ position: 'absolute', left: '50%', top: '44%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
          <motion.div key={`${phase}-${idx}`}
                      initial={{ opacity: 0, scale: 0.88, rotate: -3 }}
                      animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
                      style={{ background: POLA, padding: '14px 14px 46px 14px',
                               boxShadow: '6px 12px 36px rgba(0,0,0,0.7)', position: 'relative' }}>
            <Pin color={RED} style={{ top: 8, left: '50%', transform: 'translateX(-50%)' }} />
            <Tape style={{ top: -10, left: 30, width: 80, transform: 'rotate(-8deg)' }} />
            <Tape style={{ top: -10, right: 30, width: 80, transform: 'rotate(7deg)' }} />
            <div ref={imageRef} onClick={handleImageClick}
                 style={{ width: 460, height: 340, position: 'relative', overflow: 'hidden',
                          cursor: 'crosshair', background: '#222' }}>
              <ImageWithFallback src={current.url} alt="case" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Heatmap during test */}
              <AnimatePresence>
                {showHeat && phase === 'test' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} exit={{ opacity: 0 }}
                              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen',
                                       background: current.evidence.map(ev =>
                                         `radial-gradient(circle at ${ev.x}% ${ev.y}%, rgba(255,40,40,0.85) 0%, rgba(255,180,0,0.45) 16%, transparent 30%)`
                                       ).join(', ') }} />
                )}
              </AnimatePresence>
              {stickies.map(n => (
                <Pin key={`p-${n.id}`} color={n.kind === 'player' ? RED : NAVY}
                     style={{ left: `${n.imgX}%`, top: `${n.imgY}%`, transform: 'translate(-50%, -50%)' }} />
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: 18, fontFamily: FONT_HAND, fontSize: 14, color: '#3a2a18', fontWeight: 700 }}>
              {phase === 'train' ? `TRAINING SAMPLE #${idx + 1}` : `TEST PHOTO #${idx + 1}`}
            </div>
            <div style={{ position: 'absolute', bottom: 12, right: 18, fontFamily: FONT, fontSize: 11, color: '#5a3e20', letterSpacing: '0.2em' }}>
              {phase === 'train' && playerGuess ? `LABEL: ${playerGuess.toUpperCase()}` : ''}
              {phase === 'test' && petAnswered && current.petGuess ? `PRED: ${current.petGuess.klass.toUpperCase()}` : ''}
            </div>
          </motion.div>
        </div>
      )}

      {/* Sticky notes flanking the photo */}
      {(phase === 'train' || phase === 'test') && (
        <>
          <div style={{ position: 'absolute', left: 200, top: 110, width: 210, zIndex: 10,
                        display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AnimatePresence>
              {stickies.filter(s => s.side === 'L').map((n, i) => (
                <StickyNote key={n.id} note={n} index={i} refCb={el => { stickyRefs.current[n.id] = el; }} />
              ))}
            </AnimatePresence>
          </div>
          <div style={{ position: 'absolute', right: 200, top: 110, width: 210, zIndex: 10,
                        display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
            <AnimatePresence>
              {stickies.filter(s => s.side === 'R').map((n, i) => (
                <StickyNote key={n.id} note={n} index={i} refCb={el => { stickyRefs.current[n.id] = el; }} />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* ============== TRAINING CONTROLS ============== */}
      {phase === 'train' && current && (
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 22,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'rgba(20,15,10,0.92)', border: '1px solid #5a3e20',
                        padding: '8px 18px', color: POLA, fontSize: 13, fontWeight: 900, letterSpacing: '0.2em' }}>
            {!playerGuess ? 'WHERE WAS THIS TAKEN?' : `MARK ${current.evidence.length} EVIDENCE POINTS · ${markedIds.length}/${current.evidence.length}`}
          </div>
          {!playerGuess ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {CLASSES.map(k => (
                <motion.button key={k} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                               onClick={() => submitGuess(k)}
                               style={countryBtn}>{k}</motion.button>
              ))}
            </div>
          ) : (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                           disabled={markedIds.length < current.evidence.length}
                           onClick={nextTrain}
                           style={{ ...nextBtn, opacity: markedIds.length < current.evidence.length ? 0.5 : 1,
                                    cursor: markedIds.length < current.evidence.length ? 'not-allowed' : 'pointer' }}>
              {idx + 1 < trainTotal ? 'NEXT TRAINING ▶' : 'START TESTING ▶'}
            </motion.button>
          )}
        </div>
      )}

      {/* ============== TEST CONTROLS ============== */}
      {phase === 'test' && petAnswered && (
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 22,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: POLA, border: `4px double ${current.petGuess?.klass === current.truth ? '#2a5a2a' : RED}`,
                               padding: '10px 22px', boxShadow: '0 8px 20px rgba(0,0,0,0.55)',
                               transform: 'rotate(-2deg)' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.4em', color: '#7a3a2a', fontWeight: 900 }}>PET PREDICTION</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#2a1a08', letterSpacing: '0.15em' }}>
              {current.petGuess?.klass.toUpperCase()} · {((current.petGuess?.conf ?? 0) * 100).toFixed(0)}% · {current.petGuess?.klass === current.truth ? '✓' : '✗'}
            </div>
          </motion.div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                         onClick={nextTest} style={nextBtn}>
            {idx + 1 < testTotal ? 'NEXT TEST ▶' : 'CLOSE CASE ▶'}
          </motion.button>
        </div>
      )}

      {/* ============== PET NOTEPAD (right) ============== */}
      <Notepad pad={pad} phase={phase} />

      {/* ============== DONE ============== */}
      <AnimatePresence>
        {phase === 'done' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="absolute inset-0 z-40 flex items-center justify-center"
                      style={{ background: 'rgba(10,7,5,0.85)' }}>
            <div style={{ background: POLA, padding: '32px 48px', border: `4px double ${RED}`, transform: 'rotate(-1deg)' }}>
              <div style={{ fontSize: 12, color: RED, letterSpacing: '0.4em', fontWeight: 900 }}>FINAL REPORT</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#2a1a08', letterSpacing: '0.15em', marginTop: 6 }}>
                CASE CLOSED
              </div>
              <button onClick={() => nav('/hub')}
                      style={{ marginTop: 16, background: '#2a1a08', color: POLA, border: 'none',
                               padding: '10px 24px', fontFamily: FONT, fontWeight: 900,
                               letterSpacing: '0.2em', cursor: 'pointer' }}>RETURN TO HUB</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============== PET (anchored bottom-left) ============== */}
      <div style={{ position: 'absolute', bottom: 18, left: 18, zIndex: 35,
                    display: 'flex', alignItems: 'flex-end', gap: 14, maxWidth: 400 }}>
        {activePokemon && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Tape style={{ top: -8, left: '50%', transform: 'translateX(-50%) rotate(-4deg)', width: 70 }} />
            <div style={{ background: POLA, padding: '8px 8px 18px 8px',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.7)', transform: 'rotate(-3deg)' }}>
              <img src={getSpriteUrl(activePokemon.id)}
                   style={{ width: 92, height: 92, imageRendering: 'pixelated', display: 'block' }} />
              <div style={{ fontFamily: FONT_HAND, fontSize: 11, color: '#2a1a08', textAlign: 'center', marginTop: 2, fontWeight: 700 }}>
                DET. {activePokemon.name?.toUpperCase?.() || 'PARTNER'}
              </div>
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          {petMsg && (
            <motion.div key={petMsg} initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5 }}
                        style={{ background: POLA, padding: '10px 14px', borderRadius: 10,
                                 borderBottomLeftRadius: 2, maxWidth: 260, marginBottom: 30,
                                 boxShadow: '0 6px 18px rgba(0,0,0,0.55)', position: 'relative',
                                 border: '1px solid #c8b696' }}>
              <p style={{ margin: 0, fontFamily: FONT_HAND, fontSize: 13, lineHeight: 1.35, color: '#2a1a08', fontWeight: 700 }}>
                {petMsg}
              </p>
              <div style={{ position: 'absolute', bottom: 8, left: -8, width: 0, height: 0,
                            borderTop: '8px solid transparent', borderBottom: '8px solid transparent',
                            borderRight: `10px solid ${POLA}` }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ================== sub-components ==================

function Notepad({ pad, phase }: { pad: PadEntry[]; phase: Phase }) {
  return (
    <div style={{ position: 'absolute', right: 24, top: 110, width: 200, zIndex: 8,
                  transform: 'rotate(2deg)' }}>
      <Tape style={{ top: -8, left: '50%', transform: 'translateX(-50%) rotate(3deg)', width: 60 }} />
      <div style={{ background: PAPER, padding: 12, paddingTop: 18, minHeight: 280, maxHeight: 380, overflow: 'hidden',
                    backgroundImage: 'repeating-linear-gradient(180deg, transparent 0, transparent 19px, rgba(40,80,150,0.18) 19px, rgba(40,80,150,0.18) 20px)',
                    borderLeft: `3px solid ${RED}80`,
                    boxShadow: '0 8px 22px rgba(0,0,0,0.55)' }}>
        <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: '0.3em', color: '#7a3a2a', fontWeight: 900, marginBottom: 6 }}>
          PET NOTEPAD
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <AnimatePresence>
            {pad.slice(-10).map(e => (
              <motion.div key={e.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <p style={{ margin: 0, fontFamily: FONT_HAND, fontSize: 11.5, color: '#1a3060', lineHeight: 1.4, fontWeight: 700 }}>
                  • {e.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {pad.length === 0 && (
            <p style={{ margin: 0, fontFamily: FONT_HAND, fontSize: 11, color: '#7a6a55', fontStyle: 'italic' }}>
              (notes will appear as Boss marks evidence...)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StickyNote({ note, refCb, index }: { note: StickyData; refCb: (el: HTMLDivElement | null) => void; index: number }) {
  const isPlayer = note.kind === 'player';
  const bg = isPlayer ? STICKY_Y : STICKY_B;
  const rot = (index % 2 === 0 ? -1 : 1) * (2 + (index % 3));
  return (
    <motion.div ref={refCb}
                initial={{ opacity: 0, y: -16, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: rot }}
                exit={{ opacity: 0 }}
                style={{ background: bg, padding: '12px 14px 14px', width: 190,
                         boxShadow: '3px 5px 14px rgba(0,0,0,0.45)', position: 'relative',
                         clipPath: 'polygon(0 0, 100% 0, 100% 92%, 96% 100%, 0 100%)' }}>
      <Pin color={isPlayer ? RED : NAVY} style={{ top: 4, left: '50%', transform: 'translateX(-50%)' }} />
      <div style={{ fontSize: 9, letterSpacing: '0.25em', color: isPlayer ? '#7a3a2a' : '#1a3a5c',
                    fontWeight: 900, marginTop: 8, marginBottom: 4 }}>
        {isPlayer ? 'BOSS NOTE' : 'PET ANALYSIS'}
      </div>
      <p style={{ margin: 0, fontFamily: FONT_HAND, fontSize: 12.5, color: '#2a1a08', lineHeight: 1.35, fontWeight: 700 }}>
        {note.text}
      </p>
    </motion.div>
  );
}

function Pin({ color, style }: { color: string; style?: React.CSSProperties }) {
  return <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', zIndex: 12,
                       background: `radial-gradient(circle at 32% 28%, #fff 0%, ${color} 38%, rgba(0,0,0,0.55) 100%)`,
                       boxShadow: '0 2px 4px rgba(0,0,0,0.55), inset 0 -1px 1px rgba(0,0,0,0.3)', ...style }} />;
}

function Tape({ style }: { style?: React.CSSProperties }) {
  return <div style={{ position: 'absolute', height: 18, width: 60,
                       background: 'rgba(255,250,210,0.5)',
                       border: '1px solid rgba(180,160,90,0.3)',
                       boxShadow: '0 2px 4px rgba(0,0,0,0.3)', zIndex: 11, ...style }} />;
}

function CornerProp({ src, style, caption }: { src: string; style: React.CSSProperties; caption: string }) {
  return (
    <div style={{ position: 'absolute', zIndex: 4, ...style }}>
      <Pin color="#8a8a8a" style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }} />
      <div style={{ background: POLA, padding: 5, paddingBottom: 16, boxShadow: '0 6px 14px rgba(0,0,0,0.6)', height: '100%' }}>
        <ImageWithFallback src={src} alt={caption}
                           style={{ width: '100%', height: 'calc(100% - 21px)', objectFit: 'cover', display: 'block',
                                    filter: 'sepia(0.4) contrast(1.05) brightness(0.9)' }} />
        <div style={{ position: 'absolute', bottom: 2, left: 8, fontFamily: FONT_HAND, fontSize: 10, color: '#2a1a08', fontWeight: 700 }}>
          {caption}
        </div>
      </div>
    </div>
  );
}

function ManilaFolder({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', width: 180, height: 220, zIndex: 3, ...style }}>
      <div style={{ position: 'absolute', top: -14, left: 14, width: 70, height: 18,
                    background: '#D8B97A', borderRadius: '3px 3px 0 0',
                    border: '1px solid #A88A4A', borderBottom: 'none' }} />
      <div style={{ width: '100%', height: '100%', background: '#D8B97A',
                    border: '1px solid #A88A4A', borderRadius: '2px 8px 6px 4px',
                    boxShadow: '4px 6px 16px rgba(0,0,0,0.55)',
                    backgroundImage: 'repeating-linear-gradient(180deg, transparent 0, transparent 22px, rgba(168,138,74,0.18) 22px, rgba(168,138,74,0.18) 23px)',
                    transform: 'rotate(5deg)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px dashed rgba(80,50,20,0.3)' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', color: '#7a4a1a' }}>CONFIDENTIAL</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#3a2008', letterSpacing: '0.1em', marginTop: 2 }}>CASE FILES</div>
        </div>
        <div style={{ padding: '10px 16px', fontFamily: FONT_HAND, fontSize: 11, color: '#3a2008', lineHeight: 1.6 }}>
          ▸ Senegal: lat. soil<br />▸ France: vines<br />▸ Japan: cedar<br />▸ Brazil: tile roofs
        </div>
      </div>
    </div>
  );
}

function Newspaper({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', width: 200, height: 130, zIndex: 3, transform: 'rotate(-5deg)', ...style }}>
      <div style={{ width: '100%', height: '100%', background: '#e9e3d0',
                    boxShadow: '4px 6px 14px rgba(0,0,0,0.55)', padding: 8,
                    border: '1px solid #b4a685' }}>
        <div style={{ fontFamily: '"Times New Roman", serif', fontSize: 14, fontWeight: 900,
                      borderBottom: '2px solid #2a1a08', paddingBottom: 3, marginBottom: 4, color: '#2a1a08' }}>
          THE DAILY LEDGER
        </div>
        <div style={{ fontFamily: '"Times New Roman", serif', fontSize: 9, color: '#3a2a18', lineHeight: 1.3 }}>
          <strong>MYSTERY PHOTO STUMPS LOCALS</strong><br />
          Authorities are seeking a sharp-eyed detective to assist in identifying a series of unmarked photographs...
        </div>
        <div style={{ marginTop: 4, height: 30, background: 'repeating-linear-gradient(90deg, #b4a685 0, #b4a685 2px, transparent 2px, transparent 5px)', opacity: 0.4 }} />
      </div>
    </div>
  );
}

function MagnifyingGlass({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', width: 90, height: 130, zIndex: 4, transform: 'rotate(35deg)', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 70, height: 70, borderRadius: '50%',
                    border: '5px solid #2a1a08', background: 'rgba(220,230,240,0.18)',
                    boxShadow: 'inset 0 0 12px rgba(255,255,255,0.25), 0 4px 10px rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'absolute', top: 60, left: 60, width: 8, height: 60,
                    background: 'linear-gradient(180deg, #2a1a08, #4a2e1a)', borderRadius: 3,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.6)' }} />
    </div>
  );
}

function CoffeeStain({ style, small }: { style?: React.CSSProperties; small?: boolean }) {
  const s = small ? 50 : 75;
  return (
    <div style={{ position: 'absolute', width: s, height: s, zIndex: 2, opacity: 0.55, pointerEvents: 'none', ...style }}>
      <div style={{ width: '100%', height: '100%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(80,40,15,0.0) 50%, rgba(80,40,15,0.55) 55%, rgba(80,40,15,0.2) 70%, transparent 80%)',
                    transform: 'scaleY(0.9)' }} />
    </div>
  );
}

function Paperclip({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="34" height="60" viewBox="0 0 34 60" style={{ position: 'absolute', zIndex: 5, ...style }}>
      <path d="M10 5 L10 45 Q10 55 17 55 Q24 55 24 45 L24 12 Q24 6 19 6 Q14 6 14 12 L14 42"
            fill="none" stroke="#b0b0b8" strokeWidth="2.5" strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }} />
    </svg>
  );
}

function Stamp({ style, text, tone }: { style?: React.CSSProperties; text: string; tone?: 'red' | 'navy' }) {
  const c = tone === 'navy' ? NAVY : RED;
  return (
    <div style={{ position: 'absolute', zIndex: 6, padding: '4px 12px', border: `3px double ${c}`,
                  fontFamily: FONT, fontWeight: 900, fontSize: 14, letterSpacing: '0.25em',
                  color: c, opacity: 0.78, transform: 'rotate(-8deg)', textShadow: '0 0 1px rgba(0,0,0,0.2)',
                  background: 'rgba(245,237,224,0.05)', ...style }}>
      {text}
    </div>
  );
}

function Pencil({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', width: 110, height: 12, zIndex: 4,
                  filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.55))', ...style }}>
      <div style={{ width: 12, height: '100%', background: '#E8C8A0', float: 'left', borderRadius: '50% 0 0 50%' }} />
      <div style={{ width: 8, height: '100%', background: '#444', float: 'left' }} />
      <div style={{ width: 70, height: '100%', background: 'linear-gradient(180deg, #E8B43A, #C68F1F)', float: 'left',
                    borderRight: '1px solid #8a5e10' }} />
      <div style={{ width: 12, height: '100%', background: '#D49060', float: 'left',
                    clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
      <div style={{ width: 6, height: '100%', background: '#222', float: 'left',
                    clipPath: 'polygon(0 50%, 100% 30%, 100% 70%)' }} />
    </div>
  );
}

function Postcard({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', width: 150, height: 100, zIndex: 3,
                  background: '#f0e3c8', boxShadow: '4px 5px 12px rgba(0,0,0,0.55)',
                  border: '1px solid #b4a685', padding: 6, ...style }}>
      <div style={{ fontFamily: '"Times New Roman", serif', fontSize: 10, fontWeight: 900,
                    color: '#7a3a2a', letterSpacing: '0.2em', borderBottom: '1px dashed #b4a685', paddingBottom: 2 }}>
        GREETINGS FROM
      </div>
      <div style={{ fontFamily: FONT_HAND, fontSize: 11, color: '#3a2a18', marginTop: 4, lineHeight: 1.3 }}>
        Boss —<br />The trail is hot. The light is golden. Bring the dog.<br />— D.
      </div>
      <div style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 32,
                    background: 'repeating-linear-gradient(45deg, #B23A2E 0, #B23A2E 3px, #f0e3c8 3px, #f0e3c8 6px)',
                    border: '1px solid #7a3a2a' }} />
    </div>
  );
}

function InkBottle({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', width: 50, height: 60, zIndex: 4,
                  filter: 'drop-shadow(3px 4px 5px rgba(0,0,0,0.6))', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 14, width: 22, height: 14, background: '#2a1a08',
                    borderRadius: '2px 2px 0 0' }} />
      <div style={{ position: 'absolute', top: 12, left: 4, width: 42, height: 48,
                    background: 'linear-gradient(180deg, #1a1410 0%, #0a0608 100%)',
                    borderRadius: '4px 4px 6px 6px',
                    border: '1px solid #000',
                    boxShadow: 'inset 0 6px 10px rgba(255,255,255,0.08)' }}>
        <div style={{ position: 'absolute', bottom: 6, left: 4, fontFamily: FONT, fontSize: 6, color: '#a08a6a', letterSpacing: '0.1em' }}>
          INK
        </div>
      </div>
    </div>
  );
}

function Matchbook({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', width: 55, height: 70, zIndex: 4,
                  background: '#7a2a20', border: '1px solid #4a1a14',
                  boxShadow: '3px 4px 8px rgba(0,0,0,0.55)',
                  padding: 5, ...style }}>
      <div style={{ fontFamily: FONT, fontSize: 7, color: '#f5ede0', fontWeight: 900, letterSpacing: '0.2em', textAlign: 'center' }}>
        THE<br />FOX &<br />ROOK
      </div>
      <div style={{ position: 'absolute', bottom: 4, left: 5, right: 5, height: 10,
                    background: 'repeating-linear-gradient(90deg, #f5ede0 0, #f5ede0 2px, #7a2a20 2px, #7a2a20 4px)' }} />
    </div>
  );
}

// ================== styles ==================

const corkboardBg: React.CSSProperties = {
  background: `radial-gradient(ellipse at 50% 40%, #8B6A3F 0%, #5C4225 60%, #2E1F10 100%), #6B4F2A`,
  backgroundBlendMode: 'multiply',
};

const corkSpeckle: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.55,
  backgroundImage:
    `radial-gradient(rgba(60,35,15,0.55) 1px, transparent 1.2px),
     radial-gradient(rgba(255,220,170,0.18) 1px, transparent 1px),
     radial-gradient(rgba(40,22,10,0.7) 0.6px, transparent 0.8px)`,
  backgroundSize: '7px 7px, 11px 11px, 4px 4px',
  backgroundPosition: '0 0, 3px 5px, 1px 2px',
  mixBlendMode: 'overlay',
};

const vignette: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
  background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)'
};

const headerCard: React.CSSProperties = {
  background: '#1a1410', border: '1px solid #5a3e20', padding: '8px 16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.55)', borderRadius: 2
};

const countryBtn: React.CSSProperties = {
  background: '#2a1a08', color: POLA, border: '2px solid #5a3e20',
  padding: '10px 22px', fontFamily: FONT, fontWeight: 900, fontSize: 14,
  letterSpacing: '0.2em', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
};

const nextBtn: React.CSSProperties = {
  background: '#2a5a2a', color: POLA, border: '2px solid #1a1410',
  padding: '10px 26px', fontFamily: FONT, fontWeight: 900, fontSize: 14,
  letterSpacing: '0.2em', cursor: 'pointer', boxShadow: '0 6px 14px rgba(0,0,0,0.5)'
};

export default EvidenceMode;
