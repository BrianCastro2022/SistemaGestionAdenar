import HeadingSmall from '@/components/heading-small';
import { SeccionLectura } from '@/components/morbilidad/seccion-lectura';
import { seccionesOrdenadas, type RespuestasState, type SeccionesCatalogo } from '@/components/morbilidad/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';

interface ColaboradorDetalle {
    id: number;
    nombres: string;
    apellidos: string;
    cedula: string;
    area: string | null;
    cargo: string | null;
}

interface EncuestaDetalle {
    id: number;
    fecha_hora: string;
    enviado_en: string | null;
}

export default function EncuestaMorbilidadShowSST({
    encuesta,
    colaborador,
    secciones,
    respuestas,
}: {
    encuesta: EncuestaDetalle;
    colaborador: ColaboradorDetalle;
    secciones: SeccionesCatalogo;
    respuestas: RespuestasState;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Seguridad', href: '/modules/seguridad' },
        { title: 'Encuestas de Morbilidad', href: '/modules/seguridad/encuestas-morbilidad' },
        { title: `${colaborador.nombres} ${colaborador.apellidos}`, href: `/modules/seguridad/encuestas-morbilidad/${encuesta.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Encuesta de Morbilidad — ${colaborador.nombres} ${colaborador.apellidos}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <HeadingSmall
                    title={`${colaborador.nombres} ${colaborador.apellidos} — ${colaborador.cedula}`}
                    description={`${[colaborador.area, colaborador.cargo].filter(Boolean).join(' · ')} · Enviada el ${
                        encuesta.enviado_en ? new Date(encuesta.enviado_en).toLocaleString() : '—'
                    }`}
                />

                {seccionesOrdenadas(secciones).map((seccion) => (
                    <Card key={seccion.numero} className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardContent className="pt-6">
                            <div className="mb-4 flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">
                                    {seccion.numero}. {seccion.titulo}
                                </p>
                                {seccion.sensible && (
                                    <Badge variant="destructive" className="gap-1">
                                        <ShieldAlert className="size-3" />
                                        Información sensible
                                    </Badge>
                                )}
                            </div>
                            <SeccionLectura seccion={seccion} respuestas={respuestas} />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </AppLayout>
    );
}
