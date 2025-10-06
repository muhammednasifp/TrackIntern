import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Opportunity } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  navigateTo: (path: string) => void;
}

export const CompanyDashboard: React.FC<Props> = ({ navigateTo }) => {
  const { companyId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!companyId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (!error && data) setOpportunities(data as Opportunity[]);
      setLoading(false);
    };
    fetchOpportunities();
  }, [companyId]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your Opportunities</h1>
        <button
          onClick={() => navigateTo('/company/opportunities/new')}
          className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
        >
          Post Opportunity
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : opportunities.length === 0 ? (
        <div className="text-gray-600">No opportunities posted yet.</div>
      ) : (
        <div className="grid gap-4">
          {opportunities.map((opp) => (
            <div key={opp.opportunity_id} className="border rounded-lg p-4 flex items-start justify-between">
              <div>
                <div className="font-medium text-lg">{opp.title}</div>
                <div className="text-sm text-gray-600">{opp.work_mode} • {opp.location && Array.isArray(opp.location) ? (opp.location as any[]).join(', ') : ''}</div>
                <div className="text-xs text-gray-500 mt-1">Status: {opp.status}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm rounded-md border hover:bg-gray-50"
                  onClick={() => navigateTo(`/company/opportunities/${opp.opportunity_id}/applicants`)}
                >
                  View Applicants
                </button>
                <button
                  className="px-3 py-1 text-sm rounded-md border hover:bg-gray-50"
                  onClick={() => navigateTo(`/company/opportunities/${opp.opportunity_id}/edit`)}
                >
                  Edit
                </button>
              </div>
            </div>
          ))
          }
        </div>
      )}
    </div>
  );
};


