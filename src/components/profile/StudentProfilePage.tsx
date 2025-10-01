import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { UserCircleIcon, ArrowLeftIcon, PlusIcon, XMarkIcon, DocumentIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface StudentProfilePageProps {
  navigateTo: (path: string) => void;
}

// Define the shape of our form data based on the database schema
interface ProfileFormData {
  full_name: string;
  college_name: string;
  course: string;
  specialization: string;
  year_of_study: number;
  cgpa: number;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  bio: string;
}

interface Skill {
  skill_id: string;
  skill_name: string;
  category: string;
}

interface Achievement {
  title: string;
  type: string;
  issuing_organization: string;
  description: string;
  date_achieved: string;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ navigateTo }) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<Partial<ProfileFormData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievement, setNewAchievement] = useState<Partial<Achievement>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>('');

  // Fetch existing profile data
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
      }

      if (data) {
        setFormData({
            full_name: data.full_name || '',
            college_name: data.college_name || '',
            course: data.course || '',
            specialization: data.specialization || '',
            year_of_study: data.year_of_study || 1,
            cgpa: data.cgpa || 0,
            linkedin_url: data.linkedin_url || '',
            github_url: data.github_url || '',
            portfolio_url: data.portfolio_url || '',
            bio: data.bio || '',
        });
        setStudentId(data.student_id);
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Failed to load profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to save your profile.');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Saving your profile...');

    try {
        const profileData = {
            ...formData,
            user_id: user.id,
            ...(studentId && { student_id: studentId }), // Include student_id only if it exists
            year_of_study: Number(formData.year_of_study),
            cgpa: Number(formData.cgpa),
            updated_at: new Date().toISOString(), // Manually update timestamp
        };

      const { error } = await supabase.from('students').upsert(profileData, {
        onConflict: 'user_id'
      });

      if (error) throw error;

      toast.success('Profile saved successfully!', { id: toastId });
      navigateTo('/dashboard');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Error saving profile: ' + err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-blue p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => navigateTo('/dashboard')} className="flex items-center gap-2 text-nebula-purple hover:text-white transition-colors mb-6">
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-stellar-white mb-2">My Profile</h1>
            <p className="text-lg text-gray-400 mb-8">Keep your information up to date to attract the best opportunities.</p>
        </motion.div>

        <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-glass-bg border border-glass-border rounded-2xl shadow-2xl p-8 backdrop-blur-xl space-y-8"
        >
            {/* Form Section: Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex items-center gap-4">
                    <UserCircleIcon className="w-16 h-16 text-nebula-purple" />
                    <div>
                        <h2 className="text-2xl font-semibold text-stellar-white">Personal Information</h2>
                        <p className="text-gray-400">This information will be visible to recruiters.</p>
                    </div>
                </div>
                <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <input type="text" name="full_name" id="full_name" value={formData.full_name || ''} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-nebula-purple outline-none" />
                </div>
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">Bio / Tagline</label>
                    <textarea name="bio" id="bio" value={formData.bio || ''} onChange={handleInputChange} rows={1} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-nebula-purple outline-none" placeholder="E.g., Aspiring Full-Stack Developer"></textarea>
                </div>
            </div>

            {/* Form Section: Academic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-glass-border">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-semibold text-stellar-white">Academic Details</h2>
                </div>
                <div>
                    <label htmlFor="college_name" className="block text-sm font-medium text-gray-300 mb-2">College Name</label>
                    <input type="text" name="college_name" id="college_name" value={formData.college_name || ''} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-nebula-purple outline-none" />
                </div>
                 <div>
                    <label htmlFor="course" className="block text-sm font-medium text-gray-300 mb-2">Course</label>
                    <input type="text" name="course" id="course" value={formData.course || ''} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-nebula-purple outline-none" placeholder="e.g., B.Tech" />
                </div>
                <div>
                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-300 mb-2">Specialization</label>
                    <input type="text" name="specialization" id="specialization" value={formData.specialization || ''} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-nebula-purple outline-none" placeholder="e.g., Computer Science" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="year_of_study" className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                        <select name="year_of_study" id="year_of_study" value={formData.year_of_study || 1} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-nebula-purple outline-none appearance-none">
                            <option value={1}>1st Year</option>
                            <option value={2}>2nd Year</option>
                            <option value={3}>3rd Year</option>
                            <option value={4}>4th Year</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="cgpa" className="block text-sm font-medium text-gray-300 mb-2">CGPA</label>
                        <input type="number" step="0.01" max="10" name="cgpa" id="cgpa" value={formData.cgpa || ''} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-nebula-purple outline-none" />
                    </div>
                </div>
            </div>

            {/* Form Section: Online Presence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-glass-border">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-semibold text-stellar-white">Online Presence</h2>
                </div>
                <div>
                    <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-300 mb-2">LinkedIn URL</label>
                    <input type="url" name="linkedin_url" id="linkedin_url" value={formData.linkedin_url || ''} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-nebula-purple outline-none" />
                </div>
                <div>
                    <label htmlFor="github_url" className="block text-sm font-medium text-gray-300 mb-2">GitHub URL</label>
                    <input type="url" name="github_url" id="github_url" value={formData.github_url || ''} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-nebula-purple outline-none" />
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="portfolio_url" className="block text-sm font-medium text-gray-300 mb-2">Portfolio/Website URL</label>
                    <input type="url" name="portfolio_url" id="portfolio_url" value={formData.portfolio_url || ''} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-nebula-purple outline-none" />
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-glass-border">
                <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving...' : 'Save Profile'}
                </motion.button>
            </div>
        </motion.form>
      </div>
    </div>
  );
};
