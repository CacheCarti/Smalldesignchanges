import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { BATTLE_IMAGES, TEST_REVEAL_IMAGES } from '../data/gameImages';
import { getSpriteUrl, ARCHITECTURE_COLORS } from '../data/pokemon';
import { ActivePetGuide } from '../components/ActivePetGuide';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const BG_DARK   = '#141414';
const BG_MID    = '#1F1A17';
const CORK      = BG_MID;
const POLA      = '#f5ede0';
const STICKY_Y  = '#F9E97E';
const STICKY_R  = '#FFCDD2';
const STICKY_B  = '#BBDEFB';
const STICKY_G  = '#C8E6C9';
const MANILLA   = '#D5BCA4';
const MANILLA_DK= '#C4AB93';
const FONT      = "'Courier New', monospace";
const FONT_MARKER = "'Comic Sans MS', 'Chalkboard SE', sans-serif";
const RED_STR   = '#C62828';
const RED       = '#C62828';

const ROUND_TIME   = 120;
const NUM_IMAGES   = 2; // Shortened for demo

type Phase = 'intro' | 'playing' | 'dispatch' | 'test_intro' | 'test' | 'done';
type Mode  = 'probe' | 'lasso' | 'scan';

interface Annotation {
  mode: Mode; x: number; y: number; w?: number; h?: number;
  qIdx: 0|1|2; correct?: boolean;
}

const Q_COLORS  = [STICKY_R, STICKY_B, STICKY_G];
const Q_TOOLS: Mode[] = ['probe', 'lasso', 'scan'];
const Q_TOOL_LABELS = ['📍 PROBE', '✏️ LASSO', '🔍 SCAN'];

const COUNTRIES = ['France', 'Japan', 'Brazil', 'Senegal'];
const MOCK_OPPONENTS = [
  { name: 'NeuroDetective_X', color: '#b879ff', progress: 42, acc: 72 },
  { name: 'DragonMaster99',   color: '#22d3ee', progress: 28, acc: 65 },
  { name: 'AgentGhost',       color: '#a3a3a3', progress: 84, acc: 88 },
];

