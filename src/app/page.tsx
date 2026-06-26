
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { MessageSquare, Video, Shield, Zap, Globe, Users, Loader2, Mic } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, deleteDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore';

export default function Home() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  const chatImg = PlaceHolderImages.find(img => img.id === 'feature-chat');
  const videoImg = PlaceHolderImages.find(img => img.id === 'feature-video');
  const safetyImg = PlaceHolderImages.find(img => img.id === 'security-shield');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // ── Presence: register this user as online, count live ──────────────────
  useEffect(() => {
    if (!user || !db) return;
    const presenceRef = doc(db, 'presence', user.uid);

    // Write presence doc
    setDoc(presenceRef, { uid: user.uid, onlineAt: serverTimestamp() }).catch(() => {});

    // Listen to the whole presence collection for count
    const unsub = onSnapshot(collection(db, 'presence'), (snap) => {
      setOnlineCount(snap.size);
    });

    // Remove on tab close / unmount
    const handleUnload = () => { deleteDoc(presenceRef).catch(() => {}); };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsub();
      window.removeEventListener('beforeunload', handleUnload);
      deleteDoc(presenceRef).catch(() => {});
    };
  }, [user, db]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent flash of content if not logged in
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-full w-full">
      {/* Mobile Top Bar - handled by AppNav now */}
      
      <div className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] sm:text-sm font-semibold mx-auto">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-primary"></span>
                </span>
                {onlineCount !== null
                  ? `${onlineCount.toLocaleString()} ${onlineCount === 1 ? 'Person' : 'People'} Online Now`
                  : 'Counting online users...'}
              </div>
              
              <h1 className="font-headline font-bold text-3xl sm:text-5xl md:text-7xl tracking-tight leading-tight px-2">
                Connect With The World, <span className="text-primary">Instantly.</span>
              </h1>
              
              <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
                Welcome back, {user.displayName || 'Friend'}! Ready to start a new conversation?
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
                <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-bold gap-2 w-full sm:w-auto" asChild>
                  <Link href="/chat/text">
                    <MessageSquare size={18} className="sm:size-5" /> Start Text Chat
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-bold gap-2 w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary/5" asChild>
                  <Link href="/chat/voice">
                    <Mic size={18} className="sm:size-5" /> Voice Chat
                  </Link>
                </Button>
              </div>
              
              <div className="pt-8 sm:pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 text-xs sm:text-sm">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2"><Zap size={16} /> <span>Ultra Fast</span></div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2"><Shield size={16} /> <span>Secure</span></div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2"><Globe size={16} /> <span>Global</span></div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2"><Users size={16} /> <span>Private</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
              <h2 className="font-headline font-bold text-2xl sm:text-3xl md:text-4xl px-4">Why Choose Connectify?</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-6">We've reimagined random chat from the ground up to be safer and more engaging.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
                <CardContent className="p-0">
                  <div className="relative h-52 sm:h-56 w-full">
                    <Image 
                      src="https://i.pinimg.com/736x/ec/41/40/ec41408682d52754821e458724ba5a6c.jpg" 
                      alt="Instant Matching" 
                      fill 
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 sm:p-6 space-y-2">
                    <h3 className="font-headline font-bold text-lg sm:text-xl">Instant Matching</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Our advanced discovery engine pairs you with a stranger in milliseconds based on your interests.</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
                <CardContent className="p-0">
                  <div className="relative h-52 sm:h-56 w-full">
                    <Image 
                      src="https://i.pinimg.com/736x/31/d7/54/31d7541ba0746c7ecaa41e6b57281925.jpg" 
                      alt="Voice Chat" 
                      fill 
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 sm:p-6 space-y-2">
                    <h3 className="font-headline font-bold text-lg sm:text-xl">Voice Chat</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Crystal clear P2P voice chat with random strangers. No camera needed — just your voice, instant connection.</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow overflow-hidden group sm:col-span-2 lg:col-span-1">
                <CardContent className="p-0">
                  <div className="relative h-52 sm:h-56 w-full">
                    <Image 
                      src="https://i.pinimg.com/1200x/cd/1c/85/cd1c8575e25ee84a8e6432b20c58bff8.jpg" 
                      alt="Safe Environment" 
                      fill 
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 sm:p-6 space-y-2">
                    <h3 className="font-headline font-bold text-lg sm:text-xl">Safety First</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Real-time moderation and reporting systems ensure a positive, respectful community for everyone.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Community Guidelines */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto bg-primary rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-16 text-primary-foreground overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="font-headline font-bold text-2xl sm:text-3xl md:text-4xl">Your Safety is Our Top Priority</h2>
                  <p className="text-sm sm:text-base text-primary-foreground/80 leading-relaxed">
                    We believe in creating a space where connections are meaningful and safe. Our platform strictly enforces community guidelines.
                  </p>
                  <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent" /> No hate speech or harassment</li>
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent" /> Respect other users' privacy</li>
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent" /> Report inappropriate behavior</li>
                  </ul>
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto font-bold text-xs sm:text-sm">
                    Read Safety Guidelines
                  </Button>
                </div>
                <div className="hidden md:block">
                  <div className="relative w-full aspect-square max-w-sm mx-auto">
                     <Image src="https://i.pinimg.com/1200x/5d/6e/05/5d6e0532769c0cffc7c29ab2ef516653.jpg" alt="Safety" fill className="object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
