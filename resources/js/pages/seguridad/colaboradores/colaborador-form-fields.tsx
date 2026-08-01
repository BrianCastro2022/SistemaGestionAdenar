import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ColaboradorFormData {
    cedula: string;
    nombres: string;
    apellidos: string;
    cargo: string;
    turno: string;
    area: string;
    is_active: boolean;
    [key: string]: string | boolean;
}

interface ColaboradorFormFieldsProps {
    data: ColaboradorFormData;
    setData: <K extends keyof ColaboradorFormData>(key: K, value: ColaboradorFormData[K]) => void;
    errors: Partial<Record<keyof ColaboradorFormData, string>>;
    processing: boolean;
}

const TURNOS = [
    { value: 'manana', label: 'Mañana' },
    { value: 'tarde', label: 'Tarde' },
    { value: 'noche', label: 'Noche' },
];

export function ColaboradorFormFields({ data, setData, errors, processing }: ColaboradorFormFieldsProps) {
    return (
        <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="cedula">Cédula</Label>
                    <Input id="cedula" value={data.cedula} onChange={(e) => setData('cedula', e.target.value)} disabled={processing} required autoFocus />
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
        </div>
    );
}
