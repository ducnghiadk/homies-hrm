# Master Spec - KPI & Phát triển nhân viên Homies

Ngày lập: 2026-08-23  
Trạng thái: Chờ người dùng duyệt spec  
Phạm vi: Toàn bộ hành trình từ thiết lập chương trình đánh giá đến danh sách sẵn sàng tăng bậc  
Đối tượng triển khai: Antigravity hoặc AI Code làm lần lượt theo 5 giai đoạn, không làm toàn bộ trong một pass

## 1. Tóm tắt quyết định sản phẩm

Module không tiếp tục được trình bày như một công cụ kỹ thuật để tự xây “bộ luật KPI”. Tên và tư duy sản phẩm đổi thành **KPI & Phát triển nhân viên**.

Người dùng bắt đầu bằng câu hỏi dễ hiểu:

> Bạn muốn dùng KPI để làm gì?

Admin chọn một mục tiêu chính và có thể chọn thêm mục tiêu đi kèm. Phần mềm dùng bộ chuẩn ngành trà sữa Việt Nam để dựng sẵn chương trình. Admin chủ yếu tick lựa chọn, xác nhận con số và xem trước; tiêu chí, trọng số, target và ngoại lệ nằm trong phần nâng cao.

Luồng tổng thể đã duyệt:

`Chọn mục tiêu -> Chọn lộ trình -> Chọn cách đánh giá -> Chọn điều kiện đạt -> Xem trước & áp dụng`

Sau khi áp dụng:

`Nhật ký vận hành -> Đánh giá tháng -> 360 cửa hàng theo quý -> Sẵn sàng được xét -> Quản lý đề xuất -> Trụ sở duyệt -> Kiểm tra/thử vai -> Quyết định tăng bậc`

## 2. RPM Canvas
 
### 2.1. RESULT

Admin lần đầu sử dụng có thể hiểu và thiết lập một chương trình đánh giá trong tối đa 10 phút mà không cần tự viết tiêu chí hoặc hiểu cấu trúc dữ liệu KPI.

Điều kiện đạt:

- hoàn thành đủ 5 bước;
- biết chương trình dùng để quyết định việc gì;
- biết ai được áp dụng;
- biết dữ liệu đánh giá đến từ đâu;
- biết điều kiện nào đưa nhân viên vào danh sách sẵn sàng tăng bậc;
- xem được bản mô phỏng trước khi áp dụng.

### 2.2. HARD RESULT

Trong demo bán hàng, người mua tạo được chương trình “Xét lên bậc/thăng chức” bằng bộ chuẩn Homies trong tối đa 5 phút và xem ngay một hồ sơ nhân viên mẫu với trạng thái đạt/chưa đạt từng điều kiện.

### 2.3. PURPOSE

Khách hàng phải cảm thấy phần mềm hiểu hoạt động của chuỗi trà sữa Việt Nam, không bắt họ học lý thuyết KPI và không yêu cầu họ tự xây hệ thống từ đầu. Trải nghiệm demo phải tạo đủ niềm tin để khách hàng muốn mua và triển khai ngay.

### 2.4. FMA - Nếu làm không đúng

- Admin không biết bắt đầu từ đâu và bỏ dở thiết lập.
- Các trang KPI tiếp tục rời rạc, mỗi trang đúng một phần nhưng không tạo thành hành trình.
- Quản lý cửa hàng ngại đánh giá vì form dài và không hiểu kết quả dùng để làm gì.
- Nhân viên nghi ngờ tính công bằng của đánh giá đồng nghiệp hoặc quản lý.
- Cửa hàng ít người có thể nâng điểm lẫn nhau hoặc làm lộ người đánh giá.
- Người mua demo thấy sản phẩm phức tạp, không khác biệt và không chốt mua.

## 3. Nguyên tắc bắt buộc

1. **Bắt đầu từ mục đích, không bắt đầu từ cấu hình.**
2. **Dùng tiếng Việt vận hành.** Không đưa các từ như rubric, target profile, snapshot hoặc override ra màn hình phổ thông.
3. **Có sẵn bộ chuẩn ngành.** Không yêu cầu tự nhập tiêu chí từ trang trắng.
4. **Một màn hình chỉ có một quyết định chính.**
5. **Cấu hình nâng cao luôn là tùy chọn.** Người dùng phổ thông có thể hoàn tất mà không mở phần này.
6. **Điểm phải có bằng chứng.** Nhật ký vận hành và dữ liệu ca là nguồn chính; nhận xét con người không được đứng một mình khi có dữ liệu đối chiếu.
7. **Tách thưởng với thăng tiến.** Thưởng phản ánh kết quả tháng; thăng tiến phản ánh sự ổn định và khả năng làm việc của cấp tiếp theo.
8. **360 cửa hàng không được biến thành điểm cá nhân.** Nó là ảnh chụp sức khỏe vận hành và chỉ chặn thăng tiến khi có cảnh báo nghiêm trọng đã được xác minh.
9. **Đủ điều kiện không đồng nghĩa tự động tăng bậc.** Hệ thống chỉ đưa vào hàng chờ xét.
10. **Mọi chính sách đã áp dụng đều có phiên bản.** Thay đổi mới không làm đổi kết quả quá khứ.

## 4. Thuật ngữ hiển thị cho người dùng

| Thuật ngữ kỹ thuật | Tên hiển thị |
|---|---|
| KPI Set / Policy | Chương trình đánh giá |
| Template | Bộ chuẩn có sẵn |
| Criterion | Nội dung đánh giá |
| Weight | Mức độ quan trọng |
| Target | Mục tiêu cần đạt |
| Store override | Điều chỉnh riêng cho cửa hàng |
| Evaluation | Phiếu đánh giá tháng |
| Promotion eligibility | Điều kiện sẵn sàng tăng bậc |
| Promotion candidate | Nhân viên sẵn sàng được xét |
| Peer review | Đồng nghiệp góp ý ẩn danh |
| Store 360 | Khảo sát 360 toàn cửa hàng |
| Blocker | Điều kiện đang chặn |
| Challenge | Giai đoạn thử vai |

