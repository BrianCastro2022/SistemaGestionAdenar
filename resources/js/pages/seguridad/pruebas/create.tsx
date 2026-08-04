import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { FirmaPad, type FirmaPadHandle } from '@/pages/seguridad/pruebas/firma-pad';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Info, LoaderCircle, X } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

const breadcrumbsBase: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Pruebas de Alcoholemia', href: '/modules/seguridad/pruebas' },
];

interface ColaboradorOption {
    id: number;
    nombres: string;
    apellidos: string;
    cedula: string;
    turno: string | null;
}

interface DispositivoOption {
    id: number;
    codigo: string;
    valor_min: string;
    valor_max: string;
}

interface PruebaData {
    id: number;
    colaborador_id: number;
    tipo: string;
    es_programacion: boolean;
    programada_en: string | null;
    alcoholimetro_id: number | null;
    resultado: string | null;
    consentimiento_aceptado: boolean;
    evidencia_path: string | null;
    evidencias_paths?: string[];
    firma_path: string | null;
    observaciones: string | null;
    estado: string;
    condiciones_salud_habilitadas?: boolean;
    estado_ingreso?: string | null;
    observacion_entrada?: string | null;
    estado_salida?: string | null;
    observacion_salida?: string | null;
    colaborador: { id: number; nombres: string; apellidos: string; cedula: string } | null;
    alcoholimetro: { id: number; codigo: string; valor_min: string; valor_max: string } | null;
}

interface PruebaForm {
    colaborador_id: string;
    tipo: string;
    es_programacion: boolean;
    programada_en: string;
    alcoholimetro_id: string;
    resultado: string;
    consentimiento_aceptado: boolean;
    evidencia: File[];
    evidencias: File[];
    firma: File | null;
    observaciones: string;
    condiciones_salud_habilitadas: boolean;
    estado_ingreso: string;
    observacion_entrada: string;
    estado_salida: string;
    observacion_salida: string;
    deleted_evidencias_indices?: number[];
    deleted_evidencias_adicionales_indices?: number[];
    [key: string]: string | boolean | File | File[] | number[] | null | undefined;
}

const TURNO_LABELS: Record<string, string> = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

