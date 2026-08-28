import { KpiCard, KpiCardGrid } from '@/components/kpi-card';
import { ModuleCard } from '@/components/module-card';
import { Reveal } from '@/components/reveal';
import { ShinyText } from '@/components/shiny-text';
import { modules } from '@/data/modules';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { CheckCircle2, UserCog, Users, XCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface RoleStat {
    slug: string;
    role: string;
    count: number;
}

interface AdminDashboardProps {
    stats: {
        totalUsers: number;
        activeUsers: number;
        inactiveUsers: number;
        byRole: RoleStat[];
    };
}

export default function AdminDashboard({ stats }: AdminDashboardProps) {
    const { auth } = usePage<SharedData>().props;

    const totalesSecondaryText = stats.byRole.length > 0 ? stats.byRole.map((r) => `${r.role}: ${r.count}`).join(' · ') : undefined;

    const summaryCards = [
        { label: 'Usuarios totales', value: stats.totalUsers, icon: Users, color: '#2B6CB0', secondaryText: totalesSecondaryText },
        { label: 'Usuarios activos', value: stats.activeUsers, icon: CheckCircle2, color: '#3F7A22' },
        { label: 'Usuarios inactivos', value: stats.inactiveUsers, icon: XCircle, color: '#D4102A' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <Reveal>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Bienvenido, <ShinyText color="#3F7A22">{auth.user.name}</ShinyText>
                    </h1>
                    <p className="text-muted-foreground">Vista global del sistema — accede a cualquier módulo o gestiona los usuarios.</p>
                </Reveal>

                <KpiCardGrid className="grid-cols-1 sm:grid-cols-3">
                    {summaryCards.map((card) => (
                        <KpiCard
                            key={card.label}
                            label={card.label}
                            value={card.value}
                            icon={card.icon}
                            color={card.color}
                            secondaryText={card.secondaryText}
                        />
                    ))}
                </KpiCardGrid>

                <div>
                    <h2 className="mb-3 text-lg font-medium tracking-tight">Módulos</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                        {modules.map((mod, index) => (
                            <Reveal key={mod.slug} delay={index * 80}>
                                <ModuleCard title={mod.title} href={`/modules/${mod.slug}`} icon={mod.icon} color={mod.accent} />
                            </Reveal>
                        ))}
                        <Reveal delay={modules.length * 80}>
                            <ModuleCard title="Gestión de Usuarios" href="/admin/users" icon={UserCog} color="#6B21A8" />
                        </Reveal>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
