import { tool } from 'ai';
import { z } from 'zod';

export const getContact = tool({
  description: 'Hiển thị thông tin liên hệ. Dùng khi user hỏi cách liên hệ.',
  parameters: z.object({}),
  execute: async () => {
    return 'Thông tin liên hệ đang được cập nhật. Vui lòng xem phần Contact ở trên!';
  },
});
