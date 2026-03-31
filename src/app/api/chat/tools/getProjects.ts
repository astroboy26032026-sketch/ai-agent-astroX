import { tool } from 'ai';
import { z } from 'zod';

export const getProjects = tool({
  description: 'Hiển thị danh sách các dự án của AstroX platform',
  parameters: z.object({}),
  execute: async () => {
    return 'Đây là tất cả các dự án của AstroX! Bạn muốn biết thêm về dự án nào?';
  },
});
