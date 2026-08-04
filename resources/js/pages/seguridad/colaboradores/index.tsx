import HeadingSmall from '@/components/heading-small';
import { SafeImage } from '@/components/safe-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Colaboradores', href: '/modules/seguridad/colaboradores' },
];

const TURNO_LABELS: Record<string, string> = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

interface ColaboradorRow {
    id: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    cargo: string | null;
    turno: string | null;
    area: string | null;
    imagen: string | null;
    is_active: boolean;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ColaboradoresPaginator {
    data: ColaboradorRow[];
    links: PaginationLink[];
}

type ViewMode = 'lista' | 'fotografias';

export default function ColaboradoresIndex({
    colaboradores,
    filters,
}: {
    colaboradores: ColaboradoresPaginator;
    filters: { search: string; turno: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [viewMode, setViewMode] = useState<ViewMode>('lista');

    const submitFilters: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(route('seguridad.colaboradores.index'), { search, turno: filters.turno }, { preserveState: true, replace: true });
    };

    const filterByTurno = (turno: string) => {
        router.get(route('seguridad.colaboradores.index'), { search, turno: turno === 'todos' ? '' : turno }, { preserveState: true, replace: true });
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

                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={submitFilters} className="flex max-w-sm items-center gap-2">
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o cédula..." />
                        <Button type="submit" variant="secondary" size="icon" aria-label="Buscar">
                            <Search className="size-4" />
                        </Button>
                    </form>

                    <Select value={filters.turno || 'todos'} onValueChange={filterByTurno}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Turno" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos los turnos</SelectItem>
                            <SelectItem value="manana">Mañana</SelectItem>
                            <SelectItem value="tarde">Tarde</SelectItem>
                            <SelectItem value="noche">Noche</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex rounded-md border border-sidebar-border/70 p-1">
                        <Button
                            type="button"
                            variant={viewMode === 'lista' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('lista')}
                        >
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
                </div>

                {viewMode === 'lista' ? (
                    <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Cédula</TableHead>
                                    <TableHead>Cargo</TableHead>
                                    <TableHead>Turno</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {colaboradores.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-muted-foreground py-6 text-center">
                                            No se encontraron colaboradores.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {colaboradores.data.map((colaborador) => (
                                    <TableRow key={colaborador.id}>
                                        <TableCell className="font-medium">
                                            <Link href={route('seguridad.colaboradores.show', colaborador.id)} className="hover:underline">
                                                {colaborador.nombres} {colaborador.apellidos}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{colaborador.cedula}</TableCell>
                                        <TableCell>{colaborador.cargo ?? '—'}</TableCell>
                                        <TableCell>{colaborador.turno ? TURNO_LABELS[colaborador.turno] : '—'}</TableCell>
                                        <TableCell>
                                            <Badge variant={colaborador.is_active ? 'default' : 'destructive'}>
                                                {colaborador.is_active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={route('seguridad.asignaciones-conductores.create', { colaborador_id: colaborador.id, cedula: colaborador.cedula })}>Evaluar</Link>
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
                                                        <DialogTitle>¿Eliminar a {colaborador.nombres} {colaborador.apellidos}?</DialogTitle>
                                                        <DialogDescription>
                                                            Esta acción elimina al colaborador de forma lógica; su historial de pruebas se conserva.
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
                                        <img
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
                                        <Badge variant={colaborador.is_active ? 'default' : 'destructive'}>
                                            {colaborador.is_active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                        {colaborador.cargo ? <Badge variant="secondary">{colaborador.cargo}</Badge> : null}
                                    </div>
                                    <div className="mt-3">
                                        <Link href={route('seguridad.colaboradores.show', colaborador.id)} className="text-base font-semibold hover:underline">
                                            {colaborador.nombres} {colaborador.apellidos}
                                        </Link>
                                        <p className="mt-1 text-sm text-muted-foreground">{colaborador.cedula}</p>
                                    </div>
                                    <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                                        <p>Turno: {colaborador.turno ? TURNO_LABELS[colaborador.turno] : '—'}</p>
                                        <p>Área: {colaborador.area ?? '—'}</p>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button variant="default" size="sm" asChild>
                                            <Link href={route('seguridad.asignaciones-conductores.create', { colaborador_id: colaborador.id, cedula: colaborador.cedula })}>Evaluar</Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={route('seguridad.colaboradores.edit', colaborador.id)}>Editar</Link>
                                        </Button>
                                    </div>
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
