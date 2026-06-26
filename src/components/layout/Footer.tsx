
import React from 'react';
import Link from 'next/link';
import { MessageSquare, Instagram } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground">
                <MessageSquare size={14} />
              </div>
              <span className="font-headline font-bold text-lg">Connectify</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The modern way to meet new people. Experience secure, instant, and fun random connections through text and voice.
            </p>
          </div>

          <div>
            <h4 className="font-headline font-bold text-sm mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/chat/text" className="text-muted-foreground hover:text-primary transition-colors">Text Chat</Link></li>
              <li><Link href="/chat/voice" className="text-muted-foreground hover:text-primary transition-colors">Voice Chat</Link></li>
              <li><Link href="/discover" className="text-muted-foreground hover:text-primary transition-colors">Discover People</Link></li>
              <li><Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">My Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-headline font-bold text-sm mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/safety" className="text-muted-foreground hover:text-primary transition-colors">Safety Guidelines</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">Help Center / FAQ</Link></li>
            </ul>
          </div>

          <div />
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Connectify. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="https://www.instagram.com/freedom15073/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Instagram size={18} /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
