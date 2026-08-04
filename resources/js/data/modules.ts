import {
    Activity,
    AlertTriangle,
    Ban,
    BarChart3,
    BookOpen,
    BellRing,
    Car,
    ClipboardCheck,
    Cpu,
    Fuel,
    Gauge,
    HeartHandshake,
    Map,
    MapPin,
    Megaphone,
    ShieldCheck,
    Star,
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
            { title: 'Indicador', slug: 'indicador', icon: Activity },
            { title: 'Alertas', slug: 'alertas', icon: BellRing },
            { title: 'ACIS', slug: 'acis', icon: ShieldCheck },
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
            { title: 'Checklist', slug: 'checklist', icon: ClipboardCheck },
            { title: 'Combustible', slug: 'combustible', icon: Fuel },
            { title: 'Calibración de Llantas', slug: 'calibracion-llantas', icon: Gauge },
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
