import React from 'react';
import { InventoryStats } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { Package, AlertTriangle, ShoppingCart, Truck } from 'lucide-react';

interface DashboardProps {
  stats: InventoryStats;
}

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color} text-white`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const chartData = [
    { name: 'CEDI', stock: stats.totalWhStock },
    { name: 'Bodega 1', stock: stats.totalS1Stock },
    { name: 'Bodega 6', stock: stats.totalS2Stock },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Items" 
          value={stats.totalItems.toLocaleString()} 
          icon={<Package className="w-6 h-6" />}
          color="bg-indigo-500"
        />
        <StatCard 
          title="Below Minimum" 
          value={stats.itemsBelowMin.toLocaleString()} 
          icon={<AlertTriangle className="w-6 h-6" />}
          color="bg-amber-500"
        />
        <StatCard 
          title="P.O. Suggested" 
          value={stats.totalPoNeeded.toLocaleString()} 
          icon={<ShoppingCart className="w-6 h-6" />}
          color="bg-rose-500"
        />
        <StatCard 
          title="Total Stock" 
          value={(stats.totalWhStock + stats.totalS1Stock + stats.totalS2Stock).toLocaleString()} 
          icon={<Truck className="w-6 h-6" />}
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="stock" radius={[4, 4, 0, 0]} barSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : index === 1 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Inventory Health</h3>
            <div className="w-full flex-1 flex items-center justify-center">
                {stats.totalPoNeeded === 0 && stats.itemsBelowMin === 0 ? (
                    <div className="text-emerald-500 flex flex-col items-center">
                        <Package className="w-16 h-16 mb-2" />
                        <span className="text-xl font-medium">All Systems Go!</span>
                        <p className="text-gray-500 text-sm mt-1">Inventory is perfectly balanced.</p>
                    </div>
                ) : (
                   <div className="flex gap-8 w-full">
                      <div className="flex-1 bg-amber-50 rounded-lg p-4">
                        <p className="text-amber-800 font-bold text-2xl">{((stats.itemsBelowMin / stats.totalItems) * 100).toFixed(1)}%</p>
                        <p className="text-amber-600 text-sm">of SKUs Low</p>
                      </div>
                      <div className="flex-1 bg-rose-50 rounded-lg p-4">
                        <p className="text-rose-800 font-bold text-2xl">{stats.totalPoNeeded}</p>
                        <p className="text-rose-600 text-sm">Units to Buy</p>
                      </div>
                   </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;