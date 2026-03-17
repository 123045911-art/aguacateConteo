import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || "https://tu-app-en-render.onrender.com";

function App() {
  const [peso, setPeso] = useState('')
  const [media, setMedia] = useState(0)
  const [suma, setSuma] = useState(0) // Now tracking the total sum
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [tipoMensaje, setTipoMensaje] = useState('ok')
  const [animateAvg, setAnimateAvg] = useState(false)

  const [meses, setMeses] = useState([])
  const [repMes, setRepMes] = useState('')

  const fetchMedia = useCallback(async () => {
    try {
      let url = `${API_URL}/media`
      if (repMes) {
        const [anio, mes] = repMes.split('-')
        url += `?anio=${anio}&mes=${mes}`
      }
      const res = await fetch(url)
      const data = await res.json()
      setMedia(data.media)
      setSuma(data.suma)
      setTotal(data.total)

      const resMeses = await fetch(`${API_URL}/meses`)
      const dataMeses = await resMeses.json()
      setMeses(dataMeses)
    } catch {
      console.error('Error al obtener la media')
    }
  }, [repMes])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const mostrarMensaje = (texto, tipo = 'ok') => {
    setMensaje(texto)
    setTipoMensaje(tipo)
    setTimeout(() => setMensaje(null), 3500)
  }

  const agregarDigito = (d) => {
    if (peso.length >= 3) return
    setPeso((prev) => prev + d)
  }

  const borrar = () => {
    setPeso((prev) => prev.slice(0, -1))
  }

  const limpiar = () => setPeso('')

  const registrar = async () => {
    const gramos = parseInt(peso, 10)
    if (isNaN(gramos) || gramos < 70 || gramos > 300) {
      mostrarMensaje('⚠️ Peso inválido. Debe ser entre 70g y 300g', 'error')
      return
    }
    const valorKg = gramos / 1000
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/pesaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peso: valorKg }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail?.[0]?.msg || err.detail || 'Error al registrar')
      }
      mostrarMensaje(`✅ Registrado: ${gramos}g`, 'ok')
      setPeso('')
      setAnimateAvg(true)
      setTimeout(() => setAnimateAvg(false), 600)
      await fetchMedia()
    } catch (err) {
      mostrarMensaje(`❌ ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const descargarPDF = async () => {
    try {
      let urlPDF = `${API_URL}/reporte`
      if (repMes) {
        const [anio, mes] = repMes.split('-')
        urlPDF += `?anio=${anio}&mes=${mes}`
      }

      const res = await fetch(urlPDF)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Error al generar reporte')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      let nombreMes = ''
      let anioMes = ''
      if (repMes) {
        const obj = meses.find(m => `${m.anio}-${m.mes}` === repMes)
        if (obj) {
          nombreMes = obj.nombre.split(' ')[0].toLowerCase()
          anioMes = obj.anio
        }
      } else {
        const ahora = new Date()
        const mesesNombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
        nombreMes = mesesNombres[ahora.getMonth()]
        anioMes = ahora.getFullYear()
      }

      a.download = `reporte_${nombreMes}_${anioMes}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      mostrarMensaje('📄 Reporte descargado exitosamente', 'ok')
    } catch (err) {
      mostrarMensaje(`❌ ${err.message}`, 'error')
    }
  }

  const eliminarDatos = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro de que quieres ELIMINAR todos los registros? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`${API_URL}/reset`, { method: 'DELETE' })
      const data = await res.json()
      mostrarMensaje(`🗑️ ${data.mensaje}`, 'ok')
      setAnimateAvg(true)
      setTimeout(() => setAnimateAvg(false), 600)
      await fetchMedia()
    } catch (err) {
      mostrarMensaje(`❌ ${err.message}`, 'error')
    }
  }

  const crearEnero = async () => {
    try {
      const res = await fetch(`${API_URL}/seed-enero`, { method: 'POST' })
      const data = await res.json()
      mostrarMensaje(`📅 ${data.mensaje}`, 'ok')
      await fetchMedia()
    } catch (err) {
      mostrarMensaje(`❌ ${err.message}`, 'error')
    }
  }

  const crearFebrero = async () => {
    try {
      const res = await fetch(`${API_URL}/seed-febrero`, { method: 'POST' })
      const data = await res.json()
      mostrarMensaje(`📅 ${data.mensaje}`, 'ok')
      await fetchMedia()
    } catch (err) {
      mostrarMensaje(`❌ ${err.message}`, 'error')
    }
  }

  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

  // Logic to show sum correctly (kg if >= 1000g, else g)
  const sumaGramos = Math.round(suma * 1000)
  const mostrarEnKg = sumaGramos >= 1000
  const sumaMostrada = mostrarEnKg ? (sumaGramos / 1000).toFixed(3) : sumaGramos
  const unidadMostrada = mostrarEnKg ? 'kg' : 'g'

  // Determine title based on selected month
  const mesSeleccionadoObj = meses.find(m => `${m.anio}-${m.mes}` === repMes)
  const tituloTarjeta = mesSeleccionadoObj ? `Total ${mesSeleccionadoObj.nombre}` : 'Total Mes Actual'

  return (
    <div className="min-h-dvh flex flex-col items-center bg-crema px-4 py-6 select-none">
      {/* Header */}
      <header className="w-full max-w-md text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-3xl">🥑</span>
          <h1 className="text-2xl font-extrabold text-verde-oscuro tracking-tight">
            Pesaje de Aguacates
          </h1>
        </div>
        <p className="text-sm text-marron/70 font-medium">
          Sistema de registro y control
        </p>
      </header>

      {/* Average Card */}
      <div className="w-full max-w-md mb-5">
        <div
          className={`
            relative overflow-hidden rounded-2xl p-6 text-center
            bg-gradient-to-br from-verde-oscuro via-verde-medio to-verde-claro
            shadow-lg shadow-verde-oscuro/30
            transition-transform duration-300
            ${animateAvg ? 'scale-105' : 'scale-100'}
          `}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white rounded-full" />
          </div>
          <p className="relative text-crema/80 text-sm font-semibold uppercase tracking-widest mb-1">
            {tituloTarjeta}
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <p className="relative text-white text-6xl font-black tabular-nums leading-none mb-1">
              {sumaMostrada}
            </p>
            <p className="relative text-crema/70 text-lg font-bold">{unidadMostrada}</p>
          </div>
          <p className="relative text-crema/50 text-xs mt-2 font-medium">
            Media: {Math.round(media * 1000)} g • {total} registro{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Toast */}
      {mensaje && (
        <div
          className={`
            w-full max-w-md mb-4 px-4 py-3 rounded-xl text-sm font-semibold text-center
            animate-[fadeIn_0.2s_ease-out]
            ${tipoMensaje === 'ok'
              ? 'bg-verde-oscuro/10 text-verde-oscuro border border-verde-oscuro/20'
              : 'bg-red-50 text-red-700 border border-red-200'
            }
          `}
        >
          {mensaje}
        </div>
      )}

      {/* Weight Display */}
      <div className="w-full max-w-md mb-4">
        <div className="bg-white rounded-2xl border-2 border-crema-oscuro p-5 text-center shadow-sm">
          <p className="text-xs text-marron/50 font-semibold uppercase tracking-widest mb-2">
            Peso a registrar
          </p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-black tabular-nums tracking-tight text-gray-300">0.</span>
            <span
              className={`
                text-5xl font-black tabular-nums tracking-tight transition-colors duration-200
                ${peso ? 'text-verde-oscuro' : 'text-gray-300'}
              `}
            >
              {peso || '000'}
            </span>
            <span className="text-2xl font-bold text-marron/40">g</span>
          </div>
          <div className="mt-2 h-1 w-20 mx-auto rounded-full bg-gradient-to-r from-verde-oscuro to-verde-claro opacity-50" />
        </div>
      </div>

      {/* Keypad */}
      <div className="w-full max-w-md mb-4">
        <div className="grid grid-cols-3 gap-2">
          {teclas.map((t, i) => (
            t === '' ? <div key={i} /> : (
              <button
                key={t}
                onClick={() => (t === '⌫' ? borrar() : agregarDigito(t))}
                onDoubleClick={() => t === '⌫' && limpiar()}
                className={`
                h-16 rounded-xl text-2xl font-bold
                transition-all duration-150 active:scale-95
                ${t === '⌫'
                    ? 'bg-marron/10 text-marron hover:bg-marron/20 active:bg-marron/30'
                    : 'bg-white text-verde-oscuro border border-crema-oscuro hover:bg-crema-oscuro/50 active:bg-verde-oscuro active:text-white shadow-sm'
                  }
              `}
              >
                {t}
              </button>
            )
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-3 mb-6">
        <button
          onClick={registrar}
          disabled={loading || !peso}
          className={`
            w-full py-4 rounded-2xl text-lg font-extrabold uppercase tracking-wider
            transition-all duration-200 active:scale-[0.98]
            shadow-lg shadow-verde-oscuro/30
            ${loading || !peso
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-verde-oscuro to-verde-medio text-white hover:shadow-xl hover:shadow-verde-oscuro/40'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Registrando…
            </span>
          ) : (
            '🥑 Registrar Peso'
          )}
        </button>

        <div className="bg-marron/5 border border-marron/10 rounded-2xl p-4 mt-4 text-center">
          <p className="text-sm font-bold text-marron mb-2">Descargar Reportes PDF</p>
          <select
            className="w-full bg-white border border-marron/20 text-marron-claro font-medium text-sm rounded-xl px-4 py-3 mb-3 outline-none focus:border-marron focus:ring-1 focus:ring-marron"
            value={repMes}
            onChange={(e) => setRepMes(e.target.value)}
          >
            <option value="">Mes Actual</option>
            {meses.map(m => (
              <option key={`${m.anio}-${m.mes}`} value={`${m.anio}-${m.mes}`}>
                {m.nombre}
              </option>
            ))}
          </select>

          <button
            onClick={descargarPDF}
            className="
              w-full py-3.5 rounded-xl text-sm font-bold
              bg-marron text-crema
              hover:bg-marron-claro active:scale-[0.98]
              transition-all duration-200
              shadow-md shadow-marron/20
            "
          >
            📄 Descargar PDF
          </button>
        </div>

        <div className="flex gap-2 text-center">
          <p className="w-full text-xs font-bold text-marron mb-1">Pruebas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={crearEnero}
            className="
              flex-1 py-3 rounded-2xl text-xs font-bold
              bg-blue-50 text-blue-600 border border-blue-200
              hover:bg-blue-100 active:scale-[0.98]
              transition-all duration-200
            "
          >
            🗓️ Set Ene
          </button>

          <button
            onClick={crearFebrero}
            className="
              flex-1 py-3 rounded-2xl text-xs font-bold
              bg-blue-50 text-blue-600 border border-blue-200
              hover:bg-blue-100 active:scale-[0.98]
              transition-all duration-200
            "
          >
            🗓️ Set Feb
          </button>

          <button
            onClick={eliminarDatos}
            className="
              flex-1 py-3 rounded-2xl text-xs font-bold
              bg-red-50 text-red-600 border border-red-200
              hover:bg-red-100 active:scale-[0.98]
              transition-all duration-200
            "
          >
            🗑️ Vaciar
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-xs text-marron/40 font-medium text-center pb-4">
        Rango válido: 70g – 300g
      </footer>
    </div>
  )
}

export default App
