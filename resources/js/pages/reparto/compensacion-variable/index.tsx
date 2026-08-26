import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    RadialLinearScale,
    Tooltip,
} from 'chart.js';
import {
    AlertTriangle,
    BarChart2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronsUpDown,
    Clock,
    DollarSign,
    Download,
    Eye,
    FileSpreadsheet,
    Filter,
    LoaderCircle,
    PieChart as RadarIcon,
    RotateCcw,
    ShieldAlert,
    Trash2,
    TrendingUp,
    Upload,
    UserCheck,
    Users,
    X,
    Activity,
} from 'lucide-react';
import React, { FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import { Bar, Line, Radar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Reparto', href: '/modules/reparto' },
    { title: 'Compensación Variable', href: '/modules/reparto/compensacion-variable' },
];

export interface CompensacionRow {
    id: number;
    anio: number | null;
    mes: string | null;
    mes2: string | null;
    regional: string | null;
    cd: string | null;
    codigo_ob: string | null;
    codigo_gp: string | null;
    identificador: string | null;
    nombre: string | null;
    cargo: string | null;
    ausencia_justificada: number;
    ausencia_injustificada: number;
    tri_fatalidades: number;
    adherencia_gp: string | null;
    market_refusals: string | null;
    porcentaje_rechazos: number;
    habilitadores: number;
    variable: string | null;
    dias_trabajados: number;
    salario_variable: number;
    pago_variable_dt: number;
    total_pago: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface CompensacionesPaginator {
    data: CompensacionRow[];
    links: PaginationLink[];
    total: number;
    current_page: number;
    per_page: number;
}

interface IndicadoresGlobales {
    total_registros: number;
    prom_rechazos: number;
    prom_adherencia_gp: number;
    prom_market_refusals: number;
    habilitador_1: number;
    habilitador_08: number;
    habilitador_0: number;
    total_salario_variable: number;
    total_pago_variable_dt: number;
    prom_dias: number;
}

interface RadarDataProps {
    anio_actual: number;
    anio_anterior: number;
    anios_disponibles: number[];
    pagos_actual: number[];
    pagos_anterior: number[];
}

interface HabilitadoresYAusenciasProps {
    habilitadores: number[];
    ausencias_justificadas: number[];
    ausencias_injustificadas: number[];
    tri_fatalidades: number[];
}

interface Catalogos {
    cargos: string[];
    identificadores: string[];
    nombres: string[];
    ausencias_justificadas: (number | string)[];
    ausencias_injustificadas: (number | string)[];
    tri_fatalidades: (number | string)[];
    adherencias_gp: string[];
    habilitadores: (number | string)[];
    market_refusals: string[];
    variables: string[];
}

interface FiltrosReales {
    fecha_desde?: string;
    fecha_hasta?: string;
    anio_radar?: number | string;
    cargo?: string | string[];
    identificador?: string | string[];
    nombre?: string | string[];
    ausencia_justificada?: string | string[];
    ausencia_injustificada?: string | string[];
    tri_fatalidades?: string | string[];
    adherencia_gp?: string | string[];
    habilitadores?: string | string[];
    market_refusals?: string | string[];
    variable?: string | string[];
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(amount);
}

// 📈 COMPONENTE GRÁFICO DE LÍNEAS PARA HABILITADORES, AUSENCIAS JUSTIFICADAS/INJUSTIFICADAS Y TRI/FATALIDADES
export function GraficoHabilitadoresYAusenciasPorDia({
    data = {
        habilitadores: [],
        ausencias_justificadas: [],
        ausencias_injustificadas: [],
        tri_fatalidades: [],
    },
    diasDisponibles = Array.from({ length: 30 }, (_, i) => i + 1),
}: {
    data?: HabilitadoresYAusenciasProps;
    diasDisponibles?: number[];
}) {
    const labels = useMemo(() => {
        const daysCount = diasDisponibles.length > 0 ? diasDisponibles.length : 30;
        return Array.from({ length: daysCount }, (_, i) => `Día ${i + 1}`);
    }, [diasDisponibles]);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Habilitadores',
                data: data.habilitadores || [],
                borderColor: '#10b981', // Verde pastel
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
            },
            {
                label: 'Aus. Justificadas',
                data: data.ausencias_justificadas || [],
                borderColor: '#f59e0b', // Ámbar pastel
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
            },
            {
                label: 'Aus. Injustificadas',
                data: data.ausencias_injustificadas || [],
                borderColor: '#ef4444', // Rojo pastel
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
            },
            {
                label: 'TRI / Fatalidades',
                data: data.tri_fatalidades || [],
                borderColor: '#f97316', // Naranja pastel
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                align: 'start' as const,
                labels: { font: { size: 9.5, weight: 'semibold' as const }, color: '#334155', usePointStyle: true, boxWidth: 6 },
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 8,
            },
        },
        scales: {
            y: { beginAtZero: true, ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: 'rgba(226, 232, 240, 0.6)' } },
            x: { ticks: { color: '#64748b', font: { size: 8.5 }, maxRotation: 45 }, grid: { display: false } },
        },
    };

    return (
        <div className="w-full space-y-2 text-left">
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                    <Activity className="size-3.5 text-indigo-500" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Línea Desempeño y Ausentismos
                    </span>
                </div>
            </div>

            <div className="h-48 md:h-56 w-full flex justify-start items-center p-1">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
}

