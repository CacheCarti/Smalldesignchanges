import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { BATTLE_IMAGES, TEST_REVEAL_IMAGES } from '../data/gameImages';
import { getSpriteUrl, ARCHITECTURE_COLORS } from '../data/pokemon';
import { ActivePetGuide } from '../components/ActivePetGuide';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const BG_CORK   = '#c29b70'; 
const RED       = '#b71c1c'; 
const PIN_RED   = '#E53935';
const PIN_GOLD  = '#F9A825';
const PIN_BLUE  = '#1E88E5';
const PIN_GREEN = '#43A047';
const POLA      = '#f4ece1';
const STICKY_Y  = '#F2E288';
const STICKY_B  = '#A7D4E8';
const STICKY_P  = '#ffb7b2';

const MANILLA   = '#D5BCA4';
const MANILLA_DK= '#C4AB93';
const FONT      = "'Courier New', monospace";

const ROUND_TIME   = 120;
const NUM_IMAGES   = 2;

type Phase = 'intro' | 'playing' | 'dispatch' | 'test_intro' | 'test' | 'done';
type Mode  = 'probe' | 'lasso' | 'scan';

interface Annotation {
  mode: Mode; x: number; y: number; w?: number; h?: number;
  qIdx: 0|1|2; correct?: boolean;
}

const Q_COLORS  = [STICKY_P, STICKY_B, STICKY_Y];
const Q_TOOLS: Mode[] = ['probe', 'lasso', 'scan'];
const Q_TOOL_LABELS = ['📍 PROBE', '✏️ LASSO', '🔍 SCAN'];

const COUNTRIES = ['France', 'Japan', 'Brazil', 'Senegal'];

const SASSY_NOTES = {
  probe: [
    "Boss, this exact dirt patch screams {country}.",
    "Probing this anomaly... Smells like {country}.",
    "Found a distinct {country} architectural detail right here."
  ],
  lasso: [
    "Sweeping this area... definite {country} vibes.",
    "Lassoing the suspect region. Classic {country} flora.",
    "This whole sector is basically a {country} postcard."
  ],
  scan: [
    "Scanning... {country} signature detected.",
    "Heatmap confirms {country} probability.",
    "Thermal trace matches {country} dataset perfectly."
  ]
};

