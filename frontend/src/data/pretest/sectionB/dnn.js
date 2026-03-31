import { mcq3, txt } from './common.js'

export const deepNeuralNetworks = [
  mcq3(
    'Remembering',
    'What is a Deep Neural Network (DNN)?',
    'Mạng nơ-ron sâu (DNN) là gì?',
    { en: 'A network with only one layer', vi: 'Chỉ một lớp' },
    { en: 'A neural network with multiple hidden layers', vi: 'Nhiều lớp ẩn' },
    { en: 'A database system', vi: 'Hệ CSDL' }
  ),
  mcq3(
    'Remembering',
    'Role of an activation function?',
    'Vai trò hàm kích hoạt?',
    { en: 'Store data', vi: 'Lưu dữ liệu' },
    { en: 'Introduce non-linearity', vi: 'Đưa phi tuyến vào mô hình' },
    { en: 'Reduce dataset size', vi: 'Giảm kích thước dữ liệu' }
  ),
  mcq3(
    'Understanding',
    'Why are multiple hidden layers useful?',
    'Vì sao nhiều lớp ẩn hữu ích?',
    { en: 'They reduce computation', vi: 'Giảm tính toán' },
    { en: 'They help learn complex patterns', vi: 'Học mẫu phức tạp' },
    { en: 'They remove need for data', vi: 'Không cần dữ liệu' }
  ),
  mcq3(
    'Understanding',
    'What is overfitting in DNNs?',
    'Overfitting trong DNN là gì?',
    {
      en: 'Good on training, poor on new data.',
      vi: 'Tốt trên huấn luyện, kém trên dữ liệu mới.',
    },
    { en: 'Cannot learn patterns', vi: 'Không học được mẫu' },
    { en: 'Model too simple', vi: 'Mô hình quá đơn giản' }
  ),
  mcq3(
    'Applying',
    'High train accuracy, low validation accuracy. What to do?',
    'Độ chính xác huấn luyện cao, kiểm định thấp. Nên làm gì?',
    { en: 'Increase overfitting', vi: 'Tăng overfitting' },
    { en: 'Apply regularization or dropout', vi: 'Chuẩn hóa / dropout' },
    { en: 'Remove training data', vi: 'Xóa dữ liệu huấn luyện' }
  ),
  mcq3(
    'Applying',
    'Network cannot learn complex patterns. Change that might help?',
    'Mạng không học được mẫu phức tạp. Thay đổi nào có thể giúp?',
    { en: 'Reduce layers', vi: 'Giảm số lớp' },
    { en: 'Add more hidden layers or neurons', vi: 'Thêm lớp ẩn hoặc nơ-ron' },
    { en: 'Remove activations', vi: 'Bỏ hàm kích hoạt' }
  ),
  mcq3(
    'Analyzing',
    'Very deep network without normalization techniques?',
    'Mạng rất sâu không có kỹ thuật chuẩn hóa?',
    {
      en: 'Vanishing/exploding gradients may occur.',
      vi: 'Có thể gradient triệt tiêu / bùng nổ.',
    },
    { en: 'Always faster', vi: 'Luôn nhanh hơn' },
    { en: 'Accuracy always increases', vi: 'Độ chính xác luôn tăng' }
  ),
  mcq3(
    'Analyzing',
    'Why normalize inputs for DNN training?',
    'Vì sao chuẩn hóa đầu vào khi huấn luyện DNN?',
    { en: 'Increases randomness', vi: 'Tăng ngẫu nhiên' },
    { en: 'Stabilizes and speeds up training', vi: 'Ổn định và tăng tốc huấn luyện' },
    { en: 'Removes labels', vi: 'Xóa nhãn' }
  ),
  txt(
    'Evaluating',
    'Model does poorly on both training and validation. What does it suggest?',
    'Mô hình kém trên cả huấn luyện và kiểm định. Gợi ý điều gì?',
    'e.g. underfitting / capacity.',
    'Tiếng Anh.'
  ),
  txt(
    'Creating',
    'Propose one real-world DNN application and usefulness.',
    'Đề xuất một ứng dụng DNN thực tế và lợi ích.',
    'English.',
    'Vi tùy chọn.'
  ),
]
