import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Pruebas de Alcoholemia', href: '/modules/seguridad/pruebas' },
];

interface PruebaRow {
    id: number;
    tipo: string;
    resultado: string | null;
    es_positivo: boolean;
    estado: string;
    fecha_hora: string;
    colaborador: { nombres: string; apellidos: string; cedula: string } | null;
    alcoholimetro: { codigo: string } | null;
    responsable: { name: string } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PruebasPaginator {
    data: PruebaRow[];
    links: PaginationLink[];
}

export default function PruebasIndex({ pruebas, filters }: { pruebas: PruebasPaginator; filters: { estado: string } }) {
    const filtrarPorEstado = (estado: string) => {
        router.get(route('seguridad.pruebas.index'), { estado: estado === 'todas' ? '' : estado }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pruebas de Alcoholemia" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <HeadingSmall title="Pruebas de Alcoholemia" description="Registro y programación de pruebas de alcoholemia." />
                    <Button asChild>
                        <Link href={route('seguridad.pruebas.create')}>
                            <Plus className="size-4" />
                            Registrar prueba
                        </Link>
                    </Button>
                </div>

                <Select value={filters.estado || 'todas'} onValueChange={filtrarPorEstado}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todas">Todos los estados</SelectItem>
                        <SelectItem value="realizada">Realizadas</SelectItem>
                        <SelectItem value="programada">Programadas</SelectItem>
                        <SelectItem value="cancelada">Canceladas</SelectItem>
                    </SelectContent>
                </Select>

                <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Colaborador</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Dispositivo</TableHead>
                                <TableHead>Resultado</TableHead>
                                <TableHead>Responsable</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pruebas.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-muted-foreground py-6 text-center">
                                        No se encontraron pruebas.
                                    </TableCell>
                                </TableRow>
                            )}
                            {pruebas.data.map((prueba) => (
                                <TableRow key={prueba.id}>
                                    <TableCell>
                                        <Link href={route('seguridad.pruebas.show', prueba.id)} className="hover:underline">
                                            {new Date(prueba.fecha_hora).toLocaleString()}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {prueba.colaborador ? `${prueba.colaborador.nombres} ${prueba.colaborador.apellidos}` : '—'}
                                    </TableCell>
                                    <TableCell className="capitalize">{prueba.tipo}</TableCell>
                                    <TableCell>{prueba.alcoholimetro?.codigo ?? '—'}</TableCell>
                                    <TableCell>
                                        {prueba.estado === 'programada' ? (
                                            <Badge variant="secondary">Programada</Badge>
                                        ) : (
                                            <Badge variant={prueba.es_positivo ? 'destructive' : 'default'}>
                                                {prueba.resultado} — {prueba.es_positivo ? 'Positivo' : 'Negativo'}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{prueba.responsable?.name ?? '—'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {pruebas.links.length > 3 && (
                    <div className="flex flex-wrap gap-1">
                        {pruebas.links.map((link, index) => (
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
