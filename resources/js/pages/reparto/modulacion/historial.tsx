import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Eye, FileText, Search, Trash2, Truck, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reparto', href: '/modules/reparto/modulacion' },
    { title: 'Historial de Planeaciones', href: '/modules/reparto/modulacion-historial' },
];

interface Planeacion {
    id: number;
    fecha: string;
    ud_programado_por: string | null;
    despachado_por_nombre: string | null;
    total_rutas: number;
    total_tripulantes: number;
    total_novedades: number;
    placas: string[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginator {
    data: Planeacion[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface Props {
    planeaciones: Paginator;
    filters: { 
        fecha_desde: string;
        fecha_hasta: string;
        placa: string;
    };
}

type Filters = {
    fecha_desde: string;
    fecha_hasta: string;
    placa: string;
};

export default function HistorialModulacion({ planeaciones, filters }: Props) {
    const [fechaDesde, setFechaDesde] = useState(filters.fecha_desde ?? '');
    const [fechaHasta, setFechaHasta] = useState(filters.fecha_hasta ?? '');
    const [placa, setPlaca] = useState(filters.placa ?? '');

    const debouncedFechaDesde = useDebouncedValue(fechaDesde);
    const debouncedFechaHasta = useDebouncedValue(fechaHasta);
    const debouncedPlaca = useDebouncedValue(placa);

    const isFirstRender = useRef(true);

    const applyFilters = (overrides: Partial<Filters>) => {
        router.get(
            route('reparto.modulacion.historial'),
            {
                fecha_desde: overrides.fecha_desde ?? debouncedFechaDesde,
                fecha_hasta: overrides.fecha_hasta ?? debouncedFechaHasta,
                placa: overrides.placa ?? debouncedPlaca,
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        applyFilters({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedFechaDesde, debouncedFechaHasta, debouncedPlaca]);

    const handleClear = () => {
        setFechaDesde('');
        setFechaHasta('');
        setPlaca('');
        router.get(route('reparto.modulacion.historial'), {}, { preserveState: false });
    };

    const handleDeleteModulacion = (id: number, fecha: string) => {
        if (confirm(`¿Está seguro de eliminar la planeación del ${formatFecha(fecha)}? Esta acción no se puede deshacer.`)) {
            router.delete(route('reparto.modulacion.destroy', id), {
                onSuccess: () => {
                    router.get(route('reparto.modulacion.historial'), {}, { preserveState: false });
                },
            });
        }
    };

    // Formatea fecha YYYY-MM-DD → DD/MM/YYYY
    const formatFecha = (fecha: string) => {
        const [y, m, d] = fecha.split('-');
        return `${d}/${m}/${y}`;
    };

    // Día de semana en español
    const getDiaSemana = (fecha: string) => {
        const date = new Date(fecha + 'T12:00:00');
        return date.toLocaleDateString('es-CO', { weekday: 'long' });
    };

    const hasActiveFilters = fechaDesde || fechaHasta || placa;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Historial de Planeaciones de Ruta" />

            <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
                {/* Encabezado */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <FileText className="h-7 w-7 text-red-600" />
                            Historial de Planeaciones de Ruta
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {planeaciones.total} planeación{planeaciones.total !== 1 ? 'es' : ''} registrada{planeaciones.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Link href={route('reparto.modulacion.index')}>
                        <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm">
                            <Truck className="h-4 w-4 mr-2" />
                            Nueva Planeación
                        </Button>
                    </Link>
                </div>

                {/* Filtros */}
                <Card className="shadow-sm border bg-white dark:bg-gray-900">
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                            <div className="grid gap-1">
                                <Label className="text-xs font-semibold uppercase text-gray-600">
                                    <CalendarDays className="h-3 w-3 inline mr-1" />
                                    Fecha desde
                                </Label>
                                <Input
                                    type="date"
                                    value={fechaDesde}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-semibold uppercase text-gray-600">
                                    <CalendarDays className="h-3 w-3 inline mr-1" />
                                    Fecha hasta
                                </Label>
                                <Input
                                    type="date"
                                    value={fechaHasta}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-semibold uppercase text-gray-600">
                                    <Truck className="h-3 w-3 inline mr-1" />
                                    Placa
                                </Label>
                                <Input
                                    type="text"
                                    placeholder="Ej: COLJV386"
                                    value={placa}
                                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                                    className="uppercase font-mono"
                                />
                            </div>

                            {hasActiveFilters && (
                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClear}
                                        className="w-full"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Limpiar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla */}
                <Card className="shadow-sm border-t-4 border-t-red-600">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-red-600" />
                            Planeaciones registradas
                            {planeaciones.from !== null && (
                                <Badge variant="secondary" className="ml-2">
                                    {planeaciones.from}–{planeaciones.to} de {planeaciones.total}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                                    <TableRow>
                                        <TableHead className="font-semibold w-36">Fecha</TableHead>
                                        <TableHead className="font-semibold">Programado Por</TableHead>
                                        <TableHead className="font-semibold">Despachado Por</TableHead>
                                        <TableHead className="text-center font-semibold w-24">Rutas</TableHead>
                                        <TableHead className="text-center font-semibold w-28">Tripulantes</TableHead>
                                        <TableHead className="text-center font-semibold w-28">Novedades</TableHead>
                                        <TableHead className="font-semibold min-w-[200px]">Vehículos</TableHead>
                                        <TableHead className="text-right font-semibold w-24">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {planeaciones.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <FileText className="h-10 w-10 text-gray-300" />
                                                    <span>
                                                        {hasActiveFilters
                                                            ? 'No se encontraron planeaciones con ese criterio de búsqueda.'
                                                            : 'No hay planeaciones registradas aún.'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        planeaciones.data.map((plan) => (
                                            <TableRow key={plan.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                                                {/* Fecha */}
                                                <TableCell>
                                                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                                        {formatFecha(plan.fecha)}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 capitalize">
                                                        {getDiaSemana(plan.fecha)}
                                                    </div>
                                                </TableCell>

                                                {/* Programado Por */}
                                                <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                                                    {plan.ud_programado_por || <span className="text-gray-400 italic">—</span>}
                                                </TableCell>

                                                {/* Despachado Por */}
                                                <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                                                    {plan.despachado_por_nombre || <span className="text-gray-400 italic">—</span>}
                                                </TableCell>

                                                {/* Total rutas */}
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-semibold"
                                                    >
                                                        <Truck className="h-3 w-3 mr-1" />
                                                        {plan.total_rutas}
                                                    </Badge>
                                                </TableCell>

                                                {/* Total tripulantes */}
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold"
                                                    >
                                                        <Users className="h-3 w-3 mr-1" />
                                                        {plan.total_tripulantes}
                                                    </Badge>
                                                </TableCell>

                                                {/* Novedades */}
                                                <TableCell className="text-center">
                                                    {plan.total_novedades > 0 ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-semibold"
                                                        >
                                                            {plan.total_novedades}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Placas */}
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {plan.placas.length === 0 ? (
                                                            <span className="text-gray-400 text-xs italic">Sin vehículos</span>
                                                        ) : (
                                                            plan.placas.map((placa) => (
                                                                <Badge
                                                                    key={placa}
                                                                    variant="outline"
                                                                    className="font-mono text-[11px] px-1.5 py-0 border-gray-300"
                                                                >
                                                                    {placa}
                                                                </Badge>
                                                            ))
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Acción */}
                                                <TableCell className="text-right space-x-2 flex justify-end">
                                                    <Link
                                                        href={route('reparto.modulacion.index', { fecha: plan.fecha, readOnly: 'true' })}
                                                    >
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-2 text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                                                        >
                                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                                            Ver
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteModulacion(plan.id, plan.fecha)}
                                                        className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginación */}
                        {planeaciones.last_page > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t mt-4">
                                <p className="text-sm text-gray-500">
                                    Página {planeaciones.current_page} de {planeaciones.last_page}
                                </p>
                                <div className="flex gap-1 flex-wrap">
                                    {planeaciones.links.map((link, i) => (
                                        <Button
                                            key={i}
                                            size="sm"
                                            variant={link.active ? 'default' : 'outline'}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                            className={`h-8 min-w-[2rem] px-2 text-xs ${link.active ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
