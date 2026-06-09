import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Player {
  name: string;
  club: string;
  position: string;
  rating: number;
}

export const Roulette = ({ players }: { players: Player[] }) => {
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [rotation, setRotation] = useState(0);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    const randomIndex = Math.floor(Math.random() * players.length);
    const extraDegrees = Math.random() * 360;
    const newRotation = rotation + 1440 + extraDegrees; // 4 full spins + random
    
    setRotation(newRotation);
    
    setTimeout(() => {
      setWinner(players[randomIndex]);
      setSpinning(false);
    }, 3000); // Coincide con la duración de la animación
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl">
      <h2 className="text-3xl font-bold mb-8 text-white">Ruleta de Jugadores</h2>
      <div className="relative w-64 h-64 mb-8">
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: "circOut" }}
          className="w-full h-full rounded-full border-8 border-cyan-500 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700"
        >
          <span className="text-white font-bold">⚽</span>
        </motion.div>
      </div>
      <button 
        onClick={spin}
        disabled={spinning}
        className={`px-8 py-3 rounded-full font-bold text-white transition-all ${spinning ? 'bg-gray-500' : 'bg-gold-500 hover:scale-105 active:scale-95'}`}
      >
        {spinning ? 'Girando...' : '¡Girar Ruleta!'}
      </button>
      {winner && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 bg-white/20 rounded-xl text-center"
        >
          <p className="text-xl font-bold text-white">{winner.name}</p>
          <p className="text-sm text-cyan-300">{winner.club} - Rating: {winner.rating}</p>
        </motion.div>
      )}
    </div>
  );
};