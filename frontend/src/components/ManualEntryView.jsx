import { useState } from 'react';
import { PlusCircle, Calendar } from 'lucide-react';

export default function ManualEntryView({ onRegister, loading }) {
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
