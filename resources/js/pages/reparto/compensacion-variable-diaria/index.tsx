import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
    Tooltip,
} from 'chart.js';
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ChevronsUpDown,
    Clock,
    Download,
    Eye,
    Filter,
    LoaderCircle,
    RotateCcw,
    RefreshCw,
    Trash2,
    TrendingDown,
    TrendingUp,
    Users,
    Car,
    DollarSign,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Reparto', href: '/modules/reparto' },
    { title: 'Compensación Variable Diaria', href: '/modules/reparto/compensacion-variable-diaria' },
];

export interface CompensacionDiariaRow {
    id: number;
    fecha: string | null;
    anio: number | null;
    mes: string | null;
    placa: string | null;
    transporte: string | null;
    rr: string | null;
    cedula: string | null;
    nombre_completo: string | null;
    cargo: string | null;
    rechazos: number;
    cal_rechazos: number;
    cal_rechazos_2: number;
    valor_x_dia: number;
    valor_var: number;
    valor_perdido: number;
    porcentaje_variable: string | null;
    porcentaje_variable_no_cum: string | null;
    meta_1: number;
    meta_2: number;
}

interface PaginationLink { url: string | null; label: string; active: boolean; }

interface Paginator {
    data: CompensacionDiariaRow[];
    links: PaginationLink[];
    total: number;
    current_page: number;
    per_page: number;
}

interface IndicadoresGlobales {
    total_registros: number;
    total_rechazos: number;
    total_cal_rechazos: number;
    total_cal_rechazos_2: number;
    total_valor_x_dia: number;
    total_valor_var: number;
    total_valor_perdido: number;
    total_meta_1: number;
    total_meta_2: number;
    prom_rechazos: number;
    colaboradores_unicos: number;
    vehiculos_unicos: number;
}

interface TotalesPorDia {
    fechas: string[];
    rechazos: number[];
    valor_x_dia: number[];
    valor_var: number[];
    valor_perdido: number[];
}

interface TotalesMensuales {
    meses: string[];
    rechazos: number[];
    valor_var: number[];
    valor_perdido: number[];
    meta_1: number[];
    meta_2: number[];
}

interface Catalogos {
    anios: number[];
    meses: string[];
    cargos: string[];
    cedulas: string[];
    nombres: string[];
    placas: string[];
    transportes: string[];
    rrs: string[];
}

interface FiltrosReales {
    fecha_desde?: string;
    fecha_hasta?: string;
    anio?: number | string;
    mes?: string | string[];
    cedula?: string | string[];
    nombre_completo?: string | string[];
    cargo?: string | string[];
    placa?: string | string[];
    transporte?: string | string[];
    rr?: string | string[];
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(d: string | null): string {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const COLUMNAS: [keyof CompensacionDiariaRow, string, boolean][] = [
    ['fecha', 'Fecha', true],
    ['anio', 'Año', false],
    ['mes', 'Mes', false],
    ['placa', 'Placa', true],
    ['transporte', 'Transporte', false],
    ['cedula', 'Cédula', true],
    ['nombre_completo', 'Nombre Completo', true],
    ['cargo', 'Cargo', true],
    ['rechazos', 'Rechazos', true],
    ['cal_rechazos', 'Cal-Rechazos', true],
    ['cal_rechazos_2', 'Cal-Rechazos 2', false],
    ['valor_x_dia', 'Valor x Día', true],
    ['valor_var', 'Valor Var', true],
    ['valor_perdido', 'Valor Perdido', true],
    ['porcentaje_variable', '% Variable', true],
    ['porcentaje_variable_no_cum', '% Var No Cum', false],
    ['meta_1', 'Meta ≤ 2,1%', false],
    ['meta_2', 'Meta < 2,6%', true],
];

const LS_COLS = 'cvd_cols_v1';

function StatCard({ title, value, subtext, icon: Icon, color, bgColor }: { title: string; value: React.ReactNode; subtext?: string; icon?: any; color: string; bgColor: string; }) {
    return (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
                {Icon && <div className="rounded-md p-1" style={{ backgroundColor: bgColor }}><Icon className="size-3.5" style={{ color }} /></div>}
            </div>
            <div className="mt-1">
                <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{value}</div>
                {subtext && <p className="text-[10px] text-slate-500 mt-0.5">{subtext}</p>}
            </div>
        </div>
    );
}

function GraficoBarrasValorDiario({ data }: { data: TotalesPorDia }) {
    const labels = (data?.fechas || []).map(f => {
        const dt = new Date(f);
        return isNaN(dt.getTime()) ? f : `${dt.getDate()}/${dt.getMonth() + 1}`;
    });
    const chartData = {
        labels,
        datasets: [
            { label: 'Valor Variable ($)', data: data?.valor_var || [], backgroundColor: 'rgba(16, 185, 129, 0.7)', borderColor: '#10b981', borderWidth: 1 },
            { label: 'Valor Perdido ($)', data: data?.valor_perdido || [], backgroundColor: 'rgba(239, 68, 68, 0.65)', borderColor: '#ef4444', borderWidth: 1 },
        ],
    };
    
    if ((data?.fechas || []).length === 0) {
        return (
            <div>
                <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1.5"><TrendingUp className="lucide size-3.5 text-emerald-600" /><span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Valor Variable vs Perdido / Día</span></div>
                </div>
                <div className="mt-2 h-[220px] flex items-center justify-center text-xs text-slate-400">Sin datos para mostrar</div>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5"><TrendingUp className="lucide size-3.5 text-emerald-600" /><span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Valor Variable vs Perdido / Día</span></div>
            </div>
            <div className="mt-2 h-[220px]"><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 10 } } } }, scales: { x: { ticks: { font: { size: 9 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { font: { size: 9 }, callback: (v) => '$' + Number(v).toLocaleString('es-CO', { maximumFractionDigits: 0 }) } } } }} /></div>
        </div>
    );
}