Không thay đổi tên dữ liệu nội bộ chỉ để đổi câu chữ UI. Lớp hiển thị phải dịch thuật ngữ kỹ thuật thành ngôn ngữ vận hành.

## 5. Kiến trúc thông tin và menu

Module được trình bày dưới một nhóm menu duy nhất: **KPI & Phát triển**.

### 5.1. Menu phổ thông

1. **Tổng quan KPI**  
   Trả lời: Tháng này tình hình thế nào và tôi cần làm gì tiếp theo?

2. **Việc cần đánh giá**  
   Trả lời: Hôm nay tôi cần đánh giá hoặc xác nhận cho ai?

3. **Kết quả & cải thiện**  
   Trả lời: Nhân viên làm tốt ở đâu, cần cải thiện gì và tháng sau tập trung vào đâu?

4. **Sẵn sàng tăng bậc**  
   Trả lời: Ai đã đủ điều kiện, ai còn thiếu gì và ai đang bị chặn?

5. **Chương trình đánh giá**  
   Chỉ CEO/HR Admin thấy. Dùng để thiết lập, xem phiên bản và công bố chính sách.

### 5.2. Xử lý các route hiện tại

Các route hiện tại như `/kpi`, `/kpi/periods`, `/kpi/review`, `/kpi/result`, `/kpi/settings`, `/kpi/promotion`, `/kpi/development/tests` và `/kpi/development/challenges` có thể tiếp tục tồn tại phía sau.

Không xóa hoặc đổi route trong giai đoạn đầu. Lớp điều hướng mới phải đưa người dùng đến đúng việc cần làm và che bớt cấu trúc kỹ thuật. Việc gom route vật lý chỉ được xem xét sau khi flow mới đã ổn định.

## 6. Vai trò và quyền

| Vai trò | Quyền chính |
|---|---|
| CEO | Xem toàn chuỗi, duyệt chính sách, duyệt tăng bậc và quyết định lương |
| HR Admin | Tạo chương trình, cấu hình, mở chu kỳ, theo dõi hoàn thành và chuẩn bị hồ sơ duyệt |
| Area Manager | Rà soát bất thường, hiệu chỉnh giữa cửa hàng, xử lý cửa hàng ít người và đề xuất/duyệt theo phân cấp |
| Store Manager | Xem mục tiêu cửa hàng, xác nhận kết quả tháng, phản hồi nhân viên và đề xuất tăng bậc |
| Shift Leader | Ghi nhật ký ca, đánh giá nhân viên được giao và theo dõi cải thiện |
| Employee | Xem tiêu chí của mình, làm tự đánh giá nếu được bật, góp ý ẩn danh khi được chọn, xem kết quả và phản hồi |

### 6.1. Quyền riêng tư bắt buộc

- Nhân viên không thấy danh tính đồng nghiệp đã đánh giá mình.
- Shift Leader và Store Manager không thấy từng phiếu đồng nghiệp nếu số lượng phản hồi chưa đủ ngưỡng ẩn danh.
- Area Manager/HR Admin chỉ được mở danh tính phục vụ điều tra đã ghi nhận lý do; thao tác này phải có audit log.
- Người đánh giá không được xem điểm của người khác trước khi gửi phiếu của mình.
- Người dùng chỉ xem dữ liệu cửa hàng thuộc phạm vi quyền, trừ CEO/HR Admin.

## 7. Chương trình đánh giá - Flow thiết lập 5 bước

### 7.1. Trang bắt đầu

Tiêu đề:

> Tạo chương trình đánh giá

Mô tả:

> Trả lời 5 câu hỏi. Homies sẽ chuẩn bị sẵn tiêu chí, cách đánh giá và điều kiện xét phù hợp.

Hai hành động:

- **Bắt đầu thiết lập** - hành động chính.
- **Dùng nhanh bộ chuẩn Homies** - điền sẵn nguồn đánh giá và điều kiện; nếu chưa có phạm vi/lộ trình thì chỉ hỏi phần bắt buộc này, sau đó chuyển đến xem trước.

Không hiển thị bảng trọng số, slider hoặc ma trận target ở trang đầu.

### 7.2. Bước 1 - Bạn muốn dùng KPI để làm gì?

Admin chọn một mục tiêu chính và có thể tick thêm mục tiêu đi kèm.

Danh sách V1:

- Xét lên bậc/thăng chức.
- Thưởng KPI hằng tháng.
- Đánh giá hết thử việc.
- Review năng lực định kỳ.
- Tìm nhu cầu đào tạo.
- Cải thiện vận hành cửa hàng.

Quy tắc:

- bắt buộc đúng một mục tiêu chính;
- các mục tiêu phụ không được làm thay đổi mục tiêu chính mà không cảnh báo;
- chọn “Xét lên bậc/thăng chức” tự bật đánh giá tháng và điều kiện tăng bậc;
- chọn “Cải thiện vận hành cửa hàng” gợi ý bật 360 cửa hàng theo quý;
- phần mềm giải thích một câu ngắn dưới mỗi lựa chọn.

Nút tiếp tục chỉ bật khi đã có mục tiêu chính.

### 7.3. Bước 2 - Ai được áp dụng và đang đi theo lộ trình nào?

Admin chọn:

- phạm vi cửa hàng: toàn chuỗi, nhóm cửa hàng hoặc cửa hàng cụ thể;
- chức danh/cấp hiện tại;
- cấp tiếp theo;
- ngày bắt đầu áp dụng;
- có áp dụng cho nhân viên thử việc hay không.

