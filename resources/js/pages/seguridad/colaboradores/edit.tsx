import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { ColaboradorFormData, ColaboradorFormFields, DOCUMENTO_FIELDS, DocumentInfo } from '@/pages/seguridad/colaboradores/colaborador-form-fields';
import { type WizardCatalogos } from '@/pages/seguridad/colaboradores/wizard/catalogos';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

type EditableColaborador = {
    id: number;
    user_id: number | null;
    cedula: string;
    nombres: string;
    apellidos: string;
    cargo: string | null;
    turno: string | null;
    area: string | null;

    tipo_documento: string | null;
    tipo_documento_otro_label: string | null;
    expedido_en: string | null;
    sexo: string | null;
    fecha_nacimiento: string | null;
    ciudad_residencia: string | null;
    direccion: string | null;
    estrato: string | null;
    celular_1: string | null;
    celular_2: string | null;
    correo: string | null;
    estado_civil: string | null;

    discapacidad: string | null;
    discapacidad_tipo: string | null;
    discapacidad_observaciones: string | null;
    victima_conflicto: string | null;
    victima_conflicto_observaciones: string | null;
    libreta_militar: string | null;
    runt_aplica: string | null;

    eps: string | null;
    eps_otro: string | null;
    afp: string | null;
    afp_otro: string | null;
    arl: string | null;
    arl_otro: string | null;

    sena_especialidad: string | null;
    sena_numero_grupo: number | null;
    sena_institucion: string | null;
    sena_nit: string | null;
    sena_centro_formacion: string | null;

    ha_trabajado_antes: string | null;
    cargo_anterior: string | null;
    fecha_ultima_laboral: string | null;

    tiene_experiencia: string | null;
    area_experiencia: string | null;
    cargo_experiencia: string | null;
    anios_experiencia: number | null;
    manejo_defensivo_aplica: string | null;
    conduccion_carga_pesada_aplica: string | null;
    experiencia_terreno_plano: string | null;
    experiencia_terreno_montanoso: string | null;

    centro: string | null;
    centro_trabajo: string | null;
    fecha_ingreso_empresa: string | null;
    fecha_retiro_empresa: string | null;
    motivo_retiro: string | null;
    tipo_contrato: string | null;
    contrato_fecha_desde: string | null;
    contrato_fecha_hasta: string | null;
    vacaciones_aplica: string | null;
    vacaciones_fecha_desde: string | null;
    vacaciones_fecha_hasta: string | null;
    vacaciones_pagadas_fecha_desde: string | null;
    vacaciones_pagadas_fecha_hasta: string | null;

    es_padrino: string | null;
    tipo_padrino: string | null;

    codigo_qr_skap: string | null;
    is_active: boolean;

    [key: string]: string | number | boolean | null | DocumentInfo[];
};

type HistorialCargo = { id: number; cargo: string; fecha_inicio: string; fecha_fin: string | null; estado: 'ACTIVO' | 'INACTIVO' };

