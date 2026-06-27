"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, PhoneOff, Send, AlertTriangle, Loader2, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || 'https://connectify-production-810e.up.railway.app';

export default function VoiceChat() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [messages, setMessages] = useState<{ text: string; self: boolean; avatar?: string; name?: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<any>(null);
  const partnerIdRef = useRef<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const userDocRef = React.useMemo(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  const { data: profileData } = useDoc(userDocRef);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  // ── Socket.IO setup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || socketRef.current?.connected) return;
    import('socket.io-client').then(({ io }) => {
      if (socketRef.current?.connected) return;
      const socket = io(SIGNAL_URL, { transports: ['websocket', 'polling'], reconnection: true });
      socketRef.current = socket;

      socket.on('connect', () => console.log('[Voice] Socket connected:', socket.id));
      socket.on('waiting', () => setIsSearching(true));

      socket.on('matched', ({ roomId, role, partnerId }: any) => {
        console.log('[Voice] Matched! role:', role, 'partner:', partnerId);
        roomIdRef.current = roomId;
        partnerIdRef.current = partnerId;
        setIsSearching(false);
        setIsConnected(true);
        toast({ title: 'Connected!', description: 'Voice chat started. Say hello!' });
        // Start streaming audio to partner
        startAudioStream(socket, partnerId);
      });

      // Receive audio chunks from partner and play them
      socket.on('audio-chunk', ({ chunk }: any) => {
        playAudioChunk(chunk);
      });

      socket.on('chat-message', ({ text, avatar, name }: any) => {
        setMessages(p => [...p, { text, self: false, avatar, name }]);
      });

      socket.on('partner-disconnected', () => {
        setIsConnected(false); setIsSearching(false);
        setMessages(p => [...p, { text: 'Stranger disconnected.', self: false }]);
        stopAudioStream();
      });

      socket.on('disconnect', () => {
        console.log('[Voice] Socket disconnected');
      });
    });

    return () => {
      if (socketRef.current && !user) { socketRef.current.disconnect(); socketRef.current = null; }
    };
  }, [user?.uid]);

  // ── Audio streaming via Socket.IO ─────────────────────────────────────────
  const startAudioStream = (socket: any, partnerId: string) => {
    if (!localStreamRef.current) return;
    try {
      const mediaRecorder = new MediaRecorder(localStreamRef.current, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm',
        audioBitsPerSecond: 32000,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && socket.connected && partnerIdRef.current) {
          const reader = new FileReader();
          reader.onload = () => {
            socket.emit('audio-chunk', { to: partnerIdRef.current, chunk: reader.result });
          };
          reader.readAsDataURL(e.data);
        }
      };

      mediaRecorder.start(100); // Send every 100ms
    } catch (err) {
      console.error('[Voice] MediaRecorder error:', err);
    }
  };

  const stopAudioStream = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close();
    audioContextRef.current = null;
  };

  // ── Play received audio ───────────────────────────────────────────────────
  const playAudioChunk = (dataUrl: string) => {
    try {
      const audio = new Audio(dataUrl);
      audio.play().catch(() => {});
    } catch (_) {}
  };

  // ── Visualizer ────────────────────────────────────────────────────────────
  const startVisualizer = (stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(100, avg * 2));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (_) {}
  };

  // ── Start ─────────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!user || !socketRef.current) return;
    setIsSearching(true); setIsConnected(false); setMessages([]);
    stopAudioStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      startVisualizer(stream);
    } catch {
      toast({ variant: 'destructive', title: 'Mic Error', description: 'Allow microphone access to use Voice Chat.' });
      setIsSearching(false); return;
    }
    socketRef.current.emit('find-match', { uid: user.uid, country: 'any', gender: 'any' });
  };

  // ── Stop ──────────────────────────────────────────────────────────────────
  const handleStop = () => {
    socketRef.current?.emit('stop');
    setIsConnected(false); setIsSearching(false);
    stopAudioStream();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setAudioLevel(0);
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

  useEffect(() => {
    return () => {
      stopAudioStream();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const myPhoto = (profileData as any)?.photoURL || user?.photoURL || '';
  const myName = (profileData as any)?.displayName || user?.displayName || 'You';

  if (loading || !user) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background px-4 py-3 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="font-headline font-bold text-lg">Voice Chat</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span className={cn("w-2 h-2 rounded-full inline-block", isConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40")} />
            {isConnected ? 'Live voice session' : isSearching ? 'Searching for someone...' : 'Random voice matching'}
          </p>
        </div>
        {isConnected && (
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">● LIVE</span>
        )}
      </header>

      <main className="flex-grow overflow-hidden flex flex-col md:flex-row gap-0 min-h-0">
        {/* Voice area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background p-6 gap-6 min-h-[260px]">

          {/* Stranger circle */}
          <div className="flex flex-col items-center gap-3">
            <div className={cn("relative w-28 h-28 rounded-full flex items-center justify-center transition-all",
              isConnected ? "bg-primary/10 ring-4 ring-primary/20" : "bg-muted")}>
              {/* Audio level rings */}
              {isConnected && audioLevel > 10 && (
                <div className="absolute inset-0 rounded-full border-4 border-primary/40 animate-ping scale-110" style={{ animationDuration: '0.8s' }} />
              )}
              {isConnected && audioLevel > 30 && (
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping scale-125" style={{ animationDuration: '1.2s' }} />
              )}
              {isSearching ? (
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              ) : isConnected ? (
                <Mic className="w-10 h-10 text-primary" />
              ) : (
                <Users className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{isSearching ? 'Searching...' : isConnected ? 'Stranger' : 'No one connected'}</p>
              <p className={cn("text-sm", isConnected ? "text-emerald-500" : "text-muted-foreground")}>
                {isConnected ? '🎙️ Voice active' : isSearching ? 'Finding someone...' : 'Press Start to begin'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {!isConnected && !isSearching ? (
              <button onClick={handleStart}
                className="flex items-center gap-2.5 px-10 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                <Mic size={22} /> Start
              </button>
            ) : (
              <>
                <button onClick={toggleMic}
                  className={cn("w-14 h-14 rounded-full border-2 transition-all shadow-md flex items-center justify-center",
                    micOn ? "bg-background border-primary text-primary hover:bg-primary/10" : "bg-red-500 border-red-400 text-white")}>
                  {micOn ? <Mic size={22} /> : <MicOff size={22} />}
                </button>
                <button onClick={handleStop}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white border-2 border-red-400 transition-all shadow-md flex items-center justify-center">
                  <PhoneOff size={22} />
                </button>
              </>
            )}
          </div>

          {/* Your avatar */}
          <div className="flex flex-col items-center gap-1.5 opacity-50">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              {myPhoto ? <img src={myPhoto} alt="You" className="w-full h-full object-cover" /> : <span className="text-primary font-bold text-lg">{myName[0]?.toUpperCase()}</span>}
            </div>
            <p className="text-xs text-muted-foreground font-medium">You</p>
          </div>
        </div>

        {/* Chat panel */}
        <div className="w-full md:w-[340px] bg-card border-t md:border-t-0 md:border-l flex flex-col overflow-hidden h-[220px] md:h-full">
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-3 space-y-2">
            <div className="bg-muted/50 rounded-xl p-2.5 text-[10px] text-muted-foreground flex gap-2">
              <AlertTriangle size={11} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>Voice chat is anonymous. Don't share personal info.</span>
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
          <form onSubmit={handleSend} className="p-3 border-t flex gap-2 items-center bg-card shrink-0">
            <input value={inputValue} onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); } }}
              placeholder={isConnected ? "Write a message..." : "Start to chat..."}
              className="flex-grow text-sm outline-none px-3 py-2 rounded-xl bg-muted placeholder:text-muted-foreground/60" />
            <button type="button" onClick={e => handleSend(e as unknown as React.FormEvent)}
              disabled={!inputValue.trim() || !isConnected}
              className={cn("p-2 rounded-xl transition-all shrink-0", inputValue.trim() && isConnected ? "bg-primary text-white" : "bg-muted text-muted-foreground/40")}>
              <Send size={15} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}