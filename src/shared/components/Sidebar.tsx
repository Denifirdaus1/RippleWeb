'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/presentation/hooks/useAuth';
import { LogOut, User as UserIcon, PanelLeftClose, PanelLeftOpen, Home, FileText, Timer, UserCircle } from 'lucide-react';
import { supabase } from '@/core/utils/supabase';

const NAV_ITEMS = [
  { 
    label: 'Home', 
    href: '/', 
    icon: Home,
  },
  { 
    label: 'Notes', 
    href: '/notes', 
    icon: FileText,
  },
  { 
    label: 'Focus', 
    href: '/focus', 
    icon: Timer,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: UserCircle,
  },
];

type UserProfile = {
  displayName: string | null;
  avatarUrl: string | null;
};

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const isFocusSessionRoute = pathname.startsWith('/focus/session');

  useEffect(() => {
    if (isFocusSessionRoute || !user?.id) return;

    const cacheKey = `ripple_profile_${user.id}`;
    const cachedProfile = localStorage.getItem(cacheKey);

    if (cachedProfile) {
      try {
        setProfile(JSON.parse(cachedProfile));
      } catch (err) {
        // Silent catch
      }
    }

    // Fetch fresh copy to ensure consistency
    const fetchProfile = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          const newProfile = {
            displayName: data.display_name,
            avatarUrl: data.avatar_url,
          };
          setProfile(newProfile);
          localStorage.setItem(cacheKey, JSON.stringify(newProfile));
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfile();
  }, [isFocusSessionRoute, user?.id]);

  if (isFocusSessionRoute) return null;

  if (!user) return null;

  const displayName = profile?.displayName || user.email?.split('@')[0] || 'User';

  return (
    <aside 
      className={`h-screen bg-white relative z-40 flex flex-col items-center py-8 sticky top-0 transition-all duration-300 ${
        isCollapsed ? 'w-20 border-r border-slate-100' : 'w-64 border-r border-slate-100'
      }`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-12 bg-white border border-slate-200 text-slate-400 hover:text-[var(--primary)] rounded-full p-1.5 shadow-sm transition-all hover:scale-110 z-50 flex items-center justify-center pointer-events-auto"
      >
        {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      {/* Brand Logo */}
      <div className={`flex items-center gap-3 mb-12 w-full ${isCollapsed ? 'justify-center px-0' : 'justify-start px-6'}`}>
        <div className="h-10 w-10 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary-glow)] transform -rotate-6 shrink-0">
          <span className="text-white font-black italic text-xl">R</span>
        </div>
        {!isCollapsed && (
          <span className="text-xl font-black tracking-tight text-slate-900 whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 w-auto">
            Ripple
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 w-full space-y-2 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center p-3 rounded-2xl transition-all group overflow-hidden ${
                isActive 
                  ? 'bg-[var(--primary-glow)] text-[var(--primary)]' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              } ${isCollapsed ? 'justify-center' : 'gap-4 justify-start'}`}
              title={isCollapsed ? item.label : undefined}
            >
              <IconComponent size={24} className="flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              {!isCollapsed && (
                <span className={`font-bold text-sm whitespace-nowrap ${isActive ? 'text-[var(--primary)]' : ''}`}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile Section */}
      <div className={`w-full mt-auto pt-6 border-t border-slate-50 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        <div className="flex flex-col gap-4">
          
          <div className={`flex items-center p-2 bg-white rounded-2xl border border-[var(--primary)] shadow-sm shadow-[var(--primary-glow)] overflow-hidden ${isCollapsed ? 'justify-center gap-0' : 'gap-3'}`}>
            <div className="h-10 w-10 bg-[var(--primary-glow)] rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2 border-[var(--primary)]">
               {profile?.avatarUrl ? (
                 <Image 
                   src={profile.avatarUrl} 
                   alt="Avatar" 
                   width={40} 
                   height={40} 
                   unoptimized={true}
                   className="object-cover w-full h-full" 
                 />
               ) : (
                 <UserIcon size={20} className="text-[var(--primary)]" />
               )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900 truncate">
                  {displayName}
                </p>
              </div>
            )}
          </div>
          
          <button
            onClick={() => signOut()}
            className={`flex items-center p-3 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all w-full group overflow-hidden ${
              isCollapsed ? 'justify-center' : 'gap-4 justify-start'
            }`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut size={22} className="shrink-0" />
            {!isCollapsed && <span className="font-bold text-sm whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
