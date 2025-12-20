"use client";

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface WeeklyChartProps {
    data: {
        day: string;
        temperature: number;
        cleaning: number;
        conformity: number;
    }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
    const chartData = useMemo(() => {
        if (data.length === 0) {
            // Default data for demonstration
            return [
                { day: 'Lun', temperature: 95, cleaning: 100, conformity: 97 },
                { day: 'Mar', temperature: 88, cleaning: 90, conformity: 89 },
                { day: 'Mer', temperature: 92, cleaning: 85, conformity: 88 },
                { day: 'Jeu', temperature: 100, cleaning: 95, conformity: 97 },
                { day: 'Ven', temperature: 96, cleaning: 100, conformity: 98 },
                { day: 'Sam', temperature: 94, cleaning: 88, conformity: 91 },
                { day: 'Dim', temperature: 98, cleaning: 92, conformity: 95 },
            ];
        }
        return data;
    }, [data]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl">
                    <p className="text-xs font-mono text-slate-400 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-400">{entry.name}:</span>
                            <span className="text-white font-bold">{entry.value}%</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#00ff9d]/10">
                        <TrendingUp className="h-5 w-5 text-[#00ff9d]" />
                    </div>
                    <div>
                        <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                            Conformité Semaine
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono">7 derniers jours</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-[10px] text-slate-500 font-mono">T°</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="text-[10px] text-slate-500 font-mono">Nettoyage</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#00ff9d]" />
                        <span className="text-[10px] text-slate-500 font-mono">Global</span>
                    </div>
                </div>
            </div>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCleaning" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorConformity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                            domain={[60, 100]}
                            ticks={[60, 80, 100]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="temperature"
                            name="Température"
                            stroke="#60a5fa"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorTemp)"
                        />
                        <Area
                            type="monotone"
                            dataKey="cleaning"
                            name="Nettoyage"
                            stroke="#c084fc"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorCleaning)"
                        />
                        <Area
                            type="monotone"
                            dataKey="conformity"
                            name="Conformité"
                            stroke="#00ff9d"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorConformity)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
