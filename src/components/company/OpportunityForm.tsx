import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Opportunity } from '@/types';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  type: z.enum(['internship', 'placement', 'apprenticeship']).default('internship'),
  work_mode: z.enum(['remote', 'hybrid', 'onsite']).default('remote'),
  status: z.enum(['draft', 'active', 'paused', 'closed', 'expired']).default('active'),
});

type FormValues = z.infer<typeof schema>;

export const OpportunityForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companyId } = useAuthStore();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const load = async () => {
      if (!id || id === 'new') return;
      const { data, error } = await supabase.from('opportunities').select('*').eq('opportunity_id', id).single();
      if (!error && data) {
        const opp = data as Opportunity;
        // Coerce to expected enums if needed
        reset({ title: opp.title, description: opp.description, type: (opp as any).type || 'internship', work_mode: opp.work_mode as any, status: (opp.status as any) });
      }
    };
    load();
  }, [id, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!companyId) return;
    if (!id || id === 'new') {
      const { error } = await supabase.from('opportunities').insert([{ ...values, company_id: companyId }]);
      if (error) throw error;
      navigate('/company');
    } else {
      const { error } = await supabase.from('opportunities').update(values).eq('opportunity_id', id);
      if (error) throw error;
      navigate('/company');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{id && id !== 'new' ? 'Edit Opportunity' : 'Post Opportunity'}</h1>
        <p className="text-sm text-gray-500 mt-1">Share role details, responsibilities, and expectations.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 shadow-sm bg-white overflow-hidden">
        <form onSubmit={handleSubmit(async (values) => {
          const t = toast.loading(id && id !== 'new' ? 'Saving changes...' : 'Creating opportunity...');
          try {
            await onSubmit(values);
            toast.success(id && id !== 'new' ? 'Saved' : 'Created', { id: t });
          } catch {
            toast.error('Something went wrong', { id: t });
          }
        })} className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input className="w-full rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 px-4 py-2.5" placeholder="e.g., Frontend Intern" {...register('title')} />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea className="w-full rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 px-4 py-2.5 h-44" placeholder="Describe the role, responsibilities, and qualifications" {...register('description')} />
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select className="w-full rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 px-4 py-2.5" {...register('type')}>
                <option value="internship">Internship</option>
                <option value="placement">Placement</option>
                <option value="apprenticeship">Apprenticeship</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Work Mode</label>
              <select className="w-full rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 px-4 py-2.5" {...register('work_mode')}>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select className="w-full rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 px-4 py-2.5" {...register('status')}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <div className="pt-2">
            <button disabled={isSubmitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-50">
              {id && id !== 'new' ? 'Save Changes' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


