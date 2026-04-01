'use client';
import { useChat } from '@ai-sdk/react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import ChatBottombar from '@/components/chat/chat-bottombar';
import ChatLanding from '@/components/chat/chat-landing';
import { SimplifiedChatView } from '@/components/chat/simple-chat-view';
import {
  ChatBubble,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import ChatMessageContent from '@/components/chat/chat-message-content';
import WelcomeModal from '@/components/welcome-modal';
import { Info } from 'lucide-react';
import HelperBoost from './HelperBoost';

const Chat = () => {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query');
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    stop,
    setInput,
    reload,
    addToolResult,
    append,
  } = useChat({
    onResponse: () => { setLoadingSubmit(false); },
    onFinish: () => { setLoadingSubmit(false); },
    onError: (error) => {
      setLoadingSubmit(false);
      toast.error(`Error: ${error.message}`);
    },
  });

  const isToolInProgress = messages.some(
    (m) =>
      m.role === 'assistant' &&
      m.parts?.some(
        (p) => p.type === 'tool-invocation' && p.toolInvocation?.state !== 'result'
      )
  );

  const hasMessages = messages.length > 0;

  const submitQuery = (query: string) => {
    if (!query.trim() || isToolInProgress) return;
    setLoadingSubmit(true);
    append({ role: 'user', content: query });
  };

  useEffect(() => {
    if (initialQuery && !autoSubmitted) {
      setAutoSubmitted(true);
      setInput('');
      submitQuery(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, autoSubmitted]);

  // Auto-scroll khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSubmit = (e: { preventDefault?: () => void }) => {
    e.preventDefault?.();
    if (!input.trim() || isToolInProgress) return;
    submitQuery(input);
    setInput('');
  };

  const handleStop = () => {
    stop();
    setLoadingSubmit(false);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="absolute top-6 right-8 z-51">
        <WelcomeModal
          trigger={
            <div className="hover:bg-accent cursor-pointer rounded-2xl px-3 py-1.5">
              <Info className="text-accent-foreground h-8" />
            </div>
          }
        />
      </div>

      {/* Fixed Avatar Header */}
      <div className="fixed top-0 right-0 left-0 z-50 bg-gradient-to-b from-black via-black/95 via-50% to-transparent">
        <div className={`transition-all duration-300 ease-in-out ${hasMessages ? 'pt-6 pb-0' : 'py-6'}`}>
          <div className="flex justify-center">
            <div className={`transition-all duration-300 ${hasMessages ? 'h-20 w-20' : 'h-28 w-28'}`}>
              <div
                className="relative h-full w-full cursor-pointer overflow-hidden rounded-full"
                onClick={() => (window.location.href = '/')}
              >
                <Image
                  src="/avatar.png"
                  alt="AstroX"
                  width={112}
                  height={112}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto flex h-full max-w-4xl flex-col">
        <div
          className="flex-1 overflow-y-auto px-2"
          style={{ paddingTop: hasMessages ? '100px' : '180px' }}
        >
          {!hasMessages && !loadingSubmit ? (
            <div className="flex min-h-full items-center justify-center">
              <ChatLanding submitQuery={submitQuery} />
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-4">
              {messages.map((message, index) => {
                const isLast = index === messages.length - 1;

                if (message.role === 'user') {
                  return (
                    <div key={message.id} className="flex justify-end px-4">
                      <ChatBubble variant="sent">
                        <ChatBubbleMessage>
                          <ChatMessageContent
                            message={message}
                            isLast={isLast}
                            isLoading={false}
                            reload={() => Promise.resolve(null)}
                          />
                        </ChatBubbleMessage>
                      </ChatBubble>
                    </div>
                  );
                }

                if (message.role === 'assistant') {
                  return (
                    <div key={message.id}>
                      <SimplifiedChatView
                        message={message}
                        isLoading={isLast && isLoading}
                        reload={reload}
                        addToolResult={addToolResult}
                      />
                    </div>
                  );
                }

                return null;
              })}

              {/* Loading indicator khi chờ AI phản hồi */}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex items-center gap-2 px-4 text-white/40">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                  <span className="text-xs">Đang suy nghĩ...</span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 px-2 pt-3 md:px-0 md:pb-4 bg-black">
          <div className="relative flex flex-col items-center gap-3">
            <HelperBoost submitQuery={submitQuery} />
            <ChatBottombar
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={onSubmit}
              isLoading={isLoading}
              stop={handleStop}
              isToolInProgress={isToolInProgress}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
