# Thiết kế hệ thống KPI SaaS cho HRM Homies

Ngày: `2026-08-21`
Trạng thái: `đã duyệt thiết kế tổng thể, chờ duyệt đặc tả viết`
Nguồn nghiệp vụ: file KPI hiện tại, policy thăng tiến/tăng lương v2 và các quyết định brainstorming đã duyệt
Chuẩn giao diện bắt buộc: `DESIGN_RULE_HOMIES_FINAL.md`

## 1. Mục tiêu

Xây dựng một phân hệ KPI web chuyên nghiệp để Homies có thể:

- đánh giá nhân viên theo tháng bằng dữ liệu và bằng chứng rõ ràng;
- làm căn cứ cảnh báo, đào tạo, tăng lương cứng và thăng tiến;
- giảm chấm cảm tính và không cần truyền file Excel giữa các vai trò;
- cho nhân viên xem kết quả, hiểu nguyên nhân và khiếu nại đúng thời hạn;
- lưu được lịch sử cấu hình, điểm số, vi phạm và quyết định để đối chiếu về sau.

Đây là ứng dụng nghiệp vụ SaaS, không mô phỏng bố cục hay cách nhập liệu của Excel. Excel chỉ là nguồn tham khảo nghiệp vụ và có thể là định dạng xuất báo cáo.

## 2. Phạm vi đã chốt

Hệ thống gồm 9 khu vực:

1. Tổng quan KPI.
2. Kỳ KPI tháng.
3. Workspace chấm điểm.
4. Kết quả cá nhân.
5. Sự cố, vi phạm và khiếu nại.
6. Thăng tiến và tăng lương.
7. Bài test và thời gian thử thách.
8. Báo cáo.
9. Cài đặt KPI và chính sách.

Phạm vi giai đoạn này dừng ở lộ trình `PT1 -> PT2 -> Senior -> Shift Leader`. Chưa xây tuyến thăng tiến lên Store Manager.

KPI cá nhân và BSC cửa hàng là hai hệ thống tính riêng. Vi phạm cá nhân chỉ ảnh hưởng điều kiện nhận BSC khi policy BSC có một quy tắc rõ ràng, có phiên bản và đang có hiệu lực; không tự động dùng điểm KPI để tính thưởng tháng.

Dashboard và báo cáo phải ưu tiên công việc cần xử lý: kỳ đang chạy, hồ sơ chờ chấm, dữ liệu thiếu, khiếu nại, nhân sự có rủi ro và pipeline thăng tiến. Báo cáo cho phép xem xu hướng theo tháng, cửa hàng, cấp bậc và nhóm tiêu chí nhưng luôn giới hạn theo quyền của người xem.

## 3. Nguyên tắc nền tảng

### 3.1. Cấu hình động nhưng lịch sử bất biến

- Admin được tạo nhiều bộ KPI theo cấp bậc, vị trí, trạng thái nhân sự, cửa hàng và giai đoạn.
- Mỗi bộ KPI gồm nhóm tiêu chí, tiêu chí con, trọng số, nguồn dữ liệu, cách quy đổi, người chấm, yêu cầu bằng chứng và thời gian hiệu lực.
- Bản nháp được sửa tự do.
- Bản đã công bố không được sửa trực tiếp; muốn thay đổi phải nhân bản thành phiên bản mới.
- Khi mở kỳ KPI, hệ thống chụp toàn bộ cấu hình thành một bản đóng băng của kỳ.
- Thay đổi cấu hình cho kỳ sau không được làm đổi điểm hoặc cách giải thích của kỳ cũ.

### 3.2. Thang điểm và trụ KPI

- Điểm KPI chính thức dùng thang `1-5`.
- Bài test thăng tiến vẫn dùng thang `100` theo policy.
- Cấu hình mặc định có 4 trụ: doanh thu; dịch vụ và trải nghiệm khách hàng; vận hành và tuân thủ; kỷ luật và thực thi.
- Admin có thể thêm, ẩn hoặc thay đổi tiêu chí theo từng giai đoạn, nhưng mỗi nhóm phải có thẻ nghiệp vụ để hệ thống hiểu vai trò của nhóm đó.
- Trụ 2, 3 và 4 được gắn thẻ `trọng yếu cho thăng tiến`; điều kiện bình quân nhóm trọng yếu lấy theo thẻ này, không phụ thuộc tên hiển thị.
- Tổng trọng số của các nhóm đang áp dụng cho một bộ KPI phải đúng `100%` trước khi công bố.

