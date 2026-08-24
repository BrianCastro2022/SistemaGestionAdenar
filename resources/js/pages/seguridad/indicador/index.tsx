import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePoll } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Indicador', href: '/modules/seguridad/indicador' },
];

const TURNO_LABELS: Record<string, string> = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche', sin_turno: 'Sin turno asignado' };

interface ColaboradorEstado {
    id: number;
    nombre: string;
    turno: string | null;
    estado: string | null;
}

interface Resumen {
    apto: number;
    observacion: number;
    no_apto: number;
    sin_evaluar: number;
}

const ESTADO_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    Apto: { label: 'Apto', variant: 'default' },
    'Apto con Observaciones': { label: 'En Observación', variant: 'secondary' },
    'No Apto': { label: 'No Apto', variant: 'destructive' },
};

export default function IndicadorIndex({
    colaboradores,
    resumen,
    novedadesPorTurno,
}: {
    colaboradores: ColaboradorEstado[];
    resumen: Resumen;
    novedadesPorTurno: Record<string, ColaboradorEstado[]>;
}) {
    usePoll(10000);

    const tarjetas = [
        { label: 'Apto', valor: resumen.apto, icon: CheckCircle2, color: '#3F7A22' },
        { label: 'En Observación', valor: resumen.observacion, icon: AlertTriangle, color: '#E3A11E' },
        { label: 'No Apto', valor: resumen.no_apto, icon: XCircle, color: '#D4102A' },
        { label: 'Sin evaluar hoy', valor: resumen.sin_evaluar, icon: HelpCircle, color: '#6B7280' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Indicador en tiempo real" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <HeadingSmall
                    title="Indicador en tiempo real"
                    description="Estado del día de todos los colaboradores. Se actualiza automáticamente cada 10 segundos."
                />

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {tarjetas.map((tarjeta) => (
                        <Card key={tarjeta.label} className="border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{tarjeta.label}</CardTitle>
                                <div
                                    className="flex size-9 items-center justify-center rounded-full"
                                    style={{ backgroundColor: `${tarjeta.color}1a`, color: tarjeta.color }}
                                >
                                    <tarjeta.icon className="size-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold tracking-tight">{tarjeta.valor}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {Object.keys(novedadesPorTurno).length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-medium tracking-tight">Novedades de hoy por turno</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(novedadesPorTurno).map(([turno, colaboradoresTurno]) => (
                                <Card key={turno} className="border-sidebar-border/70 dark:border-sidebar-border">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">{TURNO_LABELS[turno] ?? turno}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-2">
                                        {colaboradoresTurno.map((c) => (
                                            <div key={c.id} className="flex items-center justify-between text-sm">
                                                <span>{c.nombre}</span>
                                                <Badge variant={ESTADO_BADGE[c.estado ?? '']?.variant ?? 'secondary'}>
                                                    {ESTADO_BADGE[c.estado ?? '']?.label ?? c.estado}
                                                </Badge>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <h2 className="text-lg font-medium tracking-tight">Todos los colaboradores</h2>
                    <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Colaborador</TableHead>
                                    <TableHead>Turno</TableHead>
                                    <TableHead>Estado de hoy</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {colaboradores.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-muted-foreground py-6 text-center">
                                            No hay colaboradores activos.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {colaboradores.map((colaborador) => (
                                    <TableRow key={colaborador.id}>
                                        <TableCell className="font-medium">{colaborador.nombre}</TableCell>
                                        <TableCell>{colaborador.turno ? TURNO_LABELS[colaborador.turno] : '—'}</TableCell>
                                        <TableCell>
                                            {colaborador.estado ? (
                                                <Badge variant={ESTADO_BADGE[colaborador.estado]?.variant ?? 'secondary'}>
                                                    {ESTADO_BADGE[colaborador.estado]?.label ?? colaborador.estado}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Sin evaluar hoy</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
