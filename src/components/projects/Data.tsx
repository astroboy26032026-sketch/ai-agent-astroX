import { ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const PROJECT_CONTENT = [
  {
    title: 'AI Document Management',
    status: 'In Progress — 30%',
    statusColor: 'text-indigo-400',
    description:
      'Upload tài liệu PDF hoặc Word, hỏi đáp với AI, phân tích nội dung và break down thành task board. Module đầu tiên của AstroX.',
    features: [
      'Upload PDF / Word, Q&A streaming với AI',
      'Break down tài liệu thành task board (Kanban)',
      'Multi-provider: Mistral, Groq, Anthropic',
      'Selector model AI ngay trên giao diện',
    ],
    techStack: ['Next.js 15', 'Mistral AI', 'Vercel AI SDK', 'pdf-parse', 'mammoth', 'Tailwind CSS'],
    date: 'Q1 2026',
    links: [],
  },
  {
    title: 'AI Document Swagger',
    status: 'Planned — 0%',
    statusColor: 'text-gray-400',
    description:
      'Feed a technical specification document and get a fully-formed OpenAPI / Swagger definition back. Update the spec conversationally via chat — no YAML editing required.',
    features: [
      'Doc → OpenAPI 3.0 JSON/YAML',
      'Chat-based spec updates',
      'Live Swagger UI preview',
      'Export to Postman / Insomnia',
    ],
    techStack: ['Next.js', 'AI SDK', 'swagger-ui-react', 'js-yaml'],
    date: 'Q3 2026',
    links: [],
  },
  {
    title: 'AI Document Test Case',
    status: 'Planned — 0%',
    statusColor: 'text-gray-400',
    description:
      'Turn any requirements document into a complete test case suite. Covers happy paths, edge cases, and negative scenarios. Export to Excel, Jira, or TestRail.',
    features: [
      'Doc → test cases (unit / integration / E2E)',
      'Happy path + edge + negative scenarios',
      'Export to Excel / JSON / TestRail',
      'Review & edit before export',
    ],
    techStack: ['Next.js', 'AI SDK', 'xlsx', 'Jira API'],
    date: 'Q4 2026',
    links: [],
  },
];

const ProjectContent = ({ project }: { project: { title: string } }) => {
  const projectData = PROJECT_CONTENT.find((p) => p.title === project.title);
  if (!projectData) return <div>Not found</div>;

  return (
    <div className="space-y-8 pb-16">
      {/* Status + description */}
      <div className="rounded-3xl bg-[#F5F5F7] p-8 dark:bg-[#1D1D1F]">
        <div className="space-y-4">
          <span className={`text-sm font-semibold ${projectData.statusColor}`}>
            {projectData.status}
          </span>
          <p className="text-secondary-foreground text-base leading-relaxed md:text-lg">
            {projectData.description}
          </p>

          {/* Features */}
          <div className="pt-2">
            <h3 className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Key Features</h3>
            <ul className="space-y-1">
              {projectData.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div className="pt-2">
            <h3 className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {projectData.techStack.map((tech, i) => (
                <span key={i} className="rounded-full bg-neutral-200 px-3 py-1 text-xs text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <Separator className="my-4" />
        <p className="text-sm text-neutral-500">Target: {projectData.date}</p>
      </div>
    </div>
  );
};

export const data = [
  {
    category: 'Live · 30%',
    title: 'AI Document Management',
    src: '/avatar.png',
    content: <ProjectContent project={{ title: 'AI Document Management' }} />,
  },
  {
    category: 'Planned · 0%',
    title: 'AI Document Swagger',
    src: '/avatar.png',
    content: <ProjectContent project={{ title: 'AI Document Swagger' }} />,
  },
  {
    category: 'Planned · 0%',
    title: 'AI Document Test Case',
    src: '/avatar.png',
    content: <ProjectContent project={{ title: 'AI Document Test Case' }} />,
  },
];
