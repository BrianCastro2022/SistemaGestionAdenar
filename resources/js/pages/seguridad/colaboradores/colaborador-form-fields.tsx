import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Award,
    Briefcase,
    CheckCircle2,
    FileSpreadsheet,
    FileText,
    FolderOpen,
    History,
    IdCard,
    type LucideIcon,
    Mail,
    MapPin,
    Phone,
    Plus,
    QrCode,
    ShieldCheck,
    User,
    X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface ColaboradorFormData {
    cedula: string;
    nombres: string;
    apellidos: string;
    cargo: string;
    turno: string;
    area: string;
    imagen: File | null;

    // Información básica adicional
    expedido_en: string;
    sexo: 'femenino' | 'masculino' | '';
    fecha_nacimiento: string;
    ciudad_residencia: string;
    direccion: string;
    estrato: string;
    celular_1: string;
    celular_2: string;
    correo: string;
    estado_civil: string;

    // Condiciones particulares
    discapacidad: 'no_aplica' | 'aplica' | '';
    victima_conflicto: 'si' | 'no' | '';
    libreta_militar: 'no_aplica' | 'aplica' | '';

    // Antecedentes en la empresa
    ha_trabajado_antes: 'si' | 'no' | '';
    cargo_anterior: string;
    fecha_ultima_laboral: string;

    // Experiencia
    tiene_experiencia: 'si' | 'no' | '';
    area_experiencia: string;
    cargo_experiencia: string;
    anios_experiencia: string;

    // QR SKAP
    codigo_qr_skap: string;

    // Documentos — personales
    documento_cedula: File[];
    // Documentos — tránsito
    documento_licencia_conduccion: File[];
    documento_carnet_manejo_defensivo: File[];
    documento_certificado_manejo_defensivo: File[];
    documento_simit: File[];
    documento_recordatorio_vehiculo_licencia_conduccion: File[];
    // Documentos — salud
    documento_eps: File[];
    documento_pension: File[];
    documento_examen_medico_ocupacional: File[];
    // Documentos — empresariales
    documento_carnet_ingreso_cd: File[];
    // Documentos — académicos
    documento_titulo_bachiller: File[];
    documento_titulo_academico: File[];

    is_active: boolean;
    [key: string]: string | boolean | File | File[] | null;
}

export type DocumentInfo = {
    path: string;
    fecha: string | null;
};

type ExcelPreview = {
    headers: string[];
    rows: string[][];
};

type DocumentKey = Extract<keyof ColaboradorFormData, string>;

const TURNOS = [
    { value: 'manana', label: 'Mañana' },
    { value: 'tarde', label: 'Tarde' },
    { value: 'noche', label: 'Noche' },
];

const ESTADOS_CIVILES = [
    { value: 'soltero', label: 'Soltero(a)' },
    { value: 'union_libre', label: 'Unión libre' },
    { value: 'casado', label: 'Casado(a)' },
    { value: 'divorciado', label: 'Divorciado(a)' },
    { value: 'viudo', label: 'Viudo(a)' },
];

const ESTRATOS = ['1', '2', '3', '4', '5', '6'];

const CARGOS_ANTERIORES = [
    { value: 'conductor', label: 'Conductor' },
    { value: 'auxiliar_logistico', label: 'Auxiliar logístico' },
    { value: 'supervisor_ruta', label: 'Supervisor de ruta' },
];

type DocumentGroup = 'Documentos personales' | 'Documentos de tránsito' | 'Documentos de salud' | 'Documentos empresariales' | 'Documentos académicos';

