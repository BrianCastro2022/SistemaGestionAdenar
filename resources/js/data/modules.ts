import {
    AlertTriangle,
    Ban,
    BarChart3,
    Car,
    ClipboardCheck,
    Fuel,
    Gauge,
    HeartHandshake,
    MapPin,
    Megaphone,
    ShieldCheck,
    Star,
    Timer,
    Truck,
    Users,
    type LucideIcon,
} from 'lucide-react';

export interface SubModuleDef {
    title: string;
    slug: string;
    icon: LucideIcon;
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
            { title: 'ACIS', slug: 'acis', icon: ShieldCheck },
            { title: 'Jornada Laboral', slug: 'jornada-laboral', icon: Timer },
            { title: 'Excesos en Curvas', slug: 'excesos-en-curvas', icon: AlertTriangle },
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

export function findSubmodule(moduleSlug: string, submoduleSlug: string): { module: ModuleDef; submodule: SubModuleDef } | undefined {
    const module = findModule(moduleSlug);
    const submodule = module?.submodules.find((sub) => sub.slug === submoduleSlug);
    return module && submodule ? { module, submodule } : undefined;
}