### 3.3. Điểm có thể truy nguồn

Mỗi điểm cuối phải cho biết:

- dữ liệu nguồn nào được dùng;
- công thức hoặc mức quy đổi nào được áp dụng;
- điểm hệ thống đề xuất;
- điểm Leader chốt;
- ai đã điều chỉnh, điều chỉnh lúc nào và vì sao;
- bằng chứng liên quan nếu policy yêu cầu.

Hệ thống chỉ đề xuất điểm. Shift Leader được điều chỉnh trong phạm vi được phép nhưng bắt buộc ghi lý do; các mức điểm nhạy cảm hoặc chênh lệch lớn phải có bằng chứng.

## 4. Nguồn dữ liệu

| Nguồn | Cách lấy giai đoạn đầu | Người chịu trách nhiệm | Cách xử lý |
|---|---|---|---|
| Hồ sơ nhân viên, cấp bậc, cửa hàng | HRM hiện có | Admin/HR | Đọc qua service nhân sự |
| Chấm công, số giờ, đi trễ | HRM hiện có | Hệ thống, Leader xác minh ngoại lệ | Tạo dữ liệu gợi ý, không tự phạt ngay |
| Doanh thu và target POS | Nhập tay có xác nhận | Người được Admin phân công | Lưu người nhập, thời gian và nguồn đối chiếu |
| Lỗi vận hành, complaint, food app | Leader nhập hồ sơ sự cố | Shift Leader | Bắt buộc mô tả và bằng chứng theo loại lỗi |
| Tiêu chí năng lực thủ công | Workspace chấm điểm | Shift Leader | Chấm theo hướng dẫn và rubric của phiên bản KPI |

Giai đoạn đầu dùng mock/localStorage qua một lớp service thống nhất. Giai đoạn sau chuyển sang Supabase mà không đổi hợp đồng nghiệp vụ của giao diện.

## 5. Vòng đời kỳ KPI tháng

Vòng đời chuẩn:

`Bản nháp -> Thu thập dữ liệu -> Leader chấm -> Chờ CEO duyệt sơ bộ -> Đã công bố -> Đang khiếu nại -> Đã khóa`

### 5.1. Khởi tạo

Admin chọn tháng, cửa hàng, bộ KPI đã công bố, đối tượng áp dụng và danh sách nhân viên. Hệ thống kiểm tra trùng kỳ, cấu hình hiệu lực và chụp bản đóng băng.

### 5.2. Thu thập dữ liệu

Hệ thống lấy dữ liệu HRM, nhận số POS nhập tay và liên kết các hồ sơ sự cố thuộc kỳ. Dữ liệu thiếu hoặc chưa xác nhận phải hiện rõ và chặn gửi duyệt nếu là dữ liệu bắt buộc.

### 5.3. Leader chấm

Workspace hiển thị từng tiêu chí với trọng số, hướng dẫn, dữ liệu tham chiếu, điểm gợi ý, điểm chốt và bằng chứng. Bản nháp tự lưu. Leader có thể chuyển nhanh giữa nhân viên mà không mất dữ liệu.

### 5.4. CEO duyệt sơ bộ

CEO được duyệt hàng loạt hồ sơ sạch và mở chi tiết các hồ sơ có điều chỉnh lớn, thiếu dữ liệu, vi phạm nặng, khiếu nại hoặc dấu hiệu bất thường. CEO có thể duyệt, trả lại Leader hoặc yêu cầu bổ sung bằng chứng.

### 5.5. Công bố và khiếu nại

Sau khi công bố, nhân viên xem điểm tổng, điểm từng nhóm, nguồn dữ liệu, lý do điều chỉnh và mục cần cải thiện. Nhân viên có `48 giờ` để khiếu nại kết quả KPI tháng hoặc hồ sơ sự cố trong kỳ.