export function EvidenceMode() {
  const nav = useNavigate();
  const { activePokemon: contextPokemon } = useGame();
  // Fallback to avoid kicking user if they jump directly to /evidence
  const activePokemon = contextPokemon || { id: 25, name: 'Pikachu', architecture: 'CNN' as const };

  const [phase, setPhase] = useState<Phase>('intro');
  const [imageIdx, setImageIdx] = useState(0);
  const [qIdx, setQIdx] = useState<0|1|2>(0);
  const [time, setTime] = useState(ROUND_TIME);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
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
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'test') {
      if (testStage === 'fight') {
        const t = setTimeout(() => setTestStage('winner'), 1800);
        return () => clearTimeout(t);
      } else if (testStage === 'winner') {
        const t = setTimeout(() => setTestStage('annotate'), 1500);
        return () => clearTimeout(t);
      }
    }
  }, [phase, testStage]);

  const addNote = (tool: Mode, country: string) => {
    const arr = SASSY_NOTES[tool];
    const note = arr[Math.floor(Math.random() * arr.length)].replace('{country}', country);
    setNotes(prev => [...prev, note].slice(-8));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (phase !== 'playing' || !selectedCountry) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeTool === 'probe' || activeTool === 'scan') {
      setAnnotations(prev => [...prev, { mode: activeTool, x, y, qIdx, correct: true }]);
      setLastAnnotationTime(Date.now());
      setLastClickPos({ x, y });
      setPokemonFaded(true);
      setTimeout(() => setPokemonFaded(false), 1000);
      addNote(activeTool, selectedCountry);
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
      addNote('lasso', selectedCountry!);
    }
    setSweepDrag(null);
  };

  const nextImage = () => {
    if (imageIdx >= NUM_IMAGES - 1) { setPhase('dispatch'); return; }
    setImageIdx(imageIdx + 1);
    setQIdx(0);
    setAnnotations([]);
    setNotes([]);
    setSelectedCountry(null);
  };

  const arch = ARCHITECTURE_COLORS[activePokemon.architecture] || ARCHITECTURE_COLORS.CNN;

  // Background Decor & Strings matching Home.tsx (Prominent, no spotlight)
  const renderDenseBackground = () => (
    <>
      <div style={{ position:'absolute', inset:0, opacity:0.95, backgroundImage:`radial-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.2) 1px, transparent 1px)`, backgroundSize: '24px 24px', backgroundPosition: '0 0, 12px 12px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 0 100px rgba(0,0,0,0.6)', pointerEvents:'none' }} />
      
      {/* Background Decor Props - spread out to frame the main center board */}
      <div style={{ position:'absolute', top:'8%', left:'18%', transform:'rotate(-12deg)', background:'#e0dcd3', padding:12, width:140, boxShadow:'2px 4px 10px rgba(0,0,0,0.4)', fontSize:7, color:'#222', clipPath:'polygon(0% 0%, 100% 0%, 98% 10%, 100% 20%, 97% 30%, 100% 40%, 98% 50%, 100% 60%, 97% 70%, 100% 80%, 98% 90%, 100% 100%, 0% 100%, 2% 90%, 0% 80%, 3% 70%, 0% 60%, 2% 50%, 0% 40%, 3% 30%, 0% 20%, 2% 10%)', filter:'sepia(0.2) contrast(1.05)' }}>
        <RealisticPin color={PIN_BLUE} />
        <strong style={{fontSize:11, borderBottom:'2px solid #333', display:'block', marginBottom:4, fontFamily:'Times New Roman, serif'}}>LOCAL HEIST</strong>
        <div style={{fontFamily:'Times New Roman, serif', lineHeight:1.4}}>Authorities remain baffled after the sudden disappearance of the artifact from the museum vault...</div>
      </div>
      
      <div style={{ position:'absolute', top:'10%', right:'18%', transform:'rotate(8deg)', background:POLA, padding:'6px 6px 20px 6px', width:100, boxShadow:'2px 4px 10px rgba(0,0,0,0.4)', filter:'sepia(0.3) contrast(1.1)' }}>
        <RealisticPin color={PIN_RED} />
        <div style={{ background:'#1a1a1a', height:80, display:'flex', alignItems:'center', justifyContent:'center', color:'#888', fontSize:32, fontWeight:'bold' }}>?</div>
        <div style={{ textAlign:'center', marginTop:5, fontSize:9, color:'#8b0000', fontWeight:'bold' }}>SUSPECT</div>
      </div>

      <div style={{ position:'absolute', bottom:'32%', left:'14%', transform:'rotate(-8deg)', background:STICKY_Y, padding:10, width:110, height:110, boxShadow:'2px 4px 10px rgba(0,0,0,0.4)', fontSize:12, fontWeight:'bold', color:'#111', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', zIndex: 1 }}>
        <RealisticPin color={PIN_GREEN} />
        CHECK ACCOUNTS
      </div>

      <div style={{ position:'absolute', bottom:'28%', right:'15%', transform:'rotate(12deg)', background:STICKY_B, padding:10, width:110, height:110, boxShadow:'2px 4px 10px rgba(0,0,0,0.4)', fontSize:12, fontWeight:'bold', color:'#111', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', zIndex: 1 }}>
        <RealisticPin color={PIN_GOLD} />
        MISSING AT 22:00
      </div>

      <div style={{ position:'absolute', top:'45%', left:'8%', transform:'rotate(4deg)', background:'#f5f5f0', padding:'6px 12px', fontSize:16, fontFamily:'"Courier New", monospace', color:'#8b0000', fontWeight:'bold', boxShadow:'1px 2px 4px rgba(0,0,0,0.3)', clipPath:'polygon(0% 10%, 100% 0%, 90% 100%, 5% 90%)', textTransform:'uppercase', letterSpacing:2 }}>
        <Tape />
        LIE.
      </div>

      {/* Chaotic Red Strings */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:8 }}>
        <filter id="string-shadow"><feDropShadow dx="1" dy="3" stdDeviation="2" floodOpacity="0.6"/></filter>
        {[
          {s:{x:22,y:14}, e:{x:50,y:50}}, {s:{x:78,y:14}, e:{x:50,y:50}}, {s:{x:18,y:65}, e:{x:50,y:50}}, {s:{x:82,y:70}, e:{x:50,y:50}},
          {s:{x:22,y:14}, e:{x:78,y:14}}, {s:{x:18,y:65}, e:{x:12,y:45}}
        ].map((line, i) => (
          <React.Fragment key={i}>
            <path d={`M ${line.s.x} ${line.s.y} Q ${(line.s.x+line.e.x)/2} ${(line.s.y+line.e.y)/2+8} ${line.e.x} ${line.e.y}`} fill="none" stroke="#400" strokeWidth="0.35" />
            <path d={`M ${line.s.x} ${line.s.y} Q ${(line.s.x+line.e.x)/2} ${(line.s.y+line.e.y)/2+8} ${line.e.x} ${line.e.y}`} fill="none" stroke={RED} strokeWidth="0.2" filter="url(#string-shadow)" />
          </React.Fragment>
        ))}
      </svg>
    </>
  );

  // Render Test Phase
  if (phase === 'test' || phase === 'test_intro') {
    return (
      <div style={{ minHeight: '100vh', padding: '0', background: `radial-gradient(circle at 18% 22%, rgba(0,0,0,0.1) 1.5px, transparent 2px), radial-gradient(circle at 72% 38%, rgba(0,0,0,0.15) 1px, transparent 1.5px), linear-gradient(135deg, #2a1a0a 0%, #1A1A1A 100%)`, fontFamily: FONT }}>
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
                <div style={{ fontSize:11, color:RED, letterSpacing:'0.18em', fontWeight:900 }}>CLASSIFICATION RESULTS</div>
                <div style={{ fontSize:32, fontWeight:900, color:'#1a1a1a', letterSpacing:'-0.02em' }}>{selectedCountry ? `PREDICTION: ${selectedCountry.toUpperCase()}` : 'SECTOR IDENTIFIED'}</div>
              </div>
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={() => nav('/hub')}
                style={{ background: '#1a1a1a', color:'#f5ede0', border:'none', padding:'8px 24px', borderRadius:3, fontSize:14, fontWeight:900, letterSpacing:'0.1em', cursor:'pointer', fontFamily:FONT, boxShadow:'0 4px 12px rgba(0,0,0,0.4)' }}>
                RETURN TO HUB →
              </motion.button>
            </motion.div>

            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>
              {/* Image Map Area */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
                  style={{ background:'#1a1a1a', border:`6px solid #2a1a08`, borderRadius:4, overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.6)', position:'relative' }}>
                  <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:RED, color:'#fff', padding:'3px 14px', fontSize:10, fontWeight:900, letterSpacing:'0.18em', zIndex:2 }}>
                    EVIDENCE HEATMAP
                  </div>
                  <div style={{ position:'relative', overflow:'hidden' }}>
                    <img src={reveal.url} style={{ width:'100%', height:340, objectFit:'cover', display:'block', filter: testStage === 'fight' ? 'brightness(0.6)' : 'brightness(1)', transition:'filter 0.8s' }} />
                    <AnimatePresence>
                      {(testStage === 'annotate') && (
                        <>
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.65 }} style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(255,0,0,0.8) 0%, rgba(255,255,0,0.5) 40%, transparent 80%)', mixBlendMode: 'multiply' }} />
                          {reveal.probeTargets.map((pt, i) => (
                            <motion.div key={i} initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay: i * 0.15, type:'spring' }}
                              style={{ position:'absolute', left:`${pt.x}%`, top:`${pt.y}%`, transform:'translate(-50%,-50%)', width:20, height:20, borderRadius:'50%', border:'2.5px solid #E53935', boxShadow:'0 0 8px rgba(229,57,53,0.8)' }}>
                              <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', fontSize:7, color:'#fff', fontWeight:900, whiteSpace:'nowrap', background:'rgba(0,0,0,0.7)', padding:'1px 4px', borderRadius:2 }}>{pt.label}</div>
                            </motion.div>
                          ))}
                        </>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {(testStage === 'fight') && (
                        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 20px' }}>
                          <motion.div animate={{ x:[0, 20, -8, 12, 0], rotate:[-2, 4, -3, 2, 0] }} transition={{ duration:1.5, repeat:1 }}>
                            <img src={getSpriteUrl(activePokemon.id)} style={{ width:100, height:100, filter:'drop-shadow(0 0 20px rgba(255,255,255,0.4))', imageRendering:'pixelated' }} />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Detective Notes Logic */}
              <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.6 }}
                style={{ background:STICKY_Y, border:`1px solid #d4c06e`, borderRadius:2, padding:'24px 20px', boxShadow:'3px 4px 14px rgba(0,0,0,0.4)', position:'relative', transform:'rotate(1deg)' }}>
                <RealisticPin color={PIN_BLUE} style={{ top:8, left:'50%', transform:'translateX(-50%)' }} />
                <div style={{ fontSize:14, fontWeight:900, color:'#2a1a0a', letterSpacing:'0.15em', borderBottom:`2px dashed #b5a45b`, paddingBottom:8, marginBottom:16, textAlign:'center' }}>
                  PET RATIONALE
                </div>
                
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, background:'rgba(255,255,255,0.3)', padding:8, borderRadius:4 }}>
                  <img src={getSpriteUrl(activePokemon.id)} style={{ width:40, height:40, imageRendering:'pixelated' }} />
                  <div>
                    <div style={{ fontSize:10, fontWeight:900, color:RED }}>{activePokemon.name} DECLARES:</div>
                    <div style={{ fontSize:16, fontWeight:900, color:'#111' }}>{selectedCountry?.toUpperCase() || 'UNKNOWN'}</div>
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {notes.map((n, i) => (
                    <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.8 + (i*0.2) }}
                      style={{ fontSize:12, color:'#1a1a1a', fontWeight:'bold', display:'flex', gap:8, lineHeight:1.4 }}>
                      <span style={{ color:RED }}>&gt;</span> {n}
                    </motion.div>
                  ))}
                  {notes.length === 0 && (
                    <div style={{ fontSize:11, color:'#666', fontStyle:'italic' }}>No rationale recorded. Blind guess.</div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Phase 1 (Evidence Collection)
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ backgroundColor: BG_CORK, fontFamily: FONT, position: 'relative' }}>
      
      {/* Heavy Corkboard Background & Red Strings */}
      {renderDenseBackground()}

      <AnimatePresence>
        {phase === 'intro' && <IntroOverlay pokemon={activePokemon} />}
        {phase === 'dispatch' && <DispatchOverlay pokemon={activePokemon} annotations={annotations} />}
        {phase === 'done' && <DoneOverlay />}
      </AnimatePresence>

      {/* Top HUD */}
      <div className="flex items-center justify-between px-4 py-1.5 z-20 shrink-0" style={{ background: 'rgba(15,8,3,0.7)', borderBottom: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 3px 10px rgba(0,0,0,0.6)' }}>
        <div className="flex items-center gap-3">
          <motion.div animate={{ opacity: pokemonFaded ? 0.2 : 1, scale: pokemonFaded ? 0.9 : 1 }} transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-2.5 py-1 rounded shadow-md" style={{ background: POLA, transform:'rotate(-1deg)' }}>
            <img src={getSpriteUrl(activePokemon.id)} className="w-8 h-8 object-contain" style={{ imageRendering:'pixelated' }} />
            <div>
              <div className="text-xs font-black text-gray-900 tracking-tight leading-none">{activePokemon.name}</div>
              <div className="text-[9px] font-bold text-gray-500 leading-none mt-0.5">{arch.label}</div>
            </div>
          </motion.div>
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

      <div className="flex-1 flex flex-row relative min-h-0 overflow-hidden" style={{ gap:16, padding:'20px 24px 160px 24px', zIndex: 10 }}>
        
        {/* Left Column - Tools */}
        <div style={{ width:140, minWidth:140, display:'flex', flexDirection:'column', gap:12, zIndex: 10 }}>
          
          {/* Evidence Tools */}
          <div style={{ background: STICKY_P, padding:'8px 8px 6px', borderRadius:2, boxShadow:'2px 3px 8px rgba(0,0,0,0.3)', transform:'rotate(-1.5deg)', position:'relative', flexShrink:0 }}>
            <RealisticPin color={PIN_BLUE} />
            <div style={{ fontSize:8, fontWeight:900, letterSpacing:'0.15em', color:'#2a1a08', textAlign:'center', marginTop:6, borderBottom:'1px dashed rgba(0,0,0,0.2)', paddingBottom:4, marginBottom:6 }}>
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
              <div style={{ fontSize:9, color:'rgba(0,0,0,0.6)', textAlign:'center', padding:'10px 0', fontWeight:'bold' }}>
                Open a case file at the bottom to access evidence tools.
              </div>
            )}
          </div>
        </div>

        {/* Center - Image Canvas */}
        <div className="flex-1 flex flex-col min-w-0 relative z-20" style={{ alignItems:'center', justifyContent: 'center' }}>
          <motion.div className="w-full relative flex flex-col shadow-2xl"
            style={{ background: POLA, padding:'6px 6px 40px 6px', maxWidth: 520, maxHeight: 520, aspectRatio: '1/1', flex:1, transform:`rotate(${imageIdx % 2 === 0 ? '-0.5deg' : '0.5deg'})`, boxShadow:'0 16px 40px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.5)', borderRadius:2 }}>
            <Tape style={{ top: -12, left: '50%', transform: 'translateX(-50%) rotate(-2deg)' }} />
            <RealisticPin color="#E53935" style={{ position:'absolute', top:4, left:'50%', transform:'translateX(-50%)' }} />

            <div ref={canvasRef} onClick={handleCanvasClick} onMouseDown={handleSweepStart} onMouseMove={handleSweepMove} onMouseUp={handleSweepEnd}
              style={{ flex:1, width:'100%', position:'relative', background:'#111', overflow:'hidden', cursor: activeTool === 'lasso' ? 'crosshair' : 'cell', boxShadow:'inset 0 0 16px rgba(0,0,0,0.5)', minHeight:0 }}>
              <img src={image.url} style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block', filter:'contrast(1.1)' }} />

              {annotations.map((a, i) => {
                const c = a.qIdx === 0 ? '#E53935' : a.qIdx === 1 ? '#1565C0' : '#F9A825';
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

              {phase === 'playing' && (
                <ActivePetGuide pokemonId={activePokemon.id} pokemonName={activePokemon.name} architecture={activePokemon.architecture} canvasRect={canvasRect} lastClickPos={lastClickPos} onAnnotation={lastAnnotationTime} trustScore={80} />
              )}
            </div>

            <div style={{ position:'absolute', bottom:4, left:10, right:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontFamily:FONT, fontSize:12, fontWeight:900, color:'#555', letterSpacing:'0.03em' }}>
                EXHIBIT A — EVIDENCE SCAN
              </div>
              <motion.button whileHover={{ scale:1.08 }} whileTap={{ scale:0.94 }} onClick={nextImage}
                style={{ background: '#1a1a1a', color:'#f5ede0', border:'none', padding:'4px 14px', borderRadius:3, fontSize:11, fontWeight:900, letterSpacing:'0.12em', cursor:'pointer', fontFamily:FONT, boxShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>
                NEXT →
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Detective Notes */}
        <div style={{ width:240, minWidth:200, display:'flex', flexDirection:'column', gap:6, zIndex: 10 }}>
          <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', background:STICKY_Y, borderRadius:2, border:`1px solid #d4c06e`, padding:'24px 12px 10px', boxShadow:'3px 4px 14px rgba(0,0,0,0.4)', transform:'rotate(2deg)' }}>
            <RealisticPin color={PIN_BLUE} style={{ top:8, left:'50%', transform:'translateX(-50%)' }} />
            <div style={{ fontSize:14, fontWeight:900, color:'#2a1a0a', letterSpacing:'0.1em', borderBottom:'2px dashed #b5a45b', paddingBottom:8, marginBottom:12, textAlign:'center' }}>
              DETECTIVE'S LOG
            </div>
            
            <div style={{ display:'flex', flexDirection:'column', gap:12, overflowY:'auto', flex:1, paddingRight:4 }}>
              {notes.length === 0 ? (
                <div style={{ fontSize:11, color:'rgba(0,0,0,0.5)', fontStyle:'italic', textAlign:'center', marginTop:20, fontWeight:'bold' }}>
                  Awaiting evidence marks... Use the tools on the left.
                </div>
              ) : (
                <AnimatePresence>
                  {notes.map((n, i) => (
                    <motion.div key={i} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                      style={{ fontSize:11, color:'#1a1a1a', fontWeight:'bold', borderBottom:'1px solid rgba(0,0,0,0.05)', paddingBottom:6, lineHeight:1.3 }}>
                      <span style={{ color:RED, marginRight:4, fontWeight:900 }}>&gt;</span> {n}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, background:'rgba(255,255,255,0.4)', padding:6, borderRadius:4 }}>
              <img src={getSpriteUrl(activePokemon.id)} style={{ width:28, height:28, imageRendering:'pixelated' }} />
              <div style={{ fontSize:9, fontWeight:900, color:'#555', letterSpacing:'0.05em' }}>DICTATED BY {activePokemon.name.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CASE FILES (Smaller and better scaled) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 100, zIndex: 30, pointerEvents: 'none', display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'flex-end' }}>
        {COUNTRIES.map((country) => {
          const isSelected = selectedCountry === country;
          return (
            <motion.div key={country} onClick={() => setSelectedCountry(country)} animate={{ y: isSelected ? -15 : 0 }} whileHover={{ y: isSelected ? -15 : -8 }}
              style={{ width: 110, height: 100, background: isSelected ? MANILLA : MANILLA_DK, borderRadius: '4px 12px 0 0', cursor: 'pointer', border: `2px solid ${MANILLA_DK}`, borderBottom: 'none', boxShadow: isSelected ? '0 -8px 24px rgba(0,0,0,0.6)' : '0 -4px 12px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, position: 'relative', pointerEvents: 'auto', zIndex: isSelected ? 40 : 35 }}>
              <div style={{ position: 'absolute', top: -16, left: 6, background: isSelected ? MANILLA : MANILLA_DK, padding: '2px 10px', borderRadius: '4px 4px 0 0', border: `2px solid ${MANILLA_DK}`, borderBottom: 'none', fontSize: 8, fontWeight: 'bold', color: '#333' }}>
                FILE {country.substring(0,3).toUpperCase()}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 900, color: '#1a1a1a', border: '1.5px dashed rgba(0,0,0,0.2)', padding: '2px 8px', transform: 'rotate(-2deg)' }}>
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
    <div style={{ position:'absolute', width:12, height:12, borderRadius:'50%', zIndex:10, background:`radial-gradient(circle at 35% 30%, #fff 0%, ${color} 60%, #000 100%)`, boxShadow:`2px 4px 6px rgba(0,0,0,0.7)`, ...style }}>
      <div style={{ position:'absolute', top:'90%', left:'50%', transform:'translateX(-50%)', width:1.5, height:6, background:'#777', boxShadow:'1px 1px 2px rgba(0,0,0,0.6)' }} />
    </div>
  );
}

function Tape({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', width: 40, height: 14, background: 'rgba(255,255,255,0.4)', borderLeft: '2px dashed rgba(0,0,0,0.15)', borderRight: '2px dashed rgba(0,0,0,0.15)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', zIndex: 60, ...style }} />
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