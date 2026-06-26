
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const auth = useAuth();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Seed profile in Firestore on first Google login
      const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      const db = getFirestore();
      const userRef = doc(db, 'users', result.user.uid);
      const existing = await getDoc(userRef);
      if (!existing.exists()) {
        await setDoc(userRef, {
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          email: result.user.email || '',
          university: '',
          course: '',
          createdAt: serverTimestamp(),
        });
      }
      toast({ title: "Welcome!", description: "You have successfully signed in with Google." });
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message || "Could not sign in with Google." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
      toast({
        title: "Guest Mode",
        description: "You are now browsing as a guest.",
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Guest Login Failed",
        description: error.message || "Could not sign in as a guest.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      const db = getFirestore();
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Seed Firestore profile on sign up
        await setDoc(doc(db, 'users', result.user.uid), {
          displayName: result.user.displayName || email.split('@')[0],
          photoURL: '',
          email: result.user.email || email,
          university: '',
          course: '',
          createdAt: serverTimestamp(),
        });
        toast({ title: "Account Created", description: "Welcome to Connectify!" });
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        // Ensure profile doc exists on login too
        const userRef = doc(db, 'users', result.user.uid);
        const existing = await getDoc(userRef);
        if (!existing.exists()) {
          await setDoc(userRef, {
            displayName: result.user.displayName || email.split('@')[0],
            photoURL: result.user.photoURL || '',
            email: result.user.email || email,
            university: '',
            course: '',
            createdAt: serverTimestamp(),
          });
        }
        toast({ title: "Welcome Back", description: "Successfully signed in." });
      }
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Authentication Error", description: error.message || "Failed to authenticate." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 sm:p-8">
      <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden my-auto">
        <CardHeader className="space-y-3 text-center pb-6 pt-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground mx-auto mb-2 shadow-lg">
            <MessageSquare size={24} />
          </div>
          <CardTitle className="text-2xl font-headline font-bold">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-xs">
            {isSignUp ? 'Create your account to get started.' : 'Sign in to your existing account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            variant="outline" 
            className="w-full h-11 border-2 gap-2 font-medium" 
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="Email Address" 
                className="h-11 text-sm" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password" 
                  className="h-11 text-sm pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button 
              type="submit"
              className="w-full h-11 font-bold text-lg bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-bold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign up for free'}
            </button>
          </p>
          
          <p className="text-[9px] text-muted-foreground max-w-xs mt-2 opacity-70">
            By continuing, you agree to Connectify's Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
