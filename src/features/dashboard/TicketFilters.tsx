import { Search, Filter, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  INITIAL_FILTERS,
  type TicketFilterState,
} from './dashboardUtils';
import type {
  ComplaintCategory,
  Severity,
  TicketStatus,
} from '@/types/complaint';

const SEVERITIES: Array<Severity | 'all'> = ['all', 'Critical', 'High', 'Medium', 'Low'];
const CATEGORIES: Array<ComplaintCategory | 'all'> = [
  'all',
  'Roads and potholes',
  'Waste management',
  'Water supply and leakage',
  'Electricity and streetlights',
  'Trees and fallen branches',
  'Drainage and sewage',
  'Other',
];
const STATUSES: Array<TicketStatus | 'all'> = [
  'all',
  'Open',
  'Acknowledged',
  'In Progress',
  'Resolved',
];

export interface TicketFiltersProps {
  filters: TicketFilterState;
  onChange: (next: TicketFilterState) => void;
  departments: string[];
  resultCount: number;
}

/**
 * Search + filter bar. All filters compose with AND logic through
 * `applyFilters`. Search matches ticket id, description, and locality.
 */
export function TicketFilters({ filters, onChange, departments, resultCount }: TicketFiltersProps) {
  const activeCount =
    (filters.severity !== 'all' ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0) +
    (filters.department !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0);

  return (
    <Card padding="md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="Search by ticket ID, description, or locality…"
              leftIcon={<Search />}
              aria-label="Search complaints"
            />
          </div>
          {activeCount > 0 && (
            <button
              onClick={() => onChange({ ...INITIAL_FILTERS, search: filters.search })}
              className="inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 sm:self-auto"
            >
              <X className="h-4 w-4" />
              Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectFilter
            label="Severity"
            value={filters.severity}
            onChange={(v) => onChange({ ...filters, severity: v as Severity | 'all' })}
            options={SEVERITIES.map((s) => ({ value: s, label: s === 'all' ? 'All severities' : s }))}
          />
          <SelectFilter
            label="Category"
            value={filters.category}
            onChange={(v) => onChange({ ...filters, category: v as ComplaintCategory | 'all' })}
            options={CATEGORIES.map((c) => ({ value: c, label: c === 'all' ? 'All categories' : c }))}
          />
          <SelectFilter
            label="Department"
            value={filters.department}
            onChange={(v) => onChange({ ...filters, department: v })}
            options={[
              { value: 'all', label: 'All departments' },
              ...departments.map((d) => ({ value: d, label: d })),
            ]}
          />
          <SelectFilter
            label="Status"
            value={filters.status}
            onChange={(v) => onChange({ ...filters, status: v as TicketStatus | 'all' })}
            options={STATUSES.map((s) => ({ value: s, label: s === 'all' ? 'All statuses' : s }))}
          />
        </div>

        <p className="flex items-center gap-1.5 text-sm text-ink-500">
          <Filter className="h-4 w-4" />
          {resultCount} complaint{resultCount !== 1 ? 's' : ''} shown
        </p>
      </div>
    </Card>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-ink-300 bg-white px-3 text-sm text-ink-800 transition-colors focus:border-primary-500 focus:outline-none focus:shadow-focus"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
