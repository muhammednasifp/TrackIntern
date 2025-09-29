import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
  onSwitchMode: (mode: 'signin' | 'signup') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode, onSwitchMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'student' as 'student' | 'company',
    acceptTerms: false,
  });
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuthStore();

  useEffect(() => {
    // Reset form when modal is opened or mode is switched
    if (isOpen) {
      setStep(0);
      setFormData({
        email: '', password: '', confirmPassword: '', 
        userType: 'student', acceptTerms: false
      });
    }
  }, [isOpen, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      if (type === 'checkbox') {
        return { ...prev, [name]: (e.target as HTMLInputElement).checked };
      } else if (name === 'userType') {
        return { ...prev, [name]: value as 'student' | 'company' };
      } else {
        return { ...prev, [name]: value };
      }
    });
  };
  
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
        }
        if (!formData.acceptTerms) {
            toast.error('You must accept the terms and conditions');
            setLoading(false);
            return;
        }
        const result = await signUp(formData.email, formData.password, formData.userType);
        if (result.success) {
          toast.success('Account created! Please check your email for verification.');
          onClose();
        } else {
          toast.error(result.error || 'Failed to create account');
        }
      } else {
        const result = await signIn(formData.email, formData.password);
        if (result.success) {
          toast.success('Welcome back!');
          onClose();
        } else {
          toast.error(result.error || 'Failed to sign in');
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };

  const stepsConfig = {
    signin: ['email', 'password'],
    signup: ['email', 'userType', 'password', 'confirmPassword', 'acceptTerms']
  };
  const currentSteps = stepsConfig[mode];
  const progress = ((step) / (currentSteps.length)) * 100;

  const handleNext = () => {
    const currentField = currentSteps[step];
    if (formData[currentField as keyof typeof formData] === '') {
        toast.error('Please fill in this field.');
        return;
    }
    if (step < currentSteps.length) {
      setStep(step + 1);
    }
  };
  
  const NextButton = () => (
    <motion.button
      type="button"
      onClick={handleNext}
      whileHover={{ scale: 1.1 }}
      className="flex-shrink-0 bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors hover:bg-white/30"
    >
      <ArrowRightIcon className="w-6 h-6" />
    </motion.button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 relative">
                {/* White gradient background effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0)_60%)] pointer-events-none"></div>

                <div className="relative z-10">
                    <button onClick={onClose} className="absolute -top-2 -right-2 text-white/70 hover:text-white transition-colors z-20">
                        <XMarkIcon className="h-6 w-6" />
                    </button>

                    <h2 className="text-3xl font-bold text-white mb-2">{mode === 'signin' ? 'Welcome Back' : 'Join TrackIntern'}</h2>
                    <p className="text-white/70 mb-8">
                      {mode === 'signin' ? 'Sign in to continue your journey.' : 'Create an account to get started.'}
                    </p>
                
                    <form onSubmit={handleFormSubmit} className="min-h-[6rem] flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                        {step === 0 && (
                            <motion.div key="email" {...fieldAnimation}>
                                <label htmlFor="email" className="font-medium text-white/80">Email Address</label>
                                <div className="flex items-center gap-3 mt-2">
                                    <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="flex-grow w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-white/50" placeholder="Enter your email" />
                                    <NextButton />
                                </div>
                            </motion.div>
                        )}
                        {mode === 'signup' && step === 1 && (
                            <motion.div key="userType" {...fieldAnimation}>
                                <label htmlFor="userType" className="font-medium text-white/80">I am a...</label>
                                <div className="flex items-center gap-3 mt-2">
                                    <select name="userType" value={formData.userType} onChange={handleInputChange} className="flex-grow w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50">
                                        <option value="student" style={{backgroundColor: '#581c87'}}>Student</option>
                                        <option value="company" style={{backgroundColor: '#581c87'}}>Company</option>
                                    </select>
                                    <NextButton />
                                </div>
                            </motion.div>
                        )}
                        {((mode === 'signup' && step === 2) || (mode === 'signin' && step === 1)) && (
                            <motion.div key="password" {...fieldAnimation}>
                                <label htmlFor="password" className="font-medium text-white/80">Password</label>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="relative flex-grow">
                                        <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-white/50" placeholder="Enter your password" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <NextButton />
                                </div>
                            </motion.div>
                        )}
                        {mode === 'signup' && step === 3 && (
                            <motion.div key="confirmPassword" {...fieldAnimation}>
                                <label htmlFor="confirmPassword" className="font-medium text-white/80">Confirm Password</label>
                                <div className="flex items-center gap-3 mt-2">
                                    <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleInputChange} className="flex-grow w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-white/50" placeholder="Confirm your password" />
                                    <NextButton />
                                </div>
                            </motion.div>
                        )}
                        {mode === 'signup' && step === 4 && (
                            <motion.div key="acceptTerms" {...fieldAnimation}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center space-x-3">
                                        <input type="checkbox" id="acceptTerms" name="acceptTerms" checked={formData.acceptTerms} onChange={handleInputChange} className="h-5 w-5 text-blue-400 bg-white/10 border-white/20 focus:ring-blue-500 rounded" />
                                        <label htmlFor="acceptTerms" className="text-sm text-white/80">I accept the <a href="#" className="text-white hover:underline">Terms and Conditions</a></label>
                                    </div>
                                    <NextButton />
                                </div>
                            </motion.div>
                        )}
                        {step === currentSteps.length && (
                            <motion.div key="submit" {...fieldAnimation} className="mt-2">
                                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className="w-full bg-white/90 text-purple-700 font-bold py-3 rounded-lg hover:shadow-lg disabled:opacity-50">
                                    {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                                </motion.button>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </form>

                    <div className="mt-8">
                        <div className="w-full bg-white/20 rounded-full h-1.5 mb-4">
                            <motion.div className="bg-white h-1.5 rounded-full" animate={{ width: `${progress}%` }} />
                        </div>
                        <div className="text-center text-sm text-white/70">
                        {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                        <button type="button" onClick={() => onSwitchMode(mode === 'signin' ? 'signup' : 'signin')} className="text-white hover:underline font-bold">
                            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                        </button>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};