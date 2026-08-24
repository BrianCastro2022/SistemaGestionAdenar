import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, IdCard, ImageIcon, Plus, ShieldCheck, Truck, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { type InertiaFormProps } from '@inertiajs/react';

export interface VehiculoFormData {
    placa: string;
    truck_type: string;
    modelo: string;
    capacidad_pallets: string;
    imagen: File | null;

    documento_soat: File[];
    documento_rtm: File[];
    documento_codigo_qr: File[];
    documento_licencia_transito: File[];

    is_active: boolean;
    [key: string]: string | boolean | File | File[] | null;
}

export type DocumentInfo = {
    path: string;
    fecha: string | null;
};

type DocumentKey = Extract<keyof VehiculoFormData, string>;

interface VehiculoFormFieldsProps extends Pick<InertiaFormProps<VehiculoFormData>, 'data' | 'setData' | 'errors' | 'processing'> {
    readonlyPlaca?: boolean;
    existingDocumentos?: Partial<Record<DocumentKey, DocumentInfo[]>>;
}

export const DOCUMENTO_FIELDS: { key: DocumentKey; label: string; icon: typeof ShieldCheck }[] = [
    { key: 'documento_soat', label: 'SOAT', icon: ShieldCheck },
    { key: 'documento_rtm', label: 'Revisión Tecnicomecánica (RTM)', icon: FileText },
    { key: 'documento_codigo_qr', label: 'Documentación código QR', icon: FileText },
    { key: 'documento_licencia_transito', label: 'Licencia de tránsito (Tarjeta de propiedad)', icon: IdCard },
];

function documentUrl(path: string): string {
    return path.startsWith('/storage/') ? path : `/storage/${path}`;
}

function DocumentoUploader({
    fieldKey,
    label,
    icon: Icon,
    files,
    existentes,
    disabled,
    onChange,
    error,
}: {
    fieldKey: DocumentKey;
    label: string;
    icon: typeof ShieldCheck;
    files: File[];
    existentes: DocumentInfo[];
    disabled?: boolean;
    onChange: (files: File[]) => void;
    error?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = (nuevos: FileList | null) => {
        if (!nuevos || nuevos.length === 0) return;
        onChange([...files, ...Array.from(nuevos)]);
        if (inputRef.current) inputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        onChange(files.filter((_, i) => i !== index));
    };

    return (
        <div className="grid gap-2 rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <Label className="text-sm font-medium">{label}</Label>
            </div>

            {existentes.length > 0 && (
                <ul className="grid gap-1 text-sm">
                    {existentes.map((documento, index) => (
                        <li key={`${fieldKey}-existente-${index}`}>
                            <a
                                href={documentUrl(documento.path)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-primary underline underline-offset-4"
                            >
                                <Download className="size-3.5" />
                                {documento.path.split('/').pop()}
                            </a>
                        </li>
                    ))}
                </ul>
            )}

            {files.length > 0 && (
                <ul className="grid gap-1 text-sm">
                    {files.map((file, index) => (
                        <li key={`${fieldKey}-nuevo-${index}`} className="flex items-center justify-between gap-2 text-muted-foreground">
                            <span className="truncate">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-red-600 hover:text-red-700"
                                aria-label={`Quitar ${file.name}`}
                            >
                                <X className="size-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
                disabled={disabled}
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-input px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-emerald-300 hover:text-foreground disabled:opacity-50"
            >
                <Plus className="size-3.5" />
                Agregar archivo(s)
            </button>

            <InputError message={error} />
        </div>
    );
}

export function VehiculoFormFields({ data, setData, errors, processing, readonlyPlaca, existingDocumentos }: VehiculoFormFieldsProps) {
    const imagenInputRef = useRef<HTMLInputElement>(null);
    const [previewImagen, setPreviewImagen] = useState<string | null>(null);

    const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreviewImagen(URL.createObjectURL(file));
            setData('imagen', file);
        }
        if (imagenInputRef.current) imagenInputRef.current.value = '';
    };

    return (
        <div className="grid gap-6">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Truck className="size-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Información del camión</p>
                        <p className="text-xs text-muted-foreground">Datos básicos del vehículo</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8">
                    <div className="order-2 grid gap-4 lg:order-1">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="placa">Placa</Label>
                                {readonlyPlaca ? (
                                    <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                                        {data.placa}
                                    </div>
                                ) : (
                                    <Input
                                        id="placa"
                                        value={data.placa}
                                        onChange={(e) => setData('placa', e.target.value.toUpperCase())}
                                        disabled={processing}
                                        required
                                        autoFocus
                                    />
                                )}
                                <InputError message={errors.placa} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="truck_type">Truck type</Label>
                                <Input
                                    id="truck_type"
                                    value={data.truck_type}
                                    onChange={(e) => setData('truck_type', e.target.value)}
                                    disabled={processing}
                                />
                                <InputError message={errors.truck_type} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="modelo">Modelo</Label>
                                <Input id="modelo" value={data.modelo} onChange={(e) => setData('modelo', e.target.value)} disabled={processing} />
                                <InputError message={errors.modelo} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="capacidad_pallets">Capacidad de pallets</Label>
                                <Input
                                    id="capacidad_pallets"
                                    type="number"
                                    min={0}
                                    value={data.capacidad_pallets}
                                    onChange={(e) => setData('capacidad_pallets', e.target.value)}
                                    disabled={processing}
                                />
                                <InputError message={errors.capacidad_pallets} />
                            </div>
                        </div>

                        <label className="flex w-fit items-center gap-2 text-sm">
                            <Checkbox
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked === true)}
                                disabled={processing}
                            />
                            Vehículo activo
                        </label>
                    </div>

                    <div className="order-1 lg:order-2">
                        <div className="lg:sticky lg:top-6">
                            <input ref={imagenInputRef} id="imagen" type="file" accept="image/*" className="hidden" onChange={handleImagenChange} />
                            <div className="mx-auto flex max-w-[220px] flex-col items-center gap-3 lg:mx-0 lg:max-w-none">
                                <button
                                    type="button"
                                    onClick={() => imagenInputRef.current?.click()}
                                    className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/60 transition-colors hover:border-sky-300 dark:border-sky-500/25 dark:bg-sky-500/5"
                                >
                                    {previewImagen ? (
                                        <img src={previewImagen} alt="Foto del camión" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="flex flex-col items-center gap-1.5 text-sky-700/70 dark:text-sky-300/70">
                                            <ImageIcon className="size-6" />
                                            <span className="text-xs font-medium">Subir foto del camión</span>
                                        </span>
                                    )}
                                </button>
                                <InputError message={errors.imagen} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <FileText className="size-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Documentos</p>
                        <p className="text-xs text-muted-foreground">Puedes subir uno o más archivos por documento</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {DOCUMENTO_FIELDS.map((doc) => (
                        <DocumentoUploader
                            key={doc.key}
                            fieldKey={doc.key}
                            label={doc.label}
                            icon={doc.icon}
                            files={data[doc.key] as File[]}
                            existentes={existingDocumentos?.[doc.key] ?? []}
                            disabled={processing}
                            onChange={(files) => setData(doc.key, files)}
                            error={errors[doc.key]}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
