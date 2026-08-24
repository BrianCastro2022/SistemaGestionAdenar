import {
    Activity,
    AlertTriangle,
    BadgeCheck,
    Ban,
    BarChart3,
    BookOpen,
    BellRing,
    Car,
    ClipboardCheck,
    ClipboardList,
    Cpu,
    DollarSign,
    FileStack,
    Folder,
    Fuel,
    Gauge,
    GraduationCap,
    Grid3x3,
    HeartHandshake,
    HeartPulse,
    ListChecks,
    ListTodo,
    Map,
    MapPin,
    Megaphone,
    QrCode,
    ShieldCheck,
    Star,
    Stethoscope,
    TestTube,
    Timer,
    Truck,
    UserCheck,
    Users,
    Wine,
    type LucideIcon,
} from 'lucide-react';

export interface SubModuleDef {
    title: string;
    /** Presente en los ítems "hoja" (tienen su propia página). Ausente en los ítems que solo agrupan otros submódulos. */
    slug?: string;
    icon: LucideIcon;
    /** Presente en los ítems que agrupan otros submódulos (se despliegan en el sidebar en vez de navegar). */
    submodules?: SubModuleDef[];
}

export interface ModuleDef {
    title: string;
    slug: string;
    icon: LucideIcon;
    /** Brand accent used sparingly to tell pillars apart across sidebar, dashboard and module pages. */
    accent: string;
    submodules: SubModuleDef[];
}

export const modules: ModuleDef[] = [
    {
        title: 'Seguridad',
        slug: 'seguridad',
        icon: ShieldCheck,
        accent: '#3F7A22',
        submodules: [
            { title: 'Colaboradores', slug: 'colaboradores', icon: UserCheck },
            {
                title: 'Alcoholimetría',
                icon: Wine,
                submodules: [
                    { title: 'Dispositivos', slug: 'dispositivos', icon: Cpu },
                    { title: 'Pruebas de Alcoholemia', slug: 'pruebas', icon: TestTube },
                ],
            },
            { title: 'Asignaciones de conductores', slug: 'asignaciones-conductores', icon: Truck },
            { title: 'Condiciones de Salud', slug: 'condiciones-salud', icon: HeartPulse },
            { title: 'Indicador', slug: 'indicador', icon: Activity },
            { title: 'Alertas', slug: 'alertas', icon: BellRing },
            {
                title: 'ACIS',
                icon: ShieldCheck,
                submodules: [
                    { title: 'Reportes ACI', slug: 'acis', icon: ClipboardList },
                    { title: 'Indicadores', slug: 'acis-indicadores', icon: BarChart3 },
                    { title: 'Consultar QR SKAP', slug: 'acis-consultar-qr', icon: QrCode },
                ],
            },
            {
                title: 'Evaluaciones OWD',
                icon: ClipboardCheck,
                submodules: [
                    { title: 'Evaluaciones', slug: 'evaluaciones-owd', icon: ClipboardList },
                    { title: 'Indicadores', slug: 'evaluaciones-owd-indicadores', icon: BarChart3 },
                    { title: 'Incumplimientos', slug: 'evaluaciones-owd-incumplimientos', icon: AlertTriangle },
                    { title: 'Planes de Acción', slug: 'planes-accion-owd', icon: ListTodo },
                    { title: 'Historial de Cargas', slug: 'evaluaciones-owd-importaciones', icon: FileStack },
                ],
            },
            {
                title: 'Exámenes Médicos',
                icon: Stethoscope,
                submodules: [
                    { title: 'Bandeja', slug: 'examenes-medicos', icon: ListChecks },
                    { title: 'Indicadores', slug: 'examenes-medicos-indicadores', icon: BarChart3 },
                    { title: 'Catálogo de exámenes', slug: 'examenes-medicos-catalogo', icon: FileStack },
                    { title: 'Matriz Cargo-Examen', slug: 'examenes-medicos-matriz', icon: Grid3x3 },
                    { title: 'Conceptos de aptitud', slug: 'examenes-medicos-conceptos', icon: BadgeCheck },
                    { title: 'Catálogo de recomendaciones', slug: 'examenes-medicos-recomendaciones', icon: ListTodo },
                ],
            },
            { title: 'Encuestas de Morbilidad', slug: 'encuestas-morbilidad', icon: Stethoscope },
            { title: 'Jornada Laboral', slug: 'jornada-laboral', icon: Timer },
            { title: 'Excesos en Curvas', slug: 'excesos-en-curvas', icon: AlertTriangle },

            { title: 'Glosario', slug: 'glosario', icon: BookOpen },

            { title: 'Mapa de Rutas Críticas', slug: 'rutas-criticas', icon: Map },

        ],
    },
    {
        title: 'Reparto',
        slug: 'reparto',
        icon: Truck,
        accent: '#D4102A',
        submodules: [
            { title: 'Calificaciones Negativas', slug: 'calificaciones-negativas', icon: Star },
            { title: 'Entrega en Rango', slug: 'entrega-en-rango', icon: MapPin },
            { title: 'Modulación', slug: 'modulacion', icon: BarChart3 },
            { title: 'Compensación Variable', slug: 'compensacion-variable', icon: DollarSign },
        ],
    },
    {
        title: 'Gente',
        slug: 'gente',
        icon: Users,
        accent: '#E3A11E',
        submodules: [
            { title: 'Malas Marcaciones', slug: 'malas-marcaciones', icon: Ban },
            { title: 'Inducciones', slug: 'inducciones', icon: Megaphone },
            { title: 'Plan Padrinos', slug: 'plan-padrinos', icon: HeartHandshake },
        ],
    },
    {
        title: 'Flota',
        slug: 'flota',
        icon: Car,
        accent: '#2B6CB0',
        submodules: [
            { title: 'Documentación', slug: 'vehiculos', icon: Truck },
            { title: 'Checklist', slug: 'checklist', icon: ClipboardCheck },
            { title: 'Combustible', slug: 'combustible', icon: Fuel },
            { title: 'Calibración de Llantas', slug: 'calibracion-llantas', icon: Gauge },
        ],
    },
    {
        title: 'Capacitaciones',
        slug: 'capacitaciones',
        icon: GraduationCap,
        accent: '#0D9488',
        submodules: [
            { title: 'Materiales y Carpetas', slug: '', icon: Folder },
        ],
    },
];

export function findModule(moduleSlug: string): ModuleDef | undefined {
    return modules.find((mod) => mod.slug === moduleSlug);
}

/** Convierte el árbol de submódulos en una lista plana de solo los ítems "hoja" (los que tienen página propia). */
export function flattenSubmodules(submodules: SubModuleDef[]): SubModuleDef[] {
    return submodules.flatMap((sub) => (sub.submodules ? flattenSubmodules(sub.submodules) : [sub]));
}

export function findSubmodule(moduleSlug: string, submoduleSlug: string): { module: ModuleDef; submodule: SubModuleDef } | undefined {
    const module = findModule(moduleSlug);
    const submodule = module && flattenSubmodules(module.submodules).find((sub) => sub.slug === submoduleSlug);
    return module && submodule ? { module, submodule } : undefined;
}
