import { useMemo } from 'react';

export interface GlossaryTerm {
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

interface UseGlossaryTermsOptions {
    search?: string;
    categoria?: string;
}

/**
 * Hook para búsqueda y filtrado de términos del glosario
 * en el lado del cliente (útil para pre-filtrado antes de enviar al servidor)
 */
export function useGlossaryTerms(terms: GlossaryTerm[], options: UseGlossaryTermsOptions = {}) {
    return useMemo(() => {
        let filtered = terms;

        if (options.search) {
            const searchLower = options.search.toLowerCase();
            filtered = filtered.filter(
                (term) =>
                    term.nombre.toLowerCase().includes(searchLower) ||
                    term.definicion.toLowerCase().includes(searchLower)
            );
        }

        if (options.categoria) {
            filtered = filtered.filter((term) => term.categoria === options.categoria);
        }

        return filtered;
    }, [terms, options.search, options.categoria]);
}
