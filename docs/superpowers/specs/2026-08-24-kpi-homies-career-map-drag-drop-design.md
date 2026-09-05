# Thiết kế Sơ đồ Lộ trình Phát triển Homies kéo thả

**Ngày chốt:** 2026-08-24  
**Phạm vi:** Bước 2 của luồng thiết lập chương trình KPI & Phát triển  
**Trạng thái:** Đã được người dùng duyệt ngày 2026-08-24  

## 1. Mục tiêu

Thay cách cấu hình từng cặp `vị trí hiện tại → vị trí hướng tới` bằng một sơ đồ lộ trình phát triển chuẩn do trụ sở thiết lập một lần và áp dụng cho toàn chuỗi Homies.

Admin kéo các vị trí/cấp bậc có sẵn từ Danh mục chức vụ Homies vào sơ đồ, nối thành các nhánh nghề nghiệp, sau đó hệ thống tự sinh:

- bộ tiêu chí đánh giá theo vị trí đang làm;
- điều kiện tăng bậc theo loại đường nối;
- chương trình KPI cho mọi vị trí trong sơ đồ;
- vị trí hiện tại của nhân viên trên lộ trình;
- phạm vi áp dụng toàn chuỗi và mục tiêu theo nhóm cửa hàng.

Người dùng không phải tạo và cấu hình lại từng chặng thăng tiến.

## 2. Nguyên tắc đã duyệt

1. Trụ sở dùng một sơ đồ chuẩn cho toàn chuỗi.
2. Nhiều nhánh nghề nghiệp được phép hội tụ lên Trưởng ca và Quản lý cửa hàng.
3. Vị trí và cấp bậc lấy trực tiếp từ Danh mục chức vụ Homies.
4. Chỉ được nối lên cấp liền kề; hệ thống chặn nối ngang, nối xuống và nhảy cấp.
5. Các vị trí cùng cấp thuộc các nhánh nghề khác nhau, không mặc định là thăng tiến qua lại.
6. Mọi nhánh vận hành đủ điều kiện đều có thể hội tụ lên Trưởng ca.
7. Tiêu chí nằm tại vị trí đang làm; điều kiện tăng bậc nằm trên đường nối.
8. Điều kiện được quản lý theo loại chặng, không nhập lại cho từng đường nối.
9. Sơ đồ, tiêu chí và trọng số thống nhất toàn chuỗi. Chỉ con số mục tiêu được khác theo nhóm cửa hàng hoặc ngoại lệ có thời hạn.
10. HR Admin tạo/chỉnh bản nháp; CEO duyệt và triển khai.
11. Mọi thay đổi sau triển khai phải tạo phiên bản mới và ngày hiệu lực mới.
12. Chế độ `Một chặng riêng` không nằm trong flow chính, chỉ xuất hiện trong phần Nâng cao cho ngoại lệ.

## 3. Sơ đồ mẫu

```text
Pha chế C1 → Pha chế C2 → Pha chế chính ───┐
Thu ngân C1 → Thu ngân C2 ─────────────────┤
Phục vụ C1 → Phục vụ C2 ───────────────────┼→ Trưởng ca → Quản lý cửa hàng
Bếp C1 → Bếp C2 → Bếp chính ───────────────┘
```

Sơ đồ là bản đồ nghề nghiệp theo vị trí/cấp bậc, không phải sơ đồ nhân sự theo tên từng người. Nó sử dụng cùng nguồn dữ liệu chức vụ/cấp bậc với phần Thiết lập tổ chức Homies.

## 4. Flow người dùng

```text
Danh mục chức vụ & cấp bậc Homies
            ↓
Kéo vị trí vào canvas
            ↓
Nối các vị trí thành nhánh nghề nghiệp
            ↓
Hệ thống kiểm tra cấp bậc và cấu trúc
            ↓
Tự gắn bộ tiêu chí + điều kiện tăng bậc
            ↓
Admin bổ sung tiêu chí nếu cần
            ↓
Xem trước toàn bộ chương trình sẽ tạo
            ↓
HR gửi duyệt
            ↓
CEO duyệt và triển khai toàn chuỗi
```

