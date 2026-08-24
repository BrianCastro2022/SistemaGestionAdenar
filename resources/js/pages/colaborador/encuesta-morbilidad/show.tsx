import HeadingSmall from '@/components/heading-small';
import { SeccionLectura } from '@/components/morbilidad/seccion-lectura';
import { seccionesOrdenadas, type RespuestasState, type SeccionesCatalogo } from '@/components/morbilidad/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface EncuestaDetalle {
    id: number;
    estado: string;
    fecha_hora: string;
    enviado_en: string | null;
}

interface ColaboradorPrecarga {
    nombre_completo: string;
    cedula: string;
    area: string | null;
    cargo: string | null;
}

export default function EncuestaMorbilidadShow({
    encuesta,
    colaborador,
    secciones,
    respuestas,
}: {
    encuesta: EncuestaDetalle;
    colaborador: ColaboradorPrecarga;
    secciones: SeccionesCatalogo;
    respuestas: RespuestasState;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Encuesta de Morbilidad', href: '/portal/encuesta-morbilidad' },
        { title: 'Mi historial', href: '/portal/encuesta-morbilidad/historial' },
        { title: `Encuesta del ${new Date(encuesta.fecha_hora).toLocaleDateString()}`, href: `/portal/encuesta-morbilidad/${encuesta.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detalle de mi encuesta" />
            <div className="mx-auto flex h-full w-full max-w-3xl flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <HeadingSmall
                        title={`${colaborador.nombre_completo} — ${colaborador.cedula}`}
                        description={`Enviada el ${encuesta.enviado_en ? new Date(encuesta.enviado_en).toLocaleString() : '—'}`}
                    />
                    <Badge variant={encuesta.estado === 'completada' ? 'default' : 'secondary'}>
                        {encuesta.estado === 'completada' ? 'Completada' : 'Borrador'}
                    </Badge>
                </div>

                {seccionesOrdenadas(secciones).map((seccion) => (
                    <Card key={seccion.numero} className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardContent className="pt-6">
                            <p className="mb-4 text-sm font-medium text-foreground">
                                {seccion.numero}. {seccion.titulo}
                            </p>
                            <SeccionLectura seccion={seccion} respuestas={respuestas} />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </AppLayout>
    );
}
