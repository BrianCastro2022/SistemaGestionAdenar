import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Glosario', href: '/modules/seguridad/glosario' },
];

interface GlossaryTermDetail {
    id: number;
    nombre: string;
    definicion: string;
    categoria: string;
    pregunta_numero?: string;
    representacion?: string;
    enlaces_de_interes?: string;
    source: 'manual' | 'scraped';
    created_at: string;
    updated_at: string;
}

interface GlossaryShowProps {
    term: GlossaryTermDetail;
}

const SOURCE_LABELS = {
    manual: 'Agregado manualmente',
    scraped: 'Actualizado automáticamente',
};

export default function GlosarioShow({ term }: GlossaryShowProps) {
    return (
        <AppLayout breadcrumbs={[...breadcrumbs, { title: term.nombre, href: '#' }]}>
            <Head title={term.nombre} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={route('seguridad.glosario.index')}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <HeadingSmall title={term.nombre} description={term.categoria} />
                    </div>
                    <Badge variant={term.source === 'manual' ? 'secondary' : 'outline'}>
                        {SOURCE_LABELS[term.source]}
                    </Badge>
                </div>

                <div className="max-w-3xl space-y-6">
                    {term.pregunta_numero && (
                        <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-sm font-medium text-muted-foreground">Número de Pregunta</p>
                            <p className="mt-1 text-lg font-semibold">{term.pregunta_numero}</p>
                        </div>
                    )}

                    <div>
                        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Definición</h3>
                        <p className="whitespace-pre-wrap rounded-lg border border-sidebar-border/70 p-4 text-base leading-relaxed">
                            {term.definicion}
                        </p>
                    </div>

                    {term.representacion && (
                        <div>
                            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Representación</h3>
                            <p className="whitespace-pre-wrap rounded-lg border border-sidebar-border/70 p-4 text-base leading-relaxed">
                                {term.representacion}
                            </p>
                        </div>
                    )}

                    {term.enlaces_de_interes && (
                        <div>
                            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Enlaces de Interés</h3>
                            <Button asChild variant="outline" className="gap-2">
                                <a href={term.enlaces_de_interes} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="size-4" />
                                    Ver enlace
                                </a>
                            </Button>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg bg-muted/30 p-4">
                            <p className="text-xs font-medium text-muted-foreground">Creado</p>
                            <p className="mt-1 text-sm">
                                {format(new Date(term.created_at), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-4">
                            <p className="text-xs font-medium text-muted-foreground">Última actualización</p>
                            <p className="mt-1 text-sm">
                                {format(new Date(term.updated_at), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button asChild>
                            <Link href={route('seguridad.glosario.edit', term.id)}>Editar Término</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={route('seguridad.glosario.index')}>Volver</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