function GraficoLineaRechazos({ data }: { data: TotalesPorDia }) {
    const labels = (data?.fechas || []).map(f => {
        const dt = new Date(f);
        return isNaN(dt.getTime()) ? f : `${dt.getDate()}/${dt.getMonth() + 1}`;
    });
    const chartData = {
        labels,
        datasets: [{ label: 'Rechazos', data: data?.rechazos || [], borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.15)', borderWidth: 2, tension: 0.3, fill: true, pointRadius: 2 }],
    };
    
    if ((data?.fechas || []).length === 0) {
        return (
            <div>
                <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1.5"><TrendingDown className="lucide size-3.5 text-orange-500" /><span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Rechazos Diarios</span></div>
                </div>
                <div className="mt-2 h-[220px] flex items-center justify-center text-xs text-slate-400">Sin datos para mostrar</div>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5"><TrendingDown className="lucide size-3.5 text-orange-500" /><span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Rechazos Diarios</span></div>
            </div>
            <div className="mt-2 h-[220px]"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 9 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { font: { size: 9 } } } } }} /></div>
        </div>
    );
}

function GraficoBarrasMensual({ data }: { data: TotalesMensuales }) {
    const labels = data?.meses || [];
    const chartData = {
        labels,
        datasets: [
            { label: 'Valor Var ($)', data: data?.valor_var || [], backgroundColor: 'rgba(59, 130, 246, 0.7)' },
            { label: 'Meta 1', data: data?.meta_1 || [], backgroundColor: 'rgba(16, 185, 129, 0.5)' },
            { label: 'Meta 2', data: data?.meta_2 || [], backgroundColor: 'rgba(168, 85, 247, 0.5)' },
        ],
    };
    
    // Verificar si hay datos (al menos un mes con valores)
    const hayDatos = (data?.valor_var || []).some(v => v > 0) || (data?.meta_1 || []).some(v => v > 0) || (data?.meta_2 || []).some(v => v > 0);
    
    if (!hayDatos) {
        return (
            <div>
                <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1.5"><CalendarDays className="lucide size-3.5 text-blue-500" /><span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Totales Mensuales vs Metas</span></div>
                </div>
                <div className="mt-2 h-[220px] flex items-center justify-center text-xs text-slate-400">Sin datos para mostrar</div>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5"><CalendarDays className="lucide size-3.5 text-blue-500" /><span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Totales Mensuales vs Metas</span></div>
            </div>
            <div className="mt-2 h-[220px]"><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 10 } } } }, scales: { x: { ticks: { font: { size: 9 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { font: { size: 9 }, callback: (v) => '$' + Number(v).toLocaleString('es-CO', { maximumFractionDigits: 0 }) } } } }} /></div>
        </div>
    );
}

function FriendlyDatePicker({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{label}</label>
            <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
    );
}

