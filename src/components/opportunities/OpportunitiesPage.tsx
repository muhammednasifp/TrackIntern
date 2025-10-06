import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import OpportunityCard, { 
  OpportunityCardOpportunity, 
  StudentProfileSnapshot 
} from './OpportunityCard';
import { useAuthStore } from '../../stores/authStore';

type TabKey = 'internships' | 'placements' | 'all';

interface FetchedOpportunity {
  opportunity_id: string;
  title: string;
  type: 'internship' | 'placement' | null;
  stipend_min?: number | null;
  stipend_max?: number | null;
  currency?: string | null;
  duration_months?: number | null;
  work_mode?: string | null;
  location?: string[] | string | null;
  application_deadline?: string | null;
  created_at?: string | null;
  companies?: {
    company_name?: string | null;
    logo_url?: string | null;
  } | null;
}

const TYPE_TAGS = ['Tech', 'Non-Tech', 'Core', 'Research'] as const;

// Simple debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ShimmerCard: React.FC = () => (
    <div className="animate-pulse rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
      <div className="mb-4 h-6 w-3/4 rounded bg-white/20" />
      <div className="mb-2 h-4 w-1/2 rounded bg-white/10" />
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="h-16 rounded bg-white/10" />
        <div className="h-16 rounded bg-white/10" />
      </div>
      <div className="mt-6 h-10 w-36 rounded-full bg-white/20" />
    </div>
);

const EmptyState: React.FC<{ onClear?: () => void }> = ({ onClear }) => (
  <div className="col-span-full mx-auto w-full max-w-md text-center py-16">
    <div className="mx-auto mb-6 h-24 w-24 rounded-2xl border border-dashed border-white/20 bg-white/5 p-6">
      <MagnifyingGlassIcon className="h-full w-full text-white/40" />
    </div>
    <h3 className="text-xl font-semibold text-white">No opportunities found</h3>
    <p className="mt-2 text-sm text-white/70">Try adjusting your search or clearing filters to see more results.</p>
    {onClear && (
      <button
        onClick={onClear}
        className="mt-6 rounded-full bg-white px-5 py-2 text-sm font-semibold text-purple-700 shadow hover:shadow-lg transition"
      >
        Clear all filters
      </button>
    )}
  </div>
);

