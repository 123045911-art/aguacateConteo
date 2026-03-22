import { useState } from 'react';
import { PlusCircle, Calendar } from 'lucide-react';

export default function ManualEntryView({ onRegister, loading, fila, setFila, arbol, setArbol }) {
  const [peso, setPeso] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = (e) => {
    e.preventDefault()
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-marron/60 uppercase tracking-widest mb-2">Hilera (Fila)</label>
              <select 
                value={fila} 
                onChange={(e) => {
                  setFila(e.target.value);
                  setArbol('');
                }}
                className="w-full bg-crema/30 border-2 border-crema-oscuro rounded-2xl px-4 py-3.5 text-sm font-bold text-verde-oscuro outline-none transition-colors appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
              >
                <option value="">Seleccionar Fila</option>
                <option value="A">Fila A</option>
                <option value="B">Fila B</option>
                <option value="C">Fila C</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-marron/60 uppercase tracking-widest mb-2"># Árbol</label>
              <select 
                value={arbol} 
                onChange={(e) => setArbol(e.target.value)}
                disabled={!fila}
                className={`w-full bg-crema/30 border-2 border-crema-oscuro rounded-2xl px-4 py-3.5 text-sm font-bold text-verde-oscuro outline-none transition-colors appearance-none ${!fila ? 'opacity-50 grayscale' : ''}`}
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
              >
                <option value="">Seleccionar Árbol</option>
                {Array.from({ length: fila === 'A' ? 23 : (fila ? 24 : 0) }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Árbol {i + 1}</option>
                ))}
              </select>
            </div>
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
