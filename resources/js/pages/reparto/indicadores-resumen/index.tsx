import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    BarController,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
    type ChartOptions,
    type TooltipItem,
} from 'chart.js';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Calendar,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    Map,
    Target,
    TrendingDown,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
    BarController, BarElement,
    CategoryScale, LinearScale,
    PointElement, LineElement, LineController, Filler,
    Tooltip, Legend,
);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reparto', href: '/modules/reparto/modulacion' },
    { title: 'Resumen Ejecutivo', href: '/modules/reparto/indicadores-resumen' },
];

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Kpis {
    cumpl_general: number | null;
    metas_cumplidas: number;
    total_indicadores: number;
    entrega_rango: number | null;
    adh_tiempo: number | null;
    total_registros: number;
    periodo_desde: string;
    periodo_hasta: string;
}
interface CargoPt {
    cargo: string; total: number; score_incump: number;
    cl_pre_cero: number; cl_post_cero: number; rechazos_sum: number;
    entrega_cero: number; entrega_bajo: number; alertas_sum: number;
    excesos_sum: number; adh_bajo: number;
    prom_adh: number | null; prom_entrega: number | null; prom_mod: number | null;
}
interface TendPunto { fecha: string; adh: number | null; entrega: number | null; cl_pre: number | null }
interface Props {
    kpis: Kpis;
    promedios: Record<string, number | null>;
    cumplimiento: Record<string, number | null>;
    brechas: Record<string, number | null>;
    etiquetas: Record<string, string>;
    unidades: Record<string, string>;
    metas: Record<string, number>;
    por_cargo: CargoPt[];
    tendencia: TendPunto[];
    todasPlacas: string[];
    cargos: string[];
    filters: { fecha_desde: string; fecha_hasta: string; cargo: string; placas: string[] };
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ORDEN_INDICADORES = [
    'cl_pre', 'cl_post', 'entrega', 'adh_tiempo',
    'modulacion', 'rechazos', 'rmd', 'alertas', 'excesos',
];
const INVERTIDOS = new Set(['rechazos', 'alertas', 'excesos']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function semaforo(pct: number | null): string {
    if (pct === null) return '#d1d5db';
    if (pct >= 90) return '#15803d';   // green-700
    if (pct >= 70) return '#d97706';   // amber-600
    return '#dc2626';                  // red-600
}

function chipCls(pct: number | null): string {
    if (pct === null) return 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500';
    if (pct >= 90) return 'bg-green-700 text-white';
    if (pct >= 70) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

function estadoLabel(pct: number | null): string {
    if (pct === null) return 'Sin datos';
    if (pct >= 90) return 'Óptimo';
    if (pct >= 70) return 'Aceptable';
    return 'Crítico';
}

// ─── Componentes base (sistema Mi Compensación Diaria) ────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}>
            {children}
        </div>
    );
}

function SectionHeader({
    icon: Icon, title, subtitle, badge,
}: {
    icon: React.ElementType; title: string; subtitle?: string; badge?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-700">
                    <Icon className="size-4 text-white" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
                    {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
                </div>
            </div>
            {badge}
        </div>
    );
}

function Chip({ children, cls }: { children: React.ReactNode; cls: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cls}`}>
            {children}
        </span>
    );
}

function Kpi({
    label, value, sub, color, icon: Icon,
}: {
    label: string; value: string; sub: string; color: string; icon: React.ElementType;
}) {
    return (
        <Card className="flex flex-col gap-1.5 p-4">
            <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Icon className="size-3.5" style={{ color }} />
                </div>
            </div>
            <p className="text-3xl font-extrabold tabular-nums leading-none" style={{ color }}>{value}</p>
            <p className="text-[10px] text-gray-400 leading-snug">{sub}</p>
        </Card>
    );
}

// ─── Barra de un indicador ────────────────────────────────────────────────────

function IndicadorBar({
    ikey, cumpl, promedio, meta, etiqueta, unidad, invertido,
}: {
    ikey: string; cumpl: number | null; promedio: number | null; meta: number;
    etiqueta: string; unidad: string; invertido: boolean;
}) {
    const color = semaforo(cumpl);
    const pct = cumpl ?? 0;
    const valFmt = promedio !== null
        ? (ikey === 'rmd' ? `${promedio}/5` : `${promedio}${unidad === '%' ? '%' : ` ${unidad}`}`)
        : '—';
    const metaFmt = ikey === 'rmd' ? `${meta}/5` : `${meta}${unidad === '%' ? '%' : ` ${unidad}`}`;

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{etiqueta}</span>
                    {invertido && (
                        <span className="shrink-0 text-[9px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full dark:bg-amber-900/20 dark:border-amber-800/40 dark:text-amber-400">
                            menor = mejor
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-gray-400">Meta: {metaFmt}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color }}>{valFmt}</span>
                    <Chip cls={chipCls(cumpl)}>{pct}%</Chip>
                </div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
            </div>
        </div>
    );
}

// ─── Barra de brecha ──────────────────────────────────────────────────────────

function BrechaBar({
    ikey, brecha, meta, etiqueta, unidad, invertido,
}: {
    ikey: string; brecha: number | null; promedio: number | null; meta: number;
    etiqueta: string; unidad: string; invertido: boolean;
}) {
    if (!brecha || brecha === 0) return (
        <div className="flex items-center justify-between py-1.5 text-xs">
            <span className="text-gray-500 dark:text-gray-400">{etiqueta}</span>
            <span className="text-green-700 dark:text-green-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="size-3" />Meta cumplida
            </span>
        </div>
    );

    const pctBar = meta > 0 ? Math.min(100, (brecha / meta) * 100) : 0;
    const color = brecha > meta * 0.3 ? '#dc2626' : brecha > meta * 0.1 ? '#d97706' : '#f97316';
    const brechaFmt = ikey === 'rmd' ? `−${brecha} pts` : `−${brecha}${unidad === '%' ? ' pp' : ` ${unidad}`}`;

    return (
        <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{etiqueta}</span>
                <span className="text-xs font-bold shrink-0 tabular-nums" style={{ color }}>{brechaFmt}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pctBar}%`, background: color }} />
            </div>
        </div>
    );
}

