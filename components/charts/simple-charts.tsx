'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

const COLORS = ['#E8963C', '#12897B', '#4A4F62', '#EDAF61', '#57B6A6', '#9BA1B0'];

export function RevenueBarChart({ data }: { data: { day: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E6EA" vertical={false} />
        <XAxis
          dataKey="day"
          tickFormatter={(v: string) => v.slice(5)}
          tick={{ fontSize: 11, fill: '#9BA1B0' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: '#9BA1B0' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          formatter={(value) => [`₹${value ?? 0}`, 'Revenue'] as [string, string]}
          contentStyle={{ borderRadius: 12, border: '1px solid #E4E6EA', fontSize: 12 }}
        />
        <Bar dataKey="revenue" fill="#E8963C" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data }: { data: { status: string; count: number }[] }) {
  if (data.every((d) => d.count === 0)) {
    return <p className="py-10 text-center text-sm text-ink-300">No data yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E4E6EA', fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PopularItemsBarChart({ data }: { data: { name: string; totalQty: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-300">No orders yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <XAxis type="number" tick={{ fontSize: 11, fill: '#9BA1B0' }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#4A4F62' }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E4E6EA', fontSize: 12 }} />
        <Bar dataKey="totalQty" fill="#12897B" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
