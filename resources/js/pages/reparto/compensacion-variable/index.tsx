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
    AlertTriangle,
    BarChart2,
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
    RotateCcw,
    Search,
    ShieldAlert,
    Trash2,
    TrendingUp,
    Upload,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import React, { FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

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

interface Catalogos {
    anios: (number | string)[];
    meses: string[];
    regionales: string[];
    cds: string[];
    cargos: string[];
    codigos_ob: string[];
    codigos_gp: string[];
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
    anio?: string;
    mes?: string;
    regional?: string;
    cd?: string;
    cargo?: string;
    codigo_ob?: string;
    codigo_gp?: string;
    identificador?: string;
    nombre?: string;
    ausencia_justificada?: string;
    ausencia_injustificada?: string;
    tri_fatalidades?: string;
    adherencia_gp?: string;
    habilitadores?: string;
    market_refusals?: string;
    variable?: string;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(amount);
}

// Custom Searchable Select Dropdown Component
function SearchableSelect({
    label,
    placeholder,
    value,
    options,
    onChange,
    formatOption,
    labelColorClass = 'text-slate-500',
}: {
    label?: string;
    placeholder: string;
    value: string;
    options: (string | number)[];
    onChange: (value: string) => void;
    formatOption?: (val: string | number) => string;
    labelColorClass?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
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

    const displaySelected = value ? (formatOption ? formatOption(value) : String(value)) : placeholder;

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && <label className={`text-[11px] font-semibold block mb-1 ${labelColorClass}`}>{label}</label>}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex h-8 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-hidden"
            >
                <span className={`truncate ${!value ? 'text-slate-400' : 'font-semibold text-slate-900 dark:text-slate-100'}`}>{displaySelected}</span>
                <ChevronsUpDown className="size-3.5 shrink-0 opacity-50 ml-1 text-slate-400" />
            </button>

            {open && (
                <div className="absolute left-0 z-50 mt-1 max-h-60 w-full min-w-[160px] overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95">
                    <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-2 pb-1.5 pt-1">
                        <Search className="size-3.5 text-slate-400 mr-1.5 shrink-0" />
                        <input
                            type="text"
                            autoFocus
                            placeholder={`Buscar ${placeholder.toLowerCase()}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-hidden placeholder:text-slate-400"
                        />
                        {search && (
                            <button type="button" onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                                <X className="size-3" />
                            </button>
                        )}
                    </div>

                    <div className="max-h-44 overflow-y-auto py-1 text-xs">
                        <div
                            onClick={() => {
                                onChange('');
                                setOpen(false);
                                setSearch('');
                            }}
                            className={`flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                !value ? 'font-bold text-emerald-600' : ''
                            }`}
                        >
                            <span>Todos</span>
                            {!value && <Check className="size-3.5 text-emerald-600" />}
                        </div>

                        {filteredOptions.length === 0 ? (
                            <div className="px-2 py-2 text-center text-slate-400 text-[11px]">Sin coincidencias</div>
                        ) : (
                            filteredOptions.map((opt, idx) => {
                                const strVal = String(opt);
                                const isSelected = String(value) === strVal;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            onChange(strVal);
                                            setOpen(false);
                                            setSearch('');
                                        }}
                                        className={`flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                            isSelected ? 'font-bold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30' : 'text-slate-700 dark:text-slate-200'
                                        }`}
                                    >
                                        <span className="truncate">{formatOption ? formatOption(opt) : strVal}</span>
                                        {isSelected && <Check className="size-3.5 text-emerald-600" />}
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

// Indicator Stat Card Component
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
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
                <div className="rounded-lg p-2" style={{ backgroundColor: bgColor, color: color }}>
                    <Icon className="size-4" />
                </div>
            </div>
            <div className="mt-3">
                <div className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100">{value}</div>
                {subtext && <p className="text-[11px] text-slate-400 mt-0.5">{subtext}</p>}
            </div>
        </div>
    );
}

export default function CompensacionVariableIndex({
    data,
    indicadores,
    filters,
    catalogos,
}: {
    data: CompensacionesPaginator;
    indicadores: IndicadoresGlobales;
    filters: FiltrosReales;
    catalogos: Catalogos;
}) {
    const { flash } = usePage<{ flash?: { status?: { message: string; type: string } } }>().props;

    const [formFilters, setFormFilters] = useState<FiltrosReales>({
        anio: filters.anio || '',
        mes: filters.mes || '',
        regional: filters.regional || '',
        cd: filters.cd || '',
        cargo: filters.cargo || '',
        codigo_ob: filters.codigo_ob || '',
        codigo_gp: filters.codigo_gp || '',
        identificador: filters.identificador || '',
        nombre: filters.nombre || '',
        ausencia_justificada: filters.ausencia_justificada || '',
        ausencia_injustificada: filters.ausencia_injustificada || '',
        tri_fatalidades: filters.tri_fatalidades || '',
        adherencia_gp: filters.adherencia_gp || '',
        habilitadores: filters.habilitadores || '',
        market_refusals: filters.market_refusals || '',
        variable: filters.variable || '',
    });

    const [selectedRow, setSelectedRow] = useState<CompensacionRow | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [openImportModal, setOpenImportModal] = useState(false);
    const [previewInfo, setPreviewInfo] = useState<{ count: number; colaboradores: number; headers: string[] } | null>(null);

    const { data: uploadData, setData: setUploadData, post: postImport, processing: importing, reset: resetImport } = useForm({
        archivos: [] as File[],
    });

    const executeFilterQuery = (filtersObj: FiltrosReales) => {
        const cleanParams: Record<string, string> = {};
        Object.entries(filtersObj).forEach(([k, v]) => {
            if (v !== '' && v !== null && v !== undefined) {
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
        const vacio: FiltrosReales = {
            anio: '', mes: '', regional: '', cd: '', cargo: '',
            codigo_ob: '', codigo_gp: '', identificador: '', nombre: '',
            ausencia_justificada: '', ausencia_injustificada: '', tri_fatalidades: '',
            adherencia_gp: '', habilitadores: '', market_refusals: '', variable: '',
        };
        setFormFilters(vacio);
        router.get(route('reparto.compensacion-variable.index'), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleSelectFilterChange = (key: keyof FiltrosReales) => (val: string) => {
        const updated = { ...formFilters, [key]: val };
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
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Compensación Variable Semanal" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/50">

                {/* Header Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <HeadingSmall
                        title="Compensación Variable Semanal"
                        description="Módulo Reparto → Carga, análisis de Excel e Indicadores Globales de incentivo variable."
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button variant="destructive" size="sm" onClick={handleLimpiarTabla} disabled={indicadores.total_registros === 0}>
                            <Trash2 className="size-4 mr-1" />
                            Limpiar Datos
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <a href={route('reparto.compensacion-variable.exportar', formFilters as any)}>
                                <Download className="size-4 mr-1" />
                                Exportar CSV
                            </a>
                        </Button>
                        <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={() => setOpenImportModal(true)}>
                            <Upload className="size-4 mr-1" />
                            Subir Excel
                        </Button>
                    </div>
                </div>

                {/* Flash Message Banner */}
                {flash?.status && (
                    <div
                        className={`flex items-center justify-between rounded-lg p-4 text-sm font-medium shadow-xs ${
                            flash.status.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {flash.status.type === 'success' ? <CheckCircle2 className="size-5 text-emerald-600" /> : <AlertTriangle className="size-5 text-rose-600" />}
                            <span>{flash.status.message}</span>
                        </div>
                    </div>
                )}

                {/* 10 Indicadores Globales Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">

                    {/* Highlight Card Total Pago Variable DT */}
                    <div className="col-span-2 flex flex-col justify-between rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-4 text-white shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Total Pago Variable DT</span>
                            <div className="rounded-full bg-white/20 p-2">
                                <DollarSign className="size-5 text-white" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{formatCurrency(indicadores.total_pago_variable_dt)}</h2>
                            <p className="text-xs text-emerald-100 mt-1">Suma total a pagar</p>
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

                    <StatCard
                        title="Prom. Días Trab."
                        value={`${indicadores.prom_dias}d`}
                        subtext="Días laborados"
                        icon={Clock}
                        color="#6366F1"
                        bgColor="#EEF2FF"
                    />

                    <StatCard
                        title="Prom. % Rechazos"
                        value={`${indicadores.prom_rechazos}%`}
                        subtext="Indicador de rechazo"
                        icon={AlertTriangle}
                        color="#EF4444"
                        bgColor="#FEE2E2"
                    />

                    <StatCard
                        title="Prom. Adherencia GP"
                        value={`${indicadores.prom_adherencia_gp}%`}
                        subtext="Cumplimiento GP"
                        icon={TrendingUp}
                        color="#10B981"
                        bgColor="#D1FAE5"
                    />

                    <StatCard
                        title="Prom. Market Refusals"
                        value={indicadores.prom_market_refusals}
                        subtext="POCs promedio"
                        color="#F59E0B"
                        bgColor="#FEF3C7"
                        icon={ShieldAlert}
                    />

                    <StatCard
                        title="Habilitador = 1"
                        value={indicadores.habilitador_1}
                        subtext="Pago 100%"
                        icon={UserCheck}
                        color="#10B981"
                        bgColor="#D1FAE5"
                    />

                    <StatCard
                        title="Habilitador = 0.8"
                        value={indicadores.habilitador_08}
                        subtext="Pago 80%"
                        icon={BarChart2}
                        color="#F59E0B"
                        bgColor="#FEF3C7"
                    />

                    <StatCard
                        title="Habilitador = 0"
                        value={indicadores.habilitador_0}
                        subtext="Sin incentivo"
                        icon={Trash2}
                        color="#EF4444"
                        bgColor="#FEE2E2"
                    />

                </div>

                {/* TODOS LOS FILTROS SON SEARCHABLE SELECTS (Permiten escribir para buscar dinámicamente sin recargar página) */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            <Filter className="size-4 text-emerald-600" />
                            <span>Filtros Buscables (Select con Búsqueda en Tiempo Real)</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:text-slate-800" onClick={limpiarFiltros}>
                            <RotateCcw className="size-3 mr-1" />
                            Restablecer Filtros
                        </Button>
                    </div>

                    {/* Grupo 1: Identificación y Ubicación */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 text-xs">
                        <SearchableSelect
                            label="Año"
                            placeholder="Año"
                            value={formFilters.anio || ''}
                            options={catalogos.anios}
                            onChange={handleSelectFilterChange('anio')}
                        />
                        <SearchableSelect
                            label="Mes"
                            placeholder="Mes"
                            value={formFilters.mes || ''}
                            options={catalogos.meses}
                            onChange={handleSelectFilterChange('mes')}
                        />
                        <SearchableSelect
                            label="Regional"
                            placeholder="Regional"
                            value={formFilters.regional || ''}
                            options={catalogos.regionales}
                            onChange={handleSelectFilterChange('regional')}
                        />
                        <SearchableSelect
                            label="CD"
                            placeholder="CD"
                            value={formFilters.cd || ''}
                            options={catalogos.cds}
                            onChange={handleSelectFilterChange('cd')}
                        />
                        <SearchableSelect
                            label="Cargo"
                            placeholder="Cargo"
                            value={formFilters.cargo || ''}
                            options={catalogos.cargos}
                            onChange={handleSelectFilterChange('cargo')}
                        />
                        <SearchableSelect
                            label="Cód. OB"
                            placeholder="Cód. OB"
                            value={formFilters.codigo_ob || ''}
                            options={catalogos.codigos_ob}
                            onChange={handleSelectFilterChange('codigo_ob')}
                        />
                        <SearchableSelect
                            label="Cód. GP"
                            placeholder="Cód. GP"
                            value={formFilters.codigo_gp || ''}
                            options={catalogos.codigos_gp}
                            onChange={handleSelectFilterChange('codigo_gp')}
                        />
                        <SearchableSelect
                            label="Identificador"
                            placeholder="Identificador"
                            value={formFilters.identificador || ''}
                            options={catalogos.identificadores}
                            onChange={handleSelectFilterChange('identificador')}
                        />
                        <SearchableSelect
                            label="Nombre"
                            placeholder="Nombre"
                            value={formFilters.nombre || ''}
                            options={catalogos.nombres}
                            onChange={handleSelectFilterChange('nombre')}
                        />
                    </div>

                    {/* Grupo 2: Desempeño, Ausentismos e Incentivo */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <SearchableSelect
                            label="Aus. Justificada"
                            placeholder="Aus. Just."
                            value={formFilters.ausencia_justificada || ''}
                            options={catalogos.ausencias_justificadas}
                            formatOption={(val) => `${val} días`}
                            onChange={handleSelectFilterChange('ausencia_justificada')}
                            labelColorClass="text-amber-600 dark:text-amber-400"
                        />
                        <SearchableSelect
                            label="Aus. Injustificada"
                            placeholder="Aus. Inj."
                            value={formFilters.ausencia_injustificada || ''}
                            options={catalogos.ausencias_injustificadas}
                            formatOption={(val) => `${val} días`}
                            onChange={handleSelectFilterChange('ausencia_injustificada')}
                            labelColorClass="text-rose-600 dark:text-rose-400"
                        />
                        <SearchableSelect
                            label="TRI / Fatalidades"
                            placeholder="TRI / Fat."
                            value={formFilters.tri_fatalidades || ''}
                            options={catalogos.tri_fatalidades}
                            onChange={handleSelectFilterChange('tri_fatalidades')}
                            labelColorClass="text-orange-600 dark:text-orange-400"
                        />
                        <SearchableSelect
                            label="Adherencia GP"
                            placeholder="Adherencia GP"
                            value={formFilters.adherencia_gp || ''}
                            options={catalogos.adherencias_gp}
                            onChange={handleSelectFilterChange('adherencia_gp')}
                            labelColorClass="text-emerald-600 dark:text-emerald-400"
                        />
                        <SearchableSelect
                            label="Habilitadores"
                            placeholder="Habilitadores"
                            value={formFilters.habilitadores || ''}
                            options={catalogos.habilitadores}
                            onChange={handleSelectFilterChange('habilitadores')}
                            labelColorClass="text-teal-600 dark:text-teal-400"
                        />
                        <SearchableSelect
                            label="Market Refusals"
                            placeholder="Market Refusals"
                            value={formFilters.market_refusals || ''}
                            options={catalogos.market_refusals}
                            onChange={handleSelectFilterChange('market_refusals')}
                            labelColorClass="text-yellow-600 dark:text-yellow-400"
                        />
                        <SearchableSelect
                            label="Variable (%)"
                            placeholder="Variable"
                            value={formFilters.variable || ''}
                            options={catalogos.variables}
                            onChange={handleSelectFilterChange('variable')}
                            labelColorClass="text-indigo-600 dark:text-indigo-400"
                        />
                    </div>
                </div>

                {/* Main Data Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <Table className="text-xs">
                        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                            <TableRow>
                                <TableHead className="font-bold">Código</TableHead>
                                <TableHead className="font-bold">Nombre</TableHead>
                                <TableHead className="font-bold">Cargo</TableHead>
                                <TableHead className="font-bold">Cód. OB</TableHead>
                                <TableHead className="font-bold">Cód. GP</TableHead>
                                <TableHead className="font-bold">Identificador</TableHead>
                                <TableHead className="text-center font-bold">Aus. Justificadas</TableHead>
                                <TableHead className="text-center font-bold">Aus. Injustificadas</TableHead>
                                <TableHead className="text-center font-bold">TRI / Fatalidades</TableHead>
                                <TableHead className="text-center font-bold">Adherencia GP</TableHead>
                                <TableHead className="text-center font-bold">Market Refusals (POCs)</TableHead>
                                <TableHead className="text-center font-bold">% Rechazos</TableHead>
                                <TableHead className="text-center font-bold">Habilitadores</TableHead>
                                <TableHead className="text-center font-bold">Variable</TableHead>
                                <TableHead className="text-center font-bold">Días Trabajados</TableHead>
                                <TableHead className="text-right font-bold">Salario Variable</TableHead>
                                <TableHead className="text-right font-bold text-emerald-700 dark:text-emerald-400">Pago Variable DT</TableHead>
                                <TableHead className="text-center font-bold">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={18} className="py-10 text-center text-slate-400">
                                        No se encontraron registros de compensación variable.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.data.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                        <TableCell className="font-mono text-slate-500">#{row.id}</TableCell>
                                        <TableCell className="font-semibold text-slate-800 dark:text-slate-100">{row.nombre ?? '—'}</TableCell>
                                        <TableCell>{row.cargo ?? '—'}</TableCell>
                                        <TableCell>{row.codigo_ob ?? '—'}</TableCell>
                                        <TableCell>{row.codigo_gp ?? '—'}</TableCell>
                                        <TableCell className="font-mono font-medium">{row.identificador ?? '—'}</TableCell>
                                        <TableCell className="text-center">{row.ausencia_justificada}</TableCell>
                                        <TableCell className="text-center">
                                            {row.ausencia_injustificada > 0 ? (
                                                <Badge variant="destructive" className="text-[10px] px-1 py-0">{row.ausencia_injustificada}</Badge>
                                            ) : (
                                                row.ausencia_injustificada
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">{row.tri_fatalidades}</TableCell>
                                        <TableCell className="text-center">{row.adherencia_gp ?? '—'}</TableCell>
                                        <TableCell className="text-center">{row.market_refusals ?? '—'}</TableCell>
                                        <TableCell className="text-center">{row.porcentaje_rechazos}%</TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                className={`text-[10px] ${
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
                                        <TableCell className="text-center">{row.variable ?? '—'}</TableCell>
                                        <TableCell className="text-center">{row.dias_trabajados}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.salario_variable)}</TableCell>
                                        <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400">
                                            {formatCurrency(row.pago_variable_dt || row.total_pago)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" className="size-7 text-slate-600 hover:text-emerald-600" title="Ver detalle" onClick={() => handleOpenDetail(row)}>
                                                <Eye className="size-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {data.links && data.links.length > 3 && (
                    <div className="flex flex-wrap gap-1 justify-end pt-2">
                        {data.links.map((link, idx) => (
                            <Button
                                key={idx}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
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

                {/* Side Drawer Panel Lateral */}
                <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6">
                        <SheetHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                            <SheetTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <Eye className="size-5 text-emerald-600" />
                                Detalle de Compensación Variable
                            </SheetTitle>
                            <SheetDescription>
                                Ficha individual del colaborador y desglose completo de indicadores.
                            </SheetDescription>
                        </SheetHeader>

                        {selectedRow && (
                            <div className="mt-6 space-y-6">
                                {/* Profile Card */}
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3 border border-slate-200/60 dark:border-slate-700">
                                    <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedRow.nombre}</h3>
                                            <p className="text-xs text-slate-500">{selectedRow.cargo}</p>
                                        </div>
                                        <Badge variant="outline" className="font-mono text-xs">Código #{selectedRow.id}</Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <div><span className="font-semibold text-slate-700 dark:text-slate-300">Identificador:</span> {selectedRow.identificador}</div>
                                        <div><span className="font-semibold text-slate-700 dark:text-slate-300">Regional:</span> {selectedRow.regional ?? '—'}</div>
                                        <div><span className="font-semibold text-slate-700 dark:text-slate-300">CD:</span> {selectedRow.cd ?? '—'}</div>
                                        <div><span className="font-semibold text-slate-700 dark:text-slate-300">Cód. OB:</span> {selectedRow.codigo_ob ?? '—'}</div>
                                        <div><span className="font-semibold text-slate-700 dark:text-slate-300">Cód. GP:</span> {selectedRow.codigo_gp ?? '—'}</div>
                                        <div><span className="font-semibold text-slate-700 dark:text-slate-300">Año / Mes:</span> {selectedRow.anio} - {selectedRow.mes}</div>
                                    </div>
                                </div>

                                {/* Table of Personal Indicators */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Indicadores del Colaborador</h4>
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                        <Table className="text-xs">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell className="font-semibold text-slate-600">Ausencias Justificadas</TableCell>
                                                    <TableCell className="text-right font-bold">{selectedRow.ausencia_justificada} días</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-semibold text-slate-600">Ausencias Injustificadas</TableCell>
                                                    <TableCell className="text-right font-bold text-rose-600">{selectedRow.ausencia_injustificada} días</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-semibold text-slate-600">TRI / Fatalidades</TableCell>
                                                    <TableCell className="text-right font-bold">{selectedRow.tri_fatalidades}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-semibold text-slate-600">Adherencia GP</TableCell>
                                                    <TableCell className="text-right font-bold text-emerald-600">{selectedRow.adherencia_gp ?? '—'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-semibold text-slate-600">Market Refusals (POCs)</TableCell>
                                                    <TableCell className="text-right font-bold">{selectedRow.market_refusals ?? '—'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-semibold text-slate-600">% Rechazos</TableCell>
                                                    <TableCell className="text-right font-bold">{selectedRow.porcentaje_rechazos}%</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-semibold text-slate-600">Habilitadores</TableCell>
                                                    <TableCell className="text-right font-bold">{selectedRow.habilitadores}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-semibold text-slate-600">Variable</TableCell>
                                                    <TableCell className="text-right font-bold">{selectedRow.variable ?? '—'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-semibold text-slate-600">Días Trabajados</TableCell>
                                                    <TableCell className="text-right font-bold">{selectedRow.dias_trabajados} días</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-semibold text-slate-600">Salario Variable Base</TableCell>
                                                    <TableCell className="text-right font-bold">{formatCurrency(selectedRow.salario_variable)}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Calculated Payment Box */}
                                <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 space-y-2">
                                    <div className="flex justify-between items-center text-xs text-emerald-800 dark:text-emerald-300">
                                        <span>Fórmula: (SalarioVariable / 30) × DíasTrabajados × Variable</span>
                                        <span className="font-bold">{formatCurrency(selectedRow.salario_variable)} × {selectedRow.variable}</span>
                                    </div>
                                    <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
                                        <span className="font-bold text-sm text-emerald-950 dark:text-emerald-100">Pago Variable DT</span>
                                        <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                                            {formatCurrency(selectedRow.pago_variable_dt || selectedRow.total_pago)}
                                        </span>
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
                                Seleccione el archivo Excel (.xlsx / .xls) para analizarlo e importar los datos de compensación variable.
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
