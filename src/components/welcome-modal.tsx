'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';

interface WelcomeModalProps {
  trigger?: React.ReactNode;
}

export default function WelcomeModal({ trigger }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleContactMe = () => {
    setIsOpen(false);
    window.location.href = '/chat?query=Liên%20hệ%20với%20bạn%20như%20thế%20nào%3F';
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : null}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-background z-52 max-h-[85vh] overflow-auto rounded-2xl border-none p-4 py-6 shadow-xl sm:max-w-[85vw] md:max-w-[80vw] lg:max-w-[1000px]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-full flex-col"
          >
            <DialogHeader className="relative flex flex-row items-start justify-between px-8 pt-8 pb-6">
              <div>
                <DialogTitle className="flex items-center gap-2 text-4xl font-bold tracking-tight">
                  AstroX — AI Platform
                </DialogTitle>
                <DialogDescription className="mt-2 text-base text-white/50">
                  Nền tảng AI đa tác nhân cho đội phát triển phần mềm
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="sticky top-0 right-0 cursor-pointer rounded-full bg-black p-2 text-white hover:bg-black/90 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </DialogHeader>

            <div className="space-y-6 overflow-y-auto px-2 py-4 md:px-8">
              <section className="bg-accent w-full space-y-8 rounded-2xl p-8">
                <div className="space-y-3">
                  <h3 className="text-primary flex items-center gap-2 text-xl font-semibold">
                    AstroX là gì?
                  </h3>
                  <p className="text-accent-foreground text-base leading-relaxed">
                    AstroX là nền tảng AI biến tài liệu phần mềm thành kết quả hành động —
                    từ phân tích nội dung, break down task đến sinh test case, tất cả bởi các AI agent.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-primary flex items-center gap-2 text-xl font-semibold">
                    Module hiện có
                  </h3>
                  <ul className="text-accent-foreground space-y-1 text-sm">
                    <li>🟢 <strong>AI Document Management</strong> — Upload PDF/Word, Q&A, break down task (30%)</li>
                    <li>⏳ <strong>AI Document Swagger</strong> — Sinh OpenAPI spec từ tài liệu (coming soon)</li>
                    <li>⏳ <strong>AI Document Test Case</strong> — Sinh test case tự động (coming soon)</li>
                  </ul>
                </div>
              </section>
            </div>

            <div className="flex flex-col items-center px-8 pt-4 pb-0 md:pb-8">
              <Button
                onClick={() => setIsOpen(false)}
                className="h-auto rounded-full px-4 py-3"
                size="sm"
              >
                Bắt đầu chat
              </Button>
              <div className="mt-6 flex cursor-pointer flex-wrap gap-1 text-center text-sm">
                <p className="text-muted-foreground">
                  Góp ý và liên hệ:
                </p>
                <div
                  className="flex cursor-pointer items-center text-blue-500 hover:underline"
                  onClick={handleContactMe}
                >
                  Liên hệ ngay
                </div>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
