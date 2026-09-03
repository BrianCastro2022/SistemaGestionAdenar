import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FirmaPad, type FirmaPadHandle } from '../firma-pad';

// ─── Modo edición (create) ────────────────────────────────────────────────────

interface EditProps {
    mode: 'edit';
    nombreEntrega: string;
    onNombreEntrega: (v: string) => void;
    nombreRecibe: string;
    onNombreRecibe: (v: string) => void;
    firmaEntregaRef: React.RefObject<FirmaPadHandle | null>;
    firmaRecibeRef:  React.RefObject<FirmaPadHandle | null>;
    errors?: Record<string, string>;
}

// ─── Modo lectura (show) ──────────────────────────────────────────────────────

interface ReadProps {
    mode: 'read';
    nombreEntrega?: string | null;
    cargoEntrega?:  string | null;
    firmaEntrega?:  string | null;
    nombreRecibe?:  string | null;
    cargoRecibe?:   string | null;
    firmaRecibe?:   string | null;
}

type Props = EditProps | ReadProps;

function FirmaSlot({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{titulo}</p>
            {children}
        </div>
    );
}

function FirmaImagen({ src, nombre, cargo }: { src?: string | null; nombre?: string | null; cargo?: string | null }) {
    return (
        <>
            {(nombre || cargo) && (
                <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{nombre ?? '—'}</p>
                    {cargo && <p className="text-[11px] text-gray-500">{cargo}</p>}
                </div>
            )}
            {src ? (
                <img src={src} alt="Firma"
                    className="h-[150px] w-full max-w-[400px] rounded-md border border-input bg-white object-contain" />
            ) : (
                <div className="flex h-[150px] w-full max-w-[400px] items-center justify-center rounded-md border border-dashed border-input bg-white">
                    <p className="text-xs text-gray-300">Sin firma</p>
                </div>
            )}
        </>
    );
}

export default function SeccionFirmas(props: Props) {
    if (props.mode === 'edit') {
        const { nombreEntrega, onNombreEntrega, nombreRecibe, onNombreRecibe,
                firmaEntregaRef, firmaRecibeRef, errors = {} } = props;
        return (
            <div className="grid gap-8 sm:grid-cols-2">
                <FirmaSlot titulo="Entrega (quien reporta)">
                    <div className="grid gap-1.5">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nombre</Label>
                        <Input value={nombreEntrega} onChange={e => onNombreEntrega(e.target.value)}
                            className="h-9 text-sm" placeholder="Nombre completo..." />
                        {errors['nombre_entrega'] && <p className="text-[11px] text-red-500">{errors['nombre_entrega']}</p>}
                    </div>
                    <FirmaPad ref={firmaEntregaRef} label="Firma (opcional)" fileName="firma_entrega.png" />
                </FirmaSlot>

                <FirmaSlot titulo="Recibe (técnico del taller)">
                    <div className="grid gap-1.5">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nombre del técnico</Label>
                        <Input value={nombreRecibe} onChange={e => onNombreRecibe(e.target.value)}
                            className="h-9 text-sm" placeholder="Nombre completo del técnico externo..." />
                        {errors['nombre_recibe'] && <p className="text-[11px] text-red-500">{errors['nombre_recibe']}</p>}
                    </div>
                    <FirmaPad ref={firmaRecibeRef} label="Firma (opcional)" fileName="firma_recibe.png" />
                </FirmaSlot>
            </div>
        );
    }

    // mode === 'read'
    const { nombreEntrega, cargoEntrega, firmaEntrega, nombreRecibe, cargoRecibe, firmaRecibe } = props;
    return (
        <div className="grid gap-6 sm:grid-cols-2">
            <FirmaSlot titulo="Entrega (quien reporta)">
                <FirmaImagen src={firmaEntrega} nombre={nombreEntrega} cargo={cargoEntrega} />
            </FirmaSlot>
            <FirmaSlot titulo="Recibe (técnico del taller)">
                <FirmaImagen src={firmaRecibe} nombre={nombreRecibe} cargo={cargoRecibe} />
            </FirmaSlot>
        </div>
    );
}
