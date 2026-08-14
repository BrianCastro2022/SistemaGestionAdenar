import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { type PreguntaCatalogo, type RespuestaValor } from './types';

/**
 * Campo editable de una pregunta del catálogo (RN-02/RN-03/RN-04/RN-05):
 * Sí/No o Aplica/No aplica con un textarea condicional de detalle, o un
 * textarea de texto libre siempre visible.
 */
export function PreguntaCampo({
    numero,
    pregunta,
    respuesta,
    onChange,
    errorValor,
    errorDetalle,
}: {
    numero: number;
    pregunta: PreguntaCatalogo;
    respuesta?: RespuestaValor;
    onChange: (numero: number, respuesta: RespuestaValor) => void;
    errorValor?: string;
    errorDetalle?: string;
}) {
    const valorPorDefecto = pregunta.tipo === 'aplica_detalle' ? 'No aplica' : null;
    const valor = respuesta?.valor ?? valorPorDefecto;
    const detalle = respuesta?.detalle ?? '';

    if (pregunta.tipo === 'texto_libre') {
        return (
            <div className="grid gap-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                <Label className="text-sm font-normal">{pregunta.texto}</Label>
                <textarea
                    className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={detalle}
                    onChange={(e) => onChange(numero, { valor: null, detalle: e.target.value })}
                />
            </div>
        );
    }

    const opciones = pregunta.tipo === 'aplica_detalle' ? ['No aplica', 'Aplica'] : ['Si', 'No'];
    const mostrarDetalle =
        (pregunta.tipo === 'si_no_detalle' && valor === 'Si') || (pregunta.tipo === 'aplica_detalle' && valor === 'Aplica');

    const setValor = (nuevoValor: string) =>
        onChange(numero, { valor: nuevoValor, detalle: nuevoValor === 'Si' || nuevoValor === 'Aplica' ? detalle : '' });

    return (
        <div className="grid gap-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Label className="flex-1 text-sm font-normal">{pregunta.texto}</Label>
                <div className="flex shrink-0 gap-1.5">
                    {opciones.map((opcion) => (
                        <button
                            key={opcion}
                            type="button"
                            data-selected={valor === opcion}
                            onClick={() => setValor(opcion)}
                            className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors data-[selected=true]:border-primary data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                        >
                            {opcion}
                        </button>
                    ))}
                </div>
            </div>
            <InputError message={errorValor} />
            {mostrarDetalle && (
                <div className="grid gap-1">
                    <textarea
                        placeholder="Especifique..."
                        className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={detalle}
                        onChange={(e) => onChange(numero, { valor, detalle: e.target.value })}
                    />
                    <InputError message={errorDetalle} />
                </div>
            )}
        </div>
    );
}
