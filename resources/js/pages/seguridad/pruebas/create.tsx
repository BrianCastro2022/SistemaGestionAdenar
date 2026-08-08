import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { FirmaPad, type FirmaPadHandle } from '@/pages/seguridad/pruebas/firma-pad';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { LoaderCircle, X } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';

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
    deleted_evidencias_indices?: number[];
    deleted_evidencias_adicionales_indices?: number[];
    [key: string]: string | boolean | File | File[] | number[] | null | undefined;
}

const TURNO_LABELS: Record<string, string> = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

type PickedFile = { file: File; preview: string };

/**
 * Grilla de miniaturas para subir/ver evidencias fotográficas: combina las ya
 * guardadas (marcables para borrar cuando se está editando) con las nuevas
 * recién seleccionadas. Se reutiliza para "evidencia principal" y "adicionales".
 */
function EvidenciaUploader({
    label,
    inputId,
    inputRef,
    onAdd,
    savedPaths,
    deletedIndices,
    canDeleteSaved,
    onToggleSaved,
    newFiles,
    onRemoveNew,
    onPreview,
    error,
}: {
    label: string;
    inputId: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
    savedPaths: string[];
    deletedIndices: number[];
    canDeleteSaved: boolean;
    onToggleSaved: (index: number) => void;
    newFiles: PickedFile[];
    onRemoveNew: (index: number) => void;
    onPreview: (path: string) => void;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <input ref={inputRef} id={inputId} type="file" accept="image/*" multiple className="hidden" onChange={onAdd} />
            <InputError message={error} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {savedPaths.map((path, index) => (
                    <div
                        key={`saved-${index}`}
                        className={`group relative cursor-pointer ${deletedIndices.includes(index) ? 'opacity-50' : ''}`}
                        onClick={() => !deletedIndices.includes(index) && onPreview(path)}
                    >
                        <img
                            src={path}
                            alt={`Guardada ${index + 1}`}
                            className="h-24 w-full rounded-lg border border-border object-cover transition-transform group-hover:scale-105"
                        />
                        <span className="absolute left-1 top-1 rounded bg-emerald-600 px-1.5 py-0.5 text-xs text-white dark:bg-emerald-500">Guardada</span>
                        {canDeleteSaved && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSaved(index);
                                }}
                                className={`absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-white shadow transition-colors ${
                                    deletedIndices.includes(index) ? 'bg-muted-foreground' : 'bg-red-500 hover:bg-red-600'
                                }`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ))}
                {newFiles.map((item, index) => (
                    <div key={`new-${index}`} className="group relative cursor-pointer">
                        <img
                            src={item.preview}
                            alt={`Nueva ${index + 1}`}
                            onClick={() => onPreview(item.preview)}
                            className="h-24 w-full rounded-lg border border-sky-300 object-cover transition-transform group-hover:scale-105 dark:border-sky-500/40"
                        />
                        <button
                            type="button"
                            onClick={() => onRemoveNew(index)}
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex h-24 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                    <span className="text-2xl font-light leading-none">+</span>
                    <span className="mt-1 text-xs">Agregar</span>
                </button>
            </div>
        </div>
    );
}

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
    });

    const firmaPadRef = useRef<FirmaPadHandle>(null);
    const evidenciaInputRef = useRef<HTMLInputElement>(null);
    const evidenciasInputRef = useRef<HTMLInputElement>(null);
    // Rutas guardadas en el servidor; nunca se mutan localmente, solo se marcan para borrar.
    const [savedEvidencias] = useState<string[]>(prueba?.evidencias_paths ?? []);
    const [deletedEvidenciasIndices, setDeletedEvidenciasIndices] = useState<number[]>([]);
    const [deletedEvidenciasAdicionalesIndices, setDeletedEvidenciasAdicionalesIndices] = useState<number[]>([]);
    const [filesEvidencia, setFilesEvidencia] = useState<PickedFile[]>([]);
    const [filesEvidencias, setFilesEvidencias] = useState<PickedFile[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
    const [deleteType, setDeleteType] = useState<'evidencia' | 'adicional' | null>(null);

    const addEvidencia = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files ?? []).map((file) => ({ file, preview: URL.createObjectURL(file) }));
        const updated = [...filesEvidencia, ...newFiles];
        setFilesEvidencia(updated);
        setData(
            'evidencia',
            updated.map((f) => f.file),
        );
        if (evidenciaInputRef.current) evidenciaInputRef.current.value = '';
    };

    const removeEvidencia = (index: number) => {
        const updated = filesEvidencia.filter((_, i) => i !== index);
        setFilesEvidencia(updated);
        setData(
            'evidencia',
            updated.map((f) => f.file),
        );
    };

    const removeSavedEvidencia = (index: number) => {
        if (deletedEvidenciasIndices.includes(index)) {
            // Si ya estaba marcada, simplemente la desmarcamos
            const updated = deletedEvidenciasIndices.filter((i) => i !== index);
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
        const newFiles = Array.from(e.target.files ?? []).map((file) => ({ file, preview: URL.createObjectURL(file) }));
        const updated = [...filesEvidencias, ...newFiles];
        setFilesEvidencias(updated);
        setData(
            'evidencias',
            updated.map((f) => f.file),
        );
        if (evidenciasInputRef.current) evidenciasInputRef.current.value = '';
    };

    const removeEvidencias = (index: number) => {
        const updated = filesEvidencias.filter((_, i) => i !== index);
        setFilesEvidencias(updated);
        setData(
            'evidencias',
            updated.map((f) => f.file),
        );
    };

    const removeSavedEvidencias = (index: number) => {
        if (deletedEvidenciasAdicionalesIndices.includes(index)) {
            // Si ya estaba marcada, simplemente la desmarcamos
            const updated = deletedEvidenciasAdicionalesIndices.filter((i) => i !== index);
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
                <HeadingSmall
                    title={prueba ? 'Editar prueba de alcoholemia' : 'Registrar prueba de alcoholemia'}
                    description={prueba ? 'Modifica los datos de la prueba y guarda los cambios.' : 'Selecciona al colaborador y completa los datos de la prueba.'}
                />

                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-500/20 dark:bg-sky-500/5">
                        <h3 className="mb-4 text-base font-semibold text-sky-900 dark:text-sky-200">Filtrar colaboradores por turno</h3>
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
                            <div className="rounded-lg border border-border p-4">
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

                            <EvidenciaUploader
                                label="Evidencia principal (foto)"
                                inputId="evidencia"
                                inputRef={evidenciaInputRef}
                                onAdd={addEvidencia}
                                savedPaths={savedEvidencias}
                                deletedIndices={deletedEvidenciasIndices}
                                canDeleteSaved={Boolean(prueba)}
                                onToggleSaved={removeSavedEvidencia}
                                newFiles={filesEvidencia}
                                onRemoveNew={removeEvidencia}
                                onPreview={setSelectedImage}
                                error={errors.evidencia}
                            />

                            <EvidenciaUploader
                                label="Evidencias adicionales (opcional)"
                                inputId="evidencias"
                                inputRef={evidenciasInputRef}
                                onAdd={addEvidencias}
                                savedPaths={savedEvidencias.slice(1)}
                                deletedIndices={deletedEvidenciasAdicionalesIndices}
                                canDeleteSaved={Boolean(prueba)}
                                onToggleSaved={removeSavedEvidencias}
                                newFiles={filesEvidencias}
                                onRemoveNew={removeEvidencias}
                                onPreview={setSelectedImage}
                                error={errors.evidencias}
                            />

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
                        {data.es_programacion ? (prueba ? 'Actualizar programación' : 'Programar prueba') : prueba ? 'Actualizar prueba' : 'Registrar prueba'}
                    </Button>
                </form>
            </div>

            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={() => setSelectedImage(null)}>
                    <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/75"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <img src={selectedImage} alt="Vista previa" className="h-auto w-full rounded-lg" />
                    </div>
                </div>
            )}

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-950">
                    <AlertDialogTitle className="text-red-900 dark:text-red-200">Eliminar imagen</AlertDialogTitle>
                    <AlertDialogDescription className="text-red-800 dark:text-red-300">
                        ¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer y la imagen se eliminará permanentemente.
                    </AlertDialogDescription>
                    <div className="flex justify-end gap-2 pt-4">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteType === 'evidencia') {
                                    confirmDeleteEvidencia();
                                } else if (deleteType === 'adicional') {
                                    confirmDeleteAdicional();
                                }
                            }}
                            className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
