'use client';

import { motion } from 'framer-motion';

const projects = [
  { name: 'AI Document Management', progress: 30, color: 'from-indigo-500 to-violet-500', status: 'In Progress' },
  { name: 'AI Document Swagger', progress: 0, color: 'from-gray-600 to-gray-700', status: 'Planned' },
  { name: 'AI Document Test Case', progress: 0, color: 'from-gray-600 to-gray-700', status: 'Planned' },
];

const Skills = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-5xl py-6"
    >
      <h2 className="mb-8 text-3xl font-bold text-foreground">Project Status</h2>

      <div className="space-y-6">
        {projects.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{p.name}</span>
              <div className="flex items-center gap-3">
                <span className={`text-xs rounded-full px-2 py-0.5 ${p.progress > 0 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {p.status}
                </span>
                <span className="text-sm font-bold tabular-nums text-foreground">{p.progress}%</span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${p.color} transition-all duration-700 ease-out`}
                style={{ width: `${p.progress}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        AstroX đang được phát triển tích cực. AI Document Management là module đầu tiên, các module khác sẽ ra mắt trong 2026.
      </p>
    </motion.div>
  );
};

export default Skills;
