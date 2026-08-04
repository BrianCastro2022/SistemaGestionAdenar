import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { CondicionSaludDialog } from '@/pages/seguridad/colaboradores/condicion-salud-dialog';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { HeartPulse } from 'lucide-react';

interface ColaboradorDetalle {
    id: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    cargo: string | null;
    turno: string | null;
    area: string | null;
    is_active: boolean;
}

interface IndiceRiesgo {
    puntaje: number;
    nivel: 'Bajo' | 'Medio' | 'Alto';
    pruebas_positivas: number;
    salud_mala: number;
    dias_considerados: number;
}

interface PruebaRow {
    id: number;
    tipo: string;
    resultado: string | null;
    es_positivo: boolean;
    estado: string;
    fecha_hora: string;
    alcoholimetro: { codigo: string } | null;
}

interface CondicionRow {
    id: number;
    momento: string;
    estado: string;
    observacion: string | null;
    fecha_hora: string;
}

const NIVEL_VARIANT: Record<IndiceRiesgo['nivel'], 'default' | 'secondary' | 'destructive'> = {
    Bajo: 'default',
    Medio: 'secondary',
    Alto: 'destructive',
};

export default function ColaboradorShow({
    colaborador,
    indiceRiesgo,
    pruebas,
    condicionesSalud,
}: {
    colaborador: ColaboradorDetalle;
    indiceRiesgo: IndiceRiesgo;
    pruebas: PruebaRow[];
    condicionesSalud: CondicionRow[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Seguridad', href: '/modules/seguridad' },
        { title: 'Colaboradores', href: '/modules/seguridad/colaboradores' },
        { title: `${colaborador.nombres} ${colaborador.apellidos}`, href: `/modules/seguridad/colaboradores/${colaborador.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${colaborador.nombres} ${colaborador.apellidos}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <HeadingSmall
                        title={`${colaborador.nombres} ${colaborador.apellidos}`}
                        description={`Cédula ${colaborador.cedula}${colaborador.cargo ? ` · ${colaborador.cargo}` : ''}`}
                    />
                    <CondicionSaludDialog
                        colaboradorId={colaborador.id}
                        trigger={
                            <Button variant="outline">
                                <HeartPulse className="size-4" />
                                Registrar condición de salud
                            </Button>
                        }
                    />
                </div>

                <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Índice de riesgo (últimos {indiceRiesgo.dias_considerados} días)</CardTitle>
                        <Badge variant={NIVEL_VARIANT[indiceRiesgo.nivel]}>{indiceRiesgo.nivel}</Badge>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-sm">
                        Puntaje {indiceRiesgo.puntaje} — {indiceRiesgo.pruebas_positivas} prueba(s) positiva(s), {indiceRiesgo.salud_mala} episodio(s)
                        de salud "Malo".
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                        <h2 className="text-lg font-medium tracking-tight">Pruebas de alcoholemia</h2>
                        <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Resultado</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pruebas.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-muted-foreground py-6 text-center">
                                                Sin pruebas registradas.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {pruebas.map((prueba) => (
                                        <TableRow key={prueba.id}>
                                            <TableCell>{new Date(prueba.fecha_hora).toLocaleString()}</TableCell>
                                            <TableCell className="capitalize">{prueba.tipo}</TableCell>
                                            <TableCell>{prueba.resultado ?? '—'}</TableCell>
                                            <TableCell>
                                                {prueba.estado === 'programada' ? (
                                                    <Badge variant="secondary">Programada</Badge>
                                                ) : (
                                                    <Badge variant={prueba.es_positivo ? 'destructive' : 'default'}>
                                                        {prueba.es_positivo ? 'Positivo' : 'Negativo'}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-lg font-medium tracking-tight">Condiciones de salud</h2>
                        <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Momento</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {condicionesSalud.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-muted-foreground py-6 text-center">
                                                Sin registros de salud.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {condicionesSalud.map((condicion) => (
                                        <TableRow key={condicion.id}>
                                            <TableCell>{new Date(condicion.fecha_hora).toLocaleString()}</TableCell>
                                            <TableCell className="capitalize">{condicion.momento}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        condicion.estado === 'Malo'
                                                            ? 'destructive'
                                                            : condicion.estado === 'Regular'
                                                              ? 'secondary'
                                                              : 'default'
                                                    }
                                                >
                                                    {condicion.estado}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}