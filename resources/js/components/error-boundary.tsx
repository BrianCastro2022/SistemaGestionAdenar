import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    retryCount: number;
}

/**
 * ErrorBoundary resiliente que:
 * - Auto-reintenta hasta 2 veces en errores de reconciliación DOM (insertBefore, removeChild, etc.)
 * - Muestra fallback amigable solo cuando los reintentos se agotan.
 * - Nunca expone mensajes técnicos al usuario.
 */
export class ErrorBoundary extends Component<Props, State> {
    private static MAX_AUTO_RETRIES = 2;

    public state: State = {
        hasError: false,
        error: null,
        retryCount: 0,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary atrapó un error no controlado:', error, errorInfo);

        // Errores de reconciliación DOM (insertBefore, removeChild, appendChild)
        // se auto-reintentan porque suelen ser transitorios (Recharts, portales, etc.)
        const isDomReconciliationError =
            error.message?.includes('insertBefore') ||
            error.message?.includes('removeChild') ||
            error.message?.includes('appendChild') ||
            error.message?.includes('not a child');

        if (isDomReconciliationError && this.state.retryCount < ErrorBoundary.MAX_AUTO_RETRIES) {
            // Limpiar cualquier bloqueo de pointer-events y reintentar
            document.body.style.pointerEvents = '';
            setTimeout(() => {
                this.setState((prev) => ({
                    hasError: false,
                    error: null,
                    retryCount: prev.retryCount + 1,
                }));
            }, 100);
        }
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-sidebar-border/50 bg-muted/30 text-center my-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">No se pudo cargar esta sección</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md">
                        Se produjo un error temporal al renderizar este contenido. Haz clic en el botón para volver a cargar.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            document.body.style.pointerEvents = '';
                            this.setState({ hasError: false, error: null, retryCount: 0 });
                        }}
                        className="mt-3 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
                    >
                        Volver a cargar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
