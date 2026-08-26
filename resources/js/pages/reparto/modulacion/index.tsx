import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CheckSquare,
    Eye,
    FileSpreadsheet,
    FileText,
    Filter,
    MapPin,
    Pencil,
    Plus,
    Save,
    Search,
    Trash2,
    Truck,
    UserPlus,
    Users,
} from 'lucide-react';
import React, { useEffect, useId, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

interface ColaboradorOption {
    id: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    nombre_completo: string;
    cargo: string;
}

interface MiembroTripulacion {
    colaborador_id?: number | string;
    cedula: string;
    nombres: string;
    cargo: string;
}

interface Viaje {
    id?: string;
    lugares: string;
    cliente: string;
    peso: string;
}

interface RutaFormState {
    id?: number;
    placa: string;
    cargo: string;
    tripulacion: MiembroTripulacion[];
    viajes: Viaje[];
}

interface ModulacionItemData {
    id: number;
    modulacion_id: number;
    placa: string;
    cargo?: string;
    colaborador_id?: number;
    cedula?: string;
    nombres?: string;
    tripulacion?: MiembroTripulacion[];
    viajes?: Viaje[];
}

interface ModulacionNovedadData {
    id: number;
    modulacion_id: number;
    colaborador_id?: number;
    cedula?: string;
    nombres?: string;
    cargo?: string;
    fijo: boolean;
    permiso: boolean;
    incapacidad: boolean;
    vacaciones: boolean;
}

interface ModulacionData {
    id: number;
    fecha: string;
    ud_programado_por?: string;
    despachado_por_colaborador_id?: number;
    despachado_por_nombre?: string;
    items: ModulacionItemData[];
    novedades: ModulacionNovedadData[];
}

interface Props {
    fecha: string;
    modulacion: ModulacionData | null;
    colaboradores: ColaboradorOption[];
    cargos: string[];
    vehiculos: string[];
    currentUser: string;
    readOnly?: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reparto', href: '/modules/reparto/modulacion' },
    { title: 'Planeación de ruta', href: '/modules/reparto/modulacion' },
];

// Opciones de cliente (0 a 60)
const clienteOptions: number[] = Array.from({ length: 61 }, (_, i) => i);

// Despachador por defecto
const DESPACHADO_POR_DEFECTO = 'Jhon alexander rojas muñoz 10041925516';

// Lista de municipios de Nariño para respaldo inmediato
const NARINO_MUNICIPIOS_FALLBACK = [
    'Pasto',
    'Ipiales',
    'Tumaco',
    'Túquerres',
    'La Unión',
    'Sandoná',
    'Samaniego',
    'El Tambo',
    'Barbacoas',
    'Buesaco',
    'Chachagüí',
    'Consacá',
    'Cumbal',
    'Guaitarilla',
    'Pupiales',
    'San Pablo',
    'Taminango',
    'Albán',
    'Aldana',
    'Ancuyá',
    'Arboleda',
    'Belén',
    'Cuaspud',
    'Córdoba',
    'El Charco',
    'El Peñol',
    'El Rosario',
    'El Tablón de Gómez',
    'Francisco Pizarro',
    'Funes',
    'Guachucal',
    'Gualmatán',
    'Iles',
    'Imués',
    'La Cruz',
    'La Florida',
    'Leiva',
    'Linares',
    'Los Andes',
    'Magüí Payán',
    'Mallama',
    'Mosquera',
    'Nariño',
    'Olaya Herrera',
    'Ospina',
    'Policarpa',
    'Potosí',
    'Providencia',
    'Puerres',
    'Ricaurte',
    'Roberto Payán',
    'San Bernardo',
    'San Lorenzo',
    'San Pedro de Cartago',
    'Santa Bárbara',
    'Santacruz',
    'Sapuyes',
    'Tangua',
    'Yacuanquer',
];

// Generador de IDs con respaldo
const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Componente para seleccionar municipio de Nariño en Lugares Varios
function NarinoMunicipioInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) {
    const baseId = useId();
    const [municipios, setMunicipios] = useState<string[]>(NARINO_MUNICIPIOS_FALLBACK);

    useEffect(() => {
        let cancelado = false;

        const loadMunicipios = async () => {
            try {
                // Intentar obtener la ruta de forma segura
                let deptRoute: string;
                try {
                    deptRoute = route('seguridad.colaboradores.referencias.departamentos');
                } catch (e) {
                    // Si la ruta no existe, usar el fallback
                    console.warn('Ruta de departamentos no disponible, usando municipios por defecto');
                    return;
                }

                const response = await fetch(deptRoute, { headers: { Accept: 'application/json' } });
                const json: { data?: { id: number; nombre: string }[] } = await response.json();
                
                if (cancelado) return;
                
                const narino = (json.data ?? []).find((d) => d.nombre.toLowerCase().includes('nariño'));
                if (narino) {
                    let citiesRoute: string;
                    try {
                        citiesRoute = route('seguridad.colaboradores.referencias.ciudades', { departamento_id: narino.id });
                    } catch (e) {
                        console.warn('Ruta de ciudades no disponible, usando municipios por defecto');
                        return;
                    }

                    const cityResponse = await fetch(citiesRoute, { headers: { Accept: 'application/json' } });
                    const cityJson: { data?: { id: number; nombre: string }[] } = await cityResponse.json();
                    
                    if (!cancelado && cityJson.data && cityJson.data.length > 0) {
                        setMunicipios(cityJson.data.map((c) => c.nombre));
                    }
                }
            } catch (error) {
                // En caso de cualquier error, simplemente usar el fallback
                console.warn('Error al cargar municipios, usando lista por defecto:', error);
            }
        };

        loadMunicipios();

        return () => {
            cancelado = true;
        };
    }, []);

    return (
        <div className="grid grid-cols-2 gap-2">
            <div>
                <Label className="text-[10px] text-gray-500 uppercase font-semibold">Departamento</Label>
                <Input
                    type="text"
                    value="Nariño"
                    readOnly
                    className="h-8 text-xs mt-0.5 bg-gray-100 dark:bg-gray-800 font-medium text-gray-700 dark:text-gray-300"
                />
            </div>
            <div>
                <Label className="text-[10px] text-gray-500 uppercase font-semibold">Municipio / Destino</Label>
                <Input
                    id={`${baseId}-municipio`}
                    list={`${baseId}-municipios-list`}
                    type="text"
                    placeholder="Seleccione o escriba municipio"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8 text-xs mt-0.5 bg-white"
                    autoComplete="off"
                />
                <datalist id={`${baseId}-municipios-list`}>
                    {municipios.map((m) => (
                        <option key={m} value={m} />
                    ))}
                </datalist>
            </div>
        </div>
    );
}

