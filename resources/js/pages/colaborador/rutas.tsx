import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Truck } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Mis Rutas', href: '/portal/rutas' },
];

interface AsignacionConductorRow {
    id: number;
    apto_rutas_criticas: string | null;
    cumplimiento: string | null;
    criticidad_matriz_rutas: string | null;
    observaciones: string | null;
    created_at: string;
}

function aptoVariant(valor: string | null): 'default' | 'secondary' | 'destructive' {
    if (!valor) return 'secondary';
    const normalizado = valor.toLowerCase();
    if (normalizado.includes('no')) return 'destructive';
    if (normalizado.includes('si') || normalizado.includes('sí') || normalizado.includes('apto')) return 'default';
    return 'secondary';
}

export default function ColaboradorRutas({ asignaciones }: { asignaciones: AsignacionConductorRow[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mis Rutas" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <HeadingSmall title="Mis rutas críticas" description="Historial de tus evaluaciones como conductor." />

                {asignaciones.length === 0 && (
                    <p className="text-sm text-muted-foreground">Todavía no tienes evaluaciones de conductor registradas.</p>
                )}

                <div className="grid gap-4">
                    {asignaciones.map((asignacion) => (
                        <Card key={asignacion.id} className="border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Truck className="size-4" />
                                    Evaluación del {new Date(asignacion.created_at).toLocaleDateString()}
                                </CardTitle>
                                <Badge variant={aptoVariant(asignacion.apto_rutas_criticas)}>
                                    {asignacion.apto_rutas_criticas ?? 'Sin evaluar'}
                                </Badge>
                            </CardHeader>
                            <CardContent className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">Cumplimiento</p>
                                    <p className="font-medium">{asignacion.cumplimiento ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Criticidad matriz de rutas</p>
                                    <p className="font-medium">{asignacion.criticidad_matriz_rutas ?? '—'}</p>
                                </div>
                                {asignacion.observaciones && (
                                    <div className="sm:col-span-2">
                                        <p className="text-xs text-muted-foreground">Observaciones</p>
                                        <p className="font-medium">{asignacion.observaciones}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
