import React, { useState, useEffect } from 'react';
import { History, ArrowUpRight, ArrowDownRight, Filter, Download } from 'lucide-react';

export default function Inventory() {
  const [movements, setMovements] = useState<any[]>([]);

  useEffect(() => {
    // In a real app, we'd fetch movements from the API
    // For now, let's mock some data
    setMovements([
      { id: 1, product: 'Proteína Whey 2kg', type: 'in', quantity: 10, reason: 'Compra a proveedor', user: 'Admin', date: '2024-03-01 10:00' },
      { id: 2, product: 'Creatina 300g', type: 'out', quantity: 1, reason: 'Venta #1234', user: 'Cajero 1', date: '2024-03-01 11:30' },
      { id: 3, product: 'Shaker Pro', type: 'waste', quantity: 1, reason: 'Dañado en almacén', user: 'Admin', date: '2024-03-01 12:15' },
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button className="btn-secondary flex items-center space-x-2">
            <Filter size={18} />
            <span>Filtrar</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Historial de Movimientos</h3>
          <span className="text-xs text-slate-500">Mostrando últimos 50 movimientos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Producto</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Cant.</th>
                <th className="px-6 py-4 font-semibold">Motivo</th>
                <th className="px-6 py-4 font-semibold">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {movements.map((m) => (
                <tr key={m.id} className="text-sm hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{m.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{m.product}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center space-x-1 font-medium ${
                      m.type === 'in' ? 'text-emerald-600' : 
                      m.type === 'out' ? 'text-blue-600' : 'text-rose-600'
                    }`}>
                      {m.type === 'in' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span className="capitalize">
                        {m.type === 'in' ? 'Entrada' : m.type === 'out' ? 'Salida' : 'Merma'}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">{m.quantity}</td>
                  <td className="px-6 py-4 text-slate-600">{m.reason}</td>
                  <td className="px-6 py-4 text-slate-500">{m.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
