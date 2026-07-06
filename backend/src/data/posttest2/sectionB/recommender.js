export const recommenderSystem = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'Which accuracy metric calculates the square root of the average of squared differences between predicted ratings and actual user ratings, thereby placing a heavier penalty on larger prediction errors?',
      vi: 'Chỉ số đo lường độ chính xác nào tính căn bậc hai của trung bình bình phương các sai lệch giữa đánh giá dự đoán và đánh giá thực tế của người dùng, qua đó phạt nặng hơn các lỗi dự đoán lớn?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Mean Absolute Error (MAE)', vi: 'Sai số tuyệt đối trung bình (MAE)' },
      { key: 'B', en: 'Root Mean Square Error (RMSE)', vi: 'Sai số căn phương trung bình (RMSE)' },
      { key: 'C', en: 'Precision at k (P@k)', vi: 'Độ chính xác tại k (P@k)' },
      { key: 'D', en: 'Mean Average Precision (MAP)', vi: 'Độ chính xác trung bình trung bình (MAP)' },
    ],
    answer: 'B',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'In Content-based Filtering systems, what is the primary mathematical purpose of integrating the Inverse Document Frequency (IDF) component into TF-IDF term weighting?',
      vi: 'Trong hệ thống Lọc dựa trên nội dung, mục đích toán học chính của việc tích hợp thành phần Tần suất tài liệu ngược (IDF) vào trọng số thuật ngữ TF-IDF là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'To normalize the length of item description vectors.', vi: 'Để chuẩn hóa độ dài của các vectơ mô tả mục.' },
      { key: 'B', en: 'To reduce the relative weight of generic words that appear across almost all items, highlighting unique descriptive terms.', vi: 'Để giảm trọng số tương đối của các từ chung xuất hiện trong hầu hết các mục, làm nổi bật các thuật ngữ mô tả độc đáo.' },
      { key: 'C', en: 'To calculate the baseline user rating bias across the system.', vi: 'Để tính toán sai số đánh giá cơ sở của người dùng trên toàn hệ thống.' },
      { key: 'D', en: 'To map continuous ratings into a discrete binary classification range.', vi: 'Để ánh xạ các đánh giá liên tục vào một phạm vi phân loại nhị phân rời rạc.' },
    ],
    answer: 'B',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Why is Item-based Collaborative Filtering often preferred over User-based Collaborative Filtering in massive commercial web systems (like Amazon or Netflix)?',
      vi: 'Tại sao Lọc cộng tác dựa trên mục (Item-based CF) thường được ưa chuộng hơn Lọc cộng tác dựa trên người dùng (User-based CF) trong các hệ thống web thương mại khổng lồ (như Amazon hay Netflix)?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'User similarity profiles are inherently more static and scale better over time.', vi: 'Hồ sơ tương đồng của người dùng vốn dĩ tĩnh hơn và có khả năng mở rộng tốt hơn theo thời gian.' },
      { key: 'B', en: 'Item relationships and similarity scores are more stable and the total number of items is often significantly smaller or changes slower than the shifting number of active users.', vi: 'Mối quan hệ và điểm tương đồng giữa các mục ổn định hơn và tổng số lượng mục thường nhỏ hơn đáng kể hoặc thay đổi chậm hơn so với số lượng người dùng tích cực biến động liên tục.' },
      { key: 'C', en: 'Item-based systems completely bypass the cold-start problem for new users.', vi: 'Các hệ thống dựa trên mục bỏ qua hoàn toàn vấn đề khởi đầu lạnh đối với người dùng mới.' },
      { key: 'D', en: 'Item-based approaches do not require any explicit rating input to make predictions.', vi: 'Các phương pháp tiếp cận dựa trên mục không yêu cầu bất kỳ đầu vào đánh giá rõ ràng nào để đưa ra dự đoán.' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'From a strategic product perspective, what is the core benefit of designing a recommender engine that successfully suggests niche, obscure items located in the "Long Tail" of the distribution?',
      vi: 'Dưới góc độ sản phẩm chiến lược, lợi ích cốt lõi của việc thiết kế một công cụ gợi ý đề xuất thành công các mặt hàng ngách, ít phổ biến nằm ở phần "Cái đuôi dài" (Long Tail) của phân phối là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It ensures the system achieves a near-zero RMSE score.', vi: 'Nó đảm bảo hệ thống đạt được điểm RMSE gần bằng không.' },
      { key: 'B', en: 'It optimizes system memory by filtering out highly active users.', vi: 'Nó tối ưu hóa bộ nhớ hệ thống bằng cách lọc ra những người dùng rất tích cực.' },
      { key: 'C', en: 'It uncovers hidden, personalized items that users would not easily discover on their own, enhancing user serendipity and long-term platform loyalty.', vi: 'Nó phát hiện ra các mục được cá nhân hóa ẩn giấu mà người dùng không dễ dàng tự tìm thấy, tăng cường sự bất ngờ thú vị (serendipity) và lòng trung thành lâu dài với nền tảng.' },
      { key: 'D', en: 'It forces the system to operate strictly as a popularity-based model.', vi: 'Nó buộc hệ thống hoạt động nghiêm ngặt như một mô hình dựa trên mức độ phổ biến.' },
    ],
    answer: 'C',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'Suppose a user profile vector and an item feature vector are represented in a binary space. If the dot product of these two vectors yields a high value, what does this mathematically imply in a Content-based Filtering framework?',
      vi: 'Giả sử một vectơ hồ sơ người dùng và một vectơ đặc trưng của mục được biểu diễn trong không gian nhị phân. Nếu tích vô hướng của hai vectơ này mang lại giá trị cao, điều này ngụ ý gì về mặt toán học trong khung Lọc dựa trên nội dung?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'The user has a high similarity score with other users who purchased this item.', vi: 'Người dùng có điểm tương đồng cao với những người dùng khác đã mua mục này.' },
      { key: 'B', en: 'The item has attributes that heavily align with the specific features of items the user has liked or interacted with in the past.', vi: 'Mục đó có các thuộc tính rất phù hợp với các đặc trưng cụ thể của các mục mà người dùng đã thích hoặc tương tác trong quá khứ.' },
      { key: 'C', en: 'The item belongs to the most popular category across the entire platform.', vi: 'Mục này thuộc danh mục phổ biến nhất trên toàn bộ nền tảng.' },
      { key: 'D', en: 'The rating matrix suffers from extreme data sparsity issues.', vi: 'Ma trận xếp hạng gặp phải vấn đề thưa thớt dữ liệu nghiêm trọng.' },
    ],
    answer: 'B',
  },
  {
    id: 'q6',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'In a Memory-based Collaborative Filtering setup, User A and User B have a high Pearson Correlation Coefficient of 0.88. If User A highly rates a newly released item with 5 stars, what rating is the system most likely to predict for User B regarding this identical item?',
      vi: 'Trong thiết lập Lọc cộng tác dựa trên bộ nhớ, Người dùng A và Người dùng B có Hệ số tương quan Pearson cao là 0.88. Nếu Người dùng A đánh giá cao một mục mới phát hành với 5 sao, hệ thống có khả năng dự đoán xếp hạng nào cho Người dùng B đối với chính mục này?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'A very low rating (1 star) due to correlation inversion.', vi: 'Một xếp hạng rất thấp (1 sao) do đảo ngược tương quan.' },
      { key: 'B', en: 'A high predicted rating, adjusted against User B’s baseline average rating behavior.', vi: 'Một xếp hạng dự đoán cao, được điều chỉnh dựa trên hành vi đánh giá trung bình cơ sở của Người dùng B.' },
      { key: 'C', en: 'No prediction can be computed because they must share content tags.', vi: 'Không thể tính toán dự đoán vì họ phải chia sẻ các thẻ nội dung.' },
      { key: 'D', en: 'A completely neutral rating (3 stars) to prevent overfitting.', vi: 'Một đánh giá hoàn toàn trung lập (3 sao) để ngăn chặn hiện tượng quá khớp.' },
    ],
    answer: 'B',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'What is the fundamental scalable disadvantage of using a pure "Memory-based" (Neighborhood) Collaborative Filtering approach in a production system containing millions of active users and items?',
      vi: 'Nhược điểm về khả năng mở rộng cơ bản của việc sử dụng phương pháp Lọc cộng tác dựa trên bộ nhớ thuần túy (lân cận) trong một hệ thống thực tế chứa hàng triệu người dùng và mục hoạt động là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It requires complex domain knowledge engineering to tag item features.', vi: 'Nó đòi hỏi kỹ thuật kiến thức chuyên môn phức tạp để gắn thẻ các đặc trưng của mục.' },
      { key: 'B', en: 'It cannot process explicit numeric feedback like 1-5 star ratings.', vi: 'Nó không thể xử lý phản hồi số rõ ràng như xếp hạng từ 1-5 sao.' },
      { key: 'C', en: 'The entire rating matrix must reside in memory to compute similarities at runtime, making it computationally expensive and non-scalable as data grows.', vi: 'Toàn bộ ma trận xếp hạng phải nằm trong bộ nhớ để tính toán độ tương đồng khi chạy, làm cho nó tốn kém tài nguyên tính toán và không thể mở rộng khi dữ liệu tăng lên.' },
      { key: 'D', en: 'It forces the model to suffer from gradient vanishing during backpropagation.', vi: 'Nó buộc mô hình phải chịu hiện tượng triệt tiêu đạo hàm trong quá trình lan truyền ngược.' },
    ],
    answer: 'C',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'How does the "Recursive Collaborative Filtering" approach attempt to mitigate the intense challenge of data sparsity within a highly sparse rating matrix?',
      vi: 'Phương pháp tiếp cận "Lọc cộng tác đệ quy" cố gắng giảm bớt thách thức nghiêm trọng về độ thưa thớt của dữ liệu trong một ma trận xếp hạng cực kỳ thưa thớt như thế nào?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'By switching the entire platform backend to a static popularity-based strategy.', vi: 'Bằng cách chuyển toàn bộ backend nền tảng sang chiến lược dựa trên độ phổ biến tĩnh.' },
      { key: 'B', en: 'By iteratively predicting missing ratings for standard neighbors first, and then using those synthetic predictions as pseudo-ground truth inputs to calculate recommendations for the active user.', vi: 'Bằng cách dự đoán lặp đi lặp lại các xếp hạng còn thiếu cho những lân cận tiêu chuẩn trước, sau đó sử dụng các dự đoán tổng hợp đó làm đầu vào chân lý giả định (pseudo-ground truth) để tính toán các gợi ý cho người dùng hiện tại.' },
      { key: 'C', en: 'By forcing users to rate at least 50% of the available item catalog.', vi: 'Bằng cách buộc người dùng xếp hạng ít nhất 50% danh mục các mục hiện có.' },
      { key: 'D', en: 'By dropping all items that belong to the tail end of the distribution curve.', vi: 'Bằng cách loại bỏ tất cả các mục thuộc phần cuối của đường cong phân phối.' },
    ],
    answer: 'B',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'An AI researcher evaluates a new music recommendation system and notes that while the raw offline validation accuracy (RMSE) is poor, live A/B testing yields extremely high user satisfaction and click-through rates. How can you explain this outcome?',
      vi: 'Một nhà nghiên cứu AI đánh giá một hệ thống gợi ý âm nhạc mới và lưu ý rằng mặc dù độ chính xác kiểm thử ngoại tuyến (RMSE) kém, kiểm thử A/B trực tiếp mang lại mức độ hài lòng và tỷ lệ nhấp chuột của người dùng cực kỳ cao. Bạn giải thích kết quả này như thế nào?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Accuracy metrics like RMSE are entirely uninformative in all machine learning tasks.', vi: 'Các chỉ số độ chính xác như RMSE hoàn toàn không cung cấp thông tin trong mọi tác vụ học máy.' },
      { key: 'B', en: 'The system may excel at explanation transparency, diversity, and delivering surprising yet relevant suggestions (Serendipity) which users value, despite missing the exact numerical rating targets.', vi: 'Hệ thống có thể vượt trội về tính minh bạch giải thích, tính đa dạng và đưa ra các gợi ý đáng ngạc nhiên nhưng vẫn liên quan (Serendipity) mà người dùng đánh giá cao, bất chấp việc bỏ lỡ các mục tiêu xếp hạng số chính xác.' },
      { key: 'C', en: 'The live users are likely misinterpreting their own listening preferences.', vi: 'Người dùng trực tiếp có khả năng đang diễn giải sai sở thích nghe nhạc của chính họ.' },
      { key: 'D', en: 'The validation dataset was completely empty due to a matrix factorization error.', vi: 'Tập dữ liệu kiểm thử hoàn toàn trống do lỗi phân rã ma trận.' },
    ],
    answer: 'B',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Imagine you are designing a Hybrid Recommender System architecture specifically tailored to eliminate the "New User Cold Start" problem while maintaining high scalability. Propose the most robust combination of methodologies.',
      vi: 'Hãy tưởng tượng bạn đang thiết kế một kiến trúc Hệ thống gợi ý lai được điều chỉnh đặc biệt để loại bỏ vấn đề "Khởi đầu lạnh cho Người dùng mới" mà vẫn duy trì khả năng mở rộng cao. Đề xuất sự kết hợp phương pháp luận mạnh mẽ nhất.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Deploy a pure Matrix Factorization model that updates through batch jobs once a month.', vi: 'Triển khai một mô hình Phân rã ma trận thuần túy cập nhật thông qua các công việc hàng loạt mỗi tháng một lần.' },
      { key: 'B', en: 'Initialize a Knowledge-based or Content-based questionnaire during user onboarding to capture explicit preferences, then seamlessly transition to a Model-based Collaborative Filtering system (e.g., SVD) once the user accumulates interaction data.', vi: 'Khởi tạo bảng câu hỏi dựa trên tri thức hoặc dựa trên nội dung trong quá trình đăng ký của người dùng để thu thập các sở thích rõ ràng, sau đó chuyển đổi liền mạch sang hệ thống Lọc cộng tác dựa trên mô hình (ví dụ: SVD) khi người dùng tích lũy dữ liệu tương tác.' },
      { key: 'C', en: 'Implement a pure User-User Collaborative Filtering model that uses Cosine similarity on an uncentered maxtrix.', vi: 'Triển khai mô hình Lọc cộng tác Người dùng-Người dùng thuần túy sử dụng độ tương đồng Cosine trên ma trận chưa được chuẩn tâm.' },
      { key: 'D', en: 'Use an unregularized Deep Neural Network that accepts only one-hot encoded user IDs.', vi: 'Sử dụng Mạng thần kinh sâu không được chuẩn hóa chỉ chấp nhận ID người dùng được mã hóa one-hot.' },
    ],
    answer: 'B',
  },
  // Case Study questions
  {
    id: 'q11',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'Project Eco-Routing deploys a food delivery feature on its platform. A user named Bob frequently orders high-calorie "Burgers" and "Pizzas" from vendors located within a 2-kilometer radius. If the platform utilizes a Content-based Filtering approach, which item is the system most likely to recommend to Bob next?',
      vi: 'Dự án Eco-Routing triển khai tính năng giao đồ ăn trên nền tảng của mình. Một người dùng tên Bob thường xuyên đặt mua "Burgers" và "Pizzas" có hàm lượng calo cao từ các nhà cung cấp trong bán kính 2 km. Nếu nền tảng sử dụng phương pháp Lọc dựa trên nội dung, hệ thống có khả năng đề xuất mặt hàng nào tiếp theo cho Bob?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'A healthy organic salad from a newly registered restaurant 10 kilometers away that has zero ratings.', vi: 'Một món salad hữu cơ lành mạnh từ một nhà hàng mới đăng ký cách đó 10 km chưa có đánh giá nào.' },
      { key: 'B', en: 'A popular "Fried Chicken" dish (Categorized as Fast Food) from a local vendor located 1.5 kilometers away.', vi: 'Một món "Gà rán" phổ biến (được phân loại là Thức ăn nhanh) từ một nhà cung cấp địa phương nằm cách đó 1.5 km.' },
      { key: 'C', en: 'The most expensive seafood platter on the platform that is currently trending among high-income users.', vi: 'Đĩa hải sản đắt nhất trên nền tảng hiện đang là xu hướng trong số những người dùng có thu nhập cao.' },
      { key: 'D', en: 'A random grocery item like dishwashing liquid to maximize the diversity of his feed.', vi: 'Một mặt hàng tạp hóa ngẫu nhiên như nước rửa chén để tối đa hóa tính đa dạng của luồng tin.' },
    ],
    answer: 'B',
  },
  {
    id: 'q12',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'The platform expands its services to a brand-new residential district. A newly registered restaurant has just uploaded its menu, but no users have ordered from it or rated its items yet. Which specific challenge of Recommender Systems is occurring here, and what is the best strategy to mitigate it using the available data?',
      vi: 'Nền tảng mở rộng dịch vụ sang một khu dân cư hoàn toàn mới. Một nhà hàng mới đăng ký vừa tải lên thực đơn của mình, nhưng chưa có người dùng nào đặt hàng hoặc xếp hạng các món ăn đó. Thử thách cụ thể nào của Hệ thống gợi ý đang xảy ra ở đây và chiến lược tốt nhất để giảm thiểu nó bằng cách sử dụng dữ liệu có sẵn là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Filter Bubble; mitigated by restricting users from seeing popular items.', vi: 'Bong bóng bộ lọc (Filter Bubble); giảm thiểu bằng cách hạn chế người dùng xem các mục phổ biến.' },
      { key: 'B', en: 'Data Sparsity; mitigated by applying Binary Cross-Entropy loss functions.', vi: 'Độ thưa thớt dữ liệu (Data Sparsity); giảm thiểu bằng cách áp dụng các hàm mất mát Binary Cross-Entropy.' },
      { key: 'C', en: 'New Item Cold Start Problem; mitigated by using Content-based Filtering to match the textual descriptions and categories of the new dishes with the historical preferences of users who like similar cuisines.', vi: 'Vấn đề Khởi đầu lạnh cho Mục mới; giảm thiểu bằng cách sử dụng Lọc dựa trên nội dung để khớp các mô tả văn bản và danh mục của các món ăn mới với sở thích lịch sử của những người dùng thích các món ăn tương tự.' },
      { key: 'D', en: 'Overfitting; mitigated by increasing the number of hidden layers in a Matrix Factorization model.', vi: 'Quá khớp (Overfitting); giảm thiểu bằng cách tăng số lượng lớp ẩn trong mô hình Phân rã ma trận.' },
    ],
    answer: 'C',
  },
  {
    id: 'q13',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'In User-based Collaborative Filtering, when predicting a rating for an active user on a target restaurant, the system calculates the similarity between users. Why is it a standard practice to subtract a user\'s average rating from their actual rating (creating a mean-centered rating) before calculating the weighted prediction score?',
      vi: 'Trong Lọc cộng tác dựa trên người dùng, khi dự đoán xếp hạng cho một người dùng hiện tại đối với một nhà hàng mục tiêu, hệ thống sẽ tính toán mức độ tương đồng giữa các người dùng. Tại sao việc trừ xếp hạng trung bình của người dùng khỏi xếp hạng thực tế của họ (tạo ra xếp hạng chuẩn tâm - mean-centered rating) trước khi tính điểm dự đoán có trọng số lại là một quy trình chuẩn?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'To ensure that the final predicted rating always scales perfectly between 0 and 1.', vi: 'Để đảm bảo xếp hạng dự đoán cuối cùng luôn mở rộng hoàn hảo trong khoảng từ 0 đến 1.' },
      { key: 'B', en: 'To compress the rating matrix and eliminate data sparsity challenges.', vi: 'Để nén ma trận xếp hạng và loại bỏ các thách thức về thưa thớt dữ liệu.' },
      { key: 'C', en: 'To adjust for individual rating biases, since some users are naturally lenient (giving 5 stars easily) while others are strict (giving 2 stars for average service).', vi: 'Để điều chỉnh sai lệch xếp hạng cá nhân, vì một số người dùng tự nhiên dễ tính (dễ dàng cho 5 sao) trong khi những người khác thì nghiêm khắc (cho 2 sao cho dịch vụ trung bình).' },
      { key: 'D', en: 'To force the system to prioritize Content-based attributes over historical rating profiles.', vi: 'Để buộc hệ thống ưu tiên các thuộc tính Dựa trên nội dung hơn hồ sơ xếp hạng lịch sử.' },
    ],
    answer: 'C',
  },
  {
    id: 'q14',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'During a sudden torrential downpour, the system must recommend optimized emergency shelter or rest points for the human couriers (shippers) to protect them from flooding. You have two recommendation engines available: Model X: High Precision (When it recommends a shelter, it is guaranteed to be safe and open, but it leaves out many nearby available shelters). Model Y: High Recall (It lists every single potentially available shelter in the area, but accidentally includes some locations that are already flooded or closed). Given that couriers are actively driving in dangerous conditions with depleting phone batteries and cannot afford to travel to a closed location, which metric should you prioritize?',
      vi: 'Trong một trận mưa lớn đột ngột, hệ thống phải đề xuất các điểm trú ẩn khẩn cấp hoặc điểm dừng chân được tối ưu hóa cho các shippers để bảo vệ họ khỏi lũ lụt. Bạn có sẵn hai công cụ gợi ý: Mô hình X: Độ chính xác cao (Khi đề xuất một điểm trú ẩn, nó đảm bảo an toàn và mở cửa, nhưng lại bỏ sót nhiều điểm trú ẩn có sẵn lân cận). Mô hình Y: Độ bao phủ cao (Nó liệt kê mọi điểm trú ẩn có khả năng hoạt động trong khu vực, nhưng vô tình bao gồm một số địa điểm đã bị ngập hoặc đóng cửa). Giả sử rằng shippers đang lái xe trong điều kiện nguy hiểm với pin điện thoại sắp cạn và không thể mạo hiểm đến một địa điểm đã đóng cửa, bạn nên ưu tiên chỉ số nào?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Prioritize Model Y (High Recall) because it is always better to maximize the total number of options regardless of errors.', vi: 'Ưu tiên Mô hình Y (Recall cao) vì việc tối đa hóa tổng số tùy chọn luôn tốt hơn bất kể sai sót.' },
      { key: 'B', en: 'Prioritize Model X (High Precision) because a False Positive (recommending a shelter that turns out to be closed) causes catastrophic real-world consequences for a courier stuck in a storm.', vi: 'Ưu tiên Mô hình X (Precision cao) vì kết quả Dương tính giả (gợi ý một điểm trú ẩn hóa ra đã đóng cửa) gây ra hậu quả thực tế thảm khốc cho shipper bị kẹt trong bão.' },
      { key: 'C', en: 'Prioritize an unpersonalized popularity model that lists the most reviewed restaurants in the city.', vi: 'Ưu tiên mô hình phổ biến không cá nhân hóa liệt kê các nhà hàng được đánh giá nhiều nhất trong thành phố.' },
      { key: 'D', en: 'Neither model is suitable; the system must randomly shuffle locations to maintain algorithmic fairness.', vi: 'Cả hai mô hình đều không phù hợp; hệ thống phải xáo trộn ngẫu nhiên các vị trí để duy trì tính công bằng của thuật toán.' },
    ],
    answer: 'B',
  },
  {
    id: 'q15',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'To scale up the system to handle tens of millions of customers and items, the memory-based Collaborative Filtering approach becomes computationally impossible at run-time. Propose a model-based recommendation architecture that maps both users and items into a shared, lower-dimensional latent factor space (e.g., of size K) to predict missing ratings via dot products, and specify the primary mathematical technique used.',
      vi: 'Để mở rộng hệ thống xử lý hàng chục triệu khách hàng và mặt hàng, cách tiếp cận Lọc cộng tác dựa trên bộ nhớ là không thể về mặt tính toán khi chạy thực tế. Đề xuất một kiến trúc gợi ý dựa trên mô hình giúp ánh xạ cả người dùng và mục vào một không gian nhân tử ẩn (latent factors) chung có chiều thấp hơn (ví dụ: kích thước K) để dự đoán xếp hạng còn thiếu thông qua tích vô hướng, và chỉ định kỹ thuật toán học chính được sử dụng.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Apriori algorithm utilizing a minimum confidence prune step.', vi: 'Thuật toán Apriori sử dụng bước tỉa độ tin cậy tối thiểu.' },
      { key: 'B', en: 'Matrix Factorization (e.g., Singular Value Decomposition - SVD) solved via Stochastic Gradient Descent (SGD).', vi: 'Phân rã ma trận (ví dụ: Phân tích trị riêng cực trị - SVD) được giải quyết thông qua hạ cực gradient ngẫu nhiên (SGD).' },
      { key: 'C', en: 'Content-based cosine similarity computed on a raw uncompressed TF-IDF vector matrix.', vi: 'Độ tương đồng Cosine dựa trên nội dung được tính toán trên ma trận vectơ TF-IDF thô chưa nén.' },
      { key: 'D', en: 'Linear Regression optimized through Ordinary Least Squares (OLS) closed-form equations.', vi: 'Hồi quy tuyến tính được tối ưu hóa thông qua các phương trình dạng đóng bình phương tối thiểu thông thường (OLS).' },
    ],
    answer: 'B',
  },
]
