import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    [key: string]: string | File | null;
}

const ESTADOS = ['Disponible', 'En uso', 'En mantenimiento', 'Fuera de servicio'];

interface DispositivoFormFieldsProps {
    data: DispositivoFormData;
    setData: <K extends keyof DispositivoFormData>(key: K, value: DispositivoFormData[K]) => void;
    errors: Partial<Record<keyof DispositivoFormData, string>>;
    processing: boolean;
}

export function DispositivoFormFields({ data, setData, errors, processing }: DispositivoFormFieldsProps) {
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
        </div>
    );
}