Khiếu nại về quyết định thăng tiến, bài test hoặc tăng lương theo policy có thời hạn riêng là `03 ngày làm việc` từ lúc nhận kết quả chính thức.

### 5.6. Khóa và mở lại kỳ

CEO khóa kỳ sau khi hết thời hạn và xử lý xong khiếu nại. Kỳ đã khóa không sửa trực tiếp. Muốn sửa phải tạo yêu cầu mở lại, ghi lý do, phạm vi ảnh hưởng và được CEO duyệt. Mọi thay đổi lưu giá trị cũ, giá trị mới, người thực hiện, thời gian và lý do.

## 6. KPI Builder cho Admin

Mỗi bộ KPI phải cấu hình được:

- tên, mô tả, đối tượng và cửa hàng áp dụng;
- ngày bắt đầu và kết thúc hiệu lực;
- thang điểm, nhóm tiêu chí và trọng số;
- ngưỡng xếp loại, cảnh báo và điều kiện cần đào tạo lại;
- tiêu chí con, hướng dẫn chấm, ví dụ và thứ tự hiển thị;
- nguồn chấm: tự động, Leader, CEO, vai trò cụ thể hoặc kết hợp;
- bảng quy đổi dữ liệu sang điểm `1-5`;
- điều kiện để tiêu chí xuất hiện hoặc được miễn;
- lúc nào bắt buộc ghi lý do hoặc đính kèm bằng chứng;
- thẻ nghiệp vụ phục vụ báo cáo và rule thăng tiến.

Trước khi công bố, hệ thống phải chặn nếu tổng trọng số không bằng `100%`, thiếu hướng dẫn, thiếu nguồn dữ liệu, trùng đối tượng/thời gian hiệu lực hoặc không có người chịu trách nhiệm chấm.

Xếp loại và cảnh báo là cấu hình có phiên bản. Cảnh báo chỉ đưa hồ sơ vào danh sách cần xem xét hoặc đào tạo; không tự động trở thành cảnh cáo kỷ luật, trừ khi có hồ sơ sự cố và quy trình phê duyệt riêng.

## 7. Sự cố, vi phạm và chống phạt trùng

Mỗi vấn đề là một `hồ sơ sự cố`, không phải một dòng trừ điểm rời rạc. Hồ sơ gồm thời gian, cửa hàng, ca, nhân viên, nguồn phát sinh, nguyên nhân, mã lỗi gốc, mô tả hành vi, bằng chứng, người ghi, tác động dự kiến và trạng thái xử lý.

Quy tắc chống phạt trùng:

- một sự cố có đúng một lỗi gốc chính;
- lỗi thứ hai chỉ được thêm khi có hành vi độc lập, bằng chứng riêng và lý do rõ ràng;
- complaint là hậu quả của lỗi sản phẩm không được tự động tính thành lỗi thứ hai;
- đi trễ do HRM phát hiện chỉ là đề xuất cho đến khi Leader xác minh đổi ca, sửa công hoặc lý do đã được duyệt;
- không tự động phạt Leader vì nhân viên trong ca có lỗi;
- trách nhiệm liên đới của Leader là một đánh giá riêng, chỉ áp dụng khi đúng ca phụ trách, có nghĩa vụ kiểm soát và loại lỗi cho phép liên đới.

Vòng đời hồ sơ:

`Leader ghi nhận -> Hệ thống kiểm tra -> Nhân viên nhận -> Khiếu nại 48 giờ -> CEO quyết định -> Chốt hồ sơ`

CEO có thể giữ nguyên, đổi phân loại, điều chỉnh tác động hoặc hủy lỗi. Hồ sơ đã chốt được liên kết vào KPI và lịch sử kỷ luật.

## 8. Thăng tiến, tăng lương, test và thử thách

KPI chỉ tạo dữ liệu đầu vào. Hệ thống kiểm tra điều kiện và đề xuất mức đủ điều kiện; Shift Leader đề xuất nhân sự; CEO là người quyết định cuối.

### 8.1. Rule mặc định theo policy hiện tại

