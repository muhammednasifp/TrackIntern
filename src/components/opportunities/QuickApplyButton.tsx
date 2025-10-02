import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import {
  BoltIcon,
  ArrowPathIcon,
  CheckIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../lib/supabase";

type ButtonStatus = "idle" | "loading" | "success" | "error" | "applied";

interface StudentProfileSnapshot {
  full_name?: string | null;
  college_name?: string | null;
  course?: string | null;
  resume_url?: string | null;
  skills?: string[] | null;
  profile_strength?: number | null;
}

interface QuickApplyButtonProps {
  opportunityId: string;
  studentId: string;
  studentProfile: StudentProfileSnapshot | null;
  disabled?: boolean;
  onSuccess?: () => void;
  className?: string;
}

const colors = [
  "#7c3aed",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#38bdf8",
  "#f97316",
];

const triggerConfetti = () => {
  if (typeof document === "undefined") return;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "100%";
  container.style.height = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "9999";

  for (let i = 0; i < 18; i += 1) {
    const piece = document.createElement("span");
    piece.style.position = "absolute";
    piece.style.top = "-12px";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.width = `${6 + Math.random() * 4}px`;
    piece.style.height = `${10 + Math.random() * 10}px`;
    piece.style.borderRadius = "2px";
    piece.style.backgroundColor = colors[i % colors.length];
    piece.style.opacity = "0";
    container.appendChild(piece);

    const translateX = (Math.random() - 0.5) * 320;
    const rotate = 200 + Math.random() * 240;
    const duration = 1000 + Math.random() * 500;
    const delay = Math.random() * 120;

    const animation = piece.animate(
      [
        { transform: "translate3d(0,-15px,0) rotate(0deg)", opacity: 0 },
        {
          transform: `translate3d(${translateX / 2}px, 40vh, 0) rotate(${
            rotate / 2
          }deg)`,
          opacity: 1,
        },
        {
          transform: `translate3d(${translateX}px, 80vh, 0) rotate(${rotate}deg)`,
          opacity: 0,
        },
      ],
      {
        duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        delay,
        fill: "forwards",
      }
    );

    animation.onfinish = () => piece.remove();
  }

  document.body.appendChild(container);
  window.setTimeout(() => {
    container.remove();
  }, 1600);
};

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const QuickApplyButton: React.FC<QuickApplyButtonProps> = ({
  opportunityId,
  studentId,
  studentProfile,
  disabled = false,
  onSuccess,
  className,
}) => {
  const [status, setStatus] = useState<ButtonStatus>("idle");
  const [hasApplied, setHasApplied] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const appliedTimeoutRef = useRef<number | null>(null);

  const profileIssues = useMemo(() => {
    const issues: string[] = [];
    const profileStrength = Math.round(
      typeof studentProfile?.profile_strength === "number"
        ? Math.max(0, Math.min(100, studentProfile.profile_strength))
        : 0
    );
    const skillsCount = Array.isArray(studentProfile?.skills)
      ? studentProfile!.skills.filter(Boolean).length
      : 0;
    const hasBasicInfo =
      Boolean(studentProfile?.full_name) &&
      Boolean(studentProfile?.college_name) &&
      Boolean(studentProfile?.course);

    if (!studentProfile?.resume_url) {
      issues.push("Upload your resume");
    }
    if (skillsCount < 3) {
      issues.push("Add at least 3 skills");
    }
    if (!hasBasicInfo || profileStrength < 50) {
      issues.push(`Complete your profile (currently ${profileStrength}%)`);
    }

    return issues;
  }, [studentProfile]);

  const shouldDisableForProfile = profileIssues.length > 0;
  const isApplied = hasApplied || status === "success" || status === "applied";
  const isButtonDisabled =
    disabled || shouldDisableForProfile || status === "loading" || isApplied;

  useEffect(
    () => () => {
      if (appliedTimeoutRef.current) {
        window.clearTimeout(appliedTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!shouldDisableForProfile && tooltipVisible) {
      setTooltipVisible(false);
    }
  }, [shouldDisableForProfile, tooltipVisible]);

  const handleMouseEnter = () => {
    if (shouldDisableForProfile) {
      setTooltipVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (tooltipVisible) {
      setTooltipVisible(false);
    }
  };

  const handleFocus = () => {
    if (shouldDisableForProfile) {
      setTooltipVisible(true);
    }
  };

  const handleBlur = () => {
    if (tooltipVisible) {
      setTooltipVisible(false);
    }
  };

  const handleQuickApply = async () => {
    if (isButtonDisabled && !shouldDisableForProfile) {
      return;
    }

    if (shouldDisableForProfile) {
      setTooltipVisible(true);
      window.setTimeout(() => setTooltipVisible(false), 2400);
      toast.error("Please complete your profile before using Quick Apply.");
      return;
    }

    if (!studentId) {
      toast.error(
        "Your student profile was not found. Please refresh and try again."
      );
      return;
    }

    if (!opportunityId) {
      toast.error("This opportunity is not available right now.");
      return;
    }

    if (
      !window.confirm(
        "Apply with your current profile? You can add a cover letter later."
      )
    ) {
      return;
    }

    try {
      setStatus("loading");

      const { error } = await supabase.from("applications").insert([
        {
          student_id: studentId,
          opportunity_id: opportunityId,
          status: "submitted",
          applied_date: new Date().toISOString(),
          cover_letter:
            "I am interested in this opportunity. Please find my resume attached for your review.",
          application_score: null,
        },
      ]);

      if (error) {
        if (
          error.code === "23505" ||
          error.message.toLowerCase().includes("duplicate key") ||
          error.message.toLowerCase().includes("already exists")
        ) {
          toast("You've already applied to this opportunity.");
          setHasApplied(true);
          setStatus("applied");
          return;
        }
        throw error;
      }

      setHasApplied(true);
      setStatus("success");
      triggerConfetti();
      toast.success("Application submitted successfully!");
      onSuccess?.();

      appliedTimeoutRef.current = window.setTimeout(() => {
        setStatus("applied");
      }, 900);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      toast.error(message);
      setStatus("error");
    }
  };

  const { label, icon } = useMemo(() => {
    if (isApplied) {
      return {
        label: "Applied",
        icon: <CheckIcon className="h-5 w-5" aria-hidden="true" />,
      };
    }

    if (status === "loading") {
      return {
        label: "Applying...",
        icon: (
          <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
        ),
      };
    }

    if (status === "error") {
      return {
        label: "Try Again",
        icon: <BoltIcon className="h-5 w-5" aria-hidden="true" />,
      };
    }

    if (shouldDisableForProfile) {
      return {
        label: "Complete Profile",
        icon: <InformationCircleIcon className="h-5 w-5" aria-hidden="true" />,
      };
    }

    return {
      label: "Quick Apply",
      icon: <BoltIcon className="h-5 w-5" aria-hidden="true" />,
    };
  }, [isApplied, shouldDisableForProfile, status]);

  const buttonClasses = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    isApplied
      ? "bg-emerald-500 text-white focus-visible:ring-emerald-300 shadow-emerald-500/40"
      : status === "error"
      ? "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-300 shadow-red-500/30"
      : shouldDisableForProfile || disabled
      ? "bg-slate-600/60 text-slate-200 focus-visible:ring-slate-400 cursor-not-allowed"
      : "bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:shadow-purple-500/40 focus-visible:ring-purple-300",
    isButtonDisabled && !(status === "loading" || isApplied)
      ? "cursor-not-allowed opacity-90"
      : "cursor-pointer",
    className
  );

  const hoverAnimation = !isButtonDisabled
    ? { scale: 1.02, boxShadow: "0px 20px 40px rgba(99, 102, 241, 0.25)" }
    : undefined;

  const tapAnimation = !isButtonDisabled ? { scale: 0.97 } : undefined;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <Transition
        show={shouldDisableForProfile && tooltipVisible}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <div className="absolute bottom-full left-1/2 z-20 mb-3 w-64 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/90 p-4 text-sm text-white shadow-2xl backdrop-blur-lg">
          <p className="mb-2 text-sm font-semibold text-purple-300">
            Complete these steps to quick apply:
          </p>
          <ul className="space-y-1 text-xs text-slate-200">
            {profileIssues.map((issue) => (
              <li key={issue} className="flex items-start gap-2">
                <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      </Transition>

      <motion.button
        type="button"
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        disabled={isButtonDisabled && status !== "error"}
        aria-disabled={isButtonDisabled}
        onClick={handleQuickApply}
        className={buttonClasses}
      >
        {icon}
        <span>{label}</span>
      </motion.button>
    </div>
  );
};

export default QuickApplyButton;