Lộ trình kinh doanh mặc định:

1. Thử việc -> Chính thức.
2. Chính thức -> Nhân viên nòng cốt.
3. Nhân viên nòng cốt -> Shift Leader/Tổ trưởng.
4. Shift Leader -> Giám sát.
5. Giám sát -> Quản lý cửa hàng.
6. Quản lý cửa hàng -> Quản lý khu vực.

Lưu ý kỹ thuật: không hard-code lộ trình này vào `KpiLevelCode` hiện tại. Hệ thống phải lấy chức danh/cấp bậc từ master data và lưu ID ổn định. Cần có lớp mapping tương thích dữ liệu KPI cũ.

Nếu Admin chọn nhiều chức danh, phần mềm tạo chính sách theo từng chức danh nhưng giữ chung một chương trình và cùng mục tiêu kinh doanh.

### 7.4. Bước 3 - Đánh giá bằng những nguồn nào?

Danh sách lựa chọn:

- Nhật ký vận hành và dữ liệu thực tế - bật mặc định.
- Shift Leader đánh giá - bật mặc định.
- Hai đồng nghiệp góp ý ẩn danh - bật mặc định cho cấp nhân viên.
- Nhân viên tự đánh giá - tùy chọn.
- Store Manager xác nhận cuối tháng - bật mặc định.
- Area Manager/quản lý cấp trên xác nhận - gợi ý cho cấp quản lý cửa hàng.
- Đánh giá 360 toàn cửa hàng theo quý - bật mặc định nếu mục tiêu liên quan thăng tiến cấp quản lý hoặc cải thiện cửa hàng.
- Bài kiểm tra tay nghề - gợi ý theo lộ trình.
- Giai đoạn thử vai - gợi ý từ cấp Shift Leader trở lên.

Admin tick nguồn muốn dùng. Phần mềm hiển thị mô tả ngắn về tác dụng, không hiển thị công thức kỹ thuật ngay.

Nguyên tắc tính:

- Kết quả cuối vẫn được tính theo các nội dung đánh giá và mức độ quan trọng của chức danh.
- Nhật ký/dữ liệu tự động tạo điểm gợi ý cho nội dung có nguồn đo được.
- Shift Leader xác nhận hoặc chấm nội dung con người; nếu sửa lệch khỏi dữ liệu gợi ý vượt ngưỡng, bắt buộc ghi lý do.
- Đồng nghiệp chỉ được góp ý cho nhóm phối hợp, chủ động và hỗ trợ đội nhóm; tổng mức ảnh hưởng không vượt 15% toàn bộ điểm tháng.
- Đồng nghiệp không được chấm doanh thu, tiền bạc, chấm công, vệ sinh hoặc lỗi nghiệp vụ mà họ không có bằng chứng.
- Store Manager là người xác nhận, không tự cộng thêm một lớp điểm mới.

Phần “Tùy chỉnh nâng cao” cho phép xem/chỉnh tiêu chí, trọng số, target nhóm cửa hàng và ngoại lệ. Các cấu hình Task 1-8 hiện có được giữ và đưa vào khu vực này.

### 7.5. Bước 4 - Khi nào được xem là sẵn sàng tăng bậc?

Màn hình dùng câu hoàn chỉnh, ví dụ:

> Nhân viên được đưa vào danh sách sẵn sàng khi đạt loại Làm tốt trở lên trong 3 tháng liên tiếp, hoàn thành kỹ năng bắt buộc và không có lỗi nghiêm trọng.

Admin chỉnh bằng control đơn giản:

- số tháng cần đạt;
- liên tiếp hoặc đạt X/Y tháng gần nhất;
- xếp loại tối thiểu;
- số ca hoặc số giờ tối thiểu để tháng hợp lệ;
- kỹ năng bắt buộc;
- điểm bài kiểm tra tối thiểu;
- số ca hoặc số tuần thử vai;
- yêu cầu 360 cửa hàng;
- lỗi chặn và thời hạn chặn;
- người đề xuất và người phê duyệt.

Bộ điều kiện mặc định V1:

| Lộ trình | Điều kiện mặc định |
|---|---|
| Thử việc -> Chính thức | 1 tháng hợp lệ từ 3.5; đạt kỹ năng cơ bản; không có lỗi nghiêm trọng |
| Chính thức -> Nhân viên nòng cốt | 3 tháng liên tiếp từ 4.0; làm độc lập; không có nội dung cốt lõi dưới 3 |
| Nhân viên nòng cốt -> Shift Leader | 3 tháng liên tiếp từ 4.0; test từ 80%; đạt checklist dẫn ca; thử ít nhất 4 ca |
| Shift Leader -> Giám sát | Đạt ít nhất 5/6 tháng; trung bình từ 4.2; 360 không có cảnh báo nghiêm trọng; thử vai 4 tuần |
| Giám sát -> Quản lý cửa hàng | Đạt ít nhất 6/8 tháng; cửa hàng đạt mục tiêu ít nhất 4/6 tháng; đạt năng lực quản lý; thử vai 4-8 tuần |
| Quản lý cửa hàng -> Quản lý khu vực | Đạt ít nhất 9/12 tháng; hai kỳ 360 ổn định; có người kế nhiệm; chứng minh quản lý nhiều cửa hàng |

Mọi giá trị trên là mẫu có sẵn và Admin được chỉnh theo chính sách từng giai đoạn.

### 7.6. Bước 5 - Xem trước và áp dụng

Màn hình review phải trả lời được:

- Chương trình dùng để làm gì?
- Áp dụng cho ai và cửa hàng nào?
- Hằng tháng ai đánh giá ai?
- Dữ liệu nào được dùng?
- Khi nào nhân viên được đưa vào danh sách sẵn sàng?
- Ai đề xuất và ai duyệt?
- Có cảnh báo cấu hình nào không?

