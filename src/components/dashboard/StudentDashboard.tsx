import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { ArrowUpRightIcon, BriefcaseIcon, DocumentTextIcon, CheckCircleIcon, ChartBarIcon, PencilIcon } from '@heroicons/react/24/outline';

interface Stat {
  name: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface UpcomingDeadline {
    opportunity_id: string;
    title: string;
    company_name: string;
    application_deadline: string;
}

interface RecentActivity {
    application_id: string;
    title: string;
    status: string;
    status_updated_at: string;
}

interface StudentDashboardProps {
  navigateTo: (path: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ navigateTo }) => {
  const { user, profile, studentId } = useAuthStore();
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);

        // Fetch application statistics
        const { data: applications, error: appError } = await supabase
          .from('applications')
          .select('status')
          .eq('student_id', studentId);
        
        if (appError) throw appError;

        const totalApps = applications?.length || 0;
        const interviews = applications?.filter(a => 
          ['interview_scheduled', 'interviewed'].includes(a.status)
        ).length || 0;
        const offers = applications?.filter(a => 
          ['selected', 'offer_sent', 'hired'].includes(a.status)
        ).length || 0;
        
        setStats([
          { 
            name: 'Total Applications', 
            value: totalApps, 
            icon: DocumentTextIcon, 
            color: 'text-blue-600', 
            bgColor: 'bg-blue-100' 
          },
          { 
            name: 'Interviews', 
            value: interviews, 
            icon: BriefcaseIcon, 
            color: 'text-purple-600', 
            bgColor: 'bg-purple-100' 
          },
          { 
            name: 'Offers', 
            value: offers, 
            icon: CheckCircleIcon, 
            color: 'text-green-600', 
            bgColor: 'bg-green-100' 
          },
        ]);

        // Fetch recent activity - Fixed the query and mapping
        const { data: activityData, error: activityError } = await supabase
          .from('applications')
          .select(`
            application_id, 
            status, 
            status_updated_at, 
            opportunities!inner(title)
          `)
          .eq('student_id', studentId)
          .order('status_updated_at', { ascending: false })
          .limit(5);
        
        if (activityError) throw activityError;
        
        // Fixed: Properly handle the nested opportunities data
        const formattedActivity: RecentActivity[] = (activityData || []).map((item) => ({
          application_id: item.application_id,
          title: item.opportunities?.title || 'Unknown Opportunity',
          status: item.status,
          status_updated_at: item.status_updated_at
        }));
        
        setRecentActivity(formattedActivity);

        // Fetch upcoming deadlines - assuming the RPC function exists
        const { data: deadlineData, error: deadlineError } = await supabase
          .rpc('get_upcoming_deadlines_for_student', { 
            p_student_id: studentId, 
            p_limit: 3 
          });
        
        if (deadlineError) {
          console.error('Deadline fetch error:', deadlineError);
          // Don't throw here, just set empty deadlines
          setUpcomingDeadlines([]);
        } else {
          setUpcomingDeadlines(deadlineData || []);
        }

      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const profileStrength = profile?.profile_strength || 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">
            Welcome, {profile?.full_name || user?.email?.split('@')[0] || 'Student'}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Here's your job search at a glance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <motion.div 
                  key={stat.name} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.1 * i }} 
                  className="bg-white border border-gray-200/80 rounded-2xl p-6 flex items-start justify-between shadow-sm"
                >
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.name}</p>
                    <p className="text-4xl font-bold mt-2 text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${stat.bgColor} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, i) => (
                    <motion.div 
                      key={activity.application_id} 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: 0.1 * i }} 
                      className="flex justify-between items-center pb-4 border-b last:border-b-0 border-gray-100"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          Status updated to: {' '}
                          <span className="font-medium text-purple-600 capitalize">
                            {activity.status.replace(/_/g, ' ')}
                          </span>
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 ml-4">
                        {new Date(activity.status_updated_at).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No recent application updates.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Profile Strength */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Profile Strength</h2>
                <div className={`flex items-center gap-2 font-bold ${
                  profileStrength > 70 ? 'text-green-600' : 
                  profileStrength > 40 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  <ChartBarIcon className="w-5 h-5" />
                  {profileStrength}%
                </div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full mb-4">
                <motion.div 
                  className="h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${profileStrength}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Complete your profile to increase your visibility to recruiters.
              </p>
              <button 
                onClick={() => navigateTo('/profile')} 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors"
              >
                <PencilIcon className="w-4 h-4" /> 
                Edit Profile
              </button>
            </div>
            
            {/* Upcoming Deadlines */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Upcoming Deadlines</h2>
              <div className="space-y-4">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map(deadline => (
                    <div 
                      key={deadline.opportunity_id} 
                      className="pb-4 border-b last:border-b-0 border-gray-100"
                    >
                      <p className="font-semibold text-gray-800 truncate">
                        {deadline.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {deadline.company_name}
                      </p>
                      <p className="text-sm font-semibold text-red-600 mt-1">
                        {new Date(deadline.application_deadline).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No saved opportunities with upcoming deadlines.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5 }} 
          className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg"
        >
          <div>
            <h2 className="text-2xl font-bold text-white">
              Ready to find your dream internship?
            </h2>
            <p className="text-purple-200 mt-1">
              Browse hundreds of opportunities from top companies.
            </p>
          </div>
          <button 
            onClick={() => navigateTo('/opportunities')} 
            className="px-6 py-3 bg-white text-purple-700 font-bold rounded-full flex items-center gap-2 whitespace-nowrap hover:scale-105 transition-transform shadow"
          >
            Browse Opportunities 
            <ArrowUpRightIcon className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};