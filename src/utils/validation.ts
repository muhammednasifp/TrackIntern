import type { Application, Opportunity, StudentProfile } from '../types';

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

export interface ApplyValidationResult {
  canApply: boolean;
  reason: string | null;
}

const MAX_COVER_LETTER_LENGTH = 1000;
const MIN_COVER_LETTER_LENGTH = 100;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FILE_EXTENSIONS = new Set(['pdf', 'doc', 'docx']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const INVALID_FILENAME_CHARACTERS = /[<>:"/\\|?*]/;
const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

const placeholderPhrases = [
  'lorem ipsum',
  'insert cover letter',
  'write your cover letter here',
  'sample cover letter',
  'type your cover letter here',
  'cover letter placeholder',
];

const repeatedCharacterPattern = /(.)\1{10,}/i;

const hasText = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const normalizeSkills = (skills: string[] | null | undefined): string[] =>
  Array.isArray(skills)
    ? skills.map((skill) => skill?.trim()).filter((skill): skill is string => Boolean(skill))
    : [];

const parseDate = (dateString?: string | null): Date | null => {
  if (!dateString) {
    return null;
  }
  const parsed = new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isProfileComplete = (profile: StudentProfile): boolean => {
  const hasBasicInfo =
    hasText(profile.full_name) && hasText(profile.college_name) && hasText(profile.course);

  const hasResume = hasText(profile.resume_url);
  const skills = normalizeSkills(profile.skills);
  const hasEnoughSkills = skills.length >= 3;
  const profileStrength = profile.profile_strength ?? 0;
  const meetsProfileStrength = profileStrength >= 50;

  return hasBasicInfo && hasResume && hasEnoughSkills && meetsProfileStrength;
};

export const getProfileCompletionIssues = (profile: StudentProfile): string[] => {
  const issues: string[] = [];

  const lacksBasicInfo =
    !hasText(profile.full_name) || !hasText(profile.college_name) || !hasText(profile.course);

  if (!hasText(profile.resume_url)) {
    issues.push('Upload your resume');
  }

  if (normalizeSkills(profile.skills).length < 3) {
    issues.push('Add at least 3 skills');
  }

  if (lacksBasicInfo) {
    issues.push('Complete your basic information');
  }

  const profileStrength = profile.profile_strength ?? 0;
  if (profileStrength < 50) {
    issues.push('Improve your profile strength to at least 50%');
  }

  return issues;
};

export const validateCoverLetter = (coverLetter: string): ValidationResult => {
  const trimmed = coverLetter.replace(/\s+/g, ' ').trim();

  if (trimmed.length < MIN_COVER_LETTER_LENGTH) {
    return {
      valid: false,
      error: `Cover letter must be at least ${MIN_COVER_LETTER_LENGTH} characters.`,
    };
  }

  if (trimmed.length > MAX_COVER_LETTER_LENGTH) {
    return {
      valid: false,
      error: `Cover letter must not exceed ${MAX_COVER_LETTER_LENGTH} characters.`,
    };
  }

  const lowercased = trimmed.toLowerCase();
  if (placeholderPhrases.some((phrase) => lowercased.includes(phrase))) {
    return {
      valid: false,
      error: 'Please replace placeholder text with a genuine cover letter.',
    };
  }

  if (repeatedCharacterPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Cover letter appears to contain spam or repeated characters.',
    };
  }

  return {
    valid: true,
    error: null,
  };
};

export const validateFileUpload = (file: File): ValidationResult => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File size must not exceed 5MB.',
    };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const isAllowedExtension = ALLOWED_FILE_EXTENSIONS.has(extension);
  const isAllowedMimeType = ALLOWED_MIME_TYPES.has(file.type);

  if (!isAllowedExtension && !isAllowedMimeType) {
    return {
      valid: false,
      error: 'Only PDF, DOC, or DOCX files are supported.',
    };
  }

  if (INVALID_FILENAME_CHARACTERS.test(file.name)) {
    return {
      valid: false,
      error: 'Filename contains invalid characters.',
    };
  }

  return {
    valid: true,
    error: null,
  };
};

export const isDeadlinePassed = (deadline?: string | null): boolean => {
  const parsedDeadline = parseDate(deadline);
  if (!parsedDeadline) {
    return false;
  }

  const now = new Date();
  return parsedDeadline.getTime() < now.getTime();
};

export const getDaysUntilDeadline = (deadline?: string | null): number => {
  const parsedDeadline = parseDate(deadline);
  if (!parsedDeadline) {
    return Number.POSITIVE_INFINITY;
  }

  const now = new Date();
  const diffMs = parsedDeadline.getTime() - now.getTime();
  const diffDays = diffMs / MILLISECONDS_IN_DAY;

  if (diffDays >= 0) {
    return Math.ceil(diffDays);
  }
  return Math.floor(diffDays);
};

export const isDeadlineUrgent = (deadline?: string | null): boolean => {
  if (!deadline) {
    return false;
  }

  const daysRemaining = getDaysUntilDeadline(deadline);
  return daysRemaining >= 0 && daysRemaining <= 7;
};

export const canApplyToOpportunity = (
  opportunity: Opportunity,
  existingApplication: Application | null,
): ApplyValidationResult => {
  if (existingApplication) {
    return {
      canApply: false,
      reason: 'You have already applied to this opportunity.',
    };
  }

  if (isDeadlinePassed(opportunity.application_deadline)) {
    return {
      canApply: false,
      reason: 'The application deadline has passed.',
    };
  }

  const normalizedStatus = (opportunity.status ?? '').toLowerCase();
  if (normalizedStatus !== 'active') {
    return {
      canApply: false,
      reason: 'This opportunity is not currently accepting applications.',
    };
  }

  if (
    opportunity.max_applications !== null &&
    opportunity.max_applications !== undefined &&
    (opportunity.current_applications ?? 0) >= opportunity.max_applications
  ) {
    return {
      canApply: false,
      reason: 'This opportunity has reached its application limit.',
    };
  }

  return {
    canApply: true,
    reason: null,
  };
};