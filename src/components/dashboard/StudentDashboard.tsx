import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

interface ApplicationFromSupabase {
  application_id: string;
  status: string;
  applied_date: string;
  opportunities: {
    title: string;
    companies: {
      company_name: string;
    }[];
  }[];
}

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
  appliedDate: string;
}

interface StudentProfile {
  student_id: string;
  full_name: string;
  profile_strength: number;
  resume_url: string | null;
  skills: string[];
  achievements_count: number;
}

interface StudentDashboardProps {
  navigateTo: (path: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ navigateTo }) => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (studentError && studentError.code === 'PGRST116') {
            console.log("No student profile found for this user.");
            setProfile(null);
            setApplications([]);
            setLoading(false);
            return;
        }

        if (studentError) throw new Error(`Error fetching profile: ${studentError.message}`);
        setProfile(studentData);

        if (studentData) {
          const { data: appData, error: appError } = await supabase
            .from('applications')
            .select(`
              application_id,
              status,
              applied_date,
              opportunities (
                title,
                companies (
                  company_name
                )
              )
            `)
            .eq('student_id', studentData.student_id)
            .order('applied_date', { ascending: false })
            .limit(4);

          if (appError) throw new Error(`Error fetching applications: ${appError.message}`);

          const formattedApps = appData.map((app: ApplicationFromSupabase) => ({
            id: app.application_id,
            company: app.opportunities?.[0]?.companies?.[0]?.company_name || 'Unknown Company',
            position: app.opportunities?.[0]?.title || 'Unknown Position',
            status: app.status,
            appliedDate: app.applied_date,
          }));
          setApplications(formattedApps);
        }
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred while fetching your data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selected': return 'bg-green-100 text-green-800 border-green-200';
      case 'interview_scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shortlisted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under_review': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
      return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16 px-4">
              <div className="text-center p-8 bg-white rounded-lg shadow-md border border-red-200">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Could not load dashboard</h2>
                <p className="text-gray-600">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    Try Again
                </button>
              </div>
          </div>
      )
  }

  const interviewCount = 0;
  const offerCount = 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {profile?.full_name || 'Student'}!</p>
            </div>

            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {!profile && (
             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm mb-8">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                        Your profile is not complete.
                        <button onClick={() => navigateTo('/profile')} className="font-medium underline text-yellow-800 hover:text-yellow-900 ml-2 bg-transparent border-none cursor-pointer">
                            Create your student profile
                        </button>
                        {' '}to start applying for opportunities.
                        </p>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Profile Strength', value: `${profile?.profile_strength || 0}%`, color: 'text-purple-600' },
            { label: 'Applications', value: applications.length, color: 'text-blue-600' },
            { label: 'Interviews', value: interviewCount, color: 'text-emerald-600' },
            { label: 'Offers', value: offerCount, color: 'text-pink-600' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                View All
              </motion.button>
            </div>

            <div className="space-y-4">
              {applications.length > 0 ? (
                applications.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {app.company.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{app.position}</h4>
                        <p className="text-sm text-gray-600">{app.company}</p>
                        <p className="text-xs text-gray-500">Applied on {new Date(app.appliedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(app.status)}`}>
                      {getStatusText(app.status)}
                    </span>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>You haven't applied to any opportunities yet.</p>
                  <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">Browse Opportunities</button>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Profile Strength</h3>
              <button onClick={() => navigateTo('/profile')} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                <UserIcon className="h-6 w-6 text-purple-600" />
              </button>
            </div>

            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                    Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-purple-600">
                    {profile?.profile_strength || 0}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                <motion.div
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${profile?.profile_strength || 0}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Resume uploaded</span>
                <span className={profile?.resume_url ? 'text-green-600' : 'text-gray-400'}>{profile?.resume_url ? '✓' : '–'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Skills added</span>
                <span className={profile && profile.skills.length > 0 ? 'text-green-600' : 'text-gray-400'}>{profile && profile.skills.length > 0 ? '✓' : '–'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Achievements added</span>
                <span className={profile && profile.achievements_count > 0 ? 'text-green-600' : 'text-yellow-600'}>{profile && profile.achievements_count > 0 ? '✓' : '⚠'}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Deadlines</h3>
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-center py-10 text-gray-500">
              <p>No upcoming deadlines.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-3 bg-white rounded-xl shadow-sm border p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <motion.button
                  onClick={() => navigateTo('/opportunities')}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-3 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2`}
                >
                  <span>🔍</span>
                  <span>Browse Opportunities</span>
                </motion.button>
                <motion.button
                  onClick={() => navigateTo('/profile')}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2`}
                >
                  <span>👤</span>
                  <span>Update Profile</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-3 bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2`}
                >
                  <span>🎤</span>
                  <span>Practice Interview</span>
                </motion.button>

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