export default function CreatePrueba({
    colaboradores,
    dispositivosDisponibles,
    filters,
    prueba,
}: {
    colaboradores: ColaboradorOption[];
    dispositivosDisponibles: DispositivoOption[];
    filters: { turno: string };
    prueba?: PruebaData;
}) {
    const breadcrumbs: BreadcrumbItem[] = prueba
        ? [...breadcrumbsBase, { title: 'Editar prueba', href: `/modules/seguridad/pruebas/${prueba.id}/edit` }]
        : [...breadcrumbsBase, { title: 'Registrar prueba', href: '/modules/seguridad/pruebas/create' }];
    const { data, setData, post, processing, errors, transform } = useForm<PruebaForm>({
        colaborador_id: prueba?.colaborador_id ? String(prueba.colaborador_id) : '',
        tipo: prueba?.tipo ?? 'entrada',
        es_programacion: prueba ? prueba.estado === 'programada' : false,
        programada_en: prueba?.programada_en ? String(prueba.programada_en) : '',
        alcoholimetro_id: prueba?.alcoholimetro_id ? String(prueba.alcoholimetro_id) : '',
        resultado: prueba?.resultado ? String(prueba.resultado) : '',
        consentimiento_aceptado: prueba?.consentimiento_aceptado ?? false,
        evidencia: [],
        evidencias: [],
        firma: null,
        observaciones: prueba?.observaciones ?? '',
        condiciones_salud_habilitadas: prueba?.condiciones_salud_habilitadas ?? false,
        estado_ingreso: prueba?.estado_ingreso ?? '',
        observacion_entrada: prueba?.observacion_entrada ?? '',
        estado_salida: prueba?.estado_salida ?? '',
        observacion_salida: prueba?.observacion_salida ?? '',
    });

    const firmaPadRef = useRef<FirmaPadHandle>(null);
    const evidenciaInputRef = useRef<HTMLInputElement>(null);
    const evidenciasInputRef = useRef<HTMLInputElement>(null);
    // Saved previews from server; new file previews tracked separately
    const [savedEvidencias, setSavedEvidencias] = useState<string[]>(
        prueba?.evidencias_paths ?? []
    );
    const [deletedEvidenciasIndices, setDeletedEvidenciasIndices] = useState<number[]>([]);
    const [deletedEvidenciasAdicionalesIndices, setDeletedEvidenciasAdicionalesIndices] = useState<number[]>([]);
    const [filesEvidencia, setFilesEvidencia] = useState<{ file: File; preview: string }[]>([]);
    const [filesEvidencias, setFilesEvidencias] = useState<{ file: File; preview: string }[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
    const [deleteType, setDeleteType] = useState<'evidencia' | 'adicional' | null>(null);

    const addEvidencia = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files ?? []).map(file => ({ file, preview: URL.createObjectURL(file) }));
        const updated = [...filesEvidencia, ...newFiles];
        setFilesEvidencia(updated);
        setData('evidencia', updated.map(f => f.file));
        if (evidenciaInputRef.current) evidenciaInputRef.current.value = '';
    };

    const removeEvidencia = (index: number) => {
        const updated = filesEvidencia.filter((_, i) => i !== index);
        setFilesEvidencia(updated);
        setData('evidencia', updated.map(f => f.file));
    };

    const removeSavedEvidencia = (index: number) => {
        if (deletedEvidenciasIndices.includes(index)) {
            // Si ya estaba marcada, simplemente la desmarcamos
            const updated = deletedEvidenciasIndices.filter(i => i !== index);
            setDeletedEvidenciasIndices(updated);
            setData('deleted_evidencias_indices', updated);
        } else {
            // Mostrar diálogo de confirmación
            setPendingDeleteIndex(index);
            setDeleteType('evidencia');
            setShowDeleteDialog(true);
        }
    };

    const confirmDeleteEvidencia = () => {
        if (pendingDeleteIndex !== null) {
            const updated = [...deletedEvidenciasIndices, pendingDeleteIndex];
            setDeletedEvidenciasIndices(updated);
            setData('deleted_evidencias_indices', updated);
        }
        setShowDeleteDialog(false);
        setPendingDeleteIndex(null);
        setDeleteType(null);
    };

    const addEvidencias = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files ?? []).map(file => ({ file, preview: URL.createObjectURL(file) }));
        const updated = [...filesEvidencias, ...newFiles];
        setFilesEvidencias(updated);
        setData('evidencias', updated.map(f => f.file));
        if (evidenciasInputRef.current) evidenciasInputRef.current.value = '';
    };

    const removeEvidencias = (index: number) => {
        const updated = filesEvidencias.filter((_, i) => i !== index);
        setFilesEvidencias(updated);
        setData('evidencias', updated.map(f => f.file));
    };

    const removeSavedEvidencias = (index: number) => {
        if (deletedEvidenciasAdicionalesIndices.includes(index)) {
            // Si ya estaba marcada, simplemente la desmarcamos
            const updated = deletedEvidenciasAdicionalesIndices.filter(i => i !== index);
            setDeletedEvidenciasAdicionalesIndices(updated);
            setData('deleted_evidencias_adicionales_indices', updated);
        } else {
            // Mostrar diálogo de confirmación
            setPendingDeleteIndex(index);
            setDeleteType('adicional');
            setShowDeleteDialog(true);
        }
    };

    const confirmDeleteAdicional = () => {
        if (pendingDeleteIndex !== null) {
            const updated = [...deletedEvidenciasAdicionalesIndices, pendingDeleteIndex];
            setDeletedEvidenciasAdicionalesIndices(updated);
            setData('deleted_evidencias_adicionales_indices', updated);
        }
        setShowDeleteDialog(false);
        setPendingDeleteIndex(null);
        setDeleteType(null);
    };

    const filtrarPorTurno = (turno: string) => {
        router.get(route('seguridad.pruebas.create'), { turno: turno === 'todos' ? '' : turno }, { preserveState: true, replace: true });
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        const firma = await firmaPadRef.current?.getFile();
        transform((data) => ({ ...data, firma: firma ?? null, ...(prueba ? { _method: 'PUT' } : {}) }));

        if (prueba) {
            post(route('seguridad.pruebas.update', prueba.id), { forceFormData: true });
            return;
        }

        post(route('seguridad.pruebas.store'), { forceFormData: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={prueba ? 'Editar prueba de alcoholemia' : 'Registrar prueba de alcoholemia'} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex gap-6">
                    <div className="flex-1">
                        <HeadingSmall
                            title={prueba ? 'Editar prueba de alcoholemia' : 'Registrar prueba de alcoholemia'}
                            description={prueba ? 'Modifica los datos de la prueba y guarda los cambios.' : 'Selecciona al colaborador y completa los datos de la prueba.'}
                        />
                    </div>
                    <div className="w-96">
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <h3 className="mb-4 text-base font-semibold text-green-900">Registrar condiciones de salud</h3>
                            <div className="flex items-center space-x-2">
                                <motion.div whileTap={{ scale: 0.85 }}>
                                    <Checkbox
                                        id="condiciones_salud_habilitadas"
                                        checked={data.condiciones_salud_habilitadas}
                                        onCheckedChange={(checked) => setData('condiciones_salud_habilitadas', checked === true)}
                                    />
                                </motion.div>
                                <Label htmlFor="condiciones_salud_habilitadas" className="font-normal">
                                    Condiciones de salud
                                </Label>
                            </div>
                            <InputError message={errors.condiciones_salud_habilitadas} />

                            <AnimatePresence initial={false}>
                                {data.condiciones_salud_habilitadas && (
                                    <motion.div
                                        key="condiciones-content"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-4 space-y-4 border-t pt-4">
                                            {data.tipo === 'entrada' && (
                                                <div className="grid gap-4">
                                                    <motion.div
                                                        custom={0}
                                                        initial={{ opacity: 0, y: -8 }}
                                                        animate={{ opacity: 1, y: 0, transition: { delay: 0, type: 'spring', stiffness: 300, damping: 24 } }}
                                                        className="grid gap-2"
                                                    >
                                                        <Label htmlFor="estado_ingreso">Estado al ingreso</Label>
                                                        <Select value={data.estado_ingreso} onValueChange={(value) => setData('estado_ingreso', value)}>
                                                            <SelectTrigger id="estado_ingreso">
                                                                <SelectValue placeholder="Selecciona estado" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Bueno">Bueno</SelectItem>
                                                                <SelectItem value="Regular">Regular</SelectItem>
                                                                <SelectItem value="Malo">Malo</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <InputError message={errors.estado_ingreso} />
                                                    </motion.div>

                                                    <motion.div
                                                        custom={1}
                                                        initial={{ opacity: 0, y: -8 }}
                                                        animate={{ opacity: 1, y: 0, transition: { delay: 0.08, type: 'spring', stiffness: 300, damping: 24 } }}
                                                        className="grid gap-2"
                                                    >
                                                        <Label htmlFor="observacion_entrada">Observación entrada</Label>
                                                        <Input
                                                            id="observacion_entrada"
                                                            value={data.observacion_entrada}
                                                            onChange={(e) => setData('observacion_entrada', e.target.value)}
                                                            placeholder="Detalle de estado al ingreso"
                                                        />
                                                        <InputError message={errors.observacion_entrada} />
                                                    </motion.div>
                                                </div>
                                            )}

                                            {data.tipo === 'salida' && (
                                                <div className="grid gap-4">
                                                    <motion.div
                                                        custom={0}
                                                        initial={{ opacity: 0, y: -8 }}
                                                        animate={{ opacity: 1, y: 0, transition: { delay: 0, type: 'spring', stiffness: 300, damping: 24 } }}
                                                        className="grid gap-2"
                                                    >
                                                        <Label htmlFor="estado_salida">Estado a la salida</Label>
                                                        <Select value={data.estado_salida} onValueChange={(value) => setData('estado_salida', value)}>
                                                            <SelectTrigger id="estado_salida">
                                                                <SelectValue placeholder="Selecciona estado" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Bueno">Bueno</SelectItem>
                                                                <SelectItem value="Regular">Regular</SelectItem>
                                                                <SelectItem value="Malo">Malo</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <InputError message={errors.estado_salida} />
                                                    </motion.div>

                                                    <motion.div
                                                        custom={1}
                                                        initial={{ opacity: 0, y: -8 }}
                                                        animate={{ opacity: 1, y: 0, transition: { delay: 0.08, type: 'spring', stiffness: 300, damping: 24 } }}
                                                        className="grid gap-2"
                                                    >
                                                        <Label htmlFor="observacion_salida">Observación salida</Label>
                                                        <Input
                                                            id="observacion_salida"
                                                            value={data.observacion_salida}
                                                            onChange={(e) => setData('observacion_salida', e.target.value)}
                                                            placeholder="Detalle de estado a la salida"
                                                        />
                                                        <InputError message={errors.observacion_salida} />
                                                    </motion.div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <h3 className="mb-4 text-base font-semibold text-blue-900">Filtrar colaboradores por turno</h3>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="turno-filter">Todos los turnos</Label>
                                <Select value={filters.turno || 'todos'} onValueChange={filtrarPorTurno}>
                                    <SelectTrigger id="turno-filter">
                                        <SelectValue placeholder="Todos los turnos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los turnos</SelectItem>
                                        <SelectItem value="manana">Mañana</SelectItem>
                                        <SelectItem value="tarde">Tarde</SelectItem>
                                        <SelectItem value="noche">Noche</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="colaborador_id">Colaborador</Label>
                                <Select value={data.colaborador_id} onValueChange={(value) => setData('colaborador_id', value)}>
                                    <SelectTrigger id="colaborador_id">
                                        <SelectValue placeholder="Selecciona un colaborador" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colaboradores.map((colaborador) => (
                                            <SelectItem key={colaborador.id} value={String(colaborador.id)}>
                                                {colaborador.nombres} {colaborador.apellidos} — {colaborador.cedula}
                                                {colaborador.turno ? ` (${TURNO_LABELS[colaborador.turno]})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.colaborador_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="tipo">Tipo de prueba</Label>
                                <Select value={data.tipo} onValueChange={(value) => setData('tipo', value)}>
                                    <SelectTrigger id="tipo">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="entrada">Entrada</SelectItem>
                                        <SelectItem value="ruta">Ruta</SelectItem>
                                        <SelectItem value="salida">Salida</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.tipo} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="es_programacion"
                            checked={data.es_programacion}
                            onCheckedChange={(checked) => setData('es_programacion', checked === true)}
                        />
                        <Label htmlFor="es_programacion" className="font-normal">
                            Programar para más tarde (en vez de registrar el resultado ahora)
                        </Label>
                    </div>

                    {data.es_programacion ? (
                        <div className="grid gap-2">
                            <Label htmlFor="programada_en">Fecha y hora programada</Label>
                            <Input
                                id="programada_en"
                                type="datetime-local"
                                value={data.programada_en}
                                onChange={(e) => setData('programada_en', e.target.value)}
                            />
                            <InputError message={errors.programada_en} />
                        </div>
                    ) : (
                        <>
                            <div className="rounded-lg border border-gray-200 p-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="alcoholimetro_id">Dispositivo</Label>
                                        <Select value={data.alcoholimetro_id} onValueChange={(value) => setData('alcoholimetro_id', value)}>
                                            <SelectTrigger id="alcoholimetro_id">
                                                <SelectValue placeholder="Selecciona un dispositivo disponible" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dispositivosDisponibles.map((dispositivo) => (
                                                    <SelectItem key={dispositivo.id} value={String(dispositivo.id)}>
                                                        {dispositivo.codigo}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.alcoholimetro_id} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="resultado">Resultado</Label>
                                        <Input
                                            id="resultado"
                                            type="number"
                                            step="0.001"
                                            value={data.resultado}
                                            onChange={(e) => setData('resultado', e.target.value)}
                                        />
                                        <InputError message={errors.resultado} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Evidencia principal (foto)</Label>
                                <input ref={evidenciaInputRef} id="evidencia" type="file" accept="image/*" multiple className="hidden" onChange={addEvidencia} />
                                <InputError message={errors.evidencia} />
                                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                                    {savedEvidencias.map((path, index) => (
                                        <div
                                            key={`saved-${index}`}
                                            className={`relative group cursor-pointer ${deletedEvidenciasIndices.includes(index) ? 'opacity-50' : ''}`}
                                            onClick={() => !deletedEvidenciasIndices.includes(index) && setSelectedImage(path)}
                                        >
                                            <img
                                                src={path}
                                                alt={`Guardada ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:scale-105 transition-transform"
                                            />
                                            <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">Guardada</span>
                                            {prueba && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSavedEvidencia(index)}
                                                    className={`absolute top-1 right-1 ${deletedEvidenciasIndices.includes(index) ? 'bg-gray-500' : 'bg-red-500 hover:bg-red-600'} text-white rounded-full w-5 h-5 flex items-center justify-center shadow transition-colors`}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {filesEvidencia.map((item, index) => (
                                        <div key={`new-${index}`} className="relative group cursor-pointer">
                                            <img src={item.preview} alt={`Nueva ${index + 1}`} onClick={() => setSelectedImage(item.preview)} className="w-full h-24 object-cover rounded-lg border border-blue-300 group-hover:scale-105 transition-transform" />
                                            <button type="button" onClick={() => removeEvidencia(index)} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => evidenciaInputRef.current?.click()} className="h-24 w-full rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors">
                                        <span className="text-2xl font-light leading-none">+</span>
                                        <span className="text-xs mt-1">Agregar</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Evidencias adicionales (opcional)</Label>
                                <input ref={evidenciasInputRef} id="evidencias" type="file" accept="image/*" multiple className="hidden" onChange={addEvidencias} />
                                <InputError message={errors.evidencias} />
                                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                                    {savedEvidencias.slice(1).map((path, index) => (
                                        <div
                                            key={`saved-adicional-${index}`}
                                            className={`relative group cursor-pointer ${deletedEvidenciasAdicionalesIndices.includes(index) ? 'opacity-50' : ''}`}
                                            onClick={() => !deletedEvidenciasAdicionalesIndices.includes(index) && setSelectedImage(path)}
                                        >
                                            <img
                                                src={path}
                                                alt={`Guardada adicional ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:scale-105 transition-transform"
                                            />
                                            <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">Guardada</span>
                                            {prueba && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSavedEvidencias(index)}
                                                    className={`absolute top-1 right-1 ${deletedEvidenciasAdicionalesIndices.includes(index) ? 'bg-gray-500' : 'bg-red-500 hover:bg-red-600'} text-white rounded-full w-5 h-5 flex items-center justify-center shadow transition-colors`}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {filesEvidencias.map((item, index) => (
                                        <div key={index} className="relative group cursor-pointer">
                                            <img src={item.preview} alt={`Adicional ${index + 1}`} onClick={() => setSelectedImage(item.preview)} className="w-full h-24 object-cover rounded-lg border border-blue-300 group-hover:scale-105 transition-transform" />
                                            <button type="button" onClick={() => removeEvidencias(index)} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => evidenciasInputRef.current?.click()} className="h-24 w-full rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors">
                                        <span className="text-2xl font-light leading-none">+</span>
                                        <span className="text-xs mt-1">Agregar</span>
                                    </button>
                                </div>
                            </div>

                            <FirmaPad ref={firmaPadRef} />

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="consentimiento_aceptado"
                                    checked={data.consentimiento_aceptado}
                                    onCheckedChange={(checked) => setData('consentimiento_aceptado', checked === true)}
                                />
                                <Label htmlFor="consentimiento_aceptado" className="font-normal">
                                    El colaborador acepta someterse voluntariamente a la prueba (consentimiento informado)
                                </Label>
                            </div>
                            <InputError message={errors.consentimiento_aceptado} />
                        </>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="observaciones">Observaciones</Label>
                        <textarea
                            id="observaciones"
                            className="border-input bg-background flex min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                            value={data.observaciones}
                            onChange={(e) => setData('observaciones', e.target.value)}
                        />
                        <InputError message={errors.observaciones} />
                    </div>

                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="size-4 animate-spin" />}
                        {data.es_programacion ? (prueba ? 'Actualizar programación' : 'Programar prueba') : (prueba ? 'Actualizar prueba' : 'Registrar prueba')}
                    </Button>
                </form>
            </div>

            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img src={selectedImage} alt="Preview" className="w-full h-auto rounded-lg" />
                    </div>
                </div>
            )}

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-red-50 border-red-200">
                    <AlertDialogTitle className="text-red-900">Eliminar imagen</AlertDialogTitle>
                    <AlertDialogDescription className="text-red-800">
                        ¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer y la imagen se eliminará permanentemente.
                    </AlertDialogDescription>
                    <div className="flex justify-end gap-2 pt-4">
                        <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteType === 'evidencia') {
                                    confirmDeleteEvidencia();
                                } else if (deleteType === 'adicional') {
                                    confirmDeleteAdicional();
                                }
                            }}
                            className="bg-red-500 text-white hover:bg-red-600"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
