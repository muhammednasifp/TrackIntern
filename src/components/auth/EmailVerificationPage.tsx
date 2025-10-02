import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface EmailVerificationPageProps {
  navigateTo: (path: string) => void;
}

export const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({ navigateTo }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const checkVerification = async () => {
      if (!user) {
        navigateTo('/');
        return;
      }

      try {
        // Refresh the user session to get latest verification status
        const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (refreshedUser?.email_confirmed_at) {
          setIsVerified(true);
        }
      } catch (err) {
        console.error('Error checking verification:', err);
        setError('Failed to check verification status');
      } finally {
        setIsLoading(false);
      }
    };

    checkVerification();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at) {
        setIsVerified(true);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [user, navigateTo]);

  const handleResendEmail = async () => {
    if (!user?.email) return;

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast.success('Verification email sent! Please check your inbox.');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20">
        <div className="text-center" role="status" aria-live="polite">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900/20 via-emerald-900/20 to-teal-900/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md mx-4"
          role="dialog"
          aria-labelledby="verification-success-title"
          aria-describedby="verification-success-description"
        >
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" aria-hidden="true" />
          <h1 id="verification-success-title" className="text-3xl font-bold text-gray-800 mb-4">Email Verified!</h1>
          <p id="verification-success-description" className="text-gray-600 mb-8">
            Your email has been successfully verified. You can now access all features of TrackIntern.
          </p>
          <motion.button
            onClick={() => navigateTo('/dashboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-full hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-describedby="continue-button-help"
          >
            Continue to Dashboard
          </motion.button>
          <div id="continue-button-help" className="sr-only">Navigate to your dashboard to start using TrackIntern</div>
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
        aria-labelledby="verify-email-title"
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
            <EnvelopeIcon className="w-16 h-16 text-purple-600 mx-auto mb-4" aria-hidden="true" />
            <h1 id="verify-email-title" className="text-3xl font-bold text-gray-800 mb-2">Verify Your Email</h1>
            <p className="text-gray-600">
              We've sent a verification link to <strong>{user?.email}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="assertive">
              <div className="flex items-center">
                <XCircleIcon className="w-5 h-5 text-red-500 mr-2" aria-hidden="true" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center" id="verification-instructions">
              Click the link in the email to verify your account. If you don't see it, check your spam folder.
            </p>

            <motion.button
              onClick={handleResendEmail}
              disabled={resendLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-describedby="resend-button-help"
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </motion.button>
            <div id="resend-button-help" className="sr-only">Send another verification email to your inbox</div>

            <div className="text-center">
              <button
                onClick={() => navigateTo('/')}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded px-2 py-1"
                aria-label="Go back to sign in page"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
