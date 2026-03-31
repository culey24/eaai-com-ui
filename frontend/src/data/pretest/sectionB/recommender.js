import { mcq3, txt } from './common.js'

export const recommenderSystem = [
  mcq3(
    'Remembering',
    'Which recommender suggests items similar to those a user liked based on item features?',
    'Hệ gợi ý nào đề xuất mục tương tự những mục người dùng đã thích dựa trên đặc trưng mục?',
    { en: 'Collaborative Filtering', vi: 'Lọc cộng tác' },
    { en: 'Content-based Filtering', vi: 'Lọc theo nội dung' },
    { en: 'Association Rules', vi: 'Luật kết hợp' }
  ),
  mcq3(
    'Remembering',
    'Term for when the system cannot recommend to a new user due to lack of history?',
    'Thuật ngữ khi hệ thống không gợi ý được cho người dùng mới vì thiếu lịch sử:',
    { en: 'Data Sparsity', vi: 'Data sparsity' },
    { en: 'Overfitting', vi: 'Overfitting' },
    { en: 'Cold Start Problem', vi: 'Cold start' }
  ),
  mcq3(
    'Understanding',
    'How does User-User Collaborative Filtering differ from Item-Item Collaborative Filtering?',
    'User-User CF khác Item-Item CF thế nào?',
    {
      en: 'User-User finds similar users; Item-Item finds similar items based on ratings.',
      vi: 'User-User tìm người dùng tương tự; Item-Item tìm mục tương tự dựa trên điểm.',
    },
    {
      en: 'User-User only uses metadata; Item-Item only uses ratings.',
      vi: 'User-User chỉ dùng metadata; Item-Item chỉ dùng rating.',
    },
    { en: 'There is no fundamental difference.', vi: 'Không khác cơ bản.' }
  ),
  mcq3(
    'Understanding',
    'Why is Matrix Factorization used in Recommender Systems?',
    'Vì sao dùng phân tách ma trận (matrix factorization) trong RS?',
    { en: 'To increase dataset size.', vi: 'Để tăng kích thước dữ liệu.' },
    {
      en: 'To uncover latent features that explain ratings in a sparse matrix.',
      vi: 'Khám phá đặc trưng tiềm ẩn giải thích rating trong ma trận thưa.',
    },
    {
      en: 'To categorize users into fixed demographic groups.',
      vi: 'Phân nhóm người dùng theo nhóm nhân khẩu cố định.',
    }
  ),
  mcq3(
    'Applying',
    'User likes Inception (Sci-Fi, Nolan) and Interstellar (Sci-Fi, Nolan). A content-based system will most likely recommend:',
    'Người dùng thích Inception và Interstellar (Sci-Fi, Nolan). Hệ content-based có khả năng gợi ý:',
    { en: 'A popular Romantic Comedy', vi: 'Một hài lãng mạn ăn khách' },
    { en: 'Tenet (Sci-Fi, Nolan)', vi: 'Tenet (Sci-Fi, Nolan)' },
    { en: 'A random documentary', vi: 'Một phim tài liệu ngẫu nhiên' }
  ),
  mcq3(
    'Applying',
    'Users A and B have high cosine similarity. A rates Movie X highly. What is likely predicted for B on X?',
    'A và B có độ tương tự cosine cao. A cho Movie X điểm cao. Dự đoán cho B về X:',
    { en: 'A low rating', vi: 'Điểm thấp' },
    { en: 'A high rating', vi: 'Điểm cao' },
    { en: 'No rating possible', vi: 'Không thể cho điểm' }
  ),
  mcq3(
    'Analyzing',
    'Millions of items but few ratings per user. The most significant challenge is:',
    'Rất nhiều mục nhưng mỗi user ít rating. Thách thức chính:',
    { en: 'Computational speed', vi: 'Tốc độ tính toán' },
    { en: 'Data Sparsity', vi: 'Dữ liệu thưa' },
    { en: 'Hardware storage', vi: 'Lưu trữ phần cứng' }
  ),
  mcq3(
    'Analyzing',
    'If the goal is that the Top-5 list contains only relevant items, which is more important: Precision or Recall?',
    'Nếu mục tiêu Top-5 chỉ chứa mục liên quan, Precision hay Recall quan trọng hơn?',
    { en: 'Precision', vi: 'Precision' },
    { en: 'Recall', vi: 'Recall' },
    { en: 'Both equally important', vi: 'Ngang nhau' }
  ),
  txt(
    'Evaluating',
    'Evaluate ethical implications of a filter bubble in news recommendations on information diversity.',
    'Đánh giá tác động đạo đức của "filter bubble" trong gợi ý tin tức đối với đa dạng thông tin.',
    'Short answer (English primary).',
    'Có thể trả lời bổ sung bằng tiếng Việt.'
  ),
  txt(
    'Creating',
    'Propose a hybrid recommender architecture that combines CF and content-based filtering to mitigate cold start for new items.',
    'Đề xuất kiến trúc hybrid kết hợp CF và content-based để giảm cold start cho mục mới.',
    'Describe in English (you may add Vietnamese notes).',
    'Mô tả ngắn gọn; tiếng Anh là chính.'
  ),
]