## 5. Bố cục màn hình

### 5.1 Khay vị trí bên trái

Khay lấy dữ liệu trực tiếp từ Danh mục chức vụ và hiển thị theo nhóm nghề:

- Pha chế;
- Thu ngân;
- Phục vụ;
- Bếp;
- Quản lý vận hành;
- Chưa phân nhóm.

Mỗi thẻ hiển thị:

- tên vị trí;
- cấp bậc;
- nhóm nghề;
- số nhân viên đang giữ vị trí;
- trạng thái `Đã nằm trong sơ đồ` hoặc `Chưa xếp vào lộ trình`.

Vị trí mới được thêm vào Danh mục chức vụ sẽ xuất hiện trong khay `Chưa xếp vào lộ trình`. Hệ thống không tự thay đổi sơ đồ đang chạy.

### 5.2 Canvas ở giữa

Admin có thể:

- kéo thẻ vào canvas;
- di chuyển thẻ để sắp xếp sơ đồ;
- nối đầu ra của vị trí thấp hơn vào đầu vào của vị trí liền cấp;
- tạo nhiều nhánh song song;
- hội tụ nhiều nhánh vào Trưởng ca hoặc Quản lý cửa hàng;
- chọn một vị trí hoặc đường nối để xem cấu hình tự sinh;
- xóa đường nối trong bản nháp.

Hệ thống không cho tạo vòng lặp, nối vị trí với chính nó, nối xuống cấp thấp hơn hoặc bỏ qua cấp trung gian.

### 5.3 Panel chi tiết bên phải

Khi chọn thẻ vị trí, panel hiển thị:

- bộ tiêu chí F&B đang áp dụng;
- nguồn dữ liệu của từng tiêu chí;
- mức quan trọng/trọng số;
- số nhân viên và cửa hàng bị ảnh hưởng;
- nút `Thêm tiêu chí`;
- nút `Xem bộ tiêu chí đầy đủ`.

Khi chọn đường nối, panel hiển thị:

- loại chặng;
- số tháng phải đạt;
- điểm KPI tối thiểu;
- yêu cầu số ca/giờ;
- bài test, thử vai hoặc đánh giá 360° nếu có;
- người đề xuất và người phê duyệt;
- nguồn của quy tắc dùng chung.

## 6. Tự gắn tiêu chí theo vị trí

Mỗi vị trí nhận bộ tiêu chí theo công việc đang làm:

- **Pha chế:** tốc độ ra món, đúng công thức, vệ sinh, bảo quản và hao hụt nguyên liệu.
- **Thu ngân:** chính xác tiền két, tốc độ order, upsell và thái độ khách hàng.
- **Phục vụ:** giao món, vệ sinh sảnh, hỗ trợ ca và giao tiếp khách hàng.
- **Bếp:** chất lượng sơ chế, định lượng, hạn sử dụng và an toàn thực phẩm.
- **Trưởng ca:** điều phối ca, checklist, xử lý sự cố và đào tạo nhân viên.
- **Quản lý cửa hàng:** doanh thu, chi phí, nhân sự, đào tạo và vận hành cửa hàng.

Tiêu chí của vị trí được áp dụng cho tất cả nhân viên đang giữ vị trí đó, không phụ thuộc họ sẽ đi theo nhánh thăng tiến nào.

## 7. Tự gắn điều kiện theo loại chặng

Hệ thống phân loại đường nối và dùng preset chung:

### 7.1 Lên cấp trong cùng nghề

- KPI đạt yêu cầu đủ số tháng liên tiếp;
- đủ số ca/giờ làm việc;
- không có lỗi chặn nghiêm trọng;
- không có khiếu nại chưa giải quyết.

### 7.2 Lên nhân viên chính

Bao gồm điều kiện lên cấp trong cùng nghề và thêm bài kiểm tra nghiệp vụ.

### 7.3 Lên Trưởng ca

- KPI đủ số tháng;
- bài test nghiệp vụ và năng lực điều phối;
- thử vai theo số ca quy định;
- đánh giá của Quản lý cửa hàng;
- không có lỗi chặn hoặc khiếu nại tồn đọng.

