import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Edit2, Plus, Search, Trash2, ExternalLink } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Seguridad', href: '/modules/seguridad' },
    { title: 'Glosario', href: '/modules/seguridad/glosario' },
];

interface GlossaryTerm {
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

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface GlossaryPaginator {
    data: GlossaryTerm[];
    links: PaginationLink[];
}

interface GlossaryPageProps {
    terms: GlossaryPaginator;
    filters: {
        search: string;
        categoria?: string;
    };
    categories: string[];
}

const SOURCE_LABELS = {
    manual: 'Manual',
    scraped: 'Automático',
};

export default function GlosarioIndex({ terms, filters, categories }: GlossaryPageProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.categoria || '');

    const submitFilters: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            route('seguridad.glosario.index'),
            {
                search,
                ...(selectedCategory && { categoria: selectedCategory }),
            },
            { preserveState: true, replace: true }
        );
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar este término?')) {
            router.delete(route('seguridad.glosario.destroy', id), { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Glosario de Términos" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <HeadingSmall
                        title="Glosario de Términos"
                        description="Consulta y administra términos de revisión del camino de rutas. Los términos se actualizan automáticamente desde fuentes web configuradas."
                    />
                    <Button asChild>
                        <Link href={route('seguridad.glosario.create')}>
                            <Plus className="mr-2 size-4" />
                            Nuevo Término
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submitFilters} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre o definición..."
                        />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="sm:w-48">
                            <SelectValue placeholder="Todas las categorías" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Todas las categorías</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button type="submit" variant="secondary" size="icon" aria-label="Buscar">
                        <Search className="size-4" />
                    </Button>
                </form>

                <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-48">Término</TableHead>
                                <TableHead className="w-40">Categoría</TableHead>
                                <TableHead className="w-80">Definición</TableHead>
                                <TableHead className="w-20">Fuente</TableHead>
                                <TableHead className="text-right w-24">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {terms.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-muted-foreground py-6 text-center">
                                        No hay términos registrados. {search || selectedCategory ? 'Intenta con otros filtros.' : 'Comienza agregando uno nuevo.'}
                                    </TableCell>
                                </TableRow>
                            )}
                            {terms.data.map((term) => (
                                <TableRow key={term.id}>
                                    <TableCell className="font-medium truncate">{term.nombre}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{term.categoria}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground truncate max-w-xs">{term.definicion}</TableCell>
                                    <TableCell>
                                        <Badge variant={term.source === 'manual' ? 'secondary' : 'outline'}>
                                            {SOURCE_LABELS[term.source]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Editar"
                                            >
                                                <Link href={route('seguridad.glosario.edit', term.id)}>
                                                    <Edit2 className="size-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(term.id)}
                                                aria-label="Eliminar"
                                            >
                                                <Trash2 className="size-4 text-destructive" />
                                            </Button>
                                            {term.enlaces_de_interes && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                    aria-label="Ver enlace"
                                                >
                                                    <a href={term.enlaces_de_interes} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="size-4" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {terms.links.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {terms.links.map((link, index) => (
                            <Button
                                key={index}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                asChild={!!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                            >
                                {link.url ? (
                                    <a href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

