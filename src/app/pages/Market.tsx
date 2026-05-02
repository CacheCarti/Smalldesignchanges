import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { PokemonCard, PokemonDetailCard } from '../components/PokemonCard';
import { Pokemon, ALL_POKEMON, overallRating, Rarity, PokemonType } from '../data/pokemon';
import { motion, AnimatePresence } from 'motion/react';

type SortKey = 'price' | 'overall' | 'pace' | 'verbal' | 'spatial' | 'accuracy' | 'name';
type FilterRarity = Rarity | 'All';

const CORK      = '#5D4037';
const CORK_DARK = '#1A1A1A';
const POLA      = '#f5ede0';
const STICKY_Y  = '#F9E97E';
const MANILLA   = '#D5BCA4';
const RED       = '#C62828';
const FONT      = "'Courier New', monospace";

export function Market() {
  const { coins, spendCoins, addCoins, inventory, addToInventory, removeFromInventory, activePokemon } = useGame();
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [activeTab, setActiveTab]   = useState<'market' | 'inventory'>('market');
  const [sortBy, setSortBy]         = useState<SortKey>('overall');
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('desc');
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts]         = useState<{ id: number; msg: string; type: 'success' | 'error' }[]>([]);
  const [recentTx, setRecentTx]     = useState<{ name: string; action: 'buy' | 'sell'; price: number }[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(ts => [...ts, { id, msg, type }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 2500);
  };

  const inInventory = (p: Pokemon) => inventory.some(inv => inv.id === p.id && inv.name === p.name);
  const inTeam      = (p: Pokemon) => activePokemon?.id === p.id;

  const handleBuy = (p: Pokemon) => {
    if (inInventory(p)) { showToast(`Already own ${p.name}!`, 'error'); return; }
    if (!spendCoins(p.price)) { showToast(`Not enough coins! Need $${p.price.toLocaleString()}`, 'error'); return; }
    addToInventory(p);
    setRecentTx(tx => [{ name: p.name, action: 'buy', price: p.price }, ...tx.slice(0, 4)]);
    showToast(`Acquired ${p.name} for $${p.price.toLocaleString()}`);
    setSelectedPokemon(null);
  };

  const handleSell = (p: Pokemon) => {
    if (inTeam(p)) { showToast(`Remove ${p.name} from active team first!`, 'error'); return; }
    const sellPrice = Math.round(p.price * 0.75);
    removeFromInventory(p.id);
    addCoins(sellPrice);
    setRecentTx(tx => [{ name: p.name, action: 'sell', price: sellPrice }, ...tx.slice(0, 4)]);
    showToast(`Sold ${p.name} for $${sellPrice.toLocaleString()}`);
    setSelectedPokemon(null);
  };

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    ALL_POKEMON.forEach(p => p.types.forEach(t => types.add(t)));
    return ['All', ...Array.from(types).sort()];
  }, []);

  const sortAndFilter = (list: Pokemon[]) => list
    .filter(p => filterRarity === 'All' || p.rarity === filterRarity)
    .filter(p => filterType === 'All' || p.types.includes(filterType as PokemonType))
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      const va = sortBy === 'price' ? a.price : sortBy === 'overall' ? overallRating(a.stats) : (a.stats as any)[sortBy];
      const vb = sortBy === 'price' ? b.price : sortBy === 'overall' ? overallRating(b.stats) : (b.stats as any)[sortBy];
      return sortDir === 'desc' ? vb - va : va - vb;
    });

  const marketList    = sortAndFilter(ALL_POKEMON.filter(p => !inInventory(p)));
  const inventoryList = sortAndFilter(inventory);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  return (
    <div style={{
      minHeight:'100vh',
      background:`radial-gradient(circle at 20% 25%, rgba(93,64,55,0.3) 0%, transparent 40%), linear-gradient(135deg, ${CORK} 0%, ${CORK_DARK} 100%)`,
      fontFamily: FONT,
    }}>
      {/* Cork texture */}
      <svg style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.10, zIndex:0 }}>
        <filter id="mkt-noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="n" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#mkt-noise)" />
      </svg>

      <div style={{ position:'relative', zIndex:1, maxWidth:1100, margin:'0 auto', padding:'20px 24px 40px' }}>
        {/* Header - looks like a police evidence board header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div style={{
            background:POLA, padding:'12px 22px', borderRadius:2,
            transform:'rotate(-1deg)', boxShadow:'3px 5px 14px rgba(0,0,0,0.5)',
            position:'relative',
          }}>
            <div style={{ position:'absolute', top:6, left:10, width:10, height:10, borderRadius:'50%', background:RED, boxShadow:'0 2px 4px rgba(0,0,0,0.5)' }} />
            <div style={{ marginLeft:14 }}>
              <div style={{ fontSize:9, color:RED, letterSpacing:'0.25em', fontWeight:900 }}>PROPERTY EXCHANGE</div>
              <div style={{ fontSize:28, fontWeight:900, color:'#1a1a1a', letterSpacing:'0.04em' }}>BLACK MARKET</div>
              <div style={{ fontSize:9, color:'#555', marginTop:3 }}>Acquire and trade Logic Drones. All sales final.</div>
            </div>
          </div>

          {/* Balance board */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
            <div style={{
              background:STICKY_Y, padding:'8px 16px', borderRadius:2, transform:'rotate(1deg)',
              boxShadow:'2px 3px 8px rgba(0,0,0,0.3)',
              display:'flex', alignItems:'center', gap:8,
            }}>
              <span style={{ fontSize:16 }}>💰</span>
              <div>
                <div style={{ fontSize:7, color:'rgba(0,0,0,0.5)', fontWeight:900, letterSpacing:'0.12em' }}>CURRENT BALANCE</div>
                <div style={{ fontSize:18, fontWeight:900, color:'#2a1a08', fontFamily:FONT }}>${coins.toLocaleString()}</div>
              </div>
            </div>
            {recentTx.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {recentTx.slice(0, 2).map((tx, i) => (
                  <div key={i} style={{ fontSize:9, fontWeight:800, color: tx.action === 'buy' ? '#C62828' : '#2e7d32', textAlign:'right', fontFamily:FONT }}>
                    {tx.action === 'buy' ? '▼' : '▲'} {tx.name} ${tx.price.toLocaleString()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs — look like folder tabs */}
        <div style={{ display:'flex', gap:3, marginBottom:16, alignItems:'flex-end' }}>
          {(['market', 'inventory'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? MANILLA : 'rgba(200,160,80,0.15)',
              border: activeTab === tab ? `1px solid ${MANILLA}` : '1px solid rgba(200,160,80,0.2)',
              color: activeTab === tab ? '#2a1a0a' : 'rgba(200,160,80,0.6)',
              padding: activeTab === tab ? '9px 22px 7px' : '7px 20px 5px',
              borderRadius: '4px 4px 0 0', fontSize:11, fontWeight:900,
              cursor:'pointer', letterSpacing:'0.12em', fontFamily:FONT,
            }}>
              {tab === 'market' ? `🔦 ACQUISITION (${ALL_POKEMON.filter(p => !inInventory(p)).length})` : `🕵️ ROSTER (${inventory.length})`}
            </button>
          ))}
          <div style={{ flex:1, borderBottom:`2px solid ${MANILLA}44`, marginBottom:-1 }} />
        </div>

        {/* Filter board — looks like a polaroid pinboard */}
        <div style={{
          background:POLA, border:`1px solid rgba(200,160,80,0.3)`, borderRadius:2,
          padding:'10px 14px', marginBottom:16,
          boxShadow:'2px 4px 10px rgba(0,0,0,0.3)', transform:'rotate(-0.3deg)',
          display:'flex', gap:10, flexWrap:'wrap', alignItems:'center',
        }}>
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search operatives..."
            style={{
              background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.12)',
              borderRadius:2, padding:'5px 10px', color:'#1a1a1a', fontSize:11,
              outline:'none', flex:'1 1 140px', fontFamily:FONT,
            }}
          />
          <select value={filterRarity} onChange={e => setFilterRarity(e.target.value as FilterRarity)} style={{
            background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.12)', borderRadius:2,
            padding:'5px 8px', color:'#1a1a1a', fontSize:10, outline:'none', cursor:'pointer', fontFamily:FONT,
          }}>
            {(['All','Common','Rare','Epic','Legendary'] as const).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            <span style={{ fontSize:9, color:'rgba(0,0,0,0.45)', fontWeight:900 }}>SORT:</span>
            {(['overall','price','pace','spatial','accuracy'] as SortKey[]).map(key => (
              <button key={key} onClick={() => toggleSort(key)} style={{
                background: sortBy === key ? '#2a1a0a' : 'rgba(0,0,0,0.08)',
                border: 'none', color: sortBy === key ? '#f5ede0' : 'rgba(0,0,0,0.55)',
                padding:'3px 7px', borderRadius:2, fontSize:8, fontWeight:900, cursor:'pointer',
                letterSpacing:'0.08em', fontFamily:FONT,
              }}>
                {key.toUpperCase()} {sortBy === key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Rarity filters as stamps */}
        {activeTab === 'market' && (
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            {Object.entries({ Common:'#9CA3AF', Rare:'#60A5FA', Epic:'#A855F7', Legendary:'#F59E0B' }).map(([rarity, color]) => {
              const count = ALL_POKEMON.filter(p => p.rarity === rarity && !inInventory(p)).length;
              return (
                <motion.div key={rarity} whileHover={{ scale:1.05 }} onClick={() => setFilterRarity(filterRarity === rarity ? 'All' : rarity as Rarity)}
                  style={{
                    background: POLA, border:`2px solid ${color}66`, borderRadius:2, padding:'3px 10px',
                    cursor:'pointer', opacity: filterRarity === rarity || filterRarity === 'All' ? 1 : 0.45,
                    boxShadow:`2px 2px 6px rgba(0,0,0,0.3), inset 0 0 0 1px ${color}22`,
                    transform:`rotate(${['1', '-0.5', '0.8', '-1'][Object.keys({ Common:1, Rare:2, Epic:3, Legendary:4 }).indexOf(rarity)]}deg)`,
                  }}>
                  <span style={{ fontSize:8, color, fontWeight:900, fontFamily:FONT }}>{rarity.toUpperCase()} · {count}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Card grid */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:12, minHeight:200 }}>
          <AnimatePresence mode="popLayout">
            {(activeTab === 'market' ? marketList : inventoryList).map((pokemon, idx) => {
              const owned = inInventory(pokemon);
              const team  = inTeam(pokemon);
              return (
                <motion.div key={`${pokemon.id}-${pokemon.name}`} layout
                  initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.85, opacity:0 }}
                  transition={{ delay: idx * 0.02 }} style={{ position:'relative' }}>
                  <PokemonCard pokemon={pokemon} size="md" selected={team} showPrice onClick={() => setSelectedPokemon(pokemon)} />
                  {owned && activeTab === 'market' && (
                    <div style={{ position:'absolute', top:5, left:5, background:'#2e7d32', borderRadius:2, fontSize:7, fontWeight:900, color:'#fff', padding:'2px 5px', letterSpacing:'0.08em' }}>OWNED</div>
                  )}
                  {team && (
                    <div style={{ position:'absolute', top:5, left:5, background:'#7C3AED', borderRadius:2, fontSize:7, fontWeight:900, color:'#fff', padding:'2px 5px', letterSpacing:'0.08em' }}>ACTIVE</div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {(activeTab === 'market' ? marketList : inventoryList).length === 0 && (
            <div style={{ width:'100%', textAlign:'center', padding:'50px 20px', color:'rgba(200,160,80,0.4)', fontSize:13, fontFamily:FONT }}>
              {activeTab === 'market' ? '— All operatives acquired —' : '— No operatives in roster —'}
            </div>
          )}
        </div>
      </div>

      {/* Toast notifications */}
      <div style={{ position:'fixed', bottom:80, right:20, display:'flex', flexDirection:'column', gap:6, zIndex:500 }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ x:100, opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:100, opacity:0 }}
              style={{
                background: t.type === 'success' ? POLA : '#2a0808',
                border:`1px solid ${t.type === 'success' ? 'rgba(0,0,0,0.2)' : RED}66`,
                color: t.type === 'success' ? '#2a1a08' : '#f87171',
                padding:'9px 14px', borderRadius:2, fontSize:11, fontWeight:800,
                boxShadow:'0 4px 16px rgba(0,0,0,0.5)', maxWidth:260, fontFamily:FONT,
                transform:'rotate(-0.5deg)',
              }}>
              {t.type === 'success' ? '✓' : '✗'} {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedPokemon && (
          <PokemonDetailCard
            pokemon={selectedPokemon}
            onClose={() => setSelectedPokemon(null)}
            onBuy={() => handleBuy(selectedPokemon)}
            onSell={() => handleSell(selectedPokemon)}
            inInventory={inInventory(selectedPokemon)}
            inTeam={inTeam(selectedPokemon)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Market;
