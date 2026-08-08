import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type DocumentInfo } from '@/pages/seguridad/colaboradores/colaborador-form-fields';
import { ChevronDown, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { SimpleFileField } from './simple-file-field';

export type DocumentoGrupoItem = { key: string; label: string };

interface DocumentoGrupoProps {
    titulo: string;
    numero: string;
    items: DocumentoGrupoItem[];
    files: Record<string, File[]>;
    existingDocumentos?: Record<string, DocumentInfo[]>;
    onChange: (key: string, files: File[]) => void;
    disabled?: boolean;
    defaultOpen?: boolean;
}

/**
 * Sección colapsable de un grupo de documentos del Paso 4 (4.1 a 4.10 del
 * PDF), con un SimpleFileField por tipo de documento.
 */
export function DocumentoGrupo({ titulo, numero, items, files, existingDocumentos, onChange, disabled, defaultOpen }: DocumentoGrupoProps) {
    const [open, setOpen] = useState(defaultOpen ?? false);

    if (items.length === 0) return null;

    return (
        <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border border-border">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FolderOpen className="size-4 text-muted-foreground" />
                    {numero} {titulo}
                </span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="grid gap-4 border-t border-border px-4 py-4">
                {items.map((item) => (
                    <SimpleFileField
                        key={item.key}
                        label={item.label}
                        files={files[item.key] ?? []}
                        existing={existingDocumentos?.[item.key]}
                        onChange={(newFiles) => onChange(item.key, newFiles)}
                        disabled={disabled}
                    />
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
}
