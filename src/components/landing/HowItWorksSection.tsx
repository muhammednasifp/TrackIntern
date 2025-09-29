import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  UserPlusIcon, 
  MagnifyingGlassIcon, 
  DocumentTextIcon, 
  CheckBadgeIcon,
  ChatBubbleBottomCenterTextIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const steps = [
  {
    icon: UserPlusIcon,
    title: 'Create Profile',
    description: 'Sign up and build your comprehensive profile with skills, achievements, and career preferences.',
    color: 'from-purple-500 to-indigo-600',
    delay: 0,
  },
  {
    icon: MagnifyingGlassIcon,
    title: 'Discover Opportunities',
    description: 'Browse AI-curated internships and placements tailored to your profile and aspirations.',
    color: 'from-blue-500 to-cyan-600',
    delay: 0.2,
  },
  {
    icon: DocumentTextIcon,
    title: 'Apply Smartly',
    description: 'Submit applications with one click, track progress in real-time, and manage all opportunities.',
    color: 'from-emerald-500 to-teal-600',
    delay: 0.4,
  },
  {
    icon: ChatBubbleBottomCenterTextIcon,
    title: 'Connect & Interview',
    description: 'Communicate with recruiters, schedule interviews, and receive feedback through our platform.',
    color: 'from-orange-500 to-red-600',
    delay: 0.6,
  },
  {
    icon: CheckBadgeIcon,
    title: 'Get Selected',
    description: 'Receive offers, negotiate terms, and finalize your dream internship or placement.',
    color: 'from-pink-500 to-rose-600',
    delay: 0.8,
  },
  {
    icon: TrophyIcon,
    title: 'Accelerate Career',
    description: 'Build experience, gain skills, and use our platform to advance your professional journey.',
    color: 'from-violet-500 to-purple-600',
    delay: 1.0,
  },
];

export const HowItWorksSection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" ref={ref} className="py-20 bg-gray-50">
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
              How TrackIntern Works
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your journey to the perfect internship or placement in 6 simple steps. 
            We've streamlined the entire process to make career advancement effortless.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute inset-0">
            <svg className="w-full h-full" viewBox="0 0 1200 800">
              <motion.path
                d="M 200,150 Q 400,100 600,150 T 1000,150 Q 1000,300 800,400 Q 600,500 400,400 Q 200,300 200,150"
                stroke="url(#gradient)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="10,5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isInView ? { pathLength: 1, opacity: 0.3 } : {}}
                transition={{ duration: 2, delay: 0.5 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ 
                  duration: 0.8, 
                  delay: step.delay,
                  type: "spring",
                  stiffness: 100 
                }}
                whileHover={{ scale: 1.05 }}
              >
                {/* Step Number */}
                <motion.div
                  className="relative mb-6 inline-block"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Outer Ring */}
                  <div className={`w-24 h-24 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center shadow-2xl relative`}>
                    {/* Inner Content */}
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <step.icon className="h-8 w-8 text-gray-700" />
                    </div>
                    
                    {/* Step Number Badge */}
                    <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Pulse Animation */}
                  <motion.div
                    className={`absolute inset-0 w-24 h-24 bg-gradient-to-r ${step.color} rounded-full opacity-20`}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, delay: step.delay }}
                  />
                </motion.div>

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.8, delay: step.delay + 0.3 }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                    {step.description}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Section */}
        <motion.div
          className="mt-20 text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-30 translate-y-30"></div>
          </div>

          <div className="relative z-10">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Career?
            </h3>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of students who have successfully landed their dream internships and placements through TrackIntern.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Your Journey Now
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-purple-600 transition-all duration-300"
              >
                Schedule a Demo
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};