// 📊 COMPONENTE RECHAZOS DE MERCADO POR DÍA (BAR CHART COMPACTO CON RESULTADO PEQUEÑO INTEGRADO)
export function GraficoRechazosPorDia({
    rechazosPorDia = [],
    diasDisponibles = Array.from({ length: 30 }, (_, i) => i + 1),
    promedio,
}: {
    rechazosPorDia?: number[];
    diasDisponibles?: number[];
    promedio?: number;
}) {
    const labels = useMemo(() => {
        const daysCount = diasDisponibles.length > 0 ? diasDisponibles.length : 30;
        return Array.from({ length: daysCount }, (_, i) => `Día ${i + 1}`);
    }, [diasDisponibles]);

    const safeData = useMemo(() => {
        const daysCount = diasDisponibles.length > 0 ? diasDisponibles.length : 30;
        if (Array.isArray(rechazosPorDia) && rechazosPorDia.length >= daysCount) {
            return rechazosPorDia.slice(0, daysCount);
        }
        return Array(daysCount).fill(0);
    }, [rechazosPorDia, diasDisponibles]);

    const data = {
        labels,
        datasets: [
            {
                label: 'Rechazos de Mercado (POCs)',
                data: safeData,
                backgroundColor: 'rgba(144, 202, 249, 0.65)',
                borderColor: 'rgba(33, 150, 243, 0.85)',
                borderWidth: 1.5,
                borderRadius: 5,
                hoverBackgroundColor: 'rgba(33, 150, 243, 0.9)',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                align: 'start' as const,
                labels: {
                    font: { size: 10, weight: 'semibold' as const },
                    color: '#334155',
                    usePointStyle: true,
                    boxWidth: 6,
                },
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                padding: 8,
                callbacks: {
                    label: (ctx: any) => `Rechazos: ${ctx.formattedValue}`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#64748b', font: { size: 9 } },
                grid: { color: 'rgba(226, 232, 240, 0.6)' },
            },
            x: {
                ticks: { color: '#64748b', font: { size: 8.5 }, maxRotation: 45 },
                grid: { display: false },
            },
        },
    };

    return (
        <div className="w-full space-y-2 text-left">
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                    <ShieldAlert className="size-3.5 text-amber-500" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Rechazos de Mercado (POCs)
                    </span>
                </div>

                <div className="flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 border border-amber-200 dark:border-amber-800 text-[11px]">
                    <span className="font-semibold text-amber-700 dark:text-amber-300">Rechazos:</span>
                    <strong className="font-extrabold text-amber-800 dark:text-amber-200">{promedio ?? 0} POCs</strong>
                </div>
            </div>

            <div className="h-48 md:h-56 w-full flex justify-start items-center p-1">
                <Bar data={data} options={options} />
            </div>
        </div>
    );
}

// 📊 COMPONENTE ADHERENCIA GP POR DÍA (BAR CHART COMPACTO CON RESULTADO PEQUEÑO INTEGRADO)
export function GraficoAdherenciaPorDia({
    adherenciaPorDia = [],
    diasDisponibles = Array.from({ length: 30 }, (_, i) => i + 1),
    promedio,
}: {
    adherenciaPorDia?: number[];
    diasDisponibles?: number[];
    promedio?: number;
}) {
    const labels = useMemo(() => {
        const daysCount = diasDisponibles.length > 0 ? diasDisponibles.length : 30;
        return Array.from({ length: daysCount }, (_, i) => `Día ${i + 1}`);
    }, [diasDisponibles]);

    const safeData = useMemo(() => {
        const daysCount = diasDisponibles.length > 0 ? diasDisponibles.length : 30;
        if (Array.isArray(adherenciaPorDia) && adherenciaPorDia.length >= daysCount) {
            return adherenciaPorDia.slice(0, daysCount);
        }
        return Array(daysCount).fill(0);
    }, [adherenciaPorDia, diasDisponibles]);

    const data = {
        labels,
        datasets: [
            {
                label: 'Adherencia GP (%)',
                data: safeData,
                backgroundColor: 'rgba(167, 243, 208, 0.65)',
                borderColor: 'rgba(16, 185, 129, 0.85)',
                borderWidth: 1.5,
                borderRadius: 5,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                align: 'start' as const,
                labels: { font: { size: 10, weight: 'semibold' as const }, color: '#334155', usePointStyle: true, boxWidth: 6 },
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 8,
                callbacks: { label: (ctx: any) => `Adherencia: ${ctx.formattedValue}%` },
            },
        },
        scales: {
            y: { beginAtZero: true, ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: 'rgba(226, 232, 240, 0.6)' } },
            x: { ticks: { color: '#64748b', font: { size: 8.5 }, maxRotation: 45 }, grid: { display: false } },
        },
    };

    return (
        <div className="w-full space-y-2 text-left">
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Adherencia GP por Día
                    </span>
                </div>

                <div className="flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">Adherencia GP:</span>
                    <strong className="font-extrabold text-emerald-800 dark:text-emerald-200">{promedio ?? 0}%</strong>
                </div>
            </div>

            <div className="h-48 md:h-56 w-full flex justify-start items-center p-1">
                <Bar data={data} options={options} />
            </div>
        </div>
    );
}

// 📊 COMPONENTE % RECHAZOS POR DÍA (BAR CHART COMPACTO CON RESULTADO PEQUEÑO INTEGRADO)
export function GraficoPorcentajeRechazosPorDia({
    porcentajeRechazosPorDia = [],
    diasDisponibles = Array.from({ length: 30 }, (_, i) => i + 1),
    promedio,
}: {
    porcentajeRechazosPorDia?: number[];
    diasDisponibles?: number[];
    promedio?: number;
}) {
    const labels = useMemo(() => {
        const daysCount = diasDisponibles.length > 0 ? diasDisponibles.length : 30;
        return Array.from({ length: daysCount }, (_, i) => `Día ${i + 1}`);
    }, [diasDisponibles]);

    const safeData = useMemo(() => {
        const daysCount = diasDisponibles.length > 0 ? diasDisponibles.length : 30;
        if (Array.isArray(porcentajeRechazosPorDia) && porcentajeRechazosPorDia.length >= daysCount) {
            return porcentajeRechazosPorDia.slice(0, daysCount);
        }
        return Array(daysCount).fill(0);
    }, [porcentajeRechazosPorDia, diasDisponibles]);

    const data = {
        labels,
        datasets: [
            {
                label: '% Rechazos por Día',
                data: safeData,
                backgroundColor: 'rgba(254, 202, 202, 0.65)',
                borderColor: 'rgba(239, 68, 68, 0.85)',
                borderWidth: 1.5,
                borderRadius: 5,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                align: 'start' as const,
                labels: { font: { size: 10, weight: 'semibold' as const }, color: '#334155', usePointStyle: true, boxWidth: 6 },
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 8,
                callbacks: { label: (ctx: any) => `% Rechazos: ${ctx.formattedValue}%` },
            },
        },
        scales: {
            y: { beginAtZero: true, ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: 'rgba(226, 232, 240, 0.6)' } },
            x: { ticks: { color: '#64748b', font: { size: 8.5 }, maxRotation: 45 }, grid: { display: false } },
        },
    };

    return (
        <div className="w-full space-y-2 text-left">
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-rose-500" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        % Rechazos por Día
                    </span>
                </div>

                <div className="flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 border border-rose-200 dark:border-rose-800 text-[11px]">
                    <span className="font-semibold text-rose-700 dark:text-rose-300">% Rechazos:</span>
                    <strong className="font-extrabold text-rose-800 dark:text-rose-200">{promedio ?? 0}%</strong>
                </div>
            </div>

            <div className="h-48 md:h-56 w-full flex justify-start items-center p-1">
                <Bar data={data} options={options} />
            </div>
        </div>
    );
}

