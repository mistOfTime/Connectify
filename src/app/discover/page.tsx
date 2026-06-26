"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, BookOpen, Users, MessageSquare, Search, Loader2, MapPin, Sparkles } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type UserProfile = {
  uid: string;
  displayName?: string;
  photoURL?: string;
  university?: string;
  course?: string;
};

const COLORS = [
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-indigo-500 to-blue-600',
];

function getColor(uid: string) {
  const idx = uid.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}

export default function DiscoverPage() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [onlineProfiles, setOnlineProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'university' | 'course'>('all');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  // Register own presence + real-time listener
  useEffect(() => {
    if (!db || !user) return;
    const presenceRef = doc(db, 'presence', user.uid);
    setDoc(presenceRef, { uid: user.uid, onlineAt: serverTimestamp() }).catch(() => {});
    const handleUnload = () => deleteDoc(presenceRef).catch(() => {});
    window.addEventListener('beforeunload', handleUnload);

    // Real-time presence listener - fires instantly when anyone joins/leaves
    const unsub = onSnapshot(collection(db, 'presence'), async (snap) => {
      const uids = snap.docs.map((d: any) => d.id).filter((uid: string) => uid !== user.uid);
      const profiles = await Promise.all(uids.map(async (uid: string) => {
        try {
          const profileSnap = await getDoc(doc(db, 'users', uid));
          if (profileSnap.exists()) return { uid, ...profileSnap.data() } as UserProfile;
          return { uid } as UserProfile;
        } catch { return { uid } as UserProfile; }
      }));
      setOnlineProfiles(profiles);
      setIsLoading(false);
    });

    return () => {
      unsub();
      window.removeEventListener('beforeunload', handleUnload);
      deleteDoc(presenceRef).catch(() => {});
    };
  }, [db, user?.uid]);

  const filtered = useMemo(() => {
    if (!search.trim()) return onlineProfiles;
    const q = search.toLowerCase();
    return onlineProfiles.filter(p =>
      p.displayName?.toLowerCase().includes(q) ||
      p.university?.toLowerCase().includes(q) ||
      p.course?.toLowerCase().includes(q)
    );
  }, [onlineProfiles, search]);

  if (loading || !user) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline font-bold text-2xl tracking-tight">Discover</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {isLoading ? 'Loading...' : `${onlineProfiles.length} ${onlineProfiles.length === 1 ? 'person' : 'people'} online now`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles size={20} className="text-primary" />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, university, course..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="flex-grow overflow-y-auto px-4 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden aspect-[3/4] bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-inner">
              <Users size={40} className="text-primary/40" />
            </div>
            <div>
              <p className="font-bold text-lg">{search ? 'No results' : 'No one online yet'}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {search ? 'Try a different search term' : 'Be the first! Invite your friends to join Connectify.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((profile) => (
              <ProfileCard key={profile.uid} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ profile }: { profile: UserProfile }) {
  const color = getColor(profile.uid);
  const initials = profile.displayName?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="group relative rounded-3xl overflow-hidden aspect-[3/4] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      {/* Background — photo or gradient */}
      {profile.photoURL ? (
        <img
          src={profile.photoURL}
          alt={profile.displayName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", color, "flex items-center justify-center")}>
          <span className="text-white font-bold text-5xl opacity-80">{initials}</span>
        </div>
      )}

      {/* Dark gradient overlay at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* Online badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-full px-2 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white text-[10px] font-semibold">Online</span>
      </div>

      {/* Info at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <p className="text-white font-bold text-base leading-tight truncate">
          {profile.displayName || 'Anonymous'}
        </p>
        {profile.university && (
          <p className="text-white/75 text-[11px] flex items-center gap-1 mt-0.5 truncate">
            <GraduationCap size={10} className="shrink-0 opacity-80" />
            {profile.university}
          </p>
        )}
        {profile.course && (
          <p className="text-white/65 text-[10px] flex items-center gap-1 truncate">
            <BookOpen size={9} className="shrink-0 opacity-70" />
            {profile.course}
          </p>
        )}

        {/* Chat button — shows on hover */}
        <Link
          href="/chat/text"
          onClick={e => e.stopPropagation()}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-2xl bg-white text-black text-xs font-bold hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-200"
        >
          <MessageSquare size={13} /> Chat
        </Link>
      </div>
    </div>
  );
}
