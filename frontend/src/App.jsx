import { useCallback, useEffect, useState } from 'react';
import { Analytics } from "@vercel/analytics/react";
import Nav from './components/Nav';
import HomeView from './components/HomeView';
import ManualEntryView from './components/ManualEntryView';
import DashboardView from './components/DashboardView';
import HistoryView from './components/HistoryView';
import Toast from './components/Toast';

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_URL || !API_KEY) {
  console.warn("WARNING: VITE_API_URL or VITE_API_KEY is not defined in the environment.");
}

function App() {
  const [view, setView] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [peso, setPeso] = useState('');
  const [media, setMedia] = useState(0);
  const [suma, setSuma] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [tipoMensaje, setTipoMensaje] = useState('ok');
  const [animateAvg, setAnimateAvg] = useState(false);

  const [meses, setMeses] = useState([]);
  const [repMes, setRepMes] = useState('');

  // Dashboard stats
  const [stats, setStats] = useState({ graph_data: [], top_five: [] });
  const [dashboardPeriod, setDashboardPeriod] = useState('month');

  const fetchMedia = useCallback(async () => {
    try {
      let url = `${API_URL}/media`;
      if (repMes) {
        const [anio, mes] = repMes.split('-');
        url += `?anio=${anio}&mes=${mes}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setMedia(data.media);
      setSuma(data.suma);
      setTotal(data.total);

      const resMeses = await fetch(`${API_URL}/meses`);
      const dataMeses = await resMeses.json();
      setMeses(dataMeses);
    } catch {
      console.error('Error al obtener la media');
    }
  }, [repMes]);

  const fetchDashboardStats = useCallback(async (period = dashboardPeriod) => {
    try {
      const res = await fetch(`${API_URL}/dashboard/stats?period=${period}`);
      const data = await res.json();
      setStats(data);
    } catch {
      console.error('Error al obtener stats del dashboard');
    }
  }, [dashboardPeriod]);

  useEffect(() => {
    if (!API_URL) return;
    fetchMedia();
    if (view === 'dashboard') fetchDashboardStats();
  }, [fetchMedia, fetchDashboardStats, view, dashboardPeriod]);

  const mostrarMensaje = (texto, tipo = 'ok') => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setTimeout(() => setMensaje(null), 3500);
  };

  const agregarDigito = (d) => {
    if (peso.length >= 3) return;
    setPeso((prev) => prev + d);
  };

  const borrar = () => {
    setPeso((prev) => prev.slice(0, -1));
  };

  const limpiar = () => setPeso('');

  const registrar = async () => {
    const gramos = parseInt(peso, 10);
    if (isNaN(gramos) || gramos < 70 || gramos > 300) {
      mostrarMensaje('⚠️ Peso inválido. Debe ser entre 70g y 300g', 'error');
      return;
    }
    const valorKg = gramos / 1000;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pesaje`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY
        },
        body: JSON.stringify({ peso: valorKg }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail?.[0]?.msg || err.detail || 'Error al registrar');
      }
      mostrarMensaje(`✅ Registrado: ${gramos}g`, 'ok');
      setPeso('');
      setAnimateAvg(true);
      setTimeout(() => setAnimateAvg(false), 600);
      await fetchMedia(); fetchDashboardStats();
    } catch (err) {
      mostrarMensaje(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const registrarManual = async (manualPeso, manualFecha) => {
    const gramos = parseInt(manualPeso, 10);
    if (isNaN(gramos) || gramos < 70 || gramos > 300) {
      mostrarMensaje('⚠️ Peso inválido. Debe ser entre 70g y 300g', 'error');
      return;
    }
    const valorKg = gramos / 1000;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pesaje/manual`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY
        },
        body: JSON.stringify({ peso: valorKg, fecha: manualFecha }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail?.[0]?.msg || err.detail || 'Error al registrar');
      }
      mostrarMensaje(`✅ Registrado Manual: ${gramos}g`, 'ok');
      await fetchMedia(); fetchDashboardStats();
    } catch (err) {
      mostrarMensaje(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async () => {
    try {
      let urlPDF = `${API_URL}/reporte`;
      if (repMes) {
        const [anio, mes] = repMes.split('-');
        urlPDF += `?anio=${anio}&mes=${mes}`;
      }

      const res = await fetch(urlPDF);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al generar reporte');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      let nombreMes = '';
      let anioMes = '';
      if (repMes) {
        const obj = meses.find(m => `${m.anio}-${m.mes}` === repMes);
        if (obj) {
          nombreMes = obj.nombre.split(' ')[0].toLowerCase();
          anioMes = obj.anio;
        }
      } else {
        const ahora = new Date();
        const mesesNombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        nombreMes = mesesNombres[ahora.getMonth()];
        anioMes = ahora.getFullYear();
      }

      a.download = `reporte_${nombreMes}_${anioMes}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      mostrarMensaje('📄 Reporte descargado exitosamente', 'ok');
    } catch (err) {
      mostrarMensaje(`❌ ${err.message}`, 'error');
    }
  };

  const eliminarDatos = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro de que quieres ELIMINAR todos los registros? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`${API_URL}/reset`, { 
        method: 'DELETE',
        headers: { 'X-API-KEY': API_KEY }
      });
      const data = await res.json();
      mostrarMensaje(`🗑️ ${data.mensaje}`, 'ok');
      setAnimateAvg(true);
      setTimeout(() => setAnimateAvg(false), 600);
      await fetchMedia(); fetchDashboardStats();
    } catch (err) {
      mostrarMensaje(`❌ ${err.message}`, 'error');
    }
  };

  const navigateTo = (newView) => {
    setView(newView);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center bg-crema px-4 py-6 select-none relative font-sans">
      
      <Nav 
        view={view} 
        navigateTo={navigateTo} 
        isMenuOpen={isMenuOpen} 
        toggleMenu={() => setIsMenuOpen(!isMenuOpen)} 
      />

      <Toast mensaje={mensaje} tipoMensaje={tipoMensaje} />

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

      <footer className="w-full max-w-md mt-6 pb-4 flex flex-col items-center gap-2">
        <p className="text-[10px] text-marron/30 font-bold uppercase tracking-widest">
          Sistema de Control de Calidad v2.1
        </p>
        <Analytics />
      </footer>
    </div>
  );
}

export default App;
