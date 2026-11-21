import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ImagePlus,
  X,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Copy,
  ArrowRight,
  Languages,
  Loader2,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
  SeverityBadge,
  CategoryBadge,
  DepartmentBadge,
  ConfidenceBadge,
} from '@/components/ui/StatusBadges';
import type { ComplaintTicket, DuplicateDetectionResult } from '@/types/complaint';
import {
  createComplaintTicket,
  uploadComplaintImage,
} from '@/services/complaintService';
import { detectDuplicate } from '@/services/duplicateDetection';

type Phase = 'idle' | 'analyzing' | 'success' | 'error';

const MAX_CHARS = 2000;
const MAX_IMAGE_MB = 8;

export interface SubmitComplaintProps {
  /** Called after a ticket is successfully created. Member 3 / App can navigate. */
  onSubmitted?: (ticket: ComplaintTicket) => void;
  /** Navigate to the complaints list (used by success screen & buttons). */
  onGoToComplaints?: () => void;
}

/**
 * Complaint submission page.
 *
 * Integrates with Member 1's services:
 *  - `uploadComplaintImage` for the optional photo,
 *  - `detectDuplicate` to warn about possible duplicates before submitting,
 *  - `createComplaintTicket` to run AI analysis and persist the ticket.
 *
 * The page exposes a clean submission flow: form -> (optional duplicate modal)
 * -> AI analysis -> success screen with the generated ticket number, or an
 * error state with a retry option.
 */
