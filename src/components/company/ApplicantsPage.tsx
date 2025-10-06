import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Application, StudentProfile } from '@/types';

type Applicant = Application & { student: Pick<StudentProfile, 'student_id' | 'full_name' | 'college_name' | 'skills' | 'resume_url'> };

export const ApplicantsPage: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  useEffect(() => {
    const fetchApplicants = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select('*, student:students(student_id, full_name, college_name, skills, resume_url)')
        .eq('opportunity_id', id)
        .order('applied_date', { ascending: false });
      if (!error && data) setApplicants(data as unknown as Applicant[]);
      setLoading(false);
    };
    fetchApplicants();
  }, [id]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Applicants</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : applicants.length === 0 ? (
        <div className="text-gray-600">No applicants yet.</div>
      ) : (
        <div className="space-y-4">
          {applicants.map((a) => (
            <div key={a.application_id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{a.student.full_name || 'Unnamed Student'}</div>
                  <div className="text-sm text-gray-600">{a.student.college_name}</div>
                  {a.student.skills && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {a.student.skills.map((s) => (
                        <span key={s} className="text-xs bg-gray-100 px-2 py-1 rounded-md">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Applied: {new Date(a.applied_date).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {a.student.resume_url && (
                  <a href={a.student.resume_url} target="_blank" rel="noreferrer" className="px-3 py-1 text-sm rounded-md border hover:bg-gray-50">Resume</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


