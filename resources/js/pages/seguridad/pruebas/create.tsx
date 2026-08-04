import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { FirmaPad, type FirmaPadHandle } from '@/pages/seguridad/pruebas/firma-pad';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useRef } from 'react';

const breadcrumbsBase: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Pruebas de Alcoholemia', href: '/modules/seguridad/pruebas' },
];

interface ColaboradorOption {
    id: number;
    nombres: string;
    apellidos: string;
    cedula: string;
    turno: string | null;
}

interface DispositivoOption {
    id: number;
    codigo: string;
    valor_min: string;
    valor_max: string;
}

interface PruebaData {
    id: number;
    colaborador_id: number;
    tipo: string;
    es_programacion: boolean;
    programada_en: string | null;
    alcoholimetro_id: number | null;
    resultado: string | null;
    consentimiento_aceptado: boolean;
    evidencia_path: string | null;
    firma_path: string | null;
    observaciones: string | null;
    estado: string;
    colaborador: { id: number; nombres: string; apellidos: string; cedula: string } | null;
    alcoholimetro: { id: number; codigo: string; valor_min: string; valor_max: string } | null;
}

interface PruebaForm {
    colaborador_id: string;
    tipo: string;
    es_programacion: boolean;
    programada_en: string;
    alcoholimetro_id: string;
    resultado: string;
    consentimiento_aceptado: boolean;
    evidencia: File | null;
    evidencias: File[];
    firma: File | null;
    observaciones: string;
    [key: string]: string | boolean | File | File[] | null;
}

const TURNO_LABELS: Record<string, string> = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

