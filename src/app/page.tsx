'use client';

import { Button } from '@/components/ui/button';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BriefcaseBusiness,
  Layers,
  UserRoundSearch,
  FileSearch,
  Smile,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

const questions = {
  Me: 'Bạn là ai? Giới thiệu về AstroX cho tôi.',
  Projects: 'Các dự án của bạn là gì?',
  Progress: 'Tiến độ các dự án hiện tại như thế nào?',
  Contact: 'Liên hệ với bạn như thế nào?',
} as const;

const questionConfig = [
  { key: 'Me', color: '#329696', icon: Smile },
  { key: 'Projects', color: '#3E9858', icon: BriefcaseBusiness },
  { key: 'Progress', color: '#856ED9', icon: Layers },
  { key: 'Contact', color: '#C19433', icon: UserRoundSearch },
] as const;

function AvatarCard() {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 120, damping: 18 })
  const springY = useSpring(y, { stiffness: 120, damping: 18 })
  const rotateX = useTransform(springY, [-60, 60], [12, -12])
  const rotateY = useTransform(springX, [-60, 60], [-12, 12])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set(e.clientX - rect.left - rect.width / 2)
    y.set(e.clientY - rect.top - rect.height / 2)
  }
  const handleMouseLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      initial={{ opacity: 0, scale: 0.7, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 20, delay: 0.15 }}
      className="relative cursor-pointer select-none"
    >
      {/* Glow */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 via-violet-400 to-pink-400 blur-2xl"
      />
      {/* Avatar — no ring */}
      <div className="relative z-10 h-44 w-44 overflow-hidden rounded-full shadow-2xl sm:h-52 sm:w-52">
        <Image
          src="/avatar.png"
          alt="AstroX"
          width={400}
          height={400}
          priority
          className="h-full w-full object-cover"
        />
      </div>
    </motion.div>
  )
}

export default function Home() {
  const [input, setInput] = useState('');
  const router = useRouter();

  const goToChat = (query: string) =>
    router.push(`/chat?query=${encodeURIComponent(query)}`);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-16">

      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-violet-900 opacity-20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-900 opacity-20 blur-3xl"
        />
      </div>

      {/* Status pill top-left */}
      <div className="absolute top-6 left-6 z-20">
        <div className="relative flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white shadow-md backdrop-blur-lg">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500" />
          </span>
          My Father · <span className="text-white/50 text-xs">Coming Soon</span>
        </div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="z-10 mt-20 mb-8 flex flex-col items-center text-center md:mt-6 md:mb-10"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg font-semibold text-white/70"
        >
          AI Assistant
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-5xl font-black text-transparent sm:text-6xl md:text-7xl"
        >
          AstroX
        </motion.h1>
      </motion.div>

      {/* Avatar */}
      <div className="z-10 mb-10">
        <AvatarCard />
      </div>

      {/* Input + buttons */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
        className="z-10 flex w-full flex-col items-center"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); if (input.trim()) goToChat(input.trim()) }}
          className="relative w-full max-w-lg"
        >
          <div className="mx-auto flex items-center rounded-full border border-white/10 bg-white/5 py-2.5 pr-2 pl-6 shadow-lg backdrop-blur-lg transition-all hover:border-indigo-500/40">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              className="w-full border-none bg-transparent text-base text-white placeholder:text-white/30 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 p-2.5 text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Quick buttons — 4 cột cố định */}
        <div className="mt-4 grid w-full max-w-xl grid-cols-4 gap-3">
          {questionConfig.map(({ key, color, icon: Icon }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.07, duration: 0.4 }}
            >
              <Button
                onClick={() => goToChat(questions[key])}
                variant="outline"
                className="w-full h-16 cursor-pointer rounded-2xl border border-white/10 bg-white/5 shadow-sm backdrop-blur-lg transition-all hover:scale-105 hover:border-indigo-500/40 hover:bg-white/10 active:scale-95"
              >
                <div className="flex h-full flex-col items-center justify-center gap-1.5">
                  <Icon size={20} strokeWidth={2} color={color} />
                  <span className="text-xs font-medium text-white/80">{key}</span>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* AI Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 w-full max-w-xl"
        >
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-white/30">
            AI Tools
          </p>
          <button
            onClick={() => router.push('/document-analyst')}
            className="group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-sm backdrop-blur-lg transition-all hover:border-indigo-500/40 hover:bg-white/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow">
              <FileSearch size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">AI Document Management</p>
              <p className="text-xs text-white/40">Upload PDF/Word → phân tích & quản lý tài liệu</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-white/30 transition-colors group-hover:text-indigo-400" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