| Tuyến | Điều kiện KPI chính | Điều kiện chặn chính | Test/thử thách |
|---|---|---|---|
| PT1 -> PT2 | 3 tháng; KPI TB 3 tháng >= 3.5; không tháng nào < 3.0; nhóm trọng yếu >= 3.5 | Lỗi liệt 6 tháng; cảnh cáo còn hiệu lực; lỗi nặng lặp lại; thái độ không ổn định | Test >= 80/100 và đạt sàn từng phần; thử thách 1 tháng |
| PT2 -> Senior | 6 tháng; KPI TB 6 tháng >= 3.8; ít nhất 4/6 tháng >= 3.5; nhóm trọng yếu >= 3.8 | Lỗi liệt 12 tháng; cảnh cáo 6 tháng; yếu năng lực hỗ trợ/đào tạo | Test >= 80/100 và đạt sàn từng phần; thử thách 2 tháng |
| Senior -> Shift Leader | 6 tháng; KPI TB 6 tháng >= 4.0; 3 tháng liên tiếp >= 4.0; nhóm trọng yếu >= 4.0 | Lỗi liệt 12 tháng; cảnh cáo 12 tháng; yếu năng lực quản ca/kỷ luật | Test >= 85/100 và đạt sàn từng phần; thử thách 2-3 tháng |
| Shift Leader giữ bậc | KPI 6 tháng phục vụ giữ bậc, tăng lương và theo dõi năng lực | Lỗi liệt, cảnh cáo hoặc vận hành yếu kéo dài | CEO quyết định |

Mặc định một kỳ KPI chỉ hợp lệ cho xét thăng tiến khi nhân viên đạt bình quân tối thiểu `80 giờ/tháng`, trừ ngoại lệ được CEO phê duyệt.

### 8.2. Pipeline nhân sự

`Hệ thống phát hiện -> Leader đề xuất -> Tổ chức test -> CEO duyệt thử thách/hoãn/từ chối -> Theo dõi thử thách -> Đánh giá cuối -> Bổ nhiệm và chốt lương`

Bài test phải lưu điểm từng phần, mức sàn, tổng điểm, người chấm, rubric, bằng chứng và kết luận. Nếu chưa đạt, được test lại tối đa một lần trong kỳ sau `2-4 tuần` đào tạo bổ sung.

Thử thách có mục tiêu, người theo dõi, các mốc check-in và kết luận `pass`, `gia hạn một lần` hoặc `quay về cấp cũ`. Vi phạm nghiêm trọng có thể dừng thử thách ngay.

### 8.3. Khung lương và ngoại lệ

- Admin cấu hình khung lương theo cấp và ngày hiệu lực.
- Hệ thống đề xuất mức trong khung nhưng không tự thay đổi lương.
- CEO chốt mức lương cuối và lý do.
- Khi lên cấp, mức đề xuất theo mức cao hơn giữa sàn cấp mới và lương hiện tại cộng mức tăng hợp lệ.
- Khi giữ cấp nhưng KPI tốt, chỉ tăng trong khung hiện tại; chạm trần thì không tự tăng thêm.
- Ngoại lệ phải có loại, lý do, bằng chứng, người duyệt, phạm vi và ngày hết hiệu lực; không tạo tiền lệ tự động.

## 9. Phân quyền

| Nghiệp vụ | Nhân viên | Shift Leader | Admin/HR | CEO |
|---|---|---|---|---|
| Xem KPI | Chỉ của mình | Cửa hàng phụ trách | Theo phạm vi được cấp | Toàn hệ thống |
| Chấm KPI | Không | Nhân viên thuộc phạm vi | Hỗ trợ dữ liệu | Xem, trả lại, ngoại lệ |
| Ghi sự cố | Không | Cửa hàng/ca phụ trách | Hỗ trợ quản trị | Có quyền điều chỉnh cuối |
| Khiếu nại | Tạo của mình | Tiếp nhận sơ bộ | Theo dõi | Quyết định cuối |
| Cấu hình KPI | Không | Không | Tạo và công bố phiên bản | Phê duyệt policy/ngoại lệ |
| Thăng tiến | Xem hồ sơ của mình | Đề xuất | Chuẩn bị hồ sơ | Quyết định cuối |
| Lương | Chỉ mức của mình | Không | Theo quyền hạn | Toàn quyền |
| Khóa/mở kỳ | Không | Không | Chuẩn bị yêu cầu | Quyết định |