### 7.4 Lên Quản lý cửa hàng

- KPI theo cửa sổ thời gian được cấu hình;
- đánh giá vận hành cửa hàng 360°;
- bài test quản lý;
- thử thách quản lý;
- phê duyệt của cấp có thẩm quyền.

Admin chỉnh một lần trên loại chặng. Mọi đường nối cùng loại tự nhận phiên bản quy tắc mới từ ngày hiệu lực.

## 8. Flow thêm tiêu chí

Admin chọn một thẻ vị trí và bấm `Thêm tiêu chí`.

### 8.1 Thư viện ưu tiên lựa chọn có sẵn

Hệ thống không mở form trống ngay. Nó hiển thị:

1. tiêu chí Homies đề xuất cho vị trí;
2. tiêu chí F&B phổ biến;
3. tiêu chí đang dùng ở vị trí tương tự;
4. lựa chọn tạo tiêu chí riêng.

Admin có thể tick nhiều tiêu chí rồi áp dụng một lần.

### 8.2 Tạo tiêu chí riêng bằng câu hỏi đơn giản

Hệ thống hỏi:

1. Muốn nhân viên làm tốt việc gì?
2. Kết quả lấy từ POS, checklist, nhật ký ca hay quản lý chấm?
3. Bao nhiêu được xem là đạt?
4. Tiêu chí quan trọng ở mức thấp, vừa hay cao?

Hệ thống tự chuyển câu trả lời thành cấu hình đo lường, chiều tốt/xấu, ngưỡng điểm và nguồn dữ liệu. Các trường kỹ thuật chỉ nằm trong chế độ Nâng cao.

### 8.3 Phạm vi áp dụng

Admin chọn:

- chỉ vị trí đang chọn;
- toàn bộ cấp bậc trong cùng nhánh nghề;
- nhiều vị trí được tick.

Trước khi lưu, hệ thống hiển thị số vị trí, nhân viên và cửa hàng bị ảnh hưởng.

### 8.4 Tự cân trọng số

Nếu thêm tiêu chí làm tổng trọng số vượt 100%, hệ thống đưa ra ba lựa chọn:

- `Tự cân lại` — mặc định đề xuất;
- `Giảm tiêu chí khác`;
- `Tôi muốn chỉnh nâng cao`.

Hệ thống không yêu cầu người dùng tự sửa lỗi phần trăm trước khi có gợi ý.

## 9. Phạm vi cửa hàng

- Sơ đồ, tiêu chí và trọng số dùng chung toàn chuỗi.
- Mục tiêu định lượng được cấu hình theo toàn chuỗi hoặc nhóm cửa hàng A/B/C.
- Ngoại lệ cửa hàng chỉ thay con số mục tiêu, phải có lý do và thời hạn.
- Cửa hàng không được đổi đường nối, tiêu chí hoặc trọng số.

## 10. Tự xếp nhân viên vào sơ đồ

Khi triển khai, hệ thống đối chiếu chức vụ và cấp bậc hiện tại của nhân viên để đặt họ vào đúng node.

Các trường hợp không khớp được đưa vào hàng đợi:

- chức vụ chưa nằm trong sơ đồ;
- cấp bậc bị thiếu;
- chức vụ đã ngưng hoạt động;
- một nhân viên có nhiều chức vụ chính xung đột.

Admin xử lý hàng đợi trước khi chương trình bắt đầu tính điều kiện thăng tiến.

## 11. Kiểm tra sơ đồ

### 11.1 Lỗi chặn triển khai

- đường nối tạo vòng lặp;
- nối xuống cấp thấp hơn;
- nối nhảy cấp;
- vị trí trong sơ đồ thiếu cấp bậc;
- node không có bộ tiêu chí;
- loại chặng thiếu điều kiện bắt buộc;
- tổng trọng số không hợp lệ và chưa chọn cách tự cân;
- vị trí bị xóa nhưng vẫn còn nhân viên hoặc đường nối.

### 11.2 Cảnh báo cần kiểm tra

