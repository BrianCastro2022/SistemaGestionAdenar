import HeadingSmall from '@/components/heading-small';
import { SafeImage } from '@/components/safe-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { DOCUMENTO_FIELDS, type DocumentInfo } from '@/pages/flota/vehiculos/vehiculo-form-fields';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Download, FileText, Truck } from 'lucide-react';
import { useState } from 'react';

interface VehiculoDetalle {
    id: number;
    placa: string;
    truck_type: string | null;
    modelo: string | null;
    capacidad_pallets: number | null;
    imagen: string | null;
    is_active: boolean;

    documento_soat: DocumentInfo[];
    documento_rtm: DocumentInfo[];
    documento_codigo_qr: DocumentInfo[];
    documento_licencia_transito: DocumentInfo[];
}

function documentosDe(vehiculo: VehiculoDetalle, key: string): DocumentInfo[] {
    return (vehiculo as unknown as Record<string, DocumentInfo[]>)[key] ?? [];
}

function resolverUrl(path: string): string {
    return path.startsWith('/') ? path : `/storage/${path}`;
}

function esPdf(path: string): boolean {
    return path.toLowerCase().endsWith('.pdf');
}

type DocumentoPreview = { url: string; label: string; esPdf: boolean };

export default function VehiculoShow({ vehiculo }: { vehiculo: VehiculoDetalle }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Flota', href: '/modules/flota' },
        { title: 'Documentación', href: '/modules/flota/vehiculos' },
        { title: vehiculo.placa, href: `/modules/flota/vehiculos/${vehiculo.id}` },
    ];

    const [preview, setPreview] = useState<DocumentoPreview | null>(null);
    const tieneAlgunDocumento = DOCUMENTO_FIELDS.some((doc) => documentosDe(vehiculo, doc.key).length > 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={vehiculo.placa} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        {vehiculo.imagen ? (
                            <SafeImage
                                src={`/storage/${vehiculo.imagen}`}
                                alt={vehiculo.placa}
                                className="h-24 w-32 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="flex h-24 w-32 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Truck className="size-8" />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <HeadingSmall
                                title={vehiculo.placa}
                                description={[vehiculo.truck_type, vehiculo.modelo].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                            />
                            <div className="flex flex-wrap gap-1.5">
                                {vehiculo.capacidad_pallets !== null && (
                                    <Badge variant="secondary">{vehiculo.capacidad_pallets} pallets</Badge>
                                )}
                                <Badge variant={vehiculo.is_active ? 'default' : 'destructive'}>
                                    {vehiculo.is_active ? 'Disponible' : 'No disponible'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={route('flota.vehiculos.edit', vehiculo.id)}>Editar</Link>
                    </Button>
                </div>

                <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <FileText className="size-4" />
                            Documentos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tieneAlgunDocumento ? (
                            <div className="grid gap-5 sm:grid-cols-2">
                                {DOCUMENTO_FIELDS.map((doc) => {
                                    const documentos = documentosDe(vehiculo, doc.key);
                                    if (documentos.length === 0) return null;

                                    return (
                                        <div key={doc.key} className="space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{doc.label}</p>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                {documentos.map((documento, index) => {
                                                    const url = resolverUrl(documento.path);
                                                    const pdf = esPdf(documento.path);
                                                    const label = documento.path.split('/').pop() ?? `Archivo ${index + 1}`;

                                                    return (
                                                        <button
                                                            key={`${doc.key}-${index}`}
                                                            type="button"
                                                            onClick={() => setPreview({ url, label: `${doc.label} — ${label}`, esPdf: pdf })}
                                                            className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4"
                                                        >
                                                            <FileText className="size-3.5" />
                                                            {label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No se han cargado documentos.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
                <DialogContent className="max-h-[90vh] max-w-3xl">
                    <DialogTitle className="flex items-center justify-between gap-4 pr-6">
                        <span className="truncate">{preview?.label}</span>
                        {preview && (
                            <Button variant="outline" size="sm" asChild>
                                <a href={preview.url} target="_blank" rel="noreferrer" download>
                                    <Download className="size-4" />
                                    Descargar
                                </a>
                            </Button>
                        )}
                    </DialogTitle>
                    {preview?.esPdf ? (
                        <iframe src={preview.url} title={preview.label} className="h-[75vh] w-full rounded-md border border-border" />
                    ) : (
                        preview && <img src={preview.url} alt={preview.label} className="max-h-[75vh] w-full rounded-md object-contain" />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
