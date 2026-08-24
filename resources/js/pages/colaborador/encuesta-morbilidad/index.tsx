import HeadingSmall from '@/components/heading-small';
import { PreguntaCampo } from '@/components/morbilidad/pregunta-campo';
import { respuestasConValoresPorDefecto, seccionesOrdenadas, type RespuestasState, type SeccionesCatalogo } from '@/components/morbilidad/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Stepper, type StepDefinition } from '@/pages/gente/colaboradores/wizard/stepper';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ClipboardList, LoaderCircle, UserCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Encuesta de Morbilidad', href: '/portal/encuesta-morbilidad' },
];

interface EncuestaFormData {
    respuestas: RespuestasState;
    [key: string]: RespuestasState;
}

interface ColaboradorPrecarga {
    nombre_completo: string;
    cedula: string;
    area: string | null;
    cargo: string | null;
}

export default function EncuestaMorbilidadForm({
    encuestaId,
    colaborador,
    fechaHora,
    secciones,
    respuestas,
}: {
    encuestaId: number;
    colaborador: ColaboradorPrecarga;
    fechaHora: string;
    secciones: SeccionesCatalogo;
    respuestas: RespuestasState;
}) {
    const lista = useMemo(() => seccionesOrdenadas(secciones), [secciones]);

    const steps: StepDefinition[] = useMemo(
        () => [
            { id: 1, label: 'Tus datos', description: 'Datos precargados', icon: UserCheck },
            ...lista.map((seccion, index) => ({
                id: index + 2,
                label: `Sección ${seccion.numero}`,
                description: seccion.titulo,
                icon: ClipboardList,
            })),
        ],
        [lista],
    );

    const [currentStep, setCurrentStep] = useState(1);

    const form = useForm<EncuestaFormData>({ respuestas: respuestasConValoresPorDefecto(secciones, respuestas) });
    // Laravel devuelve errores con claves de ruta punteada (`respuestas.7.valor`)
    // que el tipo de `form.errors` — inferido solo de las claves de nivel
    // superior del formulario — no modela; se accede vía un tipo más laxo.
    const erroresPlanos = form.errors as unknown as Record<string, string | undefined>;

    const numeroASeccionIndex = useMemo(() => {
        const mapa = new Map<number, number>();
        lista.forEach((seccion, index) => {
            Object.keys(seccion.preguntas).forEach((numero) => mapa.set(Number(numero), index + 2));
        });
        return mapa;
    }, [lista]);

    const actualizarRespuesta = (numero: number, respuesta: { valor: string | null; detalle: string | null }) => {
        form.setData('respuestas', { ...form.data.respuestas, [numero]: respuesta });
    };

    const transformarParaEnvio = (data: EncuestaFormData) => ({
        respuestas: Object.entries(data.respuestas).map(([numero, r]) => ({
            numero: Number(numero),
            valor: r.valor,
            detalle: r.detalle,
        })),
    });

    const guardarProgreso = (onSuccess?: () => void) => {
        form.transform(transformarParaEnvio);
        form.post(route('portal.encuesta-morbilidad.guardar', encuestaId), {
            preserveScroll: true,
            preserveState: true,
            onSuccess,
        });
    };

    const enviarEncuesta = () => {
        form.transform(transformarParaEnvio);
        form.post(route('portal.encuesta-morbilidad.enviar', encuestaId), {
            preserveScroll: true,
            preserveState: true,
            onError: (errores) => {
                const primeraClave = Object.keys(errores)[0];
                const numero = primeraClave ? Number(primeraClave.split('.')[1]) : null;
                const paso = numero !== null ? numeroASeccionIndex.get(numero) : null;
                if (paso) setCurrentStep(paso);
            },
        });
    };

    const esUltimoPaso = currentStep === steps.length;
    const seccionActual = currentStep >= 2 ? lista[currentStep - 2] : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Encuesta de Morbilidad Sentida" />
            <div className="mx-auto flex h-full w-full max-w-3xl flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <HeadingSmall
                        title="Encuesta de Morbilidad Sentida"
                        description="Tu progreso se guarda automáticamente al avanzar de sección."
                    />
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route('portal.encuesta-morbilidad.historial')}>Ver mi historial</Link>
                    </Button>
                </div>

                <Stepper steps={steps} currentStep={currentStep} maxUnlockedStep={steps.length} onStepClick={setCurrentStep} />

                <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                    <CardContent className="pt-6">
                        {currentStep === 1 ? (
                            <div className="space-y-4">
                                <p className="text-sm font-medium text-foreground">1. Datos del colaborador</p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Nombres y apellidos</p>
                                        <p className="text-sm text-foreground">{colaborador.nombre_completo}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Cédula</p>
                                        <p className="text-sm text-foreground">{colaborador.cedula}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Área</p>
                                        <p className="text-sm text-foreground">{colaborador.area ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Cargo</p>
                                        <p className="text-sm text-foreground">{colaborador.cargo ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Fecha y hora</p>
                                        <p className="text-sm text-foreground">{new Date(fechaHora).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            seccionActual && (
                                <div className="space-y-4">
                                    <p className="text-sm font-medium text-foreground">
                                        {seccionActual.numero}. {seccionActual.titulo}
                                    </p>
                                    <div>
                                        {Object.entries(seccionActual.preguntas).map(([numeroStr, pregunta]) => {
                                            const numero = Number(numeroStr);
                                            return (
                                                <PreguntaCampo
                                                    key={numero}
                                                    numero={numero}
                                                    pregunta={pregunta}
                                                    respuesta={form.data.respuestas[numero]}
                                                    onChange={actualizarRespuesta}
                                                    errorValor={erroresPlanos[`respuestas.${numero}.valor`]}
                                                    errorDetalle={erroresPlanos[`respuestas.${numero}.detalle`]}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        )}
                    </CardContent>
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button type="button" variant="ghost" onClick={() => guardarProgreso()} disabled={form.processing}>
                        {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                        Guardar borrador
                    </Button>

                    <div className="flex gap-2">
                        {currentStep > 1 && (
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                                Anterior
                            </Button>
                        )}
                        {esUltimoPaso ? (
                            <Button type="button" onClick={enviarEncuesta} disabled={form.processing}>
                                {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                                Finalizar y enviar
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={() => guardarProgreso(() => setCurrentStep(currentStep + 1))}
                                disabled={form.processing}
                            >
                                {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                                {currentStep === 1 ? 'Comenzar' : 'Guardar y continuar'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
