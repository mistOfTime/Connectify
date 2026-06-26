"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, PhoneOff, Send, AlertTriangle, Loader2, ChevronDown, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || 'https://connectify-production-810e.up.railway.app';

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:global.relay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
  ],
};

export default function VoiceChat() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [messages, setMessages] = useState<{ text: string; self: boolean; avatar?: string; name?: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<any>(null);
  const partnerIdRef = useRef<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const userDocRef = React.useMemo(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  const { data: profileData } = useDoc(userDocRef);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  useEffect(() => {
    if (!user || socketRef.current?.connected) return;
    import('socket.io-client').then(({ io }) => {
      if (socketRef.current?.connected) return;
      const socket = io(SIGNAL_URL, { transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 10 });
      socketRef.current = socket;
      socket.on('connect', () => console.log('[Voice] Connected:', socket.id));
      socket.on('waiting', () => setIsSearching(true));
      socket.on('matched', async ({ roomId, role, partnerId }: any) => {
        roomIdRef.current = roomId; partnerIdRef.current = partnerId;
        let attempts = 0;
        while (!localStreamRef.current && attempts < 30) { await new Promise(r => setTimeout(r, 100)); attempts++; }
        const stream = localStreamRef.current; if (!stream) return;
        if (role === 'caller') {
          const pc = buildPC(stream);
          const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
          socket.emit('offer', { roomId, offer, to: partnerId });
        }
      });
      socket.on('offer', async ({ offer, from, roomId }: any) => {
        partnerIdRef.current = from; roomIdRef.current = roomId;
        let attempts = 0;
        while (!localStreamRef.current && attempts < 30) { await new Promise(r => setTimeout(r, 100)); attempts++; }
        const stream = localStreamRef.current; if (!stream) return;
        const pc = buildPC(stream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
        socket.emit('answer', { roomId, answer, to: from });
      });
      // Buffer ICE candidates before remote description is set
      const iceCandidateBuffer: RTCIceCandidateInit[] = [];
      let remoteSet = false;
      socket.on('answer', async ({ answer }: any) => {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {});
          remoteSet = true;
          for (const c of iceCandidateBuffer) { pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}); }
          iceCandidateBuffer.length = 0;
        }
      });
      socket.on('ice-candidate', async ({ candidate }: any) => {
        if (!candidate) return;
        if (pcRef.current && remoteSet) {
          pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        } else {
          iceCandidateBuffer.push(candidate);
        }
      });
      socket.on('chat-message', ({ text, avatar, name }: any) => {
        setMessages(p => [...p, { text, self: false, avatar, name }]);
      });
      socket.on('partner-disconnected', () => {
        setIsConnected(false); setIsSearching(false);
        setMessages(p => [...p, { text: 'Stranger disconnected.', self: false }]);
        pcRef.current?.close(); pcRef.current = null;
      });
    });
  }, [user?.uid]);

  const buildPC = (stream: MediaStream) => {
    pcRef.current?.close();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.ontrack = (e) => {
      if (e.streams?.[0] && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.play().catch(() => {});
      }
    };
    pc.onicecandidate = (e) => {
      if (e.candidate && partnerIdRef.current && socketRef.current)
        socketRef.current.emit('ice-candidate', { roomId: roomIdRef.current, candidate: e.candidate.toJSON(), to: partnerIdRef.current });
    };
    pc.onconnectionstatechange = () => {
      console.log('[Voice PC]', pc.connectionState);
      if (pc.connectionState === 'connected') { setIsSearching(false); setIsConnected(true); toast({ title: 'Connected!', description: 'Voice chat started.' }); }
      if (pc.connectionState === 'failed') { setIsConnected(false); setMessages(p => [...p, { text: 'Connection lost.', self: false }]); }
    };
    return pc;
  };

  const handleStart = async () => {
    if (!user || !socketRef.current) return;
    setIsSearching(true); setIsConnected(false); setMessages([]);
    pcRef.current?.close(); pcRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
    } catch {
      toast({ variant: 'destructive', title: 'Mic Error', description: 'Allow microphone access.' });
      setIsSearching(false); return;
    }
    socketRef.current.emit('find-match', { uid: user.uid, country: 'any', gender: 'any' });
  };

  const handleStop = () => {
    socketRef.current?.emit('stop');
    setIsConnected(false); setIsSearching(false);
    pcRef.current?.close(); pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
  };

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    setMicOn(p => !p);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !isConnected || !partnerIdRef.current) return;
    const text = inputValue.trim(); setInputValue('');
    const myPhoto = (profileData as any)?.photoURL || user?.photoURL || '';
    const myName = (profileData as any)?.displayName || user?.displayName || 'You';
    setMessages(p => [...p, { text, self: true, avatar: myPhoto, name: myName }]);
    socketRef.current?.emit('chat-message', { roomId: roomIdRef.current, text, to: partnerIdRef.current, avatar: myPhoto, name: myName });
  };

  useEffect(() => { return () => { localStreamRef.current?.getTracks().forEach(t => t.stop()); }; }, []);

  const myPhoto = (profileData as any)?.photoURL || user?.photoURL || '';
  const myName = (profileData as any)?.displayName || user?.displayName || 'You';

  if (loading || !user) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-full bg-muted/20 overflow-hidden">
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      <header className="h-14 md:h-16 border-b bg-background flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-2">
          
          <h1 className="font-headline font-bold text-lg">Voice Chat</h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Random voice matching
        </div>
      </header>

      <main className="flex-grow overflow-hidden flex flex-col md:flex-row gap-0">
        {/* Voice area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background p-8 gap-8 min-h-[280px]">
          {/* Stranger visualizer */}
          <div className="flex flex-col items-center gap-4">
            <div className={cn("relative w-32 h-32 rounded-full flex items-center justify-center", isConnected ? "bg-primary/10" : "bg-muted")}>
              {isConnected && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
                  <div className="absolute inset-[-8px] rounded-full border-2 border-primary/20 animate-pulse" />
                </>
              )}
              {isSearching ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : isConnected ? (
                <Mic className="w-12 h-12 text-primary" />
              ) : (
                <Users className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{isSearching ? 'Searching...' : isConnected ? 'Stranger' : 'No one connected'}</p>
              <p className={cn("text-sm", isConnected ? "text-emerald-500" : "text-muted-foreground")}>
                {isConnected ? '● Connected' : isSearching ? 'Looking for someone...' : 'Press Start to find someone'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {!isConnected && !isSearching ? (
              <button onClick={handleStart} className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg shadow-lg transition-all active:scale-95">
                <Mic size={20} /> Start
              </button>
            ) : (
              <>
                <button onClick={toggleMic}
                  className={cn("p-4 rounded-full border-2 transition-all shadow-md", micOn ? "bg-background border-primary text-primary hover:bg-primary/10" : "bg-red-500 border-red-400 text-white")}>
                  {micOn ? <Mic size={22} /> : <MicOff size={22} />}
                </button>
                <button onClick={handleStop}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white border-2 border-red-400 transition-all shadow-md">
                  <PhoneOff size={22} />
                </button>
              </>
            )}
          </div>

          {/* Your avatar */}
          <div className="flex flex-col items-center gap-2 opacity-60">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              {myPhoto ? <img src={myPhoto} alt="You" className="w-full h-full object-cover" /> : <span className="text-primary font-bold text-xl">{myName[0]?.toUpperCase()}</span>}
            </div>
            <p className="text-xs text-muted-foreground">You</p>
          </div>
        </div>

        {/* Chat panel */}
        <div className="w-full md:w-[360px] bg-card border-l flex flex-col overflow-hidden h-[280px] md:h-full">
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-3 space-y-2.5">
            <div className="bg-muted/50 rounded-xl p-3 flex gap-2 text-[10px] text-muted-foreground">
              <AlertTriangle size={12} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>Voice chat is anonymous. Be respectful and don't share personal info.</span>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={cn("flex items-end gap-1.5", m.self ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("shrink-0 w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-white text-[10px] font-bold", m.self ? "bg-primary" : "bg-blue-500")}>
                  {(m.self ? myPhoto : m.avatar) ? <img src={m.self ? myPhoto : m.avatar!} className="w-full h-full object-cover" alt="" /> : <span>{m.self ? myName[0]?.toUpperCase() : 'S'}</span>}
                </div>
                <div className={cn("max-w-[78%] px-2.5 py-1.5 rounded-2xl text-xs break-words", m.self ? "bg-primary text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="p-3 border-t flex gap-2 items-center bg-card">
            <input value={inputValue} onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); } }}
              placeholder={isConnected ? "Write a message..." : "Start to chat..."}
              className="flex-grow text-sm outline-none px-3 py-2 rounded-xl bg-muted placeholder:text-muted-foreground/60" />
            <button type="button" onClick={e => handleSend(e as unknown as React.FormEvent)} disabled={!inputValue.trim() || !isConnected}
              className={cn("p-2 rounded-xl transition-all", inputValue.trim() && isConnected ? "bg-primary text-white" : "bg-muted text-muted-foreground/40")}>
              <Send size={15} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}