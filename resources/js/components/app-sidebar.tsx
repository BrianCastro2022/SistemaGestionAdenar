import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { colaboradoresReadOnlySubmodule, modules, type ModuleDef, type SubModuleDef } from '@/data/modules';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BellRing, GraduationCap, HeartPulse, LayoutGrid, Stethoscope, TestTube, Truck, User, UserCog } from 'lucide-react';
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
                  url: sub.slug ? `/modules/${sub.moduleSlugOverride ?? moduleSlug}/${sub.slug}` : `/modules/${moduleSlug}`,
                  icon: sub.icon,
                  color,
              },
    );
}

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;

    // Colaboradores es propiedad de Gente (crear/editar/importar/eliminar).
    // Seguridad, Reparto y Flota conservan acceso de solo lectura, así que
    // ven el mismo enlace inyectado como submódulo dentro de SU PROPIA
    // sección — no una sección "Gente" ajena — mientras no tengan el rol
    // Gente (que ya trae la entrada real en su propia sección) ni sean
    // Administrador (que ve todos los módulos completos igual).
    const showColaboradoresReadOnlyLink =
        !auth.isAdmin && !auth.roles.includes('Gente') && ['Seguridad', 'Reparto', 'Flota'].some((role) => auth.roles.includes(role));

    const visibleModules: ModuleDef[] = auth.isAdmin
        ? modules
        : modules
              .filter((mod) => auth.accessibleModules.includes(mod.slug))
              .map((mod) =>
                  showColaboradoresReadOnlyLink && mod.slug !== 'gente'
                      ? { ...mod, submodules: [colaboradoresReadOnlySubmodule, ...mod.submodules] }
                      : mod,
              );

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
                  { title: 'Encuesta de Morbilidad', url: '/portal/encuesta-morbilidad', icon: Stethoscope, color: '#3F7A22' },
                  { title: 'Mis Capacitaciones', url: '/portal/capacitaciones', icon: GraduationCap, color: '#0D9488' },
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
