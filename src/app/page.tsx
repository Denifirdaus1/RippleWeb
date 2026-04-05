'use client';

import { Suspense } from 'react';
import { useAuth } from '@/features/auth/presentation/hooks/useAuth';
import { TodoList } from '@/features/todo/presentation/components/TodoList';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Layout, 
  CheckCircle2, 
  Timer, 
  FileText, 
  Target, 
  Zap, 
  ArrowRight, 
  Sparkles,
  Download,
  Smartphone
} from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
           <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--primary)] shadow-xl" />
           <p className="text-slate-400 animate-pulse font-medium">Syncing Ripple...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="space-y-12">
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--primary)]" />
                <p className="text-slate-400 font-medium">Loading tasks...</p>
              </div>
            }>
              <TodoList />
            </Suspense>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] selection:bg-[var(--primary)] selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
              <span className="text-white font-black italic text-xl">R</span>
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">Ripple</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#download" className="hidden sm:block text-slate-600 font-bold hover:text-[var(--primary)] transition-colors">
              Download APK
            </Link>
            <Link href="/login" className="hidden sm:block text-slate-600 font-bold hover:text-slate-900 transition-colors">
              Log in
            </Link>
            <Link href="/login" className="px-6 py-2.5 bg-[#1E293B] hover:bg-black text-white rounded-full font-bold shadow-lg transition-all border border-slate-800">
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--primary-glow)] rounded-full blur-[120px] opacity-40 pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 shadow-sm">
            <Sparkles size={16} className="text-[var(--primary)]" />
            <span>Ripple Web is now in Beta</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1]">
            Master your day.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-blue-600">
              Achieve your goals.
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-medium">
            The all-in-one productivity workspace that combines your tasks, notes, focus sessions, and milestones into one seamless experience.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-[var(--primary)] text-white rounded-full hover:brightness-110 hover:-translate-y-1 transition-all shadow-[0_20px_40px_var(--primary-glow)] font-black text-lg flex items-center justify-center gap-2"
            >
              Get Started for Free <ArrowRight size={20} />
            </Link>
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-full hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all font-bold text-lg flex items-center justify-center gap-2 group"
            >
              See How It Works
            </button>
          </div>
          
          {/* Dashboard Preview */}
          <div className="pt-20 px-4 sm:px-0">
            <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 sm:p-4 group max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80 pointer-events-none z-10 rounded-2xl" />
              <div className="rounded-xl border border-slate-100 bg-slate-50 aspect-video p-6 relative overflow-hidden flex gap-6 text-left">
                {/* Simulated Sidebar */}
                <div className="w-48 hidden md:flex flex-col gap-4 border-r border-slate-200/60 pr-4">
                  <div className="h-8 w-24 bg-slate-200 rounded-lg mb-4" />
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-6 w-full bg-slate-200/50 rounded-md" />
                  ))}
                </div>
                {/* Simulated Main Content */}
                <div className="flex-1 flex flex-col gap-6">
                  <div className="flex justify-between items-center z-10">
                    <div className="h-10 w-48 bg-slate-200/80 rounded-xl" />
                    <div className="h-10 w-10 bg-[var(--primary)] text-white flex items-center justify-center font-bold italic rounded-full shadow-lg">R</div>
                  </div>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.2, duration: 0.5 }}
                        className="h-24 bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                      >
                        <div className={`h-4 w-16 bg-slate-100 rounded mb-4 ${i === 3 ? 'hidden md:block' : ''}`} />
                        <div className={`h-8 w-12 rounded ${i === 1 ? 'bg-[var(--primary)]' : 'bg-slate-200'} ${i === 3 ? 'hidden md:block' : ''}`} />
                      </motion.div>
                    ))}
                  </div>
                  {/* Data Chart Area */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 flex items-end gap-4 justify-between h-40">
                    {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8, type: 'spring' }}
                        className="w-full bg-gradient-to-t from-[var(--primary)] to-blue-400 rounded-t-lg shadow-sm"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Everything you need to succeed</h2>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
              Replace multiple apps with a single, unified workspace designed for deep focus and continuous progress.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <CheckCircle2 size={32} className="text-blue-500" />,
                bg: "bg-blue-50 border-blue-100",
                title: "Smart Todos",
                desc: "Organize tasks, set priorities, and track your daily progress effortlessly."
              },
              {
                icon: <Timer size={32} className="text-orange-500" />,
                bg: "bg-orange-50 border-orange-100",
                title: "Focus Mode",
                desc: "Pomodoro timers and focus sessions to help you maintain deep work states."
              },
              {
                icon: <FileText size={32} className="text-green-500" />,
                bg: "bg-green-50 border-green-100",
                title: "Rich Notes",
                desc: "Capture ideas instantly with a powerful, markdown-supported editor."
              },
              {
                icon: <Target size={32} className="text-purple-500" />,
                bg: "bg-purple-50 border-purple-100",
                title: "Milestones",
                desc: "Break down long-term goals into achievable steps and track your journey."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-[2rem] bg-white border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                <div className={`w-16 h-16 ${feature.bg} border rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary-glow)] text-[var(--primary)] rounded-full text-sm font-bold">
                <Zap size={16} />
                <span>Lightning Fast</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Seamlessly syncs across all your devices
              </h2>
              <p className="text-xl text-slate-500 leading-relaxed font-medium">
                Whether you're at your desk or on the go, your data is always up to date. Start a task on your phone and finish it on your computer without missing a beat.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  "Real-time cloud synchronization",
                  "Offline mode support",
                  "Secure and encrypted data"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-lg font-bold text-slate-700">
                    <CheckCircle2 size={24} className="text-[var(--primary)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative lg:h-[500px] flex items-center justify-center mt-10 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary-glow)] to-purple-100 rounded-[3rem] transform rotate-3" />
              
              {/* Central Server/Cloud */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-[2rem] shadow-xl z-20 flex items-center justify-center text-[var(--primary)]">
                <div className="relative flex items-center justify-center">
                   <Zap size={40} className="relative z-10" />
                   <div className="absolute inset-0 bg-[var(--primary)] blur-2xl opacity-40 animate-pulse" />
                </div>
              </div>

              {/* Orbiting Devices */}
              {[
                { delay: 0, rx: 140, ry: 100, rotate: 0, type: 'laptop' },
                { delay: 4, rx: 140, ry: 100, rotate: 120, type: 'phone' },
                { delay: 8, rx: 140, ry: 100, rotate: 240, type: 'tablet' }
              ].map((device, i) => (
                <motion.div
                  key={i}
                  animate={{ rotate: 360 }}
                  transition={{ ease: "linear", duration: 12, repeat: Infinity, delay: -device.delay }}
                  className="absolute w-[300px] h-[300px]"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white p-4 rounded-2xl shadow-xl border border-slate-100" style={{ transform: `rotate(${-device.rotate}deg)` }}>
                    {device.type === 'phone' ? <Smartphone size={32} className="text-[var(--primary)]" /> : <Layout size={32} className="text-[var(--primary)]" />}
                  </div>
                </motion.div>
              ))}

              {/* Data Particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                  animate={{ 
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0],
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut"
                  }}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-blue-500 blur-[1px]"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-24 px-6 bg-slate-50 border-t border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative flex justify-center items-center h-[600px]">
               <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full" />
               <motion.div 
                 initial={{ y: 20 }}
                 animate={{ y: -20 }}
                 transition={{ repeat: Infinity, duration: 3, repeatType: "reverse", ease: "easeInOut" }}
                 className="relative w-[280px] h-[580px] bg-black rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden flex flex-col"
               >
                 {/* App UI inside phone */}
                 <div className="bg-[var(--primary)] h-14 w-full flex justify-center items-end pb-2">
                    <div className="w-24 h-5 bg-black rounded-b-2xl" />
                 </div>
                 <div className="flex-1 bg-[#F8FAFC] p-4 flex flex-col gap-4">
                    <div className="h-8 w-2/3 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-24 w-full bg-white rounded-2xl shadow-sm border border-slate-100" />
                    <div className="h-24 w-full bg-white rounded-2xl shadow-sm border border-slate-100" />
                    <div className="h-24 w-full bg-white rounded-2xl shadow-sm border border-slate-100" />
                    <div className="mt-auto h-14 w-full bg-slate-200 rounded-[2rem]" />
                 </div>
               </motion.div>
            </div>
            <div className="order-1 lg:order-2 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mx-auto lg:mx-0">
                 <Smartphone size={16} />
                 <span>Mobile App</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Take Ripple <br className="hidden lg:block"/> anywhere you go
              </h2>
              <p className="text-xl text-slate-500 leading-relaxed font-medium">
                Our Android application gives you the full power of Ripple right in your pocket. Manage your tasks, notes, and focus sessions effortlessly on the move.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                <a 
                  href={process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || "https://github.com/Denifirdaus1/RippleWeb/releases/latest/download/Ripple-latest.apk"}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-slate-900 text-white rounded-full hover:bg-black hover:scale-105 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.2)] font-bold text-lg flex items-center justify-center gap-4 group"
                >
                  <Download size={28} className="group-hover:-translate-y-1 transition-transform" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Download for</div>
                    <div className="leading-tight text-xl">Android</div>
                  </div>
                </a>
              </div>
              <p className="text-sm text-slate-400 font-medium">
                Requires Android 8.0 or later. <br className="lg:hidden"/>APK size ~25MB.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-slate-900 border border-slate-800 p-12 sm:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--primary)]/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              Ready to dive in?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
              Join thousands of users who are already organizing their life with Ripple. Free forever for core features.
            </p>
            <div className="pt-4 flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-10 py-5 bg-[var(--primary)] text-white rounded-full hover:brightness-110 hover:-translate-y-1 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] font-black text-xl"
              >
                Create your free account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center transform -rotate-6">
                <span className="text-white font-black italic text-sm">R</span>
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">Ripple</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-slate-500">
              <Link href="#" className="hover:text-slate-900 transition-colors">Features</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">Pricing</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            </div>
          </div>
          <div className="mt-12 text-center text-sm font-medium text-slate-400">
            &copy; {new Date().getFullYear()} Ripple. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
