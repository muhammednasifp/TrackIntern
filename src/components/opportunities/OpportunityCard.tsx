import React, { useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import {
  HeartIcon as HeartIconOutline,
  MapPinIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon, // ✅ Changed from UserGroupIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, CurrencyRupeeIcon } from '@heroicons/react/24/solid';

// Interface for the data object passed to this component
export interface OpportunityCardOpportunity {
  opportunity_id: string;
  title?: string | null;
  company?: {
    company_name?: string | null;
    brand_logo_url?: string | null;
    logo_url?: string | null;
    image_url?: string | null;
  } | null;
  company_name?: string | null;
  location?: any;
  work_mode?: string | null;
  stipend_min?: number | null;
  stipend_max?: number | null;
  ctc_min?: number | null; // For placements
  ctc_max?: number | null; // For placements
  currency?: string | null;
  duration_months?: number | null;
  application_deadline?: string | null;
  created_at?: string | null;
  is_ppo_offered?: boolean | null;
  current_applications?: number | null;
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

const getCurrencySymbol = (currency?: string | null) => {
  const currencySymbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€' };
  if (!currency) return '₹';
  return currencySymbols[currency.toUpperCase()] ?? `${currency.toUpperCase()} `;
};

const formatCompensationRange = (
  min?: number | null,
  max?: number | null,
  currency?: string | null,
  type: 'stipend' | 'salary' = 'stipend'
): string => {
  if (min == null && max == null) return 'Not Disclosed';
  
  const isSalary = type === 'salary';
  const formatter = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 1,
      notation: isSalary && (min || max || 0) > 99999 ? 'compact' : 'standard',
  });
  
  const symbol = getCurrencySymbol(currency);
  const suffix = isSalary ? ' p.a.' : ' /month';

  const formatValue = (val: number) => `${symbol}${formatter.format(val)}`;

  if (min != null && max != null) {
    if (min === max) return `${formatValue(min)}${suffix}`;
    return `${formatValue(min)} - ${formatValue(max)}${suffix}`;
  }
  if (min != null) return `From ${formatValue(min)}${suffix}`;
  return `Up to ${formatValue(max as number)}${suffix}`;
};

const formatDuration = (months?: number | null): string => {
  if (!months || months <= 0) return 'Flexible';
  if (months === 1) return '1 month';
  return `${months} months`;
};

const extractLocations = (raw: OpportunityCardOpportunity['location']): string[] => {
  if (!raw) return [];
  if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
  if (Array.isArray(raw)) return raw.map(entry => (typeof entry === 'string' ? entry.trim() : entry?.city || '')).filter(Boolean);
  return [];
};

const getDeadlineCountdown = (deadline?: string | null): string => {
  if (!deadline) return 'No deadline';
  const diffDays = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Deadline passed';
  if (diffDays === 0) return 'Closing today';
  return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
};

const isNewOpportunity = (createdAt?: string | null): boolean => {
  if (!createdAt) return false;
  const diffMs = new Date().getTime() - new Date(createdAt).getTime();
  return diffMs <= 3 * 24 * 60 * 60 * 1000;
};

const getWorkModeConfig = (mode?: string | null) => {
  const normalized = (mode ?? '').toLowerCase();
  switch (normalized) {
    case 'remote': return { label: 'Remote', className: 'bg-emerald-500/15 text-emerald-300' };
    case 'hybrid': return { label: 'Hybrid', className: 'bg-sky-500/15 text-sky-300' };
    case 'onsite': return { label: 'Onsite', className: 'bg-fuchsia-500/15 text-fuchsia-300' };
    default: return { label: 'Flexible', className: 'bg-slate-500/10 text-slate-200' };
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
  
  const companyName = opportunity.company?.company_name || opportunity.company_name || 'Unknown Company';
  const companyLogo = opportunity.company?.brand_logo_url || null;
  
  const locations = useMemo(() => extractLocations(opportunity.location), [opportunity.location]);
  const isPlacement = opportunity.ctc_min != null || opportunity.ctc_max != null;

  const compensation = useMemo(() => formatCompensationRange(
      isPlacement ? opportunity.ctc_min : opportunity.stipend_min,
      isPlacement ? opportunity.ctc_max : opportunity.stipend_max,
      opportunity.currency,
      isPlacement ? 'salary' : 'stipend'
  ), [opportunity, isPlacement]);

  const workMode = getWorkModeConfig(opportunity.work_mode);
  const deadlineCountdown = getDeadlineCountdown(opportunity.application_deadline);
  const newOpportunity = isNewOpportunity(opportunity.created_at);

  return (
    <motion.div
        role="button"
        tabIndex={0}
        onClick={() => onClick(opportunity)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick(opportunity);
          }
        }}
        whileHover={{ y: -5, scale: 1.02 }}
        className="group relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900/40 text-lg font-semibold">
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt={`${companyName} logo`} 
                className="h-full w-full object-cover rounded-2xl" 
              />
            ) : (
              companyName.charAt(0)
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{opportunity.title}</h3>
            <p className="mt-1 text-sm text-slate-300">{companyName}</p>
          </div>
        </div>
        <motion.button
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              onToggleSave(opportunity.opportunity_id, !isSaved); 
            }}
            animate={saveControls}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              isSaved 
                ? 'bg-rose-500/20 text-rose-300' 
                : 'bg-white/10 text-white/70 hover:text-white'
            }`}
            aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
        >
          {isSaved ? (
            <HeartIconSolid className="h-5 w-5" />
          ) : (
            <HeartIconOutline className="h-5 w-5" />
          )}
        </motion.button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${workMode.className}`}>
          {workMode.label}
        </span>
        {newOpportunity && (
          <span className="inline-flex items-center rounded-full bg-blue-500/15 px-3 py-1 font-semibold text-blue-300">
            New
          </span>
        )}
        {opportunity.is_ppo_offered && (
          <span className="inline-flex items-center rounded-full bg-green-500/15 px-3 py-1 font-semibold text-green-300">
            PPO
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-100">
        <div className="flex items-start gap-2">
            <CurrencyRupeeIcon className="mt-0.5 h-5 w-5 text-slate-300/70" />
            <div>
                <p className="text-xs uppercase tracking-wide text-slate-300/70">
                  {isPlacement ? 'Salary (CTC)' : 'Stipend'}
                </p>
                <p className="font-medium">{compensation}</p>
            </div>
        </div>
        <div className="flex items-start gap-2">
            <ClockIcon className="mt-0.5 h-5 w-5 text-slate-300/70" />
            <div>
                <p className="text-xs uppercase tracking-wide text-slate-300/70">Duration</p>
                <p className="font-medium">{formatDuration(opportunity.duration_months)}</p>
            </div>
        </div>
        <div className="flex items-start gap-2 col-span-2">
            <MapPinIcon className="mt-0.5 h-5 w-5 text-slate-300/70" />
            <div>
                <p className="text-xs uppercase tracking-wide text-slate-300/70">Location</p>
                <p className="font-medium">
                  {locations.length > 0 ? locations.join(', ') : 'Flexible'}
                </p>
            </div>
        </div>
        {opportunity.current_applications != null && (
          <div className="flex items-start gap-2 col-span-2">
              <UsersIcon className="mt-0.5 h-5 w-5 text-slate-300/70" />
              <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300/70">Applicants</p>
                  <p className="font-medium">{opportunity.current_applications} applied</p>
              </div>
          </div>
        )}
      </div>

      <div className="flex-grow" />

      <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300/80">
              <CalendarDaysIcon className="h-4 w-4" />
              <span>
                Apply by: <strong>{deadlineCountdown}</strong>
              </span>
          </div>
          {showQuickApply && studentId && studentProfile && (
              <div onClick={(e) => e.stopPropagation()}>
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!studentId}
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement quick apply functionality
                      console.log('Quick apply:', opportunity.opportunity_id);
                    }}
                  >
                    Quick Apply
                  </button>
              </div>
          )}
      </div>
    </motion.div>
  );
};

export default OpportunityCard;