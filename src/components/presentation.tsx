'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export function Presentation() {
  const tags = ['Multi-Agent AI', 'Document Analysis', 'API Generation', 'Test Automation'];

  return (
    <div className="mx-auto w-full max-w-5xl py-6 font-sans">
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
        <div className="relative mx-auto aspect-square w-full max-w-sm">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative h-full w-full overflow-hidden rounded-2xl"
          >
            <Image
              src="/avatar.png"
              alt="AstroX"
              width={500}
              height={500}
              className="h-full w-full object-cover object-center"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col space-y-4"
        >
          <div>
            <h1 className="from-foreground to-muted-foreground bg-gradient-to-r bg-clip-text text-xl font-semibold text-transparent md:text-3xl">
              AstroX
            </h1>
            <p className="text-muted-foreground mt-1">AI Multi-Agent Platform</p>
          </div>

          <p className="text-foreground leading-relaxed">
            AstroX is a platform that transforms software documentation into actionable outputs — from task breakdowns and API specs to test cases, all powered by AI agents working together.
          </p>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Built for development teams who spend too much time reading docs and not enough time building. Upload your spec, let AstroX do the heavy lifting.
          </p>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Presentation;