Có khối mô phỏng một nhân viên mẫu:

- kết quả 3 tháng gần nhất;
- số ca/giờ hợp lệ;
- kỹ năng đã đạt/chưa đạt;
- lỗi chặn;
- kết quả 360 liên quan;
- kết luận `Chưa đủ điều kiện`, `Sắp đủ điều kiện`, `Sẵn sàng được xét`.

Hành động:

- **Áp dụng ngay**.
- **Lên lịch áp dụng**.
- **Lưu bản nháp**.
- **Quay lại chỉnh**.

Không cho công bố nếu còn lỗi chặn. Sau khi công bố, chương trình bị khóa; thay đổi phải tạo phiên bản mới.

## 8. Đánh giá nhân viên hằng tháng

### 8.1. Dòng thời gian

1. Trong tháng: nhật ký vận hành, dữ liệu ca và sự cố được ghi nhận.
2. Mỗi tuần: hệ thống nhắc quản lý các lỗi lặp lại để phản hồi sớm.
3. Cuối tháng: hệ thống kiểm tra tháng hợp lệ và tạo phiếu đánh giá.
4. Hệ thống chọn hai đồng nghiệp đủ điều kiện và giao phiếu ẩn danh.
5. Shift Leader hoàn thành đánh giá có bằng chứng.
6. Store Manager rà soát bất thường và xác nhận.
7. Nhân viên nhận kết quả, điểm mạnh, điểm cần cải thiện và trọng tâm tháng sau.
8. Nhân viên có thể phản hồi trong thời hạn quy định.
9. Khi chốt, kết quả được dùng cho thưởng tháng và cập nhật hồ sơ tăng bậc.

### 8.2. Tháng hợp lệ

Mặc định một tháng hợp lệ khi nhân viên có ít nhất:

- 12 ca; hoặc
- 60 giờ công hợp lệ.

Admin có thể chỉnh theo nhóm nhân viên full-time/part-time.

Nếu không đủ dữ liệu vì nghỉ phép hợp lệ, nghỉ dài ngày được duyệt hoặc mới vào giữa tháng:

- tháng có trạng thái `Tạm dừng theo dõi`;
- không tính là đạt;
- không tính là trượt;
- không phá chuỗi tháng liên tiếp.

Nếu thiếu dữ liệu do quản lý không hoàn thành đánh giá, không được phạt nhân viên. Hệ thống phải đưa vào hàng chờ quá hạn của quản lý.

### 8.3. Xếp loại tháng

Giữ khung chính sách đã có:

| Điểm | Xếp loại | Ý nghĩa |
|---|---|---|
| Dưới 3.0 | Cần cải thiện | Chưa đạt chuẩn tháng |
| 3.0 đến dưới 4.0 | Hoàn thành | Hoàn thành cơ bản, còn điểm cần cải thiện |
| 4.0 đến dưới 4.8 | Làm tốt | Đạt chuẩn tốt và ổn định |
| Từ 4.8 | Vượt mong đợi | Nổi bật, ổn định và có đóng góp vượt chuẩn |

Ngưỡng thưởng có thể dùng chính sách riêng nhưng không được làm thay đổi điểm gốc đã chốt.

### 8.4. Phiếu kết quả nhân viên

Nhân viên không phải đọc bảng tính chi tiết. Phiếu cần có:

- điểm và xếp loại;
- so sánh với tháng trước;
- 2 điểm mạnh có bằng chứng;
- tối đa 2 điểm cần cải thiện;
- một trọng tâm tháng sau;
- trạng thái hành trình tăng bậc;
- nút `Xem bằng chứng`;
- nút `Gửi phản hồi`.

Không hiển thị tên hoặc câu chữ nguyên văn có thể làm lộ đồng nghiệp đánh giá. Nhận xét đồng nghiệp phải được tổng hợp và làm sạch thông tin nhận diện.

## 9. Chọn hai đồng nghiệp đánh giá ẩn danh

### 9.1. Điều kiện đủ để được chọn

Một đồng nghiệp chỉ đủ điều kiện nếu:

- có làm chung tối thiểu 3 ca hoặc 12 giờ trong kỳ;
- không phải chính nhân viên được đánh giá;
- không phải người quản lý trực tiếp đang chấm phiếu chính;
- chưa vượt số phiếu tối đa được giao trong kỳ;
- không có xung đột quyền lợi đã được đánh dấu trong hệ thống;
- đã làm việc đủ lâu để có quan sát thực tế.

### 9.2. Cách chọn

- Ưu tiên người có nhiều thời gian làm chung hơn.
- Không luôn chọn cùng một cặp qua nhiều tháng.
- Cân bằng số phiếu giữa nhân viên đủ điều kiện.
- Không cho nhân viên hoặc Shift Leader tự chọn người chấm.
- Lưu lý do lựa chọn ở audit log nhưng không hiển thị cho người được đánh giá.

### 9.3. Cửa hàng ít người

Kích hoạt `Chế độ cửa hàng ít người` khi:

- cửa hàng có dưới 5 nhân viên hoạt động; hoặc
- danh sách người đủ điều kiện dưới 4 người.

Trong chế độ này:

- không dùng điểm đồng nghiệp làm điểm số trực tiếp;
- góp ý đồng nghiệp chỉ là nhận xét định tính được tổng hợp theo quý;
- Area Manager hoặc quản lý cấp trên thay thế phần xác nhận độc lập;
- nhân viên không bị giảm điểm vì hệ thống không đủ người đánh giá;
- không hiển thị kết quả theo cách có thể suy ra danh tính.

### 9.4. Chống nâng điểm lẫn nhau

Hệ thống gắn cờ để Area Manager rà soát khi có một hoặc nhiều tín hiệu:

