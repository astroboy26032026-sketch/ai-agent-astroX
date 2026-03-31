import { mistral } from '@ai-sdk/mistral';
import { streamText } from 'ai';
import { SYSTEM_PROMPT } from './prompt';
import { getContact } from './tools/getContact';
import { getPresentation } from './tools/getPresentation';
import { getProjects } from './tools/getProjects';
import { getProgress } from './tools/getProgress';

export const maxDuration = 30;

/**
 * Chuẩn hoá lỗi thành string để trả về client.
 */
function errorHandler(error: unknown): string {
  if (error == null) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return JSON.stringify(error);
}

/**
 * POST /api/chat
 * Xử lý chat chính của portfolio AstroX.
 * Dùng Mistral Large, có tool calling cho: presentation, projects, progress, contact.
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Thêm system prompt vào đầu danh sách message (không mutation mảng gốc)
    const messagesWithSystem = [SYSTEM_PROMPT, ...messages];

    const tools = { getProjects, getPresentation, getContact, getProgress };

    const result = streamText({
      model: mistral('mistral-large-latest'),
      messages: messagesWithSystem,
      toolCallStreaming: true,
      tools,
      maxSteps: 2,
    });

    return result.toDataStreamResponse({ getErrorMessage: errorHandler });
  } catch (err) {
    return new Response(errorHandler(err), { status: 500 });
  }
}
