import React from 'react';
import { Trophy, Share2, Download } from 'lucide-react';

interface Player {
  name: string;
  club: string;
  position: string;
  rating: number;
}

export const Results = ({ winner, previousWinner }: { winner: Player, previousWinner: Player | null }) => {
  return (
    <div className="mt-8 p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_0_30px_rgba(0,212,255,0.2)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <Trophy className="text-yellow-500" /> Resultado del Draft
        </h2>
        <div className="flex gap-2">
          <button className="p-2 bg-cyan-600 rounded-full hover:bg-cyan-500 transition-colors">
            <Share2 size={20} className="text-white" />
          </button>
          <button className="p-2 bg-gold-600 rounded-full hover:bg-gold-500 transition-colors">
            <Download size={20} className="text-white" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-gray-400 text-sm">Jugador Seleccionado</p>
          <h3 className="text-2xl font-bold text-cyan-400">{winner.name}</h3>
          <p className="text-white">{winner.club} | {winner.position}</p>
          <div className="mt-4 text-4xl font-black text-white">Rating: {winner.rating}</div>
        </div>

        {previousWinner && (
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10 opacity-70">
            <p className="text-gray-400 text-sm">Anterior</p>
            <h3 className="text-2xl font-bold text-gray-300">{previousWinner.name}</h3>
            <p className="text-white">{previousWinner.club} | {previousWinner.position}</p>
            <div className="mt-4 text-4xl font-black text-gray-500">Rating: {previousWinner.rating}</div>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-cyan-900/30 rounded-xl border border-cyan-500/30">
        <p className="text-xs text-cyan-200">
          💡 Tip: Compará el rendimiento histórico en el modo torneo para desbloquear medallas.
        </p>
      </div>
    </div>
  );
};