- hai người liên tục chấm điểm tối đa cho nhau;
- điểm đồng nghiệp cao hơn dữ liệu vận hành/Shift Leader từ 1.0 điểm trở lên trong từ 2 kỳ;
- phần lớn cửa hàng cùng chấm một mức điểm bất thường;
- một người luôn chấm cao hoặc thấp hơn mặt bằng;
- nội dung nhận xét trùng lặp hoặc quá chung chung;
- điểm rất cao nhưng không có ví dụ hoặc bằng chứng.

Cờ bất thường không tự động kết luận gian lận và không tự động trừ điểm. Area Manager phải xem dữ liệu, ghi kết luận và lưu audit log.

## 10. Khảo sát 360 toàn cửa hàng theo quý

### 10.1. Mục đích

Đánh giá sức khỏe vận hành của toàn cửa hàng, không chấm riêng từng nhân viên.

Nhóm nội dung V1:

- phối hợp trong ca;
- cách giao việc và hỗ trợ của quản lý;
- công bằng và tôn trọng;
- đào tạo và hướng dẫn;
- vệ sinh, an toàn và tuân thủ;
- áp lực công việc và bố trí nhân sự;
- trải nghiệm khách hàng;
- khả năng xử lý và học từ lỗi.

### 10.2. Người tham gia

Admin được tick:

- nhân viên tự phản ánh trải nghiệm;
- Shift Leader;
- Store Manager;
- Area Manager;
- bộ phận hỗ trợ/đào tạo nếu có.

### 10.3. Bảo vệ ẩn danh

- Chỉ hiển thị kết quả khi có tối thiểu 5 phản hồi hợp lệ.
- Nếu dưới ngưỡng, gộp theo quý tiếp theo hoặc hiển thị cho Area Manager dưới dạng `Chưa đủ mẫu`.
- Không hiển thị câu trả lời có thông tin nhận diện trực tiếp.
- Không cho Store Manager truy cập danh tính người trả lời.

### 10.4. Tác động đến tăng bậc

- Kết quả 360 bình thường chỉ là bối cảnh và gợi ý cải thiện.
- Không cộng/trừ trực tiếp vào điểm tháng của nhân viên.
- Chỉ tạm chặn hồ sơ tăng bậc khi có cảnh báo nghiêm trọng đã được xác minh: gian lận, an toàn thực phẩm, bao che lỗi, trả đũa người góp ý hoặc môi trường làm việc không an toàn.
- Người có hồ sơ bị chặn phải được biết lý do ở mức phù hợp, người xử lý và thời hạn rà soát lại.

## 11. Hồ sơ sẵn sàng tăng bậc

### 11.1. Ba trạng thái dễ hiểu

1. **Chưa đủ điều kiện** - còn nhiều điều kiện bắt buộc chưa đạt.
2. **Sắp đủ điều kiện** - thiếu tối đa một tháng hoặc một bước kỹ năng/test/thử vai.
3. **Sẵn sàng được xét** - đạt toàn bộ điều kiện lọc và được đưa vào hàng chờ đề xuất.

Không dùng từ `Đạt thăng tiến` trước khi trụ sở ra quyết định.

### 11.2. Hồ sơ phải hiển thị

- cấp hiện tại và cấp đề xuất;
- số tháng đã đạt / yêu cầu;
- cách tính liên tiếp hoặc X/Y tháng;
- số ca/giờ hợp lệ;
- các kỹ năng bắt buộc;
- bài kiểm tra;
- thử vai;
- lỗi chặn và thời hạn;
- trạng thái 360 liên quan;
- nhận xét phát triển;
- người đề xuất, người duyệt và lịch sử hành động.

### 11.3. Trường hợp chuyển cửa hàng hoặc làm nhiều chi nhánh

- Kết quả cá nhân đi theo nhân viên, không bị xóa khi chuyển cửa hàng.
- Dữ liệu tháng có thể tổng hợp theo tỷ trọng giờ/ca thực tế tại từng cửa hàng.
- Chính sách áp dụng được xác định theo phiên bản có hiệu lực tại thời điểm làm việc.
- Nếu chuyển chức danh giữa tháng, tháng đó được đánh dấu cần HR xác nhận trước khi tính vào chuỗi.

### 11.4. Lỗi chặn

Các nhóm mặc định:

- trung thực/gian lận;
- tiền bạc;
- an toàn thực phẩm;
- cố tình che giấu lỗi;
- thái độ nghiêm trọng với khách;
- xung đột hoặc trả đũa nội bộ;
- vi phạm kỷ luật nghiêm trọng.

Mỗi lỗi chặn cần có:

- mức độ;
- ngày bắt đầu;
- thời hạn chặn;
- bằng chứng;
- người xác nhận;
- trạng thái khiếu nại;
- ngày được xét lại.

## 12. Quy trình đề xuất và phê duyệt

Luồng mặc định:

1. Hệ thống đưa nhân viên vào `Sẵn sàng được xét`.
2. Store Manager/Area Manager mở hồ sơ và đề xuất.
3. Hệ thống kiểm tra lại dữ liệu mới nhất.
4. Nhân viên làm bài test nếu lộ trình yêu cầu.
5. CEO/HR duyệt cho thử vai.
6. Nhân viên chạy thử vai và có checkpoint.
7. Quản lý đánh giá cuối kỳ thử vai.
8. CEO/HR ra quyết định tăng bậc và mức lương.
9. Hệ thống lưu quyết định, ngày hiệu lực và thông báo cho bên liên quan.

Luồng này tái sử dụng promotion, test, challenge và salary service hiện có. Không tạo một pipeline thứ hai song song.

## 13. Trải nghiệm Tổng quan KPI

Dashboard không ưu tiên các con số trang trí. Nội dung theo vai trò:

