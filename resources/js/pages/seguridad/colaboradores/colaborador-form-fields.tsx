import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, FileText, Plus, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useEffect, useRef, useState } from 'react';

export interface ColaboradorFormData {
    cedula: string;
    nombres: string;
    apellidos: string;
    cargo: string;
    turno: string;
    area: string;
    imagen: File | null;
    documento_cedula: File[];
    documento_licencia_conduccion: File[];
    documento_carnet_manejo_defensivo: File[];
    documento_certificado_manejo_defensivo: File[];
    documento_carnet_ingreso_cd: File[];
    documento_simit: File[];
    documento_examen_medico_ocupacional: File[];
    documento_recordatorio_vehiculo_licencia_conduccion: File[];
    is_active: boolean;
    [key: string]: string | boolean | File | File[] | null;
}

interface ColaboradorFormFieldsProps {
    data: ColaboradorFormData;
    setData: <K extends keyof ColaboradorFormData>(key: K, value: ColaboradorFormData[K]) => void;
    errors: Partial<Record<keyof ColaboradorFormData, string>>;
    processing: boolean;
    readonlyCedula?: boolean;
    existingDocumentos?: Partial<Record<string, DocumentInfo[]>>;
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

const DOCUMENTO_FIELDS: { key: Extract<keyof ColaboradorFormData, string>; label: string }[] = [
    { key: 'documento_cedula', label: 'Documento de cédula' },
    { key: 'documento_licencia_conduccion', label: 'Documento licencia de conducción' },
    { key: 'documento_carnet_manejo_defensivo', label: 'Documento carnet manejo defensivo' },
    { key: 'documento_certificado_manejo_defensivo', label: 'Documento certificado manejo defensivo' },
    { key: 'documento_carnet_ingreso_cd', label: 'Carnet ingreso CD' },
    { key: 'documento_simit', label: 'Documento Simit' },
    { key: 'documento_examen_medico_ocupacional', label: 'Documento examen médico ocupacional' },
    { key: 'documento_recordatorio_vehiculo_licencia_conduccion', label: 'Documento recordatorio vehículo licencia de conducción' },
];

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
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="cedula">Cédula</Label>
                    {readonlyCedula ? (
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                            {data.cedula}
                        </div>
                    ) : (
                        <Input id="cedula" value={data.cedula} onChange={(e) => setData('cedula', e.target.value)} disabled={processing} required autoFocus />
                    )}
                    <InputError message={errors.cedula} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input id="cargo" value={data.cargo} onChange={(e) => setData('cargo', e.target.value)} disabled={processing} />
                    <InputError message={errors.cargo} />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="nombres">Nombres</Label>
                    <Input id="nombres" value={data.nombres} onChange={(e) => setData('nombres', e.target.value)} disabled={processing} required />
                    <InputError message={errors.nombres} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input
                        id="apellidos"
                        value={data.apellidos}
                        onChange={(e) => setData('apellidos', e.target.value)}
                        disabled={processing}
                        required
                    />
                    <InputError message={errors.apellidos} />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="turno">Turno</Label>
                    <Select value={data.turno} onValueChange={(value) => setData('turno', value)} disabled={processing}>
                        <SelectTrigger id="turno">
                            <SelectValue placeholder="Selecciona un turno" />
                        </SelectTrigger>
                        <SelectContent>
                            {TURNOS.map((turno) => (
                                <SelectItem key={turno.value} value={turno.value}>
                                    {turno.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.turno} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="area">Área / Ruta</Label>
                    <Input id="area" value={data.area} onChange={(e) => setData('area', e.target.value)} disabled={processing} />
                    <InputError message={errors.area} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="imagen">Imagen</Label>
                <input ref={imagenInputRef} id="imagen" type="file" accept="image/*" className="hidden" onChange={handleImagenChange} />
                <InputError message={errors.imagen} />
                <div className="flex gap-4">
                    {previewImagen && (
                        <div className="relative group w-32 h-32 flex-shrink-0">
                            <img
                                src={previewImagen}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg border border-blue-300"
                            />
                            <button
                                type="button"
                                onClick={() => setShowDeleteDialog(true)}
                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => imagenInputRef.current?.click()}
                        className="h-32 w-32 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                    >
                        <span className="text-3xl font-light leading-none">+</span>
                        <span className="text-xs mt-1">Agregar</span>
                    </button>
                </div>
            </div>

            <input
                ref={documentoInputRef}
                type="file"
                accept=".pdf,.xls,.xlsx"
                multiple
                className="hidden"
                onChange={handleDocumentInputChange}
                disabled={processing}
            />

            <p className="text-sm font-semibold text-foreground">Documentos personales</p>
            <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid min-h-[430px] min-w-0 md:grid-cols-[240px_minmax(0,1fr)]">
                    <div className="border-b border-border p-2 md:border-b-0 md:border-r">
                        <div className="flex gap-1 overflow-x-auto md:grid md:overflow-visible">
                            {DOCUMENTO_FIELDS.map((field) => {
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

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', checked === true)}
                    disabled={processing}
                />
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
