import { useCallback, useEffect, useState } from 'react';
import { Analytics } from "@vercel/analytics/react";
import { Menu, X, PlusCircle, LayoutDashboard, Calculator, History, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || "https://aguacateconteo.onrender.com";

function App() {
  const [view, setView] = useState('home') // home, manual, dashboard, history
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [peso, setPeso] = useState('')
  const [media, setMedia] = useState(0)
  const [suma, setSuma] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [tipoMensaje, setTipoMensaje] = useState('ok')
  const [animateAvg, setAnimateAvg] = useState(false)

  const [meses, setMeses] = useState([])
  const [repMes, setRepMes] = useState('')

  // Dashboard stats
  const [stats, setStats] = useState({ graph_data: [], top_three: [] })
  const [dashboardPeriod, setDashboardPeriod] = useState('day') // day, month, year

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

  const fetchDashboardStats = useCallback(async (period = dashboardPeriod) => {
    try {
      const res = await fetch(`${API_URL}/dashboard/stats?period=${period}`)
      const data = await res.json()
      setStats(data)
    } catch {
      console.error('Error al obtener stats del dashboard')
    }
  }, [dashboardPeriod])

  useEffect(() => {
    fetchMedia()
    if (view === 'dashboard') fetchDashboardStats()
  }, [fetchMedia, fetchDashboardStats, view, dashboardPeriod])

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
      await fetchMedia(); fetchDashboardStats();
    } catch (err) {
      mostrarMensaje(`❌ ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const registrarManual = async (manualPeso, manualFecha) => {
    const gramos = parseInt(manualPeso, 10)
    if (isNaN(gramos) || gramos < 70 || gramos > 300) {
      mostrarMensaje('⚠️ Peso inválido. Debe ser entre 70g y 300g', 'error')
      return
    }
    const valorKg = gramos / 1000
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/pesaje/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peso: valorKg, fecha: manualFecha }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail?.[0]?.msg || err.detail || 'Error al registrar')
      }
      mostrarMensaje(`✅ Registrado Manual: ${gramos}g`, 'ok')
      await fetchMedia(); fetchDashboardStats();
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
      await fetchMedia(); fetchDashboardStats();
    } catch (err) {
      mostrarMensaje(`❌ ${err.message}`, 'error')
    }
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const navigateTo = (newView) => {
    setView(newView)
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-dvh flex flex-col items-center bg-crema px-4 py-6 select-none relative font-sans">
      
      {/* Navbar with Dropdown */}
      <nav className="w-full max-w-md flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
          <span className="text-3xl">🥑</span>
          <h1 className="text-xl font-black text-verde-oscuro">AguacateConteo</h1>
        </div>
        
        <div className="relative">
          <button 
            onClick={toggleMenu}
            className="p-2 rounded-xl bg-white border border-crema-oscuro text-verde-oscuro shadow-sm hover:bg-crema-oscuro/50 transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-crema-oscuro shadow-xl z-50 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
              <div className="p-2 flex flex-col gap-1">
                <button 
                  onClick={() => navigateTo('home')}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm font-bold transition-colors ${view === 'home' ? 'bg-verde-oscuro text-white' : 'text-marron hover:bg-crema'}`}
                >
                  <Calculator size={18} /> Calculadora de Pesos
                </button>
                <button 
                  onClick={() => navigateTo('manual')}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm font-bold transition-colors ${view === 'manual' ? 'bg-verde-oscuro text-white' : 'text-marron hover:bg-crema'}`}
                >
                  <PlusCircle size={18} /> Registro Manual (Pasados)
                </button>
                <button 
                  onClick={() => navigateTo('dashboard')}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm font-bold transition-colors ${view === 'dashboard' ? 'bg-verde-oscuro text-white' : 'text-marron hover:bg-crema'}`}
                >
                  <LayoutDashboard size={18} /> Dashboard Estadístico
                </button>
                <div className="h-px bg-crema-oscuro my-1" />
                <button 
                  onClick={() => navigateTo('history')}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm font-bold transition-colors ${view === 'history' ? 'bg-verde-oscuro text-white' : 'text-marron hover:bg-crema'}`}
                >
                  <History size={18} /> Historial y Reportes
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Toast */}
      {mensaje && (
        <div className={`w-full max-w-md mb-4 px-4 py-3 rounded-xl text-sm font-semibold text-center border animate-[fadeIn_0.2s_ease-out] ${tipoMensaje === 'ok' ? 'bg-verde-oscuro/10 text-verde-oscuro border-verde-oscuro/20' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {mensaje}
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-md flex-1">
        
        {view === 'home' && (
          <HomeView 
            peso={peso} 
            media={media} 
            suma={suma} 
            total={total} 
            loading={loading}
            animateAvg={animateAvg}
            onRegistrator={registrar}
            onAddDigit={agregarDigito}
            onDelete={borrar}
            onClear={limpiar}
          />
        )}

        {view === 'manual' && (
          <ManualEntryView 
            onRegister={registrarManual}
            loading={loading}
          />
        )}

        {view === 'dashboard' && (
          <DashboardView 
            stats={stats} 
            period={dashboardPeriod} 
            setPeriod={setDashboardPeriod} 
          />
        )}

        {view === 'history' && (
          <HistoryView 
            meses={meses}
            repMes={repMes}
            setRepMes={setRepMes}
            onDownload={descargarPDF}
            onReset={eliminarDatos}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mt-6 pb-4 flex flex-col items-center gap-2">
        <p className="text-[10px] text-marron/30 font-bold uppercase tracking-widest">
          Sistema de Control de Calidad v2.0
        </p>
        <Analytics />
      </footer>
    </div>
  )
}

function HomeView({ peso, media, suma, total, loading, animateAvg, onRegistrator, onAddDigit, onDelete, onClear }) {
  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']
  const sumaGramos = Math.round(suma * 1000)
  const mostrarEnKg = sumaGramos >= 1000
  const sumaMostrada = mostrarEnKg ? (sumaGramos / 1000).toFixed(3) : sumaGramos
  const unidadMostrada = mostrarEnKg ? 'kg' : 'g'

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className={`relative overflow-hidden rounded-2xl p-6 text-center bg-gradient-to-br from-verde-oscuro via-verde-medio to-verde-claro shadow-lg shadow-verde-oscuro/30 transition-transform duration-300 mb-5 ${animateAvg ? 'scale-105' : 'scale-100'}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white rounded-full" />
        </div>
        <p className="relative text-crema/80 text-xs font-bold uppercase tracking-widest mb-1">Total Mes Actual</p>
        <div className="flex items-baseline justify-center gap-1">
          <p className="relative text-white text-6xl font-black tabular-nums leading-none mb-1">{sumaMostrada}</p>
          <p className="relative text-crema/70 text-lg font-bold">{unidadMostrada}</p>
        </div>
        <p className="relative text-crema/50 text-[10px] mt-2 font-bold uppercase tracking-tighter">
          Media: {Math.round(media * 1000)}g • {total} Registros
        </p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-crema-oscuro p-5 text-center shadow-sm mb-4">
        <p className="text-[10px] text-marron/40 font-black uppercase tracking-widest mb-2">Peso a Registrar</p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-5xl font-black tabular-nums text-gray-200">0.</span>
          <span className={`text-5xl font-black tabular-nums transition-colors duration-200 ${peso ? 'text-verde-oscuro' : 'text-gray-200'}`}>
            {peso || '000'}
          </span>
          <span className="text-2xl font-bold text-marron/30">g</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {teclas.map((t, i) => (
          t === '' ? <div key={i} /> : (
            <button
              key={t}
              onClick={() => (t === '⌫' ? onDelete() : onAddDigit(t))}
              onDoubleClick={() => t === '⌫' && onClear()}
              className={`h-16 rounded-xl text-2xl font-bold transition-all active:scale-95 ${t === '⌫' ? 'bg-marron/10 text-marron hover:bg-marron/20' : 'bg-white text-verde-oscuro border border-crema-oscuro hover:bg-crema shadow-sm'}`}
            >
              {t}
            </button>
          )
        ))}
      </div>

      <button
        onClick={onRegistrator}
        disabled={loading || !peso}
        className={`w-full py-4 rounded-2xl text-lg font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] ${loading || !peso ? 'bg-gray-200 text-gray-400' : 'bg-gradient-to-r from-verde-oscuro to-verde-medio text-white shadow-verde-oscuro/20'}`}
      >
        {loading ? '...' : '🥑 Registrar Peso'}
      </button>
    </div>
  )
}

function ManualEntryView({ onRegister, loading }) {
  const [peso, setPeso] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = (e) => {
    e.preventDefault()
    // Using midday as default time
    const fullDate = `${fecha}T12:00:00Z`
    onRegister(peso, fullDate)
    setPeso('')
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-white rounded-3xl border border-crema-oscuro shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-verde-oscuro/10 flex items-center justify-center text-verde-oscuro">
            <PlusCircle size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-verde-oscuro">Digitalizar Registros</h2>
            <p className="text-xs text-marron/50 font-bold uppercase">Registros pasados</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-marron/60 uppercase tracking-widest mb-2">Peso (gramos)</label>
            <input 
              type="number" 
              placeholder="Ej: 150"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="w-full bg-crema/30 border-2 border-crema-oscuro rounded-2xl px-5 py-4 text-xl font-bold text-verde-oscuro focus:border-verde-oscuro outline-none transition-colors"
              required
              min="70"
              max="300"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[10px] font-black text-marron/60 uppercase tracking-widest mb-2">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-marron/30" size={18} />
                <input 
                  type="date" 
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-crema/30 border-2 border-crema-oscuro rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-marron focus:border-verde-oscuro outline-none transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-verde-oscuro text-white text-lg font-black uppercase tracking-widest shadow-lg shadow-verde-oscuro/20 hover:bg-verde-medio transition-all active:scale-[0.98]"
          >
            {loading ? 'Guardando...' : '💾 Guardar Registro'}
          </button>
        </form>
      </div>
    </div>
  )
}

function DashboardView({ stats, period, setPeriod }) {
  if (!stats || !stats.graph_data || stats.graph_data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-crema-oscuro p-4 flex gap-2 overflow-x-auto">
          {['day', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-verde-oscuro text-white shadow-md' : 'bg-crema text-marron/50 hover:bg-crema-oscuro'}`}
            >
              {p === 'day' ? 'Día' : p === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-3xl border border-crema-oscuro p-10 text-center space-y-4 shadow-sm">
          <TrendingUp size={48} className="mx-auto text-marron/20" />
          <p className="text-sm font-black text-marron/40 uppercase">Aún no hay datos para mostrar</p>
        </div>
      </div>
    )
  }

  const formatXAxis = (val, index) => {
    if (period === 'year') return val;
    if (period === 'month') {
      // stats.graph_data entries already have a 'label' from backend like "Marzo 2024"
      const item = stats.graph_data.find(d => d.fecha === val);
      return item ? item.label.split(' ')[0].substring(0, 3) : val;
    }
    // day
    return val.split('-').slice(1).reverse().join('/');
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out] space-y-6">
      
      {/* Period Selector */}
      <div className="bg-white rounded-3xl border border-crema-oscuro p-2 flex gap-2 shadow-sm">
        {['day', 'month', 'year'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-verde-oscuro text-white shadow-md' : 'text-marron/50 hover:bg-crema/50'}`}
          >
            {p === 'day' ? 'Por Día' : p === 'month' ? 'Por Mes' : 'Por Año'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-crema-oscuro shadow-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-verde-oscuro uppercase tracking-tight flex items-center gap-2">
            <TrendingUp size={20} /> {period === 'day' ? 'Tendencia Diaria' : period === 'month' ? 'Tendencia Mensual' : 'Tendencia Anual'}
          </h2>
          <span className="text-[10px] font-bold text-marron/40 bg-crema px-2 py-1 rounded-full capitalize">
            {period === 'day' ? 'Últimos 30 días' : period === 'month' ? 'Últimos 12 meses' : 'Histórico Anual'}
          </span>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.graph_data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="fecha" 
                fontSize={ period === 'year' ? 12 : 10} 
                tickMargin={10} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={formatXAxis}
              />
              <YAxis 
                fontSize={10} 
                axisLine={false} 
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(val) => `${val}g`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#2d5a27' }}
                labelFormatter={(value) => {
                  const item = stats.graph_data.find(d => d.fecha === value);
                  return item ? item.label : value;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="media" 
                stroke="#2d5a27" 
                strokeWidth={4} 
                dot={{ r: 4, fill: '#2d5a27', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-crema-oscuro shadow-xl p-6">
        <h2 className="text-sm font-black text-verde-oscuro uppercase tracking-widest mb-4 flex items-center gap-2">
          🥇 Top 3 Medias {period === 'day' ? 'Diarias' : period === 'month' ? 'Mensuales' : 'Anuales'}
        </h2>
        <div className="space-y-3">
          {stats.top_three.map((item, index) => (
            <div key={item.fecha} className="flex items-center gap-4 p-4 rounded-2xl bg-crema/30 border border-crema-oscuro">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-sm ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-marron uppercase">{item.label}</p>
                <p className="text-[10px] text-marron/50 font-bold uppercase">{item.total} registros</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-verde-oscuro">{Math.round(item.media)}g</p>
                <p className="text-[10px] font-bold text-verde-oscuro/50 uppercase">Media</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function HistoryView({ meses, repMes, setRepMes, onDownload, onReset }) {
  return (
    <div className="animate-[fadeIn_0.3s_ease-out] space-y-4">
      <div className="bg-white rounded-3xl border border-crema-oscuro shadow-lg p-6">
        <h2 className="text-lg font-black text-marron mb-4">Reportes PDF</h2>
        <div className="space-y-4">
          <select
            className="w-full bg-crema/20 border-2 border-crema-oscuro text-marron font-black text-sm rounded-2xl px-5 py-4 outline-none focus:border-marron transition-all"
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
            onClick={onDownload}
            className="w-full py-4 rounded-2xl bg-marron text-crema text-sm font-black uppercase tracking-widest shadow-lg shadow-marron/20 hover:bg-marron-claro transition-all active:scale-[0.98]"
          >
            📄 Descargar PDF
          </button>
        </div>
      </div>

      <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
        <h3 className="text-xs font-black text-red-700 uppercase tracking-widest mb-2">Zona de Peligro</h3>
        <button
          onClick={onReset}
          className="w-full py-3 rounded-xl bg-transparent border-2 border-red-200 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
        >
          🗑️ Eliminar Registros
        </button>
      </div>
    </div>
  )
}

export default App