function MultiSelectSearchable({ label, placeholder, selectedValues, options, onChange }: { label: string; placeholder?: string; selectedValues?: string | string[]; options?: (string | number)[]; onChange: (vals: string[]) => void; }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const selectedArr = useMemo(() => {
        if (!selectedValues) return [] as string[];
        return Array.isArray(selectedValues) ? selectedValues.map(String) : String(selectedValues).split(',').map(s => s.trim()).filter(Boolean);
    }, [selectedValues]);
    const filtered = useMemo(() => {
        const opts = (options || []).map(String);
        if (!search) return opts;
        return opts.filter(o => o.toLowerCase().includes(search.toLowerCase()));
    }, [options, search]);
    const toggle = (val: string) => {
        const next = selectedArr.includes(val) ? selectedArr.filter(v => v !== val) : [...selectedArr, val];
        onChange(next);
    };
    return (
        <div className="relative space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{label}</label>
            <button type="button" onClick={() => setOpen(!open)} className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-left text-xs flex items-center justify-between gap-1">
                <span className={`truncate ${selectedArr.length ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                    {selectedArr.length ? selectedArr.length + ' seleccionado(s)' : placeholder || 'Todos...'}
                </span>
                <ChevronsUpDown className="size-3 text-slate-400 shrink-0" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setSearch(''); }} />
                    <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg max-h-60 overflow-y-auto">
                        <div className="sticky top-0 p-1.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div className="py-1">
                            {filtered.length === 0 && <div className="px-2 py-1.5 text-[11px] text-slate-500">Sin resultados</div>}
                            {filtered.map((opt) => (
                                <div key={opt} onClick={() => toggle(opt)} className={`cursor-pointer px-2 py-1 text-[11px] flex items-center gap-2 ${selectedArr.includes(opt) ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    <span className="w-3 h-3 border rounded-sm flex items-center justify-center border-slate-300 dark:border-slate-600">{selectedArr.includes(opt) && '✓'}</span>
                                    <span className="truncate">{opt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Guards defensivos fuera del componente (constantes)
const DEFAULT_PAGINATOR: Paginator = { data: [], links: [], total: 0, current_page: 1, per_page: 25 };
const DEFAULT_INDICADORES: IndicadoresGlobales = { total_registros: 0, total_rechazos: 0, total_cal_rechazos: 0, total_cal_rechazos_2: 0, total_valor_x_dia: 0, total_valor_var: 0, total_valor_perdido: 0, total_meta_1: 0, total_meta_2: 0, prom_rechazos: 0, colaboradores_unicos: 0, vehiculos_unicos: 0 };
const DEFAULT_TOTALES_DIA: TotalesPorDia = { fechas: [], rechazos: [], valor_x_dia: [], valor_var: [], valor_perdido: [] };
const DEFAULT_TOTALES_MES: TotalesMensuales = { meses: [], rechazos: [], valor_var: [], valor_perdido: [], meta_1: [], meta_2: [] };
const DEFAULT_CATALOGOS: Catalogos = { anios: [], meses: [], cargos: [], cedulas: [], nombres: [], placas: [], transportes: [], rrs: [] };

export default function CompensacionVariableDiariaIndex() {
    const pageProps = usePage<any>().props || {};
    
    // Debug: log para verificar qué datos llegan
    console.log('CompensacionVariableDiariaIndex pageProps:', pageProps);
    
    const data: Paginator = pageProps.data || DEFAULT_PAGINATOR;
    const indicadores: IndicadoresGlobales = pageProps.indicadores || DEFAULT_INDICADORES;
    const totales_por_dia: TotalesPorDia = pageProps.totales_por_dia || DEFAULT_TOTALES_DIA;
    const totales_mensuales: TotalesMensuales = pageProps.totales_mensuales || DEFAULT_TOTALES_MES;
    const filters: FiltrosReales = pageProps.filters || {};
    const catalogos: Catalogos = pageProps.catalogos || DEFAULT_CATALOGOS;
    const flash = pageProps.flash || {};
    
    console.log('CompensacionVariableDiariaIndex data:', { data, indicadores, totales_por_dia, totales_mensuales, filters, catalogos });

    const LS_HIDE_COLS = 'cvd_hidden_cols_v1';
    const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => {
        try { const s = localStorage.getItem(LS_HIDE_COLS); return s ? new Set(JSON.parse(s)) : new Set(COLUMNAS.filter(([,, h]) => !h).map(([k]) => k)); } catch { return new Set(); }
    });
    useEffect(() => { try { localStorage.setItem(LS_HIDE_COLS, JSON.stringify(Array.from(hiddenCols))); } catch {} }, [hiddenCols]);
    const toggleCol = (k: string) => { const next = new Set(hiddenCols); if (next.has(k)) next.delete(k); else next.add(k); setHiddenCols(next); };
    const [colsModalOpen, setColsModalOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<CompensacionDiariaRow | null>(null);
    const [historialRow, setHistorialRow] = useState<CompensacionDiariaRow[]>([]);
    const [calcularModalOpen, setCalcularModalOpen] = useState(false);

    const { post: postCalcular, processing: processingCalcular } = useForm({});

    const handleCalcular = () => {
        router.post(route('reparto.compensacion-variable-diaria.calcular'), {}, {
            onSuccess: () => setCalcularModalOpen(false),
        });
    };

    const [formFilters, setFormFilters] = useState<FiltrosReales>({ ...filters });
    const filtersKey = JSON.stringify(filters);
    useEffect(() => { setFormFilters(f => ({ ...f, ...filters })); }, [filtersKey]);

    const applyFilters = () => {
        const query: any = {};
        Object.entries(formFilters).forEach(([k, v]) => {
            if (Array.isArray(v)) { if (v.length) query[k] = v.join(','); }
            else if (v !== undefined && v !== null && v !== '') query[k] = v;
        });
        router.get(route('reparto.compensacion-variable-diaria.index'), query, { preserveState: true, preserveScroll: true });
    };
    const limpiarFiltros = () => { setFormFilters({}); router.get(route('reparto.compensacion-variable-diaria.index'), {}, { preserveState: true, preserveScroll: true }); };
    const handleMultiSelectChange = (key: string) => (vals: string[]) => setFormFilters(prev => ({ ...prev, [key]: vals }));
    const handleDateInputChange = (key: string) => (v: string) => setFormFilters(prev => ({ ...prev, [key]: v }));
    const handleSimpleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormFilters(prev => ({ ...prev, [key]: e.target.value }));

    const handleLimpiarTabla = () => {
        if (confirm('¿Está seguro de borrar TODOS los registros de Compensación Variable Diaria? Esta acción no se puede deshacer.')) {
            router.post(route('reparto.compensacion-variable-diaria.limpiar'));
        }
    };

    const handleOpenDetail = async (row: CompensacionDiariaRow) => {
        setSelectedRow(row);
        setDrawerOpen(true);
        setHistorialRow([]);
        try {
            const res = await fetch(route('reparto.compensacion-variable-diaria.detalle', { id: row.id }));
            const json = await res.json();
            if (json?.historial) setHistorialRow(json.historial);
        } catch { setHistorialRow([row]); }
    };

    const totalRegistros   = Number(indicadores?.total_registros   ?? 0) || 0;
    const totalValorVar    = Number(indicadores?.total_valor_var    ?? 0) || 0;
    const totalValorPerd   = Number(indicadores?.total_valor_perdido?? 0) || 0;
    const totalRechazos    = Number(indicadores?.total_rechazos     ?? 0) || 0;
    const promRechazos     = Number(indicadores?.prom_rechazos      ?? 0) || 0;
    const colsUnicos       = Number(indicadores?.colaboradores_unicos?? 0) || 0;
    const vehUnicos        = Number(indicadores?.vehiculos_unicos   ?? 0) || 0;

    const visibleCols = COLUMNAS.filter(([k]) => !hiddenCols.has(k));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Compensación Variable Diaria" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-3 md:p-5 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <HeadingSmall title="Compensación Variable Diaria" description="Calculada automáticamente desde Eventos de Tripulación · rechazos, valores y metas por colaborador/vehículo." />
                    <div className="flex flex-wrap gap-2">
                        <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleLimpiarTabla} disabled={totalRegistros === 0}>
                            <Trash2 className="size-3.5 mr-1" /> Limpiar
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                            <a href={route('reparto.compensacion-variable-diaria.exportar', formFilters as any)}>
                                <Download className="size-3.5 mr-1" /> Exportar
                            </a>
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            onClick={() => setCalcularModalOpen(true)}
                        >
                            <RefreshCw className="size-3.5 mr-1" /> Calcular desde Eventos
                        </Button>
                    </div>
                </div>

                {flash?.status && (
                    <div className={`flex items-center justify-between rounded-lg p-3 text-xs font-medium shadow-2xs ${flash.status.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
                        <div className="flex items-center gap-2">{flash.status.type === 'success' ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertTriangle className="size-4 text-rose-600" />}<span>{flash.status.message}</span></div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                    <div className="col-span-1 sm:col-span-2 flex flex-col justify-between rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 p-3 text-white shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Total Valor Variable</span>
                            <div className="rounded-full bg-white/20 p-1.5"><DollarSign className="size-4 text-white" /></div>
                        </div>
                        <div className="mt-1"><h2 className="text-lg md:text-xl font-extrabold tracking-tight">{formatCurrency(totalValorVar)}</h2><p className="text-[10px] text-blue-100 mt-0.5">Suma valor variable acumulado</p></div>
                    </div>
                    <StatCard title="Valor Perdido" value={formatCurrency(totalValorPerd)} subtext="Total descuentos" icon={TrendingDown} color="#dc2626" bgColor="#fee2e2" />
                    <StatCard title="Total Rechazos" value={totalRechazos.toLocaleString('es-CO')} subtext={`Prom ${promRechazos}/día`} icon={AlertTriangle} color="#ea580c" bgColor="#ffedd5" />
                    <StatCard title="Registros / Días" value={totalRegistros.toLocaleString('es-CO')} subtext={`${colsUnicos} col · ${vehUnicos} veh`} icon={Clock} color="#0891b2" bgColor="#cffafe" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs"><GraficoBarrasValorDiario data={totales_por_dia} /></div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs"><GraficoLineaRechazos data={totales_por_dia} /></div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs"><GraficoBarrasMensual data={totales_mensuales} /></div>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider"><Filter className="size-3.5 text-blue-600" /><span>Filtros</span></div>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px] text-slate-500 hover:text-slate-800" onClick={() => setColsModalOpen(true)}><Eye className="size-3 mr-1" /> Columnas</Button>
                            <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px] text-slate-500 hover:text-slate-800" onClick={limpiarFiltros}><RotateCcw className="size-3 mr-1" /> Restablecer</Button>
                            <Button type="button" variant="default" size="sm" className="h-6 text-[11px]" onClick={applyFilters}><Filter className="size-3 mr-1" /> Aplicar</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 text-xs">
                        <FriendlyDatePicker label="Fecha Desde" value={formFilters.fecha_desde} onChange={handleDateInputChange('fecha_desde')} />
                        <FriendlyDatePicker label="Fecha Hasta" value={formFilters.fecha_hasta} onChange={handleDateInputChange('fecha_hasta')} />
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Año</label>
                            <select value={String(formFilters.anio || '')} onChange={handleSimpleChange('anio')} className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Todos</option>
                                {(catalogos.anios || []).map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <MultiSelectSearchable label="Mes" placeholder="Mes" selectedValues={formFilters.mes} options={catalogos.meses} onChange={handleMultiSelectChange('mes')} />
                        <MultiSelectSearchable label="Cargo" placeholder="Cargo" selectedValues={formFilters.cargo} options={catalogos.cargos} onChange={handleMultiSelectChange('cargo')} />
                        <MultiSelectSearchable label="Cédula" placeholder="Cédula" selectedValues={formFilters.cedula} options={catalogos.cedulas} onChange={handleMultiSelectChange('cedula')} />
                        <MultiSelectSearchable label="Nombre" placeholder="Nombre" selectedValues={formFilters.nombre_completo} options={catalogos.nombres} onChange={handleMultiSelectChange('nombre_completo')} />
                        <MultiSelectSearchable label="Placa" placeholder="Placa" selectedValues={formFilters.placa} options={catalogos.placas} onChange={handleMultiSelectChange('placa')} />
                        <MultiSelectSearchable label="Transporte" placeholder="Transporte" selectedValues={formFilters.transporte} options={catalogos.transportes} onChange={handleMultiSelectChange('transporte')} />
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-950/50">
                                    <TableHead className="px-2 py-2 w-10"><Eye className="size-3.5 text-slate-400" /></TableHead>
                                    {visibleCols.map(([k, label]) => (
                                        <TableHead key={k as string} className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 whitespace-nowrap">{label}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(data?.data || []).length === 0 && (
                                    <TableRow><TableCell colSpan={visibleCols.length + 1} className="text-center py-12 text-xs text-slate-500">No hay registros. Usa el botón <strong>"Calcular desde Eventos"</strong> para generar la compensación variable diaria.</TableCell></TableRow>
                                )}
                                {(data?.data || []).map((row) => (
                                    <TableRow key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => handleOpenDetail(row)}>
                                        <TableCell className="px-2 py-1.5 w-10" onClick={(e) => { e.stopPropagation(); handleOpenDetail(row); }}>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"><Eye className="size-3.5" /></Button>
                                        </TableCell>
                                        {visibleCols.map(([k]) => {
                                            const val = row[k as keyof CompensacionDiariaRow];
                                            let display: React.ReactNode = val === null || val === undefined || val === '' ? '-' : String(val);
                                            const isMoney = ['cal_rechazos', 'cal_rechazos_2', 'valor_x_dia', 'valor_var', 'valor_perdido'].includes(k as string);
                                            if (isMoney) display = formatCurrency(Number(val) || 0);
                                            if (k === 'fecha') display = formatDate(val as string | null);
                                            if (k === 'cedula' || k === 'placa') display = <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{val as string || '-'}</Badge>;
                                            if (k === 'rechazos') display = val !== null && val !== undefined && val !== '' ? `${Number(val)}%` : '-';
                                            if (k === 'meta_1') display = val !== null && val !== undefined && val !== '' ? `${Number(val)}%` : '< 2,1%';
                                            if (k === 'meta_2') display = val !== null && val !== undefined && val !== '' ? `${Number(val)}%` : '< 2,6%';
                                            return <TableCell key={k as string} className="px-2 py-1.5 text-[11px] whitespace-nowrap text-slate-700 dark:text-slate-300">{display}</TableCell>;
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600">
                        <div>Pág {data?.current_page} · Total {data?.total} registros</div>
                        <div className="flex flex-wrap gap-1">
                            {(data?.links || []).slice(1, -1).map((l, i) => (
                                <Link key={i} href={l.url || '#'} className={`px-2 py-1 rounded border ${l.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50'} ${!l.url ? 'opacity-40 pointer-events-none' : ''}`} preserveState preserveScroll>{l.label.replace(/&laquo;|&raquo;/g, '')}</Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={colsModalOpen} onOpenChange={setColsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle className="text-sm font-bold">Personalizar Columnas</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto py-2">
                        {COLUMNAS.map(([k, label]) => (
                            <label key={k as string} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded px-2 py-1">
                                <input type="checkbox" checked={!hiddenCols.has(k as string)} onChange={() => toggleCol(k as string)} className="rounded border-slate-300" />
                                <span>{label}</span>
                            </label>
                        ))}
                    </div>
                    <DialogFooter><DialogClose asChild><Button variant="outline" size="sm">Cerrar</Button></DialogClose></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={calcularModalOpen} onOpenChange={setCalcularModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold flex items-center gap-2">
                            <RefreshCw className="size-4 text-emerald-600" />
                            Calcular Compensación del Mes Actual
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            El sistema calculará automáticamente la compensación variable diaria para <strong>{new Date().toLocaleString('es-CO', { month: 'long', year: 'numeric' })}</strong>, usando los datos de <strong>Eventos de Tripulación</strong> del mes en curso.
                        </p>
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                            <p className="font-semibold">El sistema calculará automáticamente:</p>
                            <p>· Valor del día ($3,846.15)</p>
                            <p>· Cal-Rechazos según meta 2 (&lt; 2.6% → 80%)</p>
                            <p>· Cal-Rechazos 2 según meta 1 (≤ 2.1% → 20%)</p>
                            <p>· Valor Variable y Valor Perdido</p>
                            <p>· Nombre y cargo desde la BD de colaboradores</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild><Button type="button" variant="outline" size="sm">Cancelar</Button></DialogClose>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCalcular} disabled={processingCalcular}>
                            {processingCalcular ? <LoaderCircle className="size-3.5 mr-1 animate-spin" /> : <RefreshCw className="size-3.5 mr-1" />}
                            {processingCalcular ? 'Calculando...' : 'Calcular Mes Actual'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-4 sm:p-6 overflow-y-auto">
                    <SheetHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                        <SheetTitle className="text-base font-bold text-slate-900 dark:text-slate-100">Detalle del Registro</SheetTitle>
                    </SheetHeader>
                    {selectedRow && (
                        <div className="mt-4 space-y-4">
                            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-md">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">{selectedRow.cargo || 'Cargo no especificado'}</div>
                                <div className="text-lg sm:text-xl font-extrabold mt-0.5">{selectedRow.nombre_completo || '(Sin nombre)'}</div>
                                <div className="mt-3 flex flex-wrap gap-2.5 sm:gap-4 text-[11px] text-blue-100 font-medium">
                                    <span className="bg-white/10 px-2 py-0.5 rounded-md">📅 {formatDate(selectedRow.fecha)}</span>
                                    <span className="bg-white/10 px-2 py-0.5 rounded-md">🚛 {selectedRow.placa || '-'}</span>
                                    <span className="bg-white/10 px-2 py-0.5 rounded-md">🆔 {selectedRow.cedula || '-'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                <StatCard title="Rechazos" value={`${selectedRow.rechazos || 0}%`} icon={AlertTriangle} color="#ea580c" bgColor="#ffedd5" />
                                <StatCard title="Valor x Día" value={formatCurrency(selectedRow.valor_x_dia)} icon={DollarSign} color="#0891b2" bgColor="#cffafe" />
                                <StatCard title="Valor Variable" value={formatCurrency(selectedRow.valor_var)} icon={TrendingUp} color="#059669" bgColor="#d1fae5" />
                                <StatCard title="Valor Perdido" value={formatCurrency(selectedRow.valor_perdido)} icon={TrendingDown} color="#dc2626" bgColor="#fee2e2" />
                                <StatCard title="% Variable" value={selectedRow.porcentaje_variable || '-'} icon={Users} color="#2563eb" bgColor="#dbeafe" />
                                <StatCard title="% No Cum" value={selectedRow.porcentaje_variable_no_cum || '-'} icon={Clock} color="#7c3aed" bgColor="#ede9fe" />
                                <StatCard title="Cal Rechazos" value={formatCurrency(selectedRow.cal_rechazos)} icon={DollarSign} color="#ea580c" bgColor="#ffedd5" />
                                <StatCard title="Cal Rechazos 2" value={formatCurrency(selectedRow.cal_rechazos_2)} icon={DollarSign} color="#db2777" bgColor="#fce7f3" />
                                <StatCard title="Meta 1" value={selectedRow.meta_1 !== null && selectedRow.meta_1 !== undefined ? `< ${selectedRow.meta_1}%` : '< 2,1%'} icon={TrendingUp} color="#059669" bgColor="#d1fae5" />
                                <StatCard title="Meta 2" value={selectedRow.meta_2 !== null && selectedRow.meta_2 !== undefined ? `< ${selectedRow.meta_2}%` : '< 2,6%'} icon={TrendingUp} color="#2563eb" bgColor="#dbeafe" />
                            </div>

                            {historialRow.length > 0 && (
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-2xs">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
                                        Últimos días del colaborador ({historialRow.length})
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table className="w-full">
                                            <TableHeader>
                                                <TableRow className="bg-slate-50 dark:bg-slate-950/50">
                                                    <TableHead className="px-2 py-1.5 text-[10px]">Fecha</TableHead>
                                                    <TableHead className="px-2 py-1.5 text-[10px]">Placa</TableHead>
                                                    <TableHead className="px-2 py-1.5 text-[10px]">Rechazos</TableHead>
                                                    <TableHead className="px-2 py-1.5 text-[10px]">Valor Var</TableHead>
                                                    <TableHead className="px-2 py-1.5 text-[10px]">% Var</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {historialRow.slice(0, 15).map(h => (
                                                    <TableRow key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                        <TableCell className="px-2 py-1.5 text-[11px]">{formatDate(h.fecha)}</TableCell>
                                                        <TableCell className="px-2 py-1.5 text-[11px]">{h.placa || '-'}</TableCell>
                                                        <TableCell className="px-2 py-1.5 text-[11px]">{h.rechazos !== null && h.rechazos !== undefined ? `${h.rechazos}%` : '-'}</TableCell>
                                                        <TableCell className="px-2 py-1.5 text-[11px]">{formatCurrency(h.valor_var)}</TableCell>
                                                        <TableCell className="px-2 py-1.5 text-[11px]">{h.porcentaje_variable || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