// ─── Multi-select placas ──────────────────────────────────────────────────────

function PlacaMultiSelect({ todas, seleccionadas, onChange }:
    { todas: string[]; seleccionadas: string[]; onChange: (v: string[]) => void }) {
    const [open, setOpen]     = useState(false);
    const [buscar, setBuscar] = useState('');
    const filtradas = todas.filter(p => buscar === '' || p.includes(buscar));
    const toggle    = (p: string) => onChange(seleccionadas.includes(p)
        ? seleccionadas.filter(x => x !== p) : [...seleccionadas, p]);
    const toggleAll = () => onChange(seleccionadas.length === todas.length ? [] : [...todas]);

    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen(v => !v)}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-left flex items-center justify-between gap-1 hover:border-gray-400 focus:ring-1 focus:ring-green-600 focus:outline-none transition-colors">
                <span className="truncate text-gray-600 dark:text-gray-300">
                    {seleccionadas.length === 0 ? 'Todas las placas'
                        : seleccionadas.length === 1 ? seleccionadas[0]
                        : `${seleccionadas.length} placas`}
                </span>
                <span className="text-gray-400 shrink-0 text-[10px]">{open ? '▲' : '▼'}</span>
            </button>
            {seleccionadas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                    {seleccionadas.map(p => (
                        <span key={p} className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/40">
                            {p}
                            <button type="button" onClick={() => toggle(p)} className="ml-0.5 text-green-500 hover:text-green-700">×</button>
                        </span>
                    ))}
                    <button type="button" onClick={() => onChange([])} className="text-[9px] text-gray-400 hover:text-red-500 underline ml-1">Limpiar</button>
                </div>
            )}
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-64 max-h-72 flex flex-col">
                        <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                            <input autoFocus type="text" placeholder="Buscar..." value={buscar}
                                onChange={e => setBuscar(e.target.value.toUpperCase())}
                                className="w-full h-7 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-green-600" />
                        </div>
                        <label className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer border-b border-gray-100 dark:border-gray-800">
                            <input type="checkbox" checked={seleccionadas.length === todas.length && todas.length > 0}
                                onChange={toggleAll} className="accent-green-700 w-3 h-3" />
                            Todas ({todas.length})
                        </label>
                        <div className="overflow-y-auto flex-1">
                            {filtradas.map(p => (
                                <label key={p} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                                    <input type="checkbox" checked={seleccionadas.includes(p)}
                                        onChange={() => toggle(p)} className="accent-green-700 w-3 h-3 shrink-0" />
                                    <span className="text-[11px] font-mono font-semibold text-gray-700 dark:text-gray-200">{p}</span>
                                    {seleccionadas.includes(p) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />}
                                </label>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function IndicadoresResumenIndex({
    kpis, promedios, cumplimiento, brechas, etiquetas, unidades, metas,
    por_cargo, tendencia, todasPlacas, cargos, filters,
}: Props) {
    const [fechaDesde, setFechaDesde] = useState(filters.fecha_desde ?? '');
    const [fechaHasta, setFechaHasta] = useState(filters.fecha_hasta ?? '');
    const [cargo,      setCargo]      = useState(filters.cargo ?? '');
    const [placasSel,  setPlacasSel]  = useState<string[]>(filters.placas ?? []);

    const apply = (ov: Partial<typeof filters> = {}) =>
        router.get(route('reparto.indicadores-resumen.index'), {
            fecha_desde: ov.fecha_desde ?? fechaDesde,
            fecha_hasta: ov.fecha_hasta ?? fechaHasta,
            cargo:       ov.cargo       ?? cargo,
            placas:      ov.placas      ?? placasSel,
        }, { preserveState: true, preserveScroll: true, replace: true });

    const clearFilters = () => {
        setFechaDesde(''); setFechaHasta(''); setCargo(''); setPlacasSel([]);
        router.get(route('reparto.indicadores-resumen.index'), {}, { preserveState: false });
    };
    const hasFilters = fechaDesde || fechaHasta || cargo || placasSel.length > 0;

    const conBrecha = ORDEN_INDICADORES
        .filter(k => (brechas[k] ?? 0) > 0)
        .sort((a, b) => (brechas[b] ?? 0) - (brechas[a] ?? 0));

    // Chart: tendencia
    const lineData = {
        labels: tendencia.map(p => p.fecha),
        datasets: [
            { label: 'Adherencia al Tiempo', data: tendencia.map(p => p.adh),
              borderColor: '#15803d', backgroundColor: 'rgba(21,128,61,.08)',
              tension: 0.4, fill: true, pointRadius: 2, borderWidth: 2 },
            { label: 'Entrega en Rango', data: tendencia.map(p => p.entrega),
              borderColor: '#0891b2', backgroundColor: 'rgba(8,145,178,.08)',
              tension: 0.4, fill: true, pointRadius: 2, borderWidth: 2 },
            { label: 'Checklist Pre', data: tendencia.map(p => p.cl_pre),
              borderColor: '#d97706', backgroundColor: 'transparent',
              tension: 0.4, fill: false, pointRadius: 2, borderWidth: 1.5,
              borderDash: [4, 3] },
        ],
    };
    const lineOpts: ChartOptions<'line'> = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, color: '#6b7280' } },
            tooltip: { callbacks: { label: (ctx: TooltipItem<'line'>) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%` } },
        },
        scales: {
            y: { min: 0, max: 100, ticks: { color: '#9ca3af', font: { size: 10 }, callback: (v: any) => `${v}%` }, grid: { color: 'rgba(0,0,0,.04)' } },
            x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 10 } } },
        },
    };

    // Chart: incumplimiento por cargo
    const cargoBarData = {
        labels: por_cargo.map(c => c.cargo),
        datasets: [
            { label: 'CL Pre en 0%',      data: por_cargo.map(c => c.cl_pre_cero),  backgroundColor: '#fbbf24', stack: 'incump' },
            { label: 'Entrega bajo 80%',   data: por_cargo.map(c => c.entrega_bajo), backgroundColor: '#f97316', stack: 'incump' },
            { label: 'Adherencia bajo 80%',data: por_cargo.map(c => c.adh_bajo),     backgroundColor: '#ef4444', stack: 'incump' },
            { label: 'Alertas velocidad',  data: por_cargo.map(c => c.alertas_sum),  backgroundColor: '#8b5cf6', stack: 'incump' },
        ],
    };
    const cargoBarOpts: ChartOptions<'bar'> = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, color: '#6b7280' } },
            tooltip: { mode: 'index', intersect: false },
        },
        scales: {
            x: { stacked: true, grid: { display: false }, ticks: { color: '#6b7280', font: { size: 10 } } },
            y: { stacked: true, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { color: '#9ca3af', font: { size: 10 } } },
        },
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Resumen Ejecutivo — Reparto" />

            <div className="flex flex-col gap-5 px-4 pb-10 sm:px-6">

                {/* ── Título ── */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                        Resumen Ejecutivo de Indicadores
                    </h1>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        Período: {kpis.periodo_desde} – {kpis.periodo_hasta} · {kpis.total_registros.toLocaleString()} registros
                    </p>
                </div>

                {/* ── Tabs de navegación ── */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'Resumen Ejecutivo', href: route('reparto.indicadores-resumen.index'), active: true, icon: BarChart3 },
                        { label: 'Velocidad',          href: route('reparto.indicadores.index'),          active: false, icon: Map },
                        { label: 'Adherencia Checklist', href: route('reparto.indicadores-adherencia.index'), active: false, icon: ClipboardCheck },
                        { label: 'Adh. al Tiempo',    href: route('reparto.indicadores-tiempo.index'),   active: false, icon: Clock },
                        { label: 'Entrega en Rango',  href: route('reparto.indicadores-entrega-rango.index'), active: false, icon: Activity },
                    ].map(({ label, href, active, icon: Icon }) => (
                        active ? (
                            <span key={label}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-green-700 bg-green-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                                <Icon className="size-3.5" />{label}
                            </span>
                        ) : (
                            <Link key={label} href={href}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800">
                                <Icon className="size-3.5" />{label}
                            </Link>
                        )
                    ))}
                </div>

                {/* ── Filtros ── */}
                <Card className="p-4">
                    <SectionHeader icon={Calendar} title="Filtros" subtitle="Segmenta por fecha, cargo y placa" />
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="grid gap-1">
                            <Label className="text-[10px] font-semibold uppercase text-gray-400">Fecha desde</Label>
                            <Input type="date" value={fechaDesde} className="h-8 text-xs rounded-lg"
                                onChange={e => { setFechaDesde(e.target.value); apply({ fecha_desde: e.target.value }); }} />
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-[10px] font-semibold uppercase text-gray-400">Fecha hasta</Label>
                            <Input type="date" value={fechaHasta} className="h-8 text-xs rounded-lg"
                                onChange={e => { setFechaHasta(e.target.value); apply({ fecha_hasta: e.target.value }); }} />
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-[10px] font-semibold uppercase text-gray-400">Cargo</Label>
                            <select value={cargo}
                                className="h-8 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-green-600 focus:outline-none"
                                onChange={e => { setCargo(e.target.value); apply({ cargo: e.target.value }); }}>
                                <option value="">Todos los cargos</option>
                                {cargos.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-[10px] font-semibold uppercase text-gray-400">Placa(s)</Label>
                            <PlacaMultiSelect todas={todasPlacas} seleccionadas={placasSel}
                                onChange={v => { setPlacasSel(v); apply({ placas: v }); }} />
                        </div>
                    </div>
                    {hasFilters && (
                        <div className="mt-3 flex justify-end">
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-gray-400 hover:text-red-500">
                                <X className="size-3 mr-1" />Limpiar filtros
                            </Button>
                        </div>
                    )}
                </Card>

                {/* ── KPIs ejecutivos ── */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Kpi
                        label="Cumplimiento General"
                        value={kpis.cumpl_general !== null ? `${kpis.cumpl_general}%` : '—'}
                        sub={`${estadoLabel(kpis.cumpl_general)} · ${kpis.total_indicadores} indicadores`}
                        color={semaforo(kpis.cumpl_general)}
                        icon={Target}
                    />
                    <Kpi
                        label="Metas cumplidas"
                        value={`${kpis.metas_cumplidas} / ${kpis.total_indicadores}`}
                        sub="Indicadores con cumplimiento ≥ 95%"
                        color={kpis.metas_cumplidas >= kpis.total_indicadores * 0.7 ? '#15803d' : '#d97706'}
                        icon={CheckCircle2}
                    />
                    <Kpi
                        label="Entrega en Rango"
                        value={kpis.entrega_rango !== null ? `${kpis.entrega_rango}%` : '—'}
                        sub="Promedio del período"
                        color={semaforo(cumplimiento['entrega'])}
                        icon={Activity}
                    />
                    <Kpi
                        label="Adherencia al Tiempo"
                        value={kpis.adh_tiempo !== null ? `${kpis.adh_tiempo}%` : '—'}
                        sub="Promedio del período"
                        color={semaforo(cumplimiento['adh_tiempo'])}
                        icon={Clock}
                    />
                </div>

                {/* ── Cumplimiento + Brechas ── */}
                <div className="grid gap-5 xl:grid-cols-2">

                    {/* Cumplimiento por indicador */}
                    <Card className="p-5">
                        <SectionHeader
                            icon={BarChart3}
                            title="Cumplimiento por Indicador"
                            subtitle="Verde ≥ 90% · Amber ≥ 70% · Rojo < 70%"
                        />
                        <div className="mt-5 space-y-4">
                            {ORDEN_INDICADORES.map(k => (
                                <IndicadorBar key={k} ikey={k}
                                    cumpl={cumplimiento[k] ?? null}
                                    promedio={promedios[k] ?? null}
                                    meta={metas[k]}
                                    etiqueta={etiquetas[k]}
                                    unidad={unidades[k]}
                                    invertido={INVERTIDOS.has(k)}
                                />
                            ))}
                        </div>
                    </Card>

                    {/* Brechas */}
                    <Card className="p-5">
                        <SectionHeader
                            icon={AlertTriangle}
                            title="Brechas — Meta vs Realidad"
                            subtitle="Mayor barra = atacar primero"
                        />
                        <div className="mt-5">
                            {conBrecha.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-10">
                                    <CheckCircle2 className="size-10 text-green-200" />
                                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">¡Todas las metas cumplidas!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {conBrecha.map(k => (
                                        <BrechaBar key={k} ikey={k}
                                            brecha={brechas[k] ?? null}
                                            promedio={promedios[k] ?? null}
                                            meta={metas[k]}
                                            etiqueta={etiquetas[k]}
                                            unidad={unidades[k]}
                                            invertido={INVERTIDOS.has(k)}
                                        />
                                    ))}
                                    {ORDEN_INDICADORES.filter(k => (brechas[k] ?? 0) === 0 && cumplimiento[k] !== null).map(k => (
                                        <div key={k} className="flex items-center justify-between py-1 text-xs">
                                            <span className="text-gray-400">{etiquetas[k]}</span>
                                            <span className="text-green-700 dark:text-green-400 flex items-center gap-1 font-semibold">
                                                <CheckCircle2 className="size-3" />Cumplida
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {conBrecha.length > 0 && (
                                <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
                                    <p className="mb-2 text-[10px] font-semibold text-gray-500">Prioridad de acción:</p>
                                    <div className="space-y-1.5">
                                        {conBrecha.slice(0, 3).map((k, i) => (
                                            <div key={k} className="flex items-center gap-2 text-xs">
                                                <span className={`flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0 ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-amber-500' : 'bg-yellow-400'}`}>{i + 1}</span>
                                                <span className="text-gray-600 dark:text-gray-400 flex-1 truncate">{etiquetas[k]}</span>
                                                <span className="font-bold tabular-nums text-gray-700 dark:text-gray-300">
                                                    {INVERTIDOS.has(k)
                                                        ? `+${brechas[k]} ${unidades[k]}`
                                                        : `−${brechas[k]}${unidades[k] === '%' ? ' pp' : ` ${unidades[k]}`}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* ── Incumplimiento por cargo ── */}
                <Card>
                    <div className="border-b border-gray-100 p-5 dark:border-gray-800">
                        <SectionHeader
                            icon={Users}
                            title="¿En quién se concentra el incumplimiento?"
                            subtitle="Suma de días problemáticos por cargo: checklist en 0%, entrega bajo 80%, adherencia bajo 80%, alertas"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-green-700 dark:text-green-400">Cargo</th>
                                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-green-700 dark:text-green-400">Score</th>
                                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-amber-600">CL Pre 0%</th>
                                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-orange-600">Entrega &lt;80%</th>
                                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-red-600">Adh &lt;80%</th>
                                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-purple-600">Alertas</th>
                                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-green-700 dark:text-green-400">Prom. Adh.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {por_cargo.map((c) => (
                                    <tr key={c.cargo} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="max-w-[180px] truncate px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">{c.cargo}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            <Chip cls={c.score_incump > 20 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : c.score_incump > 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}>
                                                {c.score_incump}
                                            </Chip>
                                        </td>
                                        <td className="px-4 py-2.5 text-center tabular-nums font-semibold text-amber-600">{c.cl_pre_cero}</td>
                                        <td className="px-4 py-2.5 text-center tabular-nums font-semibold text-orange-600">{c.entrega_bajo}</td>
                                        <td className="px-4 py-2.5 text-center tabular-nums font-semibold text-red-600">{c.adh_bajo}</td>
                                        <td className="px-4 py-2.5 text-center tabular-nums font-semibold text-purple-600">{c.alertas_sum}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums font-bold"
                                            style={{ color: c.prom_adh !== null ? semaforo((c.prom_adh / metas['adh_tiempo']) * 100) : '#9ca3af' }}>
                                            {c.prom_adh !== null ? `${c.prom_adh}%` : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* ── Tendencia ── */}
                <Card className="p-5">
                    <SectionHeader
                        icon={TrendingUp}
                        title="Tendencia de Indicadores Clave"
                        subtitle="Evolución diaria del período seleccionado"
                    />
                    <div className="mt-5">
                        {tendencia.length > 1 ? (
                            <div style={{ height: 240 }}>
                                <Line data={lineData} options={lineOpts} />
                            </div>
                        ) : (
                            <div className="flex h-32 items-center justify-center text-sm text-gray-300">
                                Sin datos de tendencia
                            </div>
                        )}
                    </div>
                </Card>

                {/* ── Footer ── */}
                <div className="space-y-1 border-t border-gray-100 pt-3 text-[10px] text-gray-400 dark:border-gray-800">
                    <p><strong className="text-gray-500">Fuente</strong> · Tabla eventos_tripulacion — todos los campos de indicadores de desempeño</p>
                    <p><strong className="text-gray-500">Metas</strong> · Adh. Tiempo 95% · Entrega Rango 95% · Modulación 95% · CL Pre/Post 100% · Rechazos ≤2% · RMD 5/5 · Alertas/Excesos = 0</p>
                    <p><strong className="text-gray-500">Alcance</strong> · {kpis.total_registros.toLocaleString()} registros · período {kpis.periodo_desde}–{kpis.periodo_hasta}</p>
                </div>
            </div>
        </AppLayout>
    );
}
