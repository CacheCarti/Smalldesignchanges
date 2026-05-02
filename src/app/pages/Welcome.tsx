import React from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useGame } from '../context/GameContext';

export function Welcome() {
  const nav = useNavigate();
  const { playerName } = useGame();

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Courier New', monospace",
      color: '#f5ede0', padding: 20, textAlign: 'center',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ maxWidth: 600 }}
      >
        <div style={{ fontSize: 12, color: '#C62828', letterSpacing: '0.3em', marginBottom: 16, fontWeight: 900 }}>
          [ INCOMING TRANSMISSION ]
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, marginBottom: 24, letterSpacing: '0.05em' }}>
          WELCOME TO ANNOTOPIA
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: '#bbb', marginBottom: 40 }}>
          Welcome, Detective {playerName || 'Ghost'}. The agency has a backlog of open cases. 
          Your objective is clear: deduce the truth, solve the cases, and train your neural pets 
          to navigate the darkest corners of this gritty reality. 
          <br /><br />
          Trust the board. Follow the red strings. Stay sharp.
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => nav('/')}
          style={{
            background: '#C62828', color: '#fff',
            border: 'none', padding: '16px 32px',
            fontSize: 16, fontWeight: 900, letterSpacing: '0.2em',
            borderRadius: 4, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(198,40,40,0.4)',
          }}
        >
          ENTER THE AGENCY
        </motion.button>
      </motion.div>
    </div>
  );
}