export function SubmitComplaint({ onSubmitted, onGoToComplaints }: SubmitComplaintProps) {
  const [description, setDescription] = useState('');
  const [locality, setLocality] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [statusLabel, setStatusLabel] = useState('Submitting your complaint…');
  const [ticket, setTicket] = useState<ComplaintTicket | null>(null);
  const [aiPending, setAiPending] = useState(false);

  const [dupResult, setDupResult] = useState<DuplicateDetectionResult | null>(null);
  const [dupModalOpen, setDupModalOpen] = useState(false);
  // Stashed input used to resume submission after the duplicate confirmation.
  const stashRef = useRef<{ description: string; locality: string; image: File | null } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    setImageError(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setImageError(`Image must be under ${MAX_IMAGE_MB} MB.`);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function resetForm() {
    setDescription('');
    setLocality('');
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  /**
   * Core submission. Runs duplicate detection, then uploads image (if any),
   * then calls createComplaintTicket (which runs AI analysis server-side).
   */
  async function runSubmission(
    desc: string,
    loc: string,
    file: File | null,
    overrideDuplicate = false
  ) {
    setFormError(null);
    setPhase('analyzing');
    setStatusLabel('Checking for similar complaints…');

    try {
      const baseInput = { description: desc, locality: loc || undefined };

      // Duplicate check (skipped when the user already confirmed a duplicate).
      if (!overrideDuplicate) {
        const dup = await detectDuplicate(baseInput);
        if (dup.isDuplicate) {
          setDupResult(dup);
          setDupModalOpen(true);
          setPhase('idle');
          return;
        }
      }

      // Upload image first, if present. Storage failures are non-fatal —
      // the complaint is still recorded as a text-only ticket.
      let imageUrl: string | undefined;
      if (file) {
        setStatusLabel('Uploading photo…');
        try {
          imageUrl = await uploadComplaintImage(file);
        } catch (uploadErr) {
          // Photo upload failed (e.g. storage bucket not provisioned).
          // Continue without the image rather than blocking the whole complaint.
          console.warn('Image upload failed, continuing as text-only:', uploadErr);
        }
      }

      // Create ticket (AI analysis runs inside this call, with demo-mode fallback).
      setStatusLabel('AI is analysing & categorising your complaint…');
      const result = await createComplaintTicket({
        ...baseInput,
        image: imageUrl,
        possibleDuplicateOf: dupResult?.matches[0]?.ticket.id,
      });

      setTicket(result.ticket);
      setAiPending(result.aiPending);
      setPhase('success');
      onSubmitted?.(result.ticket);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setFormError(message);
      setPhase('error');
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const desc = description.trim();
    if (desc.length < 10) {
      setFormError('Please describe the issue in at least 10 characters.');
      return;
    }
    stashRef.current = { description: desc, locality: locality.trim(), image: imageFile };
    runSubmission(desc, locality.trim(), imageFile);
  }

  function confirmDuplicateAndSubmit() {
    setDupModalOpen(false);
    const stash = stashRef.current;
    if (!stash) return;
    runSubmission(stash.description, stash.locality, stash.image, true);
  }

  function handleResetAndRetry() {
    setPhase('idle');
    setFormError(null);
  }

  return (
    <PageContainer
      title="Submit a Complaint"
      description="Report a civic issue. Our AI analyses, categorises, and routes it to the right department."
      maxWidth="narrow"
    >
      {/* AI banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-accent-800">
            AI-powered analysis
          </p>
          <p className="text-sm text-accent-700">
            Write in English or any Indian language. CivicLens detects the language,
            translates, categorises the issue, assesses severity, and routes it to the
            correct municipal department — automatically.
          </p>
        </div>
      </div>

      {/* SUCCESS STATE */}
      {phase === 'success' && ticket ? (
        <SuccessView ticket={ticket} aiPending={aiPending} onGoToComplaints={onGoToComplaints} onSubmitAnother={() => { resetForm(); setTicket(null); setAiPending(false); setPhase('idle'); }} />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card padding="lg">
            <CardHeader
              title="Complaint details"
              subtitle="Describe the issue as clearly as you can."
              icon={<ImagePlus className="h-[18px] w-[18px]" />}
            />

            <div className="mt-6 flex flex-col gap-5">
              <Textarea
                label="What is the issue?"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. There is a large pothole near the school gate on MG Road causing two-wheelers to skid. It has already caused one accident this week."
                maxChars={MAX_CHARS}
                hint="Tip: include what, where, and any safety risk you noticed."
                required
                disabled={phase === 'analyzing'}
              />

              <Input
                label="Locality (optional)"
                name="locality"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. MG Road, Ward 12, Jayanagar"
                leftIcon={<MapPin />}
                hint="Helps route the complaint and detect nearby duplicates."
                disabled={phase === 'analyzing'}
              />

              {/* Image upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-700">
                  Photo <span className="font-normal text-ink-400">(optional)</span>
                </label>

                {imagePreview ? (
                  <div className="relative overflow-hidden rounded-xl border border-ink-200">
                    <img
                      src={imagePreview}
                      alt="Complaint preview"
                      className="max-h-64 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900/70 text-white backdrop-blur-sm transition-colors hover:bg-ink-900"
                      aria-label="Remove photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 px-4 py-8 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/50"
                  >
                    <ImagePlus className="h-7 w-7 text-ink-400" />
                    <span className="text-sm font-medium text-ink-600">
                      Click to upload a photo
                    </span>
                    <span className="text-xs text-ink-400">
                      PNG, JPG or WEBP — up to {MAX_IMAGE_MB} MB
                    </span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageChange}
                  disabled={phase === 'analyzing'}
                />
                {imageError && <p className="text-sm text-error-600">{imageError}</p>}
              </div>
            </div>
          </Card>

          {/* Error state */}
          {phase === 'error' && formError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 animate-slide-up"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error-600" />
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-medium text-error-800">
                  We couldn’t submit your complaint
                </p>
                <p className="text-sm text-error-700">{formError}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetAndRetry}>
                Try again
              </Button>
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-500">
              By submitting, you confirm this report is accurate to the best of your knowledge.
            </p>
            <Button
              type="submit"
              size="lg"
              loading={phase === 'analyzing'}
              rightIcon={phase === 'analyzing' ? undefined : <Send className="h-4 w-4" />}
              className="sm:min-w-[180px]"
            >
              {phase === 'analyzing' ? statusLabel : 'Submit complaint'}
            </Button>
          </div>
        </form>
      )}

      {/* DUPLICATE MODAL */}
      <Modal
        open={dupModalOpen}
        onClose={() => setDupModalOpen(false)}
        title="Possible duplicate complaint"
        description="We found similar complaints already submitted. Do you still want to submit this one?"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setDupModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDuplicateAndSubmit} leftIcon={<ArrowRight className="h-4 w-4" />}>
              Submit anyway
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {dupResult?.matches.slice(0, 3).map((m) => (
            <div key={m.ticket.id} className="rounded-xl border border-ink-200 bg-ink-50/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-ink-800">
                  {m.ticket.ticketNumber}
                </span>
                <span className="text-xs font-medium text-ink-500">
                  {Math.round(m.score * 100)}% match · {m.reason}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-ink-600">
                {m.ticket.translatedSummary}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <CategoryBadge category={m.ticket.category} size="sm" />
                <SeverityBadge severity={m.ticket.severity} size="sm" />
              </div>
            </div>
          ))}
          <p className="text-sm text-ink-500">
            Duplicates are flagged, not deleted. Submitting will record this as a new ticket
            and link it to the matched complaint.
          </p>
        </div>
      </Modal>
    </PageContainer>
  );
}

/** Success screen shown after a ticket is created. */
function SuccessView({
  ticket,
  aiPending,
  onGoToComplaints,
  onSubmitAnother,
}: {
  ticket: ComplaintTicket;
  aiPending: boolean;
  onGoToComplaints?: () => void;
  onSubmitAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyTicketNumber() {
    navigator.clipboard?.writeText(ticket.ticketNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card padding="lg" className="border-success-200 bg-success-50/40">
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-600">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h2 className="text-xl font-bold text-ink-900">Complaint submitted</h2>
          <p className="mt-1.5 max-w-md text-sm text-ink-500">
            Your complaint has been analysed by AI, categorised, and routed to the
            responsible department.
          </p>

          {/* Ticket number */}
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
              Ticket
            </span>
            <span className="font-mono text-base font-semibold text-primary-700">
              {ticket.ticketNumber}
            </span>
            <button
              onClick={copyTicketNumber}
              className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              aria-label="Copy ticket number"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-success-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Demo-mode banner when AI was unavailable */}
      {aiPending && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-warning-300 bg-warning-50 px-4 py-3 animate-slide-up"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-warning-800">
              AI analysis pending — demo mode
            </p>
            <p className="text-sm text-warning-700">
              The Gemini AI service is not configured, so this complaint was saved with
              placeholder analysis fields. An officer must review and classify it manually.
              Once <code className="font-mono text-xs">GEMINI_API_KEY</code> is added to the
              Supabase project, new complaints will be analysed automatically.
            </p>
          </div>
        </div>
      )}

      {/* AI analysis result */}
      <Card padding="lg">
        <CardHeader
          title="AI analysis result"
          subtitle="Automatically generated from your complaint."
          icon={<Sparkles className="h-[18px] w-[18px]" />}
        />

        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Detected language" icon={<Languages className="h-4 w-4" />}>
            {ticket.originalLanguage}
          </Field>
          <Field label="Confidence" icon={<Sparkles className="h-4 w-4" />}>
            <ConfidenceBadge confidence={ticket.confidence} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="English summary">
              {ticket.translatedSummary}
            </Field>
          </div>
          <Field label="Category">
            <CategoryBadge category={ticket.category} />
          </Field>
          <Field label="Severity">
            <SeverityBadge severity={ticket.severity} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Severity reason">{ticket.severityReason}</Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Routed department">
              <DepartmentBadge department={ticket.department} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Suggested action">{ticket.suggestedAction}</Field>
          </div>
        </dl>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onSubmitAnother}>
          Submit another complaint
        </Button>
        {onGoToComplaints && (
          <Button onClick={onGoToComplaints} rightIcon={<ArrowRight className="h-4 w-4" />}>
            View all complaints
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-400">
        {icon && <span className="text-ink-400">{icon}</span>}
        {label}
      </dt>
      <dd className="text-sm text-ink-800">{children}</dd>
    </div>
  );
}
