import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface PasswordResetPageProps {
  navigateTo: (path: string) => void;
}

export const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsEmailSent(true);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900/20 via-emerald-900/20 to-teal-900/20 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-labelledby="reset-success-title"
          aria-describedby="reset-success-description"
        >
          <div className="p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-6" aria-hidden="true" />
            <h1 id="reset-success-title" className="text-3xl font-bold text-gray-800 mb-4">Check Your Email</h1>
            <p id="reset-success-description" className="text-gray-600 mb-8">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500" id="reset-instructions">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
              <motion.button
                onClick={() => navigateTo('/')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-describedby="back-to-signin-help"
              >
                Back to Sign In
              </motion.button>
              <div id="back-to-signin-help" className="sr-only">Return to the sign in page</div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        role="main"
        aria-labelledby="reset-password-title"
      >
        <div className="p-8">
          <button
            onClick={() => navigateTo('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded"
            aria-label="Go back to home page"
          >
            <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
            Back
          </button>

          <div className="text-center mb-8">
            <KeyIcon className="w-16 h-16 text-purple-600 mx-auto mb-4" aria-hidden="true" />
            <h1 id="reset-password-title" className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
            <p className="text-gray-600" id="reset-description">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                aria-describedby="email-help"
              />
              <div id="email-help" className="sr-only">Enter the email address associated with your account</div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-describedby="send-reset-help"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </motion.button>
            <div id="send-reset-help" className="sr-only">Send password reset instructions to your email</div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <button
                onClick={() => navigateTo('/')}
                className="text-purple-600 hover:text-purple-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded px-1"
                aria-label="Go to sign in page"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
