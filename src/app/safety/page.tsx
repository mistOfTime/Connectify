'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Shield, ArrowLeft, AlertTriangle, Eye, Lock,
  UserX, Flag, MessageSquareOff, HeartHandshake, BadgeCheck
} from 'lucide-react';

const RULES = [
  {
    icon: <UserX size={22} className="text-red-500" />,
    title: "No Harassment or Bullying",
    description: "Threatening, intimidating, or harassing other users is strictly prohibited and will result in an immediate ban.",
  },
  {
    icon: <Eye size={22} className="text-orange-500" />,
    title: "No Explicit Content",
    description: "Sharing sexually explicit material, nudity, or graphic content of any kind is not allowed on this platform.",
  },
  {
    icon: <Lock size={22} className="text-yellow-500" />,
    title: "Protect Your Privacy",
    description: "Never share your real name, address, phone number, school ID, or any personal information with strangers.",
  },
  {
    icon: <MessageSquareOff size={22} className="text-blue-500" />,
    title: "No Hate Speech",
    description: "Content that promotes discrimination based on race, gender, religion, nationality, or sexual orientation is banned.",
  },
  {
    icon: <Flag size={22} className="text-purple-500" />,
    title: "Report Violations",
    description: "Use the Flag icon in any chat to report inappropriate behavior. Our moderation team reviews all reports.",
  },
  {
    icon: <HeartHandshake size={22} className="text-emerald-500" />,
    title: "Be Respectful",
    description: "Treat every person you meet as you'd want to be treated. Kind interactions make Connectify better for everyone.",
  },
];

const TIPS = [
  "Never agree to meet someone in person that you met on Connectify.",
  "If you feel uncomfortable, click Stop or End Chat immediately — no explanation needed.",
  "Keep your camera pointed away from personal items that could reveal your location.",
  "Don't share your social media handles or contact details in a first conversation.",
  "If someone asks for money or gifts, it is almost certainly a scam — report and disconnect.",
  "Minors should always have parental guidance when using any online chat platform.",
];

export default function SafetyPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <header className="h-14 md:h-16 border-b bg-background flex items-center px-4 shrink-0 z-10 gap-3">
        
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeft size={18} />
        </Button>
        <h1 className="font-headline font-bold text-lg">Safety</h1>
      </header>

      <main className="flex-grow overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-10 pb-16">

          {/* Hero */}
          <div className="text-center space-y-4 pt-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Shield size={32} />
            </div>
            <h2 className="text-3xl font-headline font-bold">Your Safety Matters</h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Connectify is built on respect and trust. These guidelines exist to keep every conversation safe and enjoyable for everyone.
            </p>
          </div>

          {/* Community Rules */}
          <div>
            <h3 className="font-headline font-bold text-xl mb-4 flex items-center gap-2">
              <BadgeCheck size={20} className="text-primary" /> Community Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {RULES.map((rule, i) => (
                <div key={i} className="bg-card border rounded-xl p-5 shadow-sm flex gap-4 items-start hover:shadow-md transition-shadow">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    {rule.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">{rule.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2 text-amber-800">
              <AlertTriangle size={20} className="text-amber-500" /> Safety Tips
            </h3>
            <ul className="space-y-3">
              {TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-amber-900">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency CTA */}
          <div className="bg-primary text-primary-foreground rounded-2xl p-8 text-center space-y-4">
            <Shield size={32} className="mx-auto opacity-80" />
            <h3 className="text-xl font-headline font-bold">See something wrong?</h3>
            <p className="opacity-90 max-w-sm mx-auto text-sm leading-relaxed">
              Use the Flag button inside any chat to report a user instantly. Our team reviews every report and acts fast.
            </p>
            <Button variant="secondary" className="font-bold px-8">
              Contact Support
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
}
