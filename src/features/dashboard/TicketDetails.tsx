import { useState } from 'react';
import { Copy, Check, MapPin, Building2, Sparkles, AlertTriangle, Clock, ImageOff, Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  SeverityBadge,
  StatusBadge,
  ConfidenceBadge,
  CategoryBadge,
} from '@/components/ui/StatusBadges';
import { Badge } from '@/components/ui/Badge';
import type { ComplaintTicket, TicketStatus } from '@/types/complaint';
import { STATUSES } from './useTicketManager';

export interface TicketDetailsProps {
  ticket: ComplaintTicket | null;
  open: boolean;
  onClose: () => void;
  /** Lookup map used to resolve `possibleDuplicateOf` into a real ticket. */
  ticketsById?: Map<string, ComplaintTicket>;
  onInspectDuplicate?: (ticket: ComplaintTicket) => void;
  onStatusChange: (ticket: ComplaintTicket, status: TicketStatus) => Promise<boolean>;
  /** Permanently delete the ticket. Returns true on success. */
  onDelete?: (ticket: ComplaintTicket) => Promise<boolean>;
}

/**
 * Ticket detail modal: original complaint, translated summary, photo,
 * AI classification, severity justification, department, suggested action,
 * creation time, and live status management.
 */
export function TicketDetails({
  ticket,
  open,
  onClose,
  ticketsById,
  onInspectDuplicate,
  onStatusChange,
  onDelete,
}: TicketDetailsProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  if (!ticket) return null;

  const duplicateOf = ticket.possibleDuplicateOf
    ? ticketsById?.get(ticket.possibleDuplicateOf)
    : null;

  function copyTicketNumber() {
    navigator.clipboard?.writeText(ticket!.ticketNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function handleStatusChange(status: TicketStatus) {
    setSaving(true);
    try {
      await onStatusChange(ticket!, status);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || !ticket) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const ok = await onDelete(ticket);
      if (ok) {
        setDeleteSuccess(true);
        setConfirmDelete(false);
        setTimeout(() => {
          setDeleteSuccess(false);
          onClose();
        }, 1200);
      } else {
        setDeleteError('Could not delete the ticket. Please try again.');
      }
    } catch {
      setDeleteError('Could not delete the ticket. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Ticket details">
      <div className="flex flex-col gap-5">
        {/* Header block */}
        <div className="flex flex-col gap-2 rounded-xl bg-ink-50 p-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-primary-700">
              {ticket.ticketNumber}
            </span>
            <button
              onClick={copyTicketNumber}
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-ink-200 hover:text-ink-700"
              aria-label="Copy ticket number"
            >
              {copied ? <Check className="h-4 w-4 text-success-600" /> : <Copy className="h-4 w-4" />}
            </button>
            <StatusBadge status={ticket.status} />
            <SeverityBadge severity={ticket.severity} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-500">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(ticket.createdAt).toLocaleString()}
            </span>
            {ticket.locality && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {ticket.locality}
              </span>
            )}
          </div>
        </div>

        {/* Photo */}
        {ticket.image ? (
          <img
            src={ticket.image}
            alt="Complaint photo"
            className="max-h-72 w-full rounded-xl border border-ink-200 object-cover"
          />
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 bg-ink-50 px-4 py-6 text-sm text-ink-400">
            <ImageOff className="h-4 w-4" />
            No photo was attached to this complaint.
          </div>
        )}

        {/* Complaint content */}
        <section>
          <SectionLabel>Original citizen complaint</SectionLabel>
          <p className="mt-1 text-sm text-ink-800">{ticket.description}</p>
        </section>

        <section>
          <SectionLabel>Translated English summary</SectionLabel>
          <p className="mt-1 text-sm text-ink-800">{ticket.translatedSummary}</p>
          <p className="mt-1 text-xs text-ink-400">
            Detected language: {ticket.originalLanguage}
          </p>
        </section>

        {/* AI analysis */}
        <section className="rounded-xl border border-accent-200 bg-accent-50/60 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-600" />
            <h4 className="text-sm font-semibold text-accent-800">AI analysis</h4>
            <ConfidenceBadge confidence={ticket.confidence} />
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-400">Category</dt>
              <dd className="mt-0.5"><CategoryBadge category={ticket.category} /></dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-400">Severity</dt>
              <dd className="mt-0.5"><SeverityBadge severity={ticket.severity} /></dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-400">
                Severity justification
              </dt>
              <dd className="mt-0.5 text-sm text-ink-700">{ticket.severityReason}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-400">
                Responsible department
              </dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-700">
                <Building2 className="h-4 w-4 text-ink-400" />
                {ticket.department}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-400">
                Suggested action
              </dt>
              <dd className="mt-0.5 text-sm text-ink-700">{ticket.suggestedAction}</dd>
            </div>
          </dl>
        </section>

        {/* Duplicate warning */}
        {ticket.possibleDuplicateOf && (
          <div className="flex items-start gap-3 rounded-xl border border-warning-300 bg-warning-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-medium text-warning-800">Possible duplicate</p>
              <p className="text-sm text-warning-700">
                This complaint was flagged as a possible duplicate of{' '}
                <span className="font-mono font-semibold">
                  {duplicateOf?.ticketNumber ?? ticket.possibleDuplicateOf}
                </span>
                . Nothing is deleted — review before acting.
              </p>
              {duplicateOf && onInspectDuplicate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => onInspectDuplicate(duplicateOf)}
                >
                  Inspect existing ticket
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Status management */}
        <section className="border-t border-ink-200 pt-4">
          <SectionLabel>Update status</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                disabled={saving || s === ticket.status}
                onClick={() => handleStatusChange(s)}
                className={[
                  'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                  s === ticket.status
                    ? 'bg-primary-700 text-white shadow-sm'
                    : 'border border-ink-300 bg-white text-ink-700 hover:bg-ink-50',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                ].join(' ')}
              >
                {s}
                {saving && s !== ticket.status && ' …'}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-400">
            Changes save immediately and persist after refresh.
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between gap-3">
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setDeleteError(null);
              setConfirmDelete(true);
            }}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Success notification */}
      {deleteSuccess && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-2.5 text-sm font-medium text-success-800">
          <Check className="h-4 w-4" />
          Ticket deleted successfully.
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Modal
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        title="Delete this complaint?"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
              onClick={handleDelete}
              leftIcon={!deleting ? <Trash2 className="h-4 w-4" /> : undefined}
            >
              Yes, delete
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error-600" />
            <p className="text-sm text-error-700">
              Ticket{' '}
              <span className="font-mono font-semibold">{ticket.ticketNumber}</span>{' '}
              will be permanently removed from the database. Other complaints
              will not be affected.
            </p>
          </div>
          {deleteError && (
            <p className="text-sm text-error-600">{deleteError}</p>
          )}
        </div>
      </Modal>
    </Modal>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
      {children}
    </h4>
  );
}
