"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DescriptionInputProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  errors?: {
    title?: string;
    description?: string;
  };
}

export function DescriptionInput({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  errors,
}: DescriptionInputProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
          What happened? / ምን ተፈጠረ?
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Describe what you saw, where it is, and how it affects people in the neighborhood.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Brief Title / አጭር ርዕስ"
          placeholder="e.g. Major water leak flooding the main road"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          error={errors?.title}
          helperText="A clear, summary sentence describing the issue (min 3 characters)"
          required
        />

        <Textarea
          label="Detailed Description / ዝርዝር መግለጫ"
          placeholder="Describe what happened: when did it start, how severe is it, and who is affected? / የተፈጠረውን ችግር በዝርዝር ይግለጹ..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          error={errors?.description}
          rows={5}
          helperText={`${description.length} / 3000 characters (minimum 10 characters)`}
          required
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">Tips for an effective report:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>Mention whether the issue is continuous or intermittent.</li>
          <li>Note if traffic or pedestrian safety is immediately obstructed.</li>
          <li>You may write in English, Amharic (አማርኛ), or both.</li>
        </ul>
      </div>
    </div>
  );
}
