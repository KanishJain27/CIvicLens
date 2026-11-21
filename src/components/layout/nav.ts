import {
  LayoutDashboard,
  FilePlus2,
  ListChecks,
  type LucideIcon,
} from 'lucide-react';

export type RouteId = 'overview' | 'submit' | 'complaints';

export interface NavItem {
  id: RouteId;
  label: string;
  icon: LucideIcon;
  description: string;
}

/** Single source of truth for navigation items across sidebar and header. */
export const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Dashboard summary & analytics',
  },
  {
    id: 'submit',
    label: 'Submit Complaint',
    icon: FilePlus2,
    description: 'Report a new civic issue',
  },
  {
    id: 'complaints',
    label: 'All Complaints',
    icon: ListChecks,
    description: 'Browse & manage tickets',
  },
];
