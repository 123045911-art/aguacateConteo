export default function Toast({ mensaje, tipoMensaje }) {
  if (!mensaje) return null;
  return (
    <div className={`w-full max-w-md mb-4 px-4 py-3 rounded-xl text-sm font-semibold text-center border animate-[fadeIn_0.2s_ease-out] ${tipoMensaje === 'ok' ? 'bg-verde-oscuro/10 text-verde-oscuro border-verde-oscuro/20' : 'bg-red-50 text-red-700 border-red-200'}`}>
      {mensaje}
    </div>
  );
}
