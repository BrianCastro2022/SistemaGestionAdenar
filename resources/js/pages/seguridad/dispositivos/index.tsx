import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Dispositivos', href: '/modules/seguridad/dispositivos' },
];

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
    Disponible: 'default',
    'En uso': 'secondary',
    'En mantenimiento': 'secondary',
    'Fuera de servicio': 'destructive',
};

interface DispositivoRow {
    id: number;
    codigo: string;
    marca: string | null;
    modelo: string | null;
    estado: string;
    fecha_calibracion: string | null;
    fecha_vencimiento_certificado: string | null;
    calibracion_proxima: boolean;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface DispositivosPaginator {
    data: DispositivoRow[];
    links: PaginationLink[];
}

export default function DispositivosIndex({ dispositivos, filters }: { dispositivos: DispositivosPaginator; filters: { search: string } }) {
    const [search, setSearch] = useState(filters.search);

    const submitSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(route('seguridad.dispositivos.index'), { search }, { preserveState: true, replace: true });
    };

    const destroyDispositivo = (dispositivo: DispositivoRow) => {
        router.delete(route('seguridad.dispositivos.destroy', dispositivo.id), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dispositivos" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <HeadingSmall title="Dispositivos" description="Administra los alcoholímetros disponibles para las pruebas." />
                    <Button asChild>
                        <Link href={route('seguridad.dispositivos.create')}>
                            <Plus className="size-4" />
                            Nuevo dispositivo
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submitSearch} className="flex max-w-sm items-center gap-2">
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código, marca o modelo..." />
                    <Button type="submit" variant="secondary" size="icon" aria-label="Buscar">
                        <Search className="size-4" />
                    </Button>
                </form>

                <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Marca / Modelo</TableHead>
                                <TableHead>Calibración</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dispositivos.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-muted-foreground py-6 text-center">
                                        No se encontraron dispositivos.
                                    </TableCell>
                                </TableRow>
                            )}
                            {dispositivos.data.map((dispositivo) => (
                                <TableRow key={dispositivo.id}>
                                    <TableCell className="font-medium">
                                        <Link href={route('seguridad.dispositivos.show', dispositivo.id)} className="hover:underline">
                                            {dispositivo.codigo}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {[dispositivo.marca, dispositivo.modelo].filter(Boolean).join(' / ') || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {dispositivo.fecha_calibracion ?? '—'}
                                            {dispositivo.calibracion_proxima && (
                                                <Badge variant="destructive" className="gap-1">
                                                    <AlertTriangle className="size-3" />
                                                    Próxima
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={ESTADO_VARIANT[dispositivo.estado] ?? 'default'}>{dispositivo.estado}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={route('seguridad.dispositivos.edit', dispositivo.id)}>Editar</Link>
                                            </Button>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">
                                                        Eliminar
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogTitle>¿Eliminar el dispositivo {dispositivo.codigo}?</DialogTitle>
                                                    <DialogDescription>
                                                        Esta acción elimina el dispositivo de forma lógica; el historial de pruebas se conserva.
                                                    </DialogDescription>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button variant="secondary">Cancelar</Button>
                                                        </DialogClose>
                                                        <Button variant="destructive" onClick={() => destroyDispositivo(dispositivo)}>
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

                {dispositivos.links.length > 3 && (
                    <div className="flex flex-wrap gap-1">
                        {dispositivos.links.map((link, index) => (
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
