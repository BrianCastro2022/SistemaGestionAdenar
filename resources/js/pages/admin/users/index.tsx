import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Gestión de Usuarios', href: '/admin/users' },
];

interface UserRow {
    id: number;
    name: string;
    identification_number: string;
    email: string | null;
    is_active: boolean;
    roles: string[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface UsersPaginator {
    data: UserRow[];
    links: PaginationLink[];
}

export default function UsersIndex({ users, filters }: { users: UsersPaginator; filters: { search: string } }) {
    const [search, setSearch] = useState(filters.search);

    const submitSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(route('admin.users.index'), { search }, { preserveState: true, replace: true });
    };

    const toggleStatus = (user: UserRow) => {
        router.patch(route('admin.users.toggle-status', user.id), {}, { preserveScroll: true });
    };

    const destroyUser = (user: UserRow) => {
        router.delete(route('admin.users.destroy', user.id), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Usuarios" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <HeadingSmall title="Gestión de Usuarios" description="Crea, edita y administra el acceso de los usuarios del sistema." />
                    <Button asChild>
                        <Link href={route('admin.users.create')}>
                            <Plus className="size-4" />
                            Nuevo usuario
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submitSearch} className="flex max-w-sm items-center gap-2">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, cédula o correo..."
                    />
                    <Button type="submit" variant="secondary" size="icon" aria-label="Buscar">
                        <Search className="size-4" />
                    </Button>
                </form>

                <div className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Identificación</TableHead>
                                <TableHead>Correo</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-muted-foreground py-6 text-center">
                                        No se encontraron usuarios.
                                    </TableCell>
                                </TableRow>
                            )}
                            {users.data.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.identification_number}</TableCell>
                                    <TableCell>{user.email ?? '—'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.map((role) => (
                                                <Badge key={role} variant="secondary">
                                                    {role}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.is_active ? 'default' : 'destructive'}>{user.is_active ? 'Activo' : 'Inactivo'}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={route('admin.users.edit', user.id)}>Editar</Link>
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => toggleStatus(user)}>
                                                {user.is_active ? 'Desactivar' : 'Activar'}
                                            </Button>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">
                                                        Eliminar
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogTitle>¿Eliminar a {user.name}?</DialogTitle>
                                                    <DialogDescription>
                                                        Esta acción elimina al usuario de forma lógica; podrás restaurarlo directamente desde la
                                                        base de datos si es necesario.
                                                    </DialogDescription>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button variant="secondary">Cancelar</Button>
                                                        </DialogClose>
                                                        <Button variant="destructive" onClick={() => destroyUser(user)}>
                                                            Eliminar
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {users.links.length > 3 && (
                    <div className="flex flex-wrap gap-1">
                        {users.links.map((link, index) => (
                            <Button
                                key={index}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                asChild={!!link.url}
                            >
                                {link.url ? (
                                    <Link href={link.url} preserveScroll dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
