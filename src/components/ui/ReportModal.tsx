"use client";

import React, { useState } from 'react';
import { Flag, ShieldAlert, X, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const REASONS = [
  'Harassment or bullying',
  'Hate speech or discrimination',
  'Explicit or inappropriate content',
  'Spam or scam',
  'Sharing personal information',
  'Threatening behavior',
  'Underage user',
  'Other',
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
  reportedName?: string;
}

export function ReportModal({ isOpen, onClose, onSubmit, reportedName }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);
    await onSubmit(selectedReason, details);
    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedReason('');
      setDetails('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden mx-0 sm:mx-4 z-10 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Flag size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-base">Report User</h3>
              {reportedName && <p className="text-xs text-muted-foreground">Reporting: {reportedName}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <ShieldAlert size={28} className="text-emerald-500" />
            </div>
            <p className="font-bold text-base">Report Submitted</p>
            <p className="text-sm text-muted-foreground text-center px-8">Thank you. Our team will review this report.</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Reason selection */}
            <div>
              <p className="text-sm font-semibold mb-2.5">What's the issue?</p>
              <div className="grid grid-cols-2 gap-1.5">
                {REASONS.map(reason => (
                  <button key={reason} onClick={() => setSelectedReason(reason)}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs text-left transition-all",
                      selectedReason === reason
                        ? "border-red-400 bg-red-50 text-red-700 font-medium"
                        : "border-border hover:border-muted-foreground/40 hover:bg-muted/50"
                    )}>
                    <div className={cn("w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                      selectedReason === reason ? "border-red-500 bg-red-500" : "border-muted-foreground/40")}>
                      {selectedReason === reason && <div className="w-1 h-1 rounded-full bg-white" />}
                    </div>
                    <span className="truncate">{reason}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional details */}
            <div>
              <p className="text-sm font-semibold mb-2">Additional details <span className="text-muted-foreground font-normal">(optional)</span></p>
              <textarea value={details} onChange={e => setDetails(e.target.value)}
                placeholder="Describe what happened..."
                rows={3}
                className="w-full rounded-xl border bg-muted/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400/60 resize-none transition-all placeholder:text-muted-foreground/60" />
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 leading-relaxed">False reports may result in action against your account. Only report genuine violations.</p>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={!selectedReason || isSubmitting}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all",
                selectedReason && !isSubmitting
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
