// =============================================================
// Bài viết tin tức mẫu — nạp bởi src/db/seed.js khi bảng `news` còn trống.
//
// Để ở đây thay vì trong ika_database.sql vì file SQL chỉ được Postgres chạy
// lúc KHỞI TẠO database lần đầu; máy nào đã có sẵn volume dữ liệu sẽ không bao
// giờ thấy. seed.js chạy mỗi lần khởi động nên ai pull repo về cũng có dữ liệu.
//
// `categorySlug` tra ra id lúc chạy — không hardcode id vì thứ tự SERIAL có thể
// khác nhau giữa các máy.
// =============================================================

export const NEWS_SEED = [
  {
    title: 'Phối đồ dự tiệc: lịch sự mà không cứng nhắc',
    slug: 'phoi-do-du-tiec-lich-su-ma-khong-cung-nhac',
    img: '/banners/tin-tuc/blog-du-tiec.jpeg',
    excerpt: 'Không phải bữa tiệc nào cũng cần vest. Đây là cách chọn trang phục đúng mức cho từng loại sự kiện.',
    author: 'IKA Fashion',
    categorySlug: 'phoi-do',
    status: 'published',
    date: '2026-07-05',
    content: `Câu hỏi khó nhất khi nhận thiệp mời không phải *đi hay không*, mà là *mặc gì*. Mặc quá trang trọng cũng lạc lõng như mặc quá xuề xòa.

## Đọc mã trang phục trên thiệp mời

### Black tie

Hiếm gặp ở Việt Nam. Nếu thấy dòng này, bạn cần vest tối màu, sơ mi trắng và giày da đen.

### Smart casual

Phổ biến nhất. Nghĩa là lịch sự nhưng không cần vest đầy đủ — quần âu, sơ mi hoặc polo, giày da.

### Casual

Vẫn nên tránh quần short và dép lê. Kaki với áo thun trơn chất lượng tốt là đủ.

## Khi thiệp không ghi gì

Đây là tình huống hay gặp nhất. Nguyên tắc an toàn:

1. Hỏi người mời — cách nhanh và chính xác nhất
2. Nếu không hỏi được, chọn mức **smart casual**
3. Mang theo một lớp áo khoác có thể cởi ra nếu thấy mình quá trang trọng

> Ăn mặc trang trọng hơn một bậc luôn an toàn hơn xuề xòa hơn một bậc.

![Trang phục dự tiệc](/products/ao-polo-blue.png)

## Ba bộ dùng được cho hầu hết sự kiện

- **Tiệc cưới ban ngày** — quần âu xám, sơ mi trắng, giày da nâu
- **Tiệc tối công ty** — quần âu đen, polo tối màu, blazer
- **Họp mặt bạn bè** — kaki, áo thun trơn, sneaker sạch

## Chi tiết quyết định tổng thể

Điều tạo khác biệt thường không phải món đồ đắt nhất, mà là những chi tiết nhỏ:

- Giày sạch và đánh xi
- Quần không nhăn ở đũng
- Áo được là phẳng phần cổ và vai
- Màu thắt lưng khớp màu giày

*Một bộ đồ bình thường được chăm chút kỹ luôn trông tốt hơn một bộ đắt tiền bị bỏ bê.*`,
  },
  {
    title: 'Vì sao bảng màu trung tính không bao giờ lỗi mốt',
    slug: 'vi-sao-bang-mau-trung-tinh-khong-bao-gio-loi-mot',
    img: '/banners/tin-tuc/blog-mau-trung-tinh.jpeg',
    excerpt: 'Đen, trắng, xám, be và nâu — năm màu này chiếm tới 80% tủ đồ của những người ăn mặc đẹp. Đây là lý do.',
    author: 'IKA Fashion',
    categorySlug: 'xu-huong',
    status: 'published',
    date: '2026-07-08',
    content: `Có một điều dễ nhận ra khi quan sát những người ăn mặc đẹp: tủ đồ của họ thường **ít màu hơn** bạn tưởng.

## Toán học đơn giản của tủ đồ

Giả sử bạn có 10 chiếc áo và 10 chiếc quần, tất cả đều màu trung tính. Số cách phối là 100.

Bây giờ giả sử một nửa số đó là màu nổi và khó phối. Số cách phối thực sự dùng được tụt xuống còn khoảng 25.

> Mua ít món hơn nhưng phối được nhiều hơn luôn là khoản đầu tư tốt hơn.

## Năm màu nền tảng

### Đen

An toàn tuyệt đối nhưng dễ nặng nề nếu mặc cả cây. Dùng đen cho quần và giày, hạn chế cho áo nếu da bạn hơi tối.

### Trắng

Làm sáng khuôn mặt tốt nhất trong năm màu. Nhược điểm duy nhất là khó giữ — đọc thêm bài [giữ áo trắng như mới](/tin-tuc/giu-ao-thun-trang-luon-nhu-moi).

### Xám

Màu dễ mặc nhất cho người mới. Xám ghi nhạt hợp da sáng, xám khói đậm hợp da trung bình đến tối.

### Be và nâu

Hai màu này mềm hơn đen trắng và tạo cảm giác thân thiện. Rất hợp với môi trường công sở không quá trang trọng.

![Áo thun trung tính](/products/ao-thun-den.png)

## Quy tắc ba màu

Đây là quy tắc duy nhất bạn cần nhớ:

1. Mỗi bộ trang phục giới hạn trong ba màu
2. Một màu chiếm ưu thế, một màu phụ, một màu điểm nhấn
3. Nếu phân vân, bỏ bớt màu điểm nhấn

## Khi nào nên phá vỡ quy tắc

Màu nổi không sai — chỉ là nên dùng có chủ đích. Một chiếc áo polo đỏ trong tủ đồ toàn trung tính sẽ nổi bật đúng lúc bạn cần. Nhưng nếu cả tủ đều màu nổi, sẽ chẳng có gì nổi bật cả.

*Nguyên tắc: mua món trung tính bằng tiền, mua món màu nổi bằng sự chắc chắn rằng bạn thực sự thích nó.*`,
  },
  {
    title: 'Chọn đúng size khi mua online',
    slug: 'chon-dung-size-khi-mua-online',
    img: '/banners/tin-tuc/blog-chon-size.jpeg',
    excerpt: 'Bảng size chỉ là điểm khởi đầu. Ba số đo bạn cần biết và cách đối chiếu để không phải đổi trả.',
    author: 'IKA Fashion',
    categorySlug: 'bao-quan',
    status: 'published',
    date: '2026-07-12',
    content: `Lý do đổi trả phổ biến nhất khi mua quần áo online là sai size. Phần lớn trường hợp có thể tránh được chỉ với một chiếc thước dây.

## Ba số đo cần biết

### Vòng ngực

Đo ngang phần rộng nhất của ngực, thước dây song song với sàn, không siết chặt. Đây là số đo quan trọng nhất khi chọn áo.

### Vòng eo

Đo ngang rốn, giữ tư thế đứng thẳng tự nhiên. Đừng hóp bụng — bạn sẽ mặc chiếc quần đó cả ngày chứ không chỉ lúc đo.

### Chiều dài tay và chân

Với áo, đo từ mỏm vai đến cổ tay. Với quần, đo từ đũng đến mắt cá chân.

> Ghi ba số này vào điện thoại. Bạn sẽ dùng lại chúng mỗi lần mua đồ.

![Chọn size](/products/ao-thun-xam.png)

## Đối chiếu với bảng size

Điểm quan trọng nhiều người bỏ qua: **bảng size của mỗi thương hiệu khác nhau**. Size L ở nơi này có thể là size M ở nơi khác.

1. Luôn xem bảng size của chính thương hiệu đó
2. Đối chiếu bằng số đo thật, không dựa vào size bạn thường mặc
3. Nếu nằm giữa hai size, cân nhắc phom áo — áo ôm thì chọn size lớn hơn, áo rộng thì chọn nhỏ hơn

## Đọc mô tả phom

- **Slim fit** — ôm sát, chừa ít khoảng trống
- **Regular fit** — vừa vặn tiêu chuẩn, phù hợp đa số
- **Relaxed fit** — rộng thoải mái, không thùng thình
- **Oversize** — cố tình rộng, thường rộng hơn 1–2 size

## Khi vẫn không chắc

Hãy xem [hướng dẫn chọn size](/huong-dan-size) chi tiết, hoặc nhắn tin cho cửa hàng kèm ba số đo của bạn. Chúng tôi sẽ tư vấn cụ thể cho từng mẫu.

*Chính sách đổi trả trong 7 ngày áp dụng cho mọi đơn hàng — nhưng chọn đúng ngay từ đầu vẫn dễ chịu hơn nhiều.*`,
  },
  {
    title: 'Xu hướng thời trang nam thu đông 2026',
    slug: 'xu-huong-thoi-trang-nam-thu-dong-2026',
    img: '/banners/tin-tuc/blog-thu-dong.jpeg',
    excerpt: 'Gam màu trầm ấm, phom dáng vừa vặn và chất liệu dày dặn — ba trục chính định hình tủ đồ nam mùa lạnh năm nay.',
    author: 'IKA Fashion',
    categorySlug: 'xu-huong',
    status: 'published',
    date: '2026-07-15',
    content: `Mỗi mùa thu đông, câu hỏi quen thuộc nhất mà chúng tôi nhận được là: *năm nay nên mua gì?* Câu trả lời ngắn gọn cho 2026 là hãy đầu tư vào màu trầm, phom vừa vặn và chất liệu dày dặn hơn một chút so với năm ngoái.

## Bảng màu: đất và khói lên ngôi

Sau vài mùa bị chi phối bởi các gam màu sáng, thu đông 2026 quay lại với những sắc độ trầm và ấm. Đây là tin tốt cho người Việt, vì nhóm màu này hợp với phần lớn tông da và cực kỳ dễ phối.

- **Nâu đất** — thay thế đen ở vị trí màu nền, mềm mại hơn nhưng vẫn lịch sự
- **Be sữa** — làm sáng tổng thể mà không chói như trắng tinh
- **Xanh rêu** — điểm nhấn tốt nhất cho áo khoác ngoài
- **Xám khói** — lựa chọn an toàn cho người mới bắt đầu xây tủ đồ

> Nếu tủ đồ của bạn đang toàn đen và trắng, chỉ cần thêm một món màu nâu đất là tổng thể đã khác hẳn.

![Bảng màu thu đông 2026](/products/ao-thun-xam.png)

## Phom dáng: oversize đã được tiết chế

Oversize vẫn còn, nhưng không còn thùng thình như hai năm trước. Xu hướng hiện tại là **relaxed fit** — rộng vừa đủ để thoải mái, nhưng vẫn giữ được đường vai đúng vị trí.

### Với áo

Vai áo nên kết thúc đúng ở mỏm vai hoặc trễ xuống tối đa 2cm. Trễ hơn nữa là bạn đang mặc áo sai size chứ không phải mặc theo mốt.

### Với quần

Ống suông và ống côn nhẹ chiếm ưu thế. Quần skinny gần như biến mất khỏi các bộ sưu tập nam năm nay.

1. Người thấp nên chọn ống côn nhẹ để tạo cảm giác chân dài hơn
2. Người cao có thể thoải mái với ống suông
3. Tránh ống quá rộng nếu bạn dưới 1m70

## Chất liệu: dày hơn, nhưng phải thoáng

Điểm thú vị của mùa lạnh ở Việt Nam là nhiệt độ dao động mạnh trong ngày. Vì vậy chất liệu tốt nhất không phải loại dày nhất, mà là loại **giữ nhiệt tốt nhưng vẫn thoát ẩm**.

- Cotton pha co giãn nhẹ cho lớp trong
- Nỉ bông cho áo khoác nhẹ
- Kaki dày cho quần

## Ba món nên mua trước

Nếu ngân sách có hạn, hãy bắt đầu từ ba món này. Chúng phối được với nhau và với hầu hết những gì bạn đang có:

1. Một áo polo màu trung tính
2. Một quần âu hoặc kaki tối màu
3. Một áo khoác nhẹ màu xanh rêu hoặc nâu

Xem toàn bộ [bộ sưu tập mới](/products) để tìm món phù hợp với phong cách của bạn.`,
  },
  {
    title: 'Chương trình thành viên IKA: những gì bạn cần biết',
    slug: 'chuong-trinh-thanh-vien-ika-nhung-gi-ban-can-biet',
    img: '/banners/tin-tuc/blog-the-thanh-vien.jpeg',
    excerpt: 'Ba hạng thành viên, cách tích điểm và những quyền lợi đi kèm — giải thích ngắn gọn trong một bài.',
    author: 'IKA Fashion',
    categorySlug: 'tin-cua-hang',
    status: 'published',
    date: '2026-07-18',
    content: `Nhiều khách hàng hỏi về chương trình thành viên, nên chúng tôi tổng hợp lại toàn bộ thông tin trong một bài viết.

## Cách tham gia

Đơn giản là tạo tài khoản trên website. Mọi đơn hàng đặt bằng tài khoản đó sẽ tự động được tích điểm — bạn không cần đăng ký thêm bước nào.

## Ba hạng thành viên

### Hạng Bạc

Áp dụng ngay khi tạo tài khoản.

- Tích điểm cơ bản trên mọi đơn hàng
- Nhận thông báo sớm về đợt giảm giá

### Hạng Vàng

Dành cho khách hàng đạt mức chi tiêu tích lũy trong năm.

- Tỷ lệ tích điểm cao hơn
- Miễn phí vận chuyển không giới hạn
- Ưu tiên xử lý đơn hàng

### Hạng Bạch Kim

Hạng cao nhất, kèm các quyền lợi riêng.

- Tỷ lệ tích điểm cao nhất
- Tư vấn phối đồ riêng
- Mời tham dự sự kiện ra mắt bộ sưu tập

![Chương trình thành viên](/banners/banner-summer.png)

## Về việc tích và dùng điểm

1. Điểm được cộng sau khi đơn hàng hoàn tất giao dịch
2. Đơn bị hủy hoặc hoàn trả sẽ trừ lại số điểm tương ứng
3. Điểm dùng để giảm trực tiếp vào đơn hàng kế tiếp
4. Điểm không quy đổi thành tiền mặt

> Bạn xem số điểm hiện có và lịch sử tích lũy trong khu tài khoản của mình.

## Câu hỏi thường gặp

**Điểm có hết hạn không?** Có, điểm hết hạn sau một khoảng thời gian không phát sinh giao dịch. Chúng tôi sẽ gửi thông báo trước.

**Mua tại cửa hàng có tích điểm không?** Có, chỉ cần cung cấp số điện thoại đăng ký tài khoản khi thanh toán.

**Có thể chuyển điểm cho người khác không?** Hiện tại chưa hỗ trợ.

Xem thêm tại [trang câu hỏi thường gặp](/faq) hoặc liên hệ trực tiếp với chúng tôi.`,
  },
  {
    title: 'Năm công thức phối quần kaki cho cả tuần',
    slug: 'nam-cong-thuc-phoi-quan-kaki-cho-ca-tuan',
    img: '/banners/tin-tuc/5-cach-phoi-quan-kaki.jpeg',
    excerpt: 'Một chiếc quần kaki be có thể tạo ra năm bộ trang phục khác nhau — từ đi làm đến đi chơi cuối tuần.',
    author: 'IKA Fashion',
    categorySlug: 'phoi-do',
    status: 'published',
    date: '2026-07-20',
    content: `Nếu chỉ được giữ lại một chiếc quần trong tủ, nhiều người sẽ chọn kaki be. Lý do rất đơn giản: nó phối được với gần như mọi thứ.

## Vì sao kaki be là món đáng đầu tư nhất

Kaki nằm ở khoảng giữa hoàn hảo — đủ lịch sự để đi làm, đủ thoải mái để đi chơi. Màu be lại là màu trung tính sáng, giúp cân bằng những chiếc áo tối màu.

![Quần kaki be](/products/quan-kaki.png)

## Thứ hai — Đi làm

Kaki be + áo sơ mi trắng + giày da nâu. Bộ kinh điển, không bao giờ sai. Nếu văn phòng bạn có điều hòa mạnh, thêm một áo khoác nhẹ màu xanh navy.

## Thứ ba — Họp khách hàng

Kaki be + polo tối màu + blazer navy. Trang trọng hơn thứ hai một bậc nhưng vẫn không cứng nhắc như suit đầy đủ.

## Thứ tư — Ngày bình thường

Kaki be + áo thun trắng trơn + sneaker trắng. Đơn giản đến mức khó sai. Đây cũng là bộ dễ mặc nhất cho người mới bắt đầu quan tâm đến ăn mặc.

## Thứ năm — Trời lạnh

Kaki be + áo len cổ tròn màu xám + boots. Áo len nên chọn phom vừa, không quá dày, để có thể mặc trong áo khoác nếu cần.

## Thứ sáu — Đi chơi sau giờ làm

Kaki be + áo thun đen + áo khoác denim. Bộ này chuyển từ văn phòng sang quán cà phê mà không cần thay đồ.

## Ba lưu ý khi chọn kaki

1. **Độ dài** — gấu quần nên chạm hờ mu giày, không gãy quá một nếp
2. **Độ dày** — vải quá mỏng sẽ nhăn và lộ form kém, quá dày thì nóng
3. **Màu be** — chọn tông trung tính, tránh be ngả vàng vì rất kén da

> Một chiếc kaki vừa vặn nâng tầm cả bộ đồ hơn bất kỳ món phụ kiện đắt tiền nào.

Tham khảo [các mẫu quần](/products) đang có tại cửa hàng.`,
  },
  {
    title: 'Giặt và bảo quản quần âu đúng cách',
    slug: 'giat-va-bao-quan-quan-au-dung-cach',
    img: '/banners/tin-tuc/blog-bao-quan-quan-au.jpeg',
    excerpt: 'Quần âu hỏng phom thường không phải vì vải kém, mà vì giặt sai cách. Đây là hướng dẫn chi tiết.',
    author: 'IKA Fashion',
    categorySlug: 'bao-quan',
    status: 'published',
    date: '2026-07-25',
    content: `Một chiếc quần âu tốt có thể dùng nhiều năm. Nhưng chỉ vài lần giặt sai là phom quần biến dạng vĩnh viễn.

## Bao lâu nên giặt một lần

Đây là điều gây bất ngờ với nhiều người: **quần âu không cần giặt sau mỗi lần mặc**.

- Mặc trong văn phòng có điều hòa: 3–4 lần mặc mới cần giặt
- Mặc ngoài trời, ra mồ hôi nhiều: giặt sau mỗi lần
- Có vết bẩn cụ thể: xử lý riêng điểm đó, không cần giặt cả chiếc

> Giặt quá thường xuyên là nguyên nhân số một khiến quần âu mất phom.

## Giặt máy hay giặt tay

### Giặt máy

Được, nếu bạn làm đúng ba việc:

1. Lộn mặt trong ra ngoài
2. Cho vào túi giặt lưới
3. Chọn chế độ nhẹ, vắt ở tốc độ thấp nhất

### Giặt tay

Tốt hơn cho quần vải mỏng hoặc có nếp ly. Ngâm 10 phút, bóp nhẹ, **không vò và không vắt xoắn**.

![Quần âu](/products/quan-xam.png)

## Phơi đúng cách

Treo bằng móc kẹp ở phần lưng quần, để quần rủ tự nhiên theo chiều dọc. Trọng lượng của vải sẽ tự kéo phẳng phần lớn nếp nhăn.

Tuyệt đối không vắt ngang qua dây phơi — cách này tạo nếp gãy ở giữa ống, rất khó là phẳng lại.

## Là ủi và giữ nếp ly

1. Là mặt trong trước, mặt ngoài sau
2. Dùng khăn ẩm lót giữa bàn là và vải để tránh bóng
3. Với nếp ly, là dọc theo nếp có sẵn, đừng tạo nếp mới
4. Nhiệt độ trung bình là đủ cho hầu hết vải quần âu

## Cất giữ

- Treo, không gấp — gấp lâu ngày tạo nếp ngang khó xử lý
- Dùng móc có thanh ngang bọc vải, tránh móc kim loại trần
- Không nhồi quá chặt trong tủ, vải cần khoảng trống để thở
- Với quần ít dùng, bọc túi vải thoáng khí thay vì túi nilon

*Túi nilon giữ ẩm và là nguyên nhân gây mốc phổ biến nhất trong tủ quần áo ở khí hậu Việt Nam.*`,
  },
  {
    title: 'Cách phối áo polo cho dân công sở',
    slug: 'cach-phoi-ao-polo-cho-dan-cong-so',
    img: '/banners/tin-tuc/blog-phoi-polo.jpeg',
    excerpt: 'Áo polo không chỉ dành cho cuối tuần. Chọn đúng phom và đúng cách phối, đây là món đồ công sở linh hoạt bậc nhất.',
    author: 'IKA Fashion',
    categorySlug: 'phoi-do',
    status: 'published',
    date: '2026-07-28',
    content: `Áo polo từ lâu bị gắn mác trang phục thể thao. Thực tế, đây là một trong những lựa chọn công sở linh hoạt nhất — nếu bạn chọn đúng.

## Chọn phom trước, chọn màu sau

Sai lầm phổ biến nhất là mua polo rộng một size vì nghĩ sẽ thoải mái hơn. Kết quả là vai xệ, thân phồng và tổng thể trông luộm thuộm.

### Kiểm tra nhanh khi thử áo

1. Đường may vai phải nằm đúng mỏm vai
2. Tay áo ôm nhẹ bắp tay, không bó cũng không phồng
3. Thân áo có thể véo lên khoảng 3–4cm ở hai bên sườn
4. Gấu áo kết thúc ngang giữa đũng quần

> Nếu phải chọn giữa hơi chật và hơi rộng, hãy chọn hơi chật. Vải sẽ giãn ra sau vài lần mặc.

![Áo polo phom chuẩn](/products/ao-polo-white.png)

## Ba công thức đi làm

### Công thức 1 — An toàn tuyệt đối

Polo trung tính + quần âu tối màu + giày da lười. Đây là bộ bạn có thể mặc trong 90% ngày làm việc mà không ai để ý gì bất thường.

### Công thức 2 — Trẻ trung hơn

Polo màu sáng + quần kaki be + giày sneaker trắng tối giản. Hợp với môi trường sáng tạo, startup, hoặc ngày thứ sáu.

### Công thức 3 — Trang trọng hơn

Polo tối màu + quần âu + áo blazer không cấu trúc. Bất ngờ là bộ này trông chỉn chu gần bằng sơ mi nhưng thoải mái hơn nhiều.

## Những điều nên tránh

- Bỏ áo vào quần khi polo có gấu bo — kiểu gấu này thiết kế để thả ngoài
- Cài kín cúc trên cùng, trừ khi bạn cố tình theo phong cách preppy
- Phối polo với quần jeans rách khi đến văn phòng
- Polo có logo quá lớn ở ngực

## Bảo quản để giữ phom cổ áo

Cổ áo là bộ phận hỏng đầu tiên của một chiếc polo. Đừng treo polo bằng móc mảnh — hãy gấp lại. Và tuyệt đối không vắt mạnh phần cổ khi giặt tay.

Xem [các mẫu polo hiện có](/products) tại IKA Fashion.`,
  },
  {
    title: 'Giữ áo thun trắng luôn như mới',
    slug: 'giu-ao-thun-trang-luon-nhu-moi',
    img: '/banners/tin-tuc/blog-ao-thun-trang.jpeg',
    excerpt: 'Vài thói quen giặt phơi đơn giản giúp áo trắng bền màu gấp đôi thời gian sử dụng.',
    author: 'IKA Fashion',
    categorySlug: 'bao-quan',
    status: 'published',
    date: '2026-08-02',
    content: `Áo thun trắng là món dễ mặc nhất trong tủ đồ, và cũng là món xuống cấp nhanh nhất. Tin tốt là phần lớn nguyên nhân đều nằm ở thói quen giặt phơi, không phải chất lượng vải.

## Ba nguyên nhân khiến áo trắng ngả vàng

### 1. Bột giặt chưa tan hết

Đây là thủ phạm phổ biến nhất mà ít người nghĩ tới. Bột giặt đổ trực tiếp lên vải sẽ đọng lại thành mảng, lâu ngày oxy hóa thành vệt vàng.

**Cách khắc phục:** hòa tan bột giặt vào nước trước khi cho áo vào, hoặc chuyển sang nước giặt dạng lỏng.

### 2. Mồ hôi không được xử lý sớm

Mồ hôi có tính axit nhẹ. Để lâu, nó phản ứng với sợi cotton và tạo vệt vàng ở nách và cổ áo — loại vệt gần như không giặt sạch được.

**Cách khắc phục:** giặt trong vòng 24 giờ sau khi mặc, đừng để chồng trong giỏ cả tuần.

### 3. Phơi nắng gắt

Ánh nắng mạnh làm sợi cotton giòn và ngả vàng nhanh hơn nhiều người nghĩ.

![Áo thun trắng](/products/ao-thun-trang.png)

## Quy trình giặt đúng

1. Phân loại — giặt riêng đồ trắng, tuyệt đối không giặt chung với đồ màu mới mua
2. Nước lạnh — nước nóng làm co vải và cố định vết bẩn protein
3. Lộn mặt trong ra ngoài — bảo vệ bề mặt vải khỏi ma sát trong lồng giặt
4. Không dùng quá nhiều bột giặt — nhiều hơn không có nghĩa là sạch hơn
5. Phơi trong bóng râm, nơi thoáng gió

> Nếu chỉ áp dụng được một điều duy nhất, hãy chọn: giặt sớm và phơi trong bóng râm.

## Xử lý vết vàng đã có

- **Vết nhẹ** — ngâm nước ấm pha baking soda 30 phút trước khi giặt
- **Vết ở nách** — bôi hỗn hợp baking soda và nước cốt chanh, để 1 giờ rồi giặt
- **Vết nặng lâu ngày** — thực tế rất khó phục hồi hoàn toàn, nên phòng vẫn hơn chữa

## Về việc là ủi

Là ở nhiệt độ trung bình khi áo còn hơi ẩm. Là áo khô hoàn toàn ở nhiệt độ cao sẽ làm bóng vải và không thể hồi phục.

Xem [các mẫu áo thun](/products) tại IKA Fashion.`,
  },
  {
    title: 'IKA Fashion khai trương cửa hàng thứ 5',
    slug: 'ika-fashion-khai-truong-cua-hang-thu-5',
    img: '/banners/tin-tuc/blog-khai-truong.jpeg',
    excerpt: 'Không gian mới tại trung tâm thành phố sẽ mở cửa đón khách từ đầu tháng tới, kèm nhiều ưu đãi trong tuần khai trương.',
    author: 'IKA Fashion',
    categorySlug: 'tin-cua-hang',
    status: 'published',
    date: '2026-08-04',
    content: `Chúng tôi vui mừng thông báo cửa hàng thứ 5 của IKA Fashion sắp chính thức đi vào hoạt động.

## Không gian mới có gì khác

Đây là cửa hàng lớn nhất trong hệ thống tính đến hiện tại, với diện tích gấp đôi các chi nhánh trước.

- Khu thử đồ được thiết kế lại rộng và riêng tư hơn
- Khu vực chỉnh sửa quần áo tại chỗ
- Góc tư vấn phối đồ với nhân viên được đào tạo riêng
- Chỗ ngồi chờ thoải mái cho người đi cùng

> Chúng tôi muốn cửa hàng là nơi bạn thấy thoải mái khi dành thời gian, không chỉ là nơi mua rồi đi.

![Cửa hàng mới](/banners/banner-about-mobile.jpeg)

## Ưu đãi tuần khai trương

1. Giảm giá cho toàn bộ sản phẩm trong tuần đầu tiên
2. Quà tặng cho 100 khách hàng đầu tiên mỗi ngày
3. Miễn phí chỉnh sửa quần áo cho mọi đơn hàng
4. Tích điểm nhân đôi cho khách hàng thành viên

Chi tiết chương trình sẽ được cập nhật tại [trang ưu đãi](/khuyen-mai).

## Thông tin liên hệ

Thời gian mở cửa dự kiến từ 9h00 đến 21h30 tất cả các ngày trong tuần.

Địa chỉ cụ thể và bản đồ chỉ đường sẽ được công bố tại [trang liên hệ](/contact) trước ngày khai trương một tuần.

*Cảm ơn bạn đã đồng hành cùng IKA Fashion trong suốt thời gian qua.*`,
  },
  {
    title: 'Bộ sưu tập xuân hè 2027 — hé lộ đầu tiên',
    slug: 'bo-suu-tap-xuan-he-2027-he-lo-dau-tien',
    img: '/banners/banner-contact.png',
    excerpt: 'Bài viết đang soạn, chưa công bố. Dùng để kiểm tra trạng thái nháp không lộ ra trang công khai.',
    author: 'IKA Fashion',
    categorySlug: 'tin-cua-hang',
    status: 'draft',
    date: '2026-08-07',
    content: `Đây là bài viết ở trạng thái **nháp**.

## Mục đích

Bài này tồn tại để kiểm chứng rằng bài nháp:

- Không xuất hiện ở danh sách công khai
- Không truy cập được qua đường dẫn trực tiếp
- Vẫn hiện đầy đủ trong dashboard admin

> Nếu bạn đọc được bài này ở trang công khai thì đó là lỗi.

Nội dung thật sẽ được cập nhật trước ngày công bố bộ sưu tập.`,
  },
];
