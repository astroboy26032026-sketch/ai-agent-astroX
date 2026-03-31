import { Contact } from '../contact';
import { Presentation } from '../presentation';
import AllProjects from '../projects/AllProjects';
import Skills from '../skills';

interface ToolRendererProps {
  toolInvocations: any[];
  messageId: string;
}

export default function ToolRenderer({ toolInvocations }: ToolRendererProps) {
  return (
    <div className="w-full transition-all duration-300">
      {toolInvocations.map((tool) => {
        const { toolCallId, toolName } = tool;

        switch (toolName) {
          case 'getProjects':
            return (
              <div key={toolCallId} className="w-full overflow-hidden rounded-lg">
                <AllProjects />
              </div>
            );
          case 'getPresentation':
            return (
              <div key={toolCallId} className="w-full overflow-hidden rounded-lg">
                <Presentation />
              </div>
            );
          case 'getContact':
            return (
              <div key={toolCallId} className="w-full rounded-lg">
                <Contact />
              </div>
            );
          case 'getProgress':
            return (
              <div key={toolCallId} className="w-full rounded-lg">
                <Skills />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