### CEO/HR Admin

- chương trình nào chưa hoàn tất thiết lập;
- tỷ lệ hoàn thành đánh giá toàn chuỗi;
- cửa hàng quá hạn;
- cửa hàng có cờ bất thường;
- số nhân viên sẵn sàng được xét;
- hồ sơ đang chờ duyệt;
- cảnh báo 360 nghiêm trọng.

### Area/Store Manager

- việc cần làm hôm nay;
- nhân viên chưa có đủ dữ liệu;
- phiếu cần xác nhận;
- nhân viên cần phản hồi cải thiện;
- nhân viên sắp đủ điều kiện tăng bậc;
- cảnh báo cần rà soát.

### Employee

- tiêu chí tháng này;
- tiến độ dữ liệu;
- việc cần tự đánh giá/góp ý;
- kết quả gần nhất;
- trọng tâm cải thiện;
- hành trình cấp bậc và điều kiện còn thiếu.

## 14. Trạng thái và thông báo

### 14.1. Trạng thái chương trình

`Bản nháp -> Đã lên lịch -> Đang áp dụng -> Đã thay thế -> Lưu trữ`

### 14.2. Trạng thái phiếu tháng

`Chưa đủ dữ liệu -> Chờ đồng nghiệp -> Chờ Shift Leader -> Chờ quản lý xác nhận -> Chờ nhân viên phản hồi -> Đã chốt`

### 14.3. Trạng thái 360

`Đang thu thập -> Chưa đủ mẫu -> Chờ rà soát -> Đã công bố kết quả -> Đang xử lý cảnh báo -> Đã đóng`

### 14.4. Nguyên tắc thông báo

- Thông báo phải nói rõ ai cần làm gì và hạn khi nào.
- Không gửi điểm hoặc nội dung nhạy cảm qua notification preview.
- Nhắc theo cấp: người thực hiện -> quản lý trực tiếp -> Area/HR khi quá hạn.
- Không spam nhắc lại nếu người dùng đã hoàn thành.

## 15. Dữ liệu và khả năng tương thích

### 15.1. Khối dữ liệu mới cần có

Tên dưới đây là khái niệm; AI Code phải đối chiếu convention hiện tại trước khi đặt tên type/table cuối cùng.

1. `KpiProgram` - mục tiêu chính/phụ, phạm vi và phiên bản chương trình.
2. `KpiPromotionRule` - điều kiện theo từng lộ trình cấp bậc.
3. `KpiEvaluationSourcePolicy` - nguồn đánh giá được bật và luật áp dụng.
4. `KpiPeerAssignment` - người được giao đánh giá, lý do chọn và trạng thái.
5. `KpiPeerResponse` - phiếu ẩn danh, điểm giới hạn và nhận xét.
6. `KpiPeerAnomalyFlag` - tín hiệu bất thường và kết luận rà soát.
7. `KpiStore360Cycle` - kỳ khảo sát 360 của cửa hàng.
8. `KpiStore360Response` - phản hồi ẩn danh.
9. `KpiStore360Finding` - kết luận/cảnh báo đã tổng hợp.
10. `KpiMonthlyValidity` - số ca/giờ, trạng thái hợp lệ/tạm dừng và lý do.
11. `KpiPromotionReadiness` - snapshot điều kiện đã đạt/chưa đạt.
12. `KpiReviewAuditEvent` - nhật ký truy cập danh tính, chỉnh điểm, xác nhận và duyệt.

### 15.2. Tái sử dụng dữ liệu hiện có

- `KpiSetVersion`, template F&B, group, criterion, target profile và store override tiếp tục là cấu hình chấm chi tiết.
- `KpiPeriod` và `KpiEvaluation` tiếp tục là lõi kỳ đánh giá tháng.
- Incident/appeal tiếp tục là nguồn lỗi chặn và khiếu nại.
- Development, promotion, test, challenge và salary service tiếp tục là pipeline sau khi đủ điều kiện.

### 15.3. Quy tắc migration

- Trường mới phải optional hoặc có default trong giai đoạn local-first để dữ liệu mock/localStorage cũ vẫn đọc được.
- Không thay đổi ngược dữ liệu lịch sử đã chốt.
- Không hard-code cấp bậc mới vào type cũ nếu master data đã có ID chức danh.
- Cần adapter chuyển chương trình cũ thành mục tiêu mặc định `Đánh giá & thưởng tháng` khi mở lần đầu.
- Supabase migration chỉ thực hiện ở giai đoạn có spec dữ liệu riêng và được duyệt vì đây là thay đổi RED.

## 16. 5D Impact Assessment

| Khu vực | Bị ảnh hưởng | Mức độ | Giải thích |
|---|---|---|---|
| UX | Có | RED | Đổi hành trình từ cấu hình kỹ thuật sang mục tiêu kinh doanh và gom các bước vận hành |
| UI | Có | RED | Thêm hub, wizard 5 bước, hàng chờ đánh giá, 360 và readiness |
| FE/BE logic | Có | RED | Thêm chọn người chấm, luật tháng hợp lệ, chống bất thường và điều kiện tăng bậc |
| Data | Có | RED | Cần các khối dữ liệu mới và migration tương thích |
| Security | Có | RED | Bảo vệ danh tính người đánh giá và giới hạn truy cập theo phạm vi |

Stop-rule đã được kích hoạt và người dùng đã chọn A ngày 2026-08-23 để cho phép viết Master Spec. Việc triển khai code vẫn phải xác nhận theo từng giai đoạn.

## 17. Trường hợp đặc biệt bắt buộc xử lý

