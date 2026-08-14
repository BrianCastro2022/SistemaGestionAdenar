import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { SeccionCard } from '@/pages/seguridad/colaboradores/colaborador-form-fields';
import { SimpleFileField } from '@/pages/seguridad/colaboradores/wizard/components/simple-file-field';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Ban, CalendarClock, CheckCircle2, FileCheck2, History, LoaderCircle, Plus, Stethoscope, User } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const TIPO_LABELS: Record<string, string> = { ingreso: 'Ingreso', periodico: 'Periódico' };

const ESTADO_LABELS: Record<string, string> = {
    sin_iniciar: 'Sin Iniciar',
    demorada: 'Demorada',
    en_proceso: 'En Proceso',
    terminada: 'Terminada',
};

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    sin_iniciar: 'secondary',
    demorada: 'destructive',
    en_proceso: 'default',
    terminada: 'outline',
};

const ESTADO_EXAMEN_LABELS: Record<string, string> = { pendiente: 'Pendiente', programado: 'Programado', realizado: 'Realizado' };

interface ExamenLigero {
    id: number;
    nombre: string;
}

interface ExamenEvaluacionRow {
    id: number;
    obligatorio: boolean;
    origen: 'matriz' | 'adicional';
    estado: 'pendiente' | 'programado' | 'realizado';
    fecha_programacion: string | null;
    fecha_ejecucion: string | null;
    soporte_path: string | null;
    fecha_ingreso_pdf: string | null;
    hora_ingreso_pdf: string | null;
    examen: ExamenLigero;
}

interface ColaboradorDetalle {
    id: number;
    nombres: string;
    apellidos: string;
    cedula: string;
    cargo: string | null;
    centro: string | null;
    area: string | null;
    fecha_ingreso_empresa: string | null;
}

interface ResponsableLigero {
    id: number;
    first_name: string;
    last_name: string;
}

interface SeguimientoRow {
    id: number;
    fecha_seguimiento: string;
    estado_seguimiento: string;
    observacion: string | null;
    responsable: ResponsableLigero | null;
    fecha_proximo_seguimiento: string | null;
    carta_recomendacion_entregada: boolean;
    soporte_path: string | null;
}

interface EvaluacionRecomendacionRow {
    id: number;
    observacion: string | null;
    activa: boolean;
    fecha_registro: string;
    recomendacion: { id: number; nombre: string; categoria: string };
    seguimientos: SeguimientoRow[];
}

interface EvaluacionDetalle {
    id: number;
    tipo_evaluacion: string;
    fecha_evaluacion: string;
    proximo_examen_fecha: string | null;
    fecha_entrada_bandeja: string | null;
    estado: string;
    observacion: string | null;
    emite: string | null;
    seguimiento_recomendaciones: string | null;
    seguimiento_recomendaciones_detalle: string | null;
    estado_seguimiento: string | null;
    empresa: string | null;
    carta_entregada: boolean | null;
    carta_entregada_observacion: string | null;
    colaborador: ColaboradorDetalle;
    concepto_aptitud: { id: number; nombre: string } | null;
    examenes: ExamenEvaluacionRow[];
    recomendaciones: EvaluacionRecomendacionRow[];
}

