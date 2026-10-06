"use client";

/**
 * Chigir Ale - Citizen Account Deletion & Anonymization Button
 * Spec: Section 123 (Account Deletion & Data Governance)
 */
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, ShieldCheck } from "lucide-react";
import { deleteAccountAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function DeleteAccountButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      setError(null);
      const res = await deleteAccountAction();
      if (!res.success) {
        setError(res.error.message);
      } else {
        router.push("/auth/sign-in?deleted=1");
        router.refresh();
      }
    });
  }

  return (
    <div>
      {!isOpen ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:border-rose-900/60 text-xs flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Request Account Deletion / መለያ ይሰረዝ
        </Button>
      ) : (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50/70 dark:bg-rose-950/30 space-y-3 text-xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-950 dark:text-rose-200">
                Confirm Account Deletion &amp; Anonymization (Spec §123)
              </h4>
              <p className="text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                Deleting your account permanently scrubs your name, email, phone number, password, and device notification tokens.
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>Civic Integrity Guarantee:</strong> Your historical infrastructure incident reports remain preserved anonymously to protect community safety and repair accountability.
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded text-[11px]">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors"
            >
              Cancel
            </button>
            <Button
              type="button"
              variant="danger"
              disabled={isPending}
              onClick={handleDelete}
              className="text-xs flex items-center gap-1.5 font-bold"
            >
              {isPending ? "Anonymizing..." : "Yes, Delete & Anonymize My Account"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
