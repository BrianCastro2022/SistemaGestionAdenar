import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { ColaboradorFormData, ColaboradorFormFields } from '@/pages/seguridad/colaboradores/colaborador-form-fields';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Colaboradores', href: '/modules/seguridad/colaboradores' },
    { title: 'Nuevo colaborador', href: '/modules/seguridad/colaboradores/create' },
];

export default function CreateColaborador() {
    const { data, setData, post, processing, errors } = useForm<ColaboradorFormData>({
        cedula: '',
        nombres: '',
        apellidos: '',
        cargo: '',
        turno: 'manana',
        area: '',
        imagen: null,
        documento_cedula: [],
        documento_licencia_conduccion: [],
        documento_carnet_manejo_defensivo: [],
        documento_certificado_manejo_defensivo: [],
        documento_carnet_ingreso_cd: [],
        documento_simit: [],
        documento_examen_medico_ocupacional: [],
        documento_recordatorio_vehiculo_licencia_conduccion: [],
        is_active: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('seguridad.colaboradores.store'), { forceFormData: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nuevo colaborador" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <HeadingSmall title="Nuevo colaborador" description="Registra un colaborador para poder realizarle pruebas de alcoholemia." />

                <form onSubmit={submit} className="w-full min-w-0 space-y-6">
                    <ColaboradorFormFields data={data} setData={setData} errors={errors} processing={processing} />

                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="size-4 animate-spin" />}
                        Crear colaborador
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
