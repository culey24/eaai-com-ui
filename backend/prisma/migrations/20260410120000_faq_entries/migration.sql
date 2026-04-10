-- FAQ entries for agent-assistant FAQ Agent (embedding match before ADK)

CREATE TABLE "faq_entries" (
    "faq_id" BIGSERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "keywords" JSONB NOT NULL DEFAULT '[]',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_entries_pkey" PRIMARY KEY ("faq_id")
);

CREATE INDEX "faq_entries_is_active_sort_order_idx" ON "faq_entries"("is_active", "sort_order");

INSERT INTO "faq_entries" ("question", "answer", "keywords", "sort_order", "is_active", "updated_at")
VALUES
(
  'Khóa học EAAI là gì?',
  'EAAI là học phần/hoạt động hỗ trợ sinh viên làm quen với trợ lý AI và cách sử dụng có trách nhiệm trong bối cảnh học tập. Chi tiết chương trình xem trong slide bài giảng và thông báo của giảng viên.',
  '["eaai","khóa học","môn học","giới thiệu"]'::jsonb,
  1,
  true,
  CURRENT_TIMESTAMP
),
(
  'Các lớp IS-1, IS-2, IS-3 khác nhau thế nào?',
  'IS-1: kênh chat với trợ lý AI (ai-chat). IS-2: kênh nội bộ với supporter (internal-chat). IS-3: kênh tư vấn với mô hình ngôn ngữ trên human-chat. Bạn chỉ thấy kênh tương ứng với lớp đã đăng ký.',
  '["is-1","is-2","is-3","lớp","phân lớp","kênh chat"]'::jsonb,
  2,
  true,
  CURRENT_TIMESTAMP
),
(
  'Làm sao để nộp bài journal?',
  'Vào mục Journal trên hệ thống, chọn đúng đợt (period) đang mở, tải file theo định dạng quy định và bấm nộp. Sau khi nộp, bạn có thể xem lại trạng thái trong danh sách bài đã gửi.',
  '["journal","nộp bài","upload","bài tập"]'::jsonb,
  3,
  true,
  CURRENT_TIMESTAMP
),
(
  'Hạn nộp bài được tính như thế nào?',
  'Hạn nộp do giảng viên cấu hình theo từng đợt (journal period). Thời điểm cụ thể hiển thị trên giao diện Journal; hãy nộp trước thời điểm đóng đợt.',
  '["deadline","hạn","hết hạn","đợt nộp"]'::jsonb,
  4,
  true,
  CURRENT_TIMESTAMP
),
(
  'Tôi cần hỗ trợ từ người (supporter) thì làm gì?',
  'Học viên lớp IS-2 dùng kênh internal-chat sau khi được quản trị gán supporter. Nếu chưa được gán, hệ thống sẽ báo — liên hệ giảng viên hoặc admin qua kênh chính thức của lớp.',
  '["supporter","hỗ trợ","is-2","nội bộ"]'::jsonb,
  5,
  true,
  CURRENT_TIMESTAMP
),
(
  'Làm sao báo cáo nội dung không phù hợp trong chat?',
  'Trong cửa sổ chat (kênh học viên), dùng nút báo cáo (Report) kèm mô tả ngắn. Quản trị sẽ xem xét theo quy trình nội bộ.',
  '["báo cáo","report","vi phạm","nội dung"]'::jsonb,
  6,
  true,
  CURRENT_TIMESTAMP
);