export default function CreatePrueba({
    colaboradores,
    dispositivosDisponibles,
    filters,
    prueba,
}: {
    colaboradores: ColaboradorOption[];
    dispositivosDisponibles: DispositivoOption[];
    filters: { turno: string };
    prueba?: PruebaData;
}) {
    const breadcrumbs: BreadcrumbItem[] = prueba
        ? [...breadcrumbsBase, { title: 'Editar prueba', href: `/modules/seguridad/pruebas/${prueba.id}/edit` }]
        : [...breadcrumbsBase, { title: 'Registrar prueba', href: '/modules/seguridad/pruebas/create' }];
    const { data, setData, post, processing, errors, transform } = useForm<PruebaForm>({
        colaborador_id: prueba?.colaborador_id ? String(prueba.colaborador_id) : '',
        tipo: prueba?.tipo ?? 'entrada',
        es_programacion: prueba ? prueba.estado === 'programada' : false,
        programada_en: prueba?.programada_en ? String(prueba.programada_en).slice(0, 16) : '',
        alcoholimetro_id: prueba?.alcoholimetro_id ? String(prueba.alcoholimetro_id) : '',
        resultado: prueba?.resultado ? String(prueba.resultado) : '',
        consentimiento_aceptado: prueba?.consentimiento_aceptado ?? false,
        evidencia: null,
        evidencias: [],
        firma: null,
        observaciones: prueba?.observaciones ?? '',
    });

    const firmaPadRef = useRef<FirmaPadHandle>(null);

    const filtrarPorTurno = (turno: string) => {
        router.get(route('seguridad.pruebas.create'), { turno: turno === 'todos' ? '' : turno }, { preserveState: true, replace: true });
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        const firma = await firmaPadRef.current?.getFile();

        if (prueba) {
            // PHP no parsea el body multipart/form-data en peticiones PUT/PATCH nativas,
            // por eso se envía como POST con el spoofing estándar de Laravel (_method).
            transform((data) => ({ ...data, firma: firma ?? null, _method: 'put' }));
            post(route('seguridad.pruebas.update', prueba.id), { forceFormData: true });
            return;
        }

        transform((data) => ({ ...data, firma: firma ?? null }));
        post(route('seguridad.pruebas.store'), { forceFormData: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={prueba ? 'Editar prueba de alcoholemia' : 'Registrar prueba de alcoholemia'} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <HeadingSmall
                    title={prueba ? 'Editar prueba de alcoholemia' : 'Registrar prueba de alcoholemia'}
                    description={prueba ? 'Modifica los datos de la prueba y guarda los cambios.' : 'Selecciona al colaborador y completa los datos de la prueba.'}
                />

                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    <div className="grid gap-2">
                        <Label>Filtrar colaboradores por turno</Label>
                        <Select value={filters.turno || 'todos'} onValueChange={filtrarPorTurno}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Turno" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los turnos</SelectItem>
                                <SelectItem value="manana">Mañana</SelectItem>
                                <SelectItem value="tarde">Tarde</SelectItem>
                                <SelectItem value="noche">Noche</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="colaborador_id">Colaborador</Label>
                            <Select value={data.colaborador_id} onValueChange={(value) => setData('colaborador_id', value)}>
                                <SelectTrigger id="colaborador_id">
                                    <SelectValue placeholder="Selecciona un colaborador" />
                                </SelectTrigger>
                                <SelectContent>
                                    {colaboradores.map((colaborador) => (
                                        <SelectItem key={colaborador.id} value={String(colaborador.id)}>
                                            {colaborador.nombres} {colaborador.apellidos} — {colaborador.cedula}
                                            {colaborador.turno ? ` (${TURNO_LABELS[colaborador.turno]})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.colaborador_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tipo">Tipo de prueba</Label>
                            <Select value={data.tipo} onValueChange={(value) => setData('tipo', value)}>
                                <SelectTrigger id="tipo">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entrada">Entrada</SelectItem>
                                    <SelectItem value="ruta">Ruta</SelectItem>
                                    <SelectItem value="salida">Salida</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.tipo} />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="es_programacion"
                            checked={data.es_programacion}
                            onCheckedChange={(checked) => setData('es_programacion', checked === true)}
                        />
                        <Label htmlFor="es_programacion" className="font-normal">
                            Programar para más tarde (en vez de registrar el resultado ahora)
                        </Label>
                    </div>

                    {data.es_programacion ? (
                        <div className="grid gap-2">
                            <Label htmlFor="programada_en">Fecha y hora programada</Label>
                            <Input
                                id="programada_en"
                                type="datetime-local"
                                value={data.programada_en}
                                onChange={(e) => setData('programada_en', e.target.value)}
                            />
                            <InputError message={errors.programada_en} />
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="alcoholimetro_id">Dispositivo</Label>
                                    <Select value={data.alcoholimetro_id} onValueChange={(value) => setData('alcoholimetro_id', value)}>
                                        <SelectTrigger id="alcoholimetro_id">
                                            <SelectValue placeholder="Selecciona un dispositivo disponible" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dispositivosDisponibles.map((dispositivo) => (
                                                <SelectItem key={dispositivo.id} value={String(dispositivo.id)}>
                                                    {dispositivo.codigo}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.alcoholimetro_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="resultado">Resultado</Label>
                                    <Input
                                        id="resultado"
                                        type="number"
                                        step="0.001"
                                        value={data.resultado}
                                        onChange={(e) => setData('resultado', e.target.value)}
                                    />
                                    <InputError message={errors.resultado} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="evidencia">Evidencia principal (foto)</Label>
                                <Input id="evidencia" type="file" accept="image/*" onChange={(e) => setData('evidencia', e.target.files?.[0] ?? null)} />
                                <InputError message={errors.evidencia} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="evidencias">Evidencias adicionales (opcional)</Label>
                                <Input
                                    id="evidencias"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setData('evidencias', Array.from(e.target.files ?? []))}
                                />
                                <InputError message={errors.evidencias} />
                            </div>

                            <FirmaPad ref={firmaPadRef} />

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="consentimiento_aceptado"
                                    checked={data.consentimiento_aceptado}
                                    onCheckedChange={(checked) => setData('consentimiento_aceptado', checked === true)}
                                />
                                <Label htmlFor="consentimiento_aceptado" className="font-normal">
                                    El colaborador acepta someterse voluntariamente a la prueba (consentimiento informado)
                                </Label>
                            </div>
                            <InputError message={errors.consentimiento_aceptado} />
                        </>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="observaciones">Observaciones</Label>
                        <textarea
                            id="observaciones"
                            className="border-input bg-background flex min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                            value={data.observaciones}
                            onChange={(e) => setData('observaciones', e.target.value)}
                        />
                        <InputError message={errors.observaciones} />
                    </div>

                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="size-4 animate-spin" />}
                        {data.es_programacion ? (prueba ? 'Actualizar programación' : 'Programar prueba') : (prueba ? 'Actualizar prueba' : 'Registrar prueba')}
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