- Không đủ hai đồng nghiệp hợp lệ.
- Cửa hàng quá ít người để giữ ẩn danh.
- Người đánh giá nghỉ việc hoặc chuyển cửa hàng giữa kỳ.
- Quản lý không hoàn thành đánh giá đúng hạn.
- Hai người chấm điểm cao qua lại.
- Điểm đồng nghiệp mâu thuẫn mạnh với dữ liệu vận hành.
- Nhân viên nghỉ phép hoặc không đủ giờ.
- Nhân viên làm nhiều chi nhánh.
- Nhân viên đổi chức danh/chuyển cửa hàng giữa tháng.
- Chính sách mới có hiệu lực giữa kỳ.
- Có khiếu nại chưa xử lý khi kỳ cần chốt.
- Lỗi nghiêm trọng xuất hiện sau khi nhân viên vừa đủ điều kiện.
- Kỳ 360 chưa đủ mẫu.
- Quản lý cửa hàng là đối tượng bị phản ánh trong 360.
- Nhân viên đạt điểm nhưng chưa hoàn thành kỹ năng/test/thử vai.
- Nhân viên đã đủ điều kiện nhưng vị trí chưa có nhu cầu bổ nhiệm.

## 18. Phi chức năng

- Autosave bản nháp và hiển thị thời điểm lưu gần nhất.
- Không mất dữ liệu khi chuyển bước hoặc reload.
- Mỗi danh sách dài phải có tìm kiếm, lọc và phân trang/virtualization phù hợp.
- Bảng ma trận chỉ dùng trong nâng cao và có cuộn ngang chủ đích trên mobile.
- Không hiển thị danh tính nhạy cảm trong log client hoặc thông báo.
- Mọi thay đổi điểm sau khi có dữ liệu gợi ý phải có actor, thời gian và lý do.
- Kết quả đã chốt phải dùng snapshot, không tính lại theo chính sách mới.
- UI theo `DESIGN_RULE_HOMIES_FINAL.md`: nền kem, card trắng, phân cấp rõ, số liệu dùng font mono/tabular, không dùng emoji.
- Nội dung chính phải dùng tiếng Việt có dấu, ngắn và theo hành động.

## 19. Chia 5 giai đoạn triển khai

### Giai đoạn 1 - Trung tâm KPI và flow thiết lập mới

Mục tiêu:

- đổi lớp trải nghiệm thành `KPI & Phát triển`;
- tạo wizard 5 bước bắt đầu từ mục tiêu;
- bọc cấu hình Task 1-8 hiện có vào phần nâng cao;
- có review/mô phỏng và công bố an toàn;
- chưa triển khai peer review hoặc 360 thật.

Điều kiện demo: Admin dùng bộ chuẩn và tạo chương trình tăng bậc trong 5 phút.

### Giai đoạn 2 - Đánh giá nhân viên hằng tháng

Mục tiêu:

- nhật ký/dữ liệu -> điểm gợi ý -> Shift Leader -> quản lý xác nhận -> nhân viên phản hồi;
- tháng hợp lệ/tạm dừng;
- phiếu kết quả dễ đọc;
- thêm peer assignment/response và chế độ cửa hàng ít người;
- thêm cờ bất thường cơ bản.

### Giai đoạn 3 - 360 toàn cửa hàng

Mục tiêu:

- tạo kỳ quý;
- thu thập ẩn danh;
- bảo vệ ngưỡng tối thiểu;
- dashboard finding và cảnh báo;
- không làm thay đổi điểm cá nhân.

### Giai đoạn 4 - Theo dõi và xét tăng bậc

Mục tiêu:

- promotion rule theo lộ trình;
- tính readiness;
- danh sách sẵn sàng được xét;
- nối vào promotion/test/challenge/salary hiện có;
- xử lý blocker, chuyển cửa hàng và tháng tạm dừng.

### Giai đoạn 5 - Demo winning và nghiệm thu

Mục tiêu:

- dữ liệu mẫu sát chuỗi trà sữa Việt Nam;
- demo end-to-end một nhân viên từ nhật ký đến sẵn sàng tăng bậc;
- responsive desktop/mobile;
- kiểm tra phân quyền/ẩn danh;
- build, test, lint, typecheck và tài liệu vận hành.

Mỗi giai đoạn phải có spec con, plan, verification và duyệt riêng trước khi sang giai đoạn tiếp theo.

## 20. Ranh giới không được làm trong một pass

- Không vừa thay navigation, vừa migration Supabase, vừa viết peer review và 360.
- Không xóa route cũ trong lúc dựng flow mới.
- Không refactor toàn bộ `src/lib/kpi` nếu chỉ cần thêm service độc lập.
- Không thay cách tính điểm lịch sử.
- Không công khai danh tính peer reviewer để thuận tiện debug.
- Không dùng AI tạo nhận xét tự động như nguồn quyết định trong V1.
- Không tự động bổ nhiệm hoặc tự động đổi lương khi đủ điều kiện.
- Không biến 360 cửa hàng thành bảng xếp hạng cửa hàng công khai.

## 21. Rollback

### Giai đoạn 1

- Giữ route và component cũ hoạt động.
- Flow mới dùng feature flag hoặc entry point mới.
- Nếu lỗi, quay lại entry cũ mà không mất `KpiSetVersion`.

### Giai đoạn 2-4

- Dữ liệu mới là khối tách riêng và tham chiếu bằng ID.
- Không ghi đè phiếu đã chốt.
- Có thể tắt peer/360/readiness theo program setting mà không xóa dữ liệu.
- Migration cần có down plan hoặc backup/export trước khi chạy.

### Nguyên tắc dữ liệu

- Không rollback bằng xóa dữ liệu sản xuất hàng loạt.
- Nếu phải ngừng tính năng, chuyển về read-only và bảo toàn audit trail.
- Mọi rollback ảnh hưởng dữ liệu cần người dùng phê duyệt riêng.

## 22. Kiểm thử và tiêu chí nghiệm thu

### 22.1. Thiết lập chương trình

