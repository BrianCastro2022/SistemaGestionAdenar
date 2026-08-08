import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
    UserCog,
    X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { type InertiaFormProps } from '@inertiajs/react';
import { type WizardCatalogos } from '@/pages/seguridad/colaboradores/wizard/catalogos';
import { DepartamentoCiudadSelect } from '@/pages/seguridad/colaboradores/wizard/components/departamento-ciudad-select';

const HOY_ISO = new Date().toISOString().slice(0, 10);

export interface ColaboradorFormData {
    user_id: string;
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

    tipo_documento: string;
    tipo_documento_otro_label: string;

    // Condiciones particulares
    discapacidad: 'no_aplica' | 'aplica' | '';
    discapacidad_tipo: string;
    discapacidad_observaciones: string;
    victima_conflicto: 'si' | 'no' | '';
    victima_conflicto_observaciones: string;
    libreta_militar: 'no_aplica' | 'aplica' | '';
    runt_aplica: 'no_aplica' | 'aplica' | '';

    // Seguridad social
    eps: string;
    eps_otro: string;
    afp: string;
    afp_otro: string;
    arl: string;
    arl_otro: string;

    // Información aprendiz SENA
    sena_especialidad: string;
    sena_numero_grupo: string;
    sena_institucion: string;
    sena_nit: string;
    sena_centro_formacion: string;

    // Antecedentes en la empresa
    ha_trabajado_antes: 'si' | 'no' | '';
    cargo_anterior: string;
    fecha_ultima_laboral: string;

    // Experiencia
    tiene_experiencia: 'si' | 'no' | '';
    area_experiencia: string;
    cargo_experiencia: string;
    anios_experiencia: string;
    manejo_defensivo_aplica: 'no_aplica' | 'aplica' | '';
    conduccion_carga_pesada_aplica: 'no_aplica' | 'aplica' | '';
    experiencia_terreno_plano: 'si' | 'no' | '';
    experiencia_terreno_montanoso: 'si' | 'no' | '';

    // Información del puesto de trabajo
    cargo_fecha_inicio: string;
    centro: string;
    centro_trabajo: string;
    fecha_ingreso_empresa: string;
    fecha_retiro_empresa: string;
    motivo_retiro: string;
    tipo_contrato: string;
    contrato_fecha_desde: string;
    contrato_fecha_hasta: string;
    vacaciones_aplica: 'no_aplica' | 'aplica' | '';
    vacaciones_fecha_desde: string;
    vacaciones_fecha_hasta: string;
    vacaciones_pagadas_fecha_desde: string;
    vacaciones_pagadas_fecha_hasta: string;

    // Plan padrino
    es_padrino: 'no_aplica' | 'aplica' | '';
    tipo_padrino: 'padrino' | 'plan_padrino_personal_nuevo' | '';
    licencia_conduccion_categorias: string[];

    // QR SKAP
    codigo_qr_skap: string;

    // Documentos — personales
    documento_cedula: File[];
    documento_tipo_identificacion: File[];
    documento_hoja_vida: File[];
    documento_libreta_militar: File[];
    documento_antecedentes_procuraduria: File[];
    documento_antecedentes_contraloria: File[];
    documento_antecedentes_policia: File[];
    documento_certificado_bancario: File[];
    documento_runt: File[];
    // Documentos — tránsito
    documento_licencia_conduccion: File[];
    documento_licencia_a1: File[];
    documento_licencia_a2: File[];
    documento_licencia_b1: File[];
    documento_licencia_b2: File[];
    documento_licencia_b3: File[];
    documento_licencia_c1: File[];
    documento_licencia_c2: File[];
    documento_licencia_c3: File[];
    documento_carnet_manejo_defensivo: File[];
    documento_certificado_manejo_defensivo: File[];
    documento_certificado_carga_pesada: File[];
    documento_simit: File[];
    documento_recordatorio_vehiculo_licencia_conduccion: File[];
    // Documentos — salud
    documento_eps: File[];
    documento_pension: File[];
    documento_arl: File[];
    documento_examen_medico_ocupacional: File[];
    documento_certificado_comfamiliar: File[];
    documento_afiliacion_comfamiliar: File[];
    // Documentos — empresariales
    documento_carnet_ingreso_cd: File[];
    documento_contrato: File[];
    documento_preaviso_terminacion: File[];
    documento_prorroga: File[];
    // Documentos — académicos
    documento_titulo_bachiller: File[];
    documento_titulo_tecnico: File[];
    documento_titulo_tecnologo: File[];
    documento_titulo_profesional: File[];
    documento_titulo_academico: File[];
    // Documentos — aprendiz / People / plan padrino / disciplinarios / aprendizaje
    documento_sena_carta_presentacion: File[];
    documento_induccion: File[];
    documento_reinduccion: File[];
    documento_induccion_pilares: File[];
    documento_plan_padrino: File[];
    documento_llamado_atencion: File[];
    documento_compromisos: File[];
    documento_escuela_pilotos: File[];
    documento_certificado_brigadista: File[];

