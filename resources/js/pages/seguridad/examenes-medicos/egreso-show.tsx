import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { SeccionCard } from '@/pages/seguridad/colaboradores/colaborador-form-fields';
import { SimpleFileField } from '@/pages/seguridad/colaboradores/wizard/components/simple-file-field';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Ban, CalendarClock, FileCheck2, ListChecks, LoaderCircle, Stethoscope, User } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const ESTADO_LABELS: Record<string, string> = { pendiente: 'Pendiente', programado: 'Programado', ejecutado: 'Ejecutado' };

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pendiente: 'secondary',
    programado: 'default',
    ejecutado: 'outline',
};

interface ColaboradorDetalle {
    id: number;
    nombres: string;
    apellidos: string;
    cedula: string;
    cargo: string | null;
    centro: string | null;
    area: string | null;
    contrato_fecha_desde: string | null;
    contrato_fecha_hasta: string | null;
}

interface EvaluacionEgreso {
    id: number;
    fecha_evaluacion: string;
    fecha_programacion: string | null;
    fecha_examen_ejecutado: string | null;
    estado: string;
    emite: string | null;
    observacion: string | null;
    seguimiento_recomendaciones: string | null;
    seguimiento_recomendaciones_detalle: string | null;
    soporte_path: string | null;
    tipo_cierre: 'ejecutado' | 'rechazado' | null;
    fecha_rechazo: string | null;
    observacion_rechazo: string | null;
    empresa: string | null;
    estado_seguimiento: string | null;
    carta_entregada: boolean | null;
    colaborador: ColaboradorDetalle;
    concepto_aptitud: { id: number; nombre: string } | null;
}