const DOCUMENTO_FIELDS: { key: Extract<keyof ColaboradorFormData, string>; label: string; grupo: DocumentGroup }[] = [
    { key: 'documento_cedula', label: 'Documento de cédula', grupo: 'Documentos personales' },

    { key: 'documento_licencia_conduccion', label: 'Licencia de conducción', grupo: 'Documentos de tránsito' },
    { key: 'documento_carnet_manejo_defensivo', label: 'Carnet manejo defensivo', grupo: 'Documentos de tránsito' },
    { key: 'documento_certificado_manejo_defensivo', label: 'Certificado manejo defensivo', grupo: 'Documentos de tránsito' },
    { key: 'documento_simit', label: 'Documento Simit', grupo: 'Documentos de tránsito' },
    { key: 'documento_recordatorio_vehiculo_licencia_conduccion', label: 'Recordatorio vehículo / licencia', grupo: 'Documentos de tránsito' },

    { key: 'documento_eps', label: 'Documento EPS', grupo: 'Documentos de salud' },
    { key: 'documento_pension', label: 'Documento pensión', grupo: 'Documentos de salud' },
    { key: 'documento_examen_medico_ocupacional', label: 'Examen médico ocupacional', grupo: 'Documentos de salud' },

    { key: 'documento_carnet_ingreso_cd', label: 'Carnet ingreso CD', grupo: 'Documentos empresariales' },

    { key: 'documento_titulo_bachiller', label: 'Título de bachiller', grupo: 'Documentos académicos' },
    { key: 'documento_titulo_academico', label: 'Información académica (agrega los que necesites)', grupo: 'Documentos académicos' },
];

const DOCUMENT_GROUPS: DocumentGroup[] = ['Documentos personales', 'Documentos de tránsito', 'Documentos de salud', 'Documentos empresariales', 'Documentos académicos'];

function calcularEdad(fechaNacimiento: string): string {
    if (!fechaNacimiento) return '—';
    const nacimiento = new Date(fechaNacimiento);
    if (Number.isNaN(nacimiento.getTime())) return '—';
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const aunNoCumple = hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
    if (aunNoCumple) edad -= 1;
    return edad >= 0 ? `${edad} años` : '—';
}

