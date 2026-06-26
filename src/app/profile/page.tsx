
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, GraduationCap, BookOpen, User as UserIcon, Loader2, Camera, CheckCircle2, Save } from 'lucide-react';

const UNIVERSITIES = [
  "University of San Carlos (USC)",
  "University of the Philippines Cebu (UP Cebu)",
  "University of San Jose - Recoletos (USJ-R)",
  "Cebu Institute of Technology - University (CIT-U)",
  "Cebu Normal University (CNU)",
  "Southwestern University PHINMA (SWU)",
  "University of Cebu (UC)",
  "University of the Visayas (UV)",
  "Velez College",
  "Cebu Doctors' University (CDU)",
  "Cebu Technological University (CTU)",
  "St. Theresa's College (STC)",
  "Other / Non-Student"
];

const COURSES = [
  "BS Computer Science",
  "BS Information Technology",
  "BS Computer Engineering",
  "BS Civil Engineering",
  "BS Mechanical Engineering",
  "BS Electrical Engineering",
  "BS Nursing",
  "BS Medical Technology",
  "BS Accountancy",
  "BS Business Administration",
  "BS Psychology",
  "BS Architecture",
  "AB Communication",
  "AB Political Science",
  "BS Biology",
  "Other"
];

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Memoize document reference to prevent infinite loops in useDoc
  const userDocRef = useMemo(() => {
    return user && db ? doc(db, 'users', user.uid) : null;
  }, [user?.uid, db]);

  const { data: profileData, loading: profileLoading } = useDoc(userDocRef);

  const [displayName, setDisplayName] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync from Firestore whenever profileData changes (covers cross-device updates)
  // Only runs when not actively editing (hasChanges = false)
  useEffect(() => {
    if (profileLoading || hasChanges) return;
    if (!user) return;

    if (profileData) {
      setDisplayName((profileData.displayName as string) || user.displayName || '');
      setUniversity((profileData.university as string) || '');
      setCourse((profileData.course as string) || '');
      const photo = (profileData.photoURL as string) || user.photoURL || '';
      setPhotoURL(photo);
    } else {
      // No Firestore doc yet — use Firebase Auth values
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      setUniversity('');
      setCourse('');
    }
  }, [profileData, profileLoading, user, hasChanges]);

  // Reset hasChanges when user switches account
  useEffect(() => {
    setHasChanges(false);
  }, [user?.uid]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 512 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image under 512KB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoURL(result);
        setHasChanges(true);
        // Cache immediately in localStorage so it survives navigation
        if (user) {
          localStorage.setItem(`profile_photo_${user.uid}`, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Removed localStorage fallback — Firestore is the single source of truth
  const handleSaveChanges = async () => {
    if (!user || !db) return;
    
    setIsSaving(true);
    const docRef = doc(db, 'users', user.uid);
    
    try {
      // Update Firestore document
      await setDoc(docRef, {
        displayName,
        university,
        course,
        photoURL,
        uid: user.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Also update Firebase Auth profile so displayName syncs everywhere
      try {
        await updateProfile(user, {
          displayName,
          photoURL: photoURL || null,
        });
      } catch (_) {
        // Auth profile update is non-critical, continue
      }

      // Persist photo to localStorage so it survives page navigation
      if (photoURL) {
        localStorage.setItem(`profile_photo_${user.uid}`, photoURL);
      }

      setIsSaving(false);
      setHasChanges(false);
      toast({
        title: "Profile Saved",
        description: "Your changes have been updated successfully.",
      });
    } catch (error: any) {
      setIsSaving(false);
      if (photoURL && user) {
        localStorage.setItem(`profile_photo_${user.uid}`, photoURL);
      }
      console.error('Profile save error:', error?.code, error?.message);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error?.code === 'permission-denied'
          ? "Permission denied. Check your Firestore rules."
          : error?.message || "Could not sync changes to the cloud.",
      });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-headline font-bold mb-4">Join Connectify</h2>
        <p className="text-muted-foreground mb-6">You need to be signed in to customize your profile.</p>
        <Button onClick={() => router.push('/login')}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <header className="h-14 md:h-16 border-b bg-background flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-muted-foreground">
            <ArrowLeft size={18} />
          </Button>
          <h1 className="font-headline font-bold text-lg">My Profile</h1>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto pb-12">
          <Card className="border-none shadow-xl overflow-hidden bg-card">
            <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 w-full" />
            <CardHeader className="space-y-1 text-center -mt-12 relative z-10">
              <div className="relative mx-auto mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-card transition-all group-hover:border-primary shadow-lg bg-background">
                  <AvatarImage src={photoURL} className="object-cover" />
                  <AvatarFallback className="bg-muted text-primary text-2xl md:text-4xl font-bold">
                    {displayName ? displayName[0].toUpperCase() : <UserIcon />}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg transition-transform group-hover:scale-110">
                  <Camera size={18} />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </div>
              <CardTitle className="text-2xl font-headline font-bold">Customize Profile</CardTitle>
              <CardDescription>
                Upload a photo and fill in your details to help us find better matches.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  <UserIcon size={14} className="text-primary" /> Display Name
                </Label>
                <Input 
                  id="displayName"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="Enter your name"
                  className="h-11 bg-muted/30 border-none focus-visible:ring-primary focus-visible:bg-background transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university" className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    <GraduationCap size={14} className="text-primary" /> University
                  </Label>
                  <Select 
                    value={university} 
                    onValueChange={(val) => {
                      setUniversity(val);
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-11 bg-muted/30 border-none focus:ring-primary focus:bg-background transition-all">
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIVERSITIES.map((uni) => (
                        <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course" className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    <BookOpen size={14} className="text-primary" /> Course
                  </Label>
                  <Select 
                    value={course} 
                    onValueChange={(val) => {
                      setCourse(val);
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-11 bg-muted/30 border-none focus:ring-primary focus:bg-background transition-all">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 py-4 px-6 flex justify-center">
               <Button 
                onClick={handleSaveChanges} 
                disabled={!hasChanges || isSaving}
                className="w-full max-w-sm h-11 bg-primary text-white font-bold rounded-xl gap-2 shadow-md hover:bg-primary/90"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
              </Button>
            </CardFooter>
          </Card>
          
          <div className="mt-8 bg-primary/5 rounded-2xl p-6 border border-primary/10">
            <h4 className="font-headline font-bold text-sm mb-2 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-primary" /> Profile Tips
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Matched users will see your university and course. This helps build trust and creates more engaging conversation starters!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
