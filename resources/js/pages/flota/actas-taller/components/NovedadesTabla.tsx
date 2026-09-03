import { CheckCircle2 } from 'lucide-react';

const BADGE_PRIORIDAD: Record<string, string> = {
    alta:  'bg-red-500 text-white',
    media: 'bg-amber-500 text-white',
    baja:  'bg-blue-500 text-white',
};

const BADGE_ESTADO: Record<string, string> = {
    pendiente:   'bg-amber-100 text-amber-700',
    en_revision: 'bg-blue-100 text-blue-700',
    solucionado: 'bg-green-700 text-white',
};

const ESTADO_LABEL: Record<string, string> = {
    pendiente:   'Pendiente',
    en_revision: 'En revisión',
    solucionado: 'Solucionado',
};

export interface NovedadRow {
    titulo: string;
    descripcion?: string | null;
    prioridad: string;
    estado: string;
    fecha_reporte?: string | null;
    fecha_solucion?: string | null;
    observacion_solucion?: string | null;
}

export default function NovedadesTabla({ novedades }: { novedades: NovedadRow[] }) {
    if (!novedades.length) return null;

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <th className="w-10 border-b border-r border-gray-200 px-3 py-2.5 text-center text-[11px] font-semibold text-green-700 dark:border-gray-700 dark:text-green-400">#</th>
                        <th className="border-b border-r border-gray-200 px-3 py-2.5 text-left text-[11px] font-semibold text-green-700 dark:border-gray-700 dark:text-green-400">Novedad</th>
                        <th className="w-28 border-b border-r border-gray-200 px-3 py-2.5 text-left text-[11px] font-semibold text-green-700 dark:border-gray-700 dark:text-green-400">Prioridad</th>
                        <th className="w-32 border-b border-r border-gray-200 px-3 py-2.5 text-left text-[11px] font-semibold text-green-700 dark:border-gray-700 dark:text-green-400">Estado</th>
                        <th className="w-32 border-b border-gray-200 px-3 py-2.5 text-left text-[11px] font-semibold text-green-700 dark:border-gray-700 dark:text-green-400">Reporte</th>
                    </tr>
                </thead>
                <tbody>
                    {novedades.map((nov, i) => (
                        <tr key={i} className="align-top [&:not(:last-child)]:border-b [&:not(:last-child)]:border-gray-100 dark:[&:not(:last-child)]:border-gray-800">

                            <td className="border-r border-gray-100 px-3 py-3 text-center align-middle dark:border-gray-800">
                                <span className="text-xs font-bold text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                            </td>

                            <td className="border-r border-gray-100 px-3 py-3 dark:border-gray-800">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{nov.titulo}</p>
                                {nov.descripcion && nov.descripcion !== nov.titulo && (
                                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{nov.descripcion}</p>
                                )}
                                {nov.observacion_solucion && (
                                    <p className="mt-1 text-[11px] italic text-green-700 dark:text-green-400">{nov.observacion_solucion}</p>
                                )}
                            </td>

                            <td className="border-r border-gray-100 px-3 py-3 align-middle dark:border-gray-800">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${BADGE_PRIORIDAD[nov.prioridad] ?? 'bg-gray-200 text-gray-600'}`}>
                                    {nov.prioridad?.toUpperCase()}
                                </span>
                            </td>

                            <td className="border-r border-gray-100 px-3 py-3 align-middle dark:border-gray-800">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${BADGE_ESTADO[nov.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                                    {nov.estado === 'solucionado' && <CheckCircle2 className="size-2.5" />}
                                    {ESTADO_LABEL[nov.estado] ?? nov.estado}
                                </span>
                            </td>

                            <td className="px-3 py-3 align-middle">
                                <span className="text-[11px] text-gray-400">{nov.fecha_reporte ?? '—'}</span>
                                {nov.fecha_solucion && (
                                    <p className="text-[11px] text-green-700 dark:text-green-400">✓ {nov.fecha_solucion}</p>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
