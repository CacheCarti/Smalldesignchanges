import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { useGame } from '../context/GameContext';
import { motion } from 'motion/react';

const CORK      = '#5D4037';
const CORK_DARK = '#2a1a0a';
const POLA      = '#f5ede0';
const RED       = '#C62828';
const AMBER     = '#f5a742';
const FONT      = "'Courier New', monospace";

const NAV_ITEMS = [
  { path: '/',            label: 'BOARD',    icon: '📌' },
  { path: '/hub',         label: 'HUB',      icon: '🧠' },
  { path: '/map',         label: 'MAP',      icon: '🗺️' },
  { path: '/agency',      label: 'AGENCY',   icon: '🕵️' },
  { path: '/market',      label: 'MARKET',   icon: '🔦' },
  { path: '/leaderboard', label: 'RANKS',    icon: '📁' },
  { path: '/pvp',         label: 'PVP',      icon: '⚔️' },
];

export function Root() {
  const navigate = useNavigate();
  const location = useLocation();
  const { playerName, coins, diamonds } = useGame();

  // Don't show nav on battle page (full screen)
  const isFullScreen = ['/battle'].some(p => location.pathname.startsWith(p));

  return (
    <div style={{
      minHeight:'100vh',
      background:`linear-gradient(160deg, ${CORK} 0%, ${CORK_DARK} 100%)`,
      fontFamily: FONT,
      display:'flex', flexDirection:'column',
    }}>
      {/* Top Navbar — looks like a worn detective board header */}
      {!isFullScreen && (
        <header style={{
          background:'rgba(15,8,3,0.85)',
          backdropFilter:'blur(8px)',
          borderBottom:`1px solid rgba(200,160,80,0.2)`,
          padding:'0 16px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          height:52, position:'sticky', top:0, zIndex:100,
          boxShadow:'0 4px 12px rgba(0,0,0,0.5)',
        }}>
          {/* Logo */}
          <div
            onClick={() => navigate('/')}
            style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}
          >
            <div style={{
              width:32, height:32, borderRadius:2,
              background: POLA, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:18, boxShadow:`2px 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,160,80,0.3)`,
              transform:'rotate(-3deg)',
            }}>
              🔍
            </div>
            <span style={{
              fontSize:16, fontWeight:900, letterSpacing:'0.15em', color:POLA,
              textShadow:'0 2px 6px rgba(0,0,0,0.6)', fontFamily:FONT,
            }}>
              ANNOTOPIA
            </span>
            <span style={{ fontSize:8, color:'rgba(200,160,80,0.5)', fontWeight:900, letterSpacing:'0.2em', marginLeft:2 }}>
              FIELD OPS
            </span>
          </div>

          {/* Nav */}
          <nav style={{ display:'flex', gap:2, alignItems:'center' }}>
            {NAV_ITEMS.map(item => {
              const active = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  whileHover={{ scale:1.06 }}
                  whileTap={{ scale:0.92 }}
                  style={{
                    background: active ? 'rgba(200,160,80,0.2)' : 'transparent',
                    border: active ? '1px solid rgba(200,160,80,0.3)' : '1px solid transparent',
                    color: active ? POLA : 'rgba(200,160,80,0.45)',
                    padding:'5px 10px', borderRadius:2,
                    fontSize:9, fontWeight:900, letterSpacing:'0.1em',
                    cursor:'pointer', display:'flex', alignItems:'center', gap:4,
                    fontFamily:FONT, transition:'color 0.15s',
                  }}
                >
                  <span style={{ fontSize:12 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* Player info */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {/* Coins */}
            <div style={{
              background:POLA, borderRadius:2, padding:'3px 10px',
              display:'flex', alignItems:'center', gap:5, transform:'rotate(-0.5deg)',
              boxShadow:'2px 2px 6px rgba(0,0,0,0.4)',
            }}>
              <span style={{ fontSize:11, fontWeight:900, color:'#2e7d32', fontFamily:FONT }}>
                ${coins.toLocaleString()}
              </span>
            </div>

            <div style={{
              background:POLA, borderRadius:2, padding:'3px 10px',
              display:'flex', alignItems:'center', gap:4, transform:'rotate(0.5deg)',
              boxShadow:'2px 2px 6px rgba(0,0,0,0.4)',
            }}>
              <span style={{ fontSize:11, fontWeight:900, color:'#1565C0', fontFamily:FONT }}>
                💎{diamonds}
              </span>
            </div>

            {/* Detective badge */}
            <div style={{
              background:POLA, borderRadius:2, padding:'3px 10px',
              display:'flex', alignItems:'center', gap:5, transform:'rotate(-1deg)',
              boxShadow:'2px 2px 6px rgba(0,0,0,0.4)', border:`1px solid rgba(200,160,80,0.2)`,
            }}>
              <span style={{ fontSize:11 }}>🕵️</span>
              <span style={{ fontSize:10, fontWeight:900, color:'#1a1a1a', fontFamily:FONT }}>
                {playerName.slice(0, 10)}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Page content */}
      <main style={{ flex:1, overflow:'auto' }}>
        <Outlet />
      </main>

      {/* Bottom mobile nav */}
      {!isFullScreen && (
        <nav style={{
          display:'flex', justifyContent:'space-around', alignItems:'center',
          background:'rgba(15,8,3,0.9)', borderTop:`1px solid rgba(200,160,80,0.2)`,
          padding:'6px 0', position:'sticky', bottom:0, zIndex:100,
          backdropFilter:'blur(8px)',
        }}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button key={item.path} onClick={() => navigate(item.path)} style={{
                background:'none', border:'none',
                display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                color: active ? POLA : 'rgba(200,160,80,0.4)',
                cursor:'pointer', padding:'3px 10px', fontFamily:FONT,
              }}>
                <span style={{ fontSize:16 }}>{item.icon}</span>
                <span style={{ fontSize:6, fontWeight:900, letterSpacing:'0.08em' }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
