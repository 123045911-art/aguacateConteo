import { TrendingUp, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardView({ stats, period, setPeriod }) {
  if (!stats || !stats.graph_data || stats.graph_data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-crema-oscuro p-4 flex gap-2 overflow-x-auto">
          {['month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-verde-oscuro text-white shadow-md' : 'bg-crema text-marron/50 hover:bg-crema-oscuro'}`}
            >
              {p === 'month' ? 'Mes' : 'Año'}
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

  const formatXAxis = (val) => {
    if (period === 'year') return val;
    if (period === 'month') {
      const item = stats.graph_data.find(d => d.fecha === val);
      return item ? item.label.split(' ')[0].substring(0, 3) : val;
    }
    return val;
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out] space-y-6">
      <div className="bg-white rounded-3xl border border-crema-oscuro p-2 flex gap-2 shadow-sm">
        {['month', 'year'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-verde-oscuro text-white shadow-md' : 'text-marron/50 hover:bg-crema/50'}`}
          >
            {p === 'month' ? 'Por Mes' : 'Por Año'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-crema-oscuro shadow-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-verde-oscuro uppercase tracking-tight flex items-center gap-2">
            <TrendingUp size={20} /> {period === 'month' ? 'Tendencia Mensual' : 'Tendencia Anual'}
          </h2>
          <span className="text-[10px] font-bold text-marron/40 bg-crema px-2 py-1 rounded-full capitalize">
            {period === 'month' ? 'Últimos 12 meses' : 'Histórico Anual'}
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
          🥇 Top 5 Medias {period === 'month' ? 'Mensuales' : 'Anuales'}
        </h2>
        <div className="space-y-3">
          {stats.top_five.map((item, index) => (
            <div key={item.fecha} className="flex items-center gap-4 p-4 rounded-2xl bg-crema/30 border border-crema-oscuro transition-all hover:bg-crema">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-sm filter drop-shadow-sm ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500' : index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' : index === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 'bg-verde-medio/80'}`}>
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
