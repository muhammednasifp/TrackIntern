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
  achievement_id: string;
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
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [studentSkills, setStudentSkills] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievement, setNewAchievement] = useState({
      title: '',
      type: 'project',
      issuing_organization: '',
      description: '',
      date_achieved: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>('');

    const calculateProfileStrength = useCallback(
    (profile: any, skills: string[], achievements: Achievement[], resumeUrl: string): number => {
      let strength = 0;
      if (profile.full_name) strength += 10;
      if (profile.college_name) strength += 10;
      if (profile.course) strength += 10;
      if (profile.cgpa) strength += 10;
      if (profile.linkedin_url || profile.github_url || profile.portfolio_url) strength += 10;
      if (skills.length > 0) strength += 20;
      if (achievements.length > 0) strength += 20;
      if (resumeUrl) strength += 10;
      return Math.min(100, strength);
    },
    []
  );

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
        setStudentSkills(data.skills || []);
        setResumeUrl(data.resume_url || '');

        const { data: achievementsData, error: achievementsError } = await supabase
            .from('student_achievements')
            .select('*')
            .eq('student_id', data.student_id);

        if (achievementsError) throw achievementsError;
        setAchievements(achievementsData || []);
      }
        
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills_master')
        .select('*');

      if (skillsError) throw skillsError;
      setAllSkills(skillsData || []);
        
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
    
  useEffect(() => {
    if (!loading) {
      const strength = calculateProfileStrength(formData, studentSkills, achievements, resumeUrl);
      if (studentId) {
        supabase
          .from('students')
          .update({ profile_strength: strength })
          .eq('student_id', studentId)
          .then();
      }
    }
  }, [formData, studentSkills, achievements, resumeUrl, studentId, loading, calculateProfileStrength]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
    
  const handleSkillChange = (skillName: string) => {
    setStudentSkills(prev => 
        prev.includes(skillName) 
            ? prev.filter(s => s !== skillName)
            : [...prev, skillName]
    );
  };
    
  const handleAddAchievement = async () => {
      if (!newAchievement.title || !newAchievement.date_achieved) {
          toast.error("Please fill in at least the title and date for the achievement.");
          return;
      }
      if (!studentId) {
          toast.error("Please save your main profile details first.");
          return;
      }
      
      const { data, error } = await supabase
        .from('student_achievements')
        .insert({ ...newAchievement, student_id: studentId })
        .select()
        .single();
      
      if (error) {
          toast.error("Failed to add achievement: " + error.message);
      } else if (data) {
          toast.success("Achievement added!");
          setAchievements(prev => [...prev, data]);
          setNewAchievement({title: '', type: 'project', issuing_organization: '', description: '', date_achieved: ''});
      }
  };
    
  const handleDeleteAchievement = async (achievementId: string) => {
      const { error } = await supabase
        .from('student_achievements')
        .delete()
        .eq('achievement_id', achievementId);
      
      if (error) {
          toast.error("Failed to delete achievement: " + error.message);
      } else {
          toast.success("Achievement removed.");
          setAchievements(prev => prev.filter(a => a.achievement_id !== achievementId));
      }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("File is too large. Maximum size is 2MB.");
        return;
    }
    setResumeFile(file);

    if (!user || !studentId) {
      toast.error("Please save your profile before uploading a resume.");
      return;
    }
    const toastId = toast.loading("Uploading resume...");
    const filePath = `${user.id}/${studentId}-resume.pdf`;
    
    const { error } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, { upsert: true });

    if (error) {
      toast.error("Failed to upload resume: " + error.message, { id: toastId });
    } else {
      const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(filePath);
      await supabase.from('students').update({ resume_url: publicUrl }).eq('student_id', studentId);
      setResumeUrl(publicUrl);
      toast.success("Resume uploaded successfully!", { id: toastId });
    }
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
            skills: studentSkills,
            ...(studentId && { student_id: studentId }), // Include student_id only if it exists
            year_of_study: Number(formData.year_of_study),
            cgpa: Number(formData.cgpa),
            updated_at: new Date().toISOString(), // Manually update timestamp
        };

      const { data, error } = await supabase.from('students').upsert(profileData, {
        onConflict: 'user_id'
      }).select().single();

      if (error) throw error;
      
      if (data) {
        setStudentId(data.student_id);
      }

      toast.success('Profile saved successfully!', { id: toastId });
      navigateTo('/dashboard');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Error saving profile: ' + err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };
    
  const handleNewAchievementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAchievement(prev => ({...prev, [name]: value}));
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
                <div className="md:col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">Bio / Tagline</label>
                    <textarea name="bio" id="bio" value={formData.bio || ''} onChange={handleInputChange} rows={2} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-nebula-purple outline-none" placeholder="E.g., Aspiring Full-Stack Developer"></textarea>
                </div>
            </div>
            
            {/* Resume Section */}
            <div className="pt-6 border-t border-glass-border">
                <div className="flex items-center gap-4 mb-4">
                     <DocumentIcon className="w-10 h-10 text-nebula-purple" />
                     <div>
                        <h2 className="text-2xl font-semibold text-stellar-white">Resume</h2>
                        <p className="text-gray-400">Upload your latest resume (PDF, max 2MB).</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <input type="file" id="resume" onChange={handleResumeUpload} className="hidden" accept=".pdf" />
                    <label htmlFor="resume" className="cursor-pointer px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30">
                        {resumeFile ? resumeFile.name : "Choose File"}
                    </label>
                    {resumeUrl && <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-nebula-purple hover:underline">View Current Resume</a>}
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
            
             {/* Skills Section */}
            <div className="pt-6 border-t border-glass-border">
                <h2 className="text-2xl font-semibold text-stellar-white mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                    {allSkills.map(skill => (
                        <button
                            type="button"
                            key={skill.skill_id}
                            onClick={() => handleSkillChange(skill.skill_name)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                studentSkills.includes(skill.skill_name)
                                ? 'bg-nebula-purple text-white'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                        >
                            {skill.skill_name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Achievements Section */}
            <div className="pt-6 border-t border-glass-border">
                <div className="flex items-center gap-4 mb-4">
                     <TrophyIcon className="w-10 h-10 text-nebula-purple" />
                     <div>
                        <h2 className="text-2xl font-semibold text-stellar-white">Achievements</h2>
                        <p className="text-gray-400">Showcase your projects, certifications, and awards.</p>
                    </div>
                </div>
                {/* Existing Achievements */}
                <div className="space-y-4 mb-6">
                    {achievements.map(ach => (
                        <div key={ach.achievement_id} className="flex justify-between items-start p-3 bg-white/5 rounded-lg">
                            <div>
                                <h4 className="font-semibold text-white">{ach.title} ({ach.type})</h4>
                                <p className="text-sm text-gray-400">{ach.issuing_organization} - {new Date(ach.date_achieved).getFullYear()}</p>
                                <p className="text-sm text-gray-300 mt-1">{ach.description}</p>
                            </div>
                            <button onClick={() => handleDeleteAchievement(ach.achievement_id)}>
                                <XMarkIcon className="w-5 h-5 text-red-400 hover:text-red-300" />
                            </button>
                        </div>
                    ))}
                </div>
                 {/* Add New Achievement Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-glass-border rounded-lg">
                    <input type="text" name="title" placeholder="Title" value={newAchievement.title} onChange={handleNewAchievementChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white" />
                    <select name="type" value={newAchievement.type} onChange={handleNewAchievementChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white">
                        <option value="project">Project</option>
                        <option value="certification">Certification</option>
                        <option value="hackathon">Hackathon</option>
                    </select>
                    <input type="text" name="issuing_organization" placeholder="Issuing Organization" value={newAchievement.issuing_organization} onChange={handleNewAchievementChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white" />
                    <input type="date" name="date_achieved" value={newAchievement.date_achieved} onChange={handleNewAchievementChange} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white" />
                    <textarea name="description" placeholder="Description" value={newAchievement.description} onChange={handleNewAchievementChange} className="md:col-span-2 w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"></textarea>
                    <div className="md:col-span-2 flex justify-end">
                        <button type="button" onClick={handleAddAchievement} className="flex items-center gap-2 px-4 py-2 bg-nebula-purple text-white rounded-lg">
                            <PlusIcon className="w-5 h-5" /> Add Achievement
                        </button>
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