import { tool } from 'ai';
import { z } from 'zod';

export const getProgress = tool({
  description: 'Hiển thị tiến độ các dự án của AstroX. Dùng khi user hỏi về tiến độ, progress, hay tình trạng dự án.',
  parameters: z.object({}),
  execute: async () => {
    return 'Đây là tiến độ các dự án của AstroX, bạn có thể xem ở trên!';
  },
});
