
"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Mic,
  Users,
  Shield, 
  Home, 
  LogOut, 
  User,
  HelpCircle,
  LogIn
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Text Chat', href: '/chat/text', icon: MessageSquare },
  { name: 'Voice Chat', href: '/chat/voice', icon: Mic },
  { name: 'Discover', href: '/discover', icon: Users },
  { name: 'Safety', href: '/safety', icon: Shield },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const isCollapsed = state === "collapsed";

  // Stabilize the document reference
  const userDocRef = useMemo(() => {
    return user && db ? doc(db, 'users', user.uid) : null;
  }, [user?.uid, db]);
  
  const { data: profileData } = useDoc(userDocRef);

  // Hide the entire sidebar on the login page
  if (pathname === '/login') {
    return null;
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully signed out.",
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an error signing out.",
      });
    }
  };

  const profileName = profileData?.displayName || user?.displayName || 'Active User';
  const profileImage = profileData?.photoURL || user?.photoURL || '';

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar h-full transition-all">
      <SidebarHeader className={cn(
        "h-14 md:h-16 flex items-center shrink-0 overflow-hidden transition-all duration-200",
        isCollapsed ? "px-0 justify-center" : "px-4"
      )}>
        <div className="flex items-center justify-between w-full">
          <Link href="/" onClick={handleLinkClick} className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <MessageSquare size={18} />
            </div>
            {!isCollapsed && (
              <span className="font-headline font-bold text-lg md:text-xl tracking-tight whitespace-nowrap">
                Connectify
              </span>
            )}
          </Link>
          {!isCollapsed && (
            <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors shrink-0" />
          )}
        </div>
        {isCollapsed && (
          <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </SidebarHeader>

      <SidebarContent className="flex-grow min-h-0 overflow-y-auto overflow-x-hidden">
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    tooltip={item.name}
                    className={cn(
                      "h-10 md:h-11 gap-3 transition-all",
                      isActive ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-sidebar-accent"
                    )}
                  >
                    <Link href={item.href} onClick={handleLinkClick}>
                      <item.icon size={20} className={cn(isActive ? "text-primary" : "text-muted-foreground")} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          {!isCollapsed && <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-wider font-bold opacity-50">Support</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  tooltip="Help Center" 
                  isActive={pathname === '/faq'}
                  className={cn(
                    "h-10 md:h-11 gap-3 transition-all",
                    pathname === '/faq' ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-sidebar-accent"
                  )}
                >
                  <Link href="/faq" onClick={handleLinkClick}>
                    <HelpCircle size={20} className={cn(pathname === '/faq' ? "text-primary" : "text-muted-foreground")} />
                    <span>Help Center</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn(
        "border-t shrink-0 transition-all duration-200",
        isCollapsed ? "p-0 py-2" : "p-4"
      )}>
        <SidebarMenu>
          {user ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  size="lg"
                  tooltip="My Profile" 
                  isActive={pathname === '/profile'}
                  className="gap-3 mb-1"
                >
                  <Link href="/profile" onClick={handleLinkClick}>
                    <Avatar className="w-8 h-8 border border-primary/20 shrink-0">
                      <AvatarImage src={profileImage} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {profileName[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <div className="flex flex-col overflow-hidden text-left">
                        <span className="text-sm font-medium leading-none truncate">
                          {profileName}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {user?.email || 'User'}
                        </span>
                      </div>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout}
                  tooltip="Logout"
                  className="gap-3 text-muted-foreground hover:text-destructive h-10 md:h-11 transition-colors"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : (
             <SidebarMenuItem>
               <SidebarMenuButton 
                 asChild
                 tooltip="Login" 
                 className="h-10 md:h-11 gap-3 mb-2 bg-primary text-primary-foreground hover:bg-primary/90"
               >
                 <Link href="/login" onClick={handleLinkClick}>
                   <LogIn size={20} className="shrink-0" />
                   <span>Sign In</span>
                 </Link>
               </SidebarMenuButton>
             </SidebarMenuItem>
          )}
        </SidebarMenu>
        
      </SidebarFooter>
    </Sidebar>
  );
}
