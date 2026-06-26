"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Send, RefreshCw, Flag, ShieldAlert, XCircle, PlusCircle, Loader2, GraduationCap, BookOpen, User as UserIcon } from 'lucide-react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, collection, addDoc, onSnapshot, deleteDoc, getDocs, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ReportModal } from '@/components/ui/ReportModal';

type Message = {
  id: string;
  sender: 'me' | 'stranger' | 'system';
  text: string;
  timestamp: Date;
  avatar?: string;
  name?: string;
};

type StrangerProfile = {
  displayName?: string;
  photoURL?: string;
  university?: string;
  course?: string;
};

export default function TextChat() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [strangerProfile, setStrangerProfile] = useState<StrangerProfile | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const roomIdRef = useRef<string | null>(null);
  const unsubRefs = useRef<Array<() => void>>([]);

  const userDocRef = useMemo(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  const { data: profileData } = useDoc(userDocRef);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const stopUnsubs = () => { unsubRefs.current.forEach(u => u()); unsubRefs.current = []; };

  const handleSubmitReport = async (reason: string, details: string) => {
    if (!db || !user) return;
    await addDoc(collection(db, 'reports'), {
      reporterUid: user.uid,
      reporterEmail: user.email || '',
      reporterName: (profileData as any)?.displayName || user.displayName || 'Unknown',
      reportedName: strangerProfile?.displayName || 'Stranger',
      reason,
      details,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    toast({ title: 'Report submitted', description: 'Our team will review it shortly.' });
  };

  const cleanup = useCallback(async () => {
    stopUnsubs();
    if (roomIdRef.current && db) {
      try { await deleteDoc(doc(db, 'textChatRooms', roomIdRef.current)); } catch (_) {}
    }
    roomIdRef.current = null;
    setStrangerProfile(null);
  }, [db]);

  const addSystemMsg = (text: string) => {
    setMessages(p => [...p, { id: Date.now().toString(), sender: 'system', text, timestamp: new Date() }]);
  };

  const subscribeMessages = useCallback((roomId: string, myUid: string) => {
    if (!db) return;
    const q = query(collection(db, 'textChatRooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap: any) => {
      snap.docChanges().forEach((change: any) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const isSelf = d.uid === myUid;
          setMessages(p => [...p, {
            id: change.doc.id,
            sender: isSelf ? 'me' : 'stranger',
            text: d.text,
            timestamp: d.createdAt?.toDate?.() ?? new Date(),
            avatar: d.photoURL,
            name: d.displayName,
          }]);
        }
      });
    });
    unsubRefs.current.push(unsub);
  }, [db]);

  const handleStart = useCallback(async () => {
    if (!db || !user) return;
    setIsSearching(true);
    setIsChatActive(false);
    setMessages([]);
    await cleanup();

    const roomsCol = collection(db, 'textChatRooms');
    const snap = await getDocs(roomsCol);
    const waiting = snap.docs.find((d: any) => d.data().status === 'waiting' && d.data().uid !== user.uid);

    if (waiting) {
      roomIdRef.current = waiting.id;
      const roomRef = doc(db, 'textChatRooms', waiting.id);
      const wData = waiting.data();
      // Fetch stranger profile
      if (wData.uid && db) {
        const sDoc = await getDocs(collection(db, 'users'));
        const sProfile = sDoc.docs.find((d: any) => d.id === wData.uid)?.data();
        if (sProfile) setStrangerProfile(sProfile as StrangerProfile);
      }
      await updateDoc(roomRef, { status: 'connected', partnerUid: user.uid });
      subscribeMessages(waiting.id, user.uid);
      const u1 = onSnapshot(roomRef, (s: any) => {
        if (!s.exists()) { setIsChatActive(false); addSystemMsg('Stranger has disconnected.'); cleanup(); }
      });
      unsubRefs.current.push(u1);
      setIsSearching(false);
      setIsChatActive(true);
      addSystemMsg('Connected! Say hi 👋');
    } else {
      const myProfile = profileData ?? {};
      const roomRef = await addDoc(roomsCol, {
        uid: user.uid,
        status: 'waiting',
        photoURL: (myProfile as any).photoURL || user.photoURL || '',
        displayName: (myProfile as any).displayName || user.displayName || '',
        university: (myProfile as any).university || '',
        course: (myProfile as any).course || '',
      });
      roomIdRef.current = roomRef.id;
      const u1 = onSnapshot(roomRef, async (s: any) => {
        if (!s.exists()) { setIsSearching(false); return; }
        const data = s.data();
        if (data.status === 'connected' && data.partnerUid) {
          // Fetch partner profile
          try {
            const partnerRef = doc(db, 'users', data.partnerUid);
            const partnerSnap = await getDocs(collection(db, 'users'));
            const pData = partnerSnap.docs.find((d: any) => d.id === data.partnerUid)?.data();
            if (pData) setStrangerProfile(pData as StrangerProfile);
          } catch (_) {}
          subscribeMessages(roomRef.id, user.uid);
          const u2 = onSnapshot(roomRef, (s2: any) => {
            if (!s2.exists()) { setIsChatActive(false); addSystemMsg('Stranger has disconnected.'); cleanup(); }
          });
          unsubRefs.current.push(u2);
          setIsSearching(false);
          setIsChatActive(true);
          addSystemMsg('Connected! Say hi 👋');
        }
      });
      unsubRefs.current = [u1];
    }
  }, [db, user, profileData, cleanup, subscribeMessages]);

  const handleStop = useCallback(async () => {
    await cleanup();
    setIsChatActive(false);
    setIsSearching(false);
    addSystemMsg('You have disconnected.');
  }, [cleanup]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !isChatActive || !roomIdRef.current || !db || !user) return;
    const text = inputValue.trim();
    setInputValue('');
    const latestPhoto = (profileData as any)?.photoURL || user.photoURL || '';
    const latestName = (profileData as any)?.displayName || user.displayName || 'You';
    try {
      await addDoc(collection(db, 'textChatRooms', roomIdRef.current, 'messages'), {
        text, uid: user.uid, photoURL: latestPhoto, displayName: latestName, createdAt: serverTimestamp(),
      });
    } catch (_) {
      toast({ variant: 'destructive', title: 'Send failed' });
    }
  };

  useEffect(() => { return () => { cleanup(); }; }, [cleanup]);

  const myPhoto = (profileData as any)?.photoURL || user?.photoURL || '';
  const myName = (profileData as any)?.displayName || user?.displayName || 'You';

  if (loading || !user) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <>
    <div className="flex flex-col h-full bg-muted/20 overflow-hidden">
      <header className="h-14 md:h-16 border-b bg-background flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-2 md:gap-3">
          
          <h1 className="font-headline font-bold text-base md:text-lg">Text Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          {isChatActive ? (
            <button onClick={handleStop} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold border border-red-200 transition-colors">
              <XCircle size={14} /> End Chat
            </button>
          ) : !isSearching ? (
            <button onClick={handleStart} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs font-semibold transition-colors">
              <PlusCircle size={14} /> New Chat
            </button>
          ) : null}
        </div>
      </header>

      <main className="flex-grow overflow-hidden flex flex-col p-2 sm:p-4 md:p-6 max-w-5xl mx-auto w-full">
        <div className="flex-grow bg-card rounded-2xl shadow-sm border flex flex-col overflow-hidden min-h-0">

          {/* Stranger profile header */}
          <div className="px-4 py-3 border-b bg-card shrink-0">
            {isSearching ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="space-y-1.5">
                  <div className="w-28 h-3 rounded bg-muted animate-pulse" />
                  <div className="w-20 h-2.5 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ) : strangerProfile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {strangerProfile.photoURL
                      ? <img src={strangerProfile.photoURL} alt="Stranger" className="w-full h-full object-cover" />
                      : <span className="text-blue-600 font-bold text-sm">{strangerProfile.displayName?.[0]?.toUpperCase() ?? 'S'}</span>
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{strangerProfile.displayName || 'Stranger'}</span>
                      {isChatActive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {strangerProfile.university && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <GraduationCap size={10} className="text-primary" />{strangerProfile.university}
                        </span>
                      )}
                      {strangerProfile.course && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <BookOpen size={10} className="text-primary" />{strangerProfile.course}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setReportOpen(true)} className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors" title="Report user"><Flag size={16} /></button>
                  <button onClick={() => setReportOpen(true)} className="p-2 rounded-xl hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors" title="Report violation"><ShieldAlert size={16} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <UserIcon size={18} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">No one connected</p>
                    <p className="text-[10px] text-muted-foreground">Press New Chat to start</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setReportOpen(true)} className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors" title="Report user"><Flag size={16} /></button>
                  <button onClick={() => setReportOpen(true)} className="p-2 rounded-xl hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors" title="Report violation"><ShieldAlert size={16} /></button>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-grow overflow-y-auto px-4 py-4 space-y-3">
            {isSearching ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-12">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="font-semibold text-base animate-pulse">Looking for someone...</p>
                <p className="text-xs text-muted-foreground text-center max-w-xs">Matching you with a random stranger nearby</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center">
                  <PlusCircle size={28} className="text-primary/40" />
                </div>
                <p className="font-semibold text-muted-foreground">Start a conversation</p>
                <p className="text-xs text-muted-foreground max-w-xs">Click New Chat to get matched with a random stranger</p>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.sender === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full italic">{msg.text}</span>
                    </div>
                  );
                }
                const isSelf = msg.sender === 'me';
                return (
                  <div key={msg.id} className={cn("flex items-end gap-2", isSelf ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("shrink-0 w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold shadow-sm", isSelf ? "bg-primary" : "bg-blue-500")}>
                      {(isSelf ? myPhoto : msg.avatar)
                        ? <img src={isSelf ? myPhoto : msg.avatar!} alt={isSelf ? 'You' : 'Stranger'} className="w-full h-full object-cover" />
                        : <span>{isSelf ? (myName[0]?.toUpperCase() ?? 'Y') : (msg.name?.[0]?.toUpperCase() ?? 'S')}</span>
                      }
                    </div>
                    <div className={cn("max-w-[75%] px-3 py-2 rounded-2xl text-xs md:text-sm break-words shadow-sm", isSelf ? "bg-primary text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                      {msg.text}
                      <p className={cn("text-[9px] mt-1 opacity-60", isSelf ? "text-right" : "text-left")}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-card shrink-0">
            {!isSearching && !isChatActive && messages.length > 0 ? (
              <div className="flex flex-col items-center gap-2 py-1">
                <p className="text-xs text-muted-foreground">Chat ended.</p>
                <button onClick={handleStart} className="px-6 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                  Start New Chat
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex gap-2 items-center">
                <button type="button" onClick={handleStart} disabled={isSearching}
                  className="shrink-0 h-10 w-10 rounded-xl border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-40">
                  <RefreshCw size={16} className={isSearching ? 'animate-spin' : ''} />
                </button>
                <div className="relative flex-grow">
                  <input value={inputValue} onChange={e => setInputValue(e.target.value)}
                    placeholder={isSearching ? 'Searching...' : isChatActive ? 'Type a message...' : 'Start a chat to type...'}
                    className="w-full h-10 bg-muted/40 border border-muted-foreground/20 rounded-xl px-4 pr-11 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                  />
                  <button type="submit" disabled={!inputValue.trim() || !isChatActive}
                    className="absolute right-1.5 top-1.5 h-7 w-7 bg-primary hover:bg-primary/90 disabled:opacity-40 rounded-lg flex items-center justify-center text-white transition-all">
                    <Send size={13} />
                  </button>
                </div>
              </form>
            )}
            <p className="text-[9px] text-center mt-2 text-muted-foreground/60">Be respectful · No harassment · No personal info</p>
          </div>
        </div>
      </main>
    </div>
    <ReportModal
      isOpen={reportOpen}
      onClose={() => setReportOpen(false)}
      onSubmit={handleSubmitReport}
      reportedName={strangerProfile?.displayName || 'Stranger'}
    />
    </>
  );
}