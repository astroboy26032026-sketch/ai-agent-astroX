'use client';
import { useChat } from '@ai-sdk/react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import ChatBottombar from '@/components/chat/chat-bottombar';
import ChatLanding from '@/components/chat/chat-landing';
import ChatMessageContent from '@/components/chat/chat-message-content';
import { SimplifiedChatView } from '@/components/chat/simple-chat-view';
import {
  ChatBubble,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import WelcomeModal from '@/components/welcome-modal';
import { Info } from 'lucide-react';
import HelperBoost from './HelperBoost';

const Chat = () => {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query');
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

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

  const { currentAIMessage, latestUserMessage, hasActiveTool } = useMemo(() => {
    const latestAIIdx = messages.findLastIndex((m) => m.role === 'assistant');
    const latestUserIdx = messages.findLastIndex((m) => m.role === 'user');

    const result = {
      currentAIMessage: latestAIIdx !== -1 ? messages[latestAIIdx] : null,
      latestUserMessage: latestUserIdx !== -1 ? messages[latestUserIdx] : null,
      hasActiveTool: false,
    };

    if (result.currentAIMessage) {
      result.hasActiveTool =
        result.currentAIMessage.parts?.some(
          (p) => p.type === 'tool-invocation' && p.toolInvocation?.state === 'result'
        ) || false;
    }

    if (latestAIIdx < latestUserIdx) result.currentAIMessage = null;

    return result;
  }, [messages]);

  const isToolInProgress = messages.some(
    (m) =>
      m.role === 'assistant' &&
      m.parts?.some(
        (p) => p.type === 'tool-invocation' && p.toolInvocation?.state !== 'result'
      )
  );

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

  const isEmptyState = !currentAIMessage && !latestUserMessage && !loadingSubmit;
  const headerHeight = hasActiveTool ? 100 : 180;

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
        <div className={`transition-all duration-300 ease-in-out ${hasActiveTool ? 'pt-6 pb-0' : 'py-6'}`}>
          <div className="flex justify-center">
            <div className={`transition-all duration-300 ${hasActiveTool ? 'h-20 w-20' : 'h-28 w-28'}`}>
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

          {/* User message bubble in header — no AnimatePresence to avoid flicker */}
          {latestUserMessage && !currentAIMessage && (
            <div className="mx-auto flex max-w-4xl px-4 pt-2">
              <ChatBubble variant="sent">
                <ChatBubbleMessage>
                  <ChatMessageContent
                    message={latestUserMessage}
                    isLast={true}
                    isLoading={false}
                    reload={() => Promise.resolve(null)}
                  />
                </ChatBubbleMessage>
              </ChatBubble>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area — wider max-w */}
      <div className="container mx-auto flex h-full max-w-4xl flex-col">
        <div
          className="flex-1 overflow-y-auto px-2"
          style={{ paddingTop: `${headerHeight}px` }}
        >
          {isEmptyState ? (
            <div className="flex min-h-full items-center justify-center">
              <ChatLanding submitQuery={submitQuery} />
            </div>
          ) : currentAIMessage ? (
            <div className="pb-4">
              <SimplifiedChatView
                message={currentAIMessage}
                isLoading={isLoading}
                reload={reload}
                addToolResult={addToolResult}
              />
            </div>
          ) : null}
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
