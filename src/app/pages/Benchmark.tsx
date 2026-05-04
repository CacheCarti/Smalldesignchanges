import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { getSpriteUrl, ALL_POKEMON, Pokemon, ARCHITECTURE_COLORS } from '../data/pokemon';
import { TEST_REVEAL_IMAGES } from '../data/gameImages';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Trophy, Coins, Gem, Zap, Target, ShieldCheck, Swords, Paperclip, Pin, FileText, Search } from 'lucide-react';

const FONT = "'Courier New', monospace";
const POLA = '#f5ede0';
const MANILLA = '#D5BCA4';
const MANILLA_DK = '#C4AB93';
const STICKY_Y = '#F9E97E';
const RED_STR = '#C62828';
const CORK = '#3E2723';

type BenchmarkStage = 'selection' | 'theme_intro' | 'arena' | 'summary';

const THEMES = [
  "Indoor Logic Supremacy",
  "Urban Geometry Conflict",
  "Biological Feature Extraction",
  "Automotive Depth Perception",
  "Spectral Anomaly Detection"
];

const MOCK_OPPONENTS = [
  { id: 94, name: 'Gengar', stats: { accuracy: 78, pace: 85 } },
  { id: 150, name: 'Mewtwo', stats: { accuracy: 98, pace: 90 } },
  { id: 130, name: 'Gyarados', stats: { accuracy: 80, pace: 70 } }
];

