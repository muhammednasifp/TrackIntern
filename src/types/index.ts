export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface Company {
  company_id: string;
  company_name: string;
  brand_logo_url: string | null;
  industry_type: string | null;
  company_size: string | null;
  headquarters_location: string | null;
  website: string | null;
  description: string | null;
  glassdoor_rating: number | null;
  tech_stack: JsonValue | null;
  benefits: JsonValue | null;
}

export interface Opportunity {
  opportunity_id: string;
  company_id: string;
  type: string;
  title: string;
  slug: string | null;
  description: string;
  requirements: JsonValue | null;
  preferred_skills: JsonValue | null;
  stipend_min: number | null;
  stipend_max: number | null;
  currency: string | null;
  duration_months: number | null;
  start_date: string | null;
  location: JsonValue | null;
  work_mode: string;
  application_deadline: string | null;
  max_applications: number | null;
  current_applications: number | null;
  status: string;
  selection_process: JsonValue | null;
  perks: JsonValue | null;
  is_ppo_offered: boolean;
  conversion_probability: number | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface OpportunityWithCompany extends Opportunity {
  company: Company;
}

export interface Application {
  application_id: string;
  student_id: string;
  opportunity_id: string;
  status: string;
  applied_date: string;
  status_updated_at: string | null;
  cover_letter: string | null;
  additional_documents: string[] | null;
  answers_to_questions: Record<string, JsonValue> | null;
  rating_by_company: number | null;
  feedback_by_company: string | null;
  interview_dates: JsonValue | null;
  offer_letter_url: string | null;
  is_accepted: boolean | null;
  rejection_reason: string | null;
  application_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithDetails extends Application {
  opportunity: OpportunityWithCompany;
}

export interface StudentProfile {
  student_id: string;
  user_id: string;
  full_name: string | null;
  college_name: string | null;
  course: string | null;
  specialization: string | null;
  year_of_study: string | null;
  cgpa: number | null;
  skills: string[] | null;
  resume_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  profile_strength: number | null;
  achievements_count: number | null;
}

export interface SavedOpportunity {
  saved_id: string;
  student_id: string;
  opportunity_id: string;
  saved_at: string;
}

export interface ApplicationFormData {
  coverLetter: string;
  additionalDocuments: string[];
  answersToQuestions: Record<string, string>;
}

export type CustomQuestionType = 'text' | 'textarea' | 'select' | 'radio';

export interface CustomQuestion {
  id: string;
  question: string;
  type: CustomQuestionType;
  required: boolean;
  options?: string[];
}