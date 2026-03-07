import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Package, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DashboardStats } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(setStats);
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-full">Cargando...</div>;

  const cards = [
    { 
      label: 'Ventas Hoy', 
      value: `$${stats.sales_today.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'bg-emerald-500',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'Gastos Hoy', 
      value: `$${stats.expenses_today.toFixed(2)}`, 
      icon: TrendingUp, 
      color: 'bg-rose-500',
      trend: '+5%',
      trendUp: false
    },
    { 
      label: 'Stock Bajo', 
      value: stats.low_stock.toString(), 
      icon: AlertTriangle, 
      color: 'bg-amber-500',
      alert: stats.low_stock > 0
    },
    { 
      label: 'Apartados Pendientes', 
      value: stats.pending_layaways.toString(), 
      icon: Package, 
      color: 'bg-indigo-500' 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="card p-6 flex items-center space-x-4">
            <div className={`p-3 rounded-xl text-white ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{card.label}</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
                {card.trend && (
                  <span className={`text-xs font-medium flex items-center ${card.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {card.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {card.trend}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Ventas Recientes</h3>
            <button className="text-sm text-indigo-600 font-medium hover:underline">Ver todas</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Cliente</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Método</th>
                  <th className="pb-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <tr key={i} className="text-sm">
                    <td className="py-4 font-medium text-slate-600">#1234{i}</td>
                    <td className="py-4 text-slate-900">Juan Pérez</td>
                    <td className="py-4 font-bold">$450.00</td>
                    <td className="py-4 text-slate-600">Efectivo</td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Completado</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-slate-800 mb-6">Alertas de Stock</h3>
          <div className="space-y-4">
            {stats.low_stock === 0 ? (
              <p className="text-sm text-slate-500 italic">No hay alertas de stock bajo.</p>
            ) : (
              [1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                      <Package size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Proteína Whey 2kg</p>
                      <p className="text-xs text-rose-600 font-medium">Quedan: 2 unidades</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-indigo-600 hover:underline">Pedir</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
