import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { motion } from 'framer-motion';

interface Application {
  application_id: string;
  title: string;
  company_name: string;
  status: string;
}

const statusColumns = [
  { id: 'submitted', title: 'Submitted' },
  { id: 'under_review', title: 'Under Review' },
  { id: 'shortlisted', title: 'Shortlisted' },
  { id: 'interview_scheduled', title: 'Interview' },
  { id: 'selected', title: 'Selected' },
  { id: 'rejected', title: 'Rejected' },
];

export const ApplicationTrackerPage: React.FC = () => {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) { 
        setLoading(false); 
        return; 
      }
      
      setLoading(true);
      setError(null);

      try {
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('student_id')
          .eq('user_id', user.id)
          .single();

        if (studentError) throw studentError;
        if (!studentData) {
          setApplications([]);
          setLoading(false);
          return;
        }

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

        // Fixed: Properly type the data transformation
        interface ApplicationData {
          application_id: string;
          status: string;
          opportunities?: {
            title?: string;
            companies?: {
              company_name?: string;
            };
          };
        }

        const formatted = (data as ApplicationData[] || []).map((item) => ({
          application_id: item.application_id,
          title: item.opportunities?.title || 'N/A',
          company_name: item.opportunities?.companies?.company_name || 'N/A',
          status: item.status,
        }));
        
        setApplications(formatted);
        return studentData.student_id;
      } catch (err) {
        // Fixed: Properly handle the error type
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An unexpected error occurred');
        }
        console.error('Error fetching applications:', err);
        return null;
      } finally {
        setLoading(false);
      }
    };
    
    let channel: any = null;
    
    const setupRealtimeSubscription = async () => {
      const studentId = await fetchApplications();
      
      if (!studentId) return;
      
      // Set up real-time subscription for application updates
      channel = supabase
        .channel('application-updates')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'applications',
            filter: `student_id=eq.${studentId}`
          },
          (payload) => {
            console.log('Application update received:', payload);
            // Re-fetch applications when changes occur
            fetchApplications();
          }
        )
        .subscribe();
    };
    
    setupRealtimeSubscription();
    
    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);
    
  const applicationsByStatus = useMemo(() => {
    return statusColumns.reduce((acc, column) => {
      acc[column.id] = applications.filter(app => app.status === column.id);
      return acc;
    }, {} as Record<string, Application[]>);
  }, [applications]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Application Tracker
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Manage and track all your job applications in one place.
          </p>
        </motion.div>
        
        {error && (
          <div 
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" 
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {statusColumns.map((column, index) => (
            <div 
              key={column.id} 
              className="bg-gray-100 rounded-xl w-72 flex-shrink-0"
            >
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  {column.title}
                  <span className="text-sm font-normal text-gray-500 bg-gray-200 rounded-full px-2">
                    {applicationsByStatus[column.id]?.length || 0}
                  </span>
                </h2>
              </div>
              
              <div className="p-4 space-y-4 h-[60vh] overflow-y-auto">
                {applicationsByStatus[column.id] && applicationsByStatus[column.id].length > 0 ? (
                  applicationsByStatus[column.id].map((app, appIndex) => (
                    <motion.div
                      key={app.application_id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index * 0.1) + (appIndex * 0.05) }}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200/80 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {app.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {app.company_name}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center text-sm text-gray-400 pt-10">
                    No applications in this stage.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};