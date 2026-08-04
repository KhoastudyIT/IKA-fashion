// Nội dung bài viết dùng chung cho trang danh sách và trang chi tiết, để hai
// nơi không bao giờ lệch tiêu đề hay ngày đăng.
export type BlogPost = {
  id: string
  title: string
  category: string
  excerpt: string
  date: string
  image: string
  body: string[]
}

export const blogPosts: BlogPost[] = [
  {
    id: 'xu-huong-mua-thu-2026',
    title: 'Xu Hướng Thời Trang Mùa Thu 2026',
    category: 'XU HƯỚNG',
    excerpt: 'Khám phá những gam màu ấm áp và chất liệu len lên ngôi trong mùa thu năm nay cùng IKA Fashion.',
    date: '06/07/2026',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
    body: [
      'Mùa thu năm nay đánh dấu sự trở lại của bảng màu đất: nâu cà phê, be sữa, xanh rêu và cam đất. Đây đều là những gam màu dễ phối, hợp với làn da người Việt và không bao giờ lỗi mốt.',
      'Về phom dáng, xu hướng nghiêng về sự thoải mái. Áo polo form regular và quần âu ống suông đang được ưa chuộng hơn hẳn những thiết kế ôm sát của vài mùa trước. Bộ đôi này vừa đủ lịch sự cho công sở, vừa đủ thoải mái để mặc cả ngày.',
      'Chất liệu là điểm đáng chú ý nhất. Vải piqué và cotton pha co giãn nhẹ lên ngôi nhờ khả năng giữ phom tốt mà vẫn thoáng khí — rất hợp với thời tiết giao mùa nóng lạnh thất thường ở Việt Nam.',
      'Gợi ý của IKA: bắt đầu từ ba món cơ bản gồm một áo polo trung tính, một quần âu tối màu và một áo thun trắng. Chỉ với ba món này bạn đã có thể phối ra gần một tuần trang phục khác nhau.',
    ],
  },
  {
    id: 'phoi-do-cong-so',
    title: 'Cách Phối Đồ Công Sở Trẻ Trung',
    category: 'MIX & MATCH',
    excerpt: 'Phá vỡ sự nhàm chán của đồ công sở với 5 mẹo mix & match cực kỳ đơn giản nhưng hiệu quả.',
    date: '01/07/2026',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
    body: [
      'Đồ công sở không nhất thiết phải cứng nhắc. Chỉ cần thay đổi vài chi tiết nhỏ, bộ trang phục đi làm của bạn sẽ trẻ trung hơn hẳn mà vẫn giữ được sự chuyên nghiệp.',
      'Thứ nhất, thay áo sơ mi bằng áo polo vào những ngày không có lịch họp. Polo giữ được sự chỉn chu của cổ áo nhưng thoải mái hơn nhiều khi ngồi làm việc cả ngày.',
      'Thứ hai, ưu tiên quần âu form slim thay vì form rộng truyền thống. Dáng quần gọn giúp tổng thể trông cao và thanh thoát hơn, đặc biệt hiệu quả với người có chiều cao khiêm tốn.',
      'Thứ ba, giới hạn mỗi bộ trang phục trong ba màu. Càng nhiều màu càng rối, và bộ đồ sẽ mất đi vẻ chuyên nghiệp cần có ở môi trường công sở.',
      'Thứ tư, đầu tư vào một chiếc quần tối màu thật vừa vặn. Một chiếc quần vừa dáng nâng tầm cả bộ đồ hơn bất kỳ món phụ kiện đắt tiền nào.',
      'Cuối cùng, đừng bỏ qua việc là ủi. Chất vải kháng nhăn giúp bạn tiết kiệm thời gian, nhưng một nếp gấp gọn gàng vẫn luôn tạo ấn tượng tốt.',
    ],
  },
  {
    id: 'bao-quan-ao-thun',
    title: 'Bảo Quản Áo Thun Đúng Cách',
    category: 'MẸO VẶT',
    excerpt: 'Giữ cho những chiếc áo thun yêu thích của bạn luôn như mới với hướng dẫn giặt ủi chuẩn từ chuyên gia.',
    date: '25/06/2026',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    body: [
      'Một chiếc áo thun cotton tốt có thể dùng vài năm nếu được chăm sóc đúng cách. Ngược lại, chỉ vài lần giặt sai là áo đã bai dão và bạc màu.',
      'Luôn giặt ở nước lạnh dưới 30°C và lộn trái sản phẩm trước khi cho vào máy. Nước nóng làm sợi cotton co lại, còn việc lộn trái bảo vệ bề mặt vải và hình in khỏi ma sát.',
      'Tuyệt đối không dùng thuốc tẩy, kể cả với áo trắng. Thuốc tẩy phá vỡ cấu trúc sợi vải khiến áo nhanh mục. Với vết bẩn cứng đầu, hãy xử lý riêng bằng xà phòng dịu nhẹ trước khi giặt.',
      'Không ngâm áo quá 30 phút và phơi ở nơi thoáng mát, tránh nắng gắt chiếu trực tiếp. Nắng gắt là nguyên nhân số một khiến áo màu bị bạc.',
      'Khi là ủi, chọn nhiệt độ thấp đến trung bình và tránh ủi trực tiếp lên hình in. Nếu cần, hãy lót một lớp vải mỏng lên trên.',
    ],
  },
]

export function getPost(id: string) {
  return blogPosts.find(p => p.id === id)
}
