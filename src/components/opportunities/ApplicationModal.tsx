import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SparklesIcon,
  PaperClipIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

type QuestionType = 'text' | 'textarea' | 'select' | 'radio';

export interface CustomQuestion {
  id: string;
  question: string;
  type: QuestionType;
  required?: boolean;
  options?: string[];
}

interface UploadedFileMeta {
  name: string;
  url: string;
  path: string;
  size: number;
}

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
  opportunityTitle: string;
  companyName: string;
  studentId: string;
  customQuestions?: CustomQuestion[];
  onSuccess: () => void;
}

interface FormState {
  coverLetter: string;
  additionalDocuments: string[];
  answersToQuestions: Record<string, string>;
}

const stepVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 3;

const sanitizeFilename = (fileName: string) => {
  const name = fileName.normalize('NFKD').replace(/[^\w.\- ]+/g, '');
  return name.replace(/\s+/g, '-');
};

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  opportunityId,
  opportunityTitle,
  companyName,
  studentId,
  customQuestions,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const questions = customQuestions ?? [];
  const stepKeys = useMemo(
    () => (questions.length > 0 ? ['cover', 'documents', 'questions', 'review'] : ['cover', 'documents', 'review']),
    [questions.length],
  );

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormState>({
    coverLetter: '',
    additionalDocuments: [],
    answersToQuestions: {},
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentStepKey = stepKeys[step] ?? stepKeys[stepKeys.length - 1];
  const totalSteps = stepKeys.length;
  const progressPercent = Math.min(100, ((step + 1) / totalSteps) * 100);

  const resetState = useCallback(() => {
    setStep(0);
    setFormData({
      coverLetter: '',
      additionalDocuments: [],
      answersToQuestions: {},
    });
    setUploadedFiles([]);
    setUploading(false);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  const hasDirtyData =
    formData.coverLetter.trim().length > 0 ||
    formData.additionalDocuments.length > 0 ||
    Object.values(formData.answersToQuestions).some((value) => value && value.trim().length > 0);

  const handleRequestClose = (force?: boolean) => {
    if (!force && hasDirtyData) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close the application?');
      if (!confirmClose) {
        return;
      }
    }
    onClose();
  };

  const updateCoverLetter = (value: string) => {
    setFormData((prev) => ({ ...prev, coverLetter: value }));
  };

  const handleQuestionAnswer = (questionId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      answersToQuestions: {
        ...prev.answersToQuestions,
        [questionId]: value,
      },
    }));
  };

  const validateCoverLetter = () => {
    const trimmed = formData.coverLetter.trim();
    if (trimmed.length < 100) {
      toast.error('Cover letter should be at least 100 characters long.');
      return false;
    }
    if (trimmed.length > 1000) {
      toast.error('Cover letter should not exceed 1000 characters.');
      return false;
    }
    return true;
  };

  const validateQuestions = () => {
    if (questions.length === 0) {
      return true;
    }
    const missing = questions.filter((q) => q.required && !formData.answersToQuestions[q.id]?.trim());
    if (missing.length > 0) {
      toast.error('Please answer all required questions before proceeding.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStepKey === 'cover' && !validateCoverLetter()) {
      return;
    }
    if (currentStepKey === 'questions' && !validateQuestions()) {
      return;
    }
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const ingestFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) {
        return;
      }
      if (!user && !studentId) {
        toast.error('You must be logged in to upload documents.');
        return;
      }
      const files = Array.from(fileList);
      const availableSlots = MAX_FILES - uploadedFiles.length;
      if (availableSlots <= 0) {
        toast.error(`You can upload up to ${MAX_FILES} documents.`);
        return;
      }
      setUploading(true);
      const filesToUpload = files.slice(0, availableSlots);

      for (const file of filesToUpload) {
        const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!ACCEPTED_EXTENSIONS.includes(extension) || !ACCEPTED_MIME_TYPES.includes(file.type)) {
          toast.error(`Unsupported file type: ${file.name}`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(`File ${file.name} exceeds 5MB limit.`);
          continue;
        }

        const cleanedName = sanitizeFilename(file.name);
        const timestamp = Date.now();
        const filePath = `${user?.id ?? studentId}/${opportunityId}/${timestamp}-${cleanedName}`;

        const toastId = toast.loading(`Uploading ${file.name}...`);
        const { error } = await supabase.storage.from('application-documents').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

        if (error) {
          toast.error(`Failed to upload ${file.name}: ${error.message}`, { id: toastId });
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('application-documents').getPublicUrl(filePath);

        setFormData((prev) => ({
          ...prev,
          additionalDocuments: [...prev.additionalDocuments, publicUrl],
        }));

        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            url: publicUrl,
            path: filePath,
            size: file.size,
          },
        ]);

        toast.success(`${file.name} uploaded successfully`, { id: toastId });
      }
      setUploading(false);
    },
    [opportunityId, studentId, uploadedFiles.length, user, formData.additionalDocuments],
  );

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    ingestFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    ingestFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const removeFile = async (file: UploadedFileMeta) => {
    const toastId = toast.loading(`Removing ${file.name}...`);
    const { error } = await supabase.storage.from('application-documents').remove([file.path]);
    if (error) {
      toast.error(`Could not remove ${file.name}: ${error.message}`, { id: toastId });
      return;
    }
    setUploadedFiles((prev) => prev.filter((item) => item.path !== file.path));
    setFormData((prev) => ({
      ...prev,
      additionalDocuments: prev.additionalDocuments.filter((url) => url !== file.url),
    }));
    toast.success(`${file.name} removed`, { id: toastId });
  };

  const handleSubmit = async () => {
    if (!validateCoverLetter()) {
      return;
    }
    if (!validateQuestions()) {
      return;
    }
    if (!studentId) {
      toast.error('Student profile not found. Please complete your profile before applying.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Submitting your application...');

    const payload = {
      student_id: studentId,
      opportunity_id: opportunityId,
      status: 'submitted',
      applied_date: new Date().toISOString(),
      cover_letter: formData.coverLetter.trim(),
      additional_documents: formData.additionalDocuments,
      answers_to_questions: formData.answersToQuestions,
      application_score: null,
    };

    const { error } = await supabase.from('applications').insert(payload);

    if (error) {
      if (error.code === '23505' || error.message.toLowerCase().includes('duplicate')) {
        toast.error('You have already applied to this opportunity.', { id: toastId });
      } else {
        toast.error(`Failed to submit application: ${error.message}`, { id: toastId });
      }
      setSubmitting(false);
      return;
    }

    toast.success('Application submitted successfully!', { id: toastId });
    onSuccess();
    setSubmitting(false);
    handleRequestClose(true);
  };

  const renderCoverLetterStep = () => (
    <motion.div
      key="cover"
      className="space-y-6"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold">Craft Your Cover Letter</h3>
        <p className="text-sm text-white/70">
          Share your motivation, relevant experience, and why you&apos;re a great fit for this opportunity.
        </p>
      </div>
      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={formData.coverLetter}
            onChange={(e) => updateCoverLetter(e.target.value)}
            rows={10}
            maxLength={1000}
            className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
            placeholder="Write a compelling cover letter (100-1000 characters)..."
          />
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span
            className={`font-medium ${
              formData.coverLetter.trim().length < 100 || formData.coverLetter.trim().length > 1000
                ? 'text-rose-200'
                : 'text-emerald-200'
            }`}
          >
            {formData.coverLetter.trim().length < 100
              ? `${formData.coverLetter.trim().length}/100 minimum characters`
              : `${formData.coverLetter.trim().length}/1000 characters`}
          </span>
          <button
            type="button"
            onClick={() => toast('AI assistance is coming soon!')}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <SparklesIcon className="h-4 w-4" />
            Generate with AI
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderDocumentsStep = () => (
    <motion.div
      key="documents"
      className="space-y-6"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold">Upload Supporting Documents</h3>
        <p className="text-sm text-white/70">
          Attach additional materials like portfolios, certificates, or transcripts to strengthen your application.
        </p>
      </div>
      <div className="rounded-3xl border border-dashed border-white/30 bg-white/5 p-6 backdrop-blur-lg">
        <label
          htmlFor="application-documents"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-6 text-center transition hover:border-white/40 hover:bg-white/15"
        >
          <ArrowUpTrayIcon className="h-10 w-10 text-white/80" />
          <div>
            <p className="text-lg font-semibold text-white">Drag &amp; drop files here, or click to browse</p>
            <p className="text-sm text-white/60">
              Accepted formats: PDF, DOC, DOCX · Max size 5MB · Up to {MAX_FILES} files
            </p>
          </div>
          <input
            id="application-documents"
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </label>
        <div className="mt-6 space-y-3">
          {uploadedFiles.length === 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white/70">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-200" />
              <p>No additional documents uploaded yet. You can skip this step if not required.</p>
            </div>
          )}
          {uploadedFiles.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90"
            >
              <div className="flex items-center gap-3">
                <PaperClipIcon className="h-5 w-5 text-white/70" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-white/60">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file)}
                className="rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {uploading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white/80">
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
            Uploading files...
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderQuestionsStep = () => (
    <motion.div
      key="questions"
      className="space-y-6"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold">Answer Custom Questions</h3>
        <p className="text-sm text-white/70">
          Provide thoughtful responses to help the company understand your experience and motivation.
        </p>
      </div>
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <label className="flex items-center justify-between gap-4 text-sm font-medium text-white">
              <span>{question.question}</span>
              {question.required && (
                <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs uppercase tracking-wide text-rose-100">
                  Required
                </span>
              )}
            </label>
            <div className="mt-3">
              {question.type === 'textarea' && (
                <textarea
                  rows={4}
                  value={formData.answersToQuestions[question.id] ?? ''}
                  onChange={(e) => handleQuestionAnswer(question.id, e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="Type your response..."
                />
              )}
              {question.type === 'text' && (
                <input
                  type="text"
                  value={formData.answersToQuestions[question.id] ?? ''}
                  onChange={(e) => handleQuestionAnswer(question.id, e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="Type your response..."
                />
              )}
              {(question.type === 'select' || question.type === 'radio') && (
                <div className="space-y-2">
                  {question.options?.length ? (
                    question.type === 'select' ? (
                      <select
                        value={formData.answersToQuestions[question.id] ?? ''}
                        onChange={(e) => handleQuestionAnswer(question.id, e.target.value)}
                        className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        <option value="">Select an option</option>
                        {question.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {question.options.map((option) => {
                          const selected = formData.answersToQuestions[question.id] === option;
                          return (
                            <button
                              type="button"
                              key={option}
                              onClick={() => handleQuestionAnswer(question.id, option)}
                              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                selected ? 'bg-white text-purple-700' : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    <p className="text-xs text-white/60">No options provided for this question.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderReviewStep = () => (
    <motion.div
      key="review"
      className="space-y-6"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold">Review &amp; Submit</h3>
        <p className="text-sm text-white/70">Double-check your responses before submitting your application.</p>
      </div>
      <div className="space-y-4">
        <section className="rounded-3xl border border-white/15 bg-white/10 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">Cover Letter</h4>
            <button
              type="button"
              onClick={() => setStep(stepKeys.indexOf('cover'))}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20"
            >
              Edit
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">{formData.coverLetter.trim()}</p>
        </section>

        <section className="rounded-3xl border border-white/15 bg-white/10 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">Additional Documents</h4>
            <button
              type="button"
              onClick={() => setStep(stepKeys.indexOf('documents'))}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20"
            >
              Edit
            </button>
          </div>
          {uploadedFiles.length > 0 ? (
            <ul className="space-y-2 text-sm text-white/85">
              {uploadedFiles.map((file) => (
                <li key={file.path} className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-200" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-white/60 underline transition hover:text-white/80"
                    >
                      View document
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/70">No additional documents attached.</p>
          )}
        </section>

        {questions.length > 0 && (
          <section className="rounded-3xl border border-white/15 bg-white/10 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">Custom Questions</h4>
              <button
                type="button"
                onClick={() => setStep(stepKeys.indexOf('questions'))}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20"
              >
                Edit
              </button>
            </div>
            <div className="space-y-3 text-sm text-white/85">
              {questions.map((question) => (
                <div key={question.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="font-semibold text-white">{question.question}</p>
                  <p className="mt-1 text-white/75">
                    {formData.answersToQuestions[question.id]?.trim() || <span className="italic text-white/50">No answer</span>}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-overlay"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => handleRequestClose()}
        >
          <motion.div
            key="modal-content"
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-900/80 via-purple-700/80 to-blue-700/80 text-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),rgba(255,255,255,0)_60%)]" />
            <button
              type="button"
              onClick={() => handleRequestClose()}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="relative z-10 flex flex-col gap-6 p-8">
              <header className="space-y-3">
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">Application</p>
                <h2 className="text-3xl font-bold leading-tight text-white">{opportunityTitle}</h2>
                <p className="text-white/75">{companyName}</p>
              </header>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>
                    Step {Math.min(step + 1, totalSteps)} of {totalSteps}
                  </span>
                  <span>{currentStepKey === 'review' ? 'Final Review' : 'Progress'}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-purple-300 to-blue-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <div className="min-h-[320px]">
                <AnimatePresence mode="wait">
                  {currentStepKey === 'cover' && renderCoverLetterStep()}
                  {currentStepKey === 'documents' && renderDocumentsStep()}
                  {currentStepKey === 'questions' && renderQuestionsStep()}
                  {currentStepKey === 'review' && renderReviewStep()}
                </AnimatePresence>
              </div>

              <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <CheckIcon className="h-5 w-5 text-emerald-300" />
                  <span>Your information is securely stored and can be edited later.</span>
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center justify-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      Back
                    </button>
                  )}
                  {currentStepKey !== 'review' && (
                    <div className="flex items-center gap-3">
                      {currentStepKey === 'documents' && (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                          disabled={uploading}
                        >
                          Skip
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-purple-700 shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={uploading}
                      >
                        Next
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {currentStepKey === 'review' && (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-purple-700 shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Application
                          <CheckIcon className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </footer>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};