"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Flag, Loader2, CheckCircle, XCircle, Clock, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { cn } from '@/lib/utils';

// ── Admin UIDs ───────────────────────────────────────────────────────────────
const ADMIN_UIDS = ['S6iKp12qgqbcvuYt15NVnITQ1q22'];

type Report = {
  id: string;
  reporterUid: string;
  reporterEmail: string;
  reporterName: string;
  reportedName: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: any;
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: Clock },
  reviewed:  { label: 'Reviewed',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  dismissed: { label: 'Dismissed', color: 'bg-slate-100 text-slate-600 border-slate-200',   icon: XCircle },
};

export default function AdminPage() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'dismissed'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (!loading && user && !ADMIN_UIDS.includes(user.uid)) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));
      setIsLoading(false);
    });
    return () => unsub();
  }, [db, user]);

  const updateStatus = async (id: string, status: Report['status']) => {
    if (!db) return;
    await updateDoc(doc(db, 'reports', id), { status });
  };

  const deleteReport = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'reports', id));
  };

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  if (loading || !user) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!ADMIN_UIDS.includes(user.uid)) return null;

  const counts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  };

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <header className="border-b bg-background px-4 md:px-8 py-4 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">Moderation Dashboard</h1>
              <p className="text-xs text-muted-foreground">Admin: {user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            {counts.pending > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-xs border border-amber-200">
                {counts.pending} pending
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'reviewed', 'dismissed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-sm font-medium border transition-all capitalize",
                  filter === f ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"
                )}>
                {f} {counts[f] > 0 && <span className="ml-1 opacity-70">({counts[f]})</span>}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-3 text-center">
              <Flag size={40} className="text-muted-foreground/30" />
              <p className="font-semibold text-muted-foreground">No {filter === 'all' ? '' : filter} reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(report => {
                const cfg = STATUS_CONFIG[report.status];
                const StatusIcon = cfg.icon;
                const isExpanded = expanded === report.id;
                const date = report.createdAt?.toDate?.() ?? new Date();

                return (
                  <div key={report.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                    {/* Header row */}
                    <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : report.id)}>
                      <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                        <Flag size={16} className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate">{report.reason}</p>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1", cfg.color)}>
                            <StatusIcon size={10} /> {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Reporter: <span className="font-medium">{report.reporterName || report.reporterEmail}</span>
                          {' · '}{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <ChevronDown size={16} className={cn("text-muted-foreground shrink-0 transition-transform", isExpanded && "rotate-180")} />
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-card rounded-xl p-3 border">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Reporter</p>
                            <p className="text-sm font-semibold">{report.reporterName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{report.reporterEmail}</p>
                          </div>
                          <div className="bg-card rounded-xl p-3 border">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Reported User</p>
                            <p className="text-sm font-semibold">{report.reportedName || 'Stranger / Unknown'}</p>
                          </div>
                        </div>

                        <div className="bg-card rounded-xl p-3 border">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
                          <p className="text-sm font-medium text-red-600">{report.reason}</p>
                        </div>

                        {report.details && (
                          <div className="bg-card rounded-xl p-3 border">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Details</p>
                            <p className="text-sm text-foreground leading-relaxed">{report.details}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          {report.status !== 'reviewed' && (
                            <button onClick={() => updateStatus(report.id, 'reviewed')}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors">
                              <CheckCircle size={13} /> Mark Reviewed
                            </button>
                          )}
                          {report.status !== 'dismissed' && (
                            <button onClick={() => updateStatus(report.id, 'dismissed')}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-colors">
                              <XCircle size={13} /> Dismiss
                            </button>
                          )}
                          {report.status === 'pending' && (
                            <button onClick={() => updateStatus(report.id, 'pending')}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 cursor-default">
                              <Clock size={13} /> Pending
                            </button>
                          )}
                          <button onClick={() => deleteReport(report.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors ml-auto">
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