    is_active: boolean;
    [key: string]: string | string[] | boolean | File | File[] | null;
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

interface ColaboradorFormFieldsProps extends Pick<InertiaFormProps<ColaboradorFormData>, 'data' | 'setData' | 'errors' | 'processing'> {
    readonlyCedula?: boolean;
    existingDocumentos?: Partial<Record<DocumentKey, DocumentInfo[]>>;
    usuarios?: { id: number; name: string; identification_number: string }[];
    catalogos?: WizardCatalogos;
    historialCargos?: { id: number; cargo: string; fecha_inicio: string; fecha_fin: string | null; estado: 'ACTIVO' | 'INACTIVO' }[];
}

const TURNOS = [
    { value: 'manana', label: 'Mañana' },
    { value: 'tarde', label: 'Tarde' },
    { value: 'noche', label: 'Noche' },
];

export const ESTADOS_CIVILES = [
    { value: 'soltero', label: 'Soltero(a)' },
    { value: 'union_libre', label: 'Unión libre' },
    { value: 'casado', label: 'Casado(a)' },
    { value: 'divorciado', label: 'Divorciado(a)' },
    { value: 'viudo', label: 'Viudo(a)' },
];

const ESTRATOS = ['1', '2', '3', '4', '5', '6'];

export const CARGOS_ANTERIORES = [
    { value: 'conductor', label: 'Conductor' },
    { value: 'auxiliar_logistico', label: 'Auxiliar logístico' },
    { value: 'supervisor_ruta', label: 'Supervisor de ruta' },
];

export type DocumentGroup =
    | 'Documentos personales'
    | 'Documentos de tránsito'
    | 'Documentos de salud'
    | 'Documentos empresariales'
    | 'Documentos académicos'
    | 'Documentos aprendiz'
    | 'Documentos People'
    | 'Documentos plan padrino'
    | 'Documentos disciplinarios'
    | 'Documentos de aprendizaje';

export const DOCUMENTO_FIELDS: { key: Extract<keyof ColaboradorFormData, string>; label: string; grupo: DocumentGroup }[] = [
    { key: 'documento_cedula', label: 'Documento de cédula', grupo: 'Documentos personales' },
    { key: 'documento_tipo_identificacion', label: 'Archivo del tipo de documento', grupo: 'Documentos personales' },
    { key: 'documento_hoja_vida', label: 'Hoja de vida', grupo: 'Documentos personales' },
    { key: 'documento_libreta_militar', label: 'Libreta militar', grupo: 'Documentos personales' },
    { key: 'documento_antecedentes_procuraduria', label: 'Antecedentes — Procuraduría', grupo: 'Documentos personales' },
    { key: 'documento_antecedentes_contraloria', label: 'Antecedentes — Contraloría', grupo: 'Documentos personales' },
    { key: 'documento_antecedentes_policia', label: 'Antecedentes — Policía Nacional', grupo: 'Documentos personales' },
    { key: 'documento_certificado_bancario', label: 'Certificado bancario', grupo: 'Documentos personales' },
    { key: 'documento_runt', label: 'RUNT', grupo: 'Documentos personales' },

    { key: 'documento_licencia_conduccion', label: 'Licencia de conducción', grupo: 'Documentos de tránsito' },
    { key: 'documento_licencia_a1', label: 'Licencia — A1', grupo: 'Documentos de tránsito' },
    { key: 'documento_licencia_a2', label: 'Licencia — A2', grupo: 'Documentos de tránsito' },
    { key: 'documento_licencia_b1', label: 'Licencia — B1', grupo: 'Documentos de tránsito' },
    { key: 'documento_licencia_b2', label: 'Licencia — B2', grupo: 'Documentos de tránsito' },
    { key: 'documento_licencia_b3', label: 'Licencia — B3', grupo: 'Documentos de tránsito' },
    { key: 'documento_licencia_c1', label: 'Licencia — C1', grupo: 'Documentos de tránsito' },
    { key: 'documento_licencia_c2', label: 'Licencia — C2', grupo: 'Documentos de tránsito' },
    { key: 'documento_licencia_c3', label: 'Licencia — C3', grupo: 'Documentos de tránsito' },
    { key: 'documento_carnet_manejo_defensivo', label: 'Carnet manejo defensivo', grupo: 'Documentos de tránsito' },
    { key: 'documento_certificado_manejo_defensivo', label: 'Certificado manejo defensivo', grupo: 'Documentos de tránsito' },
    { key: 'documento_certificado_carga_pesada', label: 'Certificado conducción de carga pesada', grupo: 'Documentos de tránsito' },
    { key: 'documento_simit', label: 'Documento Simit', grupo: 'Documentos de tránsito' },
    { key: 'documento_recordatorio_vehiculo_licencia_conduccion', label: 'Recordatorio vehículo / licencia', grupo: 'Documentos de tránsito' },

    { key: 'documento_eps', label: 'Documento EPS', grupo: 'Documentos de salud' },
    { key: 'documento_pension', label: 'Documento AFP / pensión', grupo: 'Documentos de salud' },
    { key: 'documento_arl', label: 'Documento ARL', grupo: 'Documentos de salud' },
    { key: 'documento_examen_medico_ocupacional', label: 'Examen médico ocupacional', grupo: 'Documentos de salud' },
    { key: 'documento_certificado_comfamiliar', label: 'Certificado Comfamiliar', grupo: 'Documentos de salud' },
    { key: 'documento_afiliacion_comfamiliar', label: 'Afiliación Comfamiliar', grupo: 'Documentos de salud' },

    { key: 'documento_carnet_ingreso_cd', label: 'Carnet ingreso CD', grupo: 'Documentos empresariales' },
    { key: 'documento_contrato', label: 'Contrato', grupo: 'Documentos empresariales' },
    { key: 'documento_preaviso_terminacion', label: 'Preaviso de terminación', grupo: 'Documentos empresariales' },
    { key: 'documento_prorroga', label: 'Prórroga', grupo: 'Documentos empresariales' },

    { key: 'documento_titulo_bachiller', label: 'Título de bachiller', grupo: 'Documentos académicos' },
    { key: 'documento_titulo_tecnico', label: 'Título técnico', grupo: 'Documentos académicos' },
    { key: 'documento_titulo_tecnologo', label: 'Título tecnólogo', grupo: 'Documentos académicos' },
    { key: 'documento_titulo_profesional', label: 'Título profesional', grupo: 'Documentos académicos' },
    { key: 'documento_titulo_academico', label: 'Título — otro', grupo: 'Documentos académicos' },

    { key: 'documento_sena_carta_presentacion', label: 'Carta de presentación (Aprendiz SENA)', grupo: 'Documentos aprendiz' },

    { key: 'documento_induccion', label: 'Inducción', grupo: 'Documentos People' },
    { key: 'documento_reinduccion', label: 'Reinducción', grupo: 'Documentos People' },
    { key: 'documento_induccion_pilares', label: 'Inducción pilares', grupo: 'Documentos People' },

    { key: 'documento_plan_padrino', label: 'Plan padrino personal nuevo', grupo: 'Documentos plan padrino' },

    { key: 'documento_llamado_atencion', label: 'Llamado de atención', grupo: 'Documentos disciplinarios' },
    { key: 'documento_compromisos', label: 'Compromisos', grupo: 'Documentos disciplinarios' },

    { key: 'documento_escuela_pilotos', label: 'Certificado escuela de pilotos', grupo: 'Documentos de aprendizaje' },
    { key: 'documento_certificado_brigadista', label: 'Certificado de Brigadista', grupo: 'Documentos de aprendizaje' },
];

export const DOCUMENT_GROUPS: DocumentGroup[] = [
    'Documentos personales',
    'Documentos de tránsito',
    'Documentos de salud',
    'Documentos empresariales',
    'Documentos académicos',
    'Documentos aprendiz',
    'Documentos People',
    'Documentos plan padrino',
    'Documentos disciplinarios',
    'Documentos de aprendizaje',
];

export function calcularEdad(fechaNacimiento: string): string {
    if (!fechaNacimiento) return '—';
    const nacimiento = new Date(fechaNacimiento);
    if (Number.isNaN(nacimiento.getTime())) return '—';
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const aunNoCumple = hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
    if (aunNoCumple) edad -= 1;
    return edad >= 0 ? `${edad} años` : '—';
}

/** Tiempo trabajado en la empresa desde la fecha de ingreso (tarjeta con foto, HU06). */
export function calcularTiempoTrabajado(fechaIngreso: string | null): string {
    if (!fechaIngreso) return '—';
    const ingreso = new Date(fechaIngreso);
    if (Number.isNaN(ingreso.getTime())) return '—';

    const hoy = new Date();
    let meses = (hoy.getFullYear() - ingreso.getFullYear()) * 12 + (hoy.getMonth() - ingreso.getMonth());
    if (hoy.getDate() < ingreso.getDate()) meses -= 1;
    if (meses < 0) return '—';

    const anios = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;

    if (anios === 0) return `${mesesRestantes} mes${mesesRestantes === 1 ? '' : 'es'}`;
    if (mesesRestantes === 0) return `${anios} año${anios === 1 ? '' : 's'}`;
    return `${anios} año${anios === 1 ? '' : 's'} ${mesesRestantes} mes${mesesRestantes === 1 ? '' : 'es'}`;
}

export function PillToggle<T extends string>({
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

export function SeccionCard({
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

const DEFAULT_CATALOGOS: WizardCatalogos = {
    tiposDocumento: ['Tarjeta de identidad', 'Cédula'],
    epsOpciones: ['EMSSANAR', 'SANITAS', 'FAMISANAR', 'NUEVA EPS', 'MALLAMAS'],
    afpOpciones: ['PORVENIR', 'PROTECCIÓN', 'COLPENSIONES', 'FONDO NACIONAL DEL AHORRO'],
    arlOpciones: ['ARL Positiva', 'ARL SURA', 'Riesgos Laborales Colmena', 'Seguros Bolívar', 'AXA Colpatria', 'MAPFRE Colombia'],
    cargos: [],
    centros: ['UC', 'SUR', 'JL', 'MOVILIZADOR', 'INCAPACIDAD JL'],
    centrosTrabajo: ['Sura riesgo I', 'Sura riesgo IV'],
    tiposContrato: [],
    motivosRetiro: [],
    licenciaCategorias: ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'],
};

export function ColaboradorFormFields({
    data,
    setData,
    errors,
    processing,
    readonlyCedula,
    existingDocumentos,
    usuarios,
    catalogos = DEFAULT_CATALOGOS,
    historialCargos = [],
}: ColaboradorFormFieldsProps) {
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
                                <Label htmlFor="tipo_documento">Tipo de documento</Label>
                                <Select value={data.tipo_documento} onValueChange={(value) => setData('tipo_documento', value)} disabled={processing}>
                                    <SelectTrigger id="tipo_documento">
                                        <SelectValue placeholder="Selecciona el tipo de documento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {catalogos.tiposDocumento.map((tipo) => (
                                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                        ))}
                                        <SelectItem value="Otro">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.tipo_documento} />
                            </div>
                            {data.tipo_documento === 'Otro' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="tipo_documento_otro_label">¿Cuál?</Label>
                                    <Input id="tipo_documento_otro_label" value={data.tipo_documento_otro_label} onChange={(e) => setData('tipo_documento_otro_label', e.target.value)} disabled={processing} />
                                    <InputError message={errors.tipo_documento_otro_label} />
                                </div>
                            )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="cedula">
                                    Número de documento <span className="text-red-600">*</span>
                                </Label>
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
                            <DepartamentoCiudadSelect
                                label="Expedido en"
                                value={data.expedido_en}
                                onValueChange={(value) => setData('expedido_en', value)}
                                error={errors.expedido_en}
                                disabled={processing}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="nombres">
                                    Nombres <span className="text-red-600">*</span>
                                </Label>
                                <CampoConIcono icon={User}>
                                    <Input id="nombres" className="pl-9" value={data.nombres} onChange={(e) => setData('nombres', e.target.value)} disabled={processing} required />
                                </CampoConIcono>
                                <InputError message={errors.nombres} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="apellidos">
                                    Apellidos <span className="text-red-600">*</span>
                                </Label>
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
                    <DepartamentoCiudadSelect
                        label="Ciudad de residencia"
                        value={data.ciudad_residencia}
                        onValueChange={(value) => setData('ciudad_residencia', value)}
                        error={errors.ciudad_residencia}
                        disabled={processing}
                    />
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
                        <Label htmlFor="area">Área</Label>
                        <Select value={data.area} onValueChange={(value) => setData('area', value)} disabled={processing}>
                            <SelectTrigger id="area">
                                <SelectValue placeholder="Selecciona el área" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Administrativa">Administrativa</SelectItem>
                                <SelectItem value="Operativa">Operativa</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.area} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cargo">Cargo</Label>
                        <Select value={data.cargo} onValueChange={(value) => setData('cargo', value)} disabled={processing}>
                            <SelectTrigger id="cargo">
                                <SelectValue placeholder="Selecciona el cargo" />
                            </SelectTrigger>
                            <SelectContent>
                                {catalogos.cargos.map((cargo) => (
                                    <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.cargo} />
                    </div>
                    {data.cargo !== '' && data.cargo !== historialCargos.find((h) => h.estado === 'ACTIVO')?.cargo && (
                        <div className="grid gap-2 sm:col-span-2 border-l-2 border-emerald-300 pl-3 dark:border-emerald-500/30">
                            <Label htmlFor="cargo_fecha_inicio">Fecha de inicio del nuevo cargo</Label>
                            <Input id="cargo_fecha_inicio" type="date" value={data.cargo_fecha_inicio} onChange={(e) => setData('cargo_fecha_inicio', e.target.value)} disabled={processing} />
                            <InputError message={errors.cargo_fecha_inicio} />
                            <p className="text-xs text-muted-foreground">El cargo activo actual (si existe) se cerrará automáticamente un día antes de esta fecha.</p>
                        </div>
                    )}
                    {historialCargos.length > 0 && (
                        <div className="sm:col-span-2 grid gap-1.5">
                            <p className="text-xs font-semibold text-muted-foreground">Historial de cargos</p>
                            {historialCargos.map((h) => (
                                <div key={h.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                                    <span className="font-medium text-foreground">{h.cargo}</span>
                                    <span className="text-muted-foreground">{h.fecha_inicio} — {h.fecha_fin ?? 'actual'}</span>
                                    <span className={h.estado === 'ACTIVO' ? 'text-emerald-600' : 'text-muted-foreground'}>{h.estado}</span>
                                </div>
                            ))}
                        </div>
                    )}
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
                    <div className="grid gap-2">
                        <Label htmlFor="centro">Centro</Label>
                        <Select value={data.centro} onValueChange={(value) => setData('centro', value)} disabled={processing}>
                            <SelectTrigger id="centro">
                                <SelectValue placeholder="Selecciona el centro" />
                            </SelectTrigger>
                            <SelectContent>
                                {catalogos.centros.map((centro) => (
                                    <SelectItem key={centro} value={centro}>{centro}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.centro} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="centro_trabajo">Centro de trabajo</Label>
                        <Select value={data.centro_trabajo} onValueChange={(value) => setData('centro_trabajo', value)} disabled={processing}>
                            <SelectTrigger id="centro_trabajo">
                                <SelectValue placeholder="Selecciona el centro de trabajo" />
                            </SelectTrigger>
                            <SelectContent>
                                {catalogos.centrosTrabajo.map((centro) => (
                                    <SelectItem key={centro} value={centro}>{centro}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.centro_trabajo} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="fecha_ingreso_empresa">Fecha de ingreso a la empresa</Label>
                        <Input id="fecha_ingreso_empresa" type="date" value={data.fecha_ingreso_empresa} onChange={(e) => setData('fecha_ingreso_empresa', e.target.value)} disabled={processing} />
                        <InputError message={errors.fecha_ingreso_empresa} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="fecha_retiro_empresa">Fecha de retiro de la empresa</Label>
                        <Input
                            id="fecha_retiro_empresa"
                            type="date"
                            min={HOY_ISO}
                            value={data.fecha_retiro_empresa}
                            onChange={(e) => setData('fecha_retiro_empresa', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.fecha_retiro_empresa} />
                    </div>
                    {data.fecha_retiro_empresa && (
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="motivo_retiro">Motivo de retiro</Label>
                            <Select value={data.motivo_retiro} onValueChange={(value) => setData('motivo_retiro', value)} disabled={processing}>
                                <SelectTrigger id="motivo_retiro">
                                    <SelectValue placeholder="Selecciona el motivo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {catalogos.motivosRetiro.map((motivo) => (
                                        <SelectItem key={motivo} value={motivo}>{motivo}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.motivo_retiro} />
                        </div>
                    )}
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="tipo_contrato">Tipo de contrato</Label>
                        <Select value={data.tipo_contrato} onValueChange={(value) => setData('tipo_contrato', value)} disabled={processing}>
                            <SelectTrigger id="tipo_contrato">
                                <SelectValue placeholder="Selecciona el tipo de contrato" />
                            </SelectTrigger>
                            <SelectContent>
                                {catalogos.tiposContrato.map((tipo) => (
                                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.tipo_contrato} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="contrato_fecha_desde">Tiempo de contrato — desde</Label>
                        <Input id="contrato_fecha_desde" type="date" value={data.contrato_fecha_desde} onChange={(e) => setData('contrato_fecha_desde', e.target.value)} disabled={processing} />
                        <InputError message={errors.contrato_fecha_desde} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="contrato_fecha_hasta">Tiempo de contrato — hasta</Label>
                        <Input id="contrato_fecha_hasta" type="date" min={HOY_ISO} value={data.contrato_fecha_hasta} onChange={(e) => setData('contrato_fecha_hasta', e.target.value)} disabled={processing} />
                        <InputError message={errors.contrato_fecha_hasta} />
                    </div>
                </div>
            </SeccionCard>

            {/* Vacaciones */}
            <SeccionCard icon={QrCode} titulo="Vacaciones" tono="azul">
                <div className="grid gap-4">
                    <PillToggle
                        label="Vacaciones"
                        value={data.vacaciones_aplica}
                        onChange={(value) => setData('vacaciones_aplica', value)}
                        disabled={processing}
                        options={[{ value: 'no_aplica', label: 'No aplica' }, { value: 'aplica', label: 'Aplica' }]}
                    />
                    {data.vacaciones_aplica === 'aplica' && (
                        <div className="grid gap-4 border-l-2 border-emerald-300 pl-4 sm:grid-cols-2 dark:border-emerald-500/30">
                            <div className="grid gap-2">
                                <Label htmlFor="vacaciones_fecha_desde">Fecha desde</Label>
                                <Input id="vacaciones_fecha_desde" type="date" min={HOY_ISO} value={data.vacaciones_fecha_desde} onChange={(e) => setData('vacaciones_fecha_desde', e.target.value)} disabled={processing} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="vacaciones_fecha_hasta">Fecha hasta</Label>
                                <Input id="vacaciones_fecha_hasta" type="date" min={HOY_ISO} value={data.vacaciones_fecha_hasta} onChange={(e) => setData('vacaciones_fecha_hasta', e.target.value)} disabled={processing} />
                            </div>
                        </div>
                    )}
                    <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="vacaciones_pagadas_fecha_desde">Vacaciones pagadas — desde</Label>
                            <Input id="vacaciones_pagadas_fecha_desde" type="date" min={HOY_ISO} value={data.vacaciones_pagadas_fecha_desde} onChange={(e) => setData('vacaciones_pagadas_fecha_desde', e.target.value)} disabled={processing} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="vacaciones_pagadas_fecha_hasta">Vacaciones pagadas — hasta</Label>
                            <Input id="vacaciones_pagadas_fecha_hasta" type="date" min={HOY_ISO} value={data.vacaciones_pagadas_fecha_hasta} onChange={(e) => setData('vacaciones_pagadas_fecha_hasta', e.target.value)} disabled={processing} />
                        </div>
                    </div>
                </div>
            </SeccionCard>

            {/* Usuario del sistema (solo en edición: al crear, la cuenta se aprovisiona automáticamente con cédula como usuario y contraseña) */}
            {usuarios && (
                <SeccionCard
                    icon={UserCog}
                    titulo="Usuario del sistema"
                    subtitulo="Corrige el vínculo con la cuenta del portal si es necesario"
                    tono="azul"
                >
                    <div className="grid gap-2 sm:max-w-md">
                        <Label htmlFor="user_id">Cuenta de colaborador</Label>
                        <Select
                            value={data.user_id || 'none'}
                            onValueChange={(value) => setData('user_id', value === 'none' ? '' : value)}
                            disabled={processing}
                        >
                            <SelectTrigger id="user_id">
                                <SelectValue placeholder="Sin vincular" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin vincular</SelectItem>
                                {usuarios.map((usuario) => (
                                    <SelectItem key={usuario.id} value={String(usuario.id)}>
                                        {usuario.name} · {usuario.identification_number}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.user_id} />
                    </div>
                </SeccionCard>
            )}

            {/* Condiciones particulares */}
            <SeccionCard icon={ShieldCheck} titulo="Condiciones particulares" subtitulo="Marca lo que aplique al colaborador" tono="verde">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-3">
                        <PillToggle
                            label="Discapacidad"
                            value={data.discapacidad}
                            onChange={(value) => setData('discapacidad', value)}
                            disabled={processing}
                            options={[{ value: 'no_aplica', label: 'No aplica' }, { value: 'aplica', label: 'Aplica' }]}
                        />
                        {data.discapacidad === 'aplica' && (
                            <div className="grid gap-2 border-l-2 border-emerald-300 pl-3 dark:border-emerald-500/30">
                                <Input placeholder="Tipo de discapacidad" value={data.discapacidad_tipo} onChange={(e) => setData('discapacidad_tipo', e.target.value)} disabled={processing} />
                                <Textarea placeholder="Observaciones" value={data.discapacidad_observaciones} onChange={(e) => setData('discapacidad_observaciones', e.target.value)} disabled={processing} />
                            </div>
                        )}
                    </div>
                    <div className="grid gap-3">
                        <PillToggle
                            label="Víctima de conflicto"
                            value={data.victima_conflicto}
                            onChange={(value) => setData('victima_conflicto', value)}
                            disabled={processing}
                            options={[{ value: 'no', label: 'No aplica' }, { value: 'si', label: 'Aplica' }]}
                        />
                        {data.victima_conflicto === 'si' && (
                            <div className="grid gap-2 border-l-2 border-emerald-300 pl-3 dark:border-emerald-500/30">
                                <Textarea placeholder="Observaciones" value={data.victima_conflicto_observaciones} onChange={(e) => setData('victima_conflicto_observaciones', e.target.value)} disabled={processing} />
                            </div>
                        )}
                    </div>
                    <PillToggle
                        label="Libreta militar"
                        value={data.libreta_militar}
                        onChange={(value) => setData('libreta_militar', value)}
                        disabled={processing}
                        options={[{ value: 'no_aplica', label: 'No aplica' }, { value: 'aplica', label: 'Aplica' }]}
                    />
                    <PillToggle
                        label="RUNT"
                        value={data.runt_aplica}
                        onChange={(value) => setData('runt_aplica', value)}
                        disabled={processing}
                        options={[{ value: 'no_aplica', label: 'No aplica' }, { value: 'aplica', label: 'Aplica' }]}
                    />
                </div>
            </SeccionCard>

            {/* Seguridad social */}
            <SeccionCard icon={ShieldCheck} titulo="Seguridad social" subtitulo="EPS, AFP y ARL" tono="azul">
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="grid gap-2">
                        <Label htmlFor="eps">EPS</Label>
                        <Select value={data.eps} onValueChange={(value) => setData('eps', value)} disabled={processing}>
                            <SelectTrigger id="eps"><SelectValue placeholder="Selecciona EPS" /></SelectTrigger>
                            <SelectContent>
                                {catalogos.epsOpciones.map((eps) => <SelectItem key={eps} value={eps}>{eps}</SelectItem>)}
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                        {data.eps === 'Otro' && <Input placeholder="Nombre de la EPS" value={data.eps_otro} onChange={(e) => setData('eps_otro', e.target.value)} disabled={processing} />}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="afp">AFP</Label>
                        <Select value={data.afp} onValueChange={(value) => setData('afp', value)} disabled={processing}>
                            <SelectTrigger id="afp"><SelectValue placeholder="Selecciona AFP" /></SelectTrigger>
                            <SelectContent>
                                {catalogos.afpOpciones.map((afp) => <SelectItem key={afp} value={afp}>{afp}</SelectItem>)}
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                        {data.afp === 'Otro' && <Input placeholder="Nombre de la AFP" value={data.afp_otro} onChange={(e) => setData('afp_otro', e.target.value)} disabled={processing} />}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="arl">ARL</Label>
                        <Select value={data.arl} onValueChange={(value) => setData('arl', value)} disabled={processing}>
                            <SelectTrigger id="arl"><SelectValue placeholder="Selecciona ARL" /></SelectTrigger>
                            <SelectContent>
                                {catalogos.arlOpciones.map((arl) => <SelectItem key={arl} value={arl}>{arl}</SelectItem>)}
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                        {data.arl === 'Otro' && <Input placeholder="Nombre de la ARL" value={data.arl_otro} onChange={(e) => setData('arl_otro', e.target.value)} disabled={processing} />}
                    </div>
                </div>
            </SeccionCard>

            {/* Información aprendiz SENA */}
            {data.cargo === 'APRENDIZ SENA' && (
                <SeccionCard titulo="Información aprendiz SENA" tono="verde">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="sena_especialidad">Especialidad o programa de formación</Label>
                            <Input id="sena_especialidad" value={data.sena_especialidad} onChange={(e) => setData('sena_especialidad', e.target.value)} disabled={processing} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sena_numero_grupo">Número de grupo</Label>
                            <Input id="sena_numero_grupo" type="number" value={data.sena_numero_grupo} onChange={(e) => setData('sena_numero_grupo', e.target.value)} disabled={processing} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sena_institucion">Institución de formación</Label>
                            <Input id="sena_institucion" value={data.sena_institucion} onChange={(e) => setData('sena_institucion', e.target.value)} disabled={processing} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sena_nit">NIT</Label>
                            <Input id="sena_nit" value={data.sena_nit} onChange={(e) => setData('sena_nit', e.target.value)} disabled={processing} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="sena_centro_formacion">Centro de formación</Label>
                            <Input id="sena_centro_formacion" value={data.sena_centro_formacion} onChange={(e) => setData('sena_centro_formacion', e.target.value)} disabled={processing} />
                        </div>
                    </div>
                </SeccionCard>
            )}

            {/* Requisitos del cargo */}
            <SeccionCard icon={Award} titulo="Requisitos del cargo" tono="azul">
                <div className="grid gap-4 sm:grid-cols-2">
                    <PillToggle
                        label="Manejo defensivo y preventivo"
                        value={data.manejo_defensivo_aplica}
                        onChange={(value) => setData('manejo_defensivo_aplica', value)}
                        disabled={processing}
                        options={[{ value: 'no_aplica', label: 'No aplica' }, { value: 'aplica', label: 'Sí aplica' }]}
                    />
                    <PillToggle
                        label="Certificado de conducción de carga pesada"
                        value={data.conduccion_carga_pesada_aplica}
                        onChange={(value) => setData('conduccion_carga_pesada_aplica', value)}
                        disabled={processing}
                        options={[{ value: 'no_aplica', label: 'No aplica' }, { value: 'aplica', label: 'Sí aplica' }]}
                    />
                    <PillToggle
                        label="Experiencia en terreno plano"
                        value={data.experiencia_terreno_plano}
                        onChange={(value) => setData('experiencia_terreno_plano', value)}
                        disabled={processing}
                        options={[{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }]}
                    />
                    <PillToggle
                        label="Experiencia en terreno montañoso / curvas"
                        value={data.experiencia_terreno_montanoso}
                        onChange={(value) => setData('experiencia_terreno_montanoso', value)}
                        disabled={processing}
                        options={[{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }]}
                    />
                </div>
            </SeccionCard>

            {/* Plan padrino y licencia de conducción */}
            <SeccionCard titulo="Plan padrino y licencia de conducción" tono="verde">
                <div className="grid gap-4">
                    <PillToggle
                        label="¿Es padrino?"
                        value={data.es_padrino}
                        onChange={(value) => setData('es_padrino', value)}
                        disabled={processing}
                        options={[{ value: 'no_aplica', label: 'No aplica' }, { value: 'aplica', label: 'Aplica' }]}
                    />
                    {data.es_padrino === 'aplica' && (
                        <div className="grid gap-2 max-w-xs border-l-2 border-emerald-300 pl-3 dark:border-emerald-500/30">
                            <Label htmlFor="tipo_padrino">Tipo</Label>
                            <Select value={data.tipo_padrino} onValueChange={(value) => setData('tipo_padrino', value as ColaboradorFormData['tipo_padrino'])} disabled={processing}>
                                <SelectTrigger id="tipo_padrino"><SelectValue placeholder="Selecciona el tipo" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="padrino">Padrino</SelectItem>
                                    <SelectItem value="plan_padrino_personal_nuevo">Plan padrino personal nuevo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="grid gap-2 border-t border-border pt-4">
                        <Label>Licencia de conducción — categorías</Label>
                        <div className="flex flex-wrap gap-2">
                            {catalogos.licenciaCategorias.map((categoria) => {
                                const activa = data.licencia_conduccion_categorias.includes(categoria);
                                return (
                                    <button
                                        key={categoria}
                                        type="button"
                                        disabled={processing}
                                        onClick={() =>
                                            setData(
                                                'licencia_conduccion_categorias',
                                                activa
                                                    ? data.licencia_conduccion_categorias.filter((c) => c !== categoria)
                                                    : [...data.licencia_conduccion_categorias, categoria],
                                            )
                                        }
                                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                                            activa
                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                : 'border-input text-muted-foreground hover:border-emerald-200 hover:text-foreground'
                                        }`}
                                    >
                                        {categoria}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground">El archivo de cada categoría marcada se sube en la sección de Documentos, más abajo.</p>
                    </div>
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
