import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, DollarSign, User, Calendar } from 'lucide-react';

export default function Layaways() {
  const [layaways, setLayaways] = useState<any[]>([]);

  useEffect(() => {
    // Mock data for layaways
    setLayaways([
      { id: 1, customer: 'María García', total: 1200, deposit: 500, balance: 700, date: '2024-02-15', status: 'pending' },
      { id: 2, customer: 'Roberto Sánchez', total: 850, deposit: 850, balance: 0, date: '2024-02-20', status: 'paid' },
      { id: 3, customer: 'Ana López', total: 2100, deposit: 1000, balance: 1100, date: '2024-02-10', status: 'cancelled' },
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-indigo-50 border-indigo-100">
          <p className="text-sm text-indigo-600 font-medium mb-1">Total por Cobrar</p>
          <h3 className="text-2xl font-bold text-indigo-900">$1,800.00</h3>
        </div>
        <div className="card p-6 bg-emerald-50 border-emerald-100">
          <p className="text-sm text-emerald-600 font-medium mb-1">Liquidados este mes</p>
          <h3 className="text-2xl font-bold text-emerald-900">12</h3>
        </div>
        <div className="card p-6 bg-rose-50 border-rose-100">
          <p className="text-sm text-rose-600 font-medium mb-1">Vencidos/Pendientes</p>
          <h3 className="text-2xl font-bold text-rose-900">5</h3>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Anticipo</th>
                <th className="px-6 py-4 font-semibold">Saldo</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {layaways.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center">
                        <User size={14} />
                      </div>
                      <span className="font-medium text-slate-900">{l.customer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{l.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">${l.total}</td>
                  <td className="px-6 py-4 text-emerald-600 font-medium">${l.deposit}</td>
                  <td className="px-6 py-4 text-rose-600 font-bold">${l.balance}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      l.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                      l.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {l.status === 'paid' ? 'Liquidado' : l.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {l.status === 'pending' && (
                        <button className="btn-primary py-1 px-3 text-xs">Liquidar</button>
                      )}
                      <button className="p-1 text-slate-400 hover:text-slate-600"><Clock size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