export function Benchmark() {
  const nav = useNavigate();
  const { inventory, addCoins, addDiamonds, playerName } = useGame();

  const [stage, setStage] = useState<BenchmarkStage>('selection');
  const [selectedRoster, setSelectedRoster] = useState<Pokemon[]>([]);
  const [currentTheme] = useState(THEMES[Math.floor(Math.random() * THEMES.length)]);
  const [imageIdx, setImageIdx] = useState(0);
  const [roundStage, setRoundStage] = useState<'initial' | 'fight' | 'reveal'>('initial');
  const [roundWinnerIdx, setRoundWinnerIdx] = useState<number | null>(null);
  const [scores, setScores] = useState<number[]>([0, 0, 0]);
  const [oppScores, setOppScores] = useState<number[]>([0, 0, 0]);

  const images = useMemo(() => TEST_REVEAL_IMAGES.slice(0, 5), []);
  const currentImage = images[imageIdx % images.length];
  const oppRoster = useMemo(() => MOCK_OPPONENTS.map(m => ALL_POKEMON.find(p => p.id === m.id) || ALL_POKEMON[0]), []);

  useEffect(() => {
    if (stage === 'arena' && roundStage === 'initial') {
      const t = setTimeout(() => setRoundStage('fight'), 1500);
      return () => clearTimeout(t);
    } else if (stage === 'arena' && roundStage === 'fight') {
      const t = setTimeout(() => {
        const pIdx = Math.floor(Math.random() * 3);
        const oIdx = Math.floor(Math.random() * 3);
        const playerWin = Math.random() > 0.45;
        const winner = playerWin ? pIdx : oIdx + 3;
        
        setRoundWinnerIdx(winner);
        setRoundStage('reveal');
        
        if (playerWin) {
          setScores(prev => {
            const next = [...prev];
            next[pIdx] += 120 + Math.random() * 60;
            return next;
          });
        } else {
          setOppScores(prev => {
            const next = [...prev];
            next[oIdx] += 120 + Math.random() * 60;
            return next;
          });
        }
      }, 2000);
      return () => clearTimeout(t);
    } else if (stage === 'arena' && roundStage === 'reveal') {
      const t = setTimeout(() => {
        if (imageIdx < images.length - 1) {
          setImageIdx(i => i + 1);
          setRoundStage('initial');
          setRoundWinnerIdx(null);
        } else {
          setStage('summary');
        }
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [stage, roundStage, imageIdx, images.length]);

  const handleSelect = (p: Pokemon) => {
    if (selectedRoster.find(x => x.id === p.id)) {
      setSelectedRoster(prev => prev.filter(x => x.id !== p.id));
    } else if (selectedRoster.length < 3) {
      setSelectedRoster(prev => [...prev, p]);
    }
  };

  const startBenchmark = () => {
    if (selectedRoster.length === 3) {
      setStage('theme_intro');
      setTimeout(() => setStage('arena'), 2000);
    }
  };

  const totalPlayerScore = scores.reduce((a, b) => a + b, 0);
  const overallWinnerIdx = scores.indexOf(Math.max(...scores));
  const overallWinner = selectedRoster[overallWinnerIdx];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1a1a1a] text-[#2a1a0a]" style={{ fontFamily: FONT }}>
      
      <AnimatePresence mode="wait">
        {/* SELECTION: Manila Folder Style */}
        {stage === 'selection' && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="flex-1 flex flex-col p-10 items-center justify-center relative bg-[#D4C09B] shadow-inner">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')] opacity-30 pointer-events-none" />
            
            <div className="z-10 bg-white/40 p-1 rounded-sm border border-black/10 shadow-sm mb-10 transform -rotate-1">
              <div className="bg-[#f5ede0] px-12 py-6 border-2 border-[#dcd1bd] shadow-md">
                <h1 className="text-4xl font-black tracking-tighter text-black/80 underline decoration-red-800 decoration-4">BENCHMARK ROSTER</h1>
                <p className="text-[10px] font-bold mt-2 tracking-widest text-zinc-600">OFFICIAL EVALUATION ENROLLMENT FORM</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6 max-w-5xl z-10">
              {inventory.map(p => {
                const isSelected = selectedRoster.find(x => x.id === p.id);
                return (
                  <motion.div
                    key={p.id}
                    whileHover={{ scale: 1.02, rotate: 1 }}
                    onClick={() => handleSelect(p)}
                    className={`relative p-4 rounded-sm border shadow-md cursor-pointer transition-all ${isSelected ? 'bg-white rotate-2 border-red-800 scale-105' : 'bg-[#e8dec9] border-black/10 grayscale opacity-70'}`}
                  >
                    {isSelected && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-red-800"><Pin size={24} fill="currentColor" /></div>}
                    <img src={getSpriteUrl(p.id)} className="w-20 h-20 mx-auto object-contain image-pixelated" />
                    <div className="text-center mt-3">
                      <div className="text-[10px] font-black uppercase">{p.name}</div>
                      <div className="text-[8px] text-zinc-500 font-bold">{ARCHITECTURE_COLORS[p.architecture].label}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <button
              disabled={selectedRoster.length !== 3}
              onClick={startBenchmark}
              className={`mt-12 px-16 py-4 font-black text-xl tracking-[0.2em] uppercase transition-all shadow-lg ${selectedRoster.length === 3 ? 'bg-red-900 text-white cursor-pointer hover:bg-black' : 'bg-zinc-400 text-zinc-200 cursor-not-allowed'}`}
            >
              INITIALIZE FIELD TEST
            </button>
          </motion.div>
        )}

        {/* THEME INTRO: Typewriter on Folder */}
        {stage === 'theme_intro' && (
          <motion.div 
            key="theme_intro"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }}
            className="flex-1 flex items-center justify-center bg-[#D5BCA4]">
            <div className="bg-[#f5ede0] p-20 shadow-2xl border-2 border-black/5 transform rotate-2 relative">
              <div className="absolute top-4 left-4 text-zinc-400"><Paperclip /></div>
              <div className="text-[12px] font-black tracking-[0.4em] mb-4 text-red-800 uppercase">ENVIRONMENT_DETECTED</div>
              <h2 className="text-6xl font-black text-black/80 italic tracking-tighter typewriter">{currentTheme}</h2>
              <div className="mt-8 h-1 bg-black/10 w-full" />
            </div>
          </motion.div>
        )}

        {/* ARENA: Corkboard Detective Layout */}
        {stage === 'arena' && (
          <motion.div 
            key="arena"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 relative flex flex-col bg-[#3E2723] overflow-hidden">
            
            {/* Background Texture (Corkboard) */}
            <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-40 shadow-inner" />
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />

            {/* TOP HUD: Pinned Memo */}
            <div className="z-20 w-full px-10 py-4 flex justify-between items-start pointer-events-none">
              <div className="bg-[#F9E97E] p-4 shadow-xl border-b-2 border-black/10 transform -rotate-2 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-blue-800"><Pin size={20} fill="currentColor"/></div>
                <div className="text-[9px] font-black text-black/40 mb-1">EVALUATION_METRICS</div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-[8px] font-bold text-zinc-500 uppercase">AGENTS</div>
                    <div className="text-2xl font-black text-black leading-none italic">{Math.floor(scores.reduce((a,b)=>a+b,0) / 10)}</div>
                  </div>
                  <div className="w-px bg-black/10 mx-2" />
                  <div>
                    <div className="text-[8px] font-bold text-zinc-500 uppercase">RIVALS</div>
                    <div className="text-2xl font-black text-black leading-none italic opacity-50">{Math.floor(oppScores.reduce((a,b)=>a+b,0) / 10)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#D5BCA4] p-3 shadow-xl transform rotate-1 relative border border-black/5">
                <div className="absolute top-2 right-2 text-zinc-600"><Paperclip size={16}/></div>
                <div className="text-[10px] font-black text-red-800 italic uppercase underline">{currentTheme}</div>
                <div className="text-right text-[8px] font-bold mt-1 text-zinc-600 uppercase tracking-tighter">EXHIBIT {imageIdx + 1} / {images.length}</div>
              </div>
            </div>

            {/* THE CENTRAL POLAROID (Image Display) */}
            <div className="z-10 flex-1 flex flex-col items-center justify-center p-4">
              <motion.div 
                className="relative bg-[#f5ede0] p-6 pb-20 shadow-2xl transform rotate-1 max-w-xl w-full"
                style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}
              >
                {/* Pins in corners */}
                <div className="absolute top-2 left-2 text-red-800"><Pin size={16} fill="currentColor" /></div>
                <div className="absolute top-2 right-2 text-blue-800"><Pin size={16} fill="currentColor" /></div>

                <div className="relative aspect-video bg-zinc-900 shadow-inner overflow-hidden border-2 border-black/5">
                  <AnimatePresence mode="wait">
                    <motion.div key={imageIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative">
                      <ImageWithFallback src={currentImage.url} className="w-full h-full object-cover grayscale-[0.2]" />
                      
                      {/* Red Ink Annotations */}
                      {roundStage === 'reveal' && (
                        <div className="absolute inset-0">
                          {currentImage.probeTargets.map((pt, i) => (
                            <motion.div 
                              key={i} initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: i * 0.1, type: 'spring' }}
                              className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 border-[3px] border-red-700 rounded-full"
                              style={{ left: `${pt.x}%`, top: `${pt.y}%`, boxShadow: '0 0 5px rgba(185,28,28,0.5)' }}>
                              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 text-[8px] font-black italic text-red-800 border border-red-800 shadow-sm whitespace-nowrap">
                                {pt.label.toUpperCase()}
                              </div>
                            </motion.div>
                          ))}
                          {/* Red String Effect */}
                          <svg className="absolute inset-0 pointer-events-none w-full h-full opacity-40">
                             {currentImage.probeTargets.slice(0, -1).map((pt, i) => (
                               <line key={i} x1={`${pt.x}%`} y1={`${pt.y}%`} x2={`${currentImage.probeTargets[i+1].x}%`} y2={`${currentImage.probeTargets[i+1].y}%`} stroke="#C62828" strokeWidth="2" strokeDasharray="4 2" />
                             ))}
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="absolute bottom-6 left-10 text-xl font-black italic tracking-tighter text-zinc-700 uppercase">
                   EXHIBIT_BATCH_{imageIdx + 1}
                </div>
                <div className="absolute bottom-6 right-10 flex gap-2">
                   {roundStage === 'reveal' && (
                     <div className="bg-red-800 text-white px-3 py-1 text-[10px] font-black italic rotate-2 shadow-md">SOLVED</div>
                   )}
                </div>
              </motion.div>
            </div>

            {/* ARENA PLATFORM: The Evidence Desk */}
            <div className="z-10 h-[25%] w-full flex items-end justify-center pb-8 gap-16 px-20">
              
              {/* Player Team (Stickers) */}
              <div className="flex gap-4 items-end relative">
                {selectedRoster.map((p, i) => (
                  <motion.div
                    key={p.id}
                    animate={
                      roundStage === 'fight' ? { y: [0, -20, 0], x: [0, 10, 0], rotate: [2, -2, 2] } : 
                      (roundWinnerIdx === i ? { scale: [1, 1.3, 1], rotate: [0, 5, -5, 0], filter: 'brightness(1.5)' } : {})
                    }
                    transition={{ duration: 0.4, repeat: roundStage === 'fight' ? Infinity : 0 }}
                    className="relative group cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-white/40 blur-sm rounded-full -m-2 -z-10 group-hover:bg-white/60" />
                    <img src={getSpriteUrl(p.id)} className="w-24 h-24 object-contain image-pixelated drop-shadow-[2px_4px_6px_rgba(0,0,0,0.4)]" />
                    <div className={`mt-2 px-2 py-0.5 text-[9px] font-black text-center italic shadow-sm border ${roundWinnerIdx === i ? 'bg-red-800 text-white border-red-900' : 'bg-[#f5ede0] text-zinc-500 border-zinc-200'}`}>
                      {p.name.toUpperCase()}
                    </div>
                    {roundWinnerIdx === i && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-6 left-1/2 -translate-x-1/2 text-red-800"><Pin size={20} fill="currentColor" /></motion.div>}
                  </motion.div>
                ))}
              </div>

              {/* Combat Divider */}
              <div className="flex flex-col items-center opacity-20">
                 <Swords size={40} className="text-white" />
                 <div className="text-[10px] font-black mt-1 text-white uppercase italic">Arena</div>
              </div>

              {/* Opponent Team (Faded Stickers) */}
              <div className="flex gap-4 items-end flex-row-reverse relative">
                {oppRoster.map((p, i) => (
                  <motion.div
                    key={p.id}
                    animate={
                      roundStage === 'fight' ? { y: [0, -20, 0], x: [0, -10, 0], rotate: [-2, 2, -2] } : 
                      (roundWinnerIdx === i + 3 ? { scale: [1, 1.3, 1], filter: 'brightness(1.5)' } : {})
                    }
                    transition={{ duration: 0.4, repeat: roundStage === 'fight' ? Infinity : 0 }}
                    className="relative opacity-60 brightness-50 grayscale"
                  >
                    <img src={getSpriteUrl(p.id)} className="w-24 h-24 object-contain image-pixelated drop-shadow-[2px_4px_6px_rgba(0,0,0,0.4)]" />
                    <div className={`mt-2 px-2 py-0.5 text-[9px] font-black text-center italic border ${roundWinnerIdx === i + 3 ? 'bg-zinc-800 text-white border-zinc-900 opacity-100' : 'bg-zinc-200 text-zinc-400 border-zinc-300'}`}>
                      RIVAL
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Red String Overlays connecting items on the board */}
            <svg className="absolute inset-0 z-0 pointer-events-none w-full h-full opacity-10">
               <line x1="10%" y1="10%" x2="40%" y2="40%" stroke="#fff" strokeWidth="1" />
               <line x1="80%" y1="20%" x2="60%" y2="50%" stroke="#fff" strokeWidth="1" />
            </svg>

          </motion.div>
        )}

        {/* SUMMARY: Evaluation Report */}
        {stage === 'summary' && (
          <motion.div 
            key="summary"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center bg-[#D5BCA4] p-10">
            <div className="bg-[#f5ede0] border-2 border-black/10 p-12 max-w-2xl w-full shadow-2xl relative transform rotate-1">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-900 text-white px-8 py-2 font-black italic tracking-widest text-xl shadow-xl">
                EVALUATION REPORT
              </div>
              <div className="absolute top-4 right-4 text-zinc-300"><Paperclip size={32}/></div>

              <div className="text-center mt-6">
                <div className="text-zinc-400 font-bold text-[10px] tracking-[0.3em] uppercase mb-10">TOP PERFORMING AGENT</div>
                
                {overallWinner && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center">
                    <div className="relative p-6 bg-white/40 border-2 border-dashed border-black/5">
                      <img src={getSpriteUrl(overallWinner.id)} className="w-48 h-48 object-contain image-pixelated drop-shadow-xl" />
                      <div className="absolute -top-2 -right-2 text-red-800"><Pin size={24} fill="currentColor"/></div>
                    </div>
                    <h3 className="text-5xl font-black text-black/80 italic mt-8 uppercase tracking-tighter">{overallWinner.name}</h3>
                    <div className="text-red-800 font-black text-sm mt-2 tracking-widest uppercase italic underline">EVALUATION SUPREME</div>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-8 mt-12 text-left">
                  <div className="bg-white p-6 border border-black/5 shadow-sm">
                    <div className="text-[9px] text-zinc-400 font-black uppercase mb-3">BOUNTY RECOVERY</div>
                    <div className="text-3xl font-black text-black italic flex items-center gap-2 underline"><Coins /> ${Math.floor(totalPlayerScore / 2)}</div>
                  </div>
                  <div className="bg-white p-6 border border-black/5 shadow-sm">
                    <div className="text-[9px] text-zinc-400 font-black uppercase mb-3">GEMS SECURED</div>
                    <div className="text-3xl font-black text-black italic flex items-center gap-2 underline"><Gem /> {Math.floor(totalPlayerScore / 2000)}</div>
                  </div>
                </div>

                <button 
                  onClick={() => { addCoins(Math.floor(totalPlayerScore/2)); addDiamonds(Math.floor(totalPlayerScore/2000)); nav('/hub'); }}
                  className="mt-12 w-full py-5 bg-black text-white font-black text-2xl italic tracking-tighter hover:bg-red-900 transition-all cursor-pointer">
                  SIGN & DISMISS CASE
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER: Case File Status */}
      <div className="z-50 w-full bg-[#1a1a1a] border-t border-white/5 px-8 py-2 flex justify-between items-center text-zinc-500">
         <div className="text-[9px] font-black tracking-widest flex items-center gap-2 italic uppercase">
            <Search size={12}/> CASE_FILE_EVAL_MODE // ACTIVE_DISPATCH
         </div>
         <div className="text-[9px] font-black tracking-widest italic uppercase">
            OPERATOR: {playerName} // STATUS: {stage === 'summary' ? 'CLOSED' : 'OPEN'}
         </div>
      </div>

      <style>{`
        .image-pixelated { image-rendering: pixelated; }
        .typewriter {
          overflow: hidden;
          border-right: .15em solid #C62828;
          white-space: nowrap;
          margin: 0 auto;
          letter-spacing: .15em;
          animation: 
            typing 1.5s steps(40, end),
            blink-caret .75s step-end infinite;
        }
        @keyframes typing { from { width: 0 } to { width: 100% } }
        @keyframes blink-caret { from, to { border-color: transparent } 50% { border-color: #C62828; } }
      `}</style>
    </div>
  );
}

export default Benchmark;