// 📊 COMPONENTE RADAR CHART COMPACTO
export function RadarPagosMensuales({
    pagosActual = [],
    pagosAnterior = [],
    anioActual = new Date().getFullYear(),
    anioAnterior = new Date().getFullYear() - 1,
    aniosDisponibles = [],
    onAnioChange,
}: {
    pagosActual?: number[];
    pagosAnterior?: number[];
    anioActual?: number;
    anioAnterior?: number;
    aniosDisponibles?: number[];
    onAnioChange?: (anio: number) => void;
}) {
    const labels = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const safePagosActual = useMemo(() => {
        if (Array.isArray(pagosActual) && pagosActual.length === 12) return pagosActual;
        return Array(12).fill(0);
    }, [pagosActual]);

    const safePagosAnterior = useMemo(() => {
        if (Array.isArray(pagosAnterior) && pagosAnterior.length === 12) return pagosAnterior;
        return Array(12).fill(0);
    }, [pagosAnterior]);

    const data = {
        labels,
        datasets: [
            {
                label: `Año ${anioActual} (Verde)`,
                data: safePagosActual,
                backgroundColor: 'rgba(52, 211, 153, 0.25)',
                borderColor: '#34d399',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#34d399',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2,
            },
            {
                label: `Año ${anioAnterior} (Azul)`,
                data: safePagosAnterior,
                backgroundColor: 'rgba(96, 165, 250, 0.20)',
                borderColor: '#60a5fa',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#60a5fa',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1200,
            easing: 'easeOutQuart' as const,
        },
        scales: {
            r: {
                beginAtZero: true,
                ticks: {
                    backdropColor: 'transparent',
                    font: { size: 9, weight: 'bold' as const },
                    color: '#64748b',
                },
                grid: {
                    color: 'rgba(226, 232, 240, 0.6)',
                },
                angleLines: {
                    color: 'rgba(226, 232, 240, 0.6)',
                },
                pointLabels: {
                    font: { size: 10, weight: 'bold' as const },
                    color: '#1e293b',
                },
            },
        },
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                align: 'start' as const,
                labels: {
                    font: { size: 10, weight: 'semibold' as const },
                    usePointStyle: true,
                    boxWidth: 6,
                    padding: 10,
                },
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#ffffff',
                titleFont: { size: 11, weight: 'bold' as const },
                bodyColor: '#e2e8f0',
                bodyFont: { size: 11 },
                borderColor: '#475569',
                borderWidth: 1,
                padding: 8,
                boxPadding: 4,
                usePointStyle: true,
                callbacks: {
                    label: (context: any) => {
                        const label = context.dataset.label || '';
                        const val = formatCurrency(context.raw);
                        return ` ${label}: ${val}`;
                    },
                },
            },
        },
    };

    return (
        <div className="space-y-2 text-left">
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5 text-left">
                    <RadarIcon className="size-3.5 text-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Comparativa de Pago Variable
                    </span>
                </div>

                {onAnioChange && aniosDisponibles.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px]">
                        <label className="font-semibold text-slate-500">Año:</label>
                        <select
                            value={anioActual}
                            onChange={(e) => onAnioChange(Number(e.target.value))}
                            className="h-6 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-1.5 py-0 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shadow-2xs cursor-pointer focus:ring-1 focus:ring-emerald-500 outline-none"
                        >
                            {aniosDisponibles.map((yr) => (
                                <option key={yr} value={yr}>
                                    {yr}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="h-48 md:h-56 w-full flex justify-start items-center p-1">
                <Radar data={data} options={options} />
            </div>
        </div>
    );
}

// Friendly Date/Month Picker Component
function FriendlyMonthPicker({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
}) {
    return (
        <div className="w-full">
            <label className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1 flex items-center gap-1">
                <Calendar className="size-3.5 text-emerald-600" /> {label}
            </label>
            <div className="relative">
                <input
                    type="month"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-hidden font-medium cursor-pointer"
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        title="Limpiar fecha"
                        className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="size-3" />
                    </button>
                )}
            </div>
        </div>
    );
}

