import InputError from '@/components/input-error';
import { type DocumentInfo } from '@/pages/seguridad/colaboradores/colaborador-form-fields';
import { FileText, Paperclip, X } from 'lucide-react';
import { useRef } from 'react';

interface SimpleFileFieldProps {
    label?: string;
    files: File[];
    existing?: DocumentInfo[];
    onChange: (files: File[]) => void;
    error?: string;
    disabled?: boolean;
    multiple?: boolean;
}

/**
 * Campo de archivo compacto (lista de nombres + botón agregar/quitar) para
 * documentos sueltos fuera del gestor de dos paneles del Paso 4 (p. ej. el
 * archivo de "tipo de documento" o de EPS/AFP/ARL en el Paso 1).
 */
export function SimpleFileField({ label, files, existing = [], onChange, error, disabled, multiple = true }: SimpleFileFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevos = Array.from(e.target.files ?? []);
        onChange(multiple ? [...files, ...nuevos] : nuevos.slice(0, 1));
        if (inputRef.current) inputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        onChange(files.filter((_, i) => i !== index));
    };

    return (
        <div className="grid gap-1.5">
            {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
            <input ref={inputRef} type="file" multiple={multiple} className="hidden" onChange={handleChange} disabled={disabled} />
            <div className="flex flex-wrap items-center gap-1.5">
                {existing.map((doc, index) => (
                    <span key={`existing-${index}`} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                        <FileText className="size-3" />
                        {doc.path.split('/').pop()}
                    </span>
                ))}
                {files.map((file, index) => (
                    <span key={`new-${index}`} className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <FileText className="size-3" />
                        {file.name}
                        <button type="button" onClick={() => removeFile(index)} disabled={disabled} aria-label={`Quitar ${file.name}`}>
                            <X className="size-3" />
                        </button>
                    </span>
                ))}
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-emerald-300 hover:text-foreground disabled:opacity-50"
                >
                    <Paperclip className="size-3" />
                    Adjuntar archivo
                </button>
            </div>
            {error && <InputError message={error} />}
        </div>
    );
}
