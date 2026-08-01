import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface PruebaDetalle {
    id: number;
    tipo: string;
    resultado: string | null;
    es_positivo: boolean;
    estado: string;
    evaluacion: string;
    consentimiento_aceptado: boolean;
    consentimiento_en: string | null;
    evidencia_path: string | null;
    observaciones: string | null;
    fecha_hora: string;
    colaborador: { nombres: string; apellidos: string; cedula: string } | null;
    alcoholimetro: { codigo: string } | null;
    responsable: { name: string } | null;
}

const EVALUACION_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
    Apto: 'default',
    'Apto con Observaciones': 'secondary',
    'No Apto': 'destructive',
};

export default function PruebaShow({ prueba }: { prueba: PruebaDetalle }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Seguridad', href: '/modules/seguridad' },
        { title: 'Pruebas de Alcoholemia', href: '/modules/seguridad/pruebas' },
        { title: `Prueba #${prueba.id}`, href: `/modules/seguridad/pruebas/${prueba.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Prueba #${prueba.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <HeadingSmall
                        title={prueba.colaborador ? `${prueba.colaborador.nombres} ${prueba.colaborador.apellidos}` : `Prueba #${prueba.id}`}
                        description={`${new Date(prueba.fecha_hora).toLocaleString()} · ${prueba.tipo}`}
                    />
                    {prueba.estado === 'programada' ? (
                        <Badge variant="secondary">Programada</Badge>
                    ) : (
                        <Badge variant={EVALUACION_VARIANT[prueba.evaluacion] ?? 'default'}>{prueba.evaluacion}</Badge>
                    )}
                </div>

                <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                    <CardContent className="grid gap-3 p-6 text-sm sm:grid-cols-2">
                        <p>Cédula: {prueba.colaborador?.cedula ?? '—'}</p>
                        <p>Dispositivo: {prueba.alcoholimetro?.codigo ?? '—'}</p>
                        <p>Resultado: {prueba.resultado ?? '—'}</p>
                        <p>Responsable: {prueba.responsable?.name ?? '—'}</p>
                        <p>
                            Consentimiento informado: {prueba.consentimiento_aceptado ? 'Aceptado' : 'No registrado'}
                            {prueba.consentimiento_en ? ` (${new Date(prueba.consentimiento_en).toLocaleString()})` : ''}
                        </p>
                        {prueba.observaciones && <p className="sm:col-span-2">Observaciones: {prueba.observaciones}</p>}
                    </CardContent>
                </Card>

                {prueba.evidencia_path && (
                    <div className="max-w-md">
                        <h2 className="mb-2 text-lg font-medium tracking-tight">Evidencia</h2>
                        <img
                            src={`/storage/${prueba.evidencia_path}`}
                            alt="Evidencia de la prueba"
                            className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border"
                        />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
