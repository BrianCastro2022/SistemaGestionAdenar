import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { ColaboradorFormData, ColaboradorFormFields } from '@/pages/seguridad/colaboradores/colaborador-form-fields';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

interface EditableColaborador {
    id: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    cargo: string | null;
    turno: string | null;
    area: string | null;
    documento_cedula: string | null;
    documento_licencia_conduccion: string | null;
    documento_carnet_manejo_defensivo: string | null;
    documento_certificado_manejo_defensivo: string | null;
    documento_carnet_ingreso_cd: string | null;
    documento_simit: string | null;
    documento_examen_medico_ocupacional: string | null;
    documento_recordatorio_vehiculo_licencia_conduccion: string | null;
    is_active: boolean;
}

export default function EditColaborador({ colaborador }: { colaborador: EditableColaborador }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Seguridad', href: '/modules/seguridad' },
        { title: 'Colaboradores', href: '/modules/seguridad/colaboradores' },
        { title: `${colaborador.nombres} ${colaborador.apellidos}`, href: `/modules/seguridad/colaboradores/${colaborador.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<ColaboradorFormData>({
        cedula: colaborador.cedula,
        nombres: colaborador.nombres,
        apellidos: colaborador.apellidos,
        cargo: colaborador.cargo ?? '',
        turno: colaborador.turno ?? 'manana',
        area: colaborador.area ?? '',
        imagen: null,
        documento_cedula: null,
        documento_licencia_conduccion: null,
        documento_carnet_manejo_defensivo: null,
        documento_certificado_manejo_defensivo: null,
        documento_carnet_ingreso_cd: null,
        documento_simit: null,
        documento_examen_medico_ocupacional: null,
        documento_recordatorio_vehiculo_licencia_conduccion: null,
        is_active: colaborador.is_active,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('seguridad.colaboradores.update', colaborador.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Editar colaborador" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <HeadingSmall title="Editar colaborador" description="Actualiza los datos del colaborador." />

                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    <ColaboradorFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        readonlyCedula
                        existingDocumentos={{
                            documento_cedula: colaborador.documento_cedula,
                            documento_licencia_conduccion: colaborador.documento_licencia_conduccion,
                            documento_carnet_manejo_defensivo: colaborador.documento_carnet_manejo_defensivo,
                            documento_certificado_manejo_defensivo: colaborador.documento_certificado_manejo_defensivo,
                            documento_carnet_ingreso_cd: colaborador.documento_carnet_ingreso_cd,
                            documento_simit: colaborador.documento_simit,
                            documento_examen_medico_ocupacional: colaborador.documento_examen_medico_ocupacional,
                            documento_recordatorio_vehiculo_licencia_conduccion: colaborador.documento_recordatorio_vehiculo_licencia_conduccion,
                        }}
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
