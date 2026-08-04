
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler } from 'react';

>>>>>>> 4240e7eb0610513617beb0531157718f52aa4a15

<<<<<<< HEAD
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Glosario', href: '/modules/seguridad/glosario' },
    { title: 'Nuevo Término', href: '/modules/seguridad/glosario/create' },
];

interface CreateGlossaryPageProps {
    categories: string[];
    term?: {
        id: number;
        nombre: string;
        definicion: string;
        categoria: string;
        pregunta_numero?: string;
        representacion?: string;
        enlaces_de_interes?: string;
    };
}

export default function GlosarioCreate({ categories, term }: CreateGlossaryPageProps) {
    const { data, setData, post, patch, processing, errors } = useForm({
        nombre: term?.nombre || '',
        definicion: term?.definicion || '',
        categoria: term?.categoria || '',
        pregunta_numero: term?.pregunta_numero || '',
        representacion: term?.representacion || '',
        enlaces_de_interes: term?.enlaces_de_interes || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (term) {
            patch(route('seguridad.glosario.update', term.id), {
                onSuccess: () => window.history.back(),
            });
        } else {
            post(route('seguridad.glosario.store'), {
                onSuccess: () => window.history.back(),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={term ? 'Editar Término' : 'Nuevo Término'} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={route('seguridad.glosario.index')}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <HeadingSmall
                        title={term ? 'Editar Término' : 'Nuevo Término'}
                        description={term ? 'Actualiza la información del término.' : 'Agrega un nuevo término al glosario.'}
                    />
                </div>

                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Término *</Label>
                        <Input
                            id="nombre"
                            value={data.nombre}
                            onChange={(e) => setData('nombre', e.target.value)}
                            placeholder="Ej: Señalización horizontal"
                            disabled={processing}
                        />
                        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoria">Categoría *</Label>
                            <Select value={data.categoria} onValueChange={(value) => setData('categoria', value)}>
                                <SelectTrigger id="categoria">
                                    <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.categoria && <p className="text-sm text-destructive">{errors.categoria}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pregunta_numero">Número de Pregunta</Label>
                            <Input
                                id="pregunta_numero"
                                value={data.pregunta_numero}
                                onChange={(e) => setData('pregunta_numero', e.target.value)}
                                placeholder="Ej: 2.1"
                                disabled={processing}
                            />
                            {errors.pregunta_numero && <p className="text-sm text-destructive">{errors.pregunta_numero}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="definicion">Definición *</Label>
                        <Textarea
                            id="definicion"
                            value={data.definicion}
                            onChange={(e) => setData('definicion', e.target.value)}
                            placeholder="Describe en detalle el significado del término..."
                            className="min-h-24"
                            disabled={processing}
                        />
                        {errors.definicion && <p className="text-sm text-destructive">{errors.definicion}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="representacion">Representación</Label>
                        <Textarea
                            id="representacion"
                            value={data.representacion}
                            onChange={(e) => setData('representacion', e.target.value)}
                            placeholder="Cómo se representa visualmente este concepto..."
                            className="min-h-20"
                            disabled={processing}
                        />
                        {errors.representacion && <p className="text-sm text-destructive">{errors.representacion}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="enlaces_de_interes">Enlaces de Interés</Label>
                        <Input
                            id="enlaces_de_interes"
                            value={data.enlaces_de_interes}
                            onChange={(e) => setData('enlaces_de_interes', e.target.value)}
                            placeholder="https://ejemplo.com"
                            disabled={processing}
                            type="url"
                        />
                        {errors.enlaces_de_interes && <p className="text-sm text-destructive">{errors.enlaces_de_interes}</p>}
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Guardar Término'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={route('seguridad.glosario.index')}>Cancelar</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

