import { tool } from 'ai';
import { z } from 'zod';

const PROJECTS_DATA = [
  {
    name: 'AI Document Management',
    status: 'Đang phát triển',
    description: 'Upload PDF/Word, hỏi đáp với AI, break down tài liệu thành Kanban task board',
    features: ['Upload & parse PDF/Word', 'Chat AI phân tích tài liệu', 'AI break down task tự động', 'Kanban task board'],
    link: '/document-analyst',
  },
  {
    name: 'AI Document Swagger',
    status: 'Planned',
    description: 'Parse tài liệu → tạo OpenAPI/Swagger spec, cập nhật qua chat',
    features: ['Parse tài liệu → OpenAPI spec', 'Chỉnh sửa Swagger qua chat', 'Export spec'],
    link: null,
  },
  {
    name: 'AI Document Test Case',
    status: 'Planned',
    description: 'Parse tài liệu → tự động sinh test case',
    features: ['Sinh test case từ tài liệu', 'Tích hợp pytest/JUnit', 'Export test case'],
    link: null,
  },
];

export const getProjects = tool({
  description: 'Hiển thị danh sách các dự án của AstroX platform',
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify(PROJECTS_DATA);
  },
});
