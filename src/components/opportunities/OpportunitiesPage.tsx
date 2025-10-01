import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

interface Opportunity {
  opportunity_id: string;
  title: string;
  company_name: string;
  stipend_min: number | null;
  stipend_max: number | null;
  location: string;
  work_mode: string;
  application_deadline: string | null;
}

export const OpportunitiesPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOpportunities = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .select(`
            opportunity_id,
            title,
            companies:companies(company_name),
            stipend_min,
            stipend_max,
            location,
            work_mode,
            application_deadline
          `)
          .eq('status', 'active')
          .order('application_deadline', { ascending: true });

        if (error) throw error;

        const formatted = data.map((item: any) => ({
          opportunity_id: item.opportunity_id,
          title: item.title,
          company_name: item.companies?.company_name || 'Unknown Company',
          stipend_min: item.stipend_min,
          stipend_max: item.stipend_max,
          location: item.location ? JSON.stringify(item.location) : 'N/A',
          work_mode: item.work_mode,
          application_deadline: item.application_deadline,
        }));

        setOpportunities(formatted);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load opportunities');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  const filteredOpportunities = opportunities.filter((opp) =>
    opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Browse Opportunities</h1>
        <input
          type="text"
          placeholder="Search opportunities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mb-6 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOpportunities.length > 0 ? (
            filteredOpportunities.map((opp) => (
              <motion.div
                key={opp.opportunity_id}
                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.02 }}
              >
                <h2 className="text-xl font-semibold">{opp.title}</h2>
                <p className="text-gray-600">{opp.company_name}</p>
                <p className="text-gray-500 text-sm">
                  Stipend: {opp.stipend_min ?? 'N/A'} - {opp.stipend_max ?? 'N/A'} INR
                </p>
                <p className="text-gray-500 text-sm">Location: {opp.location}</p>
                <p className="text-gray-500 text-sm">Work Mode: {opp.work_mode}</p>
                <p className="text-gray-500 text-sm">
                  Deadline: {opp.application_deadline ? new Date(opp.application_deadline).toLocaleDateString() : 'N/A'}
                </p>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-600">No opportunities found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
