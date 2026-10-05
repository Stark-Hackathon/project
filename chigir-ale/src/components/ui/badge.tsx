import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    success: "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    warning: "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    danger: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    info: "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    neutral: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  switch (severity) {
    case "CRITICAL":
      return <Badge variant="danger">🔴 Critical</Badge>;
    case "HIGH":
      return <Badge variant="warning">🟠 High</Badge>;
    case "MEDIUM":
      return <Badge variant="info">🟡 Medium</Badge>;
    case "LOW":
    default:
      return <Badge variant="neutral">🟢 Low</Badge>;
  }
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "SUBMITTED":
      return <Badge variant="info">Submitted</Badge>;
    case "UNDER_REVIEW":
      return <Badge variant="warning">Under Review</Badge>;
    case "NEEDS_INFORMATION":
      return <Badge variant="warning">Needs Info</Badge>;
    case "VERIFIED":
      return <Badge variant="success">Verified</Badge>;
    case "ASSIGNED":
      return <Badge variant="info">Assigned</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="default">In Progress</Badge>;
    case "BLOCKED":
      return <Badge variant="danger">Blocked</Badge>;
    case "RESOLVED":
    case "CLOSED":
      return <Badge variant="success">Resolved</Badge>;
    case "REJECTED":
    case "CANCELLED":
      return <Badge variant="danger">{status}</Badge>;
    case "DUPLICATE":
      return <Badge variant="neutral">Duplicate</Badge>;
    default:
      return <Badge variant="neutral">{status.replace(/_/g, " ")}</Badge>;
  }
}
