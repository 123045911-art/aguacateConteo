import { Menu, X } from 'lucide-react';

export default function Nav({ view, navigateTo, isMenuOpen, toggleMenu }) {
  return (
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
                Calculadora de Pesos
              </button>
              <button 
                onClick={() => navigateTo('manual')}
                className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm font-bold transition-colors ${view === 'manual' ? 'bg-verde-oscuro text-white' : 'text-marron hover:bg-crema'}`}
              >
                Registro Manual
              </button>
              <button 
                onClick={() => navigateTo('dashboard')}
                className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm font-bold transition-colors ${view === 'dashboard' ? 'bg-verde-oscuro text-white' : 'text-marron hover:bg-crema'}`}
              >
                Dashboard Estadístico
              </button>
              <div className="h-px bg-crema-oscuro my-1" />
              <button 
                onClick={() => navigateTo('history')}
                className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm font-bold transition-colors ${view === 'history' ? 'bg-verde-oscuro text-white' : 'text-marron hover:bg-crema'}`}
              >
                Historial y Reportes
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
