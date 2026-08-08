import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Asignaciones de conductores', href: '/modules/seguridad/asignaciones-conductores' },
];

interface AsignacionRow {
    id: number;
    cedula: string | null;
    cumplimiento: string | null;
    colaborador: { id: number; cedula: string; nombres: string; apellidos: string } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface AsignacionesPaginator {
    data: AsignacionRow[];
    links: PaginationLink[];
}

export default function AsignacionesConductoresIndex({ asignaciones, filters }: { asignaciones: AsignacionesPaginator; filters: { search: string } }) {
    const [search, setSearch] = useState(filters.search);
    const debouncedSearch = useDebouncedValue(search);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        router.get(route('seguridad.asignaciones-conductores.index'), { search: debouncedSearch }, { preserveState: true, replace: true });
    }, [debouncedSearch]);

    const submitFilters: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(route('seguridad.asignaciones-conductores.index'), { search }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asignaciones de conductores" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <HeadingSmall title="Asignaciones de conductores" description="Evalúa y asigna conductores con base en la cédula y criterios de seguridad." />
                    <Button asChild>
                        <Link href={route('seguridad.asignaciones-conductores.create')}>
                            <Plus className="mr-2 size-4" />
                            Nueva evaluación
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submitFilters} className="flex max-w-sm items-center gap-2">
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cédula o nombre..." />
                    <Button type="submit" variant="secondary" size="icon" aria-label="Buscar">
                        <Search className="size-4" />
                    </Button>
                </form>

                <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <table className="min-w-full divide-y divide-border text-sm">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left">Conductor</th>
                                <th className="px-4 py-3 text-left">Cédula</th>
                                <th className="px-4 py-3 text-left">Cumplimiento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {asignaciones.data.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                                        No hay evaluaciones registradas.
                                    </td>
                                </tr>
                            )}
                            {asignaciones.data.map((item) => (
                                <tr key={item.id} className="border-t">
                                    <td className="px-4 py-3">
                                        {item.colaborador ? `${item.colaborador.nombres} ${item.colaborador.apellidos}` : 'Sin colaborador'}
                                    </td>
                                    <td className="px-4 py-3">{item.cedula ?? item.colaborador?.cedula ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={item.cumplimiento === 'Cumple' ? 'default' : 'secondary'}>{item.cumplimiento ?? '—'}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