export default function ModulacionIndex({
    fecha: initialFecha,
    modulacion,
    colaboradores = [],
    cargos = [],
    vehiculos = [],
    currentUser,
    readOnly = false,
}: Props) {
    // Modo edición: false por defecto si se llega en modo lectura
    const [isEditing, setIsEditing] = useState(() => !readOnly);
    
    // Sincronizar isEditing cuando cambia readOnly desde las props de Inertia
    useEffect(() => {
        if (readOnly && isEditing) {
            setIsEditing(false);
        }
    }, [readOnly]); // Removí isEditing de las dependencias para evitar loops
    
    // Fecha seleccionada con Calendario
    const [fechaTexto, setFechaTexto] = useState<string>(
        String(modulacion?.fecha ?? initialFecha ?? new Date().toISOString().split('T')[0])
    );

    // UD Programado por
    const [udProgramadoPor, setUdProgramadoPor] = useState<string>(
        String(modulacion?.ud_programado_por ?? currentUser ?? '')
    );

    // Despachado Por (Colaborador) -> Precargado con 'Jhon alexander rojas muñoz 10041925516'
    const [despachadoPorId, setDespachadoPorId] = useState<string>(
        modulacion?.despachado_por_colaborador_id ? String(modulacion.despachado_por_colaborador_id) : ''
    );
    const [despachadoPorNombre, setDespachadoPorNombre] = useState<string>(
        String(modulacion?.despachado_por_nombre || DESPACHADO_POR_DEFECTO)
    );

    useEffect(() => {
        if (modulacion) {
            if (modulacion.fecha) setFechaTexto(String(modulacion.fecha));
            if (modulacion.ud_programado_por) setUdProgramadoPor(String(modulacion.ud_programado_por));
            if (modulacion.despachado_por_colaborador_id)
                setDespachadoPorId(String(modulacion.despachado_por_colaborador_id));
            if (modulacion.despachado_por_nombre) {
                setDespachadoPorNombre(String(modulacion.despachado_por_nombre));
            } else {
                setDespachadoPorNombre(DESPACHADO_POR_DEFECTO);
            }
        }
    }, [modulacion]);

    // Función para cambiar la fecha y consultar los datos pertenecientes a esa fecha
    const handleFechaChange = (newFecha: string) => {
        setFechaTexto(newFecha);
        router.get(
            route('reparto.modulacion.index'),
            { fecha: newFecha },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Crear ruta en blanco
    const createEmptyRoute = (): RutaFormState => ({
        placa: '',
        cargo: '',
        tripulacion: [],
        viajes: [
            { id: generateId(), lugares: '', cliente: '', peso: '' },
            { id: generateId(), lugares: '', cliente: '', peso: '' },
        ],
    });

    const [currentRoute, setCurrentRoute] = useState<RutaFormState>(createEmptyRoute());
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Rutas guardadas en la lista
    const [rutas, setRutas] = useState<RutaFormState[]>(() => {
        if (modulacion?.items && modulacion.items.length > 0) {
            return modulacion.items.map((item) => ({
                id: item.id,
                placa: item.placa,
                cargo: item.cargo ?? '',
                tripulacion: item.tripulacion ?? [],
                viajes: (item.viajes ?? []).map((v, i) => ({ ...v, id: v.id ?? `srv-${item.id}-v${i}` })),
            }));
        }
        return [];
    });

    useEffect(() => {
        if (modulacion?.items) {
            setRutas(
                modulacion.items.map((item) => ({
                    id: item.id,
                    placa: item.placa,
                    cargo: item.cargo ?? '',
                    tripulacion: item.tripulacion ?? [],
                    viajes: (item.viajes ?? []).map((v, i) => ({ ...v, id: v.id ?? `srv-${item.id}-v${i}` })),
                }))
            );
        } else {
            setRutas([]);
        }
    }, [modulacion]);

    // Filtros de la Tabla Planeación de Ruta (Solo Filtro por Placa)
    const [filterTablePlaca, setFilterTablePlaca] = useState<string>('todas');

    // Filtros de búsqueda para el Checklist de tripulación
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [cargoFilter, setCargoFilter] = useState<string>('todos');

    // COLABORADORES FIJOS
    const fijosColaboradorIds = useMemo(() => {
        const ids = new Set<string>();
        if (modulacion?.novedades) {
            modulacion.novedades.forEach((nov) => {
                if (nov.fijo && nov.colaborador_id) {
                    ids.add(String(nov.colaborador_id).trim());
                }
                if (nov.fijo && nov.cedula) {
                    ids.add(`cedula:${String(nov.cedula).trim()}`);
                }
            });
        }
        return ids;
    }, [modulacion?.novedades]);

    // BOTÓN EDITAR EN LA TABLA PLANEACIÓN DE RUTA
    const handleEditRoute = (index: number) => {
        const routeToEdit = rutas[index];
        if (!routeToEdit) return;
        setCurrentRoute({
            id: routeToEdit.id,
            placa: routeToEdit.placa,
            cargo: routeToEdit.cargo ?? '',
            tripulacion: Array.isArray(routeToEdit.tripulacion) ? [...routeToEdit.tripulacion] : [],
            viajes: Array.isArray(routeToEdit.viajes) ? [...routeToEdit.viajes] : [],
        });
        setEditingIndex(index);
        setIsEditing(true); // Activar modo edición automáticamente
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRemoveRutaFromList = (index: number) => {
        const itemToRemove = rutas[index];
        if (itemToRemove?.id) {
            handleDeleteItem(itemToRemove.id);
        } else {
            setRutas(rutas.filter((_, i) => i !== index));
        }
        if (editingIndex === index) {
            setCurrentRoute(createEmptyRoute());
            setEditingIndex(null);
        }
    };

    const handleCurrentRouteFieldChange = (field: keyof RutaFormState, value: any) => {
        setCurrentRoute((prev) => ({ ...prev, [field]: value }));
    };

    // AGREGAR / EDITAR RUTA INDIVIDUALMENTE EN LA LISTA LOCAL
    const handleGuardarRutaLocal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentRoute.placa || currentRoute.placa.trim() === '') {
            alert('Por favor ingrese una Placa para la ruta.');
            return;
        }

        setRutas((prev) => {
            const updated = [...prev];
            if (editingIndex !== null && editingIndex >= 0 && editingIndex < updated.length) {
                updated[editingIndex] = { ...currentRoute };
            } else {
                updated.push({ ...currentRoute });
            }
            return updated;
        });

        setCurrentRoute(createEmptyRoute());
        setEditingIndex(null);
    };

    // OBTENER LISTA DE COLABORADORES ASIGNADOS (EXCLUYENDO LA RUTA ACTUAL EN EDICIÓN)
    const assignedCollaboratorsSet = useMemo(() => {
        const set = new Set<string>();
        rutas.forEach((r, idx) => {
            if (editingIndex !== null && idx === editingIndex) return;
            if (Array.isArray(r.tripulacion)) {
                r.tripulacion.forEach((m) => {
                    if (m.colaborador_id !== undefined && m.colaborador_id !== null && String(m.colaborador_id).trim() !== '') {
                        set.add(`id:${String(m.colaborador_id).trim()}`);
                    }
                    if (m.cedula && String(m.cedula).trim() !== '') {
                        set.add(`cedula:${String(m.cedula).trim()}`);
                    }
                });
            }
        });
        return set;
    }, [rutas, editingIndex]);

    const isCollaboratorAlreadyAssigned = (col: ColaboradorOption) => {
        const colIdStr = String(col.id).trim();
        const colCedStr = col.cedula ? String(col.cedula).trim() : '';

        const isSelectedInCurrent = currentRoute.tripulacion.some(
            (m) =>
                (m.colaborador_id && String(m.colaborador_id).trim() === colIdStr) ||
                (m.cedula && colCedStr !== '' && String(m.cedula).trim() === colCedStr)
        );
        if (isSelectedInCurrent) return false;

        if (fijosColaboradorIds.has(colIdStr) || (colCedStr !== '' && fijosColaboradorIds.has(`cedula:${colCedStr}`))) {
            return false;
        }

        return (
            assignedCollaboratorsSet.has(`id:${colIdStr}`) ||
            (colCedStr !== '' && assignedCollaboratorsSet.has(`cedula:${colCedStr}`))
        );
    };

    // MANEJO DE CHECKLIST DE TRIPULACIÓN
    const handleToggleChecklistMember = (col: ColaboradorOption) => {
        const colIdStr = String(col.id).trim();
        const colCedStr = col.cedula ? String(col.cedula).trim() : '';
        const isFijo = fijosColaboradorIds.has(colIdStr) || (colCedStr !== '' && fijosColaboradorIds.has(`cedula:${colCedStr}`));

        const trip = [...currentRoute.tripulacion];
        const existingIdx = trip.findIndex(
            (m) =>
                (m.colaborador_id && String(m.colaborador_id).trim() === colIdStr) ||
                (m.cedula && colCedStr !== '' && String(m.cedula).trim() === colCedStr)
        );

        if (existingIdx >= 0) {
            if (isFijo) {
                alert(`El colaborador "${col.nombre_completo}" está marcado como FIJO y debe permanecer en todas las rutas.`);
                return;
            }
            trip.splice(existingIdx, 1);
        } else {
            if (isCollaboratorAlreadyAssigned(col)) {
                alert(`El colaborador "${col.nombre_completo}" ya se encuentra asignado a otra ruta para hoy.`);
                return;
            }
            trip.push({
                colaborador_id: col.id,
                cedula: col.cedula || '',
                nombres: col.nombre_completo || '',
                cargo: col.cargo || '',
            });
        }

        setCurrentRoute((prev) => ({ ...prev, tripulacion: trip }));
    };

    // AUTO-AGREGAR COLABORADORES FIJOS
    useEffect(() => {
        if (fijosColaboradorIds.size === 0) return;

        const fijoNovedades = (modulacion?.novedades || []).filter((n) => n.fijo);
        if (fijoNovedades.length === 0) return;

        setCurrentRoute((prev) => {
            let tripUpdated = [...prev.tripulacion];
            let changed = false;

            fijoNovedades.forEach((nov) => {
                const novIdStr = nov.colaborador_id ? String(nov.colaborador_id).trim() : '';
                const novCedStr = nov.cedula ? String(nov.cedula).trim() : '';

                const alreadyIn = tripUpdated.some(
                    (m) =>
                        (novIdStr !== '' && m.colaborador_id && String(m.colaborador_id).trim() === novIdStr) ||
                        (novCedStr !== '' && m.cedula && String(m.cedula).trim() === novCedStr)
                );
                if (!alreadyIn) {
                    const col = colaboradores.find((c) => String(c.id) === String(nov.colaborador_id));
                    tripUpdated.push({
                        colaborador_id: nov.colaborador_id || undefined,
                        cedula: nov.cedula || (col?.cedula || ''),
                        nombres: nov.nombres || (col?.nombre_completo || ''),
                        cargo: nov.cargo || (col?.cargo || ''),
                    });
                    changed = true;
                }
            });

            if (changed) {
                return { ...prev, tripulacion: tripUpdated };
            }
            return prev;
        });
    }, [fijosColaboradorIds, modulacion?.novedades, colaboradores]);

    // MANEJO DE VIAJES DINÁMICOS
    const handleAddViaje = () => {
        setCurrentRoute((prev) => ({
            ...prev,
            viajes: [...prev.viajes, { id: generateId(), lugares: '', cliente: '', peso: '' }],
        }));
    };

    const handleRemoveViaje = (viajeIndex: number) => {
        if (currentRoute.viajes.length <= 1) return;
        setCurrentRoute((prev) => ({
            ...prev,
            viajes: prev.viajes.filter((_, i) => i !== viajeIndex),
        }));
    };

    const handleViajeChange = (viajeIndex: number, field: keyof Viaje, value: string) => {
        const newViajes = [...currentRoute.viajes];
        newViajes[viajeIndex][field] = value;
        setCurrentRoute((prev) => ({ ...prev, viajes: newViajes }));
    };

    // GUARDAR PLANEACIÓN DE RUTA COMPLETA (TODAS LAS RUTAS + NOVEDADES)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleGuardarTodo = () => {
        let finalRutas = [...rutas];

        // Si hay datos escritos actualmente en el formulario de ruta, incluirlos
        if (currentRoute.placa && currentRoute.placa.trim() !== '') {
            if (editingIndex !== null && editingIndex >= 0 && editingIndex < finalRutas.length) {
                finalRutas[editingIndex] = { ...currentRoute };
            } else {
                finalRutas.push({ ...currentRoute });
            }
        }

        // Auto-inyectar colaboradores fijos en TODAS las rutas antes de guardar
        const fijoNovedades = (modulacion?.novedades || []).filter((n) => n.fijo);
        if (fijoNovedades.length > 0) {
            finalRutas = finalRutas.map((ruta) => {
                let tripUpdated = [...(ruta.tripulacion || [])];
                fijoNovedades.forEach((nov) => {
                    const novIdStr = nov.colaborador_id ? String(nov.colaborador_id).trim() : '';
                    const novCedStr = nov.cedula ? String(nov.cedula).trim() : '';

                    const alreadyIn = tripUpdated.some(
                        (m) =>
                            (novIdStr !== '' && m.colaborador_id && String(m.colaborador_id).trim() === novIdStr) ||
                            (novCedStr !== '' && m.cedula && String(m.cedula).trim() === novCedStr)
                    );
                    if (!alreadyIn) {
                        const col = colaboradores.find((c) => String(c.id) === String(nov.colaborador_id));
                        tripUpdated.push({
                            colaborador_id: nov.colaborador_id || undefined,
                            cedula: nov.cedula || (col?.cedula || ''),
                            nombres: nov.nombres || (col?.nombre_completo || ''),
                            cargo: nov.cargo || (col?.cargo || ''),
                        });
                    }
                });
                return { ...ruta, tripulacion: tripUpdated };
            });
        }

        if (finalRutas.length === 0) {
            alert('Por favor ingrese al menos una ruta con Placa antes de guardar la planeación.');
            return;
        }

        setIsSubmitting(true);

        // Preparar novedades actualizadas para enviar en lote
        const novedadesPayload = Object.values(novedadesState).map((nov) => ({
            id: nov.id,
            fijo: Boolean(nov.fijo),
            permiso: Boolean(nov.permiso),
            incapacidad: Boolean(nov.incapacidad),
            vacaciones: Boolean(nov.vacaciones),
        }));

        router.post(
            route('reparto.modulacion.storeBatch'),
            {
                fecha: fechaTexto,
                ud_programado_por: udProgramadoPor,
                despachado_por_colaborador_id: despachadoPorId ? Number(despachadoPorId) : null,
                despachado_por_nombre: despachadoPorNombre,
                rutas: finalRutas as any,
                novedades: novedadesPayload,
            },
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setCurrentRoute(createEmptyRoute());
                    setEditingIndex(null);
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    console.error('Error al guardar planeación:', errs);
                    const msg =
                        errs.rutas ||
                        Object.values(errs)[0] ||
                        'Error al guardar la planeación. Verifique los campos requeridos.';
                    alert(msg);
                },
            }
        );
    };

    // Eliminar ruta
    const handleDeleteItem = (id: number) => {
        if (confirm('¿Está seguro de eliminar esta ruta de la planeación?')) {
            router.delete(route('reparto.modulacion.destroyItem', id), {
                preserveScroll: true,
                preserveState: false,
            });
        }
    };

    // TABLA 2: NOVEDADES Y ASISTENCIA DE COLABORADORES
    const [novedadesState, setNovedadesState] = useState<Record<number, ModulacionNovedadData>>({});

    useEffect(() => {
        if (modulacion?.novedades) {
            const initialMap: Record<number, ModulacionNovedadData> = {};
            modulacion.novedades.forEach((nov) => {
                initialMap[nov.id] = { ...nov };
            });
            setNovedadesState(initialMap);
        }
    }, [modulacion]);

    // FORMULARIO DE INGRESO A TABLA 2
    const [nuevaNovedad, setNuevaNovedad] = useState({
        colaborador_id: '',
        cedula: '',
        nombres: '',
        cargo: '',
        fijo: false,
        permiso: false,
        incapacidad: false,
        vacaciones: false,
    });

    const handleNuevaNovedadSelectColaborador = (val: string) => {
        if (!val) {
            setNuevaNovedad((prev) => ({
                ...prev,
                colaborador_id: '',
                cedula: '',
                nombres: '',
                cargo: '',
            }));
            return;
        }
        const col = colaboradores.find((c) => String(c.id) === val);
        if (col) {
            setNuevaNovedad((prev) => ({
                ...prev,
                colaborador_id: String(col.id),
                cedula: col.cedula || '',
                nombres: col.nombre_completo || '',
                cargo: col.cargo || '',
            }));
        }
    };

    const handleAgregarNovedadTabla2 = () => {
        if (!nuevaNovedad.nombres || nuevaNovedad.nombres.trim() === '') {
            alert('Por favor seleccione un colaborador.');
            return;
        }

        router.post(
            route('reparto.modulacion.storeNovedad'),
            {
                fecha: fechaTexto,
                colaborador_id: nuevaNovedad.colaborador_id ? Number(nuevaNovedad.colaborador_id) : null,
                cedula: nuevaNovedad.cedula,
                nombres: nuevaNovedad.nombres,
                cargo: nuevaNovedad.cargo,
                fijo: nuevaNovedad.fijo,
                permiso: nuevaNovedad.permiso,
                incapacidad: nuevaNovedad.incapacidad,
                vacaciones: nuevaNovedad.vacaciones,
            },
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    setNuevaNovedad({
                        colaborador_id: '',
                        cedula: '',
                        nombres: '',
                        cargo: '',
                        fijo: false,
                        permiso: false,
                        incapacidad: false,
                        vacaciones: false,
                    });
                },
            }
        );
    };

    const handleNovedadChange = (id: number, field: keyof ModulacionNovedadData, value: any) => {
        setNovedadesState((prev) => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value,
            },
        }));
    };

    // handleSaveNovedad eliminado: las novedades se guardan junto con las rutas en "Guardar Planeación de Ruta"


    const handleDeleteNovedad = (id: number) => {
        if (confirm('¿Desea eliminar este colaborador de la tabla de novedades?')) {
            router.delete(route('reparto.modulacion.destroyNovedad', id), {
                preserveScroll: true,
                preserveState: false,
            });
        }
    };

    // SEPARACIÓN Y FILTRADO ESTRICTO DE COLABORADORES
    const { selectedColaboradores, unselectedColaboradores } = useMemo(() => {
        const selected: ColaboradorOption[] = [];
        const unselected: ColaboradorOption[] = [];

        colaboradores.forEach((col) => {
            const colIdStr = String(col.id).trim();
            const colCedStr = col.cedula ? String(col.cedula).trim() : '';

            const isCheckedInCurrent = currentRoute.tripulacion.some(
                (m) =>
                    (m.colaborador_id && String(m.colaborador_id).trim() === colIdStr) ||
                    (m.cedula && colCedStr !== '' && String(m.cedula).trim() === colCedStr)
            );

            if (isCheckedInCurrent) {
                selected.push(col);
                return;
            }

            const matchesCargo = cargoFilter === 'todos' || col.cargo === cargoFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                (col.nombre_completo && col.nombre_completo.toLowerCase().includes(q)) ||
                (col.cedula && col.cedula.includes(q));

            if (!matchesCargo || !matchesSearch) return;

            const isAssignedElsewhere = isCollaboratorAlreadyAssigned(col);

            if (!isAssignedElsewhere) {
                unselected.push(col);
            }
        });

        currentRoute.tripulacion.forEach((m) => {
            const mIdStr = m.colaborador_id ? String(m.colaborador_id).trim() : '';
            const mCedStr = m.cedula ? String(m.cedula).trim() : '';

            const foundInSelected = selected.some(
                (s) =>
                    (mIdStr !== '' && String(s.id).trim() === mIdStr) ||
                    (mCedStr !== '' && s.cedula && String(s.cedula).trim() === mCedStr)
            );
            if (!foundInSelected) {
                selected.push({
                    id: m.colaborador_id ? Number(m.colaborador_id) : -(Math.abs(parseInt(m.cedula || '0', 10)) || 1),
                    cedula: m.cedula || '',
                    nombres: m.nombres || '',
                    apellidos: '',
                    nombre_completo: m.nombres || 'Colaborador',
                    cargo: m.cargo || '',
                });
            }
        });

        return { selectedColaboradores: selected, unselectedColaboradores: unselected };
    }, [colaboradores, cargoFilter, searchQuery, currentRoute.tripulacion, assignedCollaboratorsSet, fijosColaboradorIds]);

    const allChecklistColaboradores = [...selectedColaboradores, ...unselectedColaboradores];

    // LISTA ÚNICA DE PLACAS
    const uniquePlacasInRutas = useMemo(() => {
        const set = new Set<string>();
        rutas.forEach((r) => {
            if (r.placa) set.add(r.placa.toUpperCase());
        });
        return Array.from(set);
    }, [rutas]);

    // RUTAS FILTRADAS EN LA TABLA PLANEACIÓN DE RUTA
    const filteredRutasTable = useMemo(() => {
        return rutas.filter((r) => {
            const matchesPlaca =
                filterTablePlaca === 'todas' || !filterTablePlaca
                    ? true
                    : r.placa.toUpperCase() === filterTablePlaca.toUpperCase();

            return matchesPlaca;
        });
    }, [rutas, filterTablePlaca]);

    // FUNCIÓN PARA EXPORTAR A EXCEL
    const handleExportExcel = () => {
        if (filteredRutasTable.length === 0) {
            alert('No hay rutas para exportar con los filtros seleccionados.');
            return;
        }

        const exportData = filteredRutasTable.map((r, index) => {
            const tripulacionStr = (r.tripulacion || [])
                .map((m) => `${m.nombres} (Cédula: ${m.cedula}${m.cargo ? ' - Cargo: ' + m.cargo : ''})`)
                .join(' | ');

            const viajesStr = (r.viajes || [])
                .map(
                    (v, vIdx) =>
                        `Viaje ${vIdx + 1}: Lugares: Nariño - ${v.lugares || '-'}, Cliente: ${v.cliente || '-'}, Peso: ${v.peso || '-'} ton`
                )
                .join(' | ');

            return {
                '#': index + 1,
                Fecha: fechaTexto,
                'Programado Por': udProgramadoPor || '-',
                'Despachado Por': despachadoPorNombre || '-',
                Placa: r.placa,
                Tripulación: tripulacionStr || '-',
                Viajes: viajesStr || '-',
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Planeación de Ruta');

        const fileName = `Planeacion_Ruta_${fechaTexto || new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Planeación de ruta" />

            <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
                {/* Header título */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Truck className="h-7 w-7 text-red-600" />
                            Planeación de ruta
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {readOnly && (
                            <Link href={route('reparto.modulacion.historial')}>
                                <Button variant="outline" className="text-sm">
                                    ← Volver al historial
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* CARD DE FILTROS — solo en modo edición */}
                <Card className="shadow-sm border bg-white dark:bg-gray-900" style={{ display: isEditing ? 'block' : 'none' }}>
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center justify-between text-gray-700 dark:text-gray-200">
                            <span className="flex items-center gap-2 uppercase tracking-wider text-xs font-bold">
                                <Filter className="h-4 w-4 text-gray-500" />
                                {'Filtros de Fecha y Placa'}
                            </span>
                            <Button
                                type="button"
                                onClick={handleExportExcel}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-3 shadow-sm"
                            >
                                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                                {'Exportar Excel'}
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Selector de Fecha con Calendario */}
                            <div>
                                <Label htmlFor="filtro-fecha" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-red-600" />
                                    {'Fecha de la Planeación (Calendario)'}
                                </Label>
                                <Input
                                    id="filtro-fecha"
                                    type="date"
                                    value={fechaTexto}
                                    onChange={(e) => handleFechaChange(e.target.value)}
                                    className="mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                            </div>

                            {/* Filtro por Placa */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase flex items-center gap-1">
                                    <Filter className="h-3.5 w-3.5 text-gray-400" />
                                    {'Filtro por Placa'}
                                </Label>
                                <select
                                    value={filterTablePlaca}
                                    onChange={(e) => setFilterTablePlaca(e.target.value)}
                                    className="h-10 text-xs mt-1 w-full rounded-md border border-input bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="todas">-- Todas las Placas --</option>
                                    {uniquePlacasInRutas.map((placa) => (
                                        <option key={placa} value={placa}>
                                            {placa}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* fin card filtros */}

                {/* FORMULARIO NUEVA SALIDA — solo en modo edición */}
                <form onSubmit={handleGuardarRutaLocal} className="space-y-6" style={{ display: isEditing ? 'block' : 'none' }}>
                    {/* FORMULARIO DE RUTA UNIFICADO (CARD NUEVA SALIDA) */}
                    <Card className="shadow-sm border-t-4 border-t-red-600 relative">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Badge className="bg-red-600 text-white">
                                    {editingIndex !== null ? `Editando Ruta #${editingIndex + 1}` : 'Nueva Salida'}
                                </Badge>
                                {currentRoute.placa ? <span>{`Placa: ${currentRoute.placa}`}</span> : null}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-4">
                            {/* DATOS GENERALES DE LA SALIDA */}
                            <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/40 space-y-4">
                                <Label className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-300 flex items-center gap-1.5">
                                    <FileText className="h-4 w-4 text-red-600" />
                                    Datos Generales de la Salida
                                </Label>

                                {/* Fila 1: Programado Por, Despachado Por */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="ud_programado_por" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            UD Programado Por
                                        </Label>
                                        <Input
                                            id="ud_programado_por"
                                            type="text"
                                            placeholder="Nombre del usuario programador"
                                            value={udProgramadoPor}
                                            onChange={(e) => setUdProgramadoPor(e.target.value)}
                                            className="mt-1 bg-white dark:bg-gray-800"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="despachado_por" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Despachado Por (Colaborador)
                                        </Label>
                                        <Input
                                            id="despachado_por"
                                            type="text"
                                            value={despachadoPorNombre}
                                            onChange={(e) => setDespachadoPorNombre(e.target.value)}
                                            placeholder="Despachado Por"
                                            className="mt-1 bg-white dark:bg-gray-800 font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Fila 2: Placa */}
                                <div className="pt-2 border-t border-red-100 dark:border-red-900/30">
                                    <div>
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Placa <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                placeholder="Ej: ABC123"
                                                value={currentRoute.placa}
                                                onChange={(e) => handleCurrentRouteFieldChange('placa', e.target.value.toUpperCase())}
                                                className="uppercase font-mono bg-white dark:bg-gray-800 flex-1"
                                            />
                                            {vehiculos.length > 0 && (
                                                <select
                                                    value={vehiculos.includes(currentRoute.placa) ? currentRoute.placa : ''}
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleCurrentRouteFieldChange('placa', e.target.value);
                                                        }
                                                    }}
                                                    className="w-[110px] h-10 rounded-md border border-input bg-white dark:bg-gray-800 px-2 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                >
                                                    <option value="">Flota</option>
                                                    {vehiculos.map((v) => (
                                                        <option key={v} value={String(v)}>
                                                            {String(v)}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN TRIPULACIÓN: CHECKLIST CON FILTRO */}
                            <div className="border rounded-lg p-4 bg-gray-50/70 dark:bg-gray-900/40 space-y-4">
                                <div className="border-b pb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                                        <Users className="h-4 w-4 text-blue-600" />
                                        Tripulación de la Ruta (Solo colaboradores libres para la fecha)
                                    </h3>
                                </div>

                                {/* BARRA DE FILTROS Y BUSCADOR */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-gray-800 p-3 rounded-md border">
                                    <div>
                                        <Label className="text-[11px] font-semibold text-gray-600 uppercase flex items-center gap-1">
                                            <Search className="h-3 w-3 text-gray-400" />
                                            Buscar por Nombre o Cédula
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="Escriba para filtrar colaboradores..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-8 text-xs mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-[11px] font-semibold text-gray-600 uppercase flex items-center gap-1">
                                            <Filter className="h-3 w-3 text-gray-400" />
                                            Filtrar por Cargo
                                        </Label>
                                        <select
                                            value={cargoFilter}
                                            onChange={(e) => setCargoFilter(e.target.value)}
                                            className="h-8 text-xs mt-1 w-full rounded-md border border-input bg-white px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            <option value="todos">-- Todos los Cargos --</option>
                                            {cargos.map((cg) => (
                                                <option key={cg} value={String(cg)}>
                                                    {String(cg)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* CHECKLIST DE COLABORADORES DISPONIBLES */}
                                <div className="bg-white dark:bg-gray-800 rounded-md border p-3 space-y-2 max-h-48 overflow-y-auto">
                                    <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 border-b pb-1">
                                        <CheckSquare className="h-3.5 w-3.5 text-blue-500" />
                                        Marcar colaboradores libres al día para la Tripulación ({allChecklistColaboradores.length} disponibles)
                                    </Label>

                                    {allChecklistColaboradores.length === 0 ? (
                                        <p className="text-xs text-gray-400 py-2 text-center">
                                            No se encontraron colaboradores libres para la fecha seleccionada.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                                            {allChecklistColaboradores.map((col) => {
                                                const colIdStr = String(col.id).trim();
                                                const colCedStr = col.cedula ? String(col.cedula).trim() : '';

                                                const isChecked = currentRoute.tripulacion.some(
                                                    (m) =>
                                                        (m.colaborador_id && String(m.colaborador_id).trim() === colIdStr) ||
                                                        (m.cedula && colCedStr !== '' && String(m.cedula).trim() === colCedStr)
                                                );
                                                const isFijo = fijosColaboradorIds.has(colIdStr) || (colCedStr !== '' && fijosColaboradorIds.has(`cedula:${colCedStr}`));

                                                return (
                                                    <div
                                                        key={`col-item-${col.id ?? col.cedula}`}
                                                        className={`flex items-center space-x-2 p-1.5 rounded border transition-colors ${
                                                            isChecked
                                                                ? isFijo
                                                                    ? 'bg-green-50 border-green-400 ring-1 ring-green-300 dark:bg-green-950/50'
                                                                    : 'bg-blue-50 border-blue-400 ring-1 ring-blue-300 dark:bg-blue-950/50'
                                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                        }`}
                                                    >
                                                        <Checkbox
                                                            id={`check-${col.id}`}
                                                            checked={isChecked}
                                                            disabled={isFijo && isChecked}
                                                            onCheckedChange={() => handleToggleChecklistMember(col)}
                                                        />
                                                        <label
                                                            htmlFor={`check-${col.id}`}
                                                            className="text-xs font-medium cursor-pointer leading-tight truncate flex-1"
                                                        >
                                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                {String(col.nombre_completo ?? '')}
                                                            </span>
                                                            {col.cedula ? (
                                                                <span className="text-[10px] text-gray-500 font-mono block">
                                                                    {'Cédula: ' + String(col.cedula ?? '')}
                                                                </span>
                                                            ) : null}
                                                            {col.cargo ? (
                                                                <span className="text-[10px] text-blue-600 dark:text-blue-400 block truncate">
                                                                    {String(col.cargo ?? '')}
                                                                </span>
                                                            ) : null}
                                                        </label>
                                                        {isFijo && isChecked ? (
                                                            <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-green-600">
                                                                {'FIJO'}
                                                            </Badge>
                                                        ) : isChecked ? (
                                                            <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-blue-600">
                                                                {'Seleccionado'}
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECCIÓN VIAJES DINÁMICOS CON LUGARES DE NARIÑO Y API */}
                            <div className="border rounded-lg p-4 bg-gray-50/70 dark:bg-gray-900/40 space-y-3">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-red-500" />
                                        Viajes de la Ruta (Destinos Nariño, Cliente y Peso por Fila)
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddViaje}
                                        className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Aumentar Más Viajes
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {currentRoute.viajes.map((viaje, vIdx) => (
                                        <div
                                            key={viaje.id ?? `form-viaje-${vIdx}`}
                                            className="p-3 border rounded-md bg-white dark:bg-gray-800 space-y-2 relative shadow-sm"
                                        >
                                            <div className="flex items-center justify-between border-b pb-1">
                                                <span className="text-xs font-bold text-red-600">
                                                    {`Viaje ${vIdx + 1}`}
                                                </span>
                                                {currentRoute.viajes.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveViaje(vIdx)}
                                                        className="text-gray-400 hover:text-red-600 text-xs"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            <NarinoMunicipioInput
                                                value={String(viaje.lugares ?? '')}
                                                onChange={(val) => handleViajeChange(vIdx, 'lugares', val)}
                                            />

                                            <div>
                                                <Label className="text-[10px] text-gray-500 uppercase font-semibold">
                                                    Cliente (0 - 60)
                                                </Label>
                                                <select
                                                    value={String(viaje.cliente ?? '')}
                                                    onChange={(e) => handleViajeChange(vIdx, 'cliente', e.target.value)}
                                                    className="h-8 text-xs mt-0.5 w-full rounded-md border border-input bg-white px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                >
                                                    <option value="">-- Seleccionar --</option>
                                                    {clienteOptions.map((n) => (
                                                        <option key={n} value={String(n)}>
                                                            {String(n)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <Label className="text-[10px] text-gray-500 uppercase font-semibold">
                                                    Peso (Toneladas)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="Ej: 1.5"
                                                    value={String(viaje.peso ?? '')}
                                                    onChange={(e) => handleViajeChange(vIdx, 'peso', e.target.value)}
                                                    className="h-8 text-xs mt-0.5"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* BOTÓN GUARDAR RUTA INDIVIDUAL */}
                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2 font-semibold shadow-sm"
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            {editingIndex !== null ? 'Actualizar Ruta en Lista' : 'Guardar Ruta'}
                        </Button>
                    </div>
                </form>
                {/* fin formulario */}

                {/* 3. TABLA 1: PLANEACIÓN DE RUTA */}
                <Card className="shadow-sm border-t-4 border-t-red-600">
                    <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-red-600" />
                                {'Planeación de Ruta'}
                                {filteredRutasTable.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {String(filteredRutasTable.length)} {'rutas'}
                                    </Badge>
                                )}
                            </CardTitle>
                        </div>

                        {/* METADATOS */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-3 text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-md border">
                                <div>
                                    <span className="font-semibold text-gray-500 uppercase">Fecha:</span>{' '}
                                    <span className="font-bold text-gray-900 dark:text-gray-100">{fechaTexto}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-500 uppercase">Programado Por:</span>{' '}
                                    <span className="font-bold text-gray-900 dark:text-gray-100">{udProgramadoPor || '-'}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-500 uppercase">Despachado Por:</span>{' '}
                                    <span className="font-bold text-gray-900 dark:text-gray-100">{despachadoPorNombre || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-4">
                        {/* TABLA DE RUTAS */}
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                                    <TableRow>
                                        <TableHead className="w-10 text-center">{'#'}</TableHead>
                                        <TableHead className="font-semibold">{'Placa'}</TableHead>
                                        <TableHead className="font-semibold min-w-[260px]">{'Tripulación'}</TableHead>
                                        <TableHead className="font-semibold min-w-[320px]">{'Viajes (Lugar, Cliente, Peso)'}</TableHead>
                                        <TableHead className="text-right font-semibold w-28">{'Acciones'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRutasTable.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                {rutas.length === 0
                                                    ? 'No hay rutas registradas para esta fecha. Complete los campos arriba y presione Guardar Ruta.'
                                                    : 'No hay rutas que coincidan con los filtros aplicados.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRutasTable.map((item, idx) => {
                                            const tripMembers = Array.isArray(item.tripulacion) ? item.tripulacion : [];
                                            const viajesList = Array.isArray(item.viajes) ? item.viajes : [];

                                            return (
                                                <TableRow key={item.id ?? `ruta-${item.placa}-${idx}`} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                                                    <TableCell className="text-center text-xs text-gray-500 font-mono">
                                                        {String(idx + 1)}
                                                    </TableCell>
                                                    <TableCell className="font-semibold font-mono text-sm text-red-600">
                                                        {String(item.placa ?? '')}
                                                    </TableCell>

                                                    {/* TRIPULACIÓN */}
                                                    <TableCell className="text-xs">
                                                        {tripMembers.length > 0 ? (
                                                            <div className="space-y-1.5">
                                                                {tripMembers.map((m, mIdx) => {
                                                                    const memberIsFijo = fijosColaboradorIds.has(String(m.colaborador_id)) || (m.cedula && fijosColaboradorIds.has(`cedula:${m.cedula.trim()}`));
                                                                    return (
                                                                        <div key={`trip-${m.colaborador_id ?? m.cedula}`} className={`p-1.5 rounded border flex items-center justify-between gap-2 ${memberIsFijo ? 'bg-green-50 dark:bg-green-900/30 border-green-300' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                                                            <div className="flex items-center gap-1.5 truncate">
                                                                                <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                                                                                    {String(m.cedula ?? 'S/I')}
                                                                                </Badge>
                                                                                <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                                                    {String(m.nombres ?? 'Sin nombre')}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1 shrink-0">
                                                                                {m.cargo ? (
                                                                                    <span className="text-[10px] text-blue-600 font-medium">
                                                                                        {String(m.cargo)}
                                                                                    </span>
                                                                                ) : null}
                                                                                {memberIsFijo ? (
                                                                                    <Badge className="text-[9px] px-1 py-0 bg-green-600 text-white">FIJO</Badge>
                                                                                ) : null}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">{'-'}</span>
                                                        )}
                                                    </TableCell>

                                                    {/* VIAJES */}
                                                    <TableCell className="text-xs">
                                                        {viajesList.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {viajesList.map((v, vIdx) => (
                                                                    <div key={v.id ?? `viaje-${v.lugares}-${v.cliente}-${vIdx}`} className="p-2 bg-gray-50 dark:bg-gray-800 rounded border space-y-1">
                                                                        <div className="font-bold text-[10px] text-red-600 border-b pb-0.5">
                                                                            {'Viaje ' + String(vIdx + 1)}
                                                                        </div>
                                                                        <div className="text-[11px] text-gray-700 dark:text-gray-300">
                                                                            <span className="font-semibold">{'Lugar: '}</span>
                                                                            {v.lugares ? `Nariño - ${v.lugares}` : '-'}
                                                                        </div>
                                                                        <div className="text-[11px] text-gray-700 dark:text-gray-300">
                                                                            <span className="font-semibold">{'Cliente: '}</span>
                                                                            {String(v.cliente ?? '-')}
                                                                        </div>
                                                                        <div className="text-[11px] text-gray-700 dark:text-gray-300">
                                                                            <span className="font-semibold">{'Peso: '}</span>
                                                                            {v.peso ? `${v.peso} ton` : '-'}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">{'-'}</span>
                                                        )}
                                                    </TableCell>

                                                    {/* ACCIONES */}
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleEditRoute(idx)}
                                                                className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 border-blue-200"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                                                {'Editar'}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveRutaFromList(idx)}
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. TABLA 2: NOVEDADES DE COLABORADORES AGREGADOS — solo en modo edición */}
                <Card className="shadow-sm border-t-2 border-t-blue-600" style={{ display: isEditing ? 'block' : 'none' }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            {'Tabla 2: Novedades de Colaboradores Agregados'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* FORMULARIO SUPERIOR MANUAL */}
                        <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                            <Label className="text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                                <UserPlus className="h-4 w-4 text-blue-600" />
                                {'Ingresar Colaborador a Novedades'}
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                                <div>
                                    <Label className="text-[11px] text-gray-600 uppercase font-semibold">
                                        {'Seleccionar Colaborador'}
                                    </Label>
                                    <select
                                        value={nuevaNovedad.colaborador_id}
                                        onChange={(e) => handleNuevaNovedadSelectColaborador(e.target.value)}
                                        className="h-8 text-xs mt-1 w-full rounded-md border border-input bg-white px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-- Seleccionar colaborador --</option>
                                        {colaboradores.map((col) => (
                                            <option key={col.id} value={String(col.id)}>
                                                {`${col.nombre_completo ?? ''} (${col.cedula ?? ''})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-[11px] text-gray-600 uppercase font-semibold">
                                            {'Cédula'}
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="Cédula"
                                            value={nuevaNovedad.cedula}
                                            onChange={(e) => setNuevaNovedad((prev) => ({ ...prev, cedula: e.target.value }))}
                                            className="h-8 text-xs mt-1 bg-white font-mono"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[11px] text-gray-600 uppercase font-semibold">
                                            {'Cargo'}
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="Cargo"
                                            value={nuevaNovedad.cargo}
                                            onChange={(e) => setNuevaNovedad((prev) => ({ ...prev, cargo: e.target.value }))}
                                            className="h-8 text-xs mt-1 bg-white"
                                        />
                                    </div>
                                </div>

                                {/* CHECKBOX FIJO */}
                                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200">
                                    <Checkbox
                                        id="nuevo-fijo"
                                        checked={nuevaNovedad.fijo}
                                        onCheckedChange={(checked) =>
                                            setNuevaNovedad((prev) => ({ ...prev, fijo: Boolean(checked) }))
                                        }
                                    />
                                    <label htmlFor="nuevo-fijo" className="text-xs font-semibold text-green-800 dark:text-green-300 cursor-pointer">
                                        FIJO (aparece en todas las rutas)
                                    </label>
                                </div>

                                <div>
                                    <Button
                                        type="button"
                                        onClick={handleAgregarNovedadTabla2}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        {'+ Agregar a Novedades'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* TABLA DE NOVEDADES */}
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                                    <TableRow>
                                        <TableHead className="font-semibold">{'Identificación'}</TableHead>
                                        <TableHead className="font-semibold">{'Nombres'}</TableHead>
                                        <TableHead className="font-semibold">{'Cargo'}</TableHead>
                                        <TableHead className="text-center font-semibold">{'Fijos'}</TableHead>
                                        <TableHead className="text-center font-semibold">{'Permiso'}</TableHead>
                                        <TableHead className="text-center font-semibold">{'Incapacidad'}</TableHead>
                                        <TableHead className="text-center font-semibold">{'Vacaciones'}</TableHead>
                                        <TableHead className="text-right font-semibold w-24">{'Acciones'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!modulacion?.novedades || modulacion.novedades.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                                {'No hay colaboradores agregados en novedades para esta fecha. Utilice el formulario arriba para agregar uno.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        modulacion.novedades.map((nov) => {
                                            const rowState = novedadesState[nov.id] || nov;
                                            return (
                                                <TableRow key={nov.id} className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/40 ${rowState.fijo ? 'bg-green-50/50 dark:bg-green-950/20' : ''}`}>
                                                    <TableCell className="font-mono text-sm">{String(nov.cedula ?? '-')}</TableCell>
                                                    <TableCell className="font-medium text-sm">{String(nov.nombres ?? '-')}</TableCell>
                                                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                        {String(nov.cargo ?? '-')}
                                                    </TableCell>

                                                    {/* Fijos */}
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={Boolean(rowState.fijo)}
                                                            onCheckedChange={(checked) =>
                                                                handleNovedadChange(nov.id, 'fijo', Boolean(checked))
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* Permiso */}
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={Boolean(rowState.permiso)}
                                                            onCheckedChange={(checked) =>
                                                                handleNovedadChange(nov.id, 'permiso', Boolean(checked))
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* Incapacidad */}
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={Boolean(rowState.incapacidad)}
                                                            onCheckedChange={(checked) =>
                                                                handleNovedadChange(nov.id, 'incapacidad', Boolean(checked))
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* Vacaciones */}
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={Boolean(rowState.vacaciones)}
                                                            onCheckedChange={(checked) =>
                                                                handleNovedadChange(nov.id, 'vacaciones', Boolean(checked))
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* Acciones */}
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteNovedad(nov.id)}
                                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                {/* fin tabla 2 novedades */}

                {/* BOTÓN GENERAL PARA GUARDAR LA PLANEACIÓN DE RUTA COMPLETA (TODAS LAS RUTAS Y NOVEDADES) — solo en modo edición */}
                <div className="flex items-center justify-end pt-4 border-t" style={{ display: isEditing ? 'flex' : 'none' }}>
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleGuardarTodo}
                        className="bg-red-600 hover:bg-red-700 text-white text-base px-8 py-3 font-semibold shadow-lg"
                    >
                        <Save className="h-5 w-5 mr-2" />
                        Guardar Planeación de Ruta
                    </Button>
                </div>
                {/* fin botón guardar todo */}
            </div>
        </AppLayout>
    );
}