export function EvidenceMode() {
  const nav = useNavigate();
  const { activePokemon } = useGame();

  const [phase, setPhase] = useState<Phase>('intro');
  const [imageIdx, setImageIdx] = useState(0);
  const [qIdx, setQIdx] = useState<0|1|2>(0);
  const [time, setTime] = useState(ROUND_TIME);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [opponents, setOpponents] = useState(MOCK_OPPONENTS);
  
  const [testStage, setTestStage] = useState<'intro' | 'fight' | 'winner' | 'annotate'>('intro');
  
  const [sweepDrag, setSweepDrag] = useState<{ x:number; y:number; w:number; h:number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [lastClickPos, setLastClickPos] = useState<{ x:number; y:number } | null>(null);
  const [lastAnnotationTime, setLastAnnotationTime] = useState<number>(0);
  const [notes, setNotes] = useState<string[]>([]);
  const [pokemonFaded, setPokemonFaded] = useState(false);

  const image = BATTLE_IMAGES[imageIdx % BATTLE_IMAGES.length];
  const activeTool: Mode = Q_TOOLS[qIdx];
  const reveal = TEST_REVEAL_IMAGES[imageIdx % TEST_REVEAL_IMAGES.length];

  useEffect(() => {
    if (!activePokemon) { nav('/loadout?target=evidence'); return; }
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
      setOpponents(prev => prev.map(o => ({ ...o, progress: Math.min(100, o.progress + Math.random() * 1.5) })));
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'dispatch') return;
    const t = setTimeout(() => setPhase('test_intro'), 3200);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'test_intro') {
      const t = setTimeout(() => {
        setPhase('test');
        setTestStage('fight');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'test') {
      if (testStage === 'fight') {
        const t = setTimeout(() => setTestStage('winner'), 1800);
        return () => clearTimeout(t);
      } else if (testStage === 'winner') {
        const t = setTimeout(() => setTestStage('annotate'), 1200);
        return () => clearTimeout(t);
      }
    }
  }, [phase, testStage]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (phase !== 'playing' || !selectedCountry) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const correct = Math.random() > 0.5;

    if (activeTool === 'probe' || activeTool === 'scan') {
      setAnnotations(prev => [...prev, { mode: activeTool, x, y, qIdx, correct }]);
      setLastAnnotationTime(Date.now());
      setLastClickPos({ x, y });
      setPokemonFaded(true);
      setTimeout(() => setPokemonFaded(false), 1000);
      
      const flavorTexts = [
        `Sniffing around... definitely ${selectedCountry} markings.`,
        `This vegetation index matches the ${selectedCountry} file.`,
        `Logging coordinates. Strong probability of ${selectedCountry}.`,
        `Paws-on investigation suggests ${selectedCountry} architecture.`
      ];
      addNote(flavorTexts[Math.floor(Math.random() * flavorTexts.length)]);
    }
  };

  const handleSweepStart = (e: React.MouseEvent) => {
    if (phase !== 'playing' || activeTool !== 'lasso' || !selectedCountry) return;
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
      setAnnotations(prev => [...prev, { mode: 'lasso', ...sweepDrag, qIdx, correct: true }]);
      setLastAnnotationTime(Date.now());
      setLastClickPos({ x: sweepDrag.x + sweepDrag.w / 2, y: sweepDrag.y + sweepDrag.h / 2 });
      addNote(`Captured region anomaly for ${selectedCountry} verification.`);
    }
    setSweepDrag(null);
  };

  const addNote = (text: string) => {
    setNotes(prev => [...prev, text].slice(-8));
  };

  const nextImage = () => {
    if (imageIdx >= NUM_IMAGES - 1) { setPhase('dispatch'); return; }
    setImageIdx(imageIdx + 1);
    setQIdx(0);
    setAnnotations([]);
    setNotes([]);
    setSelectedCountry(null);
  };

  const arch = activePokemon ? ARCHITECTURE_COLORS[activePokemon.architecture] : ARCHITECTURE_COLORS.CNN;

  // Render Phase 2 (Test Arena)
  if (phase === 'test' || phase === 'test_intro') {
    const isWinnerStage = testStage === 'winner' || testStage === 'annotate';
    return (
      <div style={{ minHeight: '100vh', padding: '0', background: `radial-gradient(circle at 18% 22%, rgba(0,0,0,0.1) 1.5px, transparent 2px), radial-gradient(circle at 72% 38%, rgba(0,0,0,0.15) 1px, transparent 1.5px), linear-gradient(135deg, ${CORK} 0%, #1A1A1A 100%)`, fontFamily: FONT }}>
        <AnimatePresence>
          {phase === 'test_intro' && (
            <motion.div initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }} transition={{ duration: 0.6 }}
              style={{ position:'fixed', inset:0, zIndex:100, background: MANILLA, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
              <div style={{ fontSize:28, fontWeight:900, color:'#2a1a0a', letterSpacing:'0.1em' }}>TESTING ARENA</div>
              <div style={{ fontSize:12, color:'rgba(80,40,10,0.6)', letterSpacing:'0.2em' }}>COMPILING DETECTIVE RATIONALE...</div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'test' && (
          <div style={{ padding:'20px 24px 40px' }}>
            <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
              style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, background:POLA, padding:'12px 24px', borderRadius:2, transform:'rotate(-0.5deg)', boxShadow:'3px 5px 16px rgba(0,0,0,0.5)', position:'relative' }}>
              <RealisticPin color={RED} style={{ position:'absolute', top:8, left:10 }} />
              <div style={{ marginLeft:16 }}>
                <div style={{ fontSize:11, color:RED, letterSpacing:'0.18em', fontWeight:900 }}>EVIDENCE MODE — CLASSIFICATION</div>
                <div style={{ fontSize:32, fontWeight:900, color:'#1a1a1a', letterSpacing:'-0.02em' }}>
                  {isWinnerStage ? (selectedCountry ? `${selectedCountry.toUpperCase()} CONFIRMED` : 'SECTOR IDENTIFIED') : 'ANALYZING...'}
                </div>
              </div>
              {testStage === 'annotate' && (
                <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={() => nav('/hub')}
                  style={{ background: '#1a1a1a', color:'#f5ede0', border:'none', padding:'8px 24px', borderRadius:3, fontSize:14, fontWeight:900, letterSpacing:'0.1em', cursor:'pointer', fontFamily:FONT, boxShadow:'0 4px 12px rgba(0,0,0,0.4)' }}>
                  RETURN TO HUB →
                </motion.button>
              )}
            </motion.div>

            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {/* EXHIBIT */}
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
                  style={{ background:'#1a1a1a', border:`6px solid #2a1a08`, borderRadius:4, overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.6)', position:'relative' }}>
                  <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:RED, color:'#fff', padding:'3px 14px', fontSize:10, fontWeight:900, letterSpacing:'0.18em', zIndex:2 }}>
                    ATTENTION MAP
                  </div>
                  <div style={{ position:'relative', overflow:'hidden' }}>
                    <img src={reveal.url} style={{ width:'100%', height:300, objectFit:'cover', display:'block', filter: testStage === 'fight' ? 'brightness(0.6)' : 'brightness(1)', transition:'filter 0.8s' }} />
                    
                    {/* The Fight Animation */}
                    <AnimatePresence>
                      {(testStage === 'fight') && (
                        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 20px' }}>
                          <motion.div animate={{ x:[0, 20, -8, 12, 0], rotate:[-2, 4, -3, 2, 0] }} transition={{ duration:1.5, repeat:1 }}>
                            {activePokemon && <img src={getSpriteUrl(activePokemon.id)} style={{ width:100, height:100, filter:'drop-shadow(0 0 20px rgba(255,255,255,0.4))', imageRendering:'pixelated' }} />}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* The Stamp Slam */}
                    {isWinnerStage && (
                      <motion.div initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', border: '8px solid #D32F2F', color: '#D32F2F', padding: '12px 32px', fontSize: 38, fontWeight: 900, letterSpacing: '0.15em', textShadow: '0 0 6px rgba(211,47,47,0.5)', boxShadow: '0 0 15px rgba(211,47,47,0.3)', background: 'rgba(255,255,255,0.9)', zIndex: 10, pointerEvents: 'none' }}>
                        {selectedCountry ? `CONFIRMED: ${selectedCountry.toUpperCase()}` : 'CONFIRMED'}
                      </motion.div>
                    )}

                    {/* The Heatmap and Markers */}
                    <AnimatePresence>
                      {(testStage === 'annotate') && (
                        <>
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.65 }} style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 60% 40%, rgba(255,0,0,0.8) 0%, rgba(255,255,0,0.5) 40%, transparent 80%)', mixBlendMode: 'multiply' }} />
                          {reveal.probeTargets.map((pt, i) => (
                            <motion.div key={i} initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay: i * 0.15, type:'spring' }}
                              style={{ position:'absolute', left:`${pt.x}%`, top:`${pt.y}%`, transform:'translate(-50%,-50%)', width:20, height:20, borderRadius:'50%', border:'2.5px solid #E53935', boxShadow:'0 0 8px rgba(229,57,53,0.8)' }}>
                              <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', fontSize:7, color:'#fff', fontWeight:900, whiteSpace:'nowrap', background:'rgba(0,0,0,0.7)', padding:'1px 4px', borderRadius:2 }}>{pt.label}</div>
                            </motion.div>
                          ))}
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              {/* RATIONALE PAPER */}
              {testStage === 'annotate' && (
                <motion.div initial={{ opacity:0, x:50, rotate: 10 }} animate={{ opacity:1, x:0, rotate: 2 }} transition={{ type:'spring', damping:15, delay:0.4 }}
                  style={{ background: '#f5ede0', border:`1px solid #d4c4b4`, padding:'20px', boxShadow:'4px 8px 24px rgba(0,0,0,0.5)', position:'relative', display:'flex', flexDirection:'column' }}>
                  <RealisticPin color="#1565C0" style={{ top:10, right:10 }} />
                  <div style={{ fontSize:18, fontWeight:900, color:'#2a1a0a', letterSpacing:'0.15em', borderBottom:`2px solid #333`, paddingBottom:8, marginBottom:16 }}>
                    CLASSIFICATION RATIONALE
                  </div>
                  
                  {/* Probabilities */}
                  <div style={{ marginBottom: 20, display:'flex', flexDirection:'column', gap:6 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#555' }}>PREDICTIONS</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:70, fontSize:12, fontWeight:'bold' }}>{selectedCountry || 'France'}</div>
                      <div style={{ flex:1, height:10, background:'#ddd', borderRadius:5, overflow:'hidden' }}>
                        <motion.div initial={{ width:0 }} animate={{ width:'88%' }} style={{ height:'100%', background:'#2E7D32' }} />
                      </div>
                      <div style={{ fontSize:12, fontWeight:'bold' }}>88%</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:70, fontSize:12, fontWeight:'bold' }}>Other</div>
                      <div style={{ flex:1, height:10, background:'#ddd', borderRadius:5, overflow:'hidden' }}>
                        <motion.div initial={{ width:0 }} animate={{ width:'12%' }} style={{ height:'100%', background:'#E53935' }} />
                      </div>
                      <div style={{ fontSize:12, fontWeight:'bold' }}>12%</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 900, color: '#555', marginBottom: 6 }}>PET NOTES</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1, fontFamily: FONT_MARKER }}>
                    {notes.map((n, i) => (
                      <div key={i} style={{ fontSize:13, color:'#1E3A8A', lineHeight:1.4 }}>
                        - {n}
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <div style={{ fontSize:13, color:'#666', fontStyle:'italic' }}>No notes taken during evidence phase...</div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Phase 1 (Evidence Collection)
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: `linear-gradient(135deg, ${BG_DARK} 0%, ${BG_MID} 50%, ${BG_DARK} 100%)`, fontFamily: FONT }}>
      <AnimatePresence>
        {phase === 'intro' && <IntroOverlay pokemon={activePokemon} />}
        {phase === 'dispatch' && <DispatchOverlay pokemon={activePokemon} annotations={annotations} />}
        {phase === 'done' && <DoneOverlay />}
      </AnimatePresence>

      <div className="flex items-center justify-between px-4 py-1.5 z-10 shrink-0" style={{ background: 'rgba(15,8,3,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 3px 10px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3">
          {activePokemon && (
            <motion.div animate={{ opacity: pokemonFaded ? 0.2 : 1, scale: pokemonFaded ? 0.9 : 1 }} transition={{ duration: 0.3 }}
              className="flex items-center gap-2 px-2.5 py-1 rounded shadow-md" style={{ background: POLA, transform:'rotate(-1deg)' }}>
              <img src={getSpriteUrl(activePokemon.id)} className="w-8 h-8 object-contain" style={{ imageRendering:'pixelated' }} />
              <div>
                <div className="text-xs font-black text-gray-900 tracking-tight leading-none">{activePokemon.name}</div>
                <div className="text-[9px] font-bold text-gray-500 leading-none mt-0.5">{arch.label}</div>
              </div>
            </motion.div>
          )}
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

      <div className="flex-1 flex flex-row relative min-h-0 overflow-hidden" style={{ gap:6, padding:'20px 24px 100px 24px', background: '#D4C09B', boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6)', backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.05) 100%)' }}>
        {/* Background folder texture */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.04 }}>
          <filter id="folder-noise"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" stitchTiles="stitch" result="n" /><feColorMatrix type="saturate" values="0" /></filter>
          <rect width="100%" height="100%" filter="url(#folder-noise)" />
        </svg>
        <div style={{ position: 'absolute', top: 0, left: '50%', bottom: 0, width: 40, background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.12) 60%, transparent)', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 0 }} />
        
        {/* Red String Board Props (Background) */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          {/* Dispersed Notes */}
          <div style={{ position: 'absolute', top: '5%', left: '25%', width: 110, height: 100, background: '#F9E97E', transform: 'rotate(-10deg)', boxShadow: '2px 4px 12px rgba(0,0,0,0.3)', padding: 10, fontSize: 8, color: '#5a3e20' }}>
            <div style={{ borderBottom: '1px solid rgba(0,0,0,0.15)', paddingBottom: 4, marginBottom: 4, fontWeight: 900 }}>OBSERVATION</div>
            Target pattern shows recurring loops. Look closely at the edges!
          </div>
          
          {/* Polaroid with thumbprint */}
          <div style={{ position: 'absolute', top: '12%', right: '28%', width: 140, height: 160, background: '#f5ede0', padding: '8px 8px 30px 8px', transform: 'rotate(15deg)', boxShadow: '3px 6px 15px rgba(0,0,0,0.4)' }}>
            <div style={{ width: '100%', height: '100%', background: '#222', overflow: 'hidden', position: 'relative' }}>
              <ImageWithFallback src="https://images.unsplash.com/photo-1600176970141-60a670821dfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="polaroid" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) contrast(1.2)' }} />
              <ImageWithFallback src="https://images.unsplash.com/photo-1611330500121-d9439ddc3d9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="thumbprint" style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, mixBlendMode: 'multiply', opacity: 0.65, transform: 'rotate(-30deg)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, fontWeight: 900, color: '#111', transform: 'rotate(-2deg)' }}>SUSPECT</div>
            <Paperclip angle={10} style={{ top: -10, left: 20 }} />
          </div>

          {/* Generic Polaroid pinned */}
          <div style={{ position: 'absolute', bottom: '35%', left: '20%', width: 110, height: 130, background: '#f5ede0', padding: '6px 6px 24px 6px', transform: 'rotate(-6deg)', boxShadow: '2px 5px 12px rgba(0,0,0,0.4)' }}>
            <RealisticPin color="#F9A825" style={{ top: 4, left: '50%', transform: 'translateX(-50%)' }} />
            <div style={{ width: '100%', height: '100%', background: '#222', overflow: 'hidden' }}>
              <ImageWithFallback src="https://images.unsplash.com/photo-1639617004859-e9713f75af0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="generic location" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.4) contrast(1.2)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 8, color: '#555', fontWeight: 900 }}>SECTOR 7</div>
          </div>

          {/* Red Strings connecting props */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
             <path d="M 350 200 Q 500 250 650 150" fill="none" stroke="#D32F2F" strokeWidth="2.5" strokeDasharray="4 2" style={{ filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.5))' }} />
             <path d="M 350 500 Q 450 450 600 350" fill="none" stroke="#D32F2F" strokeWidth="2.5" strokeDasharray="4 2" style={{ filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.5))' }} />
          </svg>
        </div>

        {/* Left Column - Tools & Rivals */}
        <div style={{ width:140, minWidth:140, display:'flex', flexDirection:'column', gap:10, zIndex: 10 }}>
          {/* Tools Block */}
          <div style={{ background: STICKY_Y, padding:'8px 8px 6px', borderRadius:2, boxShadow:'2px 3px 8px rgba(0,0,0,0.3), inset 0 -1px 4px rgba(0,0,0,0.05)', transform:'rotate(-1.5deg)', position:'relative', flexShrink:0 }}>
            <RealisticPin color="#1565C0" />
            <div style={{ fontSize:8, fontWeight:900, letterSpacing:'0.2em', color:'#2a1a08', textAlign:'center', marginTop:6, borderBottom:'1px dashed rgba(0,0,0,0.15)', paddingBottom:4, marginBottom:6 }}>
              {selectedCountry ? `${selectedCountry.toUpperCase()} TOOLS` : 'SELECT CASE FILE'}
            </div>
            {selectedCountry ? (
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {Q_TOOLS.map((tool, i) => {
                  const isActive = qIdx === i;
                  return (
                    <motion.div key={i} layout onClick={() => setQIdx(i as 0|1|2)} animate={{ scale: isActive ? 1.02 : 1 }}
                      style={{ background: Q_COLORS[i], borderRadius:2, padding: '7px 8px', cursor:'pointer', position:'relative', boxShadow: isActive ? '0 3px 8px rgba(0,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.15)', border: isActive ? '2px solid rgba(0,0,0,0.2)' : '1px solid rgba(0,0,0,0.1)', transform: `rotate(${i%2===0 ? -0.5 : 0.5}deg)` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:8, fontWeight:900, color:'rgba(0,0,0,0.6)' }}>{Q_TOOL_LABELS[i]}</span>
                        {isActive && <span style={{ width:5, height:5, borderRadius:'50%', background:'#C62828', display:'inline-block' }} />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize:9, color:'rgba(0,0,0,0.5)', textAlign:'center', padding:'10px 0', fontWeight:'bold' }}>
                Open a case file below to access evidence tools.
              </div>
            )}
          </div>

          {/* Rival Agencies */}
          <div style={{ background: POLA, borderRadius:2, padding:'7px 8px', boxShadow:'2px 3px 8px rgba(0,0,0,0.3)', transform:'rotate(0.8deg)', position:'relative', flex:1, overflow:'hidden' }}>
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

        {/* Center - Image Canvas */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10" style={{ alignItems:'center', justifyContent: 'center' }}>
          <motion.div className="w-full relative flex flex-col shadow-2xl"
            style={{ background: POLA, padding:'6px 6px 40px 6px', maxWidth: 480, maxHeight: 480, aspectRatio: '1/1', flex:1, transform:`rotate(${imageIdx % 2 === 0 ? '-0.8deg' : '0.8deg'})`, boxShadow:'0 16px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)', borderRadius:2 }}>
            <RealisticPin color="#E53935" style={{ position:'absolute', top:4, left:'50%', transform:'translateX(-50%)' }} />
            <RealisticPin color="#F9A825" style={{ position:'absolute', top:4, left:16 }} />
            <RealisticPin color="#1565C0" style={{ position:'absolute', top:4, right:16 }} />

            <div ref={canvasRef} onClick={handleCanvasClick} onMouseDown={handleSweepStart} onMouseMove={handleSweepMove} onMouseUp={handleSweepEnd}
              style={{ flex:1, width:'100%', position:'relative', background:'#111', overflow:'hidden', cursor: activeTool === 'lasso' ? 'crosshair' : 'cell', boxShadow:'inset 0 0 16px rgba(0,0,0,0.5)', minHeight:0 }}>
              <img src={image.url} style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} />

              {annotations.map((a, i) => {
                const c = a.qIdx === 0 ? '#E53935' : a.qIdx === 1 ? '#1565C0' : '#2E7D32';
                if (a.mode === 'probe' || a.mode === 'scan') {
                  return (
                    <div key={i} style={{ position:'absolute', left:`${a.x}%`, top:`${a.y}%`, transform:'translate(-50%,-50%)', width:24, height:24, borderRadius:'50%', border:`3px solid ${c}`, boxShadow:`0 0 6px ${c}88`, pointerEvents:'none', opacity:0.9 }} />
                  );
                }
                return (
                  <div key={i} style={{ position:'absolute', left:`${a.w && a.w < 0 ? a.x + a.w : a.x}%`, top:`${a.h && a.h < 0 ? a.y + a.h : a.y}%`, width:`${Math.abs(a.w||0)}%`, height:`${Math.abs(a.h||0)}%`, border:`2px dashed ${c}`, background:`${c}18`, pointerEvents:'none', boxShadow:`0 0 8px ${c}44`, borderRadius:2 }} />
                );
              })}

              {sweepDrag && (
                <div style={{ position:'absolute', left:`${sweepDrag.w < 0 ? sweepDrag.x + sweepDrag.w : sweepDrag.x}%`, top:`${sweepDrag.h < 0 ? sweepDrag.y + sweepDrag.h : sweepDrag.y}%`, width:`${Math.abs(sweepDrag.w)}%`, height:`${Math.abs(sweepDrag.h)}%`, border:`2px dashed #1565C0`, background:'rgba(21,101,192,0.15)', pointerEvents:'none', borderRadius:2 }} />
              )}

              {activePokemon && phase === 'playing' && (
                <ActivePetGuide pokemonId={activePokemon.id} pokemonName={activePokemon.name} architecture={activePokemon.architecture} canvasRect={canvasRect} lastClickPos={lastClickPos} onAnnotation={lastAnnotationTime} trustScore={80} />
              )}
            </div>

            {/* Next Button / Bottom Label */}
            <div style={{ position:'absolute', bottom:4, left:10, right:10, display:'flex', justifyContent:'space-between', alignItems:'center', zIndex: 20 }}>
              <div style={{ fontFamily:FONT, fontSize:12, fontWeight:900, color:'#555', letterSpacing:'0.03em' }}>
                Case #{imageIdx+1} — EVIDENCE SCAN
              </div>
              <motion.button whileHover={{ scale:1.08 }} whileTap={{ scale:0.94 }} onClick={nextImage}
                style={{ background: '#1a1a1a', color:'#f5ede0', border:'none', padding:'4px 14px', borderRadius:3, fontSize:11, fontWeight:900, letterSpacing:'0.12em', cursor:'pointer', fontFamily:FONT, boxShadow:'0 2px 6px rgba(0,0,0,0.4)', pointerEvents:'auto' }}>
                NEXT →
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Detective Notes (Yellow Legal Pad) */}
        <div style={{ width:240, minWidth:200, display:'flex', flexDirection:'column', gap:6, zIndex: 10 }}>
          <motion.div 
            style={{ 
              flex:1, background: '#FDF08A', boxShadow: '4px 8px 24px rgba(0,0,0,0.6)', borderRadius: '2px 12px 12px 2px',
              position: 'relative', overflow: 'hidden', transform: 'rotate(1deg)'
            }}
          >
            {/* Legal pad top binding */}
            <div style={{ width: '100%', height: 30, background: '#7F1D1D', borderBottom: '2px solid #450A0A' }} />
            <div style={{ position: 'absolute', top: 0, left: 30, width: 2, height: '100%', background: '#EF4444', opacity: 0.4 }} />
            
            {/* Lines */}
            <div style={{ position: 'absolute', top: 30, left: 0, width: '100%', height: 'calc(100% - 30px)', pointerEvents: 'none', backgroundImage: 'linear-gradient(transparent 95%, rgba(0,0,0,0.1) 95%)', backgroundSize: '100% 24px' }} />
            
            <div style={{ padding: '16px 16px 16px 40px', position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '2px solid #ccc', paddingBottom: 6, marginBottom: 12 }}>
                <h2 style={{ fontFamily: FONT_MARKER, margin: 0, fontSize: 18, color: '#333' }}>
                  Detective's Log
                </h2>
                {activePokemon && (
                  <img src={getSpriteUrl(activePokemon.id)} style={{ width:24, height:24, imageRendering:'pixelated' }} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
                <AnimatePresence>
                  {notes.map((note, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      style={{ fontFamily: FONT_MARKER, fontSize: 13, color: '#1E3A8A', lineHeight: 1.3 }}>
                      - {note}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {notes.length === 0 && (
                  <div style={{ fontFamily: FONT_MARKER, fontSize: 13, color: '#888', fontStyle: 'italic', marginTop: 10 }}>
                    Select a case file below, then use tools to log evidence...
                  </div>
                )}
              </div>
            </div>
            
            <RealisticPin color="#111" style={{ top: 8, left: '50%', transform: 'translateX(-50%)' }} />
          </motion.div>
        </div>
      </div>

      {/* BOTTOM CASE FILES (Smaller and lower to not block the Next button) */}
      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', gap: 12, alignItems: 'flex-end', pointerEvents: 'none' }}>
        {COUNTRIES.map((country) => {
          const isSelected = selectedCountry === country;
          return (
            <motion.div key={country} onClick={() => setSelectedCountry(country)} animate={{ y: isSelected ? -10 : 0 }} whileHover={{ y: isSelected ? -10 : -4 }}
              style={{ width: 100, height: 75, background: isSelected ? MANILLA : MANILLA_DK, borderRadius: '4px 12px 0 0', cursor: 'pointer', border: `1px solid ${MANILLA_DK}`, borderBottom: 'none', boxShadow: isSelected ? '0 -4px 16px rgba(0,0,0,0.5)' : '0 -2px 8px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, position: 'relative', pointerEvents: 'auto', zIndex: isSelected ? 40 : 35 }}>
              <div style={{ position: 'absolute', top: -14, left: 6, background: isSelected ? MANILLA : MANILLA_DK, padding: '2px 10px', borderRadius: '4px 4px 0 0', border: `1px solid ${MANILLA_DK}`, borderBottom: 'none', fontSize: 7, fontWeight: 'bold', color: '#444' }}>
                CASE FILE
              </div>
              <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 900, color: '#1a1a1a', border: '1.5px dashed rgba(0,0,0,0.2)', padding: '4px 8px', transform: 'rotate(-2deg)' }}>
                {country.toUpperCase()}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function RealisticPin({ color, style }: { color: string; style?: React.CSSProperties }) {
  return (
    <div style={{ position:'absolute', width:14, height:14, borderRadius:'50%', zIndex:10, background:`radial-gradient(circle at 35% 30%, #fff 0%, ${color} 35%, rgba(0,0,0,0.5) 100%)`, boxShadow:`0 2px 5px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.15)`, ...style }}>
      <div style={{ position:'absolute', top:'90%', left:'50%', transform:'translateX(-50%)', width:2, height:5, background:'#999' }} />
    </div>
  );
}

function Paperclip({ angle = 0, style }: { angle?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ position:'absolute', width:12, height:38, border:'2.5px solid #d4d4d4', borderRadius:6, borderBottomRightRadius:4, borderBottomLeftRadius:4, zIndex:15, boxShadow:'2px 4px 6px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.8)', transform:`rotate(${angle}deg)`, ...style }} />
  );
}

function IntroOverlay({ pokemon }: { pokemon: any }) {
  return (
    <motion.div initial={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.7 }} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" style={{ fontFamily:FONT, perspective:1000 }}>
      <motion.div initial={{ scale:0.8, rotateX:40, y:40 }} animate={{ scale:1, rotateX:0, y:0 }} transition={{ type:'spring', damping:20, stiffness:100 }}
        className="relative flex flex-col items-center justify-center" style={{ width:480, height:320, background:`linear-gradient(160deg, #d4b895 0%, #c4a87a 100%)`, borderRadius:4, boxShadow:'0 24px 60px rgba(0,0,0,0.8)', border:'1px solid #b39b7d' }}>
        <div className="absolute inset-3 border border-dashed" style={{ borderColor:'rgba(100,60,30,0.25)' }} />
        {pokemon && <img src={getSpriteUrl(pokemon.id)} className="w-28 h-28 z-10" style={{ imageRendering:'pixelated', filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }} />}
        <div className="text-xl font-black text-amber-950 mt-4 tracking-widest z-10" style={{ fontFamily:FONT }}>EVIDENCE MODE INITIATED</div>
        {pokemon && <div className="text-sm font-bold text-amber-900 mt-1 z-10" style={{ fontFamily:FONT }}>LEAD DETECTIVE: {pokemon.name.toUpperCase()}</div>}
      </motion.div>
    </motion.div>
  );
}

function DispatchOverlay({ pokemon, annotations }: { pokemon: any; annotations: Annotation[] }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.5 }} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center flex-col" style={{ fontFamily:FONT }}>
      <motion.div initial={{ scale:1 }} animate={{ scale:0.85, y:-40 }} transition={{ delay:0.8, type:'spring', damping:20 }}
        style={{ width:480, height:300, background:'#d4b895', borderRadius:4, position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'1px solid #b39b7d', boxShadow:'0 20px 50px rgba(0,0,0,0.7)' }}>
        <div style={{ fontSize:13, fontWeight:900, color:'#3a2a1a', letterSpacing:'0.2em', fontFamily:FONT }}>EVIDENCE SUBMITTED</div>
        <div style={{ fontSize:36, fontWeight:900, color:'#1a0f05', marginTop:8, letterSpacing:'-0.02em', fontFamily:FONT }}>
          {annotations.length} MARKS
        </div>
      </motion.div>
    </motion.div>
  );
}

function DoneOverlay() {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" style={{ fontFamily:FONT }}>
      <div style={{ fontSize:18, fontWeight:900, color:'#f5ede0', letterSpacing:'0.3em' }}>TRANSFERRING TO TEST ARENA...</div>
    </motion.div>
  );
}
