import { mcq3, txt } from './common.js'

export const latentDirichletAllocation = [
  mcq3(
    'Remembering',
    'Primary purpose of Latent Dirichlet Allocation (LDA)?',
    'Mục đích chính của LDA (chủ đề tiềm ẩn)?',
    { en: 'Classify into predefined categories', vi: 'Phân loại theo nhãn cho trước' },
    { en: 'Discover hidden topics in documents', vi: 'Khám phá chủ đề ẩn trong văn bản' },
    { en: 'Translate between languages', vi: 'Dịch ngôn ngữ' }
  ),
  mcq3(
    'Remembering',
    'In LDA, what is a “topic”?',
    'Trong LDA, “topic” là gì?',
    { en: 'A distribution over words', vi: 'Phân phối trên từ vựng' },
    { en: 'A single keyword', vi: 'Một từ khóa' },
    { en: 'A cluster of documents only', vi: 'Chỉ cụm tài liệu' }
  ),
  mcq3(
    'Understanding',
    'How does LDA represent a document?',
    'LDA biểu diễn một văn bản như thế nào?',
    { en: 'As a single topic', vi: 'Một chủ đề duy nhất' },
    { en: 'As a mixture of multiple topics', vi: 'Hỗn hợp nhiều chủ đề' },
    { en: 'As keywords only', vi: 'Chỉ danh sách từ khóa' }
  ),
  mcq3(
    'Understanding',
    'Why is LDA unsupervised?',
    'Vì sao LDA là học không giám sát?',
    { en: 'Requires labeled data', vi: 'Cần nhãn' },
    { en: 'Only structured data', vi: 'Chỉ dữ liệu có cấu trúc' },
    { en: 'Learns patterns without labels', vi: 'Học mẫu không cần nhãn' }
  ),
  mcq3(
    'Applying',
    'Apply LDA to news articles. Expected output?',
    'Áp LDA lên bài báo. Đầu ra kỳ vọng?',
    { en: 'Classification label per article', vi: 'Nhãn phân loại mỗi bài' },
    { en: 'Topics and their word distributions', vi: 'Các chủ đề và phân phối từ' },
    { en: 'Sentiment score', vi: 'Điểm cảm xúc' }
  ),
  mcq3(
    'Applying',
    'Document: 70% Topic A, 30% Topic B. What does it imply?',
    'Tài liệu: 70% chủ đề A, 30% chủ đề B. Ý nghĩa?',
    { en: 'Belongs only to A', vi: 'Chỉ thuộc A' },
    {
      en: 'Mostly words related to A but also some from B.',
      vi: 'Chủ yếu từ liên quan A nhưng cũng có phần B.',
    },
    { en: 'Incorrectly modeled', vi: 'Mô hình sai' }
  ),
  mcq3(
    'Analyzing',
    'If number of topics K is too high?',
    'Nếu số chủ đề K quá cao?',
    { en: 'Topics become fragmented and less meaningful', vi: 'Chủ đề vụn và ít ý nghĩa' },
    { en: 'Topics too general', vi: 'Chủ đề quá chung' },
    { en: 'Model stops working', vi: 'Mô hình hỏng' }
  ),
  mcq3(
    'Analyzing',
    'Why remove stopwords before LDA?',
    'Vì sao loại stopword trước LDA?',
    { en: 'Only to save compute', vi: 'Chỉ để tiết kiệm tính toán' },
    { en: 'Improve topic quality by removing uninformative words', vi: 'Cải thiện chất lượng chủ đề' },
    { en: 'Not necessary', vi: 'Không cần' }
  ),
  txt(
    'Evaluating',
    'LDA topics have overlapping, unclear keywords. What might be wrong?',
    'Chủ đề LDA chồng chéo, từ khóa mơ hồ. Có thể do đâu?',
    'Mention K, preprocessing, parameters, or data fit.',
    'Trả lời ngắn; ưu tiên tiếng Anh.'
  ),
  txt(
    'Creating',
    'Propose one real-world application of LDA and how it helps.',
    'Đề xuất một ứng dụng thực tế của LDA và lợi ích.',
    'English primary.',
    'Có thể song ngữ.'
  ),
]
