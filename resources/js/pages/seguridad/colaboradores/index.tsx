import HeadingSmall from '@/components/heading-small';
import { SafeImage } from '@/components/safe-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { calcularTiempoTrabajado } from '@/pages/seguridad/colaboradores/colaborador-form-fields';
import { type WizardCatalogos } from '@/pages/seguridad/colaboradores/wizard/catalogos';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Colaboradores', href: '/modules/seguridad/colaboradores' },
];

const TIPO_PADRINO_LABELS: Record<string, string> = { padrino: 'Padrino', plan_padrino_personal_nuevo: 'Plan padrino personal nuevo' };

interface ColaboradorRow {
    id: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    area: string | null;
    cargo: string | null;
    centro: string | null;
    celular_1: string | null;
    codigo_qr_skap: string | null;
    correo: string | null;
    direccion: string | null;
    centro_trabajo: string | null;
    eps: string | null;
    eps_otro: string | null;
    arl: string | null;
    arl_otro: string | null;
    fecha_ingreso_empresa: string | null;
    tipo_padrino: string | null;
    imagen: string | null;
    is_active: boolean;
    estado_registro: 'borrador' | 'completo';
    wizard_step: number | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ColaboradoresPaginator {
    data: ColaboradorRow[];
    links: PaginationLink[];
    from: number | null;
}

type ViewMode = 'lista' | 'fotografias';

type Filters = {
    search: string;
    registro: string;
    estado: string;
    area: string;
    cargo: string;
    centro: string;
    tipo_contrato: string;
    eps: string;
    arl: string;
    fecha_ingreso_desde: string;
    fecha_ingreso_hasta: string;
    vencimiento_contrato: string;
};

const TODOS = 'todos';

function nombreEps(colaborador: ColaboradorRow): string {
    if (!colaborador.eps) return '—';
    return colaborador.eps === 'Otro' ? (colaborador.eps_otro ?? 'Otro') : colaborador.eps;
}

function nombreArl(colaborador: ColaboradorRow): string {
    if (!colaborador.arl) return '—';
    return colaborador.arl === 'Otro' ? (colaborador.arl_otro ?? 'Otro') : colaborador.arl;
}

export default function ColaboradoresIndex({
    colaboradores,
    filters,
    borradoresCount,
    catalogos,
}: {
    colaboradores: ColaboradoresPaginator;
    filters: Filters;
    borradoresCount: number;
    catalogos: WizardCatalogos;
}) {
    const [search, setSearch] = useState(filters.search);
    const [viewMode, setViewMode] = useState<ViewMode>('lista');
    const debouncedSearch = useDebouncedValue(search);
    const isFirstRender = useRef(true);

    const applyFilters = (overrides: Partial<Filters>) => {
        router.get(route('seguridad.colaboradores.index'), { ...filters, search, ...overrides }, { preserveState: true, replace: true });
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        applyFilters({ search: debouncedSearch });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const submitFilters: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const toggleBorradores = () => {
        applyFilters({ registro: filters.registro === 'borrador' ? '' : 'borrador' });
    };

    const destroyColaborador = (colaborador: ColaboradorRow) => {
        router.delete(route('seguridad.colaboradores.destroy', colaborador.id), { preserveScroll: true });
    };

    const getInitials = (colaborador: ColaboradorRow) => {
        const first = colaborador.nombres?.trim().charAt(0) ?? '';
        const last = colaborador.apellidos?.trim().charAt(0) ?? '';
        return `${first}${last}`.toUpperCase();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Colaboradores" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <HeadingSmall title="Colaboradores" description="Administra el listado de colaboradores para las pruebas de alcoholemia." />
                    <Button asChild>
                        <Link href={route('seguridad.colaboradores.create')}>
                            <Plus className="size-4" />
                            Nuevo colaborador
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                    <form onSubmit={submitFilters} className="flex max-w-sm items-center gap-2">
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Identificación, nombres o apellidos..." />
                        <Button type="submit" variant="secondary" size="icon" aria-label="Buscar">
                            <Search className="size-4" />
                        </Button>
                    </form>

                    <Select value={filters.estado || TODOS} onValueChange={(value) => applyFilters({ estado: value === TODOS ? '' : value })}>
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>Estado: todos</SelectItem>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="inactivo">Inactivo</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.area || TODOS} onValueChange={(value) => applyFilters({ area: value === TODOS ? '' : value })}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Área" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>Área: todas</SelectItem>
                            <SelectItem value="Administrativa">Administrativa</SelectItem>
                            <SelectItem value="Operativa">Operativa</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.cargo || TODOS} onValueChange={(value) => applyFilters({ cargo: value === TODOS ? '' : value })}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Cargo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>Cargo: todos</SelectItem>
                            {catalogos.cargos.map((cargo) => (
                                <SelectItem key={cargo} value={cargo}>
                                    {cargo}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.centro || TODOS} onValueChange={(value) => applyFilters({ centro: value === TODOS ? '' : value })}>
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Centro" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>Centro: todos</SelectItem>
                            {catalogos.centros.map((centro) => (
                                <SelectItem key={centro} value={centro}>
                                    {centro}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.tipo_contrato || TODOS} onValueChange={(value) => applyFilters({ tipo_contrato: value === TODOS ? '' : value })}>
                        <SelectTrigger className="w-56">
                            <SelectValue placeholder="Tipo de contrato" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>Tipo de contrato: todos</SelectItem>
                            {catalogos.tiposContrato.map((tipo) => (
                                <SelectItem key={tipo} value={tipo}>
                                    {tipo}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.eps || TODOS} onValueChange={(value) => applyFilters({ eps: value === TODOS ? '' : value })}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="EPS" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>EPS: todas</SelectItem>
                            {catalogos.epsOpciones.map((eps) => (
                                <SelectItem key={eps} value={eps}>
                                    {eps}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.arl || TODOS} onValueChange={(value) => applyFilters({ arl: value === TODOS ? '' : value })}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="ARL" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>ARL: todas</SelectItem>
                            {catalogos.arlOpciones.map((arl) => (
                                <SelectItem key={arl} value={arl}>
                                    {arl}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">Ingreso desde</Label>
                        <Input
                            type="date"
                            className="w-40"
                            value={filters.fecha_ingreso_desde}
                            onChange={(e) => applyFilters({ fecha_ingreso_desde: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">Ingreso hasta</Label>
                        <Input
                            type="date"
                            className="w-40"
                            value={filters.fecha_ingreso_hasta}
                            onChange={(e) => applyFilters({ fecha_ingreso_hasta: e.target.value })}
                        />
                    </div>

                    <Select
                        value={filters.vencimiento_contrato || TODOS}
                        onValueChange={(value) => applyFilters({ vencimiento_contrato: value === TODOS ? '' : value })}
                    >
                        <SelectTrigger className="w-52">
                            <SelectValue placeholder="Vencimiento de contrato" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>Vencimiento: todos</SelectItem>
                            <SelectItem value="proximos">Próximos a vencer</SelectItem>
                            <SelectItem value="vencidos">Vencidos</SelectItem>
                            <SelectItem value="vigentes">Vigentes</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex rounded-md border border-sidebar-border/70 p-1">
                        <Button type="button" variant={viewMode === 'lista' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('lista')}>
                            Lista
                        </Button>
                        <Button
                            type="button"
                            variant={viewMode === 'fotografias' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('fotografias')}
                        >
                            Fotografías
                        </Button>
                    </div>

                    {borradoresCount > 0 && (
                        <Button type="button" variant={filters.registro === 'borrador' ? 'default' : 'outline'} size="sm" onClick={toggleBorradores}>
                            Borradores ({borradoresCount})
                        </Button>
                    )}
                </div>

                {viewMode === 'lista' ? (
                    <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Identificación</TableHead>
                                    <TableHead>Nombres y apellidos</TableHead>
                                    <TableHead>Área</TableHead>
                                    <TableHead>Cargo</TableHead>
                                    <TableHead>Centro</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Código SKAP</TableHead>
                                    <TableHead>Correo</TableHead>
                                    <TableHead>Dirección</TableHead>
                                    <TableHead>Centro de trabajo</TableHead>
                                    <TableHead>EPS</TableHead>
                                    <TableHead>ARL</TableHead>
                                    <TableHead>Fecha de ingreso</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {colaboradores.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={16} className="text-muted-foreground py-6 text-center">
                                            No se encontraron colaboradores.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {colaboradores.data.map((colaborador, index) => (
                                    <TableRow key={colaborador.id}>
                                        <TableCell className="text-muted-foreground">{(colaboradores.from ?? 1) + index}</TableCell>
                                        <TableCell>{colaborador.cedula}</TableCell>
                                        <TableCell className="font-medium">
                                            <Link href={route('seguridad.colaboradores.show', colaborador.id)} className="hover:underline">
                                                {colaborador.nombres} {colaborador.apellidos}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{colaborador.area ?? '—'}</TableCell>
                                        <TableCell>{colaborador.cargo ?? '—'}</TableCell>
                                        <TableCell>{colaborador.centro ?? '—'}</TableCell>
                                        <TableCell>{colaborador.celular_1 ?? '—'}</TableCell>
                                        <TableCell>{colaborador.codigo_qr_skap ?? '—'}</TableCell>
                                        <TableCell>{colaborador.correo ?? '—'}</TableCell>
                                        <TableCell>{colaborador.direccion ?? '—'}</TableCell>
                                        <TableCell>{colaborador.centro_trabajo ?? '—'}</TableCell>
                                        <TableCell>{nombreEps(colaborador)}</TableCell>
                                        <TableCell>{nombreArl(colaborador)}</TableCell>
                                        <TableCell>{colaborador.fecha_ingreso_empresa ?? '—'}</TableCell>
                                        <TableCell>
                                            {colaborador.estado_registro === 'borrador' ? (
                                                <Badge variant="secondary">Borrador · Paso {colaborador.wizard_step ?? 1}</Badge>
                                            ) : (
                                                <Badge variant={colaborador.is_active ? 'default' : 'destructive'}>
                                                    {colaborador.is_active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {colaborador.estado_registro === 'borrador' ? (
                                                <Button variant="default" size="sm" asChild>
                                                    <Link href={route('seguridad.colaboradores.wizard', colaborador.id)}>Continuar registro</Link>
                                                </Button>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={route('seguridad.asignaciones-conductores.create', { colaborador_id: colaborador.id, cedula: colaborador.cedula })}>
                                                            Evaluar
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={route('seguridad.colaboradores.show', colaborador.id)}>Ver</Link>
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={route('seguridad.colaboradores.edit', colaborador.id)}>Editar</Link>
                                                    </Button>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">
                                                                Eliminar
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogTitle>
                                                                ¿Eliminar a {colaborador.nombres} {colaborador.apellidos}?
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                Esta acción elimina al colaborador de forma lógica; su historial de pruebas se
                                                                conserva.
                                                            </DialogDescription>
                                                            <DialogFooter>
                                                                <DialogClose asChild>
                                                                    <Button variant="secondary">Cancelar</Button>
                                                                </DialogClose>
                                                                <Button variant="destructive" onClick={() => destroyColaborador(colaborador)}>
                                                                    Eliminar
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {colaboradores.data.length === 0 && (
                            <div className="col-span-full rounded-lg border border-dashed border-sidebar-border/70 p-8 text-center text-muted-foreground">
                                No se encontraron colaboradores.
                            </div>
                        )}
                        {colaboradores.data.map((colaborador) => (
                            <div key={colaborador.id} className="overflow-hidden rounded-2xl border border-sidebar-border/70 bg-background shadow-sm">
                                <div className="flex h-48 items-center justify-center bg-muted/40 p-4">
                                    {colaborador.imagen ? (
                                        <SafeImage
                                            src={`/storage/${colaborador.imagen}`}
                                            alt={`${colaborador.nombres} ${colaborador.apellidos}`}
                                            className="h-full w-full rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted text-3xl font-semibold text-muted-foreground">
                                            {getInitials(colaborador)}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {colaborador.estado_registro === 'borrador' ? (
                                            <Badge variant="secondary">Borrador · Paso {colaborador.wizard_step ?? 1}</Badge>
                                        ) : (
                                            <Badge variant={colaborador.is_active ? 'default' : 'destructive'}>
                                                {colaborador.is_active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        )}
                                        {colaborador.cargo ? <Badge variant="secondary">{colaborador.cargo}</Badge> : null}
                                    </div>
                                    <div className="mt-3">
                                        <Link href={route('seguridad.colaboradores.show', colaborador.id)} className="text-base font-semibold hover:underline">
                                            {colaborador.nombres} {colaborador.apellidos}
                                        </Link>
                                        <p className="mt-1 text-sm text-muted-foreground">{colaborador.cedula}</p>
                                    </div>
                                    <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                                        <div>
                                            <dt className="text-[11px] uppercase tracking-wide">Tiempo trabajado</dt>
                                            <dd className="text-foreground">{calcularTiempoTrabajado(colaborador.fecha_ingreso_empresa)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-[11px] uppercase tracking-wide">Centro</dt>
                                            <dd className="text-foreground">{colaborador.centro ?? '—'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-[11px] uppercase tracking-wide">Tipo padrino</dt>
                                            <dd className="text-foreground">{colaborador.tipo_padrino ? (TIPO_PADRINO_LABELS[colaborador.tipo_padrino] ?? colaborador.tipo_padrino) : '—'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-[11px] uppercase tracking-wide">ARL</dt>
                                            <dd className="text-foreground">{nombreArl(colaborador)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-[11px] uppercase tracking-wide">% Autónomo</dt>
                                            <dd className="text-foreground">—</dd>
                                        </div>
                                    </dl>
                                    {colaborador.estado_registro === 'borrador' ? (
                                        <div className="mt-4">
                                            <Button variant="default" size="sm" asChild>
                                                <Link href={route('seguridad.colaboradores.wizard', colaborador.id)}>Continuar registro</Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button variant="default" size="sm" asChild>
                                                <Link href={route('seguridad.asignaciones-conductores.create', { colaborador_id: colaborador.id, cedula: colaborador.cedula })}>
                                                    Evaluar
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={route('seguridad.colaboradores.show', colaborador.id)}>Ver</Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={route('seguridad.colaboradores.edit', colaborador.id)}>Editar</Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {colaboradores.links.length > 3 && (
                    <div className="flex flex-wrap gap-1">
                        {colaboradores.links.map((link, index) => (
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
            </div>
        </AppLayout>
    );
}
