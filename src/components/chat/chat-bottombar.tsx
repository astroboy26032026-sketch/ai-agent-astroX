'use client';

/**
 * ChatBottombar
 * Thanh nhập liệu ở cuối trang chat portfolio.
 * Hỗ trợ gửi bằng Enter và nút submit/stop.
 */

import { ChatRequestOptions } from 'ai';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

/** Type gửi form tương thích React 19 + AI SDK useChat */
type SubmitEvent = { preventDefault?: () => void };

interface ChatBottombarProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (
    e: SubmitEvent,
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  isLoading: boolean;
  /** Dừng stream AI đang chạy */
  stop: () => void;
  /** Khoá input khi có tool đang thực thi */
  isToolInProgress: boolean;
}

export default function ChatBottombar({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  isToolInProgress,
}: ChatBottombarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input khi component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Gửi tin nhắn khi nhấn Enter (bỏ qua khi đang compose IME hoặc tool đang chạy).
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Enter' &&
      !e.nativeEvent.isComposing &&
      !isToolInProgress &&
      input.trim()
    ) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full pb-2 md:pb-8"
    >
      <form onSubmit={handleSubmit} className="relative w-full md:px-4">
        <div className="mx-auto flex items-center rounded-full border border-neutral-700 bg-neutral-800 py-2 pr-2 pl-6">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={isToolInProgress ? 'Đang xử lý...' : 'Hỏi tôi bất cứ điều gì'}
            aria-label="Nhập câu hỏi"
            className="w-full border-none bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
            disabled={isToolInProgress || isLoading}
          />

          {/* Nút submit — khi isLoading thì chuyển thành nút Stop */}
          <button
            type="submit"
            disabled={!isLoading && (!input.trim() || isToolInProgress)}
            aria-label={isLoading ? 'Dừng' : 'Gửi'}
            className="flex items-center justify-center rounded-full bg-[#0171E3] p-2 text-white disabled:opacity-50"
            onClick={(e) => {
              if (isLoading) {
                e.preventDefault();
                stop();
              }
            }}
          >
            <ArrowUp className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
