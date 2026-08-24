import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Image, Search } from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Flota', href: '/modules/flota' },
    { title: 'Consultas SIMIT', href: '/modules/flota/simit-consultas' },
];

const TODOS = 'todos';

type ConsultaStatus = 'ok' | 'sin_comparendos' | 'captcha' | 'error';
type Vista = 'actual' | 'historico';

const STATUS_LABELS: Record<ConsultaStatus, string> = {
    ok: 'Con comparendos',
    sin_comparendos: 'Sin comparendos',
    captcha: 'Captcha (revisar)',
    error: 'Error de consulta',
};

const STATUS_VARIANTS: Record<ConsultaStatus, 'default' | 'secondary' | 'destructive'> = {
    ok: 'destructive',
    sin_comparendos: 'default',
    captcha: 'secondary',
    error: 'destructive',
};

interface ConsultaRow {
    id: number;
    placa: string;
    fecha_hora: string;
    status: ConsultaStatus;
    raw_text: string | null;
    screenshot_nombre: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ConsultasPaginator {
    data: ConsultaRow[];
    links: PaginationLink[];
    from: number | null;
}

type Filters = {
    search: string;
    status: string;
    fecha_desde: string;
    fecha_hasta: string;
};

function PantallazoButton({ consulta, onVer }: { consulta: ConsultaRow; onVer: (consulta: ConsultaRow) => void }) {
    if (!consulta.screenshot_nombre) {
        return <span className="text-muted-foreground">—</span>;
    }

    return (
        <Button type="button" variant="ghost" size="icon" aria-label="Ver pantallazo" onClick={() => onVer(consulta)}>
            <Image className="size-4" />
        </Button>
    );
}

export default function SimitConsultasIndex({
    consultas,
    actuales,
    filters,
}: {
    consultas: ConsultasPaginator;
    actuales: ConsultaRow[];
    filters: Filters;
}) {
    const [vista, setVista] = useState<Vista>('actual');
    const [search, setSearch] = useState(filters.search);
    const [preview, setPreview] = useState<{ consulta: ConsultaRow; url: string } | null>(null);
    const isFirstRender = useRef(true);

    const verPantallazo = (consulta: ConsultaRow) =>
        setPreview({ consulta, url: route('flota.simit-consultas.screenshot', consulta.id) });

    const applyFilters = (overrides: Partial<Filters>) => {
        router.get(route('flota.simit-consultas.index'), { ...filters, search, ...overrides }, { preserveState: true, replace: true });
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeout = setTimeout(() => applyFilters({ search }), 400);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const submitFilters: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Consultas SIMIT" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <HeadingSmall
                        title="Consultas SIMIT"
                        description="Comparendos por placa, capturados automáticamente cada día."
                    />
                    <div className="flex rounded-md border border-sidebar-border/70 p-1">
                        <Button type="button" variant={vista === 'actual' ? 'default' : 'ghost'} size="sm" onClick={() => setVista('actual')}>
                            Estado actual
                        </Button>
                        <Button type="button" variant={vista === 'historico' ? 'default' : 'ghost'} size="sm" onClick={() => setVista('historico')}>
                            Histórico
                        </Button>
                    </div>
                </div>

                {vista === 'actual' ? (
                    <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Placa</TableHead>
                                    <TableHead>Última consulta</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Pantallazo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {actuales.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-muted-foreground py-6 text-center">
                                            Todavía no hay consultas registradas.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {actuales.map((consulta) => (
                                    <TableRow key={consulta.placa}>
                                        <TableCell className="font-medium">{consulta.placa}</TableCell>
                                        <TableCell>{new Date(consulta.fecha_hora).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={STATUS_VARIANTS[consulta.status]}>{STATUS_LABELS[consulta.status]}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <PantallazoButton consulta={consulta} onVer={verPantallazo} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-end gap-2">
                            <form onSubmit={submitFilters} className="flex max-w-xs items-center gap-2">
                                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por placa..." />
                                <Button type="submit" variant="secondary" size="icon" aria-label="Buscar">
                                    <Search className="size-4" />
                                </Button>
                            </form>

                            <Select value={filters.status || TODOS} onValueChange={(value) => applyFilters({ status: value === TODOS ? '' : value })}>
                                <SelectTrigger className="w-52">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TODOS}>Estado: todos</SelectItem>
                                    {(Object.keys(STATUS_LABELS) as ConsultaStatus[]).map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {STATUS_LABELS[status]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="grid gap-1">
                                <Label className="text-xs text-muted-foreground">Desde</Label>
                                <Input
                                    type="date"
                                    className="w-40"
                                    value={filters.fecha_desde}
                                    onChange={(e) => applyFilters({ fecha_desde: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label className="text-xs text-muted-foreground">Hasta</Label>
                                <Input
                                    type="date"
                                    className="w-40"
                                    value={filters.fecha_hasta}
                                    onChange={(e) => applyFilters({ fecha_hasta: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Placa</TableHead>
                                        <TableHead>Fecha y hora</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Pantallazo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {consultas.data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-muted-foreground py-6 text-center">
                                                No se encontraron consultas.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {consultas.data.map((consulta, index) => (
                                        <TableRow key={consulta.id}>
                                            <TableCell className="text-muted-foreground">{(consultas.from ?? 1) + index}</TableCell>
                                            <TableCell className="font-medium">{consulta.placa}</TableCell>
                                            <TableCell>{new Date(consulta.fecha_hora).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={STATUS_VARIANTS[consulta.status]}>{STATUS_LABELS[consulta.status]}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <PantallazoButton consulta={consulta} onVer={verPantallazo} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {consultas.links.length > 3 && (
                            <div className="flex flex-wrap gap-1">
                                {consultas.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        asChild={!!link.url}
                                    >
                                        {link.url ? (
                                            <Link href={link.url} preserveScroll dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                    <DialogTitle>
                        {preview?.consulta.placa} — {preview && new Date(preview.consulta.fecha_hora).toLocaleString()}
                    </DialogTitle>
                    {preview && (
                        <div className="space-y-4">
                            <img src={preview.url} alt={`Pantallazo SIMIT ${preview.consulta.placa}`} className="w-full rounded-md border border-border" />
                            {preview.consulta.raw_text && (
                                <p className="text-sm whitespace-pre-line text-muted-foreground">{preview.consulta.raw_text}</p>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
