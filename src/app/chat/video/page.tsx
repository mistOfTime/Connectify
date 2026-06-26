"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Square, Send, Loader2, AlertTriangle, Mic, MicOff, Video, VideoOff, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const COUNTRIES = [
  { code: "AF", name: "Afghanistan", flag: "🇦🇫" },{ code: "AL", name: "Albania", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿" },{ code: "AD", name: "Andorra", flag: "🇦🇩" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },{ code: "AG", name: "Antigua & Barbuda", flag: "🇦🇬" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },{ code: "AM", name: "Armenia", flag: "🇦🇲" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },{ code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿" },{ code: "BS", name: "Bahamas", flag: "🇧🇸" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭" },{ code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "BB", name: "Barbados", flag: "🇧🇧" },{ code: "BY", name: "Belarus", flag: "🇧🇾" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },{ code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "BJ", name: "Benin", flag: "🇧🇯" },{ code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },{ code: "BA", name: "Bosnia & Herzegovina", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", flag: "🇧🇼" },{ code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", flag: "🇧🇳" },{ code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },{ code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "CV", name: "Cabo Verde", flag: "🇨🇻" },{ code: "KH", name: "Cambodia", flag: "🇰🇭" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },{ code: "CA", name: "Canada", flag: "🇨��" },
  { code: "CF", name: "Central African Rep.", flag: "🇨🇫" },{ code: "TD", name: "Chad", flag: "🇹🇩" },
  { code: "CL", name: "Chile", flag: "��🇱" },{ code: "CN", name: "China", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },{ code: "CG", name: "Congo", flag: "🇨🇬" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },{ code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },{ code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },{ code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯" },{ code: "DO", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },{ code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },{ code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },{ code: "FJ", name: "Fiji", flag: "🇫🇯" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },{ code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GA", name: "Gabon", flag: "🇬🇦" },{ code: "GM", name: "Gambia", flag: "🇬🇲" },
  { code: "GE", name: "Georgia", flag: "🇬🇪" },{ code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },{ code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },{ code: "GN", name: "Guinea", flag: "🇬🇳" },
  { code: "HT", name: "Haiti", flag: "🇭🇹" },{ code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },{ code: "IS", name: "Iceland", flag: "🇮🇸" },
  { code: "IN", name: "India", flag: "🇮🇳" },{ code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "IR", name: "Iran", flag: "🇮🇷" },{ code: "IQ", name: "Iraq", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },{ code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },{ code: "JM", name: "Jamaica", flag: "��🇲" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },{ code: "JO", name: "Jordan", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿" },{ code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼" },{ code: "KG", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "LA", name: "Laos", flag: "🇱🇦" },{ code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧" },{ code: "LR", name: "Liberia", flag: "🇱🇷" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },{ code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬" },{ code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "MV", name: "Maldives", flag: "🇲🇻" },{ code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },{ code: "MR", name: "Mauritania", flag: "🇲🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },{ code: "MD", name: "Moldova", flag: "🇲🇩" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳" },{ code: "ME", name: "Montenegro", flag: "🇲🇪" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },{ code: "MZ", name: "Mozambique", flag: "��🇿" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲" },{ code: "NA", name: "Namibia", flag: "🇳🇦" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },{ code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },{ code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },{ code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },{ code: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },{ code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "PG", name: "Papua New Guinea", flag: "🇵🇬" },{ code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },{ code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },{ code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },{ code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },{ code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },{ code: "SN", name: "Senegal", flag: "🇸🇳" },
  { code: "RS", name: "Serbia", flag: "🇷🇸" },{ code: "SG", name: "Singapore", flag: "��🇬" },
  { code: "SK", name: "Slovakia", flag: "��🇰" },{ code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "SO", name: "Somalia", flag: "🇸🇴" },{ code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "SS", name: "South Sudan", flag: "��🇸" },{ code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },{ code: "SD", name: "Sudan", flag: "🇸🇩" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },{ code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "SY", name: "Syria", flag: "🇸🇾" },{ code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "TJ", name: "Tajikistan", flag: "🇹🇯" },{ code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },{ code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "TT", name: "Trinidad & Tobago", flag: "🇹🇹" },{ code: "TN", name: "Tunisia", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },{ code: "TM", name: "Turkmenistan", flag: "🇹🇲" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },{ code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },{ code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },{ code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿" },{ code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },{ code: "YE", name: "Yemen", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲" },{ code: "ZW", name: "Zimbabwe", flag: "🇿🇼" },
];

const GENDERS = [
  { value: "male",   label: "Male",   emoji: "👨" },
  { value: "female", label: "Female", emoji: "👩" },
  { value: "any",    label: "Any",    emoji: "🧑" },
];

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    // OpenRelay TURN - multiple endpoints for redundancy
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:80?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
    // Metered global relay
    { urls: "turn:global.relay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:global.relay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:global.relay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
  ],
};

