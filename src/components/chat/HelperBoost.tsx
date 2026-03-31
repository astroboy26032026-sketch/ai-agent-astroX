import { Button } from '@/components/ui/button';
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  Laugh,
  Layers,
  UserRoundSearch,
} from 'lucide-react';
import { useState } from 'react';

interface HelperBoostProps {
  submitQuery?: (query: string) => void;
}

const questions = {
  Me: 'Bạn là ai? Giới thiệu về AstroX cho tôi.',
  Projects: 'Các dự án của bạn là gì?',
  Progress: 'Tiến độ các dự án hiện tại như thế nào?',
  Contact: 'Liên hệ với bạn như thế nào?',
};

const questionConfig = [
  { key: 'Me', color: '#329696', icon: Laugh },
  { key: 'Projects', color: '#3E9858', icon: BriefcaseBusiness },
  { key: 'Progress', color: '#856ED9', icon: Layers },
  { key: 'Contact', color: '#C19433', icon: UserRoundSearch },
];

export default function HelperBoost({ submitQuery }: HelperBoostProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleQuestionClick = (questionKey: string) => {
    if (submitQuery) {
      submitQuery(questions[questionKey as keyof typeof questions]);
    }
  };

  return (
    <div className="w-full">
      {/* Toggle Button */}
      <div className={isVisible ? 'mb-2 flex justify-center' : 'mb-0 flex justify-center'}>
        <button
          onClick={() => setIsVisible((v) => !v)}
          className="flex items-center gap-1 px-3 py-1 text-xs text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
        >
          {isVisible ? (
            <><ChevronDown size={14} /> Hide quick questions</>
          ) : (
            <><ChevronUp size={14} /> Show quick questions</>
          )}
        </button>
      </div>

      {/* Quick question buttons */}
      {isVisible && (
        <div
          className="flex w-full flex-wrap gap-1 md:gap-3"
          style={{ justifyContent: 'safe center' }}
        >
          {questionConfig.map(({ key, color, icon: Icon }) => (
            <Button
              key={key}
              onClick={() => handleQuestionClick(key)}
              variant="outline"
              className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 h-auto min-w-[100px] flex-shrink-0 cursor-pointer rounded-xl bg-white/80 dark:bg-gray-800/80 px-4 py-3 shadow-none backdrop-blur-sm transition-none active:scale-95"
            >
              <div className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
                <Icon size={18} strokeWidth={2} color={color} />
                <span className="text-sm font-medium">{key}</span>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
