import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'API', href: '#' },
  ],
  company: [
    { name: 'About Us', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Press', href: '#' },
    { name: 'Blog', href: '#' },
  ],
  support: [
    { name: 'Help Center', href: '#' },
    { name: 'Contact Us', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ],
  resources: [
    { name: 'Documentation', href: '#' },
    { name: 'Guides', href: '#' },
    { name: 'Webinars', href: '#' },
    { name: 'Community', href: '#' },
  ],
};

const socialLinks = [
  { name: 'LinkedIn', href: '#', icon: '💼' },
  { name: 'Twitter', href: '#', icon: '🐦' },
  { name: 'Facebook', href: '#', icon: '📘' },
  { name: 'Instagram', href: '#', icon: '📷' },
];

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full -translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full translate-x-48 translate-y-48"></div>
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <motion.div 
                className="flex items-center space-x-2 mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <span className="text-2xl font-bold">TrackIntern</span>
              </motion.div>
              
              <p className="text-gray-400 mb-6 leading-relaxed">
                Revolutionizing career placement with AI-powered matching, real-time tracking, 
                and personalized guidance for students and companies worldwide.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-400">
                  <MapPinIcon className="h-5 w-5" />
                  <span>123 Innovation Street, Tech City, TC 12345</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <PhoneIcon className="h-5 w-5" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <EnvelopeIcon className="h-5 w-5" />
                  <span>hello@trackintern.com</span>
                </div>
              </div>
            </div>

            {/* Links Sections */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <motion.a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      {link.name}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <motion.a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      {link.name}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <motion.a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      {link.name}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <motion.a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      {link.name}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="lg:flex lg:items-center lg:justify-between">
              <div className="lg:w-0 lg:flex-1">
                <h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
                <p className="text-gray-400">
                  Get the latest updates on new features, opportunities, and career insights.
                </p>
              </div>
              <div className="mt-4 lg:mt-0 lg:ml-8">
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:border-purple-500 flex-1 min-w-0"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-r-lg hover:shadow-lg transition-all"
                  >
                    Subscribe
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col lg:flex-row lg:items-center lg:justify-between">
            {/* Social Links */}
            <div className="flex space-x-6">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-lg">{social.icon}</span>
                </motion.a>
              ))}
            </div>

            {/* Copyright */}
            <div className="mt-4 lg:mt-0 text-gray-400 text-sm">
              © 2025 TrackIntern. All rights reserved. Built with 💜 for the future of careers.
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <ArrowUpIcon className="h-6 w-6" />
        </motion.button>
      </div>
    </footer>
  );
};