export default function HomeView({ peso, media, suma, total, loading, animateAvg, onRegistrator, onAddDigit, onDelete, onClear }) {
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
