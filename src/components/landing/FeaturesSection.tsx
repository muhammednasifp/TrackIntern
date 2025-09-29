import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  BoltIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: BoltIcon,
    title: 'AI-Powered Matching',
    description: 'Advanced algorithms match students with perfect opportunities based on skills, preferences, and career goals.',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    icon: ChartBarIcon,
    title: 'Real-Time Analytics',
    description: 'Track application progress, market trends, and success rates with comprehensive analytics dashboard.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: UserGroupIcon,
    title: 'Company Network',
    description: 'Connect with 500+ verified companies from startups to Fortune 500 companies across all industries.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Smart Communication',
    description: 'Integrated messaging system with automated updates, interview scheduling, and document sharing.',
    color: 'from-orange-500 to-red-600',
  },
  {
    icon: AcademicCapIcon,
    title: 'Skill Development',
    description: 'Access personalized learning paths, skill assessments, and certification programs to boost your profile.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: RocketLaunchIcon,
    title: 'Career Acceleration',
    description: 'Fast-track your career with mentorship programs, resume building, and interview preparation tools.',
    color: 'from-violet-500 to-purple-600',
  },
];

export const FeaturesSection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" ref={ref} className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Revolutionary Features
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of career placement with cutting-edge technology 
            designed to accelerate your professional journey.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              {/* Card */}
              <div className="relative h-full p-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:bg-white/80">
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                {/* Icon */}
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl mb-6 shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <feature.icon className="h-8 w-8 text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect Arrow */}
                <motion.div
                  className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ x: -10 }}
                  animate={{ x: 0 }}
                >
                  <div className={`w-8 h-8 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-sm">→</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Explore All Features
            <motion.span 
              className="ml-2"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};