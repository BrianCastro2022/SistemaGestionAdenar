import { ModuleCard } from '@/components/module-card';
import { Reveal } from '@/components/reveal';
import { ShinyText } from '@/components/shiny-text';
import { modules } from '@/data/modules';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function RoleDashboard({ modules: accessibleSlugs }: { modules: string[] }) {
    const { auth } = usePage<SharedData>().props;
    const accessibleModules = modules.filter((mod) => accessibleSlugs.includes(mod.slug));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <Reveal>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Bienvenido, <ShinyText color={accessibleModules[0]?.accent ?? '#3F7A22'}>{auth.user.name}</ShinyText>
                    </h1>
                    <p className="text-muted-foreground">Aquí tienes el acceso a tu módulo de trabajo.</p>
                </Reveal>

                {accessibleModules.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {accessibleModules.map((mod, index) => (
                            <Reveal key={mod.slug} delay={index * 80}>
                                <ModuleCard title={mod.title} href={`/modules/${mod.slug}`} icon={mod.icon} color={mod.accent} />
                            </Reveal>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">Todavía no tienes módulos asignados. Contacta a un administrador.</p>
                )}
            </div>
        </AppLayout>
    );
}
