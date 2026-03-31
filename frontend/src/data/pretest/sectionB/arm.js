import { mcq3, txt } from './common.js'

/** Association Rules Mining — Section B (docs/Pretest.pdf) */
export const associationRulesMining = [
  mcq3(
    'Remembering',
    'Which metric measures how frequently an itemset appears in the entire dataset?',
    'Độ đo nào đo tần suất một tập mục xuất hiện trong toàn bộ tập dữ liệu?',
    { en: 'Confidence', vi: 'Confidence' },
    { en: 'Support', vi: 'Support' },
    { en: 'Lift', vi: 'Lift' }
  ),
  mcq3(
    'Remembering',
    'The Apriori algorithm is primarily used for:',
    'Thuật toán Apriori chủ yếu được dùng để:',
    { en: 'Clustering similar data points', vi: 'Gom cụm các điểm dữ liệu tương tự' },
    { en: 'Finding frequent itemsets', vi: 'Tìm các tập mục thường xuyên (frequent itemsets)' },
    { en: 'Dimensionality reduction', vi: 'Giảm chiều dữ liệu' }
  ),
  mcq3(
    'Understanding',
    "What does the Apriori Principle state about itemsets?",
    'Nguyên lý Apriori phát biểu điều gì về các tập mục?',
    {
      en: 'If an itemset is frequent, all its subsets must also be frequent.',
      vi: 'Nếu một tập mục là frequent thì mọi tập con của nó cũng phải frequent.',
    },
    {
      en: 'If an itemset is frequent, its supersets must also be frequent.',
      vi: 'Nếu một tập mục là frequent thì mọi tập cha cũng phải frequent.',
    },
    { en: 'Only large item sets can be frequent.', vi: 'Chỉ các tập mục lớn mới có thể frequent.' }
  ),
  mcq3(
    'Understanding',
    'If a rule {A} → {B} has a Lift > 1, it implies that:',
    'Nếu luật {A} → {B} có Lift > 1, điều đó gợi ý rằng:',
    { en: 'A and B are independent.', vi: 'A và B độc lập.' },
    {
      en: 'The presence of A increases the likelihood of B being present.',
      vi: 'Sự xuất hiện của A làm tăng khả năng B xuất hiện.',
    },
    { en: 'A and B are negatively correlated.', vi: 'A và B tương quan âm.' }
  ),
  mcq3(
    'Applying',
    'In 200 transactions, "Coke" appears in 100, "Chips" in 80, both together in 40. Confidence of {Coke} → {Chips} is:',
    'Trong 200 giao dịch, Coke có trong 100, Chips trong 80, cả hai cùng lúc trong 40. Độ Confidence của {Coke} → {Chips} là:',
    { en: '0.2', vi: '0,2' },
    { en: '0.4', vi: '0,4' },
    { en: '0.5', vi: '0,5' }
  ),
  mcq3(
    'Applying',
    'With the same data, Support for itemset {Coke, Chips} is:',
    'Với cùng dữ liệu, Support của tập {Coke, Chips} là:',
    { en: '20%', vi: '20%' },
    { en: '40%', vi: '40%' },
    { en: '50%', vi: '50%' }
  ),
  mcq3(
    'Analyzing',
    'Why does FP-Growth typically perform faster than Apriori on large datasets?',
    'Vì sao FP-Growth thường nhanh hơn Apriori trên tập dữ liệu lớn?',
    {
      en: 'It requires fewer database scans and no candidate generation.',
      vi: 'Ít quét CSDL hơn và không sinh ứng viên tường minh.',
    },
    { en: 'It uses a simpler formula for Lift.', vi: 'Công thức Lift đơn giản hơn.' },
    { en: 'It only processes numerical data.', vi: 'Chỉ xử lý dữ liệu số.' }
  ),
  mcq3(
    'Analyzing',
    'If you increase the minimum confidence threshold, how does it affect discovered rules?',
    'Khi tăng ngưỡng confidence tối thiểu, tập luật tìm được thay đổi thế nào?',
    { en: 'It increases the number of rules.', vi: 'Số luật tăng.' },
    {
      en: 'It decreases the number of rules but increases their reliability.',
      vi: 'Số luật giảm nhưng đáng tin cậy hơn.',
    },
    { en: 'It has no effect on the number of rules.', vi: 'Không ảnh hưởng số luật.' }
  ),
  mcq3(
    'Evaluating',
    'A retail manager wants associations that are strong beyond both being popular. Which metric should they prioritize?',
    'Quản lý muốn tìm liên kết mạnh mà không chỉ vì cả hai đều bán chạy. Ưu tiên độ đo nào?',
    { en: 'Support', vi: 'Support' },
    { en: 'Confidence', vi: 'Confidence' },
    { en: 'Lift', vi: 'Lift' }
  ),
  txt(
    'Creating',
    'For pharmacy market-basket analysis, how would you modify traditional ARM to prioritize "Critical Drug Interactions" over "Frequent Purchases"?',
    'Với phân tích giỏ hàng nhà thuốc, bạn điều chỉnh ARM truyền thống thế nào để ưu tiên "tương tác thuốc nguy hiểm" hơn "mua cùng thường xuyên"?',
    'Short answer in English (primary). / Trả lời ngắn (ưu tiên tiếng Anh).',
    'Có thể bổ sung ý chính bằng tiếng Việt nếu cần.'
  ),
]
