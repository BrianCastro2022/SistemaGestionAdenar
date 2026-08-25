import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, BedDouble, Clock, Search, Timer, Users, type LucideIcon } from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Gente', href: '/modules/gente' },
    { title: 'Asistencia GeoVictoria', href: '/modules/gente/asistencia-geovictoria' },
];

const TODOS = 'todos';

type Vista = 'detalle' | 'indicadores';

// Misma paleta warning/critical ya validada (chequeo de daltonismo) que usa
// el módulo de Consultas SIMIT, para mantener el mismo lenguaje visual de
// alerta en toda la app.
const COLOR_EXCESO_JORNADA = '#d03b3b'; // critical
const COLOR_DESCANSO_NO_EFECTIVO = '#fab219'; // warning

interface RegistroRow {
    id: number;
    identificador: string;
    fecha: string;
    apellidos: string | null;
    nombres: string | null;
    cargo: string | null;
    grupo: string | null;
    entrada: string | null;
    salida_descanso: string | null;
    ingreso_descanso: string | null;
    salida: string | null;
    horas_trabajadas: string | null;
    exceso_jornada: boolean;
    horas_descanso_previo: string | null;
    descanso_no_efectivo: boolean;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface RegistrosPaginator {
    data: RegistroRow[];
    links: PaginationLink[];
    from: number | null;
}

type Filters = {
    search: string;
    grupo: string;
    cargo: string;
    tipo: string;
    fecha_desde: string;
    fecha_hasta: string;
};

interface TendenciaDia {
    fecha: string;
    exceso_jornada: number;
    descanso_no_efectivo: number;
}

interface TopEmpleado {
    identificador: string;
    nombre: string;
    total_exceso_jornada: number;
    total_descanso_no_efectivo: number;
}

interface Indicadores {
    resumen: {
        total_registros: number;
        empleados: number;
        pct_exceso_jornada: number;
        pct_descanso_no_efectivo: number;
        promedio_horas_trabajadas: string | null;
    };
    tendencia_diaria: TendenciaDia[];
    top_empleados: TopEmpleado[];
}

interface Opciones {
    grupos: string[];
    cargos: string[];
}

interface KpiTile {
    label: string;
    valor: string | number;
    icon: LucideIcon;
    color: string;
}

function KpiCard({ kpi }: { kpi: KpiTile }) {
    return (
        <Card className="border-sidebar-border/70 dark:border-sidebar-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <div
                    className="flex size-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: kpi.color + '1a', color: kpi.color }}
                >
                    <kpi.icon className="size-4" />
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-semibold">{kpi.valor}</p>
            </CardContent>
        </Card>
    );
}

function formatFechaCorta(fecha: string): string {
    const [, mes, dia] = fecha.split('-');
    return `${dia}/${mes}`;
}

function nombreCompleto(registro: RegistroRow): string {
    return [registro.nombres, registro.apellidos].filter(Boolean).join(' ') || registro.identificador;
}

export default function GeovictoriaAsistenciaIndex({
    registros,
    indicadores,
    filters,
    opciones,
}: {
    registros: RegistrosPaginator;
    indicadores: Indicadores;
    filters: Filters;
    opciones: Opciones;
}) {
    const [vista, setVista] = useState<Vista>('indicadores');
    const [search, setSearch] = useState(filters.search);
    const isFirstRender = useRef(true);

    const applyFilters = (overrides: Partial<Filters>) => {
        router.get(route('gente.asistencia-geovictoria.index'), { ...filters, search, ...overrides }, { preserveState: true, replace: true });
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeout = setTimeout(() => applyFilters({ search }), 400);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const submitFilters: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const sinTendencia = indicadores.tendencia_diaria.every((dia) => dia.exceso_jornada + dia.descanso_no_efectivo === 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asistencia GeoVictoria" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <HeadingSmall
                        title="Asistencia GeoVictoria"
                        description="Exceso de jornada y descanso no efectivo, calculados automáticamente cada día."
                    />
                    <div className="flex rounded-md border border-sidebar-border/70 p-1">
                        <Button
                            type="button"
                            variant={vista === 'indicadores' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setVista('indicadores')}
                        >
                            Indicadores
                        </Button>
                        <Button type="button" variant={vista === 'detalle' ? 'default' : 'ghost'} size="sm" onClick={() => setVista('detalle')}>
                            Detalle
                        </Button>
                    </div>
                </div>

                {vista === 'indicadores' ? (
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <KpiCard kpi={{ label: 'Empleados monitoreados', valor: indicadores.resumen.empleados, icon: Users, color: '#0ca30c' }} />
                            <KpiCard kpi={{ label: 'Registros totales', valor: indicadores.resumen.total_registros, icon: Clock, color: '#0ca30c' }} />
                            <KpiCard
                                kpi={{
                                    label: 'Exceso de jornada',
                                    valor: `${indicadores.resumen.pct_exceso_jornada}%`,
                                    icon: Timer,
                                    color: COLOR_EXCESO_JORNADA,
                                }}
                            />
                            <KpiCard
                                kpi={{
                                    label: 'Descanso no efectivo',
                                    valor: `${indicadores.resumen.pct_descanso_no_efectivo}%`,
                                    icon: BedDouble,
                                    color: COLOR_DESCANSO_NO_EFECTIVO,
                                }}
                            />
                            <KpiCard
                                kpi={{
                                    label: 'Promedio horas trabajadas',
                                    valor: indicadores.resumen.promedio_horas_trabajadas ?? '—',
                                    icon: Clock,
                                    color: '#0ca30c',
                                }}
                            />
                        </div>

                        <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">Incidencias por día (últimos 30 días)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sinTendencia ? (
                                    <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay incidencias registradas en este rango.</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={indicadores.tendencia_diaria}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="fecha" tickFormatter={formatFechaCorta} tick={{ fontSize: 12 }} interval={2} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                            <Tooltip labelFormatter={(label) => formatFechaCorta(String(label))} />
                                            <Legend
                                                formatter={(value: string) =>
                                                    value === 'exceso_jornada' ? 'Exceso de jornada' : 'Descanso no efectivo'
                                                }
                                            />
                                            <Bar dataKey="exceso_jornada" stackId="dia" name="exceso_jornada" fill={COLOR_EXCESO_JORNADA} />
                                            <Bar
                                                dataKey="descanso_no_efectivo"
                                                stackId="dia"
                                                name="descanso_no_efectivo"
                                                radius={[4, 4, 0, 0]}
                                                fill={COLOR_DESCANSO_NO_EFECTIVO}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">Empleados con más incidencias (histórico)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {indicadores.top_empleados.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-muted-foreground">Ningún empleado ha registrado incidencias todavía.</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={indicadores.top_empleados}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="nombre" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Legend
                                                formatter={(value: string) =>
                                                    value === 'total_exceso_jornada' ? 'Exceso de jornada' : 'Descanso no efectivo'
                                                }
                                            />
                                            <Bar dataKey="total_exceso_jornada" name="total_exceso_jornada" stackId="emp" fill={COLOR_EXCESO_JORNADA} />
                                            <Bar
                                                dataKey="total_descanso_no_efectivo"
                                                name="total_descanso_no_efectivo"
                                                stackId="emp"
                                                radius={[4, 4, 0, 0]}
                                                fill={COLOR_DESCANSO_NO_EFECTIVO}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-end gap-2">
                            <form onSubmit={submitFilters} className="flex max-w-xs items-center gap-2">
                                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o identificador..." />
                                <Button type="submit" variant="secondary" size="icon" aria-label="Buscar">
                                    <Search className="size-4" />
                                </Button>
                            </form>

                            <Select value={filters.tipo || TODOS} onValueChange={(value) => applyFilters({ tipo: value === TODOS ? '' : value })}>
                                <SelectTrigger className="w-52">
                                    <SelectValue placeholder="Incidencia" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TODOS}>Incidencia: todas</SelectItem>
                                    <SelectItem value="exceso_jornada">Exceso de jornada</SelectItem>
                                    <SelectItem value="descanso_no_efectivo">Descanso no efectivo</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filters.grupo || TODOS} onValueChange={(value) => applyFilters({ grupo: value === TODOS ? '' : value })}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Grupo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TODOS}>Grupo: todos</SelectItem>
                                    {opciones.grupos.map((grupo) => (
                                        <SelectItem key={grupo} value={grupo}>
                                            {grupo}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filters.cargo || TODOS} onValueChange={(value) => applyFilters({ cargo: value === TODOS ? '' : value })}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TODOS}>Cargo: todos</SelectItem>
                                    {opciones.cargos.map((cargo) => (
                                        <SelectItem key={cargo} value={cargo}>
                                            {cargo}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="grid gap-1">
                                <Label className="text-xs text-muted-foreground">Desde</Label>
                                <Input
                                    type="date"
                                    className="w-40"
                                    value={filters.fecha_desde}
                                    onChange={(e) => applyFilters({ fecha_desde: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label className="text-xs text-muted-foreground">Hasta</Label>
                                <Input
                                    type="date"
                                    className="w-40"
                                    value={filters.fecha_hasta}
                                    onChange={(e) => applyFilters({ fecha_hasta: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Empleado</TableHead>
                                        <TableHead>Cargo</TableHead>
                                        <TableHead>Grupo</TableHead>
                                        <TableHead>Entrada</TableHead>
                                        <TableHead>Salida</TableHead>
                                        <TableHead>Horas trabajadas</TableHead>
                                        <TableHead>Incidencias</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {registros.data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-muted-foreground py-6 text-center">
                                                No se encontraron registros.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {registros.data.map((registro, index) => (
                                        <TableRow
                                            key={registro.id}
                                            className={registro.exceso_jornada || registro.descanso_no_efectivo ? 'bg-destructive/5' : undefined}
                                        >
                                            <TableCell className="text-muted-foreground">{(registros.from ?? 1) + index}</TableCell>
                                            <TableCell>{registro.fecha}</TableCell>
                                            <TableCell className="font-medium">{nombreCompleto(registro)}</TableCell>
                                            <TableCell>{registro.cargo ?? '—'}</TableCell>
                                            <TableCell>{registro.grupo ?? '—'}</TableCell>
                                            <TableCell>{registro.entrada ?? '—'}</TableCell>
                                            <TableCell>{registro.salida ?? '—'}</TableCell>
                                            <TableCell>{registro.horas_trabajadas ?? '—'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {registro.exceso_jornada && (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <Timer className="size-3" />
                                                            Exceso jornada
                                                        </Badge>
                                                    )}
                                                    {registro.descanso_no_efectivo && (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <AlertTriangle className="size-3" />
                                                            Descanso no efectivo
                                                        </Badge>
                                                    )}
                                                    {!registro.exceso_jornada && !registro.descanso_no_efectivo && (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {registros.links.length > 3 && (
                            <div className="flex flex-wrap gap-1">
                                {registros.links.map((link, index) => (
                                    <Button key={index} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url} asChild={!!link.url}>
                                        {link.url ? (
                                            <Link href={link.url} preserveScroll dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
