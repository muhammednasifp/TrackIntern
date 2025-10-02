import React, { useState, useEffect, useRef } from 'react';
import { motion, animate } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import ShinyText from '../ui/ShinyText';
import { 
  ArrowUpRightIcon, 
  BriefcaseIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ChartBarIcon, 
  PencilIcon,
  RocketLaunchIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

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

interface FetchedActivity {
  application_id: string;
  status: string;
  status_updated_at: string;
  opportunities: {
    title: string;
  } | null;
}

interface ProfileCompletionItem {
  text: string;
  points: number;
  link: string;
  completed: boolean;
}

interface RecommendedOpportunity {
  opportunity_id: string;
  title: string;
  companies?: {
    company_name: string;
  } | null;
  stipend_min?: number;
  stipend_max?: number;
  ctc_min?: number;
  ctc_max?: number;
  currency?: string;
}

interface StudentDashboardProps {
  navigateTo: (path: string) => void;
}

// Animated Counter Component
const Counter: React.FC<{ from: number; to: number; duration?: number; className?: string }> = ({ 
  from, 
  to, 
  duration = 1,
  className = "text-4xl font-bold mt-2 text-gray-800"
}) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(from, to, {
      duration,
      onUpdate(value) {
        node.textContent = Math.round(value).toString();
      }
    });

    return () => controls.stop();
  }, [from, to, duration]);

  return <span ref={nodeRef} className={className}>{from}</span>;
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ navigateTo }) => {
  const { user, profile, studentId } = useAuthStore();
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [recommendedOpportunities, setRecommendedOpportunities] = useState<RecommendedOpportunity[]>([]);
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
        const interviews =
          applications?.filter(a => ['interview_scheduled', 'interviewed'].includes(a.status)).length || 0;
        const offers =
          applications?.filter(a => ['selected', 'offer_sent', 'hired'].includes(a.status)).length || 0;

        setStats([
          {
            name: 'Total Applications',
            value: totalApps,
            icon: DocumentTextIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
          },
          {
            name: 'Interviews',
            value: interviews,
            icon: BriefcaseIcon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
          },
          {
            name: 'Offers',
            value: offers,
            icon: CheckCircleIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
          },
        ]);

        // Fetch recent activity
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
          .limit(5)
          .returns<FetchedActivity[]>();

        if (activityError) throw activityError;

        const formattedActivity: RecentActivity[] = activityData
          ? activityData.map(item => ({
              application_id: item.application_id,
              title: item.opportunities?.title || 'Unknown Opportunity',
              status: item.status,
              status_updated_at: item.status_updated_at,
            }))
          : [];

        setRecentActivity(formattedActivity);

        // Fetch upcoming deadlines
        const { data: deadlineData, error: deadlineError } = await supabase.rpc('get_upcoming_deadlines_for_student', {
          p_student_id: studentId,
          p_limit: 3,
        });

        if (deadlineError) {
          console.error('Deadline fetch error:', deadlineError);
          setUpcomingDeadlines([]);
        } else {
          setUpcomingDeadlines(deadlineData || []);
        }

        // Fetch recommended opportunities if no upcoming deadlines
        if (!deadlineData || deadlineData.length === 0) {
          const { data: recommendedData, error: recommendedError } = await supabase
            .from('opportunities')
            .select(`
              opportunity_id,
              title,
              stipend_min,
              stipend_max,
              ctc_min,
              ctc_max,
              currency,
              companies (
                company_name
              )
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(3);

          if (!recommendedError && recommendedData) {
            setRecommendedOpportunities(recommendedData as RecommendedOpportunity[]);
          }
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

  // Determine the name to display - prioritize full name, then create a proper username
  const getDisplayName = () => {
    // First, check if we have a full name from profile or user metadata
    if (profile?.full_name?.trim()) {
      return profile.full_name;
    }
    
    if (user?.user_metadata?.full_name?.trim()) {
      return user.user_metadata.full_name;
    }
    
    // If no full name, create a proper username from email
    if (user?.email) {
      const emailUsername = user.email.split('@')[0];
      // Convert to a more readable format (capitalize first letter, handle numbers/special chars)
      return emailUsername
        .replace(/[._-]/g, ' ') // Replace dots, underscores, hyphens with spaces
        .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
        .replace(/\d+/g, '') // Remove numbers
        .trim() || 'User'; // Fallback if nothing remains
    }
    
    return 'Student';
  };

  const displayName = getDisplayName();

  // Generate profile completion items
  const profileCompletionItems: ProfileCompletionItem[] = [
    {
      text: 'Upload your resume',
      points: 10,
      link: '/profile',
      completed: !!(profile?.resume_url)
    },
    {
      text: 'Add at least 5 skills',
      points: 15,
      link: '/profile',
      completed: (profile?.skills?.length || 0) >= 5
    },
    {
      text: 'Write a short bio',
      points: 5,
      link: '/profile',
      completed: !!(profile?.bio?.trim())
    },
    {
      text: 'Complete academic details',
      points: 10,
      link: '/profile',
      completed: !!(profile?.college_name && profile?.course)
    },
    {
      text: 'Add social links',
      points: 5,
      link: '/profile',
      completed: !!(profile?.linkedin_url || profile?.github_url)
    }
  ].filter(item => !item.completed).slice(0, 3); // Show top 3 incomplete items

  // Animation variants for staggered loading
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen text-gray-800 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-2">
            <ShinyText 
              text={`Welcome, ${displayName}`}
              speed={3}
              className="text-4xl font-bold text-gray-900"
            />
          </h1>
          <p className="text-lg text-gray-600 mb-8">Here's your job search at a glance.</p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.name}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="bg-white border border-gray-200/80 rounded-2xl p-6 flex items-start justify-between shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.name}</p>
                    <Counter from={0} to={stat.value} duration={1 + i * 0.2} />
                  </div>
                  <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${stat.bgColor} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, i) => (
                    <motion.div
                      key={activity.application_id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex justify-between items-center pb-4 border-b last:border-b-0 border-gray-100 cursor-pointer"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 truncate">{activity.title}</p>
                        <p className="text-sm text-gray-500">
                          Status updated to:{' '}
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
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                      <RocketLaunchIcon className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to launch your career?</h3>
                    <p className="text-gray-500 mb-6">Your application journey starts here. Browse opportunities and find your perfect match.</p>
                    <motion.button
                      onClick={() => navigateTo('/opportunities')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-shadow"
                    >
                      Find an Internship
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="space-y-8">
            {/* Profile Completion Checklist */}
            <motion.div variants={itemVariants} className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Complete Your Profile</h2>
                <div
                  className={`flex items-center gap-2 font-bold ${
                    profileStrength > 70 ? 'text-green-600' : profileStrength > 40 ? 'text-amber-600' : 'text-red-600'
                  }`}
                >
                  <ChartBarIcon className="w-5 h-5" />
                  {profileStrength}%
                </div>
              </div>
              
              <div className="w-full h-3 bg-gray-200 rounded-full mb-6">
                <motion.div
                  className="h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${profileStrength}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>

              {profileCompletionItems.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {profileCompletionItems.map((item, index) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                      onClick={() => navigateTo(item.link)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 cursor-pointer transition-all group"
                    >
                      <div className="w-5 h-5 border-2 border-gray-300 rounded group-hover:border-purple-400 flex items-center justify-center">
                        <CheckIcon className="w-3 h-3 text-transparent group-hover:text-purple-400 transition-colors" />
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-700 group-hover:text-purple-700">{item.text}</span>
                        <span className="text-green-600 font-medium ml-2">(+{item.points}%)</span>
                      </div>
                      <ArrowUpRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 mb-6"
                >
                  <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <h3 className="font-semibold text-gray-800 mb-1">Profile Complete!</h3>
                  <p className="text-sm text-gray-500">Great job! Your profile is looking strong.</p>
                </motion.div>
              )}

              <motion.button
                onClick={() => navigateTo('/profile')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
              >
                <PencilIcon className="w-4 h-4" />
                Edit Profile
              </motion.button>
            </motion.div>

            {/* Upcoming Deadlines / Recommendations */}
            <motion.div variants={itemVariants} className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">
                {upcomingDeadlines.length > 0 ? 'Upcoming Deadlines' : 'Recommended For You'}
              </h2>
              <div className="space-y-4">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((deadline, index) => (
                    <motion.div 
                      key={deadline.opportunity_id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="pb-4 border-b last:border-b-0 border-gray-100 cursor-pointer hover:bg-gray-50/50 p-2 rounded-lg transition-all"
                    >
                      <p className="font-semibold text-gray-800 truncate">{deadline.title}</p>
                      <p className="text-sm text-gray-500">{deadline.company_name}</p>
                      <p className="text-sm font-semibold text-red-600 mt-1">
                        {new Date(deadline.application_deadline).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </motion.div>
                  ))
                ) : recommendedOpportunities.length > 0 ? (
                  recommendedOpportunities.map((opportunity, index) => (
                    <motion.div
                      key={opportunity.opportunity_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      onClick={() => navigateTo('/opportunities')}
                      className="p-4 border border-gray-100 rounded-lg hover:border-purple-200 hover:shadow-md cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800 group-hover:text-purple-700 truncate">
                          {opportunity.title}
                        </h3>
                        <ArrowUpRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-500 flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{opportunity.companies?.company_name || 'Company'}</p>
                      {(opportunity.stipend_min || opportunity.ctc_min) && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {opportunity.stipend_min 
                              ? `₹${opportunity.stipend_min}${opportunity.stipend_max ? `-${opportunity.stipend_max}` : '+'}/month`
                              : `₹${opportunity.ctc_min}${opportunity.ctc_max ? `-${opportunity.ctc_max}` : '+'} LPA`
                            }
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <p className="text-gray-500">No saved opportunities with upcoming deadlines.</p>
                    <motion.button
                      onClick={() => navigateTo('/opportunities')}
                      whileHover={{ scale: 1.05 }}
                      className="mt-4 px-4 py-2 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Browse Opportunities →
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Application Pipeline */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mt-12 bg-white border border-gray-200/80 rounded-2xl p-8 shadow-sm"
        >
          <h2 className="text-2xl font-semibold mb-8 text-center">Your Application Pipeline</h2>
          
          {/* Desktop Layout with Integrated Arrows */}
          <div className="hidden md:flex items-center justify-center">
            {[
              { label: 'Submitted', status: ['submitted'], color: 'bg-blue-500', textColor: 'text-blue-700' },
              { label: 'Under Review', status: ['under_review'], color: 'bg-yellow-500', textColor: 'text-yellow-700' },
              { label: 'Interview', status: ['interview_scheduled', 'interviewed'], color: 'bg-purple-500', textColor: 'text-purple-700' },
              { label: 'Offer', status: ['selected', 'offer_sent', 'hired'], color: 'bg-green-500', textColor: 'text-green-700' }
            ].map((stage, index) => {
              const count = stats.find(s => s.name === 'Total Applications')?.value || 0;
              const stageCount = stage.status.includes('submitted') ? count :
                               stage.status.includes('under_review') ? Math.max(0, Math.floor(count * 0.4)) :
                               stage.status.includes('interview_scheduled') ? stats.find(s => s.name === 'Interviews')?.value || 0 :
                               stats.find(s => s.name === 'Offers')?.value || 0;
              
              return (
                <React.Fragment key={stage.label}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all cursor-pointer min-w-[140px]"
                  >
                    <div className={`w-16 h-16 ${stage.color} rounded-full flex items-center justify-center mb-3 shadow-lg`}>
                      <Counter 
                        from={0} 
                        to={stageCount} 
                        duration={1 + index * 0.2}
                        className="text-2xl font-bold text-white"
                      />
                    </div>
                    <h3 className={`font-semibold ${stage.textColor} mb-1`}>{stage.label}</h3>
                    <p className="text-xs text-gray-500 text-center">
                      {stageCount === 1 ? '1 application' : `${stageCount} applications`}
                    </p>
                  </motion.div>
                  
                  {/* Arrow between stages (not after the last one) */}
                  {index < 3 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="mx-4 flex items-center"
                    >
                      <svg 
                        className="w-8 h-8 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M13 7l5 5m0 0l-5 5m5-5H6" 
                        />
                      </svg>
                    </motion.div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile Layout - Vertical Stack */}
          <div className="md:hidden space-y-6">
            {[
              { label: 'Submitted', status: ['submitted'], color: 'bg-blue-500', textColor: 'text-blue-700' },
              { label: 'Under Review', status: ['under_review'], color: 'bg-yellow-500', textColor: 'text-yellow-700' },
              { label: 'Interview', status: ['interview_scheduled', 'interviewed'], color: 'bg-purple-500', textColor: 'text-purple-700' },
              { label: 'Offer', status: ['selected', 'offer_sent', 'hired'], color: 'bg-green-500', textColor: 'text-green-700' }
            ].map((stage, index) => {
              const count = stats.find(s => s.name === 'Total Applications')?.value || 0;
              const stageCount = stage.status.includes('submitted') ? count :
                               stage.status.includes('under_review') ? Math.max(0, Math.floor(count * 0.4)) :
                               stage.status.includes('interview_scheduled') ? stats.find(s => s.name === 'Interviews')?.value || 0 :
                               stats.find(s => s.name === 'Offers')?.value || 0;
              
              return (
                <React.Fragment key={`mobile-${stage.label}`}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className={`w-14 h-14 ${stage.color} rounded-full flex items-center justify-center mr-4 shadow-lg`}>
                      <Counter 
                        from={0} 
                        to={stageCount} 
                        duration={1 + index * 0.2}
                        className="text-xl font-bold text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${stage.textColor} mb-1`}>{stage.label}</h3>
                      <p className="text-sm text-gray-500">
                        {stageCount === 1 ? '1 application' : `${stageCount} applications`}
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* Vertical arrow for mobile */}
                  {index < 3 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex justify-center"
                    >
                      <svg 
                        className="w-6 h-6 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M7 13l5 5m0 0l5-5m-5 5V6" 
                        />
                      </svg>
                    </motion.div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
};