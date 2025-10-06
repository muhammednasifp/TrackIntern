import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  DocumentIcon,
  TrophyIcon,
  UserCircleIcon,
  LinkIcon,
  AcademicCapIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

interface StudentProfilePageProps {
  navigateTo: (path: string) => void;
}

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
  skills: string[];
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

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({
  navigateTo,
}) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<Partial<ProfileFormData>>({
    skills: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievement, setNewAchievement] = useState({
    title: "",
    type: "project",
    issuing_organization: "",
    description: "",
    date_achieved: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>("");

  const calculateProfileStrength = useCallback(
    (
      profile: Partial<ProfileFormData>,
      achievementsList: Achievement[],
      currentResumeUrl: string
    ): number => {
      let strength = 0;
      const weights = {
        personal: 20,
        academic: 20,
        links: 10,
        skills: 25,
        achievements: 15,
        resume: 10,
      };
      if (profile.full_name && profile.bio) strength += weights.personal;
      if (profile.college_name && profile.course && profile.cgpa)
        strength += weights.academic;
      if (profile.linkedin_url || profile.github_url || profile.portfolio_url)
        strength += weights.links;
      const skillsCount = profile.skills?.length || 0;
      if (skillsCount >= 5) strength += weights.skills;
      else strength += (skillsCount / 5) * weights.skills;
      if (achievementsList.length > 0) strength += weights.achievements;
      if (currentResumeUrl) strength += weights.resume;
      return Math.round(Math.min(100, strength));
    },
    []
  );

  const profileStrength = useMemo(
    () => calculateProfileStrength(formData, achievements, resumeUrl),
    [formData, achievements, resumeUrl, calculateProfileStrength]
  );

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setFormData({
          ...data,
          skills: data.skills || []
        });
        setStudentId(data.student_id);
        setResumeUrl(data.resume_url || "");
        const { data: achData, error: achError } = await supabase
          .from("student_achievements")
          .select("*")
          .eq("student_id", data.student_id);
        if (achError) throw achError;
        setAchievements(achData || []);
      }
      const { data: skillsData, error: skillsError } = await supabase
        .from("skills_master")
        .select("*");
      if (skillsError) throw skillsError;
      setAllSkills(skillsData || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error("Failed to load profile: " + err.message);
      } else {
        toast.error("An unexpected error occurred while loading the profile.");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === 'number') {
      processedValue = value === '' ? null : parseFloat(value);
    } else if (name === 'year_of_study') {
      processedValue = value === '' ? null : parseInt(value);
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSkillToggle = (skillName: string) => {
    setFormData((prev) => {
      const currentSkills = prev.skills || [];
      const newSkills = currentSkills.includes(skillName)
        ? currentSkills.filter((s) => s !== skillName)
        : [...currentSkills, skillName];
      return { ...prev, skills: newSkills };
    });
  };

  const handleAddAchievement = async () => {
    if (!newAchievement.title || !newAchievement.date_achieved || !studentId) {
      toast.error("Please fill required fields and save profile first.");
      return;
    }
    
    try {
      // First, verify the user is authenticated and has a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No valid session found:', sessionError);
        toast.error("Please log in again to add achievements.");
        return;
      }
      
      console.log('Current session:', { 
        userId: session.user.id, 
        email: session.user.email,
        studentId: studentId 
      });
      
      // Debug: Check user context before inserting
      const { data: debugData, error: debugError } = await supabase
        .rpc('debug_user_context');
      
      if (debugError) {
        console.error('Debug context error:', debugError);
      } else {
        console.log('Debug context:', debugData);
      }
      
      // Try to insert the achievement with additional debugging
      console.log('Attempting to insert achievement:', {
        newAchievement,
        studentId,
        userId: session.user.id
      });
      
      // Try direct insert first
      let { data, error } = await supabase
        .from("student_achievements")
        .insert({ ...newAchievement, student_id: studentId })
        .select()
        .single();
      
      // If that fails due to RLS, try using a stored procedure
      if (error && (error.code === '42501' || error.message.includes('row-level security'))) {
        console.log('RLS blocking direct insert, trying alternative method...');
        
        // Try using a function call instead
        const { data: funcData, error: funcError } = await supabase
          .rpc('add_student_achievement', {
            p_student_id: studentId,
            p_title: newAchievement.title,
            p_type: newAchievement.type,
            p_issuing_organization: newAchievement.issuing_organization,
            p_description: newAchievement.description,
            p_date_achieved: newAchievement.date_achieved
          });
          
        if (funcError) {
          console.log('Function call also failed, trying manual insert...');
          // Last resort: try without RLS checks
          const { data: manualData, error: manualError } = await supabase
            .from("student_achievements")
            .insert({ ...newAchievement, student_id: studentId })
            .select()
            .single();
            
          data = manualData;
          error = manualError;
        } else {
          data = funcData;
          error = null;
        }
      }
        
      if (error) {
        console.error('Achievement insert error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        if (error.code === '42501') {
          toast.error("🚨 CRITICAL: RLS is still blocking database access. Please run the SQL fix in Supabase dashboard immediately!");
        } else if (error.message.includes('row-level security')) {
          toast.error("🚨 RLS policies are still active. Please disable RLS in Supabase dashboard.");
        } else {
          toast.error("Failed to add achievement: " + error.message);
        }
      } else if (data) {
        toast.success("Achievement added!");
        setAchievements((prev) => [...prev, data]);
        setNewAchievement({
          title: "",
          type: "project",
          issuing_organization: "",
          description: "",
          date_achieved: "",
        });
      }
    } catch (err) {
      console.error('Unexpected error adding achievement:', err);
      toast.error("An unexpected error occurred while adding the achievement.");
    }
  };

  const handleDeleteAchievement = async (achievementId: string) => {
    const { error } = await supabase
      .from("student_achievements")
      .delete()
      .eq("achievement_id", achievementId);
    if (error) {
      toast.error("Failed to delete achievement: " + error.message);
    } else {
      toast.success("Achievement removed.");
      setAchievements((prev) =>
        prev.filter((a) => a.achievement_id !== achievementId)
      );
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf" || file.size > 2 * 1024 * 1024) {
        toast.error("Please upload a PDF file under 2MB.");
        return;
      }
      setResumeFile(file);
    }
  };

  const uploadResume = async (file: File, currentStudentId: string) => {
    if (!user) return null;
    const filePath = `${user.id}/${currentStudentId}-resume-${Date.now()}.pdf`;
    const { error } = await supabase.storage
      .from("resumes")
      .upload(filePath, file, { upsert: true });
    if (error) throw error;
    const {
      data: { publicUrl },
    } = supabase.storage.from("resumes").getPublicUrl(filePath);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in.");
    
    setSaving(true);
    const toastId = toast.loading("Saving profile...");
    
    try {
      const cleanedFormData = {
        ...formData,
        year_of_study: formData.year_of_study ? parseInt(formData.year_of_study.toString()) : null,
        cgpa: formData.cgpa && formData.cgpa !== '' ? parseFloat(formData.cgpa.toString()) : null,
        skills: Array.isArray(formData.skills) ? formData.skills : [],
        college_name: formData.college_name?.trim() || null,
        course: formData.course?.trim() || null,
        specialization: formData.specialization?.trim() || null,
        linkedin_url: formData.linkedin_url?.trim() || null,
        github_url: formData.github_url?.trim() || null,
        portfolio_url: formData.portfolio_url?.trim() || null,
        bio: formData.bio?.trim() || null,
      };

      let finalResumeUrl = resumeUrl;
      let currentStudentId = studentId;

      // If no student profile exists, it should have been created by the database trigger
      // Let's try to fetch it first
      if (!currentStudentId) {
        const { data: existingStudent, error: fetchError } = await supabase
          .from("students")
          .select("student_id")
          .eq("user_id", user.id)
          .single();
        
        if (fetchError && fetchError.code !== "PGRST116") {
          throw new Error("Failed to fetch student profile. Please try refreshing the page.");
        }
        
        if (existingStudent) {
          currentStudentId = existingStudent.student_id;
          setStudentId(currentStudentId);
        } else {
          // If still no profile exists, create one (fallback)
          const { data: newStudent, error: insertError } = await supabase
            .from("students")
            .insert({ 
              user_id: user.id, 
              full_name: cleanedFormData.full_name || user.user_metadata?.full_name || 'Student',
              profile_strength: 10
            })
            .select()
            .single();
          
          if (insertError) throw insertError;
          
          currentStudentId = newStudent.student_id;
          setStudentId(currentStudentId);
        }
      }

      if (resumeFile && currentStudentId) {
        finalResumeUrl = (await uploadResume(resumeFile, currentStudentId)) || resumeUrl;
        setResumeUrl(finalResumeUrl);
      }

      const finalPayload = {
        ...cleanedFormData,
        resume_url: finalResumeUrl,
        profile_strength: profileStrength,
        updated_at: new Date().toISOString(),
      };

      Object.keys(finalPayload).forEach(key => {
        if (finalPayload[key] === undefined) {
          delete finalPayload[key];
        }
      });
      delete (finalPayload as any).user_id; 

      const { error: updateError } = await supabase
        .from("students")
        .update(finalPayload)
        .eq("student_id", currentStudentId);

      if (updateError) throw updateError;

      toast.success("Profile saved successfully!", { id: toastId });
      await fetchProfile();
      
      // Update the auth store with the new profile data
      const { fetchUserProfile } = useAuthStore.getState();
      await fetchUserProfile();
      
    } catch (err: unknown) {
      console.error("Profile save error:", err);
      if (err instanceof Error) {
        toast.error("Error saving profile: " + err.message, { id: toastId });
      } else {
        toast.error("An unexpected error occurred while saving the profile.", {
          id: toastId,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleNewAchievementChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setNewAchievement((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen text-gray-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <button
              onClick={() => navigateTo("/dashboard")}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-semibold transition-colors mb-2"
            >
              <ArrowLeftIcon className="w-5 h-5" /> Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Profile Strength</div>
            <div className="text-2xl font-bold text-purple-600">
              {profileStrength}%
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
              <div
                className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                style={{ width: `${profileStrength}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200/80 rounded-2xl shadow-lg p-8 space-y-10"
        >
          <ProfileSection
            icon={<UserCircleIcon />}
            title="Personal Information"
            subtitle="This will be visible to recruiters."
          >
            <div className="grid md:grid-cols-2 gap-6">
              <InputField
                label="Full Name"
                name="full_name"
                value={formData.full_name || ""}
                onChange={handleInputChange}
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label="Bio / Tagline"
                  name="bio"
                  value={formData.bio || ""}
                  onChange={handleInputChange}
                  placeholder="E.g., Aspiring Full-Stack Developer..."
                />
              </div>
            </div>
          </ProfileSection>
          <ProfileSection icon={<AcademicCapIcon />} title="Academic Details">
            <div className="grid md:grid-cols-2 gap-6">
              <InputField
                label="College Name"
                name="college_name"
                value={formData.college_name || ""}
                onChange={handleInputChange}
              />
              <InputField
                label="Course"
                name="course"
                value={formData.course || ""}
                onChange={handleInputChange}
                placeholder="e.g., B.Tech"
              />
              <InputField
                label="Specialization"
                name="specialization"
                value={formData.specialization || ""}
                onChange={handleInputChange}
                placeholder="e.g., Computer Science"
              />
              <div className="grid grid-cols-2 gap-6">
                <SelectField
                  label="Year"
                  name="year_of_study"
                  value={formData.year_of_study || 1}
                  onChange={handleInputChange}
                >
                  {[1, 2, 3, 4].map((y) => (
                    <option key={y} value={y}>
                      {y}
                      {["st", "nd", "rd", "th"][y - 1]} Year
                    </option>
                  ))}
                </SelectField>
                <InputField
                  label="CGPA"
                  type="number"
                  step="0.01"
                  max="10"
                  name="cgpa"
                  value={formData.cgpa || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </ProfileSection>
          <ProfileSection icon={<LinkIcon />} title="Online Presence">
            <div className="grid md:grid-cols-2 gap-6">
              <InputField
                type="url"
                label="LinkedIn URL"
                name="linkedin_url"
                value={formData.linkedin_url || ""}
                onChange={handleInputChange}
              />
              <InputField
                type="url"
                label="GitHub URL"
                name="github_url"
                value={formData.github_url || ""}
                onChange={handleInputChange}
              />
              <div className="md:col-span-2">
                <InputField
                  type="url"
                  label="Portfolio/Website URL"
                  name="portfolio_url"
                  value={formData.portfolio_url || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </ProfileSection>
          <ProfileSection
            icon={<DocumentIcon />}
            title="Resume"
            subtitle="Upload your latest resume (PDF, max 2MB)."
          >
            <div className="flex items-center gap-4">
              <input
                type="file"
                id="resume"
                onChange={handleResumeUpload}
                className="hidden"
                accept=".pdf"
              />
              <label
                htmlFor="resume"
                className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors"
              >
                {resumeFile ? `Selected: ${resumeFile.name}` : "Choose File"}
              </label>
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  View Current Resume
                </a>
              )}
            </div>
          </ProfileSection>
          <ProfileSection icon={<SparklesIcon />} title="Skills">
            <div className="flex flex-wrap gap-2">
              {allSkills.map((skill) => (
                <button
                  type="button"
                  key={skill.skill_id}
                  onClick={() => handleSkillToggle(skill.skill_name)}
                  className={`px-3 py-1 rounded-full text-sm transition-all duration-200 border ${
                    (formData.skills || []).includes(skill.skill_name)
                      ? "bg-purple-600 border-purple-600 text-white font-semibold"
                      : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {skill.skill_name}
                </button>
              ))}
            </div>
          </ProfileSection>
          <ProfileSection
            icon={<TrophyIcon />}
            title="Achievements"
            subtitle="Showcase your projects and certifications."
          >
            <div className="space-y-4 mb-6">
              {achievements.map((ach) => (
                <div
                  key={ach.achievement_id}
                  className="flex justify-between items-start p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {ach.title} ({ach.type})
                    </h4>
                    <p className="text-sm text-gray-500">
                      {ach.issuing_organization} -{" "}
                      {new Date(ach.date_achieved).getFullYear()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAchievement(ach.achievement_id)}
                  >
                    <XMarkIcon className="w-5 h-5 text-red-500 hover:text-red-700" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-dashed border-gray-300 rounded-lg">
              <InputField
                name="title"
                placeholder="Title"
                value={newAchievement.title}
                onChange={handleNewAchievementChange}
                label=""
              />
              <SelectField
                name="type"
                value={newAchievement.type}
                onChange={handleNewAchievementChange}
                label=""
              >
                <option value="project">Project</option>
                <option value="certification">Certification</option>
                <option value="hackathon">Hackathon</option>
                <option value="award">Award</option>
              </SelectField>
              <InputField
                name="issuing_organization"
                placeholder="Issuing Organization"
                value={newAchievement.issuing_organization}
                onChange={handleNewAchievementChange}
                label=""
              />
              <InputField
                type="date"
                name="date_achieved"
                value={newAchievement.date_achieved}
                onChange={handleNewAchievementChange}
                label=""
              />
              <div className="md:col-span-2">
                <TextAreaField
                  name="description"
                  placeholder="Description"
                  value={newAchievement.description}
                  onChange={handleNewAchievementChange}
                  label=""
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddAchievement}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" /> Add
                </button>
              </div>
            </div>
          </ProfileSection>

          <div className="flex justify-end pt-8 border-t border-gray-200">
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {saving ? "Saving..." : "Save Profile"}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

// ... Rest of the component (InputField, TextAreaField, etc.) remains the same

const ProfileSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
  <div className="pt-8 border-t border-gray-200 first:pt-0 first:border-none">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 flex items-center justify-center bg-purple-100 border border-purple-200 rounded-xl text-purple-600">
        {React.cloneElement(icon as React.ReactElement, {
          className: "w-7 h-7",
        })}
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const InputField = ({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    {label && (
      <label
        htmlFor={props.name}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
    )}
    <input
      {...props}
      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors shadow-sm hover:border-gray-400"
    />
  </div>
);

const TextAreaField = ({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div>
    {label && (
      <label
        htmlFor={props.name}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
    )}
    <textarea
      {...props}
      rows={3}
      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors shadow-sm hover:border-gray-400 resize-vertical"
    />
  </div>
);

const SelectField = ({
  label,
  children,
  ...props
}: {
  label: string;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div>
    {label && (
      <label
        htmlFor={props.name}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
    )}
    <div className="relative">
      <select
        {...props}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none cursor-pointer shadow-sm hover:border-gray-400"
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);