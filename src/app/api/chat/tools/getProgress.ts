import { tool } from 'ai';
import { z } from 'zod';

const PROGRESS_DATA = [
  {
    name: 'AI Document Management',
    status: 'Đang phát triển',
    progress: 30,
    description: 'Upload PDF/Word, hỏi đáp với AI, break down tài liệu thành Kanban task board',
    completed: [
      'Upload và parse file PDF/Word',
      'Chat với AI về nội dung tài liệu',
      'Giao diện Kanban task board',
    ],
    inProgress: [
      'AI tự động break down task từ tài liệu',
      'Tích hợp multi-provider (Mistral, Groq, Anthropic)',
      'Tối ưu UI/UX',
    ],
    todo: [
      'Lưu trữ task vào database',
      'Xuất task ra Jira/Trello',
      'Xác thực và rate limiting API',
    ],
  },
  {
    name: 'AI Document Swagger',
    status: 'Planned',
    progress: 0,
    description: 'Parse tài liệu → tạo OpenAPI/Swagger spec, cập nhật qua chat',
    completed: [],
    inProgress: [],
    todo: [
      'Thiết kế kiến trúc hệ thống',
      'Xây dựng mô hình parse tài liệu → OpenAPI',
      'Giao diện xem và chỉnh sửa Swagger spec',
      'Cập nhật spec qua chat AI',
    ],
  },
  {
    name: 'AI Document Test Case',
    status: 'Planned',
    progress: 0,
    description: 'Parse tài liệu → tự động sinh test case',
    completed: [],
    inProgress: [],
    todo: [
      'Thiết kế kiến trúc hệ thống',
      'Xây dựng mô hình sinh test case từ tài liệu',
      'Tích hợp framework kiểm thử (pytest, JUnit)',
      'Giao diện quản lý và export test case',
    ],
  },
];

export const getProgress = tool({
  description: 'Hiển thị tiến độ các dự án của AstroX. Dùng khi user hỏi về tiến độ, progress, hay tình trạng dự án.',
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify(PROGRESS_DATA);
  },
});