function ProgramarDialog({ evaluacionId, examenEvaluacion }: { evaluacionId: number; examenEvaluacion: ExamenEvaluacionRow }) {
    const [open, setOpen] = useState(false);
    const { data, setData, patch, processing, errors, reset } = useForm({ fecha_programacion: examenEvaluacion.fecha_programacion ?? '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('seguridad.examenes-medicos.examenes.programar', [evaluacionId, examenEvaluacion.id]), {
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
                        Programar {examenEvaluacion.examen.nombre}
                    </DialogTitle>
                    <DialogDescription>Registra la fecha prevista para este examen.</DialogDescription>
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

function EjecutarDialog({ evaluacionId, examenEvaluacion }: { evaluacionId: number; examenEvaluacion: ExamenEvaluacionRow }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, transform } = useForm<{
        fecha_ejecucion: string;
        soporte: File[];
        observacion: string;
    }>({
        fecha_ejecucion: examenEvaluacion.fecha_ejecucion ?? '',
        soporte: [],
        observacion: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((formData) => ({ ...formData, soporte: formData.soporte[0] ?? null }));
        post(route('seguridad.examenes-medicos.examenes.ejecutar', [evaluacionId, examenEvaluacion.id]), {
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
                        Ejecución de {examenEvaluacion.examen.nombre}
                    </DialogTitle>
                    <DialogDescription>Registra la fecha real en que se realizó el examen y el soporte si aplica.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="fecha_ejecucion">Fecha de ejecución</Label>
                        <Input
                            id="fecha_ejecucion"
                            type="date"
                            value={data.fecha_ejecucion}
                            onChange={(e) => setData('fecha_ejecucion', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.fecha_ejecucion} />
                    </div>
                    <SimpleFileField
                        label="Soporte (opcional)"
                        files={data.soporte}
                        multiple={false}
                        onChange={(files) => setData('soporte', files)}
                        error={errors.soporte}
                        disabled={processing}
                    />
                    <div className="grid gap-2">
                        <Label htmlFor="observacion">Observación</Label>
                        <Textarea
                            id="observacion"
                            value={data.observacion}
                            onChange={(e) => setData('observacion', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.observacion} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing || !data.fecha_ejecucion}>
                            {processing && <LoaderCircle className="size-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AgregarAdicionalDialog({ evaluacionId, opciones }: { evaluacionId: number; opciones: ExamenLigero[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ examen_id: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('seguridad.examenes-medicos.examenes.adicional', evaluacionId), {
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
                <Button type="button" variant="outline">
                    <Plus />
                    Agregar examen adicional
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agregar examen adicional</DialogTitle>
                    <DialogDescription>Suma un examen que no vino de la matriz del cargo — no bloquea que la evaluación se termine.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="examen_id">Examen</Label>
                        <Select value={data.examen_id} onValueChange={(value) => setData('examen_id', value)} disabled={processing}>
                            <SelectTrigger id="examen_id">
                                <SelectValue placeholder="Selecciona el examen" />
                            </SelectTrigger>
                            <SelectContent>
                                {opciones.map((examen) => (
                                    <SelectItem key={examen.id} value={String(examen.id)}>
                                        {examen.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.examen_id} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing || !data.examen_id}>
                            {processing && <LoaderCircle className="size-4 animate-spin" />}
                            Agregar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ConceptoAptitudForm({
    evaluacion,
    conceptos,
    seguimientoOpciones,
    empresaDefault,
}: {
    evaluacion: EvaluacionDetalle;
    conceptos: { id: number; nombre: string }[];
    seguimientoOpciones: string[];
    empresaDefault: string;
}) {
    const { data, setData, patch, processing, errors } = useForm({
        concepto_aptitud_id: evaluacion.concepto_aptitud ? String(evaluacion.concepto_aptitud.id) : '',
        emite: evaluacion.emite ?? '',
        seguimiento_recomendaciones: evaluacion.seguimiento_recomendaciones ?? '',
        seguimiento_recomendaciones_detalle: evaluacion.seguimiento_recomendaciones_detalle ?? '',
        estado_seguimiento: evaluacion.estado_seguimiento ?? '',
        empresa: evaluacion.empresa ?? empresaDefault,
        carta_entregada: evaluacion.carta_entregada ?? false,
        carta_entregada_observacion: evaluacion.carta_entregada_observacion ?? '',
    });

    const requiereDetalle = data.seguimiento_recomendaciones === 'Soporte desestimiento u otro';

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('seguridad.examenes-medicos.concepto-aptitud', evaluacion.id), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
                <div className="grid gap-2">
                    <Label htmlFor="concepto_aptitud_id">Concepto de aptitud</Label>
                    <Select
                        value={data.concepto_aptitud_id || 'none'}
                        onValueChange={(value) => setData('concepto_aptitud_id', value === 'none' ? '' : value)}
                        disabled={processing}
                    >
                        <SelectTrigger id="concepto_aptitud_id" className="w-64">
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
                        className="w-64"
                        placeholder="Persona o entidad que emite el concepto"
                        value={data.emite}
                        onChange={(e) => setData('emite', e.target.value)}
                        disabled={processing}
                    />
                    <InputError message={errors.emite} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                        id="empresa"
                        className="w-48"
                        value={data.empresa}
                        onChange={(e) => setData('empresa', e.target.value)}
                        disabled={processing}
                    />
                    <InputError message={errors.empresa} />
                </div>
            </div>

            <div className="flex flex-wrap items-end gap-3 border-t border-sidebar-border/70 pt-4 dark:border-sidebar-border">
                <div className="grid gap-2">
                    <Label htmlFor="seguimiento_recomendaciones">Seguimiento a recomendaciones</Label>
                    <Select
                        value={data.seguimiento_recomendaciones || 'none'}
                        onValueChange={(value) => setData('seguimiento_recomendaciones', value === 'none' ? '' : value)}
                        disabled={processing}
                    >
                        <SelectTrigger id="seguimiento_recomendaciones" className="w-72">
                            <SelectValue placeholder="Sin definir" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin definir</SelectItem>
                            {seguimientoOpciones.map((opcion) => (
                                <SelectItem key={opcion} value={opcion}>
                                    {opcion}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.seguimiento_recomendaciones} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="estado_seguimiento">Estado de seguimiento</Label>
                    <Select
                        value={data.estado_seguimiento || 'none'}
                        onValueChange={(value) => setData('estado_seguimiento', value === 'none' ? '' : value)}
                        disabled={processing}
                    >
                        <SelectTrigger id="estado_seguimiento" className="w-48">
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
                <div className="flex items-end gap-2 pb-2">
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
            </div>

            {requiereDetalle && (
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

            <div className="grid gap-2">
                <Label htmlFor="carta_entregada_observacion">Observación sobre la carta (opcional)</Label>
                <Textarea
                    id="carta_entregada_observacion"
                    value={data.carta_entregada_observacion}
                    onChange={(e) => setData('carta_entregada_observacion', e.target.value)}
                    disabled={processing}
                />
                <InputError message={errors.carta_entregada_observacion} />
            </div>

            <Button type="submit" disabled={processing} variant="outline">
                {processing && <LoaderCircle className="size-4 animate-spin" />}
                Guardar
            </Button>
        </form>
    );
}

interface RecomendacionLigera {
    id: number;
    nombre: string;
    categoria: string;
}

function AgregarRecomendacionDialog({
    evaluacionId,
    opciones,
    categorias,
}: {
    evaluacionId: number;
    opciones: RecomendacionLigera[];
    categorias: Record<string, string>;
}) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ recomendacion_id: '', observacion: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('seguridad.examenes-medicos.recomendaciones.store', evaluacionId), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    const opcionesPorCategoria = Object.keys(categorias).map((categoria) => ({
        categoria,
        etiqueta: categorias[categoria],
        recomendaciones: opciones.filter((r) => r.categoria === categoria),
    }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline">
                    <Plus />
                    Agregar recomendación
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agregar recomendación</DialogTitle>
                    <DialogDescription>Recomendación generada por esta evaluación médica (HU-054).</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="recomendacion_id">Recomendación</Label>
                        <Select value={data.recomendacion_id} onValueChange={(value) => setData('recomendacion_id', value)} disabled={processing}>
                            <SelectTrigger id="recomendacion_id">
                                <SelectValue placeholder="Selecciona la recomendación" />
                            </SelectTrigger>
                            <SelectContent>
                                {opcionesPorCategoria.map(
                                    (grupo) =>
                                        grupo.recomendaciones.length > 0 && (
                                            <SelectGroup key={grupo.categoria}>
                                                <SelectLabel>{grupo.etiqueta}</SelectLabel>
                                                {grupo.recomendaciones.map((recomendacion) => (
                                                    <SelectItem key={recomendacion.id} value={String(recomendacion.id)}>
                                                        {recomendacion.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ),
                                )}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.recomendacion_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="recomendacion_observacion">Observación (opcional)</Label>
                        <Textarea
                            id="recomendacion_observacion"
                            value={data.observacion}
                            onChange={(e) => setData('observacion', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.observacion} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing || !data.recomendacion_id}>
                            {processing && <LoaderCircle className="size-4 animate-spin" />}
                            Agregar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ToggleActivaButton({ evaluacionId, evaluacionRecomendacion }: { evaluacionId: number; evaluacionRecomendacion: EvaluacionRecomendacionRow }) {
    const { patch, processing } = useForm({});

    return (
        <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={processing}
            onClick={() =>
                patch(route('seguridad.examenes-medicos.recomendaciones.toggle-activa', [evaluacionId, evaluacionRecomendacion.id]), {
                    preserveScroll: true,
                })
            }
        >
            {evaluacionRecomendacion.activa ? (
                <>
                    <Ban className="size-4" /> Marcar no vigente
                </>
            ) : (
                <>
                    <CheckCircle2 className="size-4" /> Marcar vigente
                </>
            )}
        </Button>
    );
}

function SeguimientosDialog({
    evaluacionId,
    evaluacionRecomendacion,
    estados,
}: {
    evaluacionId: number;
    evaluacionRecomendacion: EvaluacionRecomendacionRow;
    estados: string[];
}) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, transform } = useForm<{
        fecha_seguimiento: string;
        estado_seguimiento: string;
        observacion: string;
        fecha_proximo_seguimiento: string;
        carta_recomendacion_entregada: boolean;
        soporte: File[];
    }>({
        fecha_seguimiento: '',
        estado_seguimiento: '',
        observacion: '',
        fecha_proximo_seguimiento: '',
        carta_recomendacion_entregada: false,
        soporte: [],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((formData) => ({ ...formData, soporte: formData.soporte[0] ?? null }));
        post(route('seguridad.examenes-medicos.recomendaciones.seguimientos.store', [evaluacionId, evaluacionRecomendacion.id]), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                    <History className="size-4" />
                    Seguimientos ({evaluacionRecomendacion.seguimientos.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Seguimiento — {evaluacionRecomendacion.recomendacion.nombre}</DialogTitle>
                    <DialogDescription>Historial de seguimiento de esta recomendación (HU-055). No se elimina el histórico.</DialogDescription>
                </DialogHeader>

                {evaluacionRecomendacion.seguimientos.length > 0 && (
                    <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Responsable</TableHead>
                                    <TableHead>Próximo</TableHead>
                                    <TableHead>Carta</TableHead>
                                    <TableHead>Soporte</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {evaluacionRecomendacion.seguimientos.map((seguimiento) => (
                                    <TableRow key={seguimiento.id}>
                                        <TableCell>{new Date(seguimiento.fecha_seguimiento).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{seguimiento.estado_seguimiento}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {seguimiento.responsable
                                                ? `${seguimiento.responsable.first_name} ${seguimiento.responsable.last_name}`
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {seguimiento.fecha_proximo_seguimiento
                                                ? new Date(seguimiento.fecha_proximo_seguimiento).toLocaleDateString()
                                                : '—'}
                                        </TableCell>
                                        <TableCell>{seguimiento.carta_recomendacion_entregada ? 'Sí' : 'No'}</TableCell>
                                        <TableCell>
                                            {seguimiento.soporte_path ? (
                                                <a
                                                    href={`/storage/${seguimiento.soporte_path}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-primary hover:underline"
                                                >
                                                    Ver
                                                </a>
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4 border-t border-sidebar-border/70 pt-4 dark:border-sidebar-border">
                    <p className="text-sm font-medium text-foreground">Nuevo seguimiento</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="fecha_seguimiento">Fecha de seguimiento</Label>
                            <Input
                                id="fecha_seguimiento"
                                type="date"
                                value={data.fecha_seguimiento}
                                onChange={(e) => setData('fecha_seguimiento', e.target.value)}
                                disabled={processing}
                            />
                            <InputError message={errors.fecha_seguimiento} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="estado_seguimiento">Estado</Label>
                            <Select
                                value={data.estado_seguimiento}
                                onValueChange={(value) => setData('estado_seguimiento', value)}
                                disabled={processing}
                            >
                                <SelectTrigger id="estado_seguimiento">
                                    <SelectValue placeholder="Selecciona el estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {estados.map((estado) => (
                                        <SelectItem key={estado} value={estado}>
                                            {estado}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.estado_seguimiento} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fecha_proximo_seguimiento">Próximo seguimiento (opcional)</Label>
                            <Input
                                id="fecha_proximo_seguimiento"
                                type="date"
                                value={data.fecha_proximo_seguimiento}
                                onChange={(e) => setData('fecha_proximo_seguimiento', e.target.value)}
                                disabled={processing}
                            />
                            <InputError message={errors.fecha_proximo_seguimiento} />
                        </div>
                        <div className="flex items-end gap-2 pb-2">
                            <input
                                id="carta_recomendacion_entregada"
                                type="checkbox"
                                checked={data.carta_recomendacion_entregada}
                                onChange={(e) => setData('carta_recomendacion_entregada', e.target.checked)}
                                disabled={processing}
                                className="size-4"
                            />
                            <Label htmlFor="carta_recomendacion_entregada" className="font-normal">
                                Se entregó carta de recomendación
                            </Label>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="seguimiento_observacion">Observación</Label>
                        <Textarea
                            id="seguimiento_observacion"
                            value={data.observacion}
                            onChange={(e) => setData('observacion', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.observacion} />
                    </div>
                    <SimpleFileField
                        label="Soporte (opcional)"
                        files={data.soporte}
                        multiple={false}
                        onChange={(files) => setData('soporte', files)}
                        error={errors.soporte}
                        disabled={processing}
                    />
                    <DialogFooter>
                        <Button type="submit" disabled={processing || !data.fecha_seguimiento || !data.estado_seguimiento}>
                            {processing && <LoaderCircle className="size-4 animate-spin" />}
                            Registrar seguimiento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function EvaluacionShow({
    evaluacion,
    conceptosAptitud,
    examenesCatalogo,
    recomendacionesCatalogo,
    categoriasRecomendacion,
    estadosSeguimiento,
    seguimientoOpciones,
    empresaDefault,
}: {
    evaluacion: EvaluacionDetalle;
    conceptosAptitud: { id: number; nombre: string }[];
    examenesCatalogo: ExamenLigero[];
    recomendacionesCatalogo: RecomendacionLigera[];
    categoriasRecomendacion: Record<string, string>;
    estadosSeguimiento: string[];
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

    const examenesUsadosIds = new Set(evaluacion.examenes.map((e) => e.examen.id));
    const opcionesAdicionales = examenesCatalogo.filter((examen) => !examenesUsadosIds.has(examen.id));

    const recomendacionesUsadasIds = new Set(evaluacion.recomendaciones.map((r) => r.recomendacion.id));
    const opcionesRecomendaciones = recomendacionesCatalogo.filter((r) => !recomendacionesUsadasIds.has(r.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Evaluación médica — ${nombreColaborador}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <HeadingSmall
                        title={`Evaluación médica — ${nombreColaborador}`}
                        description={`${TIPO_LABELS[evaluacion.tipo_evaluacion] ?? evaluacion.tipo_evaluacion} · ${new Date(evaluacion.fecha_evaluacion).toLocaleDateString()}`}
                    />
                    <Badge variant={ESTADO_VARIANT[evaluacion.estado] ?? 'secondary'} className="text-sm">
                        {ESTADO_LABELS[evaluacion.estado] ?? evaluacion.estado}
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
                            <p className="text-xs font-medium text-muted-foreground">Fecha de ingreso</p>
                            <p className="text-sm text-foreground">
                                {evaluacion.colaborador.fecha_ingreso_empresa
                                    ? new Date(evaluacion.colaborador.fecha_ingreso_empresa).toLocaleDateString()
                                    : '—'}
                            </p>
                        </div>
                        {evaluacion.proximo_examen_fecha && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Próximo examen (Periódico)</p>
                                <p className="text-sm text-foreground">{new Date(evaluacion.proximo_examen_fecha).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>
                </SeccionCard>

                <SeccionCard icon={Stethoscope} titulo="Concepto de aptitud y seguimiento" tono="azul">
                    <ConceptoAptitudForm
                        evaluacion={evaluacion}
                        conceptos={conceptosAptitud}
                        seguimientoOpciones={seguimientoOpciones}
                        empresaDefault={empresaDefault}
                    />
                </SeccionCard>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Exámenes requeridos</p>
                        {opcionesAdicionales.length > 0 && <AgregarAdicionalDialog evaluacionId={evaluacion.id} opciones={opcionesAdicionales} />}
                    </div>
                    <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Examen</TableHead>
                                    <TableHead>Origen</TableHead>
                                    <TableHead>Obligatorio</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Programación</TableHead>
                                    <TableHead>Ejecución</TableHead>
                                    <TableHead>Soporte</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {evaluacion.examenes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-muted-foreground py-6 text-center">
                                            Esta evaluación no tiene exámenes — no hay matriz definida para este cargo y tipo de evaluación.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {evaluacion.examenes.map((examenEvaluacion) => (
                                    <TableRow key={examenEvaluacion.id}>
                                        <TableCell className="font-medium">{examenEvaluacion.examen.nombre}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{examenEvaluacion.origen === 'matriz' ? 'Matriz' : 'Adicional'}</Badge>
                                        </TableCell>
                                        <TableCell>{examenEvaluacion.obligatorio ? 'Sí' : 'No'}</TableCell>
                                        <TableCell>
                                            <Badge variant={examenEvaluacion.estado === 'realizado' ? 'default' : 'secondary'}>
                                                {ESTADO_EXAMEN_LABELS[examenEvaluacion.estado]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {examenEvaluacion.fecha_programacion ? new Date(examenEvaluacion.fecha_programacion).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {examenEvaluacion.fecha_ejecucion ? new Date(examenEvaluacion.fecha_ejecucion).toLocaleDateString() : '—'}
                                            {(examenEvaluacion.fecha_ingreso_pdf || examenEvaluacion.hora_ingreso_pdf) && (
                                                <p className="text-xs text-muted-foreground">
                                                    PDF: {examenEvaluacion.fecha_ingreso_pdf ? new Date(examenEvaluacion.fecha_ingreso_pdf).toLocaleDateString() : '—'}
                                                    {examenEvaluacion.hora_ingreso_pdf ? ` ${examenEvaluacion.hora_ingreso_pdf}` : ''}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {examenEvaluacion.soporte_path ? (
                                                <a
                                                    href={`/storage/${examenEvaluacion.soporte_path}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-primary hover:underline"
                                                >
                                                    Ver
                                                </a>
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {examenEvaluacion.estado !== 'realizado' && (
                                                <div className="flex justify-end gap-2">
                                                    <ProgramarDialog evaluacionId={evaluacion.id} examenEvaluacion={examenEvaluacion} />
                                                    <EjecutarDialog evaluacionId={evaluacion.id} examenEvaluacion={examenEvaluacion} />
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Recomendaciones</p>
                        {opcionesRecomendaciones.length > 0 && (
                            <AgregarRecomendacionDialog
                                evaluacionId={evaluacion.id}
                                opciones={opcionesRecomendaciones}
                                categorias={categoriasRecomendacion}
                            />
                        )}
                    </div>
                    <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Recomendación</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Observación</TableHead>
                                    <TableHead>Vigente</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {evaluacion.recomendaciones.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-muted-foreground py-6 text-center">
                                            Esta evaluación no tiene recomendaciones registradas todavía.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {evaluacion.recomendaciones.map((evaluacionRecomendacion) => (
                                    <TableRow key={evaluacionRecomendacion.id}>
                                        <TableCell className="font-medium">{evaluacionRecomendacion.recomendacion.nombre}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {categoriasRecomendacion[evaluacionRecomendacion.recomendacion.categoria] ??
                                                    evaluacionRecomendacion.recomendacion.categoria}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-64 text-sm text-muted-foreground">
                                            {evaluacionRecomendacion.observacion ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={evaluacionRecomendacion.activa ? 'default' : 'secondary'}>
                                                {evaluacionRecomendacion.activa ? 'Vigente' : 'No vigente'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <SeguimientosDialog
                                                    evaluacionId={evaluacion.id}
                                                    evaluacionRecomendacion={evaluacionRecomendacion}
                                                    estados={estadosSeguimiento}
                                                />
                                                <ToggleActivaButton evaluacionId={evaluacion.id} evaluacionRecomendacion={evaluacionRecomendacion} />
                                            </div>
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
