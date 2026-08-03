import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { LoaderCircle, Search } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Asignaciones de conductores', href: '/modules/seguridad/asignaciones-conductores' },
    { title: 'Nueva evaluación', href: '/modules/seguridad/asignaciones-conductores/create' },
];

interface ColaboradorOption {
    id: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    cargo: string | null;
    area: string | null;
}

interface PositiveTestHistory {
    id: number;
    fecha_hora: string;
    resultado: string;
    tipo: string | null;
}

interface AsignacionConductorFormData {
    colaborador_id: number | null;
    cedula: string;
    experiencia_conduccion_camiones_externa: string;
    experiencia_total_operacion_interna: string;
    tiempo_dos_anos_conductor_externa: string;
    experiencia_terreno_plano: string;
    experiencia_terreno_montañoso: string;
    nivel_skap: string;
    participa_reportes_aci: string;
    historico_accidentes_incidentes: string;
    uso_bebidas_alcoholicas: string;
    uso_cigarrillos: string;
    uso_medicamentos_controlados: string;
    obesidad: string;
    problemas_salud_diagnosticados: string;
    restricciones_resultados_emo: string;
    curso_manejo_defensivo: string;
    certificado_escuela_pilotos: string;
    comparendos: string;
    eventos_criticos_telemetria: string;
    adherencia_checklist_preoperacional: string;
    entrenamiento_rutas_criticas: string;
    prueba_alcohol_positiva_mes: string;
    capacitacion_brigadista: string;
    owd_cumplimiento_prestartas: string;
    entrenamiento_caja_cambios: string;
    entrenamiento_frenos: string;
    entrenamiento_no_neutro: string;
    cumplimiento: string;
    apto_rutas_criticas: string;
    programar_rutas: string;
    rutas_cd: string;
    criticidad_matriz_rutas: string;
    observaciones: string;
}

