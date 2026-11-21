import {
  AlertOctagon,
  AlertTriangle,
  CircleAlert,
  Info,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from './Badge';
import type {
  Confidence,
  Severity,
  TicketStatus,
  ComplaintCategory,
  Department,
} from '@/types/complaint';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

const SEVERITY_CONFIG: Record<
  Severity,
  { tone: Tone; icon: ReactNode; label: string }
> = {
  Critical: {
    tone: 'error',
    icon: <AlertOctagon />,
    label: 'Critical',
  },
  High: { tone: 'warning', icon: <AlertTriangle />, label: 'High' },
  Medium: { tone: 'info', icon: <CircleAlert />, label: 'Medium' },
  Low: { tone: 'neutral', icon: <Info />, label: 'Low' },
};

/** Badge showing a complaint severity level with matching color + icon. */
export function SeverityBadge({
  severity,
  size = 'sm',
}: {
  severity: Severity;
  size?: 'sm' | 'md';
}) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <Badge tone={cfg.tone} icon={cfg.icon} size={size}>
      {cfg.label}
    </Badge>
  );
}

const STATUS_CONFIG: Record<TicketStatus, { tone: Tone; label: string }> = {
  Open: { tone: 'info', label: 'Open' },
  Acknowledged: { tone: 'primary', label: 'Acknowledged' },
  'In Progress': { tone: 'warning', label: 'In Progress' },
  Resolved: { tone: 'success', label: 'Resolved' },
};

/** Badge showing a ticket lifecycle status. */
export function StatusBadge({
  status,
  size = 'sm',
}: {
  status: TicketStatus;
  size?: 'sm' | 'md';
}) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge tone={cfg.tone} size={size}>
      {cfg.label}
    </Badge>
  );
}

const CONFIDENCE_CONFIG: Record<Confidence, { tone: Tone; label: string }> = {
  High: { tone: 'success', label: 'High confidence' },
  Medium: { tone: 'neutral', label: 'Medium confidence' },
  Low: { tone: 'warning', label: 'Low confidence' },
};

/** Badge showing AI confidence in its classification. */
export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const cfg = CONFIDENCE_CONFIG[confidence];
  return <Badge tone={cfg.tone} size="sm">{cfg.label}</Badge>;
}

/** Neutral badge for a complaint category. */
export function CategoryBadge({
  category,
  size = 'sm',
}: {
  category: ComplaintCategory;
  size?: 'sm' | 'md';
}) {
  return (
    <Badge tone="neutral" size={size}>
      {category}
    </Badge>
  );
}

/** Badge for the routed department. */
export function DepartmentBadge({
  department,
  size = 'sm',
}: {
  department: Department;
  size?: 'sm' | 'md';
}) {
  return (
    <Badge tone="primary" size={size}>
      {department}
    </Badge>
  );
}
