import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useRef, useState } from 'react';

export interface DispositivoFormData {
    codigo: string;
    marca: string;
    modelo: string;
    fecha_calibracion: string;
    fecha_vencimiento_certificado: string;
    documento: File | null;
    valor_min: string;
    valor_max: string;
    estado: string;
    imagenes: File[];
    deleted_imagenes_indices: number[];
    [key: string]: string | File | File[] | number[] | null;
}

const ESTADOS = ['Disponible', 'En uso', 'En mantenimiento', 'Fuera de servicio'];

interface DispositivoFormFieldsProps {
    data: DispositivoFormData;
    setData: <K extends keyof DispositivoFormData>(key: K, value: DispositivoFormData[K]) => void;
    errors: Partial<Record<keyof DispositivoFormData, string>>;
    processing: boolean;
    savedImagenes?: string[];
}

export function DispositivoFormFields({ data, setData, errors, processing, savedImagenes = [] }: DispositivoFormFieldsProps) {
    const imagenesInputRef = useRef<HTMLInputElement>(null);
    const [filesImagenes, setFilesImagenes] = useState<{ file: File; preview: string }[]>([]);
    const [deletedIndices, setDeletedIndices] = useState<number[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);

    const handleImagenesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files ?? []).map(file => ({ file, preview: URL.createObjectURL(file) }));
        const updated = [...filesImagenes, ...newFiles];
        setFilesImagenes(updated);
        setData('imagenes', updated.map(f => f.file));
        if (imagenesInputRef.current) imagenesInputRef.current.value = '';
    };

    const removeImagen = (index: number) => {
        if (confirm('¿Deseas eliminar esta imagen?')) {
            const updated = filesImagenes.filter((_, i) => i !== index);
            setFilesImagenes(updated);
            setData('imagenes', updated.map(f => f.file));
        }
    };

    const removeSavedImagen = (index: number) => {
        if (deletedIndices.includes(index)) {
            const updated = deletedIndices.filter(i => i !== index);
            setDeletedIndices(updated);
            setData('deleted_imagenes_indices', updated);
        } else {
            setPendingDeleteIndex(index);
            setShowDeleteDialog(true);
        }
    };

    const confirmDeleteImagen = () => {
        if (pendingDeleteIndex !== null) {
            const updated = [...deletedIndices, pendingDeleteIndex];
            setDeletedIndices(updated);
            setData('deleted_imagenes_indices', updated);
        }
        setShowDeleteDialog(false);
        setPendingDeleteIndex(null);
    };

    return (
        <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                    <Label htmlFor="codigo">Código / Serial</Label>
                    <Input id="codigo" value={data.codigo} onChange={(e) => setData('codigo', e.target.value)} disabled={processing} required autoFocus />
                    <InputError message={errors.codigo} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="marca">Marca</Label>
                    <Input id="marca" value={data.marca} onChange={(e) => setData('marca', e.target.value)} disabled={processing} />
                    <InputError message={errors.marca} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input id="modelo" value={data.modelo} onChange={(e) => setData('modelo', e.target.value)} disabled={processing} />
                    <InputError message={errors.modelo} />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="fecha_calibracion">Fecha de calibración</Label>
                    <Input
                        id="fecha_calibracion"
                        type="date"
                        value={data.fecha_calibracion}
                        onChange={(e) => setData('fecha_calibracion', e.target.value)}
                        disabled={processing}
                    />
                    <InputError message={errors.fecha_calibracion} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="fecha_vencimiento_certificado">Vencimiento del certificado</Label>
                    <Input
                        id="fecha_vencimiento_certificado"
                        type="date"
                        value={data.fecha_vencimiento_certificado}
                        onChange={(e) => setData('fecha_vencimiento_certificado', e.target.value)}
                        disabled={processing}
                    />
                    <InputError message={errors.fecha_vencimiento_certificado} />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                    <Label htmlFor="valor_min">Valor mínimo válido</Label>
                    <Input
                        id="valor_min"
                        type="number"
                        step="0.001"
                        value={data.valor_min}
                        onChange={(e) => setData('valor_min', e.target.value)}
                        disabled={processing}
                        required
                    />
                    <InputError message={errors.valor_min} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="valor_max">Valor máximo válido</Label>
                    <Input
                        id="valor_max"
                        type="number"
                        step="0.001"
                        value={data.valor_max}
                        onChange={(e) => setData('valor_max', e.target.value)}
                        disabled={processing}
                        required
                    />
                    <InputError message={errors.valor_max} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={data.estado} onValueChange={(value) => setData('estado', value)} disabled={processing}>
                        <SelectTrigger id="estado">
                            <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                        <SelectContent>
                            {ESTADOS.map((estado) => (
                                <SelectItem key={estado} value={estado}>
                                    {estado}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.estado} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="documento">Documentación (certificado de calibración)</Label>
                <Input
                    id="documento"
                    type="file"
                    onChange={(e) => setData('documento', e.target.files?.[0] ?? null)}
                    disabled={processing}
                />
                <InputError message={errors.documento} />
            </div>

            <div className="grid gap-2">
                <Label>Imágenes del dispositivo (opcional)</Label>
                <input ref={imagenesInputRef} id="imagenes" type="file" accept="image/*" multiple className="hidden" onChange={handleImagenesChange} />
                <InputError message={errors.imagenes} />
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                    {savedImagenes.map((path, index) => (
                        <div
                            key={`saved-${index}`}
                            className={`relative group cursor-pointer transition-opacity ${
                                deletedIndices.includes(index) ? 'opacity-50' : ''
                            }`}
                        >
                            <img
                                src={path}
                                alt={`Imagen guardada ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-green-300 group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                Guardada
                            </div>
                            {savedImagenes.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => removeSavedImagen(index)}
                                    className={`absolute top-1 right-1 rounded-full w-5 h-5 flex items-center justify-center shadow transition-colors ${
                                        deletedIndices.includes(index)
                                            ? 'bg-gray-400 text-white'
                                            : 'bg-red-500 hover:bg-red-600 text-white'
                                    }`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                    {filesImagenes.map((item, index) => (
                        <div key={`new-${index}`} className="relative group cursor-pointer">
                            <img
                                src={item.preview}
                                alt={`Nueva imagen ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-blue-300 group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                Nueva
                            </div>
                            <button
                                type="button"
                                onClick={() => removeImagen(index)}
                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => imagenesInputRef.current?.click()}
                        className="h-24 w-full rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
                    >
                        <span className="text-2xl font-light leading-none">+</span>
                        <span className="text-xs mt-1">Agregar</span>
                    </button>
                </div>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-red-50 border-red-200">
                    <AlertDialogTitle className="text-red-900">Eliminar imagen</AlertDialogTitle>
                    <AlertDialogDescription className="text-red-800">
                        ¿Estás seguro de que deseas eliminar esta imagen del dispositivo? Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                    <div className="flex gap-3 justify-end">
                        <AlertDialogCancel className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteImagen}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