export default function CreateAsignacionConductor({ colaborador, asignacion, alcoholUsageHint, positiveTests = [] }: { colaborador: ColaboradorOption | null; asignacion?: Record<string, any> | null; alcoholUsageHint?: string | null; positiveTests?: PositiveTestHistory[] }) {
    const [search, setSearch] = useState('');
    const [matchedColaboradores, setMatchedColaboradores] = useState<ColaboradorOption[]>([]);
    const { data, setData, post, processing, errors } = useForm<AsignacionConductorFormData>({
        colaborador_id: colaborador?.id ?? null,
        cedula: colaborador?.cedula ?? '',
        experiencia_conduccion_camiones_externa: asignacion?.experiencia_conduccion_camiones_externa ?? '',
        experiencia_total_operacion_interna: asignacion?.experiencia_total_operacion_interna ?? '',
        tiempo_dos_anos_conductor_externa: asignacion?.tiempo_dos_anos_conductor_externa ?? '',
        experiencia_terreno_plano: asignacion?.experiencia_terreno_plano ?? '',
        experiencia_terreno_montañoso: asignacion?.experiencia_terreno_montañoso ?? '',
        nivel_skap: asignacion?.nivel_skap ?? '',
        participa_reportes_aci: asignacion?.participa_reportes_aci ?? '',
        historico_accidentes_incidentes: asignacion?.historico_accidentes_incidentes ?? '',
        uso_bebidas_alcoholicas: asignacion?.uso_bebidas_alcoholicas ?? alcoholUsageHint ?? '',
        uso_cigarrillos: asignacion?.uso_cigarrillos ?? '',
        uso_medicamentos_controlados: asignacion?.uso_medicamentos_controlados ?? '',
        obesidad: asignacion?.obesidad ?? '',
        problemas_salud_diagnosticados: asignacion?.problemas_salud_diagnosticados ?? '',
        restricciones_resultados_emo: asignacion?.restricciones_resultados_emo ?? '',
        curso_manejo_defensivo: asignacion?.curso_manejo_defensivo ?? '',
        certificado_escuela_pilotos: asignacion?.certificado_escuela_pilotos ?? '',
        comparendos: asignacion?.comparendos ?? '',
        eventos_criticos_telemetria: asignacion?.eventos_criticos_telemetria ?? '',
        adherencia_checklist_preoperacional: asignacion?.adherencia_checklist_preoperacional ?? '',
        entrenamiento_rutas_criticas: asignacion?.entrenamiento_rutas_criticas ?? '',
        prueba_alcohol_positiva_mes: asignacion?.prueba_alcohol_positiva_mes ?? '',
        capacitacion_brigadista: asignacion?.capacitacion_brigadista ?? '',
        owd_cumplimiento_prestartas: asignacion?.owd_cumplimiento_prestartas ?? '',
        entrenamiento_caja_cambios: asignacion?.entrenamiento_caja_cambios ?? '',
        entrenamiento_frenos: asignacion?.entrenamiento_frenos ?? '',
        entrenamiento_no_neutro: asignacion?.entrenamiento_no_neutro ?? '',
        cumplimiento: asignacion?.cumplimiento ?? '',
        apto_rutas_criticas: asignacion?.apto_rutas_criticas ?? '',
        programar_rutas: asignacion?.programar_rutas ?? '',
        rutas_cd: asignacion?.rutas_cd ?? '',
        criticidad_matriz_rutas: asignacion?.criticidad_matriz_rutas ?? '',
        observaciones: asignacion?.observaciones ?? '',
    });

    useEffect(() => {
        if (colaborador) {
            setData('colaborador_id', colaborador.id);
            setData('cedula', colaborador.cedula);
        } else {
            setData('colaborador_id', null);
            setData('cedula', '');
        }
    }, [colaborador]);

    useEffect(() => {
        const term = search.trim().toLowerCase();
        if (!term) {
            setMatchedColaboradores([]);
            return;
        }

        const mockData = [
            ...(colaborador ? [colaborador] : []),
            {
                id: 999,
                cedula: '1002003001',
                nombres: 'Juan',
                apellidos: 'Pérez',
                cargo: 'Conductor',
                area: 'Ruta Norte',
            },
            {
                id: 998,
                cedula: '1002003002',
                nombres: 'María',
                apellidos: 'Gómez',
                cargo: 'Conductor',
                area: 'Ruta Sur',
            },
            {
                id: 997,
                cedula: '1002003003',
                nombres: 'Luis',
                apellidos: 'Torres',
                cargo: 'Conductor',
                area: 'Ruta Este',
            },
        ];

        setMatchedColaboradores(
            mockData.filter((item) => {
                const hayTexto = `${item.nombres} ${item.apellidos} ${item.cedula}`.toLowerCase();
                return hayTexto.includes(term);
            }),
        );
    }, [search, colaborador]);

    const selectedName = useMemo(() => {
        if (!colaborador) {
            return 'Sin colaborador seleccionado';
        }
        return `${colaborador.nombres} ${colaborador.apellidos}`;
    }, [colaborador]);

    const selectColaborador = (item: ColaboradorOption) => {
        setData('colaborador_id', item.id);
        setData('cedula', item.cedula);
        setSearch(`${item.nombres} ${item.apellidos}`);
        setMatchedColaboradores([]);
        router.visit(route('seguridad.asignaciones-conductores.create', { colaborador_id: item.id, cedula: item.cedula }), {
            preserveState: false,
            replace: true,
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('seguridad.asignaciones-conductores.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nueva evaluación de conductor" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <HeadingSmall title="Evaluación de conductor" description="Registra la evaluación de seguridad, rutas y cumplimiento del conductor." />

                <div className="rounded-lg border border-sidebar-border/70 p-4 text-sm">
                    <p className="font-medium">Seleccionar colaborador</p>
                    <p className="text-muted-foreground">Busca por nombre o cédula para cargar el colaborador y continuar con la evaluación.</p>
                    <div className="mt-3 space-y-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Escriba el nombre o la cédula"
                                className="pl-9"
                            />
                        </div>
                        {matchedColaboradores.length > 0 && (
                            <div className="rounded-md border border-sidebar-border/70 bg-background p-2">
                                {matchedColaboradores.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => selectColaborador(item)}
                                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                                    >
                                        <span>
                                            {item.nombres} {item.apellidos}
                                        </span>
                                        <span className="text-muted-foreground">{item.cedula}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="mt-3 rounded-md bg-muted/40 p-3">
                        <p className="font-medium">Colaborador activo</p>
                        <p className="text-muted-foreground">{selectedName} · {data.cedula || 'Sin cédula'}</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="cedula">Cédula</Label>
                            <Input id="cedula" value={data.cedula} onChange={(e) => setData('cedula', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cumplimiento">Cumplimiento</Label>
                            <Select value={data.cumplimiento} onValueChange={(value) => setData('cumplimiento', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cumple">Cumple</SelectItem>
                                    <SelectItem value="No cumple">No cumple</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="experiencia_conduccion_camiones_externa">Experiencia conducción de camiones externa</Label>
                            <Input id="experiencia_conduccion_camiones_externa" value={data.experiencia_conduccion_camiones_externa} onChange={(e) => setData('experiencia_conduccion_camiones_externa', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="experiencia_total_operacion_interna">Experiencia total operación interna</Label>
                            <Input id="experiencia_total_operacion_interna" value={data.experiencia_total_operacion_interna} onChange={(e) => setData('experiencia_total_operacion_interna', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tiempo_dos_anos_conductor_externa">Tiempo 2 años conductor externa</Label>
                            <Input id="tiempo_dos_anos_conductor_externa" value={data.tiempo_dos_anos_conductor_externa} onChange={(e) => setData('tiempo_dos_anos_conductor_externa', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nivel_skap">Nivel SKAP</Label>
                            <Input id="nivel_skap" value={data.nivel_skap} onChange={(e) => setData('nivel_skap', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="experiencia_terreno_plano">Experiencia terreno plano</Label>
                            <Input id="experiencia_terreno_plano" value={data.experiencia_terreno_plano} onChange={(e) => setData('experiencia_terreno_plano', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="experiencia_terreno_montañoso">Experiencia terreno montañoso</Label>
                            <Input id="experiencia_terreno_montañoso" value={data.experiencia_terreno_montañoso} onChange={(e) => setData('experiencia_terreno_montañoso', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="participa_reportes_aci">Participa reportes ACI</Label>
                            <Input id="participa_reportes_aci" value={data.participa_reportes_aci} onChange={(e) => setData('participa_reportes_aci', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="historico_accidentes_incidentes">Histórico accidentes incidentes</Label>
                            <Input id="historico_accidentes_incidentes" value={data.historico_accidentes_incidentes} onChange={(e) => setData('historico_accidentes_incidentes', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="uso_bebidas_alcoholicas">Uso bebidas alcohólicas</Label>
                            <Input id="uso_bebidas_alcoholicas" value={data.uso_bebidas_alcoholicas} onChange={(e) => setData('uso_bebidas_alcoholicas', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="uso_cigarrillos">Uso cigarrillos</Label>
                            <Input id="uso_cigarrillos" value={data.uso_cigarrillos} onChange={(e) => setData('uso_cigarrillos', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="uso_medicamentos_controlados">Uso medicamentos controlados</Label>
                            <Input id="uso_medicamentos_controlados" value={data.uso_medicamentos_controlados} onChange={(e) => setData('uso_medicamentos_controlados', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="obesidad">Obesidad</Label>
                            <Input id="obesidad" value={data.obesidad} onChange={(e) => setData('obesidad', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="problemas_salud_diagnosticados">Problemas de salud diagnosticados</Label>
                            <Input id="problemas_salud_diagnosticados" value={data.problemas_salud_diagnosticados} onChange={(e) => setData('problemas_salud_diagnosticados', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="restricciones_resultados_emo">Restricciones resultados EMO</Label>
                            <Input id="restricciones_resultados_emo" value={data.restricciones_resultados_emo} onChange={(e) => setData('restricciones_resultados_emo', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="curso_manejo_defensivo">Curso manejo defensivo</Label>
                            <Input id="curso_manejo_defensivo" value={data.curso_manejo_defensivo} onChange={(e) => setData('curso_manejo_defensivo', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="certificado_escuela_pilotos">Certificado escuela pilotos</Label>
                            <Input id="certificado_escuela_pilotos" value={data.certificado_escuela_pilotos} onChange={(e) => setData('certificado_escuela_pilotos', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="comparendos">Comparendos</Label>
                            <Input id="comparendos" value={data.comparendos} onChange={(e) => setData('comparendos', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="eventos_criticos_telemetria">Eventos críticos telemetría</Label>
                            <Input id="eventos_criticos_telemetria" value={data.eventos_criticos_telemetria} onChange={(e) => setData('eventos_criticos_telemetria', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adherencia_checklist_preoperacional">Adherencia checklist preoperacional</Label>
                            <Input id="adherencia_checklist_preoperacional" value={data.adherencia_checklist_preoperacional} onChange={(e) => setData('adherencia_checklist_preoperacional', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="entrenamiento_rutas_criticas">Entrenamiento rutas críticas</Label>
                            <Input id="entrenamiento_rutas_criticas" value={data.entrenamiento_rutas_criticas} onChange={(e) => setData('entrenamiento_rutas_criticas', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="prueba_alcohol_positiva_mes">Prueba alcohol positiva mes</Label>
                            <Input id="prueba_alcohol_positiva_mes" value={data.prueba_alcohol_positiva_mes} onChange={(e) => setData('prueba_alcohol_positiva_mes', e.target.value)} />
                            {positiveTests.length > 0 && (
                                <div className="rounded-md border border-border p-3 text-sm">
                                    <p className="font-medium">Fechas con prueba positiva</p>
                                    <ul className="mt-2 space-y-1">
                                        {positiveTests.map((test) => (
                                            <li key={test.id} className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-2 py-2">
                                                <Link href={route('seguridad.pruebas.show', test.id)} className="text-primary underline">
                                                    {test.fecha_hora}
                                                </Link>
                                                <span className="text-muted-foreground">{test.tipo ?? 'Prueba'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacitacion_brigadista">Capacitación brigadista</Label>
                            <Input id="capacitacion_brigadista" value={data.capacitacion_brigadista} onChange={(e) => setData('capacitacion_brigadista', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="owd_cumplimiento_prestartas">OWD cumplimiento prestartas</Label>
                            <Input id="owd_cumplimiento_prestartas" value={data.owd_cumplimiento_prestartas} onChange={(e) => setData('owd_cumplimiento_prestartas', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="entrenamiento_caja_cambios">Entrenamiento caja cambios</Label>
                            <Input id="entrenamiento_caja_cambios" value={data.entrenamiento_caja_cambios} onChange={(e) => setData('entrenamiento_caja_cambios', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="entrenamiento_frenos">Entrenamiento frenos</Label>
                            <Input id="entrenamiento_frenos" value={data.entrenamiento_frenos} onChange={(e) => setData('entrenamiento_frenos', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="entrenamiento_no_neutro">Entrenamiento no neutro</Label>
                            <Input id="entrenamiento_no_neutro" value={data.entrenamiento_no_neutro} onChange={(e) => setData('entrenamiento_no_neutro', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apto_rutas_criticas">Apto rutas críticas</Label>
                            <Input id="apto_rutas_criticas" value={data.apto_rutas_criticas} onChange={(e) => setData('apto_rutas_criticas', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="programar_rutas">Programar rutas</Label>
                            <Input id="programar_rutas" value={data.programar_rutas} onChange={(e) => setData('programar_rutas', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="rutas_cd">Rutas CD</Label>
                            <Input id="rutas_cd" value={data.rutas_cd} onChange={(e) => setData('rutas_cd', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="criticidad_matriz_rutas">Criticidad matriz rutas</Label>
                            <Input id="criticidad_matriz_rutas" value={data.criticidad_matriz_rutas} onChange={(e) => setData('criticidad_matriz_rutas', e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="observaciones">Observaciones</Label>
                        <Textarea id="observaciones" value={data.observaciones} onChange={(e) => setData('observaciones', e.target.value)} />
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                            Guardar evaluación
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.get(route('seguridad.asignaciones-conductores.index'))}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
