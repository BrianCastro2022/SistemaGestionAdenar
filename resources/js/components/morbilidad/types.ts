export type TipoPregunta = 'si_no' | 'si_no_detalle' | 'aplica_detalle' | 'texto_libre';

export interface PreguntaCatalogo {
    texto: string;
    tipo: TipoPregunta;
}

export interface SeccionCatalogo {
    titulo: string;
    sensible?: boolean;
    preguntas: Record<number, PreguntaCatalogo>;
}

export type SeccionesCatalogo = Record<number, SeccionCatalogo>;

export interface RespuestaValor {
    valor: string | null;
    detalle: string | null;
    // Índice explícito requerido para que `useForm` (Inertia) acepte este
    // tipo anidado como `FormDataConvertible` — sin esto TS no verifica la
    // constraint genérica correctamente a través de `Record<string, ...>`.
    [key: string]: string | null;
}

/** Claves numéricas serializadas como string — así el objeto satisface el tipo `FormDataConvertible` que exige `useForm`. */
export type RespuestasState = Record<string, RespuestaValor>;

/** Aplana el catálogo a una lista ordenada por número de sección, para recorrerlo en el wizard o en una vista de lectura. */
export function seccionesOrdenadas(secciones: SeccionesCatalogo): Array<{ numero: number } & SeccionCatalogo> {
    return Object.entries(secciones)
        .map(([numero, seccion]) => ({ numero: Number(numero), ...seccion }))
        .sort((a, b) => a.numero - b.numero);
}

/**
 * RN-03/RN-04/RN-05: las preguntas "aplica_detalle" muestran "No aplica"
 * ya seleccionado por defecto. Si no se materializa esa respuesta en el
 * estado del formulario desde el arranque, el botón se ve marcado pero
 * `respuestas` nunca incluye esa pregunta — el envío final la reporta
 * como "sin responder" aunque visualmente esté seleccionada.
 */
export function respuestasConValoresPorDefecto(secciones: SeccionesCatalogo, guardadas: RespuestasState): RespuestasState {
    const resultado: RespuestasState = { ...guardadas };

    Object.values(secciones).forEach((seccion) => {
        Object.entries(seccion.preguntas).forEach(([numero, pregunta]) => {
            if (pregunta.tipo === 'aplica_detalle' && !resultado[numero]) {
                resultado[numero] = { valor: 'No aplica', detalle: null };
            }
        });
    });

    return resultado;
}
