import React, { useEffect, useMemo, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import {
  HeartIcon as HeartIconOutline,
  MapPinIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import QuickApplyButton from './QuickApplyButton';

const clsx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

interface OpportunityLocationEntry {
  label?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

interface OpportunityCompanyInfo {
  company_name?: string | null;
  brand_logo_url?: string | null;
  logo_url?: string | null;
  image_url?: string | null;
}

export interface OpportunityCardOpportunity {
  opportunity_id: string;
  title: string;
  company_id?: string | null;
  company_name?: string | null;
  company?: OpportunityCompanyInfo | null;
  brand_logo_url?: string | null;
  company_logo_url?: string | null;
  logo_url?: string | null;
  location?: string[] | OpportunityLocationEntry[] | string | null;
  work_mode?: string | null;
  stipend_min?: number | null;
  stipend_max?: number | null;
  currency?: string | null;
  duration_months?: number | null;
  application_deadline?: string | null;
  created_at?: string | null;
  is_ppo_offered?: boolean | null;
  current_applications?: number | null;
  applications_count?: number | null;
  applicants_count?: number | null;
}

export interface StudentProfileSnapshot {
  full_name?: string | null;
  college_name?: string | null;
  course?: string | null;
  resume_url?: string | null;
  skills?: string[] | null;
  profile_strength?: number | null;
}

interface OpportunityCardProps {
  opportunity: OpportunityCardOpportunity;
  isSaved: boolean;
  onToggleSave: (opportunityId: string, nextState: boolean) => void;
  onClick: (opportunity: OpportunityCardOpportunity) => void;
  showQuickApply?: boolean;
  studentId: string | null;
  studentProfile: StudentProfileSnapshot | null;
}

const currencySymbols: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$',
  AUD: 'A$',
  CAD: 'C$',
};

const getCurrencySymbol = (currency?: string | null) => {
  if (!currency) return '₹';
  const upper = currency.toUpperCase();
  return currencySymbols[upper] ?? `${upper} `;
};

const formatStipendRange = (
  min?: number | null,
  max?: number | null,
  currency?: string | null,
): string => {
  if (min == null && max == null) return 'Stipend not disclosed';
  const formatter = new Intl.NumberFormat('en-IN');
  const symbol = getCurrencySymbol(currency);
  if (min != null && max != null) {
    return `${symbol}${formatter.format(min)} - ${symbol}${formatter.format(max)}`;
  }
  if (min != null) {
    return `From ${symbol}${formatter.format(min)}`;
  }
  return `Up to ${symbol}${formatter.format(max as number)}`;
};

const formatDuration = (months?: number | null): string => {
  if (!months || months <= 0) return 'Flexible duration';
  if (months === 1) return '1 month';
  if (months === 12) return '12 months';
  if (months > 12 && months % 12 === 0) {
    const years = months / 12;
    return years === 1 ? '1 year' : `${years} years`;
  }
  return `${months} months`;
};

const extractLocations = (
  raw: OpportunityCardOpportunity['location'],
): string[] => {
  if (!raw) return [];
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (Array.isArray(raw)) {
    return raw
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry.trim();
        }
        if (entry && typeof entry === 'object') {
          if (entry.label) return entry.label;
          const parts = [entry.city, entry.state, entry.country]
            .filter(Boolean)
            .map((part) => String(part).trim());
          return parts.join(', ');
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof raw === 'object') {
    const entry = raw as OpportunityLocationEntry;
    if (entry.label) return [entry.label];
    const parts = [entry.city, entry.state, entry.country]
      .filter(Boolean)
      .map((part) => String(part).trim());
    if (parts.length) return [parts.join(', ')];
  }
  return [];
};

const getDeadlineCountdown = (deadline?: string | null): string => {
  if (!deadline) return 'No deadline';
  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return 'No deadline';
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Deadline passed';
  if (diffDays === 0) return 'Closing today';
  if (diffDays === 1) return '1 day left';
  return `${diffDays} days left`;
};

const isDeadlineUrgent = (deadline?: string | null): boolean => {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return false;
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
};

const isNewOpportunity = (createdAt?: string | null): boolean => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  return diffMs <= THREE_DAYS_MS;
};

const getWorkModeConfig = (mode?: string | null) => {
  const normalized = (mode ?? '').toLowerCase();
  switch (normalized) {
    case 'remote':
      return { label: 'Remote', className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30' };
    case 'hybrid':
      return { label: 'Hybrid', className: 'bg-sky-500/15 text-sky-300 border border-sky-400/30' };
    case 'onsite':
    case 'on-site':
    case 'in-office':
      return { label: 'Onsite', className: 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-400/30' };
    default:
      return { label: 'Flexible', className: 'bg-slate-500/10 text-slate-200 border border-slate-400/20' };
  }
};

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  isSaved,
  onToggleSave,
  onClick,
  showQuickApply = false,
  studentId,
  studentProfile,
}) => {
  const saveControls = useAnimation();
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      saveControls.set({ scale: 1 });
      hasMountedRef.current = true;
      return;
    }
    if (isSaved) {
      void saveControls.start({
        scale: [1, 1.25, 1],
        transition: { duration: 0.35, ease: 'easeOut' },
      });
    } else {
      void saveControls.start({
        scale: [1, 0.92, 1],
        transition: { duration: 0.3, ease: 'easeInOut' },
      });
    }
  }, [isSaved, saveControls]);

  const companyName = useMemo(() => {
    return (
      opportunity.company?.company_name ||
      opportunity.company_name ||
      'Unknown Company'
    );
  }, [opportunity.company?.company_name, opportunity.company_name]);

  const companyLogo = useMemo(() => {
    return (
      opportunity.company?.brand_logo_url ||
      opportunity.company?.logo_url ||
      opportunity.brand_logo_url ||
      opportunity.company_logo_url ||
      opportunity.logo_url ||
      opportunity.company?.image_url ||
      null
    );
  }, [
    opportunity.brand_logo_url,
    opportunity.company?.brand_logo_url,
    opportunity.company?.image_url,
    opportunity.company?.logo_url,
    opportunity.company_logo_url,
    opportunity.logo_url,
  ]);

  const locations = useMemo(
    () => extractLocations(opportunity.location),
    [opportunity.location],
  );
  const stipendRange = useMemo(
    () =>
      formatStipendRange(
        opportunity.stipend_min,
        opportunity.stipend_max,
        opportunity.currency,
      ),
    [opportunity.currency, opportunity.stipend_max, opportunity.stipend_min],
  );
  const workMode = useMemo(
    () => getWorkModeConfig(opportunity.work_mode),
    [opportunity.work_mode],
  );
  const deadlineCountdown = useMemo(
    () => getDeadlineCountdown(opportunity.application_deadline),
    [opportunity.application_deadline],
  );

  const urgentDeadline = useMemo(
    () => isDeadlineUrgent(opportunity.application_deadline),
    [opportunity.application_deadline],
  );
  const newOpportunity = useMemo(
    () => isNewOpportunity(opportunity.created_at),
    [opportunity.created_at],
  );

  const applicationsCount =
    opportunity.current_applications ??
    opportunity.applicants_count ??
    opportunity.applications_count;

  const handleCardClick = () => {
    onClick(opportunity);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  const handleToggleSave: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    onToggleSave(opportunity.opportunity_id, !isSaved);
  };

  const handleQuickApplyClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const firstLocation = locations[0];
  const remainingLocations = locations.length > 1 ? locations.length - 1 : 0;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        scale: 1.02,
        boxShadow: '0px 25px 45px rgba(15, 23, 42, 0.25)',
      }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="group relative flex h-full flex-col rounded-3xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-purple-400"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-slate-900/40 text-lg font-semibold uppercase text-white shadow-inner">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName ?? 'Company logo'}
                className="h-full w-full object-cover"
              />
            ) : (
              (companyName ?? '').charAt(0) || 'C'
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white md:text-xl">
              {opportunity.title}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-300">
              {companyName}
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          aria-label={isSaved ? 'Remove from saved opportunities' : 'Save opportunity'}
          aria-pressed={isSaved}
          onClick={handleToggleSave}
          animate={saveControls}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          className={clsx(
            'flex h-11 w-11 items-center justify-center rounded-full border transition-colors',
            isSaved
              ? 'border-rose-400/70 bg-rose-500/20 text-rose-300'
              : 'border-white/15 bg-white/10 text-white/70 hover:text-white',
          )}
        >
          {isSaved ? (
            <HeartIconSolid className="h-5 w-5" />
          ) : (
            <HeartIconOutline className="h-5 w-5" />
          )}
        </motion.button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
        <span
          className={clsx(
            'inline-flex items-center rounded-full px-3 py-1 text-xs uppercase tracking-wide',
            workMode.className,
          )}
        >
          {workMode.label}
        </span>
        {newOpportunity && (
          <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs uppercase tracking-wide text-emerald-200">
            New
          </span>
        )}
        {urgentDeadline && (
          <span className="inline-flex items-center rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
            Urgent
          </span>
        )}
        {opportunity.is_ppo_offered && (
          <span className="inline-flex items-center rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-wide text-amber-200">
            PPO Opportunity
          </span>
        )}
        {typeof applicationsCount === 'number' && applicationsCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-400/50 bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-200">
            <UserGroupIcon className="h-4 w-4" />
            {applicationsCount} applicants
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-4 text-sm text-slate-100 md:grid-cols-2">
        <div className="flex items-start gap-2">
          <MapPinIcon className="mt-1 h-5 w-5 text-slate-300/70" />
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-300/70">Location</p>
            {locations.length === 0 && <p className="font-medium">Flexible / Not specified</p>}
            {locations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-slate-100">
                  {firstLocation}
                </span>
                {remainingLocations > 0 && (
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-100">
                    +{remainingLocations} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <ClockIcon className="mt-1 h-5 w-5 text-slate-300/70" />
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-300/70">Stipend</p>
            <p className="font-medium">{stipendRange}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <CalendarDaysIcon className="mt-1 h-5 w-5 text-slate-300/70" />
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-300/70">Deadline</p>
            <p
              className={clsx(
                'font-medium',
                deadlineCountdown === 'Deadline passed' ? 'text-rose-200' : 'text-slate-100',
              )}
            >
              {deadlineCountdown}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <ClockIcon className="mt-1 h-5 w-5 text-slate-300/70" />
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-300/70">Duration</p>
            <p className="font-medium">{formatDuration(opportunity.duration_months)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-end">
        <div className="mt-auto pt-5">
          <div className="flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-300/80">
              Tap to view full opportunity details
            </div>
            {showQuickApply && (
              <div onClick={handleQuickApplyClick} className="sm:ml-auto">
                <QuickApplyButton
                  opportunityId={opportunity.opportunity_id}
                  studentId={studentId ?? ''}
                  studentProfile={studentProfile}
                  disabled={!studentId}
                  onSuccess={() => undefined}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OpportunityCard;