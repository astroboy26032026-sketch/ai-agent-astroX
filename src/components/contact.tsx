'use client';

import { Clock } from 'lucide-react';

export function Contact() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 py-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Liên hệ</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Thông tin liên hệ đang được cập nhật.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/20">
          <Clock size={28} className="text-indigo-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-white/80">Coming Soon</p>
          <p className="mt-1 text-sm text-white/40">
            Thông tin liên hệ sẽ được cập nhật sớm.
          </p>
        </div>
      </div>
    </div>
  );
}
