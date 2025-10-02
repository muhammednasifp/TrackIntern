import {
  format as formatDateFns,
  formatDistanceToNow,
  differenceInCalendarDays,
  isValid,
} from 'date-fns';

type DateInput = Date | string | number | null | undefined;

const INVALID_DATE_TEXT = 'Invalid date';
const NO_VALUE_TEXT = 'Not specified';

const CURRENCY_LOCALE_MAP: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
  SGD: 'en-SG',
  AED: 'ar-AE',
};

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  SGD: 'S$',
  AED: 'د.إ',
  JPY: '¥',
  CNY: '¥',
};

const STATUS_COLOR_MAP: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-800',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-indigo-100 text-indigo-800',
  shortlisted: 'bg-violet-100 text-violet-800',
  interview_scheduled: 'bg-purple-100 text-purple-800',
  interviewed: 'bg-amber-100 text-amber-800',
  selected: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
  offer_sent: 'bg-emerald-100 text-emerald-800',
  hired: 'bg-teal-100 text-teal-800',
};

const WORK_MODE_ICON_MAP: Record<string, string> = {
  remote: '🏠 Remote',
  onsite: '🏢 Onsite',
  on_site: '🏢 Onsite',
  hybrid: '🔄 Hybrid',
  flexible: '💼 Flexible',
};

const normalizeDate = (input: DateInput): Date | null => {
  if (!input && input !== 0) {
    return null;
  }

  if (input instanceof Date) {
    const clone = new Date(input.getTime());
    return isValid(clone) ? clone : null;
  }

  const parsed = new Date(input);
  return isValid(parsed) ? parsed : null;
};

const getPluralizedLabel = (value: number, singular: string, plural?: string): string =>
  `${value} ${value === 1 ? singular : plural ?? `${singular}s`}`;

const getCurrencyLocale = (currencyCode: string): string =>
  CURRENCY_LOCALE_MAP[currencyCode] ?? 'en-US';

const getCurrencySymbol = (currencyCode: string): string =>
  CURRENCY_SYMBOL_MAP[currencyCode] ?? `${currencyCode} `;

const formatNumberWithGrouping = (amount: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDate = (dateInput: DateInput): string => {
  const date = normalizeDate(dateInput);
  if (!date) {
    return INVALID_DATE_TEXT;
  }

  try {
    return formatDateFns(date, 'MMM dd, yyyy');
  } catch {
    return INVALID_DATE_TEXT;
  }
};

export const formatRelativeDate = (dateInput: DateInput): string => {
  const date = normalizeDate(dateInput);
  if (!date) {
    return INVALID_DATE_TEXT;
  }

  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return INVALID_DATE_TEXT;
  }
};

export const formatDeadlineCountdown = (deadlineInput: DateInput): string => {
  const deadline = normalizeDate(deadlineInput);
  if (!deadline) {
    return NO_VALUE_TEXT;
  }

  const today = new Date();
  const diff = differenceInCalendarDays(deadline, today);

  if (diff > 0) {
    return `${diff} ${diff === 1 ? 'day' : 'days'} left`;
  }

  if (diff === 0) {
    return 'Deadline today';
  }

  return 'Deadline passed';
};

export const formatCurrency = (
  amount: number | null | undefined,
  currency = 'USD',
): string => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return NO_VALUE_TEXT;
  }

  const normalizedCurrency = currency.toUpperCase();
  const locale = getCurrencyLocale(normalizedCurrency);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    const symbol = getCurrencySymbol(normalizedCurrency);
    return `${symbol}${formatNumberWithGrouping(amount, locale)}`;
  }
};

export const formatStipend = (
  min: number | null | undefined,
  max: number | null | undefined,
  currency = 'USD',
): string => {
  const hasMin = min !== null && min !== undefined && !Number.isNaN(min);
  const hasMax = max !== null && max !== undefined && !Number.isNaN(max);

  if (!hasMin && !hasMax) {
    return NO_VALUE_TEXT;
  }

  if (hasMin && hasMax) {
    if (min === max) {
      return formatCurrency(min, currency);
    }

    return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
  }

  if (hasMin) {
    return formatCurrency(min, currency);
  }

  return formatCurrency(max!, currency);
};

export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (maxLength <= 0 || text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}…`;
};

export const formatWorkMode = (workMode: string | null | undefined): string => {
  if (!workMode) {
    return WORK_MODE_ICON_MAP.flexible;
  }

  const key = workMode.toLowerCase();
  return WORK_MODE_ICON_MAP[key] ?? WORK_MODE_ICON_MAP.flexible;
};

export const formatDuration = (months: number | null | undefined): string => {
  if (months === null || months === undefined || Number.isNaN(months) || months <= 0) {
    return NO_VALUE_TEXT;
  }

  const wholeMonths = Math.round(months);
  const years = Math.floor(wholeMonths / 12);
  const remainingMonths = wholeMonths % 12;

  const parts: string[] = [];

  if (years > 0) {
    parts.push(getPluralizedLabel(years, 'year'));
  }

  if (remainingMonths > 0) {
    parts.push(getPluralizedLabel(remainingMonths, 'month'));
  }

  if (parts.length === 0) {
    return getPluralizedLabel(wholeMonths, 'month');
  }

  return parts.join(' ');
};

export const formatLocationList = (locations: string[] | null | undefined): string => {
  if (!locations || locations.length === 0) {
    return NO_VALUE_TEXT;
  }

  if (locations.length <= 2) {
    return locations.join(', ');
  }

  const [first, second, ...rest] = locations;
  return `${first}, ${second} +${rest.length} more`;
};

export const formatSkillsList = (skills: string[] | null | undefined): string => {
  if (!skills || skills.length === 0) {
    return NO_VALUE_TEXT;
  }

  if (skills.length <= 3) {
    return skills.join(', ');
  }

  const displayed = skills.slice(0, 3).join(', ');
  return `${displayed} +${skills.length - 3} more`;
};

const capitalizeWord = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

export const formatApplicationStatus = (status: string | null | undefined): string => {
  if (!status) {
    return 'Unknown';
  }

  return status
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(capitalizeWord)
    .join(' ');
};

export const getStatusColor = (status: string | null | undefined): string => {
  if (!status) {
    return 'bg-gray-100 text-gray-800';
  }

  const key = status.toLowerCase();
  return STATUS_COLOR_MAP[key] ?? 'bg-gray-100 text-gray-800';
};