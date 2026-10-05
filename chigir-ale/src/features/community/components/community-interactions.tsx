"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  toggleUpvoteAction,
  confirmReportAction,
  submitResolutionFeedbackAction,
} from "@/features/community/actions";

interface CommunityInteractionsProps {
  reportId: string;
  initialUpvoteCount: number;
  initialConfirmationCount: number;
  initialHasUpvoted?: boolean;
  initialHasConfirmed?: boolean;
  status: string;
}

export function CommunityInteractions({
  reportId,
  initialUpvoteCount,
  initialConfirmationCount,
  initialHasUpvoted = false,
  initialHasConfirmed = false,
  status,
}: CommunityInteractionsProps) {
  const [upvoteCount, setUpvoteCount] = useState(initialUpvoteCount);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [confirmationCount, setConfirmationCount] = useState(initialConfirmationCount);
  const [hasConfirmed, setHasConfirmed] = useState(initialHasConfirmed);

  // Resolution feedback state
  const [feedbackMode, setFeedbackMode] = useState<"IDLE" | "CONFIRMED" | "DISPUTE_INPUT">("IDLE");
  const [disputeComment, setDisputeComment] = useState("");
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleToggleUpvote = () => {
    startTransition(async () => {
      const res = await toggleUpvoteAction(reportId);
      if (res.success) {
        setHasUpvoted(res.data.upvoted);
        setUpvoteCount(res.data.count);
      } else {
        setFeedbackError(res.error.message);
      }
    });
  };

  const handleConfirmReport = () => {
    if (hasConfirmed) return;
    startTransition(async () => {
      const res = await confirmReportAction(reportId);
      if (res.success) {
        setHasConfirmed(true);
        setConfirmationCount(res.data.count);
      } else {
        setFeedbackError(res.error.message);
      }
    });
  };

  const handleFeedbackSubmit = (result: "CONFIRMED_FIXED" | "NOT_FIXED") => {
    setFeedbackError(null);

    startTransition(async () => {
      const res = await submitResolutionFeedbackAction({
        reportId,
        result,
        comment: disputeComment || undefined,
      });

      if (res.success) {
        setFeedbackSuccessMsg(res.data.message);
        setFeedbackMode("CONFIRMED");
      } else {
        setFeedbackError(res.error.message);
      }
    });
  };

  const isResolvedState = status === "RESOLVED" || status === "AWAITING_CONFIRMATION";

  return (
    <div className="space-y-4">
      {feedbackError && (
        <Alert variant="danger" title="Error">
          {feedbackError}
        </Alert>
      )}

      {/* Upvote & "I'm experiencing this too" Community Actions (Spec section 23 & 24) */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Upvote Button (Spec Section 24) */}
          <Button
            type="button"
            variant={hasUpvoted ? "primary" : "outline"}
            size="sm"
            isLoading={isPending}
            onClick={handleToggleUpvote}
            className="cursor-pointer"
          >
            ▲ {hasUpvoted ? "Upvoted" : "Upvote"} ({upvoteCount})
          </Button>

          {/* "I'm experiencing this too" Confirmation (Spec Section 23 & 24) */}
          <Button
            type="button"
            variant={hasConfirmed ? "secondary" : "outline"}
            size="sm"
            disabled={hasConfirmed || isPending}
            onClick={handleConfirmReport}
            className="cursor-pointer"
          >
            {hasConfirmed ? "✓ You confirmed this" : "✋ I'm experiencing this too"} ({confirmationCount})
          </Button>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          {confirmationCount > 0
            ? `${confirmationCount} resident(s) confirmed this issue`
            : "Be the first to confirm this issue"}
        </span>
      </div>

      {/* Citizen Resolution Feedback Prompt (Spec Section 27) */}
      {isResolvedState && (
        <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-800 dark:text-emerald-400">
              Citizen Verification Required
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Has this problem actually been fixed? / ችግሩ በትክክል ተፈትቷል?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Authorities have marked this repair complete. Please verify the real-world condition on site.
            </p>
          </div>

          {feedbackSuccessMsg ? (
            <Alert variant="success">{feedbackSuccessMsg}</Alert>
          ) : feedbackMode === "DISPUTE_INPUT" ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Please describe why the issue is not fixed (e.g. water is still leaking, pothole was only partially filled)..."
                value={disputeComment}
                onChange={(e) => setDisputeComment(e.target.value)}
                rows={3}
                helperText="Your notes will be logged and the incident will be reopened for inspection."
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  isLoading={isPending}
                  onClick={() => handleFeedbackSubmit("NOT_FIXED")}
                >
                  Submit &amp; Reopen Report
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeedbackMode("IDLE")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isPending}
                onClick={() => handleFeedbackSubmit("CONFIRMED_FIXED")}
                className="cursor-pointer"
              >
                ✓ Yes, it&apos;s fixed
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setFeedbackMode("DISPUTE_INPUT")}
                className="text-rose-600 dark:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 cursor-pointer"
              >
                ✕ No, it still exists
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