// Multi-Select Searchable Component with Direct Typing in Box & Checklist
function MultiSelectSearchable({
    label,
    placeholder,
    selectedValues = [],
    options = [],
    onChange,
    formatOption,
    labelColorClass = 'text-slate-500',
}: {
    label?: string;
    placeholder: string;
    selectedValues: string[];
    options: (string | number)[];
    onChange: (values: string[]) => void;
    formatOption?: (val: string | number) => string;
    labelColorClass?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;
        const q = search.toLowerCase();
        return options.filter((opt) => String(opt).toLowerCase().includes(q));
    }, [options, search]);

    const toggleOption = (optVal: string) => {
        const exists = selectedValues.includes(optVal);
        const newSelected = exists
            ? selectedValues.filter((v) => v !== optVal)
            : [...selectedValues, optVal];
        onChange(newSelected);
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
        setSearch('');
    };

    const selectAllFiltered = () => {
        const allFilteredVals = filteredOptions.map((opt) => String(opt));
        const combined = Array.from(new Set([...selectedValues, ...allFilteredVals]));
        onChange(combined);
    };

    const getDisplayText = () => {
        if (selectedValues.length === 0) return '';
        if (selectedValues.length === 1) {
            const singleVal = selectedValues[0];
            return formatOption ? formatOption(singleVal) : singleVal;
        }
        return `${selectedValues.length} seleccionados`;
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && <label className={`text-[11px] font-semibold block mb-1 ${labelColorClass}`}>{label}</label>}
            
            {/* Direct Input Trigger Box */}
            <div
                onClick={() => {
                    setOpen(true);
                    inputRef.current?.focus();
                }}
                className="flex h-8 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-text focus-within:ring-1 focus-within:ring-emerald-500"
            >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {selectedValues.length > 1 && !open && (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1.5 py-0 shrink-0">
                            {selectedValues.length}
                        </Badge>
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={open ? `Escribir para buscar ${placeholder.toLowerCase()}...` : (getDisplayText() || placeholder)}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            if (!open) setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        className="w-full bg-transparent border-0 p-0 text-xs text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 font-medium truncate"
                    />
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                    {selectedValues.length > 0 && (
                        <span onClick={clearAll} title="Limpiar selección" className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
                            <X className="size-3" />
                        </span>
                    )}
                    <ChevronsUpDown className="size-3.5 opacity-50 text-slate-400 cursor-pointer" />
                </div>
            </div>

            {/* Checklist Dropdown Panel */}
            {open && (
                <div className="absolute left-0 z-50 mt-1 max-h-60 w-full min-w-[180px] overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95">
                    {/* Checkbox Quick Actions */}
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-500 border-b border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={selectAllFiltered} className="hover:text-emerald-600 font-medium">
                            Marcar todos ({filteredOptions.length})
                        </button>
                        {selectedValues.length > 0 && (
                            <button type="button" onClick={() => onChange([])} className="hover:text-rose-600 font-medium">
                                Limpiar ({selectedValues.length})
                            </button>
                        )}
                    </div>

                    {/* Checklist Options */}
                    <div className="max-h-44 overflow-y-auto py-1 text-xs space-y-0.5">
                        {filteredOptions.length === 0 ? (
                            <div className="px-2 py-2 text-center text-slate-400 text-[11px]">Sin coincidencias</div>
                        ) : (
                            filteredOptions.map((opt, idx) => {
                                const strVal = String(opt);
                                const isChecked = selectedValues.includes(strVal);
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => toggleOption(strVal)}
                                        className={`flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 select-none ${
                                            isChecked ? 'font-bold text-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40' : 'text-slate-700 dark:text-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {}}
                                                className="size-3.5 rounded-xs border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span className="truncate">{formatOption ? formatOption(opt) : strVal}</span>
                                        </div>
                                        {isChecked && <Check className="size-3.5 text-emerald-600 shrink-0" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Indicator Stat Card Component (Más pequeño y compacto)
function StatCard({
    title,
    value,
    subtext,
    icon: Icon,
    color,
    bgColor,
}: {
    title: string;
    value: string | number;
    subtext?: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}) {
    return (
        <div className="flex flex-col justify-between rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider truncate">{title}</span>
                <div className="rounded-md p-1 shrink-0" style={{ backgroundColor: bgColor, color: color }}>
                    <Icon className="size-3.5" />
                </div>
            </div>
            <div className="mt-1.5">
                <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">{value}</div>
                {subtext && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{subtext}</p>}
            </div>
        </div>
    );
}

export default function CompensacionVariableIndex({
    data,
    indicadores,
    radar_data,
    rechazos_por_dia = [],
    adherencia_por_dia = [],
    porcentaje_rechazos_por_dia = [],
    habilitadores_y_ausencias_por_dia = {
        habilitadores: [],
        ausencias_justificadas: [],
        ausencias_injustificadas: [],
        tri_fatalidades: [],
    },
    dias_disponibles = Array.from({ length: 30 }, (_, i) => i + 1),
    filters,
    catalogos,
}: {
    data: CompensacionesPaginator;
    indicadores: IndicadoresGlobales;
    radar_data?: RadarDataProps;
    rechazos_por_dia?: number[];
    adherencia_por_dia?: number[];
    porcentaje_rechazos_por_dia?: number[];
    habilitadores_y_ausencias_por_dia?: HabilitadoresYAusenciasProps;
    dias_disponibles?: number[];
    filters: FiltrosReales;
    catalogos: Catalogos;
}) {
    const { flash } = usePage<{ flash?: { status?: { message: string; type: string } } }>().props;

    const parseFilterArray = (val: string | string[] | undefined): string[] => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        return val.split(',').map((s) => s.trim()).filter(Boolean);
    };

    const [formFilters, setFormFilters] = useState<{
        fecha_desde: string;
        fecha_hasta: string;
        anio_radar?: number | string;
        cargo: string[];
        identificador: string[];
        nombre: string[];
        ausencia_justificada: string[];
        ausencia_injustificada: string[];
        tri_fatalidades: string[];
        adherencia_gp: string[];
        habilitadores: string[];
        market_refusals: string[];
        variable: string[];
    }>({
        fecha_desde: (filters.fecha_desde as string) || '',
        fecha_hasta: (filters.fecha_hasta as string) || '',
        anio_radar: filters.anio_radar || radar_data?.anio_actual || new Date().getFullYear(),
        cargo: parseFilterArray(filters.cargo),
        identificador: parseFilterArray(filters.identificador),
        nombre: parseFilterArray(filters.nombre),
        ausencia_justificada: parseFilterArray(filters.ausencia_justificada),
        ausencia_injustificada: parseFilterArray(filters.ausencia_injustificada),
        tri_fatalidades: parseFilterArray(filters.tri_fatalidades),
        adherencia_gp: parseFilterArray(filters.adherencia_gp),
        habilitadores: parseFilterArray(filters.habilitadores),
        market_refusals: parseFilterArray(filters.market_refusals),
        variable: parseFilterArray(filters.variable),
    });

    const [selectedRow, setSelectedRow] = useState<CompensacionRow | null>(null);
    const [detailHistory, setDetailHistory] = useState<CompensacionRow[]>([]);
    const [detailRadarData, setDetailRadarData] = useState<RadarDataProps | null>(null);
    const [detailRechazosPorDia, setDetailRechazosPorDia] = useState<number[]>([]);
    const [detailAdherenciaPorDia, setDetailAdherenciaPorDia] = useState<number[]>([]);
    const [detailPorcentajeRechazosPorDia, setDetailPorcentajeRechazosPorDia] = useState<number[]>([]);
    const [detailHabilitadoresYAusenciasPorDia, setDetailHabilitadoresYAusenciasPorDia] = useState<HabilitadoresYAusenciasProps>({
        habilitadores: [],
        ausencias_justificadas: [],
        ausencias_injustificadas: [],
        tri_fatalidades: [],
    });
    const [detailPromDias, setDetailPromDias] = useState<number>(0);
    const [loadingDetailHistory, setLoadingDetailHistory] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [openImportModal, setOpenImportModal] = useState(false);
    const [previewInfo, setPreviewInfo] = useState<{ count: number; colaboradores: number; headers: string[] } | null>(null);

    const { data: uploadData, setData: setUploadData, post: postImport, processing: importing, reset: resetImport } = useForm({
        archivos: [] as File[],
    });

    const executeFilterQuery = (filtersObj: typeof formFilters) => {
        const cleanParams: Record<string, string> = {};
        Object.entries(filtersObj).forEach(([k, v]) => {
            if (Array.isArray(v)) {
                if (v.length > 0) {
                    cleanParams[k] = v.join(',');
                }
            } else if (v !== '' && v !== null && v !== undefined) {
                cleanParams[k] = String(v);
            }
        });
        router.get(route('reparto.compensacion-variable.index'), cleanParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const limpiarFiltros = () => {
        const vacio = {
            fecha_desde: '', fecha_hasta: '', anio_radar: '',
            cargo: [], identificador: [], nombre: [],
            ausencia_justificada: [], ausencia_injustificada: [], tri_fatalidades: [],
            adherencia_gp: [], habilitadores: [], market_refusals: [], variable: [],
        };
        setFormFilters(vacio);
        router.get(route('reparto.compensacion-variable.index'), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleMultiSelectChange = (key: keyof typeof formFilters) => (vals: string[]) => {
        const updated = { ...formFilters, [key]: vals };
        setFormFilters(updated);
        executeFilterQuery(updated);
    };

    const handleDateInputChange = (key: 'fecha_desde' | 'fecha_hasta') => (val: string) => {
        const updated = { ...formFilters, [key]: val };
        setFormFilters(updated);
        executeFilterQuery(updated);
    };

    const handleAnioRadarChange = (yr: number) => {
        const updated = { ...formFilters, anio_radar: yr };
        setFormFilters(updated);
        executeFilterQuery(updated);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setUploadData('archivos', files);

        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const parsedData: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    if (parsedData.length > 0) {
                        const headers = (parsedData[0] || []).map((h: any) => String(h ?? '').trim());
                        const rowCount = Math.max(0, parsedData.length - 1);

                        // Find the Identificador column index
                        const idColIndex = headers.findIndex((h: string) => {
                            const norm = h.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            return norm.includes('IDENTIFICADOR') || norm === 'CEDULA' || norm === 'ID';
                        });

                        // Count unique identificadores
                        const uniqueIds = new Set<string>();
                        if (idColIndex >= 0) {
                            for (let r = 1; r < parsedData.length; r++) {
                                const val = parsedData[r]?.[idColIndex];
                                if (val !== null && val !== undefined && String(val).trim() !== '') {
                                    uniqueIds.add(String(val).trim());
                                }
                            }
                        }

                        setPreviewInfo({ count: rowCount, colaboradores: uniqueIds.size, headers });
                    }
                } catch (err) {
                    console.error('Error pre-reading Excel', err);
                }
            };
            reader.readAsBinaryString(file);
        } else {
            setPreviewInfo(null);
        }
    };

    const handleImportSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        postImport(route('reparto.compensacion-variable.importar'), {
            forceFormData: true,
            onSuccess: () => {
                resetImport();
                setPreviewInfo(null);
                setOpenImportModal(false);
            },
        });
    };

    const handleLimpiarTabla = () => {
        if (confirm('¿Está seguro de borrar todos los registros de compensación variable? Esta acción no se puede deshacer.')) {
            router.post(route('reparto.compensacion-variable.limpiar'));
        }
    };

    const handleOpenDetail = (row: CompensacionRow) => {
        setSelectedRow(row);
        setDrawerOpen(true);
        setLoadingDetailHistory(true);

        if (row.identificador) {
            fetch(route('reparto.compensacion-variable.detalle', { identificador: row.identificador }))
                .then((res) => res.json())
                .then((resData) => {
                    if (resData.registros) {
                        setDetailHistory(resData.registros);
                    } else {
                        setDetailHistory([row]);
                    }
                    if (resData.radar_data) {
                        setDetailRadarData(resData.radar_data);
                    } else {
                        setDetailRadarData(null);
                    }
                    if (resData.rechazos_por_dia) {
                        setDetailRechazosPorDia(resData.rechazos_por_dia);
                    } else {
                        setDetailRechazosPorDia([]);
                    }
                    if (resData.adherencia_por_dia) {
                        setDetailAdherenciaPorDia(resData.adherencia_por_dia);
                    } else {
                        setDetailAdherenciaPorDia([]);
                    }
                    if (resData.porcentaje_rechazos_por_dia) {
                        setDetailPorcentajeRechazosPorDia(resData.porcentaje_rechazos_por_dia);
                    } else {
                        setDetailPorcentajeRechazosPorDia([]);
                    }
                    if (resData.habilitadores_y_ausencias_por_dia) {
                        setDetailHabilitadoresYAusenciasPorDia(resData.habilitadores_y_ausencias_por_dia);
                    } else {
                        setDetailHabilitadoresYAusenciasPorDia({
                            habilitadores: [],
                            ausencias_justificadas: [],
                            ausencias_injustificadas: [],
                            tri_fatalidades: [],
                        });
                    }
                    if (resData.acumulado_mensual?.prom_dias_trabajados) {
                        setDetailPromDias(resData.acumulado_mensual.prom_dias_trabajados);
                    } else {
                        setDetailPromDias(row.dias_trabajados || 0);
                    }
                })
                .catch(() => {
                    setDetailHistory([row]);
                    setDetailRadarData(null);
                    setDetailRechazosPorDia([]);
                    setDetailAdherenciaPorDia([]);
                    setDetailPorcentajeRechazosPorDia([]);
                    setDetailHabilitadoresYAusenciasPorDia({
                        habilitadores: [],
                        ausencias_justificadas: [],
                        ausencias_injustificadas: [],
                        tri_fatalidades: [],
                    });
                    setDetailPromDias(row.dias_trabajados || 0);
                })
                .finally(() => setLoadingDetailHistory(false));
        } else {
            setDetailHistory([row]);
            setDetailRadarData(null);
            setDetailRechazosPorDia([]);
            setDetailAdherenciaPorDia([]);
            setDetailPorcentajeRechazosPorDia([]);
            setDetailHabilitadoresYAusenciasPorDia({
                habilitadores: [],
                ausencias_justificadas: [],
                ausencias_injustificadas: [],
                tri_fatalidades: [],
            });
            setDetailPromDias(row.dias_trabajados || 0);
            setLoadingDetailHistory(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Compensación Variable Semanal" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-3 md:p-5 bg-slate-50/50 dark:bg-slate-950/50">

                {/* Header Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <HeadingSmall
                        title="Compensación Variable Semanal"
                        description="Módulo Reparto → Carga, análisis de Excel e Indicadores Globales de incentivo variable por mes."
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleLimpiarTabla} disabled={indicadores.total_registros === 0}>
                            <Trash2 className="size-3.5 mr-1" />
                            Limpiar Datos
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                            <a href={route('reparto.compensacion-variable.exportar', formFilters as any)}>
                                <Download className="size-3.5 mr-1" />
                                Exportar CSV
                            </a>
                        </Button>
                        <Button variant="default" size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={() => setOpenImportModal(true)}>
                            <Upload className="size-3.5 mr-1" />
                            Subir Excel
                        </Button>
                    </div>
                </div>

                {/* Flash Message Banner */}
                {flash?.status && (
                    <div
                        className={`flex items-center justify-between rounded-lg p-3 text-xs font-medium shadow-2xs ${
                            flash.status.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {flash.status.type === 'success' ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertTriangle className="size-4 text-rose-600" />}
                            <span>{flash.status.message}</span>
                        </div>
                    </div>
                )}

                {/* Indicadores Globales Principales (Compactos y Más Pequeños) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">

                    {/* Highlight Card Total Pago Variable DT (Más compacto) */}
                    <div className="col-span-1 sm:col-span-2 flex flex-col justify-between rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 p-3 text-white shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Total Pago Variable DT</span>
                            <div className="rounded-full bg-white/20 p-1.5">
                                <DollarSign className="size-4 text-white" />
                            </div>
                        </div>
                        <div className="mt-1">
                            <h2 className="text-lg md:text-xl font-extrabold tracking-tight">{formatCurrency(indicadores.total_pago_variable_dt)}</h2>
                            <p className="text-[10px] text-emerald-100 mt-0.5">Suma total a pagar</p>
                        </div>
                    </div>

                    <StatCard
                        title="Total Salario Variable"
                        value={formatCurrency(indicadores.total_salario_variable)}
                        subtext="Base presupuestada"
                        icon={DollarSign}
                        color="#0D9488"
                        bgColor="#CCFBF1"
                    />

                    <StatCard
                        title="Total Registros"
                        value={indicadores.total_registros}
                        subtext="Colaboradores evaluados"
                        icon={Users}
                        color="#3B82F6"
                        bgColor="#DBEAFE"
                    />

                </div>

                {/* 📊 SECCIÓN DE GRÁFICOS INTERACTIVOS (INCLUYE EL NUEVO GRÁFICO DE LÍNEAS PARA HABILITADORES Y AUSENCIAS) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                    {/* RADAR CHART PASTEL COMPACTO */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
                        <RadarPagosMensuales
                            pagosActual={radar_data?.pagos_actual}
                            pagosAnterior={radar_data?.pagos_anterior}
                            anioActual={radar_data?.anio_actual}
                            anioAnterior={radar_data?.anio_anterior}
                            aniosDisponibles={radar_data?.anios_disponibles}
                            onAnioChange={handleAnioRadarChange}
                        />
                    </div>

                    {/* GRÁFICO DE LÍNEAS PARA HABILITADORES, AUSENCIAS JUSTIFICADAS/INJUSTIFICADAS Y TRI/FATALIDADES */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
                        <GraficoHabilitadoresYAusenciasPorDia
                            data={habilitadores_y_ausencias_por_dia}
                            diasDisponibles={dias_disponibles}
                        />
                    </div>

                    {/* RECHAZOS DE MERCADO (POCS) POR DÍA COMPACTO */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
                        <GraficoRechazosPorDia
                            rechazosPorDia={rechazos_por_dia}
                            diasDisponibles={dias_disponibles}
                            promedio={indicadores.prom_market_refusals}
                        />
                    </div>

                    {/* ADHERENCIA GP POR DÍA COMPACTO */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
                        <GraficoAdherenciaPorDia
                            adherenciaPorDia={adherencia_por_dia}
                            diasDisponibles={dias_disponibles}
                            promedio={indicadores.prom_adherencia_gp}
                        />
                    </div>

                    {/* % RECHAZOS POR DÍA COMPACTO */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
                        <GraficoPorcentajeRechazosPorDia
                            porcentajeRechazosPorDia={porcentaje_rechazos_por_dia}
                            diasDisponibles={dias_disponibles}
                            promedio={indicadores.prom_rechazos}
                        />
                    </div>
                </div>

                {/* PANEL DE FILTROS: AUTOCOMPLETADO DIRECTO EN CUADRO & RANGO DE FECHAS AMIGABLE */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            <Filter className="size-3.5 text-emerald-600" />
                            <span>Filtros Múltiples (Escritura Directa y Checklist)</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px] text-slate-500 hover:text-slate-800" onClick={limpiarFiltros}>
                            <RotateCcw className="size-3 mr-1" />
                            Restablecer
                        </Button>
                    </div>

                    {/* Grupo 1: Rango de Fecha Amigable y Datos de Colaborador */}
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 text-xs">
                        <FriendlyMonthPicker
                            label="Fecha Desde"
                            value={formFilters.fecha_desde}
                            onChange={handleDateInputChange('fecha_desde')}
                        />

                        <FriendlyMonthPicker
                            label="Fecha Hasta"
                            value={formFilters.fecha_hasta}
                            onChange={handleDateInputChange('fecha_hasta')}
                        />

                        <MultiSelectSearchable
                            label="Cargo"
                            placeholder="Cargo"
                            selectedValues={formFilters.cargo}
                            options={catalogos.cargos}
                            onChange={handleMultiSelectChange('cargo')}
                        />
                        <MultiSelectSearchable
                            label="Identificador"
                            placeholder="Identificador"
                            selectedValues={formFilters.identificador}
                            options={catalogos.identificadores}
                            onChange={handleMultiSelectChange('identificador')}
                        />
                        <MultiSelectSearchable
                            label="Nombre"
                            placeholder="Nombre"
                            selectedValues={formFilters.nombre}
                            options={catalogos.nombres}
                            onChange={handleMultiSelectChange('nombre')}
                        />
                    </div>

                    {/* Grupo 2: Desempeño, Ausentismos e Incentivos (Multi-Select Checklist) */}
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <MultiSelectSearchable
                            label="Aus. Justificada"
                            placeholder="Aus. Just."
                            selectedValues={formFilters.ausencia_justificada}
                            options={catalogos.ausencias_justificadas}
                            formatOption={(val) => `${val} días`}
                            onChange={handleMultiSelectChange('ausencia_justificada')}
                            labelColorClass="text-amber-600 dark:text-amber-400"
                        />
                        <MultiSelectSearchable
                            label="Aus. Injustificada"
                            placeholder="Aus. Inj."
                            selectedValues={formFilters.ausencia_injustificada}
                            options={catalogos.ausencias_injustificadas}
                            formatOption={(val) => `${val} días`}
                            onChange={handleMultiSelectChange('ausencia_injustificada')}
                            labelColorClass="text-rose-600 dark:text-rose-400"
                        />
                        <MultiSelectSearchable
                            label="TRI / Fatalidades"
                            placeholder="TRI / Fat."
                            selectedValues={formFilters.tri_fatalidades}
                            options={catalogos.tri_fatalidades}
                            onChange={handleMultiSelectChange('tri_fatalidades')}
                            labelColorClass="text-orange-600 dark:text-orange-400"
                        />
                        <MultiSelectSearchable
                            label="Adherencia GP"
                            placeholder="Adherencia GP"
                            selectedValues={formFilters.adherencia_gp}
                            options={catalogos.adherencias_gp}
                            onChange={handleMultiSelectChange('adherencia_gp')}
                            labelColorClass="text-emerald-600 dark:text-emerald-400"
                        />
                        <MultiSelectSearchable
                            label="Habilitadores"
                            placeholder="Habilitadores"
                            selectedValues={formFilters.habilitadores}
                            options={catalogos.habilitadores}
                            onChange={handleMultiSelectChange('habilitadores')}
                            labelColorClass="text-teal-600 dark:text-teal-400"
                        />
                        <MultiSelectSearchable
                            label="Market Refusals"
                            placeholder="Market Refusals"
                            selectedValues={formFilters.market_refusals}
                            options={catalogos.market_refusals}
                            onChange={handleMultiSelectChange('market_refusals')}
                            labelColorClass="text-yellow-600 dark:text-yellow-400"
                        />
                        <MultiSelectSearchable
                            label="Variable (%)"
                            placeholder="Variable"
                            selectedValues={formFilters.variable}
                            options={catalogos.variables}
                            onChange={handleMultiSelectChange('variable')}
                            labelColorClass="text-indigo-600 dark:text-indigo-400"
                        />
                    </div>
                </div>

                {/* TABLA PRINCIPAL ORDENADA ALFABÉTICAMENTE CON CÓDIGO DESDE #1 */}
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                    <Table className="text-[11px]">
                        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                            <TableRow>
                                <TableHead className="font-bold py-2">Código</TableHead>
                                <TableHead className="font-bold text-emerald-700 dark:text-emerald-400 py-2">Mes</TableHead>
                                <TableHead className="font-bold py-2">Nombre</TableHead>
                                <TableHead className="font-bold py-2">Cargo</TableHead>
                                <TableHead className="font-bold py-2">Identificador</TableHead>
                                <TableHead className="text-center font-bold py-2">Aus. Justificadas</TableHead>
                                <TableHead className="text-center font-bold py-2">Aus. Injustificadas</TableHead>
                                <TableHead className="text-center font-bold py-2">TRI / Fatalidades</TableHead>
                                <TableHead className="text-center font-bold py-2">Adherencia GP</TableHead>
                                <TableHead className="text-center font-bold py-2">Market Refusals (POCs)</TableHead>
                                <TableHead className="text-center font-bold py-2">% Rechazos</TableHead>
                                <TableHead className="text-center font-bold py-2">Habilitadores</TableHead>
                                <TableHead className="text-center font-bold py-2">Variable</TableHead>
                                <TableHead className="text-center font-bold py-2">Días Trabajados</TableHead>
                                <TableHead className="text-right font-bold py-2">Salario Variable</TableHead>
                                <TableHead className="text-right font-bold text-emerald-700 dark:text-emerald-400 py-2">Pago Variable DT</TableHead>
                                <TableHead className="text-center font-bold py-2">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={17} className="py-8 text-center text-slate-400">
                                        No se encontraron registros de compensación variable para los filtros seleccionados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.data.map((row, index) => {
                                    const rowNumber = (data.current_page - 1) * data.per_page + index + 1;
                                    return (
                                        <TableRow key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                            <TableCell className="font-mono text-slate-500 font-semibold py-1.5">#{rowNumber}</TableCell>
                                            <TableCell className="font-bold text-emerald-700 dark:text-emerald-300 py-1.5">{row.mes ?? '—'}</TableCell>
                                            <TableCell className="font-semibold text-slate-800 dark:text-slate-100 py-1.5">{row.nombre ?? '—'}</TableCell>
                                            <TableCell className="py-1.5">{row.cargo ?? '—'}</TableCell>
                                            <TableCell className="font-mono font-medium py-1.5">{row.identificador ?? '—'}</TableCell>
                                            <TableCell className="text-center py-1.5">{row.ausencia_justificada}</TableCell>
                                            <TableCell className="text-center py-1.5">
                                                {row.ausencia_injustificada > 0 ? (
                                                    <Badge variant="destructive" className="text-[9px] px-1 py-0">{row.ausencia_injustificada}</Badge>
                                                ) : (
                                                    row.ausencia_injustificada
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center py-1.5">{row.tri_fatalidades}</TableCell>
                                            <TableCell className="text-center py-1.5">{row.adherencia_gp ?? '—'}</TableCell>
                                            <TableCell className="text-center py-1.5">{row.market_refusals ?? '—'}</TableCell>
                                            <TableCell className="text-center py-1.5">{row.porcentaje_rechazos}%</TableCell>
                                            <TableCell className="text-center py-1.5">
                                                <Badge
                                                    className={`text-[9px] px-1.5 py-0 ${
                                                        row.habilitadores >= 1
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : row.habilitadores >= 0.8
                                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                    }`}
                                                >
                                                    {row.habilitadores}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center py-1.5">{row.variable ?? '—'}</TableCell>
                                            <TableCell className="text-center py-1.5">{row.dias_trabajados}</TableCell>
                                            <TableCell className="text-right py-1.5">{formatCurrency(row.salario_variable)}</TableCell>
                                            <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400 py-1.5">
                                                {formatCurrency(row.pago_variable_dt || row.total_pago)}
                                            </TableCell>
                                            <TableCell className="text-center py-1.5">
                                                <Button variant="ghost" size="icon" className="size-6 text-slate-600 hover:text-emerald-600" title="Ver detalle por meses" onClick={() => handleOpenDetail(row)}>
                                                    <Eye className="size-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {data.links && data.links.length > 3 && (
                    <div className="flex flex-wrap gap-1 justify-end pt-1">
                        {data.links.map((link, idx) => (
                            <Button
                                key={idx}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 text-xs px-2"
                                disabled={!link.url}
                                asChild={!!link.url}
                            >
                                {link.url ? (
                                    <Link href={link.url} preserveScroll dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </Button>
                        ))}
                    </div>
                )}

                {/* Slide-Over Sheet: Detalle de Compensación Variable por Meses (Más pequeño y compacto) */}
                <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <SheetContent className="w-full sm:max-w-4xl overflow-y-auto p-4 space-y-4">
                        <SheetHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                            <SheetTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                                <Eye className="size-4 text-emerald-600" />
                                Detalle de Compensación Variable por Meses
                            </SheetTitle>
                            <SheetDescription className="text-xs">
                                Ficha del colaborador, desglose mensual completo y gráfica Radar comparativa.
                            </SheetDescription>
                        </SheetHeader>

                        {selectedRow && (
                            <div className="space-y-4">
                                {/* Profile Card Compacto */}
                                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 space-y-2 border border-slate-200/60 dark:border-slate-700 text-xs">
                                    <div className="flex items-center justify-between border-b pb-1.5 border-slate-200 dark:border-slate-700">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedRow.nombre}</h3>
                                            <p className="text-[11px] text-slate-500">{selectedRow.cargo}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className="font-mono text-[11px] px-2 py-0.5">#{selectedRow.identificador}</Badge>
                                            {/* Prom. Días Trab. Integrado en Ver Detalles */}
                                            <div className="flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 border border-indigo-200 dark:border-indigo-800 text-[11px]">
                                                <Clock className="size-3 text-indigo-600" />
                                                <span className="font-semibold text-indigo-700 dark:text-indigo-300">Prom. Días Trab:</span>
                                                <strong className="font-extrabold text-indigo-800 dark:text-indigo-200">{detailPromDias}d</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                                        <div><span className="font-semibold text-slate-700 dark:text-slate-300">Identificador:</span> {selectedRow.identificador}</div>
                                        <div><span className="font-semibold text-slate-700 dark:text-slate-300">Total Meses Registrados:</span> {detailHistory.length} mensualidades</div>
                                    </div>
                                </div>

                                {/* Interactive Charts Grid for Individual Collaborator (Compacto) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                                    {detailRadarData && (
                                        <div className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
                                            <RadarPagosMensuales
                                                pagosActual={detailRadarData.pagos_actual}
                                                pagosAnterior={detailRadarData.pagos_anterior}
                                                anioActual={detailRadarData.anio_actual}
                                                anioAnterior={detailRadarData.anio_anterior}
                                                aniosDisponibles={detailRadarData.anios_disponibles}
                                            />
                                        </div>
                                    )}

                                    <div className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
                                        <GraficoHabilitadoresYAusenciasPorDia
                                            data={detailHabilitadoresYAusenciasPorDia}
                                            diasDisponibles={dias_disponibles}
                                        />
                                    </div>

                                    <div className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
                                        <GraficoRechazosPorDia
                                            rechazosPorDia={detailRechazosPorDia}
                                            diasDisponibles={dias_disponibles}
                                            promedio={indicadores.prom_market_refusals}
                                        />
                                    </div>

                                    <div className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
                                        <GraficoAdherenciaPorDia
                                            adherenciaPorDia={detailAdherenciaPorDia}
                                            diasDisponibles={dias_disponibles}
                                            promedio={indicadores.prom_adherencia_gp}
                                        />
                                    </div>

                                    <div className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
                                        <GraficoPorcentajeRechazosPorDia
                                            porcentajeRechazosPorDia={detailPorcentajeRechazosPorDia}
                                            diasDisponibles={dias_disponibles}
                                            promedio={indicadores.prom_rechazos}
                                        />
                                    </div>
                                </div>

                                {/* Table of Monthly History Compacta */}
                                <div className="space-y-1.5">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                                        <span>Histórico Mensual del Colaborador</span>
                                        {loadingDetailHistory && <LoaderCircle className="size-3 animate-spin text-emerald-600" />}
                                    </h4>
                                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
                                        <Table className="text-[11px] min-w-[700px]">
                                            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                                <TableRow>
                                                    <TableHead className="font-bold py-1.5">Año</TableHead>
                                                    <TableHead className="font-bold py-1.5">Mes</TableHead>
                                                    <TableHead className="text-center font-bold py-1.5">Aus. Just.</TableHead>
                                                    <TableHead className="text-center font-bold py-1.5">Aus. Inj.</TableHead>
                                                    <TableHead className="text-center font-bold py-1.5">TRI / Fat.</TableHead>
                                                    <TableHead className="text-center font-bold py-1.5">Adherencia GP</TableHead>
                                                    <TableHead className="text-center font-bold py-1.5">POCs</TableHead>
                                                    <TableHead className="text-center font-bold py-1.5">% Rechazos</TableHead>
                                                    <TableHead className="text-center font-bold py-1.5">Días Trab.</TableHead>
                                                    <TableHead className="text-center font-bold py-1.5">Hab.</TableHead>
                                                    <TableHead className="text-center font-bold py-1.5">Var. %</TableHead>
                                                    <TableHead className="text-right font-bold text-emerald-700 dark:text-emerald-400 py-1.5">Pago Var. DT</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {detailHistory.map((hRow) => (
                                                    <TableRow key={hRow.id} className={hRow.id === selectedRow.id ? 'bg-emerald-50/60 dark:bg-emerald-950/30 font-semibold' : ''}>
                                                        <TableCell className="py-1">{hRow.anio ?? '—'}</TableCell>
                                                        <TableCell className="font-bold text-emerald-700 dark:text-emerald-300 py-1">{hRow.mes ?? '—'}</TableCell>
                                                        <TableCell className="text-center py-1">{hRow.ausencia_justificada}</TableCell>
                                                        <TableCell className="text-center py-1">
                                                            {hRow.ausencia_injustificada > 0 ? (
                                                                <Badge variant="destructive" className="text-[9px] px-1 py-0">{hRow.ausencia_injustificada}</Badge>
                                                            ) : (
                                                                hRow.ausencia_injustificada
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center py-1">{hRow.tri_fatalidades}</TableCell>
                                                        <TableCell className="text-center py-1">{hRow.adherencia_gp ?? '—'}</TableCell>
                                                        <TableCell className="text-center py-1">{hRow.market_refusals ?? '—'}</TableCell>
                                                        <TableCell className="text-center py-1">{hRow.porcentaje_rechazos}%</TableCell>
                                                        <TableCell className="text-center py-1">{hRow.dias_trabajados}d</TableCell>
                                                        <TableCell className="text-center py-1">{hRow.habilitadores}</TableCell>
                                                        <TableCell className="text-center py-1">{hRow.variable ?? '—'}</TableCell>
                                                        <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400 py-1">
                                                            {formatCurrency(hRow.pago_variable_dt || hRow.total_pago)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Summary Box Compacto */}
                                <div className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 space-y-1">
                                    <div className="flex justify-between items-center text-xs text-emerald-800 dark:text-emerald-300">
                                        <span>Total Acumulado Pago Variable</span>
                                        <span className="font-bold">{formatCurrency(detailHistory.reduce((acc, curr) => acc + (curr.pago_variable_dt || 0), 0))}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>

                {/* Subir Excel Modal Dialog */}
                <Dialog open={openImportModal} onOpenChange={setOpenImportModal}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="size-5 text-emerald-600" />
                                Subir Excel de Compensación Variable
                            </DialogTitle>
                            <DialogDescription>
                                Seleccione el archivo Excel (.xlsx / .xls) para analizarlo e importar los datos de compensación variable por meses.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Archivo Excel (.xlsx / .xls)</label>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border rounded-lg p-1"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {previewInfo && (
                                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5">
                                    <div className="flex items-center gap-2 font-bold">
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                        <span>Archivo analizado correctamente</span>
                                    </div>
                                    <p>Total registros detectados: <strong className="font-extrabold">{previewInfo.count}</strong> filas</p>
                                    <p className="flex items-center gap-1">
                                        <Users className="size-3.5 text-emerald-600" />
                                        Colaboradores únicos (Identificación): <strong className="font-extrabold text-emerald-700 dark:text-emerald-300">{previewInfo.colaboradores}</strong>
                                    </p>
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Columnas: {previewInfo.headers.slice(0, 6).join(', ')}...</p>
                                </div>
                            )}

                            <DialogFooter className="gap-2 sm:gap-0">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancelar</Button>
                                </DialogClose>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={importing || uploadData.archivos.length === 0}>
                                    {importing && <LoaderCircle className="size-4 animate-spin mr-1" />}
                                    Importar Excel
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