function PickerDropdown({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { key: string; display: React.ReactNode; searchText: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.key === value);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter(o => o.searchText.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative w-full h-full">
      <button
        onClick={() => setOpen(p => !p)}
        className="bg-white hover:bg-slate-50 flex flex-col items-center justify-center w-full h-full rounded-2xl shadow-sm border border-slate-300/50 cursor-pointer active:scale-[0.98] transition-all group p-1 text-center overflow-hidden"
      >
        <span className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs md:text-base font-bold text-slate-800 flex items-center gap-0.5 mt-0.5 truncate max-w-full px-1">
          {selected?.display ?? <span>-</span>}
        </span>
        <ChevronDown size={11} className={cn("mt-0.5 text-slate-300 group-hover:text-slate-500 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          {options.length > 5 && (
            <div className="p-2 border-b border-slate-100">
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..." className="w-full text-xs px-3 py-1.5 rounded-lg bg-slate-100 outline-none placeholder:text-slate-400" />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto">
            {filtered.map(o => (
              <button key={o.key} onClick={() => { onChange(o.key); setOpen(false); setSearch(''); }}
                className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors",
                  o.key === value && "bg-primary/5 font-semibold text-primary")}>
                {o.display}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-4 py-3 text-xs text-slate-400">No results</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideoChat() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<{ text: string; self: boolean; avatar?: string; name?: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [country, setCountry] = useState('PH');
  const [gender, setGender] = useState('any');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<any>(null);
  const partnerIdRef = useRef<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const userDocRef = React.useMemo(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  const { data: profileData } = useDoc(userDocRef);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  useEffect(() => {
    if (!user || socketRef.current?.connected) return;
    const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || 'https://connectify-production-810e.up.railway.app';
    import('socket.io-client').then(({ io }) => {
      if (socketRef.current?.connected) return; // prevent double connect
      const socket = io(SIGNAL_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
      });
      socketRef.current = socket;

      socket.on('connect', () => { console.log('[Signal] Connected to server:', socket.id); });
      socket.on('connect_error', (err: any) => { console.error('[Signal] Connection error:', err.message); toast({ variant: 'destructive', title: 'Server Error', description: 'Could not connect to signaling server: ' + err.message }); });
      socket.on('disconnect', (reason: string) => { console.log('[Signal] Disconnected:', reason); });

      socket.on('waiting', () => setIsSearching(true));
      socket.on('matched', async ({ roomId, role, partnerId }: any) => {
        console.log('[Signal] Matched! role:', role, 'partner:', partnerId);
        roomIdRef.current = roomId; partnerIdRef.current = partnerId;
        // Wait up to 3s for stream to be ready
        let attempts = 0;
        while (!localStreamRef.current && attempts < 30) { await new Promise(r => setTimeout(r, 100)); attempts++; }
        const stream = localStreamRef.current;
        if (!stream) { console.error('[Signal] No stream when matched!'); return; }
        if (role === 'caller') {
          const pc = buildPC(stream);
          const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
          console.log('[Signal] Sending offer to', partnerId);
          socket.emit('offer', { roomId, offer, to: partnerId });
        } else {
          console.log('[Signal] Callee waiting for offer from', partnerId);
        }
      });
      socket.on('offer', async ({ offer, from, roomId }: any) => {
        console.log('[Signal] Received offer from', from);
        partnerIdRef.current = from; roomIdRef.current = roomId;
        let attempts = 0;
        while (!localStreamRef.current && attempts < 30) { await new Promise(r => setTimeout(r, 100)); attempts++; }
        const stream = localStreamRef.current;
        if (!stream) { console.error('[Signal] No stream for offer!'); return; }
        const pc = buildPC(stream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
        console.log('[Signal] Sending answer to', from);
        socket.emit('answer', { roomId, answer, to: from });
      });
      socket.on('answer', async ({ answer }: any) => {
        if (pcRef.current) await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {});
      });
      socket.on('ice-candidate', async ({ candidate }: any) => {
        if (pcRef.current && candidate) pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      });
      socket.on('chat-message', ({ text, avatar, name }: any) => {
        setMessages(p => [...p, { text, self: false, avatar, name }]);
      });
      socket.on('partner-disconnected', () => {
        setIsConnected(false); setIsSearching(false);
        setMessages(p => [...p, { text: 'Stranger disconnected.', self: false }]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        pcRef.current?.close(); pcRef.current = null;
      });
      // Don't disconnect on cleanup - keep socket alive
    });
    // Only disconnect when component fully unmounts (user logs out)
    return () => {
      if (!user) { socketRef.current?.disconnect(); socketRef.current = null; }
    };
  }, [user?.uid]);

  const buildPC = (stream: MediaStream) => {
    pcRef.current?.close();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.ontrack = (e) => {
      if (e.streams?.[0] && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
        remoteVideoRef.current.play().catch(() => {});
      }
    };
    pc.onicecandidate = (e) => {
      if (e.candidate && partnerIdRef.current && socketRef.current)
        socketRef.current.emit('ice-candidate', { roomId: roomIdRef.current, candidate: e.candidate.toJSON(), to: partnerIdRef.current });
    };
    pc.oniceconnectionstatechange = () => { console.log('[ICE]', pc.iceConnectionState); };
    pc.onconnectionstatechange = () => { console.log('[PC]', pc.connectionState); 
      if (pc.connectionState === 'connected') { setIsSearching(false); setIsConnected(true); toast({ title: 'Connected!', description: 'You are now chatting with a stranger.' }); }
      if (pc.connectionState === 'failed') { setIsConnected(false); setMessages(p => [...p, { text: 'Connection lost.', self: false }]); }
    };
    return pc;
  };

  const handleStart = async () => {
    if (!user || !socketRef.current) return;
    setIsSearching(true); setIsConnected(false); setMessages([]);
    pcRef.current?.close(); pcRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch {
      toast({ variant: 'destructive', title: 'Camera/Mic Error', description: 'Allow camera and microphone access.' });
      setIsSearching(false); return;
    }
    socketRef.current.emit('find-match', { uid: user.uid, country, gender });
  };

  const handleStop = () => {
    socketRef.current?.emit('stop');
    setIsConnected(false); setIsSearching(false);
    pcRef.current?.close(); pcRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
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

  const toggleMic = () => { localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn; }); setMicOn(p => !p); };
  const toggleCam = () => { localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn; }); setCamOn(p => !p); };
  useEffect(() => { return () => { localStreamRef.current?.getTracks().forEach(t => t.stop()); }; }, []);

  const myPhoto = (profileData as any)?.photoURL || user?.photoURL || '';
  const myName = (profileData as any)?.displayName || user?.displayName || 'You';
  const countryOptions = COUNTRIES.map(c => ({ key: c.code, searchText: c.name, display: (<><span className="text-lg mr-1">{c.flag}</span><span className="text-sm">{c.name}</span></>) }));
  const genderOptions = GENDERS.map(g => ({ key: g.value, searchText: g.label, display: (<><span className="text-lg mr-1">{g.emoji}</span><span className="text-sm">{g.label}</span></>) }));

  if (loading || !user) return <div className="flex h-screen w-full items-center justify-center bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] text-white overflow-hidden">
      <div className="flex-grow flex flex-col md:flex-row bg-black relative min-h-0">
        {/* Self side */}
        <div className="flex-1 relative overflow-hidden h-1/2 md:h-full bg-zinc-900 flex items-center justify-center">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          {!camOn && (<div className="absolute inset-0 flex items-center justify-center bg-zinc-900"><VideoOff className="text-white/20 size-14" /></div>)}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            <button onClick={toggleMic} title={micOn ? "Mute" : "Unmute"}
              className={cn("p-2.5 rounded-full border backdrop-blur-md shadow-lg transition-all",
                micOn ? "bg-black/40 border-white/20 text-white hover:bg-black/60" : "bg-red-500 border-red-400 text-white")}>
              {micOn ? <Mic size={17} /> : <MicOff size={17} />}
            </button>
            <button onClick={toggleCam} title={camOn ? "Hide cam" : "Show cam"}
              className={cn("p-2.5 rounded-full border backdrop-blur-md shadow-lg transition-all",
                camOn ? "bg-black/40 border-white/20 text-white hover:bg-black/60" : "bg-red-500 border-red-400 text-white")}>
              {camOn ? <Video size={17} /> : <VideoOff size={17} />}
            </button>
          </div>
          <div className="absolute top-3 right-3 z-20">
            <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-md text-[10px] font-bold border border-white/10 text-white/80 uppercase tracking-wider">You</span>
          </div>
        </div>
        {/* Stranger side */}
        <div className="flex-1 relative md:border-r border-white/5 overflow-hidden h-1/2 md:h-full bg-zinc-950 flex items-center justify-center">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" style={{ display: isSearching || (!isConnected && !remoteVideoRef.current?.srcObject) ? "none" : "block" }} />
          {isSearching && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="relative w-16 h-16 md:w-20 md:h-20">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <Play className="absolute inset-0 m-auto text-emerald-500 size-6 fill-emerald-500" />
              </div>
              <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm animate-pulse">Searching...</p>
            </div>
          )}
          {!isSearching && !isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
              <span className="text-6xl md:text-8xl">📹</span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Connectify TV</h2>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live video chat
              </div>
            </div>
          )}
          <div className="absolute top-3 left-3 z-20">
            <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-md text-[10px] font-bold border border-white/10 text-white/80 uppercase tracking-wider">Stranger</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/40 z-30 pointer-events-none overflow-hidden">
          {isSearching && <div className="h-full bg-emerald-500 w-1/2 animate-[searchbar_1.4s_ease-in-out_infinite]" />}
          {isConnected && <div className="h-full bg-emerald-500 w-full shadow-[0_0_10px_rgba(16,185,129,0.6)]" />}
        </div>
      </div>
      {/* Controls + Chat - Mobile friendly */}
      <div className="bg-[#ebebeb] text-slate-800 flex flex-col shrink-0">

        {/* Controls row - always 4 equal cols */}
        <div className="flex items-stretch gap-1.5 p-2 h-[72px] md:h-[96px]">
          <button onClick={handleStart} disabled={isSearching}
            className={cn("flex-1 flex flex-col items-center justify-center rounded-xl transition-all active:scale-[0.98] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] border-b-4 border-[#3a8e6a] overflow-hidden disabled:opacity-50",
              isSearching ? "bg-[#56b98e]/70" : "bg-[#56b98e] hover:bg-[#4cad7f]")}>
            <span className="text-base md:text-2xl font-headline font-bold text-white tracking-tighter drop-shadow">Start</span>
            <Play className="text-white/70 size-3 md:size-4" fill="currentColor" />
          </button>
          <button onClick={handleStop}
            className="flex-1 flex flex-col items-center justify-center rounded-xl bg-[#eb9688] hover:bg-[#e08678] active:scale-[0.98] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] border-b-4 border-[#b96e62] transition-all overflow-hidden">
            <span className="text-base md:text-2xl font-headline font-bold text-white tracking-tighter drop-shadow">Stop</span>
            <Square className="text-white/70 size-3 md:size-4" fill="currentColor" />
          </button>
          <div className="flex-1 min-w-0">
            <PickerDropdown label="Country" value={country} options={countryOptions} onChange={setCountry} />
          </div>
          <div className="flex-1 min-w-0">
            <PickerDropdown label="I am" value={gender} options={genderOptions} onChange={setGender} />
          </div>
        </div>

        {/* Chat panel - taller on mobile so it''s usable */}
        <div className="bg-white border-t border-slate-200 flex flex-col h-[220px] md:h-[160px]">
          <div ref={scrollRef} className="flex-grow overflow-y-auto px-3 py-2 space-y-2">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex gap-2 shadow-sm shrink-0">
              <div className="shrink-0 w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">C</div>
              <div className="text-[10px] leading-relaxed text-slate-500">
                By pressing <b>"Start"</b>, you agree to our <span className="text-blue-600 font-bold cursor-pointer hover:underline">rules</span>. Rule violators will be banned.
                <div className="flex items-center gap-1 mt-0.5 text-emerald-600 font-semibold text-[9px]"><AlertTriangle size={9} /> Don''t share personal data.</div>
              </div>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={cn("flex items-end gap-1.5 animate-in fade-in slide-in-from-bottom-2", m.self ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm overflow-hidden", m.self ? "bg-emerald-500" : "bg-blue-500")}>
                  {m.avatar ? <img src={m.avatar} alt={m.self ? "You" : "Stranger"} className="w-full h-full object-cover" /> : <span>{m.self ? (m.name?.[0]?.toUpperCase() ?? "Y") : "S"}</span>}
                </div>
                <div className={cn("max-w-[78%] px-2.5 py-1.5 rounded-2xl text-xs break-words leading-relaxed", m.self ? "bg-emerald-500 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm")}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="px-3 py-2 border-t border-slate-100 flex gap-2 items-center bg-white shrink-0">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); } }}
              placeholder={isConnected ? "Write a message..." : "Start to chat..."}
              className="flex-grow text-sm outline-none px-3 py-2 rounded-xl bg-slate-100 placeholder:text-slate-400 min-w-0"
            />
            <button
              type="button"
              onClick={e => handleSend(e as unknown as React.FormEvent)}
              disabled={!inputValue.trim() || !isConnected}
              className={cn("shrink-0 p-2 rounded-xl transition-all", inputValue.trim() && isConnected ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400")}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
      <style jsx global>{`
        @keyframes searchbar { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
      `}</style>
    </div>
  );


}