function ProgramarEgresoDialog({ evaluacion }: { evaluacion: EvaluacionEgreso }) {
    const [open, setOpen] = useState(false);
    const { data, setData, patch, processing, errors, reset } = useForm({ fecha_programacion: evaluacion.fecha_programacion ?? '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('seguridad.examenes-medicos.egreso.programar', evaluacion.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                    Programar
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarClock className="size-5 text-sky-600 dark:text-sky-400" />
                        Programar examen de egreso
                    </DialogTitle>
                    <DialogDescription>Registra la fecha prevista para el examen.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="fecha_programacion">Fecha programada</Label>
                        <Input
                            id="fecha_programacion"
                            type="date"
                            value={data.fecha_programacion}
                            onChange={(e) => setData('fecha_programacion', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.fecha_programacion} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing || !data.fecha_programacion}>
                            {processing && <LoaderCircle className="size-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EjecutarEgresoDialog({ evaluacion }: { evaluacion: EvaluacionEgreso }) {
    const [open, setOpen] = useState(false);
    const { data, setData, patch, processing, errors, reset, transform } = useForm<{
        fecha_examen_ejecutado: string;
        soporte: File[];
    }>({
        fecha_examen_ejecutado: evaluacion.fecha_examen_ejecutado ?? '',
        soporte: [],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((formData) => ({ ...formData, soporte: formData.soporte[0] ?? null }));
        patch(route('seguridad.examenes-medicos.egreso.ejecutar', evaluacion.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" size="sm">
                    Registrar ejecución
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileCheck2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                        Ejecución del examen de egreso
                    </DialogTitle>
                    <DialogDescription>Registra la fecha real en que se realizó el examen y el certificado si aplica.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="fecha_examen_ejecutado">Fecha de ejecución</Label>
                        <Input
                            id="fecha_examen_ejecutado"
                            type="date"
                            value={data.fecha_examen_ejecutado}
                            onChange={(e) => setData('fecha_examen_ejecutado', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.fecha_examen_ejecutado} />
                    </div>
                    <SimpleFileField
                        label="Certificado (opcional)"
                        files={data.soporte}
                        multiple={false}
                        onChange={(files) => setData('soporte', files)}
                        error={errors.soporte}
                        disabled={processing}
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing || !data.fecha_examen_ejecutado}>
                            {processing && <LoaderCircle className="size-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RechazarEgresoDialog({ evaluacion }: { evaluacion: EvaluacionEgreso }) {
    const [open, setOpen] = useState(false);
    const { data, setData, patch, processing, errors, reset } = useForm({ observacion_rechazo: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('seguridad.examenes-medicos.egreso.rechazar', evaluacion.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" size="sm" variant="destructive">
                    <Ban />
                    Registrar rechazo
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Ban className="size-5 text-red-600 dark:text-red-400" />
                        Rechazo del examen de egreso
                    </DialogTitle>
                    <DialogDescription>
                        Registra que el colaborador rechazó el examen de egreso. No se puede tener a la vez un rechazo y una ejecución por examen.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="observacion_rechazo">Observación del rechazo</Label>
                        <Textarea
                            id="observacion_rechazo"
                            value={data.observacion_rechazo}
                            onChange={(e) => setData('observacion_rechazo', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.observacion_rechazo} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" variant="destructive" disabled={processing || !data.observacion_rechazo}>
                            {processing && <LoaderCircle className="size-4 animate-spin" />}
                            Registrar rechazo
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ConceptoAptitudEgresoForm({
    evaluacion,
    conceptos,
    empresaDefault,
}: {
    evaluacion: EvaluacionEgreso;
    conceptos: { id: number; nombre: string }[];
    empresaDefault: string;
}) {
    const { data, setData, patch, processing, errors } = useForm({
        concepto_aptitud_id: evaluacion.concepto_aptitud ? String(evaluacion.concepto_aptitud.id) : '',
        emite: evaluacion.emite ?? '',
        observacion: evaluacion.observacion ?? '',
        empresa: evaluacion.empresa ?? empresaDefault,
        estado_seguimiento: evaluacion.estado_seguimiento ?? '',
        carta_entregada: evaluacion.carta_entregada ?? false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('seguridad.examenes-medicos.concepto-aptitud', evaluacion.id), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="concepto_aptitud_id">Concepto de aptitud</Label>
                    <Select
                        value={data.concepto_aptitud_id || 'none'}
                        onValueChange={(value) => setData('concepto_aptitud_id', value === 'none' ? '' : value)}
                        disabled={processing}
                    >
                        <SelectTrigger id="concepto_aptitud_id">
                            <SelectValue placeholder="Sin definir" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin definir</SelectItem>
                            {conceptos.map((concepto) => (
                                <SelectItem key={concepto.id} value={String(concepto.id)}>
                                    {concepto.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.concepto_aptitud_id} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="emite">Emite</Label>
                    <Input
                        id="emite"
                        placeholder="Persona o entidad que emite el concepto"
                        value={data.emite}
                        onChange={(e) => setData('emite', e.target.value)}
                        disabled={processing}
                    />
                    <InputError message={errors.emite} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input id="empresa" value={data.empresa} onChange={(e) => setData('empresa', e.target.value)} disabled={processing} />
                    <InputError message={errors.empresa} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="estado_seguimiento">Estado de seguimiento</Label>
                    <Select
                        value={data.estado_seguimiento || 'none'}
                        onValueChange={(value) => setData('estado_seguimiento', value === 'none' ? '' : value)}
                        disabled={processing}
                    >
                        <SelectTrigger id="estado_seguimiento">
                            <SelectValue placeholder="Sin definir" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin definir</SelectItem>
                            <SelectItem value="Completo">Completo</SelectItem>
                            <SelectItem value="Incompleto">Incompleto</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.estado_seguimiento} />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input
                    id="carta_entregada"
                    type="checkbox"
                    checked={data.carta_entregada}
                    onChange={(e) => setData('carta_entregada', e.target.checked)}
                    disabled={processing}
                    className="size-4"
                />
                <Label htmlFor="carta_entregada" className="font-normal">
                    ¿Se le entregó la carta de recomendación?
                </Label>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="observacion">Observación</Label>
                <Textarea id="observacion" value={data.observacion} onChange={(e) => setData('observacion', e.target.value)} disabled={processing} />
                <InputError message={errors.observacion} />
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={processing} variant="outline">
                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                    Guardar
                </Button>
            </div>
        </form>
    );
}

function SeguimientoEgresoForm({ evaluacion, opciones }: { evaluacion: EvaluacionEgreso; opciones: string[] }) {
    const requiereDetalle = opciones[1];
    const { data, setData, patch, processing, errors } = useForm({
        seguimiento_recomendaciones: evaluacion.seguimiento_recomendaciones ?? '',
        seguimiento_recomendaciones_detalle: evaluacion.seguimiento_recomendaciones_detalle ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('seguridad.examenes-medicos.egreso.seguimiento', evaluacion.id), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="seguimiento_recomendaciones">Seguimiento a recomendaciones</Label>
                <Select
                    value={data.seguimiento_recomendaciones || undefined}
                    onValueChange={(value) => setData('seguimiento_recomendaciones', value)}
                    disabled={processing}
                >
                    <SelectTrigger id="seguimiento_recomendaciones">
                        <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                        {opciones.map((opcion) => (
                            <SelectItem key={opcion} value={opcion}>
                                {opcion}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.seguimiento_recomendaciones} />
            </div>
            {data.seguimiento_recomendaciones === requiereDetalle && (
                <div className="grid gap-2">
                    <Label htmlFor="seguimiento_recomendaciones_detalle">Detalle</Label>
                    <Textarea
                        id="seguimiento_recomendaciones_detalle"
                        value={data.seguimiento_recomendaciones_detalle}
                        onChange={(e) => setData('seguimiento_recomendaciones_detalle', e.target.value)}
                        disabled={processing}
                    />
                    <InputError message={errors.seguimiento_recomendaciones_detalle} />
                </div>
            )}
            <div className="flex justify-end">
                <Button type="submit" disabled={processing || !data.seguimiento_recomendaciones} variant="outline">
                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                    Guardar
                </Button>
            </div>
        </form>
    );
}

export default function EgresoShow({
    evaluacion,
    conceptosAptitud,
    seguimientoOpciones,
    empresaDefault,
}: {
    evaluacion: EvaluacionEgreso;
    conceptosAptitud: { id: number; nombre: string }[];
    seguimientoOpciones: string[];
    empresaDefault: string;
}) {
    const nombreColaborador = `${evaluacion.colaborador.nombres} ${evaluacion.colaborador.apellidos}`;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Seguridad', href: '/modules/seguridad' },
        { title: 'Exámenes Médicos', href: '/modules/seguridad/examenes-medicos' },
        { title: nombreColaborador, href: `/modules/seguridad/examenes-medicos/${evaluacion.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Examen de egreso — ${nombreColaborador}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <HeadingSmall
                        title={`Examen de egreso — ${nombreColaborador}`}
                        description={`Registrado el ${new Date(evaluacion.fecha_evaluacion).toLocaleDateString()}`}
                    />
                    <Badge variant={evaluacion.tipo_cierre === 'rechazado' ? 'destructive' : (ESTADO_VARIANT[evaluacion.estado] ?? 'secondary')} className="text-sm">
                        {evaluacion.tipo_cierre === 'rechazado' ? 'Ejecutado (rechazado)' : (ESTADO_LABELS[evaluacion.estado] ?? evaluacion.estado)}
                    </Badge>
                </div>

                <SeccionCard icon={User} titulo="Datos del colaborador" tono="verde">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">C.C</p>
                            <p className="text-sm text-foreground">{evaluacion.colaborador.cedula}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Cargo</p>
                            <p className="text-sm text-foreground">{evaluacion.colaborador.cargo ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">CD</p>
                            <p className="text-sm text-foreground">{evaluacion.colaborador.centro ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Área</p>
                            <p className="text-sm text-foreground">{evaluacion.colaborador.area ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Inicio de contrato</p>
                            <p className="text-sm text-foreground">
                                {evaluacion.colaborador.contrato_fecha_desde
                                    ? new Date(evaluacion.colaborador.contrato_fecha_desde).toLocaleDateString()
                                    : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Fin de contrato</p>
                            <p className="text-sm text-foreground">
                                {evaluacion.colaborador.contrato_fecha_hasta
                                    ? new Date(evaluacion.colaborador.contrato_fecha_hasta).toLocaleDateString()
                                    : '—'}
                            </p>
                        </div>
                    </div>
                </SeccionCard>

                <SeccionCard icon={CalendarClock} titulo="Programación" tono="azul">
                    <div className="flex flex-wrap items-center gap-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Fecha programada</p>
                            <p className="text-sm text-foreground">
                                {evaluacion.fecha_programacion ? new Date(evaluacion.fecha_programacion).toLocaleDateString() : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Fecha de ejecución</p>
                            <p className="text-sm text-foreground">
                                {evaluacion.fecha_examen_ejecutado ? new Date(evaluacion.fecha_examen_ejecutado).toLocaleDateString() : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Certificado</p>
                            <p className="text-sm text-foreground">
                                {evaluacion.soporte_path ? (
                                    <a
                                        href={`/storage/${evaluacion.soporte_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        Ver
                                    </a>
                                ) : (
                                    '—'
                                )}
                            </p>
                        </div>
                        {evaluacion.tipo_cierre !== 'rechazado' && (
                            <div className="ml-auto flex gap-2">
                                <ProgramarEgresoDialog evaluacion={evaluacion} />
                                <EjecutarEgresoDialog evaluacion={evaluacion} />
                                <RechazarEgresoDialog evaluacion={evaluacion} />
                            </div>
                        )}
                    </div>
                    {evaluacion.tipo_cierre === 'rechazado' && (
                        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                            <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                                <Ban className="size-4" />
                                Rechazado el {evaluacion.fecha_rechazo ? new Date(evaluacion.fecha_rechazo).toLocaleDateString() : '—'}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">{evaluacion.observacion_rechazo}</p>
                        </div>
                    )}
                </SeccionCard>

                <SeccionCard icon={Stethoscope} titulo="Concepto de aptitud" tono="verde">
                    <ConceptoAptitudEgresoForm evaluacion={evaluacion} conceptos={conceptosAptitud} empresaDefault={empresaDefault} />
                </SeccionCard>

                <SeccionCard icon={ListChecks} titulo="Seguimiento a recomendaciones" tono="azul">
                    <SeguimientoEgresoForm evaluacion={evaluacion} opciones={seguimientoOpciones} />
                </SeccionCard>
            </div>
        </AppLayout>
    );
}
