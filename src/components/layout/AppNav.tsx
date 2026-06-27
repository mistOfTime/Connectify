"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, MessageSquare, Users, Shield, LogOut, User, LogIn, ShieldAlert } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

const ADMIN_UID = 'S6iKp12qgqbcvuYt15NVnITQ1q22';

const navItems = [
  { name: 'Home',       href: '/',            icon: Home },
  { name: 'Text Chat',  href: '/chat/text',   icon: MessageSquare },
  { name: 'Discover',   href: '/discover',    icon: Users },
  { name: 'Safety',     href: '/safety',      icon: Shield },
];

export function AppNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  const userDocRef = useMemo(() => user && db ? doc(db, 'users', user.uid) : null, [user?.uid, db]);
  const { data: profileData } = useDoc(userDocRef);

  const profileName  = (profileData?.displayName as string) || user?.displayName || 'You';
  const profileImage = (profileData?.photoURL  as string) || user?.photoURL || '';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been signed out.' });
      router.push('/login');
    } catch {
      toast({ variant: 'destructive', title: 'Logout Failed' });
    }
  };

  if (pathname === '/login') return <>{children}</>;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">

      {/* ── TOP HEADER (desktop) ─────────────────────────────────── */}
      <header className="hidden md:flex h-16 border-b bg-background/95 backdrop-blur-sm shrink-0 items-center px-6 gap-6 z-50">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mr-4 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <MessageSquare size={17} />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight">Connectify</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}>
                <item.icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        {user ? (
          <div className="flex items-center gap-3 ml-auto">
            <Link href="/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <Avatar className="w-8 h-8 border border-primary/20">
                <AvatarImage src={profileImage} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {profileName[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium leading-none truncate max-w-[120px]">{profileName}</p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{user.email}</p>
              </div>
            </Link>
            {user.uid === ADMIN_UID && (
              <Link href="/admin"
                className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  pathname === '/admin' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                <ShieldAlert size={15} /> Admin
              </Link>
            )}
            <button onClick={handleLogout}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link href="/login" className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            <LogIn size={15} /> Sign In
          </Link>
        )}
      </header>

      {/* ── MOBILE TOP BAR ───────────────────────────────────────── */}
      <header className="md:hidden h-14 border-b bg-background/95 backdrop-blur-sm shrink-0 flex items-center px-4 z-50">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white">
            <MessageSquare size={14} />
          </div>
          <span className="font-headline font-bold text-base">Connectify</span>
        </Link>
      </header>

      {/* ── PAGE CONTENT ─────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 overflow-auto pb-16 md:pb-0">
        {children}
      </main>

      {/* ── BOTTOM NAV (mobile only) ─────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t flex items-stretch">
        {[
          ...navItems,
          { name: 'Profile', href: '/profile', icon: User },
          ...(user?.uid === ADMIN_UID ? [{ name: 'Admin', href: '/admin', icon: ShieldAlert }] : []),
        ].map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-w-0",
                active ? "text-primary" : "text-muted-foreground",
                item.name === 'Admin' && "text-amber-600"
              )}>
              <item.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="truncate w-full text-center px-0.5">{item.name}</span>
              {active && <span className="w-1 h-1 rounded-full bg-primary absolute bottom-1" />}
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
