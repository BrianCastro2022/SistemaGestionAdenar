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
    imagen: File | null;
    documento_cedula: File | null;
    documento_licencia_conduccion: File | null;
    documento_carnet_manejo_defensivo: File | null;
    documento_certificado_manejo_defensivo: File | null;
    documento_carnet_ingreso_cd: File | null;
    documento_simit: File | null;
    documento_examen_medico_ocupacional: File | null;
    documento_recordatorio_vehiculo_licencia_conduccion: File | null;
    is_active: boolean;
    [key: string]: string | boolean | File | null;
}

interface ColaboradorFormFieldsProps {
    data: ColaboradorFormData;
    setData: <K extends keyof ColaboradorFormData>(key: K, value: ColaboradorFormData[K]) => void;
    errors: Partial<Record<keyof ColaboradorFormData, string>>;
    processing: boolean;
    readonlyCedula?: boolean;
    existingDocumentos?: Partial<Record<string, string | null>>;
}

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
                <Input
                    id="imagen"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setData('imagen', e.target.files?.[0] ?? null)}
                    disabled={processing}
                />
                <InputError message={errors.imagen} />
            </div>

            {DOCUMENTO_FIELDS.map((field) => (
                <div className="grid gap-2" key={field.key}>
                    <Label htmlFor={field.key}>{field.label} (PDF o Excel)</Label>
                    {existingDocumentos?.[field.key] && (
                        <a
                            href={`/storage/${existingDocumentos[field.key]}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline underline-offset-4"
                        >
                            Ver documento actual
                        </a>
                    )}
                    <Input
                        id={field.key}
                        type="file"
                        accept=".pdf,.xls,.xlsx"
                        onChange={(e) => setData(field.key, e.target.files?.[0] ?? null)}
                        disabled={processing}
                    />
                    <InputError message={errors[field.key]} />
                </div>
            ))}

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
