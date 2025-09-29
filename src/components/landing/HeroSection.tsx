import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDownIcon, PlayIcon } from '@heroicons/react/24/outline';

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  useEffect(() => {
    // Create animated particles
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 4 + 1}px;
        height: ${Math.random() * 4 + 1}px;
        background: linear-gradient(45deg, #667eea, #764ba2);
        border-radius: 50%;
        opacity: ${Math.random() * 0.8 + 0.2};
        animation: float ${Math.random() * 20 + 10}s linear infinite;
        left: ${Math.random() * 100}vw;
        top: ${Math.random() * 100}vh;
      `;
      document.querySelector('.particles-container')?.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 30000);
    };

    const interval = setInterval(createParticle, 200);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { value: '50K+', label: 'Active Students' },
    { value: '500+', label: 'Partner Companies' },
    { value: '95%', label: 'Success Rate' },
    { value: '24/7', label: 'Support' }
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="particles-container absolute inset-0 z-0"></div>
      
      {/* Background Gradient */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20"
      />
      
      {/* Floating Geometric Shapes */}
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-sm"
      />
      
      <motion.div
        animate={{ 
          rotate: -360,
          y: [0, -20, 0],
        }}
        transition={{ 
          rotate: { duration: 25, repeat: Infinity, ease: "linear" },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute bottom-40 left-20 w-20 h-20 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rotate-45 blur-sm"
      />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <motion.h1 
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 1 }}
              >
                <span className="block bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Future of Career
                </span>
                <motion.span 
                  className="block text-gray-800 mt-2"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  Opportunities
                </motion.span>
              </motion.h1>

              <motion.p 
                className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                AI-powered placement platform that connects ambitious students with innovative companies. 
                Transform your career journey with intelligent matching, real-time tracking, and 
                personalized guidance.
              </motion.p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(102, 126, 234, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-medium rounded-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center">
                  Get Started Free
                  <motion.span 
                    className="ml-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-medium rounded-full hover:border-purple-600 hover:text-purple-600 transition-all duration-300"
              >
                <PlayIcon className="h-5 w-5 mr-2 group-hover:text-purple-600" />
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + index * 0.1, duration: 0.6 }}
                >
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-sm md:text-base mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.8 }}
            >
              <span className="text-gray-500 text-sm mb-2">Discover More</span>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="p-2 rounded-full border border-gray-300 hover:border-purple-600 transition-colors cursor-pointer"
              >
                <ChevronDownIcon className="h-6 w-6 text-gray-500 hover:text-purple-600 transition-colors" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(100vh) translateX(0px) rotate(0deg);
          }
          100% {
            transform: translateY(-100vh) translateX(100px) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};