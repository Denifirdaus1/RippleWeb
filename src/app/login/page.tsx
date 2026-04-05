'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { GoogleSignInButton } from '@/features/auth/presentation/components/GoogleSignInButton';
import { AuthService } from '@/features/auth/data/repositories/auth_service';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get('error');
    setError(authError);
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* 
        DESKTOP LEFT PANEL (Hidden on Mobile)
        A soft purple gradient background with mascot integration for larger screens.
      */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative flex-col items-center justify-center p-12 bg-gradient-to-br from-purple-50 to-indigo-50/50">
        <div className="max-w-md text-center">
          <div className="relative w-80 h-80 mx-auto mb-8 animate-in fade-in zoom-in-95 duration-700">
            <Image 
              src="/images/mascot/Ripple complete task.png" 
              alt="Ripple Mascot" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-3xl font-bold text-[#A179F2] mb-4">
            Keep up the good work!
          </h2>
          <p className="text-lg text-slate-500 font-medium">
            Your journey to better productivity starts here. Stay focused, track milestones, and conquer your goals with Ripple.
          </p>
        </div>
      </div>

      {/* 
        MAIN CONTENT / LOGIN AREA
        Full width on mobile, right panel on desktop
      */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col min-h-screen p-6 sm:p-12 items-center justify-between">
        
        {/* Top Space for vertical alignment */}
        <div className="flex-1 w-full flex flex-col items-center justify-center max-w-sm mx-auto">
          
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-5xl font-black tracking-tight text-[#A179F2] mb-2">
              Ripple
            </h1>
            <p className="text-lg font-medium text-[#A179F2] mb-8 md:hidden">
              Keep up the good work!
            </p>

            {/* Mascot Image (Mobile Only) */}
            <div className="relative w-64 h-64 md:hidden mb-10">
              <Image 
                src="/images/mascot/Ripple complete task.png" 
                alt="Ripple Mascot" 
                fill
                className="object-contain"
                priority
              />
            </div>

            <p className="text-xl font-bold text-[#A179F2] mb-8 w-full max-w-[280px]">
              Make your day more productive
            </p>
          </div>

          <div className="w-full space-y-4">
            <GoogleSignInButton 
              onSignIn={handleGoogleSignIn} 
              isLoading={isLoading} 
            />
            
            {error && (
              <div className="animate-in fade-in zoom-in-95 text-sm text-red-600 bg-red-50/90 backdrop-blur-sm p-4 rounded-2xl border border-red-100 font-bold text-center">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer Area */}
        <div className="w-full mt-auto pt-8 text-center">
          <p className="text-sm font-medium text-slate-600 max-w-xs mx-auto leading-relaxed">
            I have read and agree to Ripple&apos;s{' '}
            <a href="#" className="text-[#A179F2] hover:underline">User Agreement</a>
            {' '}and{' '}
            <a href="#" className="text-[#A179F2] hover:underline">Privacy Policy</a>
          </p>
        </div>
        
      </div>
    </div>
  );
}
