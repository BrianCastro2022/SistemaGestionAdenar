import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { AlertCircle, Bell, Calendar, ChevronRight, Clock, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AlertaItem {
    colaborador_id: number;
    colaborador: string;
    cedula: string;
    cargo: string;
    etapa_key: string;
    etapa_label: string;
    fecha_programada: string;
    tipo: 'hoy' | 'atrasada';
    dias_vencido: number;
    mensaje: string;
}

interface AlertasResponse {
    total: number;
    total_hoy: number;
    total_atrasadas: number;
    alertas: AlertaItem[];
}

export function NotificationsBell() {
    const page = usePage<SharedData>();
    const { auth } = page.props;

    const isAuthorized = auth.isAdmin || auth.roles.includes('Seguridad') || auth.roles.includes('Gente');

    const [data, setData] = useState<AlertasResponse>({
        total: 0,
        total_hoy: 0,
        total_atrasadas: 0,
        alertas: [],
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isAuthorized) return;

        let isMounted = true;
        setLoading(true);

        fetch('/modules/gente/plan-padrinos/alertas-bell', {
            headers: {
                Accept: 'application/json',
            },
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((json: AlertasResponse | null) => {
                if (isMounted && json) {
                    setData(json);
                }
            })
            .catch(() => {})
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isAuthorized, page.url]);

    if (!isAuthorized) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative group h-9 w-9 cursor-pointer text-muted-foreground hover:text-foreground"
                    title="Alertas de Pruebas de Período"
                >
                    <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
                    {data.total > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-extrabold text-white shadow-sm animate-pulse">
                            {data.total > 99 ? '99+' : data.total}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80 md:w-96 p-0 border shadow-lg" align="end">
                {/* Header */}
                <div className="flex flex-col gap-1 border-b bg-muted/40 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                            <Bell className="h-4 w-4 text-amber-600" />
                            Alertas de Pruebas de Período
                        </span>
                        <Badge variant={data.total > 0 ? 'destructive' : 'outline'} className="text-[10px]">
                            {data.total} pendientes
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs">
                        {data.total_atrasadas > 0 && (
                            <span className="inline-flex items-center gap-1 text-red-600 font-semibold dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                                <ShieldAlert className="h-3 w-3" />
                                {data.total_atrasadas} atrasadas
                            </span>
                        )}
                        {data.total_hoy > 0 && (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                                <Clock className="h-3 w-3" />
                                {data.total_hoy} para hoy
                            </span>
                        )}
                        {data.total === 0 && (
                            <span className="text-muted-foreground text-xs">Al día, sin pruebas pendientes para hoy</span>
                        )}
                    </div>
                </div>

                {/* Lista de Alertas */}
                <div className="max-h-80 overflow-y-auto divide-y">
                    {data.alertas.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground">
                            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                            No hay pruebas programadas para hoy ni pruebas atrasadas pendientes.
                        </div>
                    ) : (
                        data.alertas.map((alerta, idx) => (
                            <Link
                                key={`${alerta.colaborador_id}-${alerta.etapa_key}-${idx}`}
                                href="/modules/gente/plan-padrinos"
                                className="flex flex-col gap-1.5 p-3 text-xs hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-col">
                                        <strong className="text-foreground text-sm font-semibold">{alerta.colaborador}</strong>
                                        <span className="text-[11px] text-muted-foreground">
                                            {alerta.cargo} • C.C. {alerta.cedula}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold shrink-0">
                                        {alerta.etapa_label}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    {alerta.tipo === 'atrasada' ? (
                                        <span className="inline-flex items-center gap-1 font-bold text-red-600 dark:text-red-400 text-[11px]">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            Atrasada hace {alerta.dias_vencido} {alerta.dias_vencido === 1 ? 'día' : 'días'} ({alerta.fecha_programada})
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300 text-[11px]">
                                            <Clock className="h-3.5 w-3.5" />
                                            Programada para hoy ({alerta.fecha_programada})
                                        </span>
                                    )}

                                    <span className="text-muted-foreground hover:text-foreground text-[11px] font-medium flex items-center">
                                        Ir <ChevronRight className="h-3 w-3 ml-0.5" />
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-2 text-center bg-muted/20">
                    <Link
                        href="/modules/gente/plan-padrinos"
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 py-1"
                    >
                        Gestionar en Seguimiento de Pruebas
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
