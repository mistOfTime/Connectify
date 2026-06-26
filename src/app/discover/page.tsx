"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, BookOpen, Users, MessageSquare, Search, Loader2 } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type UserProfile = {
  uid: string;
  displayName?: string;
  photoURL?: string;
  university?: string;
  course?: string;
};

export default function DiscoverPage() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [onlineProfiles, setOnlineProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  useEffect(() => {
    if (!db || !user) return;
    const unsub = onSnapshot(collection(db, 'presence'), async (snap) => {
      const uids = snap.docs.map((d: any) => d.id).filter((uid: string) => uid !== user.uid);
      const profiles = await Promise.all(uids.map(async (uid: string) => {
        try {
          const profileSnap = await getDoc(doc(db, 'users', uid));
          if (profileSnap.exists()) return { uid, ...profileSnap.data() } as UserProfile;
          return { uid, displayName: 'Anonymous' } as UserProfile;
        } catch { return { uid, displayName: 'Anonymous' } as UserProfile; }
      }));
      setOnlineProfiles(profiles);
      setIsLoading(false);
    });
    return () => unsub();
  }, [db, user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return onlineProfiles;
    const q = search.toLowerCase();
    return onlineProfiles.filter(p =>
      p.displayName?.toLowerCase().includes(q) ||
      p.university?.toLowerCase().includes(q) ||
      p.course?.toLowerCase().includes(q)
    );
  }, [onlineProfiles, search]);

  if (loading || !user) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <header className="h-14 md:h-16 border-b bg-background flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-2">
          
          <h1 className="font-headline font-bold text-lg">Discover People</h1>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
          <Users size={16} className="text-primary" />
          <span>{onlineProfiles.length} online</span>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, university or course..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl p-4 space-y-3 border animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto" />
                  <div className="h-3 bg-muted rounded w-3/4 mx-auto" />
                  <div className="h-2.5 bg-muted rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center">
                <Users size={36} className="text-primary/30" />
              </div>
              <p className="font-semibold text-muted-foreground">{search ? 'No results found' : 'No one else online right now'}</p>
              <p className="text-sm text-muted-foreground max-w-xs">{search ? 'Try a different search term' : 'Check back later or invite a friend!'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((profile) => (
                <div key={profile.uid} className="bg-card rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col items-center p-5 gap-3 group">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 border-2 border-card shadow-sm flex items-center justify-center">
                      {profile.photoURL
                        ? <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                        : <span className="text-primary font-bold text-2xl">{profile.displayName?.[0]?.toUpperCase() ?? '?'}</span>
                      }
                    </div>
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card" />
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <p className="font-semibold text-sm truncate">{profile.displayName || 'Anonymous'}</p>
                    {profile.university && (
                      <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mt-0.5 truncate">
                        <GraduationCap size={10} className="text-primary shrink-0" />{profile.university}
                      </p>
                    )}
                    {profile.course && (
                      <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground truncate">
                        <BookOpen size={10} className="text-primary shrink-0" />{profile.course}
                      </p>
                    )}
                  </div>
                  <Link href="/chat/text"
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-semibold transition-all group-hover:bg-primary group-hover:text-white">
                    <MessageSquare size={13} /> Start Chat
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
