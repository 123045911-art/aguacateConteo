export default function HistoryView({ meses, repMes, setRepMes, onDownload, onReset }) {
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
