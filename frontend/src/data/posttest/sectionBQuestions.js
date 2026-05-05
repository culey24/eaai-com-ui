/**
 * PostTest Section 2 (Case Study) Questions
 * 5 questions x 5 topics về Project CoralGuard
 */

export const SECTION_B_CASE_STUDY_QUESTIONS = {
  'association-rules': [
    {
      qNo: 1,
      text: {
        en: 'In the Maintenance Logs database of CoralGuard, each "Transaction" records the components pumped into the coral reef by the robot. If an engineer wants to find groups of microbes frequently used together, what does an Itemset represent in this problem?',
        vi: 'Trong cơ sở dữ liệu Maintenance Logs của CoralGuard, mỗi "Transaction" ghi lại các thành phần được bơm vào rạn san hô bởi robot. Nếu kỹ sư muốn tìm các nhóm vi khuẩn thường được sử dụng cùng nhau, Itemset đại diện cho cái gì trong vấn đề này?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'A list of coordinate locations of the coral reefs',
            vi: 'A. Danh sách tọa độ các rạn san hô',
          },
        },
        {
          value: 'b',
          label: {
            en: 'A collection of specific microbes and nutrients included in a single maintenance mission',
            vi: 'B. Tập hợp các vi khuẩn và chất dinh dưỡng cụ thể trong một lần bảo trì',
          },
        },
        {
          value: 'c',
          label: {
            en: 'The total time the autonomous underwater vehicle (AUV) spent on missions',
            vi: 'C. Tổng thời gian xe tự động dưới nước (AUV) dành cho các nhiệm vụ',
          },
        },
        {
          value: 'd',
          label: {
            en: 'The number of coral images collected from the Vision Stream',
            vi: 'D. Số lượng hình ảnh san hô thu thập từ Vision Stream',
          },
        },
      ],
      correctAnswer: 'b',
    },
    {
      qNo: 2,
      text: {
        en: 'The research team found an association rule: {Microbe A} => {Mineral B} with a confidence Conf = 80%. Based on the confidence formula, which of the following conclusions is correct?',
        vi: 'Nhóm nghiên cứu tìm thấy một quy tắc: {Vi khuẩn A} => {Khoáng B} với độ tin cậy Conf = 80%. Dựa trên công thức tin cậy, kết luận nào sau đây là đúng?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'Mineral B appears in 80% of the total maintenance missions of the entire project',
            vi: 'A. Khoáng B xuất hiện trong 80% tổng số nhiệm vụ bảo trì',
          },
        },
        {
          value: 'b',
          label: {
            en: 'In 80% of the times the robot pumped Microbe A, Mineral B was also pumped at the same time',
            vi: 'B. Trong 80% các lần robot bơm Vi khuẩn A, Khoáng B cũng được bơm cùng lúc',
          },
        },
        {
          value: 'c',
          label: {
            en: 'Microbe A and Mineral B only appear together in exactly 80 transactions',
            vi: 'C. Vi khuẩn A và Khoáng B chỉ xuất hiện cùng nhau trong đúng 80 giao dịch',
          },
        },
        {
          value: 'd',
          label: {
            en: 'The Support of the itemset {Microbe A, Mineral B} is definitely 80%',
            vi: 'D. Support của itemset {Vi khuẩn A, Khoáng B} chắc chắn là 80%',
          },
        },
      ],
      correctAnswer: 'b',
    },
    {
      qNo: 3,
      text: {
        en: 'While running the Apriori algorithm, the system determines that the itemset {Nutrient X, Microbe Y} does not meet the minSup (minimum support) threshold. According to the Apriori property, how should the robot handle the candidate itemset {Nutrient X, Microbe Y, Mineral Z}?',
        vi: 'Trong khi chạy thuật toán Apriori, hệ thống xác định rằng itemset {Dinh dưỡng X, Vi khuẩn Y} không đạt ngưỡng minSup. Theo tính chất Apriori, robot nên xử lý candidate itemset {Dinh dưỡng X, Vi khuẩn Y, Khoáng Z} như thế nào?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'Continue scanning the database to calculate the support count for this three-item set',
            vi: 'A. Tiếp tục quét cơ sở dữ liệu để tính support count',
          },
        },
        {
          value: 'b',
          label: {
            en: 'Automatically consider it a frequent itemset because of the addition of Mineral Z',
            vi: 'B. Tự động coi nó là itemset thường xuyên vì thêm Khoáng Z',
          },
        },
        {
          value: 'c',
          label: {
            en: 'Prune it immediately because any superset of an infrequent itemset must also be infrequent',
            vi: 'C. Cắt nó ngay vì bất kỳ superset nào của itemset không thường xuyên cũng phải không thường xuyên',
          },
        },
        {
          value: 'd',
          label: {
            en: 'Increase the minSup threshold to keep this itemset for future analysis',
            vi: 'D. Tăng ngưỡng minSup để giữ itemset này để phân tích sau',
          },
        },
      ],
      correctAnswer: 'c',
    },
    {
      qNo: 4,
      text: {
        en: 'The CoralGuard system proposes two different rules to restore diseased corals: 1. {Nutrient Alpha} => {Recovery}: Sup = 2%, Conf = 90% 2. {Nutrient Beta} => {Recovery}: Sup = 15%, Conf = 40%. If the research station needs a solution that ensures the highest reliability for rare coral species, even if the frequency of application is low, which rule should be prioritized?',
        vi: 'Hệ thống CoralGuard đề xuất hai quy tắc khác nhau để phục hồi san hô bệnh: 1. {Dinh dưỡng Alpha} => {Phục hồi}: Sup = 2%, Conf = 90% 2. {Dinh dưỡng Beta} => {Phục hồi}: Sup = 15%, Conf = 40%. Nếu trạm nghiên cứu cần một giải pháp đảm bảo độ tin cậy cao nhất cho các loài san hô hiếm, ngay cả khi tần suất ứng dụng thấp, quy tắc nào nên được ưu tiên?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'Rule 2, because it has higher support, proving it is effective for a wider range of cases',
            vi: 'A. Quy tắc 2, vì nó có support cao hơn',
          },
        },
        {
          value: 'b',
          label: {
            en: 'Both rules because they share the same consequent ("Recovery")',
            vi: 'B. Cả hai quy tắc vì chúng có cùng kết quả',
          },
        },
        {
          value: 'c',
          label: {
            en: 'Rule 1, because the high confidence indicates a nearly certain recovery when Alpha is used',
            vi: 'C. Quy tắc 1, vì độ tin cậy cao cho thấy phục hồi gần như chắc chắn',
          },
        },
        {
          value: 'd',
          label: {
            en: 'Neither rule, because the support values are too low for a large-scale intervention',
            vi: 'D. Không quy tắc nào, vì giá trị support quá thấp',
          },
        },
      ],
      correctAnswer: 'c',
    },
    {
      qNo: 5,
      text: {
        en: 'To detect environmental risks early, a scientist wants to find rules that lead to the condition {Coral Bleaching}. How would you set up the association rules mining task based on the learned sub-problems?',
        vi: 'Để phát hiện rủi ro môi trường sớm, nhà khoa học muốn tìm các quy tắc dẫn đến {Tẩy trắng san hô}. Bạn sẽ thiết lập nhiệm vụ khai phá quy tắc như thế nào?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'Only scan transactions that do not contain any nutrients or microbes',
            vi: 'A. Chỉ quét các giao dịch không chứa dinh dưỡng hoặc vi khuẩn',
          },
        },
        {
          value: 'b',
          label: {
            en: 'Fix the consequent (Y) of the rule as the itemset {Coral Bleaching} and find antecedents (X) with high confidence leading to this state',
            vi: 'B. Cố định kết quả (Y) của quy tắc là {Tẩy trắng san hô} và tìm các tiền điều kiện (X) với tin cậy cao',
          },
        },
        {
          value: 'c',
          label: {
            en: 'Search only for rules with the lowest possible support because disasters are rare events',
            vi: 'C. Chỉ tìm quy tắc có support thấp nhất',
          },
        },
        {
          value: 'd',
          label: {
            en: 'Use an exhaustive search to find every possible rule combination without applying any threshold conditions',
            vi: 'D. Sử dụng tìm kiếm toàn diện để tìm tất cả quy tắc',
          },
        },
      ],
      correctAnswer: 'b',
    },
  ],

  'recommender-system': [
    {
      qNo: 1,
      text: {
        en: 'The CoralGuard system needs to suggest specific intervention sites to its fleet of AUVs (Autonomous Underwater Vehicles). If we treat this as a recommendation problem, what would be the most logical way to define the User-Item relationship?',
        vi: 'Hệ thống CoralGuard cần gợi ý các địa điểm can thiệp cụ thể cho đội AUV. Cách logic nhất để định nghĩa mối quan hệ User-Item là gì?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'The Users are the fish species, and the Items are the coral nutrients',
            vi: 'A. Users là loài cá, Items là chất dinh dưỡng san hô',
          },
        },
        {
          value: 'b',
          label: {
            en: 'The Users are the specific undersea stations (locations), and the Items are the possible intervention techniques',
            vi: 'B. Users là các trạm dưới nước, Items là các kỹ thuật can thiệp',
          },
        },
        {
          value: 'c',
          label: {
            en: 'The Users are the human biologists, and the Items are the high-resolution videos from the Vision Stream',
            vi: 'C. Users là các nhà sinh học, Items là video từ Vision Stream',
          },
        },
        {
          value: 'd',
          label: {
            en: 'The Users are the AUV batteries, and the Items are the charging docks',
            vi: 'D. Users là pin AUV, Items là các trạm sạc',
          },
        },
      ],
      correctAnswer: 'b',
    },
    {
      qNo: 2,
      text: {
        en: 'A scientist wants to implement a Content-based Filtering approach to suggest new rescue locations for a robot. Which of the following data points would be the primary focus for this method?',
        vi: 'Một nhà khoa học muốn triển khai Content-based Filtering để gợi ý vị trí cứu trợ mới. Điểm dữ liệu nào sẽ là tiêu điểm chính?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'The specific features of the reef, such as depth, coral species type, and local water temperature',
            vi: 'A. Các đặc điểm cụ thể của rạn, như độ sâu, loại san hô, nhiệt độ nước',
          },
        },
        {
          value: 'b',
          label: {
            en: 'The historical ratings given by other robots that have visited similar reefs in the past',
            vi: 'B. Đánh giá lịch sử từ các robot khác',
          },
        },
        {
          value: 'c',
          label: {
            en: 'The total number of maintenance logs generated by the entire project over the last year',
            vi: 'C. Tổng số nhật ký bảo trì được tạo bởi dự án',
          },
        },
        {
          value: 'd',
          label: {
            en: 'A random selection of reefs to ensure the robot explores new areas of the ocean',
            vi: 'D. Chọn ngẫu nhiên các rạn san hô',
          },
        },
      ],
      correctAnswer: 'a',
    },
    {
      qNo: 3,
      text: {
        en: 'A User-based Collaborative Filtering algorithm is used to suggest restoration strategies for a reef cluster named Reef-Alpha. The system identifies that Reef-Beta and Reef-Gamma have very similar environmental profiles and past successful outcomes to Reef-Alpha. How will the system generate a recommendation?',
        vi: 'Thuật toán User-based Collaborative Filtering được sử dụng để gợi ý chiến lược phục hồi cho Reef-Alpha. Hệ thống xác định rằng Reef-Beta và Reef-Gamma có hồ sơ môi trường tương tự. Hệ thống sẽ tạo gợi ý như thế nào?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'By analyzing the genetic code of the coral in Reef-Alpha only',
            vi: 'A. Bằng cách phân tích mã di truyền của san hô trong Reef-Alpha',
          },
        },
        {
          value: 'b',
          label: {
            en: 'By suggesting a strategy that has never been used before to test its effectiveness',
            vi: 'B. Bằng cách gợi ý một chiến lược chưa bao giờ được sử dụng',
          },
        },
        {
          value: 'c',
          label: {
            en: 'By recommending strategies that were successful in Reef-Beta and Reef-Gamma but have not yet been tried in Reef-Alpha',
            vi: 'C. Bằng cách gợi ý các chiến lược thành công trong Reef-Beta và Reef-Gamma nhưng chưa thử trong Reef-Alpha',
          },
        },
        {
          value: 'd',
          label: {
            en: 'By calculating the linear regression of the temperature changes in all three reefs',
            vi: 'D. Bằng cách tính hồi quy tuyến tính của thay đổi nhiệt độ',
          },
        },
      ],
      correctAnswer: 'c',
    },
    {
      qNo: 4,
      text: {
        en: 'Project CoralGuard recently added a brand-new sensor station in a remote, unexplored area of the ocean. The system is struggling to provide recommendations for this station because there is no historical intervention data yet. This is an example of which common Recommender System challenge?',
        vi: 'Dự án CoralGuard vừa thêm một trạm cảm biến hoàn toàn mới trong khu vực sâu chưa khám phá. Hệ thống gặp khó khăn trong việc đưa ra gợi ý vì không có dữ liệu lịch sử. Đây là ví dụ của thách thức nào?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'Overfitting',
            vi: 'A. Overfitting',
          },
        },
        {
          value: 'b',
          label: {
            en: 'Data Sparsity',
            vi: 'B. Data Sparsity',
          },
        },
        {
          value: 'c',
          label: {
            en: 'Cold Start Problem',
            vi: 'C. Cold Start Problem',
          },
        },
        {
          value: 'd',
          label: {
            en: 'Filter Bubble',
            vi: 'D. Filter Bubble',
          },
        },
      ],
      correctAnswer: 'c',
    },
    {
      qNo: 5,
      text: {
        en: 'You are designing a system to recommend "Emergency Rescue" sites for robots when a sudden heatwave occurs. You have two models: Model A: High Precision (recommends only definite emergencies) and Model B: High Recall (finds every emergency but includes some false positives). If the robot\'s battery life is extremely limited and it can only visit 2 sites per day, which model should you prioritize?',
        vi: 'Bạn thiết kế hệ thống gợi ý các địa điểm "Cứu trợ Khẩn cấp" khi xảy ra sóng nhiệt. Nếu pin robot rất hạn chế, model nào nên được ưu tiên?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'Model A, because it ensures the robot does not waste its limited battery on healthy sites',
            vi: 'A. Model A, vì nó đảm bảo robot không lãng phí pin',
          },
        },
        {
          value: 'b',
          label: {
            en: 'Model B, because it is better to visit every site even if some are not in danger',
            vi: 'B. Model B, vì tốt hơn là ghé thăm tất cả các trang web',
          },
        },
        {
          value: 'c',
          label: {
            en: 'Neither, because recommendation systems are not suitable for emergency situations',
            vi: 'C. Không model nào, vì hệ thống gợi ý không phù hợp',
          },
        },
        {
          value: 'd',
          label: {
            en: 'A random selection model to ensure the battery is used evenly across the ocean',
            vi: 'D. Mô hình chọn ngẫu nhiên',
          },
        },
      ],
      correctAnswer: 'a',
    },
  ],

  'fuzzy-logic': [
    {
      qNo: 1,
      text: {
        en: 'A marine biologist states that "Seawater Temperature is Warm" when the temperature is 28.5°C. If the fuzzy set "Warm" has a triangular membership function peaking at 29°C (μ=1), starting at 27°C (μ=0), and ending at 30°C (μ=0), what is the degree of membership for 28.5°C?',
        vi: 'Một nhà sinh học biển nói "Nhiệt độ nước biển là Ấm" khi nhiệt độ 28.5°C. Nếu tập mờ "Ấm" có hàm thành viên tam giác đỉnh tại 29°C (μ=1), bắt đầu tại 27°C (μ=0), kết thúc tại 30°C (μ=0), mức độ thành viên cho 28.5°C là bao nhiêu?',
      },
      options: [
        {
          value: 'a',
          label: { en: '0.5', vi: 'A. 0.5' },
        },
        {
          value: 'b',
          label: { en: '0.75', vi: 'B. 0.75' },
        },
        {
          value: 'c',
          label: { en: '0.6', vi: 'C. 0.6' },
        },
        {
          value: 'd',
          label: { en: '0.9', vi: 'D. 0.9' },
        },
      ],
      correctAnswer: 'b',
    },
    {
      qNo: 2,
      text: {
        en: 'A Fuzzy Inference System (FIS) is designed to determine Intervention_Urgency based on pH_Level and Dissolved_Oxygen. If the rule base uses the Mamdani method, why is it necessary to convert the final aggregated fuzzy output (e.g., "High Urgency") into a single crisp value before the AUV can act?',
        vi: 'Một Hệ thống Suy luận Mờ (FIS) được thiết kế để xác định Intervention_Urgency. Tại sao cần chuyển đổi đầu ra mờ cuối cùng thành một giá trị rõ ràng trước khi AUV có thể hoạt động?',
      },
      options: [
        {
          value: 'a',
          label: { en: 'To minimize the cost function', vi: 'A. Để giảm thiểu hàm chi phí' },
        },
        {
          value: 'b',
          label: { en: 'To prevent the rule base from expanding', vi: 'B. Để ngăn rule base mở rộng' },
        },
        {
          value: 'c',
          label: {
            en: 'Because the AUV requires a definite, crisp control signal (e.g., a specific motor speed or dosage amount)',
            vi: 'C. Vì AUV cần một tín hiệu điều khiển rõ ràng (tốc độ motor hoặc liều lượng cụ thể)',
          },
        },
        {
          value: 'd',
          label: { en: 'To calculate the R-squared value of the model', vi: 'D. Để tính giá trị R-squared' },
        },
      ],
      correctAnswer: 'c',
    },
    {
      qNo: 3,
      text: {
        en: 'The Field Reports contain qualitative terms like "Coral Health is Excellent" and "Light Intensity is Very Low." How does the Fuzzifier component of the CoralGuard system handle the precise sensor reading of 450 lux to activate the linguistic term "Very Low"?',
        vi: 'Báo cáo trường chứa các thuật ngữ định tính như "Sức khỏe san hô là Xuất sắc" và "Cường độ ánh sáng rất thấp". Thành phần Fuzzifier xử lý giá trị cảm biến 450 lux như thế nào?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'It assigns a binary 0 or 1 value based on a fixed threshold',
            vi: 'A. Gán giá trị nhị phân 0 hoặc 1 dựa trên ngưỡng cố định',
          },
        },
        {
          value: 'b',
          label: { en: 'It converts the 450 lux into a log-odds ratio', vi: 'B. Chuyển đổi thành tỷ lệ log-odds' },
        },
        {
          value: 'c',
          label: {
            en: 'It calculates the degree of membership (μ) of 450 lux in the predefined fuzzy set for "Very Low Light Intensity"',
            vi: 'C. Tính mức độ thành viên (μ) của 450 lux trong tập mờ được xác định trước',
          },
        },
        {
          value: 'd',
          label: { en: 'It calculates the mean absolute error', vi: 'D. Tính lỗi tuyệt đối trung bình' },
        },
      ],
      correctAnswer: 'c',
    },
    {
      qNo: 4,
      text: {
        en: 'A control engineer proposes using a crisp logic system (fixed thresholds) to regulate the CO2 injection. If the threshold for "High CO2" is set exactly at 8.0 ppm, and the sensor reading fluctuates rapidly between 7.9 ppm and 8.1 ppm, evaluate the likely impact on the AUV\'s control valve compared to a Fuzzy Logic system.',
        vi: 'Một kỹ sư điều khiển đề xuất sử dụng hệ thống logic rõ ràng (ngưỡng cố định) để điều chỉnh tiêm CO2. Nếu ngưỡng cho "High CO2" được đặt chính xác ở 8.0 ppm và cảm biến dao động giữa 7.9 và 8.1 ppm, tác động trên van điều khiển là gì?',
      },
      options: [
        {
          value: 'a',
          label: { en: 'The Fuzzy Logic system would be more complex and slower', vi: 'A. Hệ thống Fuzzy Logic sẽ phức tạp hơn' },
        },
        {
          value: 'b',
          label: {
            en: 'The crisp system would cause abrupt, oscillatory, and continuous opening/closing of the valve, whereas the Fuzzy system would allow for smooth, proportional control changes',
            vi: 'B. Hệ thống rõ ràng sẽ gây ra dao động, trong khi hệ thống Fuzzy cho phép điều khiển mịn',
          },
        },
        {
          value: 'c',
          label: { en: 'The crisp system would perfectly handle the noise', vi: 'C. Hệ thống rõ ràng sẽ xử lý nhiễu hoàn hảo' },
        },
        {
          value: 'd',
          label: { en: 'Both systems would behave identically', vi: 'D. Cả hai hệ thống sẽ hoạt động giống nhau' },
        },
      ],
      correctAnswer: 'b',
    },
    {
      qNo: 5,
      text: {
        en: 'The system needs a rule to prevent coral damage. Propose a single Mamdani-type fuzzy rule that dictates a maximum intervention response using inputs Seawater Temperature (Cool, Hot) and pH Level (Acidic, Neutral).',
        vi: 'Hệ thống cần một quy tắc để ngăn chặn tổn thương san hô. Đề xuất một quy tắc mờ loại Mamdani với đầu vào Seawater Temperature (Cool, Hot) và pH Level (Acidic, Neutral).',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'IF Temp IS Hot OR pH IS Neutral THEN Intervention IS Max',
            vi: 'A. IF Temp IS Hot OR pH IS Neutral THEN Intervention IS Max',
          },
        },
        {
          value: 'b',
          label: { en: 'IF Temp IS Cool THEN Intervention IS Min', vi: 'B. IF Temp IS Cool THEN Intervention IS Min' },
        },
        {
          value: 'c',
          label: {
            en: 'IF Seawater Temperature IS Hot AND pH Level IS Acidic THEN Intervention Output IS Maximum (Urgent)',
            vi: 'C. IF Seawater Temperature IS Hot AND pH Level IS Acidic THEN Intervention Output IS Maximum (Urgent)',
          },
        },
        {
          value: 'd',
          label: {
            en: 'IF Temp IS Hot AND pH IS Neutral THEN Intervention IS Medium',
            vi: 'D. IF Temp IS Hot AND pH IS Neutral THEN Intervention IS Medium',
          },
        },
      ],
      correctAnswer: 'c',
    },
  ],

  'linear-regression': [
    {
      qNo: 1,
      text: {
        en: 'Scientists want to model the linear relationship between Seawater Temperature (X) and Coral Growth Rate (Y). If the calculated regression equation is Growth Rate = 0.5 - 0.15 · Temp, what is the predicted Growth Rate if the Seawater Temperature is 30°C?',
        vi: 'Các nhà khoa học muốn mô hình hóa mối quan hệ tuyến tính giữa Nhiệt độ nước biển (X) và Tốc độ tăng trưởng san hô (Y). Nếu phương trình hồi quy là Growth Rate = 0.5 - 0.15 · Temp, tốc độ tăng trưởng dự đoán ở 30°C là bao nhiêu?',
      },
      options: [
        { value: 'a', label: { en: '0.5 units/day', vi: 'A. 0.5 units/day' } },
        { value: 'b', label: { en: '30 units/day', vi: 'B. 30 units/day' } },
        { value: 'c', label: { en: '-4.0 units/day', vi: 'C. -4.0 units/day' } },
        { value: 'd', label: { en: '4.0 units/day', vi: 'D. 4.0 units/day' } },
      ],
      correctAnswer: 'c',
    },
    {
      qNo: 2,
      text: {
        en: 'A Multiple Linear Regression model is built using data from the IoT Sensor Grid to predict Coral Health Score (Y) based on Temperature X1 and pH X2. If the coefficient for Temperature X1 is β1 = -0.8, how should this value be interpreted?',
        vi: 'Một mô hình Hồi quy Tuyến tính Nhiều được xây dựng để dự đoán Coral Health Score (Y) dựa trên Temperature X1 và pH X2. Nếu hệ số cho Temperature là β1 = -0.8, giá trị này nên được diễn giải như thế nào?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'A 1-unit increase in Temp increases Coral Health Score by 0.8 units, holding pH constant',
            vi: 'A. Tăng 1 đơn vị Nhiệt độ tăng Coral Health Score 0.8 đơn vị',
          },
        },
        {
          value: 'b',
          label: {
            en: 'A 1-unit increase in Temp decreases the log-odds of health by 0.8',
            vi: 'B. Tăng 1 đơn vị Nhiệt độ giảm log-odds của sức khỏe',
          },
        },
        {
          value: 'c',
          label: {
            en: 'A 1-unit increase in Seawater Temperature decreases the Coral Health Score by 0.8 units, assuming the pH level remains constant',
            vi: 'C. Tăng 1 đơn vị Nhiệt độ giảm Coral Health Score 0.8 đơn vị, giả sử pH không đổi',
          },
        },
        {
          value: 'd',
          label: { en: 'Temperature is perfectly correlated with Coral Health', vi: 'D. Nhiệt độ tương quan hoàn hảo' },
        },
      ],
      correctAnswer: 'c',
    },
    {
      qNo: 3,
      text: {
        en: 'A Linear Regression model is used to predict the growth rate of specific coral species. A scatter plot of the residuals versus the predicted growth rate shows a distinct fanning-out pattern (residuals get wider as the predicted value increases). Which key assumption of Linear Regression is most likely being violated?',
        vi: 'Một mô hình Hồi quy Tuyến tính được sử dụng để dự đoán tốc độ tăng trưởng. Biểu đồ phân tán của phần dư so với giá trị dự đoán cho thấy một mô hình "fanning-out" rõ ràng. Giả định nào của Hồi quy Tuyến tính có thể bị vi phạm?',
      },
      options: [
        { value: 'a', label: { en: 'Independence of observations', vi: 'A. Tính độc lập của quan sát' } },
        { value: 'b', label: { en: 'Normality of residuals', vi: 'B. Tính chuẩn tắc của phần dư' } },
        {
          value: 'c',
          label: {
            en: 'Homoscedasticity (constant variance of residuals)',
            vi: 'C. Homoscedasticity (phương sai không đổi)',
          },
        },
        { value: 'd', label: { en: 'Linearity of the relationship', vi: 'D. Tính tuyến tính' } },
      ],
      correctAnswer: 'c',
    },
    {
      qNo: 4,
      text: {
        en: 'The research team has continuous temperature data X1 and dissolved oxygen X2 and wants to predict coral bleaching risk (Y, a continuous score from 0 to 100). The current model has an R² of 0.95, but the biologists suspect the relationship is not perfectly linear. Why is it important to use residual analysis (plotting residuals vs. X1 or X2) despite the very high R² value?',
        vi: 'Nhóm nghiên cứu muốn dự đoán rủi ro tẩy trắng san hô (Y, điểm liên tục từ 0 đến 100). Mô hình hiện có R² = 0.95. Tại sao cần sử dụng phân tích phần dư mặc dù R² cao?',
      },
      options: [
        { value: 'a', label: { en: 'High R² always means the model is perfect', vi: 'A. R² cao luôn có nghĩa mô hình hoàn hảo' } },
        {
          value: 'b',
          label: {
            en: 'High R² does not guarantee linearity; a structured pattern in the residuals could reveal a non-linear relationship (e.g., quadratic) that requires transformation',
            vi: 'B. R² cao không đảm bảo tuyến tính; mô hình trong phần dư có thể tiết lộ mối quan hệ phi tuyến',
          },
        },
        { value: 'c', label: { en: 'Residual analysis is only for classification models', vi: 'C. Phân tích phần dư chỉ cho mô hình phân loại' } },
        { value: 'd', label: { en: 'R² is only useful for binary data', vi: 'D. R² chỉ hữu ích cho dữ liệu nhị phân' } },
      ],
      correctAnswer: 'b',
    },
    {
      qNo: 5,
      text: {
        en: 'The relationship between undersea light intensity (X) and photosynthetic rate (Y) of the coral displays a classic non-linear, diminishing returns curve (the rate increases quickly at first, then slows down). Propose a transformation for the independent variable X that would enable the use of Multiple Linear Regression to model this relationship effectively.',
        vi: 'Mối quan hệ giữa cường độ ánh sáng dưới nước (X) và tốc độ quang hợp (Y) của san hô thể hiện một đường cong không tuyến tính điển hình (tốc độ tăng nhanh lúc đầu, sau đó chậm lại). Đề xuất một phép biến đổi cho X để sử dụng Hồi quy Tuyến tính Nhiều một cách hiệu quả.',
        vi2: 'Đề xuất phép biến đổi cho X để mô hình hóa hiệu quả?',
      },
      options: [
        { value: 'a', label: { en: 'Transform Y to 1/Y', vi: 'A. Transform Y to 1/Y' } },
        { value: 'b', label: { en: 'Transform X to X²', vi: 'B. Transform X to X²' } },
        { value: 'c', label: { en: 'Transform X to log(X)', vi: 'C. Transform X to log(X)' } },
        { value: 'd', label: { en: 'Transform Y to log(Y)', vi: 'D. Transform Y to log(Y)' } },
      ],
      correctAnswer: 'c',
    },
  ],

  'logistic-regression': [
    {
      qNo: 1,
      text: {
        en: 'The CoralGuard system uses Logistic Regression to predict the probability of a reef cluster exhibiting "Bleaching Symptoms"(Y = 1) based on Seawater Temperature and pH levels. Why is Logistic Regression, using the Sigmoid function, the appropriate choice over Linear Regression for this task?',
        vi: 'Hệ thống CoralGuard sử dụng Logistic Regression để dự đoán xác suất của một cụm rạn biểu thị "Triệu chứng Tẩy trắng" (Y = 1). Tại sao Logistic Regression lại phù hợp hơn Linear Regression?',
      },
      options: [
        {
          value: 'a',
          label: { en: 'Logistic Regression is faster to train on the IoT Sensor Grid data', vi: 'A. Logistic Regression nhanh hơn để huấn luyện' },
        },
        {
          value: 'b',
          label: {
            en: 'The Sigmoid function ensures that the predicted outcome, the risk of bleaching, is scaled to a meaningful probability value between 0 and 1',
            vi: 'B. Hàm Sigmoid đảm bảo kết quả dự đoán được chia tỷ lệ thành xác suất có ý nghĩa giữa 0 và 1',
          },
        },
        {
          value: 'c',
          label: { en: 'Linear Regression cannot handle continuous inputs like Temperature', vi: 'C. Linear Regression không thể xử lý đầu vào liên tục' },
        },
        {
          value: 'd',
          label: {
            en: 'Logistic Regression automatically handles categorical variables without encoding',
            vi: 'D. Logistic Regression tự động xử lý các biến phân loại',
          },
        },
      ],
      correctAnswer: 'b',
    },
    {
      qNo: 2,
      text: {
        en: 'A Logistic Regression model is trained to predict "Disease Outbreak" (Y = 1). The linear combination of inputs results in a log-odds (logit) value of 2.0 for a specific sensor station. Calculate the approximate probability (p) of a disease outbreak at this station.',
        vi: 'Một mô hình Logistic Regression được huấn luyện để dự đoán "Bùng phát bệnh dịch" (Y = 1). Giá trị log-odds (logit) là 2.0. Tính xác suất (p) gần đúng của bùng phát bệnh?',
      },
      options: [
        { value: 'a', label: { en: '0.2', vi: 'A. 0.2' } },
        { value: 'b', label: { en: '0.88', vi: 'B. 0.88' } },
        { value: 'c', label: { en: '0.5', vi: 'C. 0.5' } },
        { value: 'd', label: { en: '1.0', vi: 'D. 1.0' } },
      ],
      correctAnswer: 'b',
    },
    {
      qNo: 3,
      text: {
        en: 'The model finds a negative coefficient (β) of -2.5 for the independent variable Dissolved Oxygen Concentration when predicting the probability of "Coral Mortality" (Y=1). How should the marine biologist interpret this finding?',
        vi: 'Mô hình tìm thấy hệ số âm (β) = -2.5 cho Dissolved Oxygen Concentration khi dự đoán "Coral Mortality" (Y=1). Nhà sinh học biển nên diễn giải điều này như thế nào?',
      },
      options: [
        {
          value: 'a',
          label: {
            en: 'High Dissolved Oxygen is strongly associated with increased Coral Mortality',
            vi: 'A. Oxygen cao liên kết với tăng Coral Mortality',
          },
        },
        {
          value: 'b',
          label: {
            en: 'A one-unit increase in Dissolved Oxygen decreases the log-odds of Coral Mortality, suggesting it reduces the risk',
            vi: 'B. Tăng 1 đơn vị Oxygen giảm log-odds của Coral Mortality, giảm rủi ro',
          },
        },
        {
          value: 'c',
          label: { en: 'Dissolved Oxygen must be a categorical variable', vi: 'C. Dissolved Oxygen phải là biến phân loại' },
        },
        { value: 'd', label: { en: 'The probability of Coral Mortality is 2.5', vi: 'D. Xác suất Coral Mortality là 2.5' } },
      ],
      correctAnswer: 'b',
    },
    {
      qNo: 4,
      text: {
        en: 'The AUV fleet is tasked with intervention based on the predicted probability of "Reef Collapse" (Y=1). Missing a collapsing reef (False Negative) is catastrophic. The model needs a classification threshold. Which evaluation metric should the team prioritize to minimize this catastrophic error?',
        vi: 'Đội AUV cần can thiệp dựa trên xác suất dự đoán của "Reef Collapse" (Y=1). Bỏ lỡ một rạn sập (False Negative) là thảm họa. Metric nào nên được ưu tiên?',
      },
      options: [
        { value: 'a', label: { en: 'Precision (minimizing False Positives)', vi: 'A. Precision (giảm False Positives)' } },
        { value: 'b', label: { en: 'Recall (minimizing False Negatives)', vi: 'B. Recall (giảm False Negatives)' } },
        { value: 'c', label: { en: 'F1 Score (balance)', vi: 'C. F1 Score (cân bằng)' } },
        { value: 'd', label: { en: 'Accuracy (overall correctness)', vi: 'D. Accuracy (tổng độ chính xác)' } },
      ],
      correctAnswer: 'b',
    },
    {
      qNo: 5,
      text: {
        en: 'A researcher wants to build a Multinomial Logistic Regression model to classify the severity of coral stress into three mutually exclusive categories: {Low Stress, Moderate Stress, Severe Stress}. Which approach must they use to adapt the binary Logistic Regression framework to handle these three classes?',
        vi: 'Một nhà nghiên cứu muốn xây dựng mô hình Multinomial Logistic Regression để phân loại mức độ căng thẳng của san hô thành 3 loại: {Stress Thấp, Stress Vừa, Stress Cao}. Phương pháp nào cần được sử dụng?',
      },
      options: [
        {
          value: 'a',
          label: { en: 'Train separate Linear Regression models for each class', vi: 'A. Huấn luyện các mô hình Linear Regression riêng biệt' },
        },
        {
          value: 'b',
          label: {
            en: 'Use Multinomial Logistic Regression (Softmax function) or the One-vs-Rest (OvR) strategy',
            vi: 'B. Sử dụng Multinomial Logistic Regression (Softmax) hoặc One-vs-Rest (OvR)',
          },
        },
        {
          value: 'c',
          label: { en: 'Use the Sigmoid function three times independently', vi: 'C. Sử dụng hàm Sigmoid ba lần độc lập' },
        },
        {
          value: 'd',
          label: { en: 'Combine all three categories into a single binary outcome', vi: 'D. Kết hợp cả ba loại thành một kết quả nhị phân' },
        },
      ],
      correctAnswer: 'b',
    },
  ],
}

/**
 * Hàm lấy câu hỏi Section 2 cho một topic
 */
export function getSectionBCaseStudyQuestions(topicId) {
  return SECTION_B_CASE_STUDY_QUESTIONS[topicId] || []
}
