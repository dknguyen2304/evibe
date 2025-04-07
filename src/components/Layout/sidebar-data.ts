import {
  IconBrandGoogleAnalytics,
  IconChecklist,
  IconLayoutDashboard,
  IconMessage,
  IconPackages,
  IconServerCog,
} from '@tabler/icons-react';
import { ServerCogIcon, UsersIcon } from 'lucide-react';
import { LinkProps } from 'next/link';

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface Team {
  name: string;
  logo: React.ElementType;
  plan: string;
}

interface BaseNavItem {
  title: string;
  badge?: string;
  icon?: React.ElementType;
}

type NavLink = BaseNavItem & {
  url: LinkProps['href'];
  items?: never;
};

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['href'] })[];
  url?: never;
};

type NavItem = NavCollapsible | NavLink;

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarData {
  navGroups: NavGroup[];
}

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink };

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Movie Management',
          icon: IconChecklist,
          items: [
            {
              title: 'Movies',
              url: '/movies',
              icon: IconPackages,
            },
            {
              title: 'Actors',
              url: '/actors',
              icon: IconPackages,
            },
            {
              title: 'Directors',
              url: '/directors',
              icon: IconPackages,
            },
            {
              title: 'Genres',
              url: '/genres',
              icon: IconPackages,
            },
          ],
        },
        {
          title: 'User Management',
          icon: IconPackages,
          items: [
            {
              title: 'Users',
              url: '/admin/users',
              icon: UsersIcon,
            },
            {
              title: 'Reviews',
              url: '/admin/reviews',
              icon: IconMessage,
            },
          ],
        },
        {
          title: 'System Settings',
          icon: ServerCogIcon,
          items: [
            {
              title: 'Settings',
              url: '/admin/settings',
              icon: IconServerCog,
            },
            {
              title: 'Analytics',
              url: '/admin/analytics',
              icon: IconBrandGoogleAnalytics,
            },
          ],
        },
      ],
    },
  ],
};
