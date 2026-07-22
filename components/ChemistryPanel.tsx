"use client"

import type { ChemistryBreakdown } from '@/lib/chemistry'

/** Barra de química total + desglose de links (club/nacionalidad) y fits de posición */
export default function ChemistryPanel({ chemistry }: { chemistry: ChemistryBreakdown }) {
  const clubLinks = chemistry.links.filter(l => l.type === 'club')
  const nationLinks = chemistry.links.filter(l => l.type === 'nacionalidad')
  const outOfPosition = chemistry.positionFit.filter(f => f === 'secundaria').length

  const clubCounts = clubLinks.reduce<Record<string, number>>((acc, l) => {
    acc[l.label] = (acc[l.label] || 0) + 1
    return acc
  }, {})
  const topClubs = Object.entries(clubCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const barColor = chemistry.total >= 70 ? 'bg-emerald-400' : chemistry.total >= 45 ? 'bg-[#75AADB]' : 'bg-amber-400'

  return (
    <div className="card-gradient rounded-xl p-3 text-left">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sport">QUÍMICA DEL ONCE</span>
        <span className="font-display text-lg font-black text-white">{chemistry.total}</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2">
        <div className={`${barColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${chemistry.total}%` }} />
      </div>
      <div className="flex flex-wrap gap-1.5 text-[10px] font-sport">
        {topClubs.map(([club, n]) => (
          <span key={club} className="badge-celeste px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">CLUB {club} x{n}</span>
        ))}
        {nationLinks.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/20 uppercase tracking-wider font-bold">NACIONALIDAD x{nationLinks.length}</span>
        )}
        {outOfPosition > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20 uppercase tracking-wider font-bold">{outOfPosition} fuera de posición natural</span>
        )}
        {chemistry.links.length === 0 && outOfPosition === 0 && (
          <span className="text-slate-500">Sumá jugadores del mismo club o país para conectar líneas</span>
        )}
      </div>
    </div>
  )
}
