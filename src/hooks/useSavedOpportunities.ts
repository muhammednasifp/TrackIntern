import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface SavedOpportunityRow {
  opportunity_id: string;
}

interface ToggleSaveError extends Error {
  code?: string;
}

export const useSavedOpportunities = (studentId: string | null) => {
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const fetchSavedOpportunities = async () => {
      if (!studentId) {
        if (isSubscribed) {
          setSavedOpportunities(new Set());
          setError(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from<SavedOpportunityRow>('saved_opportunities')
        .select('opportunity_id')
        .eq('student_id', studentId);

      if (!isSubscribed) return;

      if (fetchError) {
        console.error('Failed to fetch saved opportunities:', fetchError);
        setSavedOpportunities(new Set());
        setError('Unable to load saved opportunities. Please try again later.');
        toast.error('Unable to load saved opportunities');
      } else {
        const ids = new Set((data ?? []).map((item) => item.opportunity_id));
        setSavedOpportunities(ids);
        setError(null);
      }

      setLoading(false);
    };

    fetchSavedOpportunities();

    return () => {
      isSubscribed = false;
    };
  }, [studentId]);

  const isSaved = useCallback(
    (opportunityId: string) => savedOpportunities.has(opportunityId),
    [savedOpportunities],
  );

  const toggleSave = useCallback(
    async (opportunityId: string) => {
      if (!studentId) {
        toast.error('Please sign in to save opportunities');
        return;
      }

      setError(null);

      const wasSaved = savedOpportunities.has(opportunityId);
      const previousState = new Set(savedOpportunities);
      const optimisticState = new Set(previousState);

      if (wasSaved) {
        optimisticState.delete(opportunityId);
        setSavedOpportunities(optimisticState);

        const { error: deleteError } = await supabase
          .from('saved_opportunities')
          .delete()
          .eq('student_id', studentId)
          .eq('opportunity_id', opportunityId);

        if (deleteError) {
          console.error('Failed to remove saved opportunity:', deleteError);
          setSavedOpportunities(previousState);
          const message =
            (deleteError as ToggleSaveError).message || 'Failed to remove opportunity from saved list.';
          setError(message);
          toast.error('Failed to remove from saved. Please try again.');
          throw deleteError;
        }

        toast.success('Removed from saved');
      } else {
        optimisticState.add(opportunityId);
        setSavedOpportunities(optimisticState);

        const { error: insertError } = await supabase.from('saved_opportunities').insert({
          student_id: studentId,
          opportunity_id: opportunityId,
          saved_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error('Failed to save opportunity:', insertError);
          setSavedOpportunities(previousState);
          const message =
            (insertError as ToggleSaveError).message || 'Failed to save opportunity for later.';
          setError(message);
          toast.error('Failed to save opportunity. Please try again.');
          throw insertError;
        }

        toast.success('Saved for later');
      }
    },
    [studentId, savedOpportunities],
  );

  return {
    savedOpportunities,
    isSaved,
    toggleSave,
    loading,
    error,
  };
};