- vị trí chưa có hướng phát triển tiếp theo;
- vị trí mới chưa được xếp vào sơ đồ;
- nhánh nghề chưa hội tụ lên cấp quản lý;
- mục tiêu định lượng chưa có cho một nhóm cửa hàng;
- nhiều nhân viên chưa khớp được vào node.

Thông báo phải dùng ngôn ngữ nghiệp vụ, chỉ rõ vị trí và hành động cần làm.

## 12. Xem trước và triển khai

Màn xem trước hiển thị:

- số nhánh nghề nghiệp;
- số vị trí/cấp bậc;
- số đường tăng bậc;
- số bộ tiêu chí;
- số loại điều kiện;
- số nhân viên được tự động xếp;
- số nhân viên cần xử lý;
- số cửa hàng áp dụng;
- ngày hiệu lực;
- danh sách thay đổi so với phiên bản đang chạy.

HR Admin bấm `Gửi duyệt`. CEO có thể:

- duyệt và triển khai;
- trả lại kèm lý do;
- xem chi tiết node hoặc đường nối có thay đổi.

Không có bước xác nhận từng vị trí hoặc từng đường nối.

## 13. Phiên bản và dữ liệu lịch sử

- Bản nháp có thể chỉnh sửa tự do trước khi gửi duyệt.
- Sơ đồ đã triển khai không được sửa trực tiếp.
- Thay đổi tạo phiên bản mới và ngày hiệu lực mới.
- Kỳ KPI cũ giữ nguyên snapshot sơ đồ, tiêu chí, trọng số, mục tiêu và điều kiện đã dùng.
- Xóa node đang có nhân viên phải chọn node thay thế hoặc ngày ngưng áp dụng.
- Không hồi tố tiêu chí mới vào kết quả đã công bố.

## 14. Quyền sử dụng

- **HR Admin:** tạo bản nháp, kéo thả, nối node, thêm tiêu chí, chỉnh preset và gửi duyệt.
- **CEO:** xem thay đổi, trả lại hoặc duyệt triển khai.
- **Quản lý cửa hàng:** xem sơ đồ và tiến độ nhân viên thuộc cửa hàng; không chỉnh cấu trúc.
- **Nhân viên:** xem vị trí hiện tại, cấp tiếp theo, điều kiện còn thiếu và lịch sử đạt.

Mọi thay đổi, phê duyệt, trả lại và giải quyết mapping phải có nhật ký.

## 15. Cấu trúc dữ liệu đề xuất

### 15.1 Career Map Version

Đại diện cho một phiên bản sơ đồ:

- mã phiên bản;
- trạng thái `draft`, `pending_approval`, `published`, `superseded`;
- ngày hiệu lực;
- người tạo, người duyệt;
- phạm vi toàn chuỗi;
- snapshot chức vụ/cấp bậc tại thời điểm triển khai.

### 15.2 Career Map Node

- ID node;
- position ID từ Danh mục chức vụ;
- tên và cấp bậc snapshot;
- nhóm nghề;
- tọa độ trên canvas;
- template tiêu chí;
- trạng thái hoạt động.

### 15.3 Career Map Edge

- node nguồn và node đích;
- loại chặng;
- promotion preset version;
- trạng thái hoạt động;
- thứ tự hiển thị.

### 15.4 Position Criteria Profile

- position ID;
- danh sách tiêu chí và trọng số;
- nguồn dữ liệu;
- phạm vi vị trí/nhánh nghề;
- ngày hiệu lực;
- phiên bản.

Sơ đồ chỉ lưu tham chiếu tới Danh mục chức vụ trong bản nháp. Khi triển khai phải lưu snapshot để thay đổi master data sau này không làm sai lịch sử.

## 16. Luồng dữ liệu

```text
Danh mục chức vụ/cấp bậc
        ↓
Career Map Draft
        ↓
Validation Engine
        ↓
Criteria Profile + Promotion Presets
        ↓
Deployment Preview
        ↓
CEO Approval
        ↓
Published Career Map Snapshot
        ↓
KPI Programs + Employee Placement + Promotion Tracking
```

## 17. Xử lý lỗi và trạng thái đặc biệt

