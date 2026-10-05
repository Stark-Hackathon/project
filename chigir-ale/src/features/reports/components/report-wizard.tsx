"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Stepper, type Step } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { SeverityBadge } from "@/components/ui/badge";
import { CategorySelector, type CategoryItem } from "./category-selector";
import { EvidenceUploader } from "./evidence-uploader";
import { LocationPicker } from "./location-picker";
import { DescriptionInput } from "./description-input";
import { SeveritySelector } from "./severity-selector";
import { createReportAction, type CreateReportFormData } from "@/features/reports/actions";

interface ReportWizardProps {
  categories: CategoryItem[];
  defaultCategoryId?: string;
}

const WIZARD_STEPS: Step[] = [
  { title: "Category" },
  { title: "Evidence" },
  { title: "Location" },
  { title: "Details" },
  { title: "Severity" },
  { title: "Review" },
];

export function ReportWizard({ categories, defaultCategoryId }: ReportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<{
    reportId: string;
    publicReference: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateReportFormData>({
    categoryId: defaultCategoryId || "",
    title: "",
    description: "",
    severity: "MEDIUM",
    latitude: undefined,
    longitude: undefined,
    locationAccuracy: undefined,
    formattedAddress: "",
    administrativeArea: "",
    mediaUrls: [],
  });

  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
    category?: string;
  }>({});

  // Helper to lookup selected category details
  const findCategory = (id: string): { name: string; icon: string } => {
    for (const parent of categories) {
      if (parent.id === id) return { name: parent.name, icon: parent.icon ?? "📁" };
      if (parent.children) {
        for (const child of parent.children) {
          if (child.id === id) return { name: child.name, icon: child.icon ?? "⚠️" };
        }
      }
    }
    return { name: "Selected Category", icon: "📍" };
  };

  const handleNext = () => {
    setSubmissionError(null);
    setFieldErrors({});

    // Step 0: Category validation
    if (currentStep === 0) {
      if (!formData.categoryId) {
        setFieldErrors({ category: "Please choose an incident category to continue." });
        return;
      }
    }

    // Step 3: Details validation
    if (currentStep === 3) {
      const errors: { title?: string; description?: string } = {};
      if (!formData.title || formData.title.trim().length < 3) {
        errors.title = "Title must be at least 3 characters long.";
      }
      if (!formData.description || formData.description.trim().length < 10) {
        errors.description = "Please describe the problem with at least 10 characters.";
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setSubmissionError(null);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setSubmissionError(null);

    startTransition(async () => {
      const res = await createReportAction(formData);
      if (!res.success) {
        setSubmissionError(res.error.message);
      } else {
        setSubmittedReport(res.data);
      }
    });
  };

  // SUCCESS SCREEN (Step 7 Confirmation)
  if (submittedReport) {
    return (
      <Card className="max-w-2xl mx-auto shadow-md border-emerald-100 dark:border-emerald-950">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Report Submitted Successfully!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Your civic report has been securely registered in the public infrastructure database.
            </p>
          </div>

          {/* Reference Card */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 max-w-md mx-auto space-y-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Public Tracking Reference
            </span>
            <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider">
              {submittedReport.publicReference}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              Save or share this reference ID to track repairs and municipal updates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/reports/${submittedReport.publicReference}`}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors cursor-pointer"
            >
              Track Report Status →
            </Link>

            <Link
              href="/citizen/reports"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm transition-colors"
            >
              View My Reports
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedCat = findCategory(formData.categoryId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Stepper */}
      <Stepper
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {/* Error Announcement */}
      {submissionError && (
        <Alert variant="danger" title="Submission Failed">
          {submissionError}
        </Alert>
      )}

      {fieldErrors.category && (
        <Alert variant="warning">{fieldErrors.category}</Alert>
      )}

      {/* Active Wizard Step Card */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {/* STEP 1: Category */}
          {currentStep === 0 && (
            <CategorySelector
              categories={categories}
              selectedCategoryId={formData.categoryId}
              onSelect={(catId) => {
                setFormData((prev) => ({ ...prev, categoryId: catId }));
                setFieldErrors({});
              }}
            />
          )}

          {/* STEP 2: Evidence */}
          {currentStep === 1 && (
            <EvidenceUploader
              mediaUrls={formData.mediaUrls || []}
              onChange={(urls) =>
                setFormData((prev) => ({ ...prev, mediaUrls: urls }))
              }
            />
          )}

          {/* STEP 3: Location */}
          {currentStep === 2 && (
            <LocationPicker
              location={{
                latitude: formData.latitude,
                longitude: formData.longitude,
                locationAccuracy: formData.locationAccuracy,
                formattedAddress: formData.formattedAddress,
                administrativeArea: formData.administrativeArea,
              }}
              onChange={(loc) => setFormData((prev) => ({ ...prev, ...loc }))}
            />
          )}

          {/* STEP 4: Description */}
          {currentStep === 3 && (
            <DescriptionInput
              title={formData.title}
              description={formData.description}
              onTitleChange={(title) =>
                setFormData((prev) => ({ ...prev, title }))
              }
              onDescriptionChange={(desc) =>
                setFormData((prev) => ({ ...prev, description: desc }))
              }
              errors={fieldErrors}
            />
          )}

          {/* STEP 5: Severity */}
          {currentStep === 4 && (
            <SeveritySelector
              selectedSeverity={formData.severity}
              onChange={(severity) =>
                setFormData((prev) => ({ ...prev, severity }))
              }
            />
          )}

          {/* STEP 6: Review & Confirmation */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  Review Your Report / ሪፖርቱን ያረጋግጡ
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Please review the details below before official submission.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {/* Category summary */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Category</span>
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                      <span>{selectedCat.icon}</span>
                      <span>{selectedCat.name}</span>
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(0)}>
                    Edit
                  </Button>
                </div>

                {/* Evidence summary */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Photos</span>
                    <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                      {formData.mediaUrls && formData.mediaUrls.length > 0
                        ? `${formData.mediaUrls.length} photo(s) attached`
                        : "No photos attached"}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                    Edit
                  </Button>
                </div>

                {/* Location summary */}
                <div className="p-4 flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <span className="text-xs text-slate-400 block">Location</span>
                    <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block truncate">
                      {formData.formattedAddress || formData.administrativeArea
                        ? `${formData.formattedAddress || ""} ${formData.administrativeArea ? `(${formData.administrativeArea})` : ""}`
                        : formData.latitude && formData.longitude
                        ? `GPS: ${formData.latitude}, ${formData.longitude}`
                        : "Not specified"}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                    Edit
                  </Button>
                </div>

                {/* Issue details summary */}
                <div className="p-4 flex items-start justify-between">
                  <div className="min-w-0 pr-4 space-y-1">
                    <span className="text-xs text-slate-400 block">Problem Summary</span>
                    <h5 className="font-semibold text-slate-900 dark:text-white">
                      {formData.title || "No title provided"}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {formData.description || "No description provided"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)}>
                    Edit
                  </Button>
                </div>

                {/* Severity summary */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Severity Level</span>
                    <div className="mt-1">
                      <SeverityBadge severity={formData.severity} />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)}>
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800 mt-6">
            {currentStep > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isPending}
              >
                ← Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Continue →
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="lg"
                isLoading={isPending}
                onClick={handleSubmit}
              >
                Submit Incident Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