export default function EditColaborador({
    colaborador,
    usuarios,
    catalogos,
    historialCargos,
}: {
    colaborador: EditableColaborador;
    usuarios?: { id: number; name: string; identification_number: string }[];
    catalogos: WizardCatalogos;
    historialCargos: HistorialCargo[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Seguridad', href: '/modules/seguridad' },
        { title: 'Colaboradores', href: '/modules/seguridad/colaboradores' },
        { title: `${colaborador.nombres} ${colaborador.apellidos}`, href: `/modules/seguridad/colaboradores/${colaborador.id}/edit` },
    ];

    const archivosIniciales = Object.fromEntries(DOCUMENTO_FIELDS.map((field) => [field.key, [] as File[]]));

    const { data, setData, post, processing, errors, transform } = useForm<ColaboradorFormData>({
        user_id: colaborador.user_id?.toString() ?? '',
        cedula: colaborador.cedula,
        nombres: colaborador.nombres,
        apellidos: colaborador.apellidos,
        cargo: colaborador.cargo ?? '',
        turno: colaborador.turno ?? 'manana',
        area: colaborador.area ?? '',
        imagen: null,

        tipo_documento: colaborador.tipo_documento ?? '',
        tipo_documento_otro_label: colaborador.tipo_documento_otro_label ?? '',
        expedido_en: colaborador.expedido_en ?? '',
        sexo: (colaborador.sexo as ColaboradorFormData['sexo']) ?? '',
        fecha_nacimiento: colaborador.fecha_nacimiento ?? '',
        ciudad_residencia: colaborador.ciudad_residencia ?? '',
        direccion: colaborador.direccion ?? '',
        estrato: colaborador.estrato ?? '',
        celular_1: colaborador.celular_1 ?? '',
        celular_2: colaborador.celular_2 ?? '',
        correo: colaborador.correo ?? '',
        estado_civil: colaborador.estado_civil ?? '',

        discapacidad: (colaborador.discapacidad as ColaboradorFormData['discapacidad']) ?? '',
        discapacidad_tipo: colaborador.discapacidad_tipo ?? '',
        discapacidad_observaciones: colaborador.discapacidad_observaciones ?? '',
        victima_conflicto: (colaborador.victima_conflicto as ColaboradorFormData['victima_conflicto']) ?? '',
        victima_conflicto_observaciones: colaborador.victima_conflicto_observaciones ?? '',
        libreta_militar: (colaborador.libreta_militar as ColaboradorFormData['libreta_militar']) ?? '',
        runt_aplica: (colaborador.runt_aplica as ColaboradorFormData['runt_aplica']) ?? '',

        eps: colaborador.eps ?? '',
        eps_otro: colaborador.eps_otro ?? '',
        afp: colaborador.afp ?? '',
        afp_otro: colaborador.afp_otro ?? '',
        arl: colaborador.arl ?? 'ARL SURA',
        arl_otro: colaborador.arl_otro ?? '',

        sena_especialidad: colaborador.sena_especialidad ?? '',
        sena_numero_grupo: colaborador.sena_numero_grupo?.toString() ?? '',
        sena_institucion: colaborador.sena_institucion ?? '',
        sena_nit: colaborador.sena_nit ?? '',
        sena_centro_formacion: colaborador.sena_centro_formacion ?? '',

        ha_trabajado_antes: (colaborador.ha_trabajado_antes as ColaboradorFormData['ha_trabajado_antes']) ?? '',
        cargo_anterior: colaborador.cargo_anterior ?? '',
        fecha_ultima_laboral: colaborador.fecha_ultima_laboral ?? '',

        tiene_experiencia: (colaborador.tiene_experiencia as ColaboradorFormData['tiene_experiencia']) ?? '',
        area_experiencia: colaborador.area_experiencia ?? '',
        cargo_experiencia: colaborador.cargo_experiencia ?? '',
        anios_experiencia: colaborador.anios_experiencia?.toString() ?? '',
        manejo_defensivo_aplica: (colaborador.manejo_defensivo_aplica as ColaboradorFormData['manejo_defensivo_aplica']) ?? '',
        conduccion_carga_pesada_aplica: (colaborador.conduccion_carga_pesada_aplica as ColaboradorFormData['conduccion_carga_pesada_aplica']) ?? '',
        experiencia_terreno_plano: (colaborador.experiencia_terreno_plano as ColaboradorFormData['experiencia_terreno_plano']) ?? '',
        experiencia_terreno_montanoso: (colaborador.experiencia_terreno_montanoso as ColaboradorFormData['experiencia_terreno_montanoso']) ?? '',

        cargo_fecha_inicio: '',
        centro: colaborador.centro ?? '',
        centro_trabajo: colaborador.centro_trabajo ?? '',
        fecha_ingreso_empresa: colaborador.fecha_ingreso_empresa ?? '',
        fecha_retiro_empresa: colaborador.fecha_retiro_empresa ?? '',
        motivo_retiro: colaborador.motivo_retiro ?? '',
        tipo_contrato: colaborador.tipo_contrato ?? '',
        contrato_fecha_desde: colaborador.contrato_fecha_desde ?? '',
        contrato_fecha_hasta: colaborador.contrato_fecha_hasta ?? '',
        vacaciones_aplica: (colaborador.vacaciones_aplica as ColaboradorFormData['vacaciones_aplica']) ?? '',
        vacaciones_fecha_desde: colaborador.vacaciones_fecha_desde ?? '',
        vacaciones_fecha_hasta: colaborador.vacaciones_fecha_hasta ?? '',
        vacaciones_pagadas_fecha_desde: colaborador.vacaciones_pagadas_fecha_desde ?? '',
        vacaciones_pagadas_fecha_hasta: colaborador.vacaciones_pagadas_fecha_hasta ?? '',

        es_padrino: (colaborador.es_padrino as ColaboradorFormData['es_padrino']) ?? '',
        tipo_padrino: (colaborador.tipo_padrino as ColaboradorFormData['tipo_padrino']) ?? '',
        licencia_conduccion_categorias: [],

        codigo_qr_skap: colaborador.codigo_qr_skap ?? '',

        ...archivosIniciales,

        is_active: colaborador.is_active,
    } as unknown as ColaboradorFormData);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((formData) => ({ ...formData, _method: 'PUT' }));
        post(route('seguridad.colaboradores.update', colaborador.id), { forceFormData: true });
    };

    const existingDocumentos = Object.fromEntries(DOCUMENTO_FIELDS.map((field) => [field.key, (colaborador[field.key] as DocumentInfo[]) ?? []]));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Editar colaborador" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <HeadingSmall title="Editar colaborador" description="Actualiza los datos del colaborador." />

                <form onSubmit={submit} className="w-full min-w-0 space-y-6">
                    <ColaboradorFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        readonlyCedula
                        usuarios={usuarios}
                        catalogos={catalogos}
                        historialCargos={historialCargos}
                        existingDocumentos={existingDocumentos}
                    />

                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="size-4 animate-spin" />}
                        Guardar cambios
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
