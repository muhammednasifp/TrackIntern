import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface HeroSectionProps {
  onLoginClick: () => void;
  onGetStartedClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLoginClick, onGetStartedClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  useEffect(() => {
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

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      <div className="particles-container absolute inset-0 z-0"></div>
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-indigo-900/10"
      />
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }}}
        className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-sm"
      />
      <motion.div
        animate={{ rotate: -360, y: [0, -20, 0] }}
        transition={{ rotate: { duration: 25, repeat: Infinity, ease: "linear" }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" }}}
        className="absolute bottom-40 left-20 w-20 h-20 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rotate-45 blur-sm"
      />
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900">
                <span className="block">A Better Way To</span>
                <motion.span
                  className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  Build Your Future
                </motion.span>
              </h1>
              <motion.p
                className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Our platform helps you connect with companies, manage applications, 
                and take the first step towards your dream career.
              </motion.p>
            </motion.div>
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <motion.button
                onClick={onGetStartedClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-medium rounded-full"
              >
                Get Started
              </motion.button>
              <motion.button
                onClick={onLoginClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-medium rounded-full hover:border-purple-600 hover:text-purple-600 transition-all duration-300"
              >
                Login
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};