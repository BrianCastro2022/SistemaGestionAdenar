import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { modules, type SubModuleDef } from '@/data/modules';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BellRing, HeartPulse, LayoutGrid, TestTube, Truck, User, UserCog } from 'lucide-react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [

];

function buildSubNavItems(submodules: SubModuleDef[], moduleSlug: string, color: string): NavItem[] {
    return submodules.map((sub) =>
        sub.submodules
            ? {
                  title: sub.title,
                  url: '#',
                  icon: sub.icon,
                  color,
                  items: buildSubNavItems(sub.submodules, moduleSlug, color),
              }
            : {
                  title: sub.title,
                  url: `/modules/${moduleSlug}/${sub.slug}`,
                  icon: sub.icon,
                  color,
              },
    );
}

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const visibleModules = auth.isAdmin ? modules : modules.filter((mod) => auth.accessibleModules.includes(mod.slug));

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
        },
        ...visibleModules.map((mod) => ({
            title: mod.title,
            url: `/modules/${mod.slug}`,
            icon: mod.icon,
            color: mod.accent,
            items: buildSubNavItems(mod.submodules, mod.slug, mod.accent),
        })),
        ...(auth.isColaborador
            ? [
                  { title: 'Mi Perfil', url: '/portal/perfil', icon: User, color: '#3F7A22' },
                  { title: 'Mis Pruebas', url: '/portal/pruebas', icon: TestTube, color: '#3F7A22' },
                  { title: 'Mis Rutas', url: '/portal/rutas', icon: Truck, color: '#3F7A22' },
                  { title: 'Condición de Salud', url: '/portal/condicion-salud', icon: HeartPulse, color: '#3F7A22' },
                  { title: 'Alertas', url: '/portal/alertas', icon: BellRing, color: '#3F7A22' },
              ]
            : []),
        ...(auth.isAdmin
            ? [
                  {
                      title: 'Gestión de Usuarios',
                      url: '/admin/users',
                      icon: UserCog,
                      color: '#6B21A8',
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
