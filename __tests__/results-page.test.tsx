import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultsPage from '@/app/results/page'
import '@testing-library/jest-dom/vitest'

// Mock de window.localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      store = {}
    },
    removeItem: (key: string) => {
      delete store[key]
    },
  }
})()

// Mock de window.location
const locationMock = {
  search: '',
}

// Mock de navigator.share
const shareMock = vi.fn()

beforeEach(() => {
  localStorageMock.clear()
  locationMock.search = ''
  Object.assign(window, {
    localStorage: localStorageMock,
    location: locationMock,
    history: {
      replaceState: vi.fn(),
    },
    navigator: {
      share: shareMock,
    },
  })
})

describe('ResultsPage', () => {
  it('renderiza estado de carga inicialmente', () => {
    render(<ResultsPage />)
    expect(screen.getByText(/cargando resultados/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('muestra error cuando no hay datos en localStorage ni query', () => {
    render(<ResultsPage />)
    expect(screen.getByRole('heading', { name: /sin datos/i })).toBeInTheDocument()
    expect(screen.getByText(/no encontramos tu equipo/i)).toBeInTheDocument()
  })

  it('renderiza correctamente cuando recibe datos válidos por query', () => {
    locationMock.search = '?team=%7B%22label%22%3A%20%22Test%20Team%22%2C%20%22formation%22%3A%20%224-3-3%22%2C%20%22players%22%3A%5B%7B%22id%22%3A%20%22p1%22%2C%20%22name%22%3A%20%22Player%201%22%2C%20%22rating%22%3A%2085%7D%5D%2C%20%22score%22%3A%2085%7D'

    render(<ResultsPage />)
    
    expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /sin datos/i })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /test team/i })).toBeInTheDocument()
  })
})