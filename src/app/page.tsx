export default function Home() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Activos</h2>
          <p className="text-slate-500 mt-1">Gestiona todos los vehículos, máquinas y equipos de tu empresa.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
          + Nuevo Activo
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium">Total Activos</h3>
          <p className="text-3xl font-bold mt-2 text-slate-900">124</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium">En Mantenimiento</h3>
          <p className="text-3xl font-bold mt-2 text-amber-600">8</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium">Alertas</h3>
          <p className="text-3xl font-bold mt-2 text-red-600">3</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Activos Recientes</h3>
        </div>
        <div className="p-8 text-center text-slate-500">
          <p>No hay activos registrados aún.</p>
        </div>
      </div>
    </div>
  );
}
