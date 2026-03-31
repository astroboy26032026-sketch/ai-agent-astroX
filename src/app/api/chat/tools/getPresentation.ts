import { tool } from 'ai';
import { z } from 'zod';

export const getPresentation = tool({
  description: 'Hiển thị giới thiệu về AstroX platform. Dùng khi user hỏi "bạn là ai?" hoặc "AstroX là gì?"',
  parameters: z.object({}),
  execute: async () => {
    return { presentation: 'Đây là giới thiệu về AstroX, bạn có thể xem chi tiết ở trên!' };
  },
});
