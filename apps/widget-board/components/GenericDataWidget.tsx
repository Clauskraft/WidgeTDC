import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export interface GenericDataWidgetConfig {
    data?: any;
    visualizationType?: 'table' | 'list' | 'bar' | 'line' | 'pie';
    chartCategoryKey?: string;
    chartValueKeys?: string[];
    pieValueKey?: string;
}

export const GenericDataWidget: React.FC<{ config: GenericDataWidgetConfig }> = ({ config }) => {
    if (!config || !config.data) {
        return <div className="text-muted-foreground p-4">No data configured for this widget.</div>;
    }

    const barColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

    switch (config.visualizationType) {
        case 'table':
            if (!Array.isArray(config.data) || config.data.length === 0) {
                return <div className="text-muted-foreground">Table view requires a non-empty array of objects.</div>;
            }
            const headers = Object.keys(config.data[0]);
            return (
                <div className="overflow-auto h-full">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-background/50 sticky top-0">
                            <tr>{headers.map(h => <th key={h} scope="col" className="px-4 py-2 border-b border-border">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {config.data.map((row: any, index: number) => (
                                <tr key={index} className="border-b border-border/50 hover:bg-accent/50">
                                    {headers.map(h => <td key={h} className="px-4 py-2 align-top">{String(row[h])}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        case 'list':
            if (!Array.isArray(config.data)) {
                return <div className="text-muted-foreground">List view requires an array.</div>;
            }
            return (
                <ul className="space-y-3 p-2 overflow-auto h-full">
                    {config.data.map((item: any, i: number) => (
                        <li key={i} className="p-3 bg-background/50 border border-border/50 rounded-lg text-sm">
                            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                        </li>
                    ))}
                </ul>
            );
        case 'bar':
        case 'line': {
            if (!Array.isArray(config.data) || config.data.length === 0) return <div className="text-muted-foreground p-4">Chart view requires a non-empty array of objects.</div>;
            const sample = config.data[0];
            if (typeof sample !== 'object' || sample === null) return <div className="text-muted-foreground p-4">Chart data must be an array of objects.</div>;

            const nameKey = config.chartCategoryKey || Object.keys(sample).find(key => typeof sample[key] === 'string');
            const valueKeys = config.chartValueKeys && config.chartValueKeys.length > 0 ? config.chartValueKeys : Object.keys(sample).filter(key => typeof sample[key] === 'number');

            if (!nameKey || valueKeys.length === 0) return <div className="text-muted-foreground p-4 text-center text-xs">Chart requires one text column and at least one number column.</div>;

            const ChartComponent = config.visualizationType === 'bar' ? BarChart : LineChart;
            const ChartElement = config.visualizationType === 'bar' ? Bar : Line;

            return (
                <ResponsiveContainer width="100%" height="100%">
                    <ChartComponent data={config.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis dataKey={nameKey} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} labelStyle={{ color: '#f1f5f9' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        {valueKeys.map((key, index) => <ChartElement key={key} dataKey={key} stroke={barColors[index % barColors.length]} fill={barColors[index % barColors.length]} />)}
                    </ChartComponent>
                </ResponsiveContainer>
            );
        }
        case 'pie': {
            if (!Array.isArray(config.data) || config.data.length === 0) return <div className="text-muted-foreground p-4">Chart view requires a non-empty array of objects.</div>;
            const sample = config.data[0];
            if (typeof sample !== 'object' || sample === null) return <div className="text-muted-foreground p-4">Chart data must be an array of objects.</div>;

            const nameKey = config.chartCategoryKey || Object.keys(sample).find(key => typeof sample[key] === 'string');
            const valueKey = config.pieValueKey || Object.keys(sample).find(key => typeof sample[key] === 'number');

            if (!nameKey || !valueKey) return <div className="text-muted-foreground p-4 text-center text-xs">Pie chart requires one text column and one number column.</div>;

            return (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={config.data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                            {config.data.map((entry, index) => <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            );
        }
        default:
            return <pre className="text-xs whitespace-pre-wrap p-2 overflow-auto h-full">{JSON.stringify(config.data, null, 2)}</pre>;
    }
};