function PillToggle<T extends string>({
    label,
    value,
    options,
    onChange,
    disabled,
}: {
    label: string;
    value: T | '';
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
    disabled?: boolean;
}) {
    return (
        <div className="grid gap-2">
            {label && <Label>{label}</Label>}
            <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        disabled={disabled}
                        aria-pressed={value === option.value}
                        onClick={() => onChange(option.value)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                            value === option.value
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                                : 'border-input text-muted-foreground hover:border-emerald-200 hover:text-foreground'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Estilos por "tono" reutilizados tanto en el marco de la tarjeta como en el
// círculo del ícono, así una sección se siente coherente de un vistazo.
const TONOS = {
    neutral: {
        card: 'border-border bg-card',
        iconWrap: 'bg-muted text-muted-foreground',
    },
    verde: {
        card: 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-500/15 dark:bg-emerald-500/5',
        iconWrap: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    },
    azul: {
        card: 'border-sky-100 bg-sky-50/50 dark:border-sky-500/15 dark:bg-sky-500/5',
        iconWrap: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    },
} as const;

function SeccionCard({
    icon: Icon,
    titulo,
    subtitulo,
    paso,
    children,
    tono = 'neutral',
}: {
    icon?: LucideIcon;
    titulo: string;
    subtitulo?: string;
    paso?: string;
    children: React.ReactNode;
    tono?: keyof typeof TONOS;
}) {
    const estilos = TONOS[tono];

    return (
        <div className={`rounded-2xl border p-4 sm:p-6 ${estilos.card}`}>
            <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${estilos.iconWrap}`}>
                            <Icon className="size-5" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-semibold text-foreground">{titulo}</p>
                        {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
                    </div>
                </div>
                {paso && (
                    <span className="shrink-0 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {paso}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

// Envuelve un <Input> con un ícono a la izquierda, igual que el campo del
// código QR SKAP. Evita repetir el mismo `relative` + ícono absoluto en cada campo.
function CampoConIcono({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
    return (
        <div className="relative">
            <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            {children}
        </div>
    );
}

export function ColaboradorFormFields({ data, setData, errors, processing, readonlyCedula, existingDocumentos }: ColaboradorFormFieldsProps) {
    const imagenInputRef = useRef<HTMLInputElement>(null);
    const documentoInputRef = useRef<HTMLInputElement>(null);
    const [previewImagen, setPreviewImagen] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [documentoPreviews, setDocumentoPreviews] = useState<Record<string, string>>({});
    const [excelPreviews, setExcelPreviews] = useState<Record<string, ExcelPreview>>({});
    const [activeDocumentKey, setActiveDocumentKey] = useState<DocumentKey>(DOCUMENTO_FIELDS[0].key);
    const [excelLoading, setExcelLoading] = useState(false);
    const [viewerScale, setViewerScale] = useState(1);
    const [pendingDocumentKey, setPendingDocumentKey] = useState<DocumentKey | null>(null);
    const [activeDocumentIndex, setActiveDocumentIndex] = useState(0);

    const edadCalculada = useMemo(() => calcularEdad(data.fecha_nacimiento), [data.fecha_nacimiento]);

    const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            setPreviewImagen(preview);
            setData('imagen', file);
        }
        if (imagenInputRef.current) imagenInputRef.current.value = '';
    };

    const removeImagen = () => {
        setPreviewImagen(null);
        setData('imagen', null);
        setShowDeleteDialog(false);
    };

    const handleDocumentoChange = (key: Extract<keyof ColaboradorFormData, string>, files: File[]) => {
        const currentFiles = Array.isArray(data[key]) ? data[key] as File[] : [];
        setData(key, [...currentFiles, ...files]);
        setActiveDocumentKey(key);
        setActiveDocumentIndex(currentFiles.length);
        setViewerScale(1);

        if (files.length > 0) {
            setDocumentoPreviews((current) => {
                const updated = { ...current };
                files.forEach((file, index) => {
                    updated[`${key}-${currentFiles.length + index}`] = URL.createObjectURL(file);
                });
                return updated;
            });
        }
    };

    const selectDocument = (key: DocumentKey) => {
        setPendingDocumentKey(key);
        documentoInputRef.current?.click();
    };

    const handleDocumentInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (pendingDocumentKey) {
            handleDocumentoChange(pendingDocumentKey, Array.from(event.target.files ?? []));
        }
        event.target.value = '';
    };

    const loadExcelPreview = async (key: string, source: File | string) => {
        setExcelLoading(true);
        try {
            const buffer = source instanceof File
                ? await source.arrayBuffer()
                : await fetch(documentUrl(source)).then((response) => response.arrayBuffer());
            // Limitar la lectura inicial evita bloquear el formulario con hojas enormes.
            const workbook = XLSX.read(buffer, { type: 'array', sheetRows: 201 });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
                header: 1,
                defval: '',
                range: { s: { c: 0, r: 0 }, e: { c: 29, r: 200 } },
            });
            const normalizedRows = rows.map((row) => row.slice(0, 30).map((value) => String(value ?? '')));
            const columnCount = Math.max(...normalizedRows.map((row) => row.length), 0);

            setExcelPreviews((current) => ({
                ...current,
                [key]: {
                    headers: Array.from({ length: columnCount }, (_, index) => normalizedRows[0]?.[index] || `Columna ${index + 1}`),
                    rows: normalizedRows.slice(1),
                },
            }));
        } catch {
            setExcelPreviews((current) => ({
                ...current,
                [key]: { headers: [], rows: [] },
            }));
        } finally {
            setExcelLoading(false);
        }
    };

    useEffect(() => {
        const activeFiles = Array.isArray(data[activeDocumentKey]) ? data[activeDocumentKey] as File[] : [];
        const savedDocuments = existingDocumentos?.[activeDocumentKey] ?? [];
        const activeFile = activeFiles[activeDocumentIndex];
        const savedPath = savedDocuments[activeDocumentIndex - activeFiles.length]?.path;
        const source = activeFile instanceof File
            ? activeFile
            : savedPath && isSpreadsheet(savedPath)
                ? savedPath
                : null;

        if (source && isSpreadsheet(activeFile instanceof File ? activeFile.name : savedPath ?? '')) {
            void loadExcelPreview(activeDocumentKey, source);
        }
    }, [activeDocumentKey, activeDocumentIndex, existingDocumentos?.[activeDocumentKey], data[activeDocumentKey]]);

    const documentUrl = (path: string) => path.startsWith('/storage/') ? path : `/storage/${path}`;
    const isSpreadsheet = (name: string) => /\.(xls|xlsx)$/i.test(name);
    const isPdf = (name: string) => /\.pdf$/i.test(name);

    const activeField = DOCUMENTO_FIELDS.find((field) => field.key === activeDocumentKey) ?? DOCUMENTO_FIELDS[0];
    const activeFiles = Array.isArray(data[activeField.key]) ? data[activeField.key] as File[] : [];
    const activeSavedDocuments = existingDocumentos?.[activeField.key] ?? [];
    const activeFile = activeFiles[activeDocumentIndex];
    const activeSavedDocument = activeSavedDocuments[activeDocumentIndex - activeFiles.length];
    const activeSavedPath = activeSavedDocument?.path;
    const activeFileName = activeFile instanceof File
        ? activeFile.name
        : activeSavedPath?.split('/').pop() ?? null;
    const activeDocumentDate = activeFile instanceof File
        ? new Date().toISOString().slice(0, 10)
        : activeSavedDocument?.fecha;
    const activePreviewUrl = activeFile instanceof File
        ? documentoPreviews[`${activeField.key}-${activeDocumentIndex}`]
        : activeSavedPath
            ? documentUrl(activeSavedPath)
            : null;

    return (
        <div className="grid gap-6">
            {/* Información personal + foto */}
            <SeccionCard icon={IdCard} titulo="Información personal" subtitulo="Datos básicos del colaborador" paso="Paso 1 de 4" tono="verde">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8">
                    <div className="order-1 lg:order-2">
                        <div className="lg:sticky lg:top-6">
                            <input ref={imagenInputRef} id="imagen" type="file" accept="image/*" className="hidden" onChange={handleImagenChange} />
                            <div className="mx-auto flex max-w-[200px] flex-col items-center gap-3 lg:mx-0 lg:max-w-none">
                                <div className="group relative aspect-square w-full max-w-[180px] overflow-hidden rounded-full border-2 border-dashed border-emerald-200 bg-emerald-50/60 transition-colors hover:border-emerald-300 dark:border-emerald-500/25 dark:bg-emerald-500/5">
                                     {previewImagen ? (
                                        <>
                                            <img src={previewImagen} alt="Foto del colaborador" className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/45 group-hover:opacity-100">
                                                <button type="button" onClick={() => imagenInputRef.current?.click()} className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                                                    Cambiar foto
                                                </button>
                                                <button type="button" onClick={() => setShowDeleteDialog(true)} className="rounded-full bg-white/95 p-2 text-red-600 shadow-sm" aria-label="Eliminar imagen">
                                                    <X className="size-4" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button type="button" onClick={() => imagenInputRef.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 text-emerald-700/70 transition-colors hover:text-emerald-700 dark:text-emerald-300/70">
                                            <div className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm dark:bg-emerald-500/10">
                                                <Plus className="size-5" />
                                            </div>
                                            <span className="text-xs font-medium">Subir foto</span>
                                        </button>
                                    )}
                                </div>
                                <InputError message={errors.imagen} />
                            </div>
                        </div>
                    </div>

                    <div className="order-2 grid gap-4 lg:order-1">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="cedula">Cédula</Label>
                                {readonlyCedula ? (
                                    <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                                        {data.cedula}
                                    </div>
                                ) : (
                                    <CampoConIcono icon={IdCard}>
                                        <Input id="cedula" className="pl-9" value={data.cedula} onChange={(e) => setData('cedula', e.target.value)} disabled={processing} required autoFocus />
                                    </CampoConIcono>
                                )}
                                <InputError message={errors.cedula} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="expedido_en">Expedido en</Label>
                                <CampoConIcono icon={MapPin}>
                                    <Input id="expedido_en" className="pl-9" placeholder="Ciudad de expedición" value={data.expedido_en} onChange={(e) => setData('expedido_en', e.target.value)} disabled={processing} />
                                </CampoConIcono>
                                <InputError message={errors.expedido_en} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="nombres">Nombres</Label>
                                <CampoConIcono icon={User}>
                                    <Input id="nombres" className="pl-9" value={data.nombres} onChange={(e) => setData('nombres', e.target.value)} disabled={processing} required />
                                </CampoConIcono>
                                <InputError message={errors.nombres} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="apellidos">Apellidos</Label>
                                <CampoConIcono icon={User}>
                                    <Input id="apellidos" className="pl-9" value={data.apellidos} onChange={(e) => setData('apellidos', e.target.value)} disabled={processing} required />
                                </CampoConIcono>
                                <InputError message={errors.apellidos} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <PillToggle
                                label="Sexo"
                                value={data.sexo}
                                onChange={(value) => setData('sexo', value)}
                                disabled={processing}
                                options={[
                                    { value: 'femenino', label: 'Femenino' },
                                    { value: 'masculino', label: 'Masculino' },
                                ]}
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
                                <Input id="fecha_nacimiento" type="date" value={data.fecha_nacimiento} onChange={(e) => setData('fecha_nacimiento', e.target.value)} disabled={processing} />
                                <InputError message={errors.fecha_nacimiento} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edad">Edad</Label>
                                <div className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">{edadCalculada}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </SeccionCard>

            {/* Contacto y ubicación */}
            <SeccionCard icon={MapPin} titulo="Contacto y ubicación" subtitulo="Información de contacto y residencia" paso="Paso 2 de 4" tono="azul">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="ciudad_residencia">Ciudad de residencia</Label>
                        <CampoConIcono icon={MapPin}>
                            <Input id="ciudad_residencia" className="pl-9" value={data.ciudad_residencia} onChange={(e) => setData('ciudad_residencia', e.target.value)} disabled={processing} />
                        </CampoConIcono>
                        <InputError message={errors.ciudad_residencia} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="estrato">Estrato</Label>
                        <Select value={data.estrato} onValueChange={(value) => setData('estrato', value)} disabled={processing}>
                            <SelectTrigger id="estrato">
                                <SelectValue placeholder="Selecciona el estrato" />
                            </SelectTrigger>
                            <SelectContent>
                                {ESTRATOS.map((estrato) => (
                                    <SelectItem key={estrato} value={estrato}>{estrato}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.estrato} />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="direccion">Dirección</Label>
                        <CampoConIcono icon={MapPin}>
                            <Input id="direccion" className="pl-9" value={data.direccion} onChange={(e) => setData('direccion', e.target.value)} disabled={processing} />
                        </CampoConIcono>
                        <InputError message={errors.direccion} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="celular_1">Celular 1</Label>
                        <CampoConIcono icon={Phone}>
                            <Input id="celular_1" className="pl-9" value={data.celular_1} onChange={(e) => setData('celular_1', e.target.value)} disabled={processing} />
                        </CampoConIcono>
                        <InputError message={errors.celular_1} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="celular_2">Celular 2</Label>
                        <CampoConIcono icon={Phone}>
                            <Input id="celular_2" className="pl-9" placeholder="Opcional" value={data.celular_2} onChange={(e) => setData('celular_2', e.target.value)} disabled={processing} />
                        </CampoConIcono>
                        <InputError message={errors.celular_2} />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="correo">Correo electrónico</Label>
                        <CampoConIcono icon={Mail}>
                            <Input id="correo" type="email" className="pl-9" value={data.correo} onChange={(e) => setData('correo', e.target.value)} disabled={processing} />
                        </CampoConIcono>
                        <InputError message={errors.correo} />
                    </div>
                </div>
            </SeccionCard>

            {/* Turno / área */}
            <SeccionCard icon={Briefcase} titulo="Asignación" subtitulo="Turno, área y cargo del colaborador" paso="Paso 3 de 4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="turno">Turno</Label>
                        <Select value={data.turno} onValueChange={(value) => setData('turno', value)} disabled={processing}>
                            <SelectTrigger id="turno">
                                <SelectValue placeholder="Selecciona un turno" />
                            </SelectTrigger>
                            <SelectContent>
                                {TURNOS.map((turno) => (
                                    <SelectItem key={turno.value} value={turno.value}>{turno.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.turno} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="area">Área / Ruta</Label>
                        <CampoConIcono icon={MapPin}>
                            <Input id="area" className="pl-9" value={data.area} onChange={(e) => setData('area', e.target.value)} disabled={processing} />
                        </CampoConIcono>
                        <InputError message={errors.area} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cargo">Cargo</Label>
                        <CampoConIcono icon={Briefcase}>
                            <Input id="cargo" className="pl-9" value={data.cargo} onChange={(e) => setData('cargo', e.target.value)} disabled={processing} />
                        </CampoConIcono>
                        <InputError message={errors.cargo} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="estado_civil">Estado civil</Label>
                        <Select value={data.estado_civil} onValueChange={(value) => setData('estado_civil', value)} disabled={processing}>
                            <SelectTrigger id="estado_civil">
                                <SelectValue placeholder="Selecciona el estado civil" />
                            </SelectTrigger>
                            <SelectContent>
                                {ESTADOS_CIVILES.map((estado) => (
                                    <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.estado_civil} />
                    </div>
                </div>
            </SeccionCard>

            {/* Condiciones particulares */}
            <SeccionCard icon={ShieldCheck} titulo="Condiciones particulares" subtitulo="Marca lo que aplique al colaborador" tono="verde">
                <div className="grid gap-4 sm:grid-cols-3">
                    <PillToggle
                        label="Discapacidad"
                        value={data.discapacidad}
                        onChange={(value) => setData('discapacidad', value)}
                        disabled={processing}
                        options={[{ value: 'no_aplica', label: 'No aplica' }, { value: 'aplica', label: 'Aplica' }]}
                    />
                    <PillToggle
                        label="Víctima del conflicto"
                        value={data.victima_conflicto}
                        onChange={(value) => setData('victima_conflicto', value)}
                        disabled={processing}
                        options={[{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }]}
                    />
                    <PillToggle
                        label="Libreta militar"
                        value={data.libreta_militar}
                        onChange={(value) => setData('libreta_militar', value)}
                        disabled={processing}
                        options={[{ value: 'no_aplica', label: 'No aplica' }, { value: 'aplica', label: 'Aplica' }]}
                    />
                </div>
            </SeccionCard>

            {/* Antecedentes en la empresa */}
            <SeccionCard icon={History} titulo="Antecedentes en la empresa" subtitulo="¿Ha trabajado anteriormente en la empresa?">
                <PillToggle
                    label=""
                    value={data.ha_trabajado_antes}
                    onChange={(value) => setData('ha_trabajado_antes', value)}
                    disabled={processing}
                    options={[{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }]}
                />
                {data.ha_trabajado_antes === 'si' && (
                    <div className="mt-4 grid gap-4 border-l-2 border-emerald-300 pl-4 sm:grid-cols-2 dark:border-emerald-500/30">
                        <div className="grid gap-2">
                            <Label htmlFor="cargo_anterior">Cargo desempeñado</Label>
                            <Select value={data.cargo_anterior} onValueChange={(value) => setData('cargo_anterior', value)} disabled={processing}>
                                <SelectTrigger id="cargo_anterior">
                                    <SelectValue placeholder="Selecciona el cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CARGOS_ANTERIORES.map((cargo) => (
                                        <SelectItem key={cargo.value} value={cargo.value}>{cargo.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.cargo_anterior} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fecha_ultima_laboral">Última fecha laborada</Label>
                            <Input id="fecha_ultima_laboral" type="date" value={data.fecha_ultima_laboral} onChange={(e) => setData('fecha_ultima_laboral', e.target.value)} disabled={processing} />
                            <InputError message={errors.fecha_ultima_laboral} />
                        </div>
                    </div>
                )}
            </SeccionCard>

            {/* Experiencia */}
            <SeccionCard icon={Award} titulo="Experiencia" subtitulo="¿Tiene experiencia previa relevante?">
                <PillToggle
                    label=""
                    value={data.tiene_experiencia}
                    onChange={(value) => setData('tiene_experiencia', value)}
                    disabled={processing}
                    options={[{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }]}
                />
                {data.tiene_experiencia === 'si' && (
                    <div className="mt-4 grid gap-4 border-l-2 border-emerald-300 pl-4 sm:grid-cols-3 dark:border-emerald-500/30">
                        <div className="grid gap-2">
                            <Label htmlFor="area_experiencia">Área</Label>
                            <Input id="area_experiencia" value={data.area_experiencia} onChange={(e) => setData('area_experiencia', e.target.value)} disabled={processing} />
                            <InputError message={errors.area_experiencia} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cargo_experiencia">Cargo</Label>
                            <Input id="cargo_experiencia" value={data.cargo_experiencia} onChange={(e) => setData('cargo_experiencia', e.target.value)} disabled={processing} />
                            <InputError message={errors.cargo_experiencia} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="anios_experiencia">Años de experiencia</Label>
                            <Input id="anios_experiencia" type="number" min="0" value={data.anios_experiencia} onChange={(e) => setData('anios_experiencia', e.target.value)} disabled={processing} />
                            <InputError message={errors.anios_experiencia} />
                        </div>
                    </div>
                )}
            </SeccionCard>

            {/* Código QR SKAP */}
            <SeccionCard icon={QrCode} titulo="Código QR SKAP" subtitulo="Escribe el número: se genera al instante un QR para que lo escaneen." tono="azul">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    <div className="grid w-full max-w-xs gap-2">
                        <Label htmlFor="codigo_qr_skap">Número de código</Label>
                        <CampoConIcono icon={QrCode}>
                            <Input
                                id="codigo_qr_skap"
                                className="pl-9"
                                placeholder="Ej. 4587213"
                                inputMode="numeric"
                                value={data.codigo_qr_skap}
                                onChange={(e) => setData('codigo_qr_skap', e.target.value.replace(/\D/g, ''))}
                                disabled={processing}
                            />
                        </CampoConIcono>
                        <InputError message={errors.codigo_qr_skap} />
                    </div>

                    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-3 dark:bg-neutral-900">
                        {data.codigo_qr_skap ? (
                            <QRCodeSVG value={data.codigo_qr_skap} size={120} />
                        ) : (
                            <div className="flex size-[120px] items-center justify-center text-center text-xs text-muted-foreground">
                                Escribe el código para ver el QR
                            </div>
                        )}
                        <span className="text-[11px] text-muted-foreground">Código para escanear</span>
                    </div>
                </div>
            </SeccionCard>

            {/* Documentos */}
            <input
                ref={documentoInputRef}
                type="file"
                accept=".pdf,.xls,.xlsx"
                multiple
                className="hidden"
                onChange={handleDocumentInputChange}
                disabled={processing}
            />

            <div className="flex items-center gap-2">
                <FolderOpen className="size-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Documentos</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid min-h-[430px] min-w-0 md:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="border-b border-border p-2 md:border-b-0 md:border-r">
                        {DOCUMENT_GROUPS.map((grupo) => (
                            <div key={grupo} className="mb-3">
                                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{grupo}</p>
                                <div className="flex gap-1 overflow-x-auto md:grid md:overflow-visible">
                                    {DOCUMENTO_FIELDS.filter((field) => field.grupo === grupo).map((field) => {
                                        const files = Array.isArray(data[field.key]) ? data[field.key] as File[] : [];
                                        const saved = existingDocumentos?.[field.key] ?? [];
                                        const names = [...files.map((file) => file.name), ...saved.map((document) => document.path.split('/').pop() ?? document.path)];
                                        const name = names[0];
                                        const spreadsheet = name ? isSpreadsheet(name) : false;
                                        const Icon = spreadsheet ? FileSpreadsheet : FileText;

                                        return (
                                            <div key={`tab-${field.key}`} className="grid gap-1">
                                                <div className="flex min-w-[190px] items-center md:min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setActiveDocumentKey(field.key); setActiveDocumentIndex(0); setViewerScale(1); }}
                                                        className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                                                            activeDocumentKey === field.key ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
                                                        }`}
                                                    >
                                                        <Icon className="size-4 shrink-0" />
                                                        <span className="min-w-0 flex-1 truncate">{field.label}</span>
                                                        {names.length > 0 && <span className="shrink-0 text-[10px] text-muted-foreground">{names.length}</span>}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectDocument(field.key)}
                                                        disabled={processing}
                                                        className="shrink-0 rounded p-2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                                                        title={`Agregar documentos a ${field.label}`}
                                                        aria-label={`Agregar documentos a ${field.label}`}
                                                    >
                                                        <Plus className="size-4" />
                                                    </button>
                                                </div>
                                                {activeDocumentKey === field.key && names.length > 0 && (
                                                    <div className="grid gap-0.5 pl-9">
                                                        {names.map((fileName, index) => (
                                                            <button
                                                                key={`${field.key}-${fileName}-${index}`}
                                                                type="button"
                                                                onClick={() => { setActiveDocumentIndex(index); setViewerScale(1); }}
                                                                className={`truncate rounded px-2 py-1 text-left text-[11px] ${activeDocumentIndex === index ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                                title={fileName}
                                                            >
                                                                {fileName}
                                                                {!files[index] && saved[index - files.length]?.fecha && ` · ${saved[index - files.length].fecha}`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="relative min-w-0 overflow-auto p-2 sm:p-4">
                        <div className="w-full min-w-0 overflow-hidden rounded-lg border border-border">
                            <div className="flex flex-col gap-2 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                                <div className="flex min-w-0 items-center gap-2">
                                    {activeFileName && isSpreadsheet(activeFileName) ? <FileSpreadsheet className="size-5 text-emerald-600" /> : <FileText className="size-5 text-red-500" />}
                                    <span className="truncate text-sm font-medium text-foreground">{activeFileName ?? 'Sin documento seleccionado'}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-7 text-xs text-muted-foreground sm:shrink-0 sm:pl-0">
                                    {activeDocumentDate && <span>Fecha: {activeDocumentDate}</span>}
                                    <span>{activeField.label}</span>
                                </div>
                            </div>

                            <div className="min-h-[350px] min-w-0 p-2 sm:p-4">
                                {excelLoading && activeFileName && isSpreadsheet(activeFileName) && (
                                    <div className="flex h-80 items-center justify-center text-sm text-neutral-500">Preparando vista del Excel...</div>
                                )}
                                {!excelLoading && activePreviewUrl && activeFileName && isPdf(activeFileName) && (
                                    <iframe src={activePreviewUrl} title={`Vista previa de ${activeField.label}`} className="h-[65vh] min-h-[360px] max-h-[650px] w-full rounded border border-border" style={{ transform: `scale(${viewerScale})`, transformOrigin: 'top left', width: `${100 / viewerScale}%`, height: `min(${600 / viewerScale}px, 65vh)` }} />
                                )}
                                {!excelLoading && activePreviewUrl && activeFileName && isSpreadsheet(activeFileName) && excelPreviews[activeField.key]?.headers.length > 0 && (
                                    <div className="max-h-[65vh] overflow-auto rounded border border-border">
                                        <table className="w-full border-collapse text-left" style={{ fontSize: `${0.75 * viewerScale}rem` }}>
                                            <thead className="sticky top-0 text-foreground">
                                                <tr>{excelPreviews[activeField.key].headers.map((header, index) => <th key={index} className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold">{header}</th>)}</tr>
                                            </thead>
                                            <tbody>{excelPreviews[activeField.key].rows.map((row, rowIndex) => <tr key={rowIndex}>{excelPreviews[activeField.key].headers.map((_, columnIndex) => <td key={columnIndex} className="whitespace-nowrap border-b border-border px-3 py-2 text-foreground">{row[columnIndex] ?? ''}</td>)}</tr>)}</tbody>
                                        </table>
                                    </div>
                                )}
                                {!excelLoading && (!activePreviewUrl || !activeFileName) && <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">Selecciona un documento para ver su contenido aquí.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
                <Checkbox
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', checked === true)}
                    disabled={processing}
                />
                <CheckCircle2 className="size-4 text-emerald-600" />
                <Label htmlFor="is_active" className="font-normal">
                    Colaborador activo
                </Label>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-red-50 border-red-200">
                    <AlertDialogTitle className="text-red-900">Eliminar imagen</AlertDialogTitle>
                    <AlertDialogDescription className="text-red-800">
                        ¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                    <div className="flex justify-end gap-2 pt-4">
                        <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={removeImagen} className="bg-red-500 text-white hover:bg-red-600">
                            Eliminar
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
