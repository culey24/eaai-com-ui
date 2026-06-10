export const associationRulesMining = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'Which evaluation metric represents the proportion of the total transactions in the database that contain both itemset X and itemset Y simultaneously?',
      vi: 'Chỉ số đánh giá nào đại diện cho tỷ lệ tổng số giao dịch trong cơ sở dữ liệu chứa cả tập mục X và tập mục Y đồng thời?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Confidence', vi: 'Độ tin cậy (Confidence)' },
      { key: 'B', en: 'Support', vi: 'Độ hỗ trợ (Support)' },
      { key: 'C', en: 'Lift', vi: 'Lift' },
      { key: 'D', en: 'Conviction', vi: 'Conviction' },
    ],
    answer: 'B',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'According to the downward-closure property of support (the Apriori Principle), if an itemset is found to be infrequent (below minSup), what can be strictly concluded about all of its supersets?',
      vi: 'Theo tính chất đóng xuống của độ hỗ trợ (Nguyên lý Apriori), nếu một tập mục được phát hiện là không phổ biến (dưới minSup), ta có thể kết luận chắc chắn điều gì về tất cả các tập cha của nó?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'All of its supersets must be frequent.', vi: 'Tất cả các tập cha của nó phải phổ biến.' },
      { key: 'B', en: 'All of its supersets must also be infrequent and can be safely pruned.', vi: 'Tất cả các tập cha của nó cũng phải không phổ biến và có thể được tỉa bỏ một cách an toàn.' },
      { key: 'C', en: 'The confidence of its supersets will automatically equal 100%.', vi: 'Độ tin cậy của các tập cha của nó sẽ tự động bằng 100%.' },
      { key: 'D', en: 'Its supersets can only be mined using a non-transactional database scan.', vi: 'Các tập cha của nó chỉ có thể được khai thác bằng cách quét cơ sở dữ liệu phi giao dịch.' },
    ],
    answer: 'B',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Why does the Apriori algorithm perform a specific "Prune step" during candidate generation (Apriori-gen) by checking the frequency of all (k-1)-subsets of a candidate k-itemset?',
      vi: 'Tại sao thuật toán Apriori thực hiện một "Bước tỉa" cụ thể trong quá trình tạo ứng viên (Apriori-gen) bằng cách kiểm tra tần suất của tất cả các tập con (k-1) của một tập k-mục ứng viên?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'To verify that the candidate has a higher statistical variance than its subsets.', vi: 'Để xác minh rằng ứng viên có phương sai thống kê cao hơn các tập con của nó.' },
      { key: 'B', en: 'Because if any (k-1)-subset of a candidate k-itemset is infrequent, the candidate itself cannot possibly be frequent, allowing it to be dropped without checking the database.', vi: 'Bởi vì nếu bất kỳ tập con (k-1) nào của một tập k-mục ứng viên là không phổ biến, bản thân ứng viên đó không thể phổ biến, cho phép loại bỏ nó mà không cần kiểm tra cơ sở dữ liệu.' },
      { key: 'C', en: 'To compress the size of the database by deleting transactional noise.', vi: 'Để nén kích thước của cơ sở dữ liệu bằng cách xóa nhiễu giao dịch.' },
      { key: 'D', en: 'To allow the algorithm to generate rules with low confidence levels.', vi: 'Để cho phép thuật toán tạo ra các quy tắc có mức độ tin cậy thấp.' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'The Association Rules Mining problem is traditionally decomposed into two distinct sub-problems. What is the primary focus and computational bottleneck handled in the first sub-problem?',
      vi: 'Bài toán khai thác luật kết hợp truyền thống được chia thành hai bài toán con riêng biệt. Trọng tâm chính và nút thắt tính toán được xử lý trong bài toán con thứ nhất là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Calculating the exact Lift and Conviction values for all possible rules.', vi: 'Tính toán các giá trị chính xác của Lift và Conviction cho tất cả các quy tắc có thể.' },
      { key: 'B', en: 'Discovering all frequent itemsets whose support count satisfies the minSup threshold.', vi: 'Khám phá tất cả các tập mục phổ biến có độ hỗ trợ thỏa mãn ngưỡng minSup.' },
      { key: 'C', en: 'Generating rule implications from every arbitrary item permutation.', vi: 'Tạo ra các luật kéo theo từ mọi hoán vị mục tùy ý.' },
      { key: 'D', en: 'Reducing the number of database items using dimensionality reduction.', vi: 'Giảm số lượng các mục trong cơ sở dữ liệu bằng cách giảm chiều dữ liệu.' },
    ],
    answer: 'C',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'Given a database of 500 grocery transactions. If "Milk" appears in 300 transactions, "Bread" appears in 200 transactions, and both "Milk" and "Bread" appear together in 150 transactions, calculate the exact Confidence of the association rule: {Milk} -> {Bread}.',
      vi: 'Cho cơ sở dữ liệu gồm 500 giao dịch tạp hóa. Nếu "Sữa" xuất hiện trong 300 giao dịch, "Bánh mì" xuất hiện trong 200 giao dịch và cả "Sữa" và "Bánh mì" xuất hiện cùng nhau trong 150 giao dịch, hãy tính chính xác Độ tin cậy (Confidence) của luật kết hợp: {Sữa} -> {Bánh mì}.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: '30%', vi: '30%' },
      { key: 'B', en: '50%', vi: '50%' },
      { key: 'C', en: '75%', vi: '75%' },
      { key: 'D', en: '40%', vi: '40%' },
    ],
    answer: 'B',
  },
  {
    id: 'q6',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'Utilizing the same database details from Question 5 (500 total transactions, 150 co-occurrences of Milk and Bread), what is the exact Support value for the itemset {Milk, Bread}?',
      vi: 'Sử dụng cùng chi tiết cơ sở dữ liệu từ Câu hỏi 5 (tổng cộng 500 giao dịch, 150 lần xuất hiện đồng thời của Sữa và Bánh mì), giá trị Độ hỗ trợ (Support) chính xác cho tập mục {Sữa, Bánh mì} là bao nhiêu?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: '30%', vi: '30%' },
      { key: 'B', en: '40%', vi: '40%' },
      { key: 'C', en: '50%', vi: '50%' },
      { key: 'D', en: '75%', vi: '75%' },
    ],
    answer: 'B',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'What is the fundamental structural reason why the FP-Growth algorithm typically runs significantly faster than the Apriori algorithm on large-scale, highly dense transactional datasets?',
      vi: 'Lý do cấu trúc cơ bản nào khiến thuật toán FP-Growth thường chạy nhanh hơn đáng kể so với thuật toán Apriori trên các tập dữ liệu giao dịch lớn và mật độ cao?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'FP-Growth uses a simpler mathematical formula for calculating rule Lift.', vi: 'FP-Growth sử dụng công thức toán học đơn giản hơn để tính toán Lift của quy tắc.' },
      { key: 'B', en: 'FP-Growth processes only categorical data and drops numerical attributes.', vi: 'FP-Growth chỉ xử lý dữ liệu phân loại và loại bỏ các thuộc tính số.' },
      { key: 'C', en: 'FP-Growth compresses the transactional database into a frequent-pattern tree structure, eliminating candidate generation and requiring only two database scans.', vi: 'FP-Growth nén cơ sở dữ liệu giao dịch thành cấu trúc cây mẫu phổ biến (FP-tree), loại bỏ việc tạo ứng viên và chỉ yêu cầu hai lần quét cơ sở dữ liệu.' },
      { key: 'D', en: 'FP-Growth increases the minimum support threshold automatically during runtime.', vi: 'FP-Growth tự động tăng ngưỡng hỗ trợ tối thiểu trong quá trình chạy.' },
    ],
    answer: 'C',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'Consider a frequent itemset X and its subset Y. Compare the Support value of X and the Support value of Y. Which statement is mathematically always true?',
      vi: 'Xét một tập mục phổ biến X và tập con Y của nó. So sánh giá trị Độ hỗ trợ của X và giá trị Độ hỗ trợ của Y. Phát biểu nào sau đây luôn đúng về mặt toán học?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Support(X) >= Support(Y)', vi: 'Support(X) >= Support(Y)' },
      { key: 'B', en: 'Support(X) <= Support(Y)', vi: 'Support(X) <= Support(Y)' },
      { key: 'C', en: 'Support(X) = Support(Y)', vi: 'Support(X) = Support(Y)' },
      { key: 'D', en: 'Their support relationship depends entirely on the rule confidence.', vi: 'Mối quan hệ hỗ trợ của chúng phụ thuộc hoàn toàn vào độ tin cậy của quy tắc.' },
    ],
    answer: 'B',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'A data analyst discovers an association rule that possesses an exceptionally high Confidence level of 95% but a Lift value of 0.82. How should the team critically evaluate the operational value of this rule?',
      vi: 'Một nhà phân tích dữ liệu phát hiện ra một luật kết hợp có Độ tin cậy đặc biệt cao là 95% nhưng giá trị Lift lại là 0.82. Nhóm nên đánh giá nghiêm túc giá trị vận hành của luật này như thế nào?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It is a highly reliable rule that must be deployed immediately because confidence is near perfect.', vi: 'Đây là một quy tắc rất đáng tin cậy phải được triển khai ngay lập tức vì độ tin cậy gần như hoàn hảo.' },
      { key: 'B', en: 'The data is mathematically corrupted because Lift can never drop below 1.0 when confidence is high.', vi: 'Dữ liệu bị lỗi toán học vì Lift không bao giờ có thể giảm xuống dưới 1.0 khi độ tin cậy cao.' },
      { key: 'C', en: 'The rule has little to no practical value because a Lift less than 1.0 indicates a negative correlation, meaning the presence of the antecedent actually reduces the likelihood of the consequent occurring.', vi: 'Quy tắc này có rất ít hoặc không có giá trị thực tế vì Lift nhỏ hơn 1.0 cho biết mối tương quan âm, nghĩa là sự xuất hiện của tiền đề thực sự làm giảm khả năng xảy ra của hệ quả.' },
      { key: 'D', en: 'The team should decrease the minimum support threshold to make the Lift increase.', vi: 'Nhóm nên giảm ngưỡng hỗ trợ tối thiểu để làm tăng giá trị Lift.' },
    ],
    answer: 'C',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Suppose you are adapting the traditional association rules mining workflow for a medical safety system where discovering "Closed Itemsets" (itemsets where no immediate superset has the same support count) is required to reduce rule redundancy. How would you modify the candidate evaluation procedure?',
      vi: 'Giả sử bạn đang điều chỉnh quy trình khai thác luật kết hợp truyền thống cho một hệ thống an toàn y tế, trong đó yêu cầu khám phá "Tập mục đóng" (tập mục mà không có tập cha trực tiếp nào có cùng số lượng hỗ trợ) để giảm thiểu sự dư thừa luật. Bạn sẽ sửa đổi quy trình đánh giá ứng viên như thế nào?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'By dropping any candidate itemset that has a support count equal to any of its subsets.', vi: 'Bằng cách loại bỏ bất kỳ tập mục ứng viên nào có số lượng hỗ trợ bằng với bất kỳ tập con nào của nó.' },
      { key: 'B', en: 'By adding a checking constraint to ensure that an itemset is only retained if all of its supersets possess a strictly smaller support count.', vi: 'Bằng cách thêm một ràng buộc kiểm tra để đảm bảo rằng một tập mục chỉ được giữ lại nếu tất cả các tập cha của nó sở hữu số lượng hỗ trợ nhỏ hơn nghiêm ngặt.' },
      { key: 'C', en: 'By forcing the algorithm to skip the database scan step completely.', vi: 'Bằng cách buộc thuật toán bỏ qua hoàn toàn bước quét cơ sở dữ liệu.' },
      { key: 'D', en: 'By only generating rules that contain exactly a single item in the consequent.', vi: 'Bằng cách chỉ tạo ra các luật chứa duy nhất một mục trong hệ quả.' },
    ],
    answer: 'B',
  },
  // Case Study questions
  {
    id: 'q11',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'An engineer runs the Apriori algorithm on the "Interaction Matrix & Order Logs" database to find items frequently co-purchased by citizens in a single order. Suppose the minimum support threshold is set to 2% and minimum confidence is set to 60%. The system discovers the following rule: {Fast Food} -> {Soft Drink} [Support = 3%, Confidence = 75%]. Which of the following statements is the most accurate interpretation of this result?',
      vi: 'Một kỹ sư chạy thuật toán Apriori trên cơ sở dữ liệu "Interaction Matrix & Order Logs" để tìm các mặt hàng thường được người dân cùng mua trong một đơn hàng. Giả sử ngưỡng hỗ trợ tối thiểu được đặt là 2% và độ tin cậy tối thiểu được đặt là 60%. Hệ thống phát hiện ra luật sau: {Fast Food} -> {Soft Drink} [Support = 3%, Confidence = 75%]. Phát biểu nào sau đây là cách diễn giải chính xác nhất về kết quả này?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Soft drinks are present in 75% of all delivery orders processed by the system.', vi: 'Nước ngọt có mặt trong 75% tổng số đơn hàng giao được hệ thống xử lý.' },
      { key: 'B', en: 'Fast food and soft drinks are purchased together in exactly 3% of all processed orders, and out of those who ordered fast food, 75% also ordered a soft drink.', vi: 'Thức ăn nhanh và nước ngọt được mua cùng nhau trong chính xác 3% tổng số đơn hàng đã xử lý, và trong số những người đã gọi thức ăn nhanh, 75% cũng gọi thêm nước ngọt.' },
      { key: 'C', en: 'The system should automatically increase the support threshold because 3% is too low to be statistically valid for any logistical decision.', vi: 'Hệ thống nên tự động tăng ngưỡng hỗ trợ vì 3% là quá thấp để có giá trị thống kê cho bất kỳ quyết định logistics nào.' },
      { key: 'D', en: 'A courier has a 75% probability of being assigned a delivery route that contains both fast food and soft drinks.', vi: 'Một nhân viên giao hàng có 75% xác suất được phân công tuyến đường giao hàng chứa cả thức ăn nhanh và nước ngọt.' },
    ],
    answer: 'B',
  },
  {
    id: 'q12',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'During peak rainy hours, traffic density surges and delivery delays occur frequently. The data team wants to mine association rules where the consequent (Y) is strictly fixed as the item {Delivery Delay} to find environmental factors leading to this state. If they significantly decrease the minimum support threshold (minSup) to capture rare extreme weather events, how will this modification affect the computational complexity of the Apriori algorithm?',
      vi: 'Vào những giờ mưa cao điểm, mật độ giao thông tăng vọt và sự chậm trễ giao hàng thường xuyên xảy ra. Nhóm dữ liệu muốn khai thác các luật kết hợp trong đó hệ quả (Y) được cố định nghiêm ngặt là mặt hàng {Delivery Delay} để tìm các yếu tố môi trường dẫn đến tình trạng này. Nếu họ giảm đáng kể ngưỡng hỗ trợ tối thiểu (minSup) để nắm bắt các sự kiện thời tiết khắc nghiệt hiếm gặp, sửa đổi này sẽ ảnh hưởng như thế nào đến độ phức tạp tính toán của thuật toán Apriori?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Computational complexity will decrease because the algorithm will skip the database scan step.', vi: 'Độ phức tạp tính toán sẽ giảm vì thuật toán sẽ bỏ qua bước quét cơ sở dữ liệu.' },
      { key: 'B', en: 'Computational complexity will remain unchanged since thresholds only filter the final rules, not the candidate generation phase.', vi: 'Độ phức tạp tính toán sẽ không đổi vì các ngưỡng chỉ lọc các quy tắc cuối cùng, không lọc giai đoạn tạo ứng viên.' },
      { key: 'C', en: 'Computational complexity will increase drastically because more itemsets will satisfy the lower threshold, leading to an explosion of candidate generation (Apriori-gen) and repetitive database scans.', vi: 'Độ phức tạp tính toán sẽ tăng vọt vì nhiều tập mục hơn sẽ thỏa mãn ngưỡng thấp hơn, dẫn đến sự bùng nổ của việc tạo ứng viên (Apriori-gen) và quét cơ sở dữ liệu lặp đi lặp lại.' },
      { key: 'D', en: 'The algorithm will immediately converge in the first iteration because rare events do not produce subsets.', vi: 'Thuật toán sẽ lập tức hội tụ trong lần lặp đầu tiên vì các sự kiện hiếm không tạo ra tập con.' },
    ],
    answer: 'C',
  },
  {
    id: 'q13',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'The operational team compares two association rules generated from the order history logs: Rule 1: {Fried Chicken} -> {French Fries} [Support = 10%, Confidence = 70%, Lift = 1.2], Rule 2: {Burger} -> {Napkins} [Support = 5%, Confidence = 85%, Lift = 0.95]. How should the team evaluate these two rules for a cross-selling campaign on the app?',
      vi: 'Nhóm vận hành so sánh hai luật kết hợp được tạo ra từ nhật ký lịch sử đơn hàng: Luật 1: {Fried Chicken} -> {French Fries} [Support = 10%, Confidence = 70%, Lift = 1.2], Luật 2: {Burger} -> {Napkins} [Support = 5%, Confidence = 85%, Lift = 0.95]. Nhóm nên đánh giá hai luật này như thế nào cho chiến dịch bán chéo (cross-selling) trên ứng dụng?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Rule 2 should be prioritized over Rule 1 because it has a higher confidence level (85% > 70%).', vi: 'Luật 2 nên được ưu tiên hơn Luật 1 vì nó có mức độ tin cậy cao hơn (85% > 70%).' },
      { key: 'B', en: 'Rule 2 is highly effective because a Lift close to 1 indicates a powerful, direct causal relationship between Burgers and Napkins.', vi: 'Luật 2 rất hiệu quả vì Lift gần bằng 1 cho biết mối quan hệ nhân quả trực tiếp, mạnh mẽ giữa Burgers và Napkins.' },
      { key: 'C', en: 'Rule 1 should be prioritized because Lift > 1 indicates a positive correlation, meaning ordering Fried Chicken actually increases the likelihood of ordering French Fries; whereas Rule 2 has a Lift < 1, implying Burgers and Napkins are negatively correlated or independent despite high confidence.', vi: 'Luật 1 nên được ưu tiên vì Lift > 1 cho biết mối tương quan dương, nghĩa là gọi Gà rán thực sự làm tăng khả năng gọi Khoai tây chiên; trong khi Luật 2 có Lift < 1, ngụ ý rằng Burgers và Napkins có tương quan âm hoặc độc lập mặc dù độ tin cậy cao.' },
      { key: 'D', en: 'Both rules are invalid because Support must always be strictly greater than Confidence in market basket analysis.', vi: 'Cả hai luật đều không hợp lệ vì Support luôn phải lớn hơn nghiêm ngặt so với Confidence trong phân tích giỏ hàng.' },
    ],
    answer: 'C',
  },
  {
    id: 'q14',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'To optimize space in a regional satellite depot, engineers want to discover "Closed Itemsets" from the parcel transaction logs (itemsets where no immediate superset has the exact same support count). How should they mathematically evaluate a candidate itemset C to confirm it qualifies as a Closed Itemset?',
      vi: 'Để tối ưu hóa không gian tại một kho vệ tinh khu vực, các kỹ sư muốn khám phá "Tập mục đóng" từ nhật ký giao dịch bưu phẩm (các tập mục mà không có tập cha trực tiếp nào có cùng số lượng hỗ trợ). Làm thế nào họ đánh giá mặt toán học một tập mục ứng viên C để xác nhận nó đủ điều kiện là Tập mục đóng?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'By checking if the confidence of all rules generated from C is exactly 100%.', vi: 'Bằng cách kiểm tra xem độ tin cậy của tất cả các quy tắc được tạo ra từ C có chính xác là 100% hay không.' },
      { key: 'B', en: 'By verifying that for every superset S (where S contains C), the support count of S is strictly less than the support count of C.', vi: 'Bằng cách xác minh rằng đối với mọi tập cha S (trong đó S chứa C), số lượng hỗ trợ của S nhỏ hơn nghiêm ngặt so với số lượng hỗ trợ của C.' },
      { key: 'C', en: 'By ensuring that the size of itemset C does not exceed 2 items.', vi: 'Bằng cách đảm bảo rằng kích thước của tập mục C không vượt quá 2 mục.' },
      { key: 'D', en: 'By confirming that the Lift of itemset C is less than 1.0.', vi: 'Bằng cách xác nhận rằng Lift của tập mục C nhỏ hơn 1.0.' },
    ],
    answer: 'B',
  },
  {
    id: 'q15',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'The traditional Apriori algorithm suffers from extreme performance bottlenecks when mining large-scale logistics data due to generating millions of candidate itemsets. You are tasked with designing a modified framework that eliminates candidate generation entirely and only scans the database twice by compressing the transactional transaction logs into a frequent-pattern tree structure. Which algorithmic paradigm should you choose to build this framework?',
      vi: 'Thuật toán Apriori truyền thống gặp phải các nút thắt hiệu năng nghiêm trọng khi khai thác dữ liệu logistics quy mô lớn do tạo ra hàng triệu tập mục ứng viên. Bạn được giao nhiệm vụ thiết kế một khung sửa đổi giúp loại bỏ hoàn toàn việc tạo ứng viên và chỉ quét cơ sở dữ liệu hai lần bằng cách nén nhật ký giao dịch thành cấu trúc cây mẫu phổ biến. Bạn nên chọn mô hình thuật toán nào để xây dựng khung này?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'User-User Collaborative Filtering with Pearson Correlation.', vi: 'Lọc cộng tác Người dùng-Người dùng với Tương quan Pearson.' },
      { key: 'B', en: 'Ordinary Least Squares (OLS) Polynomial Regression transformation.', vi: 'Biến đổi Hồi quy Đa thức Bình phương Tối thiểu (OLS).' },
      { key: 'C', en: 'FP-Growth (Frequent Pattern Growth) algorithm utilizing a prefix-tree structure.', vi: 'Thuật toán FP-Growth (Frequent Pattern Growth) sử dụng cấu trúc cây tiền tố.' },
      { key: 'D', en: 'Latent Dirichlet Allocation (LDA) with Gibbs Sampling.', vi: 'Mô hình phân bổ Dirichlet tiềm ẩn (LDA) với lấy mẫu Gibbs.' },
    ],
    answer: 'C',
  },
]
