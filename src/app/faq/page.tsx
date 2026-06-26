
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, HelpCircle, Shield, User, MessageCircle, Video } from 'lucide-react';

const FAQS = [
  {
    category: "Getting Started",
    icon: <HelpCircle className="w-5 h-5 text-primary" />,
    items: [
      {
        q: "What is Connectify?",
        a: "Connectify is a modern platform that lets you connect instantly with strangers around the world via text and video chat. We focus on speed, safety, and meaningful connections."
      },
      {
        q: "Do I need an account to use Connectify?",
        a: "While you can browse as a guest, creating an account with Google or Email allows you to customize your profile, save your university details, and access advanced features."
      }
    ]
  },
  {
    category: "Safety & Privacy",
    icon: <Shield className="w-5 h-5 text-primary" />,
    items: [
      {
        q: "Is it safe to use?",
        a: "Yes. We have real-time reporting tools and community guidelines. If a user is behaving inappropriately, use the 'Flag' icon to report them immediately."
      },
      {
        q: "Is my personal data shared?",
        a: "No. We only show the Display Name, University, and Course you choose to set in your profile. Your email and private data are never shared with strangers."
      }
    ]
  },
  {
    category: "Features",
    icon: <MessageCircle className="w-5 h-5 text-primary" />,
    items: [
      {
        q: "How does matching work?",
        a: "Our algorithm finds active users and pairs them instantly. If you've filled out your profile, we try to match you with people who have similar interests or are from similar universities."
      },
      {
        q: "Why is my video chat not working?",
        a: "Ensure you have granted camera and microphone permissions in your browser. Also, check that your internet connection is stable."
      }
    ]
  }
];

export default function FAQPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <header className="h-14 md:h-16 border-b bg-background flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
            <ArrowLeft size={18} />
          </Button>
          <h1 className="font-headline font-bold text-lg">Help Center</h1>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-12 pb-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <HelpCircle size={32} />
            </div>
            <h2 className="text-3xl font-headline font-bold">How can we help?</h2>
            <p className="text-muted-foreground">Search our frequently asked questions or browse by category.</p>
          </div>

          <div className="space-y-8">
            {FAQS.map((category, idx) => (
              <div key={idx} className="bg-card rounded-xl border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  {category.icon}
                  <h3 className="text-xl font-headline font-bold">{category.category}</h3>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, itemIdx) => (
                    <AccordionItem key={itemIdx} value={`item-${idx}-${itemIdx}`}>
                      <AccordionTrigger className="text-left font-medium hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="bg-primary text-primary-foreground rounded-2xl p-8 text-center space-y-4">
            <h3 className="text-xl font-headline font-bold">Still have questions?</h3>
            <p className="opacity-90 max-w-md mx-auto">Our support team is available 24/7 to help you with any issues you might be facing.</p>
            <Button variant="secondary" className="font-bold">
              Contact Support
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