const FilterPill: React.FC<{
  checked: boolean;
  onChange: () => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <button
    type="button"
    onClick={onChange}
    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
      checked
        ? 'bg-white text-purple-700 shadow'
        : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
    }`}
  >
    {label}
  </button>
);

export const OpportunitiesPage: React.FC = () => {
  const { user } = useAuthStore();
  const studentId = user?.id || null;

  // Get URL parameters - simple approach without react-router-dom
  const getUrlParam = (key: string) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  };

  const initialTab = ((getUrlParam('tab') as TabKey) || 'internships');
  const initialQuery = getUrlParam('q') || '';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [filters, setFilters] = useState({
    workMode: getUrlParam('workMode') || '',
    types: new Set<string>(),
  });

  const [opportunities, setOpportunities] = useState<FetchedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FetchedOpportunity | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(new Set());

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    params.set('tab', activeTab);
    if (filters.workMode) params.set('workMode', filters.workMode);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [debouncedSearch, activeTab, filters.workMode]);

  // Load saved opportunities from memory (not localStorage)
  const [savedInMemory] = useState<Set<string>>(new Set());

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    const serverType = activeTab === 'internships' ? 'internship' : activeTab === 'placements' ? 'placement' : null;

    try {
      // Build query with server-side filtering
      let query = supabase
        .from('opportunities')
        .select(`
          opportunity_id,
          title,
          type,
          stipend_min,
          stipend_max,
          currency,
          duration_months,
          work_mode,
          location,
          application_deadline,
          created_at,
          companies (
            company_name,
            logo_url
          )
        `)
        .in('status', ['active', 'open'])
        ;

      if (serverType) {
        // Show records matching the tab type OR where type is not set yet (null)
        query = query.or(`type.eq.${serverType},type.is.null`);
      }

      // Apply server-side search filtering
      if (debouncedSearch.trim()) {
        // Search in title, company name, and domain
        query = query.or(`title.ilike.%${debouncedSearch}%,domain.ilike.%${debouncedSearch}%,companies.company_name.ilike.%${debouncedSearch}%`);
      }

      // Apply server-side work mode filtering
      if (filters.workMode) {
        query = query.eq('work_mode', filters.workMode);
      }

      // Apply server-side category filtering
      if (filters.types.size > 0) {
        const categories = Array.from(filters.types);
        query = query.in('category', categories);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching opportunities:', error);
        setOpportunities([]);
      } else if (data) {
        setOpportunities(data as FetchedOpportunity[]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setOpportunities([]);
    }

    setLoading(false);
  }, [activeTab, debouncedSearch, filters.workMode, filters.types]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);
  
  // Since we're now doing server-side filtering, we can use opportunities directly
  const filtered = opportunities;

  const clearAllFilters = () => {
    setFilters({ workMode: '', types: new Set() });
    setSearchQuery('');
  };

  const onToggleSave = (opportunityId: string, next: boolean) => {
    setSavedOpportunities(prev => {
      const copy = new Set(prev);
      if (next) {
        copy.add(opportunityId);
      } else {
        copy.delete(opportunityId);
      }
      return copy;
    });
  };

  const mappedToCard = (o: FetchedOpportunity): OpportunityCardOpportunity => ({
    opportunity_id: o.opportunity_id,
    title: o.title,
    company: o.companies,
    company_name: o.companies?.company_name,
    location: o.location,
    work_mode: o.work_mode,
    stipend_min: o.type === 'internship' ? o.stipend_min : null,
    stipend_max: o.type === 'internship' ? o.stipend_max : null,
    ctc_min: o.type === 'placement' ? o.ctc_min : null,
    ctc_max: o.type === 'placement' ? o.ctc_max : null,
    currency: o.currency,
    duration_months: o.duration_months,
    application_deadline: o.application_deadline,
    created_at: o.created_at,
  });

  // Simple student profile mock (since we don't have the full profile system yet)
  const studentProfile: StudentProfileSnapshot = {
    full_name: user?.email?.split('@')[0] || 'Student',
    college_name: 'Your College',
    course: 'B.Tech',
    resume_url: null,
    skills: [],
    profile_strength: 50,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 px-4 py-6 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6">
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-3xl font-bold text-white">Browse Opportunities</h1>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <BuildingOffice2Icon className="h-5 w-5" />
              <span>{filtered.length} matching opportunities</span>
            </div>
          </div>
        </header>

        <div className="sticky top-16 z-20 py-4 bg-slate-900/50 backdrop-blur-lg -mx-4 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                    {(['internships', 'placements'] as TabKey[]).map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activeTab === tab 
                          ? 'bg-white text-purple-700 shadow' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                    ))}
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />
                        <input 
                          value={searchQuery} 
                          onChange={e => setSearchQuery(e.target.value)} 
                          placeholder="Search by title, company, or domain..."
                          className="w-full rounded-full border border-white/15 bg-white/10 pl-10 pr-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30" 
                        />
                    </div>
                    <button 
                      type="button" 
                      onClick={clearAllFilters} 
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
                    >
                        <XMarkIcon className="h-4 w-4" />
                        Clear Filters
                    </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {TYPE_TAGS.map(t => (
                        <FilterPill
                            key={t}
                            label={t}
                            checked={filters.types.has(t)}
                            onChange={() => {
                              setFilters(prev => {
                                const newTypes = new Set(prev.types);
                                if (newTypes.has(t)) {
                                  newTypes.delete(t);
                                } else {
                                  newTypes.add(t);
                                }
                                return { ...prev, types: newTypes };
                              });
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 mt-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <ShimmerCard key={i} />)
          ) : filtered.length > 0 ? (
            filtered.map(o => (
              <OpportunityCard
                key={o.opportunity_id}
                opportunity={mappedToCard(o)}
                isSaved={savedOpportunities.has(o.opportunity_id)}
                onToggleSave={onToggleSave}
                onClick={() => { 
                  setSelected(o); 
                  setModalOpen(true); 
                }}
                showQuickApply
                studentId={studentId}
                studentProfile={studentProfile}
              />
            ))
          ) : (
            <EmptyState onClear={clearAllFilters} />
          )}
        </section>
      </div>

      {/* Simple Modal Placeholder - ApplicationModal doesn't exist yet */}
      <AnimatePresence>
        {isModalOpen && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selected.title}</h2>
                  <p className="text-gray-600">{selected.companies?.company_name || 'Unknown Company'}</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700">
                  Application modal coming soon! This will allow you to apply for opportunities.
                </p>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};