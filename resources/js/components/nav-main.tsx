import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isGroupActive = page.url.startsWith(item.url);

                    return item.items?.length ? (
                        <Collapsible key={item.title} asChild defaultOpen={isGroupActive} className="group/collapsible">
                            <SidebarMenuItem>
                                {isGroupActive && item.color && (
                                    <span
                                        className="absolute top-1 bottom-1 left-0 w-0.5 rounded-full transition-colors"
                                        style={{ backgroundColor: item.color }}
                                        aria-hidden
                                    />
                                )}
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton isActive={isGroupActive} style={isGroupActive && item.color ? { color: item.color } : undefined}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items.map((subItem) => {
                                            const isSubActive = subItem.url === page.url;
                                            return (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={isSubActive}
                                                        style={isSubActive && subItem.color ? { color: subItem.color } : undefined}
                                                    >
                                                        <Link href={subItem.url} prefetch>
                                                            {subItem.icon && <subItem.icon />}
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            );
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            {item.url === page.url && item.color && (
                                <span
                                    className="absolute top-1 bottom-1 left-0 w-0.5 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                    aria-hidden
                                />
                            )}
                            <SidebarMenuButton
                                asChild
                                isActive={item.url === page.url}
                                style={item.url === page.url && item.color ? { color: item.color } : undefined}
                            >
                                <Link href={item.url} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