- [ ] Admin chọn được một mục tiêu chính và nhiều mục tiêu phụ.
- [ ] Chọn tăng bậc tự gợi ý đúng lộ trình, nguồn và điều kiện.
- [ ] Dùng nhanh tự điền các bước có thể suy ra, chỉ hỏi phạm vi/lộ trình còn thiếu rồi chuyển đến review.
- [ ] Người dùng hoàn tất mà không mở cấu hình nâng cao.
- [ ] Cấu hình nâng cao giữ được template/criteria/target/override hiện tại.
- [ ] Công bố bị chặn khi thiếu dữ liệu bắt buộc.
- [ ] Phiên bản cũ không thay đổi sau khi có phiên bản mới.

### 22.2. Đánh giá tháng

- [ ] Nhật ký/dữ liệu hiển thị đúng dưới nội dung liên quan.
- [ ] Không đủ giờ vì nghỉ hợp lệ không phá chuỗi tháng.
- [ ] Quản lý quá hạn không làm nhân viên bị trượt.
- [ ] Peer chỉ chấm nội dung được phép và không vượt 15% ảnh hưởng.
- [ ] Phiếu kết quả có điểm mạnh, cải thiện và trọng tâm tháng sau.
- [ ] Nhân viên phản hồi bằng tình huống/ngày/ca cụ thể.

### 22.3. Ẩn danh và chống bất thường

- [ ] Không ai tự chọn peer reviewer.
- [ ] Không đủ người kích hoạt chế độ cửa hàng ít người.
- [ ] Không thể suy ra danh tính từ UI thông thường.
- [ ] Mở danh tính phục vụ điều tra có audit log.
- [ ] Điểm nâng nhau chỉ tạo cờ, không tự kết luận gian lận.

### 22.4. 360 cửa hàng

- [ ] Dưới 5 phản hồi không công bố kết quả chi tiết.
- [ ] Kết quả không cộng/trừ điểm cá nhân.
- [ ] Cảnh báo nghiêm trọng cần xác minh trước khi chặn.
- [ ] Store Manager không thấy danh tính người phản hồi.

### 22.5. Tăng bậc

- [ ] Tính đúng tháng liên tiếp và X/Y tháng.
- [ ] Tính đúng tháng tạm dừng.
- [ ] Chuyển cửa hàng không làm mất lịch sử.
- [ ] Đạt điểm nhưng thiếu test/thử vai vẫn chưa sẵn sàng.
- [ ] Đủ điều kiện chỉ vào hàng chờ, không tự bổ nhiệm.
- [ ] Pipeline tái sử dụng promotion/test/challenge/salary hiện có.

### 22.6. Phân quyền và kỹ thuật

- [ ] Employee chỉ xem dữ liệu cá nhân và việc được giao.
- [ ] Store Manager không xem cửa hàng ngoài phạm vi.
- [ ] Area Manager chỉ xem khu vực được phân quyền.
- [ ] CEO/HR có audit view phù hợp.
- [ ] Lint, unit test, typecheck và build pass cho từng giai đoạn.
- [ ] Desktop/mobile không tràn, không che drawer/modal và đọc được ở kích thước phổ biến.

## 23. Kịch bản demo bán hàng bắt buộc

Kịch bản tối đa 7 phút:

1. Admin chọn `Xét lên bậc/thăng chức`.
2. Chọn lộ trình `Nhân viên nòng cốt -> Shift Leader`.
3. Giữ nguồn mặc định: nhật ký, Shift Leader, hai peer ẩn danh và quản lý xác nhận.
4. Giữ điều kiện: 3 tháng từ 4.0, test 80%, thử dẫn 4 ca, không có lỗi nghiêm trọng.
5. Xem trước nhân viên mẫu và áp dụng.
6. Mở phiếu tháng mẫu để thấy bằng chứng, nhận xét và nội dung cải thiện.
7. Mở hồ sơ readiness để thấy rõ điều kiện đã đạt, còn thiếu và nút đề xuất.

Thông điệp kết thúc:

> Chọn mục tiêu, Homies tự dựng chương trình đánh giá. Sau mỗi tháng, phần mềm nói rõ ai làm tốt, ai cần cải thiện và ai đã sẵn sàng lên bậc.

## 24. Chỉ số theo dõi sau pilot

- Tỷ lệ Admin hoàn thành wizard.
- Thời gian trung vị để tạo chương trình.
- Tỷ lệ dùng bộ chuẩn mà không cần chỉnh nâng cao.
- Tỷ lệ phiếu đánh giá hoàn thành đúng hạn.
- Tỷ lệ phản hồi/khiếu nại do thiếu bằng chứng.
- Tỷ lệ cửa hàng kích hoạt chế độ ít người.
- Số cờ chấm điểm bất thường và tỷ lệ được xác minh.
- Thời gian từ đủ điều kiện đến quyết định tăng bậc.
- Mức độ nhân viên hiểu điểm mạnh và nội dung cần cải thiện sau pilot.

## 25. Điều kiện duyệt Master Spec

Master Spec được duyệt khi người dùng xác nhận:

- flow bắt đầu từ mục tiêu là đúng;
- 5 bước thiết lập đủ đơn giản;
- đánh giá tháng đúng thực tế Homies;
- cơ chế peer ẩn danh/cửa hàng ít người đủ công bằng;
- 360 là đánh giá toàn cửa hàng;
- bộ điều kiện tăng bậc V1 đúng;
- chia 5 giai đoạn phù hợp để giao Antigravity;
- không còn điểm nghiệp vụ quan trọng chưa quyết định.

Sau khi Master Spec được duyệt, bước tiếp theo là viết implementation plan chi tiết cho **duy nhất Giai đoạn 1**, rồi mới tạo prompt thực thi cho Antigravity.
