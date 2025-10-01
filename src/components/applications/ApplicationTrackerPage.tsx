import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Application {
  application_id: string;
  title: string;
  company_name: string;
  status: string;
}

const statusColumns = [
  'submitted',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'selected',
  'rejected',
];

const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const ApplicationTrackerPage: React.FC = () => {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);

      try {
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('student_id')
          .eq('user_id', user.id)
          .single();

        if (studentError) throw studentError;

        const { data, error: appError } = await supabase
          .from('applications')
          .select(`
            application_id,
            status,
            opportunities (
              title,
              companies (
                company_name
              )
            )
          `)
          .eq('student_id', studentData.student_id);

        if (appError) throw appError;

        const formatted = data.map((item: any) => ({
          application_id: item.application_id,
          title: item.opportunities?.title || 'N/A',
          company_name: item.opportunities?.companies?.company_name || 'N/A',
          status: item.status,
        }));
        setApplications(formatted);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [user]);
    
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">My Applications</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statusColumns.map(status => (
          <div key={status} className="bg-gray-200 rounded-lg p-3">
            <h2 className="font-bold mb-4">{getStatusText(status)}</h2>
            <div className="space-y-3">
              {applications
                .filter(app => app.status === status)
                .map(app => (
                  <motion.div
                    key={app.application_id}
                    className="bg-white p-3 rounded shadow"
                    layout
                  >
                    <h3 className="font-semibold">{app.title}</h3>
                    <p className="text-sm text-gray-600">{app.company_name}</p>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};