- Mất kết nối khi chỉnh: giữ bản nháp cục bộ và cho thử lưu lại.
- Xung đột phiên bản: báo sơ đồ vừa được người khác cập nhật, cho tải bản mới trước khi ghi đè.
- Chức vụ bị sửa khi đang mở bản nháp: đánh dấu node cần đồng bộ, không tự thay.
- Thiếu dữ liệu mục tiêu: cho lưu nháp nhưng chặn triển khai.
- Không đủ quyền: chỉ cho xem và giải thích người có quyền chỉnh.
- Canvas không tải được: cung cấp danh sách node/đường nối dạng bảng để không mất khả năng kiểm tra.

## 18. Thay đổi so với flow hiện tại

### Bỏ khỏi flow chính

- dropdown chọn vị trí hiện tại;
- dropdown chọn vị trí hướng tới;
- chọn từng chặng liền cấp;
- chọn template riêng cho từng chặng;
- xác nhận từng chương trình được sinh.

### Giữ lại nhưng chuyển vai trò

- thư viện template F&B trở thành nguồn tự gắn cho node;
- promotion presets trở thành cấu hình theo loại edge;
- nhóm cửa hàng và ngoại lệ mục tiêu nằm trong phần Nâng cao;
- `Một chặng riêng` nằm trong phần Nâng cao dành cho ngoại lệ.

## 19. Kiểm thử bắt buộc

### Logic

- tạo nhiều nhánh và hội tụ hợp lệ;
- chặn vòng lặp, nối xuống và nhảy cấp;
- tự nhận dạng đúng loại chặng;
- tự gắn đúng template theo vị trí;
- cập nhật preset dùng chung không tạo cấu hình lặp;
- thêm tiêu chí theo một vị trí, toàn nhánh và nhiều vị trí;
- tự cân trọng số vẫn giữ tổng 100%;
- nhân viên được xếp đúng node;
- snapshot cũ không đổi khi master data hoặc phiên bản mới thay đổi.

### Quyền

- HR chỉnh được bản nháp và gửi duyệt nhưng không tự triển khai; CEO là người duyệt cuối;
- CEO duyệt/trả lại được;
- Quản lý cửa hàng và nhân viên không sửa được sơ đồ;
- API không cho bypass quyền từ giao diện.

### Giao diện

- kéo thả và nối node dùng được trên desktop;
- tablet/mobile xem sơ đồ ở chế độ cuộn/thu phóng, thao tác chỉnh sửa chính ưu tiên desktop;
- có trạng thái rỗng, đang tải, lỗi và thử lại;
- cảnh báo chỉ rõ node/edge cần sửa;
- không cần mở từng chặng để hoàn tất triển khai.

## 20. Tiêu chí nghiệm thu

1. Admin tạo được toàn bộ sơ đồ Homies trong một flow kéo thả.
2. Sơ đồ lấy đúng vị trí và cấp bậc từ Danh mục chức vụ.
3. Các nhánh nghề hội tụ được lên Trưởng ca và Quản lý cửa hàng.
4. Hệ thống tự sinh tiêu chí theo node và điều kiện theo loại edge.
5. Admin thêm được tiêu chí từ thư viện hoặc bằng câu hỏi hướng dẫn.
6. Không phải setup hoặc xác nhận từng vị trí/chặng.
7. Một lần triển khai áp dụng cho toàn chuỗi.
8. Nhân viên tự được xếp vào node đúng theo chức vụ/cấp bậc.
9. Cửa hàng chỉ sửa con số mục tiêu trong phạm vi được phép.
10. Phiên bản mới không làm thay đổi KPI lịch sử.

## 21. Ngoài phạm vi của lần triển khai này

- sơ đồ riêng cho từng cửa hàng;
- tự động đề xuất nhân viên thay thế khi xóa vị trí;
- dùng AI tự quyết định tiêu chí hoặc đường thăng tiến mà không có admin xác nhận;
- cho cửa hàng sửa cấu trúc, tiêu chí hoặc trọng số;
- chuyển ngang tự động giữa các nghề cùng cấp;
- trình chỉnh sửa sơ đồ đầy đủ trên màn hình điện thoại nhỏ.