Ở giai đoạn Supabase, quyền này phải được bảo vệ cả ở giao diện và RLS; không chỉ ẩn nút trên màn hình.

## 10. Kiến trúc dữ liệu và service

Hệ thống chia thành 4 miền độc lập:

1. `KPI Configuration`: bộ KPI, phiên bản, nhóm, tiêu chí, trọng số, quy đổi và đối tượng.
2. `Evaluation Period`: kỳ, bản chụp cấu hình, nhân viên, điểm, dữ liệu nguồn, bằng chứng, trạng thái và audit.
3. `Incident & Appeal`: sự cố, lỗi gốc, lỗi phụ độc lập, liên đới, xác nhận, khiếu nại và quyết định.
4. `People Development`: rule xét, hồ sơ ứng viên, test, test lại, thử thách, khung lương, ngoại lệ và quyết định.

Giao diện chỉ gọi service nghiệp vụ. Service dùng repository mock/localStorage ở Pass A-D và có thể chuyển sang repository Supabase ở Pass E. Không để trang React đọc/ghi localStorage trực tiếp.

Mô hình mới thay nền nghiệp vụ `L0-L5`, bộ option A/B/C và điểm chuẩn `0-100` hiện tại. Chỉ tái sử dụng những component giao diện phù hợp; dữ liệu cũ không được tự động coi là dữ liệu KPI chính thức nếu chưa có bước chuyển đổi và đối chiếu.

## 11. Quy chuẩn giao diện bắt buộc

Mọi trang KPI phải tuân thủ `DESIGN_RULE_HOMIES_FINAL.md` tại thời điểm triển khai, gồm:

- nền `#FFF8E8`, full width, không co trang bằng `max-w-7xl`;
- font Inter; mọi điểm, phần trăm, giờ và tiền dùng monospace tabular nums;
- Executive Header sticky có breadcrumb, trạng thái, cửa hàng, kỳ và hành động đúng quyền;
- dải 4 Macro KPI Cards ở đầu trang;
- tầng nội dung chính theo tỷ lệ `2/3 + 1/3` khi màn hình đủ rộng;
- bảng vận hành click cả dòng để mở modal chi tiết;
- modal cá nhân có thông tin chính, cách tính, lịch sử sự cố và phím trước/sau;
- cài đặt chuyên sâu tách khỏi tab báo cáo nghiệp vụ;
- Lucide cho toàn bộ icon, không dùng emoji;
- empty state, loading skeleton, tooltip công thức và trạng thái lỗi rõ ràng;
- desktop dùng bảng/workspace đầy đủ; mobile dùng danh sách ưu tiên công việc, drawer/bottom sheet và Bottom Navigation, không ép bảng rộng thành chữ quá nhỏ.

Ngôn ngữ giao diện là tiếng Việt có dấu, câu ngắn, dùng từ nghiệp vụ dễ hiểu. Không hiển thị thuật ngữ kỹ thuật như snapshot, repository hoặc RLS cho người dùng cuối.

## 12. Xử lý lỗi và bảo vệ dữ liệu

- Tự lưu bản nháp khi Leader chấm và báo trạng thái lưu.
- Không cho gửi nếu thiếu tiêu chí bắt buộc, dữ liệu nguồn, lý do hoặc bằng chứng.
- Chặn gửi hai lần và hành động phê duyệt lặp.
- Cảnh báo khi hai người cùng sửa một hồ sơ; không âm thầm ghi đè dữ liệu mới hơn.
- Hiển thị rõ dữ liệu nào chưa đồng bộ hoặc chỉ là đề xuất.
- Mọi hành động quan trọng phải có audit log.
- Khi nguồn dữ liệu lỗi, giữ bản nháp và cho thử lại; không tự quy điểm thấp cho nhân viên.
- Kỳ khóa hoặc quyết định CEO không được thay đổi qua thao tác thông thường.

## 13. Kiểm thử bắt buộc

### 13.1. Logic nghiệp vụ

