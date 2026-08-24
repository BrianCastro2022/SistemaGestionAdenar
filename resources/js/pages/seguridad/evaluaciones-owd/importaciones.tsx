import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Evaluaciones OWD', href: '/modules/seguridad/evaluaciones-owd' },
    { title: 'Historial de Cargas', href: '/modules/seguridad/evaluaciones-owd-importaciones' },
];

interface Importacion {
    id: number;
    nombre_archivo: string;
    created_at: string;
    usuario: { name: string } | null;
    registros_leidos: number;
    evaluaciones_identificadas: number;
    registros_nuevos: number;
    registros_duplicados: number;
    registros_sin_coincidencia_qr: number;
    registros_error: number;
    columnas_nuevas_detectadas: string[] | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ImportacionesPaginator {
    data: Importacion[];
    links: PaginationLink[];
}

export default function EvaluacionesOwdImportaciones({ importaciones }: { importaciones: ImportacionesPaginator }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Historial de cargas OWD" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <HeadingSmall title="Historial de cargas OWD" description="Archivos Excel importados al módulo de Evaluaciones OWD." />

                <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Archivo</TableHead>
                                <TableHead>Fecha y hora</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Leídos</TableHead>
                                <TableHead>Evaluaciones</TableHead>
                                <TableHead>Nuevos</TableHead>
                                <TableHead>Duplicados</TableHead>
                                <TableHead>Sin QR</TableHead>
                                <TableHead>Errores</TableHead>
                                <TableHead>Columnas nuevas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {importaciones.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                                        No se han importado archivos todavía.
                                    </TableCell>
                                </TableRow>
                            )}
                            {importaciones.data.map((importacion) => (
                                <TableRow key={importacion.id}>
                                    <TableCell className="font-medium">{importacion.nombre_archivo}</TableCell>
                                    <TableCell>{new Date(importacion.created_at).toLocaleString()}</TableCell>
                                    <TableCell>{importacion.usuario?.name ?? '—'}</TableCell>
                                    <TableCell>{importacion.registros_leidos}</TableCell>
                                    <TableCell>{importacion.evaluaciones_identificadas}</TableCell>
                                    <TableCell>{importacion.registros_nuevos}</TableCell>
                                    <TableCell>{importacion.registros_duplicados}</TableCell>
                                    <TableCell>{importacion.registros_sin_coincidencia_qr}</TableCell>
                                    <TableCell>{importacion.registros_error > 0 ? <Badge variant="destructive">{importacion.registros_error}</Badge> : 0}</TableCell>
                                    <TableCell>
                                        {importacion.columnas_nuevas_detectadas && importacion.columnas_nuevas_detectadas.length > 0
                                            ? importacion.columnas_nuevas_detectadas.join(', ')
                                            : '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {importaciones.links.length > 3 && (
                    <div className="flex flex-wrap gap-1">
                        {importaciones.links.map((link, index) => (
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
