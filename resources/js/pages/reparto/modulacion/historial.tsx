import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Eye, FileText, Search, Truck, Users } from 'lucide-react';
import { useState } from 'react';

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
    filters: { search: string };
}

// Paleta de acento del módulo Reparto
const ACCENT = '#D4102A';

export default function HistorialModulacion({ planeaciones, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('reparto.modulacion.historial'),
            { search },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleClear = () => {
        setSearch('');
        router.get(route('reparto.modulacion.historial'), {}, { preserveState: false });
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Historial de Planeaciones de Ruta" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Encabezado */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
                    <HeadingSmall
                        title="Historial de Planeaciones de Ruta"
                        description={`${planeaciones.total} planeación${planeaciones.total !== 1 ? 'es' : ''} registrada${planeaciones.total !== 1 ? 's' : ''}`}
                    />
                    <Link href={route('reparto.modulacion.index')}>
                        <Button style={{ backgroundColor: ACCENT, color: '#fff' }} className="font-semibold">
                            <Truck className="h-4 w-4 mr-2" />
                            Nueva Planeación
                        </Button>
                    </Link>
                </div>

                {/* Buscador */}
                <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                    <CardContent className="pt-4">
                        <form onSubmit={handleSearch} className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por fecha (YYYY-MM-DD), programado por, despachado por..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit" style={{ backgroundColor: ACCENT, color: '#fff' }}>
                                <Search className="h-4 w-4 mr-1" />
                                Buscar
                            </Button>
                            {filters.search && (
                                <Button type="button" variant="outline" onClick={handleClear}>
                                    Limpiar
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Tabla */}
                <Card className="border-sidebar-border/70 dark:border-sidebar-border border-t-4" style={{ borderTopColor: ACCENT }}>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <CalendarDays className="h-5 w-5" style={{ color: ACCENT }} />
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
                                <TableHeader className="bg-muted/50">
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
                                            <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                                                    <span>
                                                        {filters.search
                                                            ? 'No se encontraron planeaciones con ese criterio de búsqueda.'
                                                            : 'No hay planeaciones registradas aún.'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        planeaciones.data.map((plan) => (
                                            <TableRow key={plan.id} className="hover:bg-muted/50">
                                                {/* Fecha */}
                                                <TableCell>
                                                    <div className="font-semibold text-sm text-foreground">
                                                        {formatFecha(plan.fecha)}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground capitalize">
                                                        {getDiaSemana(plan.fecha)}
                                                    </div>
                                                </TableCell>

                                                {/* Programado Por */}
                                                <TableCell className="text-sm text-foreground">
                                                    {plan.ud_programado_por || <span className="text-muted-foreground italic">—</span>}
                                                </TableCell>

                                                {/* Despachado Por */}
                                                <TableCell className="text-sm text-foreground">
                                                    {plan.despachado_por_nombre || <span className="text-muted-foreground italic">—</span>}
                                                </TableCell>

                                                {/* Total rutas */}
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary" className="font-semibold">
                                                        <Truck className="h-3 w-3 mr-1" />
                                                        {plan.total_rutas}
                                                    </Badge>
                                                </TableCell>

                                                {/* Total tripulantes */}
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary" className="font-semibold">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        {plan.total_tripulantes}
                                                    </Badge>
                                                </TableCell>

                                                {/* Novedades */}
                                                <TableCell className="text-center">
                                                    {plan.total_novedades > 0 ? (
                                                        <Badge variant="secondary" className="font-semibold">
                                                            {plan.total_novedades}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Placas */}
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {plan.placas.length === 0 ? (
                                                            <span className="text-muted-foreground text-xs italic">Sin vehículos</span>
                                                        ) : (
                                                            plan.placas.map((placa) => (
                                                                <Badge
                                                                    key={placa}
                                                                    variant="outline"
                                                                    className="font-mono text-[11px] px-1.5 py-0"
                                                                >
                                                                    {placa}
                                                                </Badge>
                                                            ))
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Acción */}
                                                <TableCell className="text-right">
                                                    <Link
                                                        href={route('reparto.modulacion.index', { fecha: plan.fecha, readOnly: 'true' })}
                                                    >
                                                        <Button size="sm" variant="outline" className="h-8 px-2 text-xs">
                                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                                            Ver
                                                        </Button>
                                                    </Link>
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
                                <p className="text-sm text-muted-foreground">
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
                                            className="h-8 min-w-[2rem] px-2 text-xs"
                                            style={link.active ? { backgroundColor: ACCENT, color: '#fff', borderColor: ACCENT } : undefined}
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