- tổng trọng số và công thức điểm thang `1-5`;
- bảng quy đổi điểm tự động và điểm kết hợp;
- phiên bản mới không làm đổi kỳ cũ;
- điều kiện hợp lệ theo giờ làm;
- rule từng tuyến thăng tiến, điều kiện chặn, test lại và thử thách;
- đề xuất lương luôn nằm trong khung đang hiệu lực;
- KPI và BSC không bị trộn công thức.

### 13.2. Luồng và dữ liệu

- đủ các trạng thái từ mở kỳ đến khóa kỳ;
- lý do/bằng chứng bắt buộc khi điều chỉnh;
- không tính trùng lỗi cùng sự cố;
- đúng cửa sổ khiếu nại `48 giờ` và `03 ngày làm việc` theo loại hồ sơ;
- mở lại kỳ có duyệt và audit đầy đủ;
- không mất bản nháp khi tải lại trang.

### 13.3. Phân quyền và giao diện

- nhân viên và Leader không xem được dữ liệu ngoài phạm vi;
- dữ liệu lương không lộ sai vai trò;
- desktop và mobile không tràn, đè chữ hoặc mất nút hành động;
- các trang KPI vượt checklist 15 điểm của `DESIGN_RULE_HOMIES_FINAL.md`;
- TypeScript, lint và build phù hợp scope đều pass trước khi hoàn thành từng pass.

## 14. Lộ trình triển khai

### Pass A - Nền móng và cấu hình

Tạo type/domain mới, service boundary, repository mock/localStorage, KPI Builder, phiên bản đóng băng, engine điểm `1-5` và dữ liệu mẫu. Đây là pass đầu tiên được triển khai sau khi plan chi tiết được duyệt.

### Pass B - Đánh giá hàng tháng

Tạo kỳ KPI, thu thập dữ liệu, workspace Leader, CEO duyệt sơ bộ, công bố, kết quả cá nhân, khóa/mở lại kỳ và audit.

### Pass C - Sự cố và khiếu nại

Tạo hồ sơ sự cố, bằng chứng, đề xuất từ chấm công, chống phạt trùng, liên đới quản lý, xác nhận nhân viên và xử lý khiếu nại.

### Pass D - Phát triển nhân sự

Tạo hồ sơ xét, pipeline thăng tiến, bài test, test lại, thử thách, khung lương, tăng lương trong cấp, ngoại lệ và quyết định CEO.

### Pass E - Backend thật và báo cáo

Thiết kế schema Supabase, RLS, repository thật, chuyển dữ liệu đã xác nhận, báo cáo xu hướng, rủi ro, pipeline và xuất dữ liệu.

### Pilot

Chạy một cửa hàng trong trọn một kỳ KPI trước khi mở rộng. Pilot chỉ đạt khi:

- chấm được toàn bộ nhân viên mà không quay lại Excel để hoàn tất quy trình;
- mọi điểm truy được nguồn và không có lỗi phạt trùng;
- nhân viên xem và khiếu nại được;
- CEO xử lý, khóa kỳ và mở lại có kiểm soát;
- ít nhất một hồ sơ xét thăng tiến chạy xuyên suốt;
- dữ liệu lương và KPI không lộ sai quyền;
- các lỗi pilot được ghi nhận trước khi nhân rộng.

## 15. Ngoài phạm vi hiện tại

- tự động đồng bộ trực tiếp với POS;
- tự động ra quyết định tăng lương hoặc thăng tiến;
- tuyến Store Manager trở lên;
- dùng KPI cá nhân để tự tính thưởng tháng;
- thay toàn bộ backend sang Supabase ngay trong Pass A;
- chuyển dữ liệu KPI cũ thành dữ liệu chính thức khi chưa có đối chiếu.

## 16. Điều kiện sẵn sàng viết implementation plan

Đặc tả được xem là sẵn sàng khi người dùng xác nhận:

- phạm vi 9 khu vực đúng mong muốn;
- hai thời hạn khiếu nại được phân biệt đúng;
- các rule thăng tiến/lương hiện tại là cấu hình mặc định có thể đổi phiên bản;
- giao diện bắt buộc tuân thủ `DESIGN_RULE_HOMIES_FINAL.md`;
- Pass A là bước code đầu tiên và chỉ tập trung nền dữ liệu, cấu hình, phiên bản và engine điểm.
