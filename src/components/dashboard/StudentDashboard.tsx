import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  TrophyIcon,
  UserIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export const StudentDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const applications = [
    { id: 1, company: 'Google', position: 'Software Engineer Intern', status: 'under_review', appliedDate: '2025-01-10' },
    { id: 2, company: 'Microsoft', position: 'Product Manager Intern', status: 'interview_scheduled', appliedDate: '2025-01-08' },
    { id: 3, company: 'Amazon', position: 'Data Science Intern', status: 'shortlisted', appliedDate: '2025-01-05' },
    { id: 4, company: 'Meta', position: 'Frontend Developer', status: 'selected', appliedDate: '2025-01-03' },
  ];

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
    switch (status) {
      case 'selected': return 'Selected';
      case 'interview_scheduled': return 'Interview Scheduled';
      case 'shortlisted': return 'Shortlisted';
      case 'under_review': return 'Under Review';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, John!</p>
            </div>
            
            {/* Search */}
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

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Profile Strength', value: '85%', change: '+5%', color: 'text-purple-600' },
            { label: 'Applications', value: '12', change: '+3', color: 'text-blue-600' },
            { label: 'Interviews', value: '4', change: '+1', color: 'text-emerald-600' },
            { label: 'Offers', value: '2', change: '+2', color: 'text-pink-600' },
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
                <div className={`text-sm font-medium ${stat.color}`}>
                  {stat.change}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Applications Widget (Large) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 md:row-span-2 bg-white rounded-xl shadow-sm border p-6"
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
              {applications.map((app, index) => (
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
              ))}
            </div>
          </motion.div>

          {/* Profile Strength Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Profile Strength</h3>
              <UserIcon className="h-6 w-6 text-purple-600" />
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
                    85%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                <motion.div 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: "85%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Resume uploaded</span>
                <span className="text-green-600">✓</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Skills added</span>
                <span className="text-green-600">✓</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Projects added</span>
                <span className="text-yellow-600">⚠</span>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Deadlines */}
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
            
            <div className="space-y-3">
              {[
                { company: 'Tesla', deadline: '2025-01-15', days: 2 },
                { company: 'Netflix', deadline: '2025-01-18', days: 5 },
                { company: 'Spotify', deadline: '2025-01-22', days: 9 },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.company}</p>
                    <p className="text-sm text-gray-600">{new Date(item.deadline).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-medium text-orange-600">
                    {item.days} days
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
              <TrophyIcon className="h-6 w-6 text-yellow-600" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🏆', label: 'Top Applicant', count: 3 },
                { icon: '📚', label: 'Certifications', count: 8 },
                { icon: '🚀', label: 'Projects', count: 12 },
                { icon: '⭐', label: 'Reviews', count: 5 },
              ].map((achievement, index) => (
                <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">{achievement.icon}</div>
                  <div className="text-lg font-bold text-gray-900">{achievement.count}</div>
                  <div className="text-xs text-gray-600">{achievement.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { label: 'Browse Opportunities', color: 'bg-purple-600', icon: '🔍' },
                { label: 'Update Profile', color: 'bg-blue-600', icon: '👤' },
                { label: 'Practice Interview', color: 'bg-emerald-600', icon: '🎤' },
              ].map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-3 ${action.color} text-white rounded-lg font-medium flex items-center space-x-2`}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
