"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const data = searchParams.get('team')
      if (!data) throw new Error("No team data")
      setTeam(JSON.parse(data))
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading results")
      setLoading(false)
    }
  }, [searchParams])

  if (loading) return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
        <p className="mt-4 text-slate-400">Cargando resultados...</p>
      </motion.div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <h2 className="text-3xl font-bold text-red-500">⚠️ Error</h2>
        <p className="mt-2 text-slate-400">{error}</p>
        <Link href="/" className="mt-6 inline-block px-6 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors">
          Volver al inicio
        </Link>
      </motion.div>
    </div>
  )

  if (!team) return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <h2 className="text-3xl font-bold text-yellow-500">🤔 Sin datos</h2>
        <p className="mt-2 text-slate