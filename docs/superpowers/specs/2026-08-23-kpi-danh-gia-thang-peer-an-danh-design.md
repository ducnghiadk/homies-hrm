# KPI Đánh Giá Tháng & Đồng Nghiệp Ẩn Danh — Design Spec

Ngày chốt nghiệp vụ: 2026-08-23  
Trạng thái: Đã được người dùng duyệt  
Phạm vi: Giai đoạn 2 của module KPI & Phát triển

## 1. Mục tiêu

Xây một flow đánh giá hàng tháng đủ đơn giản để nhân viên và quản lý cửa hàng có thể sử dụng ngay, nhưng vẫn đủ kiểm soát để kết quả được dùng cho:

- phản hồi và cải thiện năng lực hàng tháng;
- xếp loại KPI tháng;
- theo dõi chuỗi số tháng đạt chuẩn;
- xét tăng bậc hoặc thăng chức;
- xử lý khiếu nại có căn cứ;
- phát hiện dấu hiệu thiên vị hoặc thông đồng.

Trải nghiệm mục tiêu:

- Nhân viên hoàn thành một phiếu đồng nghiệp trên điện thoại trong 2–3 phút.
- Người chấm chính không nhập lại dữ liệu đã có trong hệ thống.
- Quản lý chỉ xử lý ngoại lệ và duyệt kết quả, không vận hành thủ công toàn bộ kỳ.
- HR theo dõi toàn chuỗi bằng cảnh báo, không phải mở từng hồ sơ bình thường.

## 2. Nguyên tắc sản phẩm

1. Một workspace chính cho mọi vai trò, không tạo nhiều trang rời rạc.
2. Hệ thống đề xuất và tự động hóa; con người xác nhận và xử lý ngoại lệ.
3. Đồng nghiệp chỉ chấm hành vi họ trực tiếp quan sát được.
4. Đánh giá đồng nghiệp có trọng số nhỏ, không tự quyết định tăng bậc.
5. Ẩn danh với người được đánh giá; có khả năng điều tra có kiểm soát cho HR/CEO.
6. Không đủ mẫu ẩn danh không được làm thiệt quyền lợi của nhân viên.
7. Không công bố kết quả khi còn rủi ro hoặc dữ liệu quan trọng chưa xử lý.
8. Mọi hành động nhạy cảm phải có audit log.

## 3. Trong phạm vi Giai đoạn 2

### 3.1. Chức danh được đánh giá

- Nhân viên tuyến đầu: pha chế, thu ngân, phục vụ và các vị trí vận hành tương đương.
- Shift Leader / Trưởng ca.

### 3.2. Người chấm chính

- Nhân viên tuyến đầu: Shift Leader có nhiều ca làm chung nhất.
- Shift Leader: Quản lý cửa hàng.

Quản lý được thay người chấm chính khi có lý do hợp lệ. Hệ thống phải lưu người được đề xuất ban đầu, người được chọn thay và lý do thay đổi.

Reviewer đồng nghiệp của nhân viên tuyến đầu phải là người cùng nhóm cấp bậc hoặc vai trò vận hành tương đương. Quản lý cửa hàng và người chấm chính không được đồng thời chiếm một trong hai suất peer reviewer của cùng hồ sơ.

### 3.3. Ngoài phạm vi

- Đánh giá 360 toàn cửa hàng theo quý.
- Đánh giá hàng tháng cho Quản lý cửa hàng.
- Thay đổi engine tăng bậc, bài test, challenge hoặc salary hiện có.
- Tự động kết luận gian lận chỉ từ cảnh báo thống kê.
- Xóa hoặc đổi route KPI hiện tại.

Đánh giá 360 theo quý sẽ là một giai đoạn riêng sau khi flow đánh giá tháng ổn định.

## 4. Vai trò và quyền

| Vai trò | Quyền chính |
|---|---|
| Nhân viên | Làm phiếu đồng nghiệp được giao; xem kết quả cá nhân; khiếu nại trong 48 giờ |
| Shift Leader | Làm phiếu đồng nghiệp nếu đủ điều kiện; chấm chính nhân viên tuyến đầu được phân công |
| Quản lý cửa hàng | Chọn 2 người đánh giá; thay người chấm chính có lý do; theo dõi tiến độ; duyệt kết quả nhân viên; chấm Shift Leader |
| HR Admin | Mở và theo dõi kỳ toàn chuỗi; xử lý ngoại lệ, cảnh báo và khiếu nại; mở danh tính có lý do; loại phiếu có căn cứ |
| CEO | Có quyền điều tra và quyết định cuối với hồ sơ nghiêm trọng hoặc khiếu nại được chuyển cấp |

Người được đánh giá không bao giờ được xem danh tính, thời điểm gửi hoặc phiếu riêng của người đánh giá đồng nghiệp.

## 5. Cấu hình Admin

Cấu hình nằm trong chương trình KPI hiện tại tại `/kpi/settings`, không tạo một trung tâm cài đặt rời.

### 5.1. Cấu hình mặc định Homies

| Cấu hình | Mặc định | Quy tắc |
|---|---:|---|
| Bật đánh giá đồng nghiệp | Bật | Có thể tắt theo chương trình |
| Trọng số đồng nghiệp | 10% | Admin được sửa, tối đa 15% |
| Tổng số ca tối thiểu trong tháng | 8 ca | Dùng để xác định người đánh giá đang hoạt động đủ |
| Số ca làm chung tối thiểu | 5 ca | Phải làm chung với người được đánh giá |
| Thời gian Quản lý chọn người | 24 giờ | Quá hạn hệ thống tự chọn |
| Thời hạn hoàn thành phiếu | 48 giờ | Sau hạn kích hoạt người dự phòng |
| Số người đánh giá bắt buộc | 2 người | Chỉ tổng hợp khi đủ hai phiếu hợp lệ |
| Sử dụng người dự phòng | Bật | Chọn từ danh sách xếp hạng còn lại |
| Khiếu nại kết quả | 48 giờ | Tính từ lúc công bố |

### 5.2. Điều kiện loại khỏi danh sách người đánh giá

- Chính người đang được đánh giá.
- Người đang thử việc.
- Người nghỉ dài ngày hoặc không đạt số ca tối thiểu.
- Người không đạt số ca làm chung tối thiểu.
- Người đang bị đình chỉ.
- Người có vi phạm nghiêm trọng đang mở và có ảnh hưởng tới tính tin cậy của phiếu.
- Cặp đánh giá chéo bị rule chống thông đồng chặn trong cùng kỳ.

Vi phạm nhẹ không tự động loại một người khỏi danh sách.

## 6. Vòng đời kỳ đánh giá tháng

```text
Trụ sở tự mở kỳ theo lịch Admin
        ↓
Hệ thống kiểm tra nhân viên đủ điều kiện
        ↓
Hệ thống phân công người chấm chính
        ↓
Hệ thống xếp hạng 3–5 đồng nghiệp phù hợp
        ↓
Quản lý chọn 2 người trong 24 giờ
        ↓
Quá 24 giờ: hệ thống tự chọn 2 người đứng đầu
        ↓
Hệ thống gửi nhiệm vụ đánh giá
        ↓
Thu thập dữ liệu vận hành + phiếu đánh giá
        ↓
Quản lý duyệt kết quả
        ↓
Công bố cho nhân viên
        ↓
Cộng vào tiến độ xét tăng bậc
```

### 6.1. Trạng thái chính

```text
assignment_pending
→ collecting
→ primary_review_pending
→ manager_approval_pending
→ published
→ appeal_open
→ locked
```

Nhãn tiếng Việt trên giao diện:

- Chờ phân công.
- Đang thu thập đánh giá.
- Chờ người chấm chính.
- Chờ Quản lý duyệt.
- Đã công bố.
- Đang khiếu nại.
- Đã chốt.

### 6.2. Trạng thái phụ

- Thiếu mẫu ẩn danh.
- Đang gọi người dự phòng.
- Cần bổ sung bằng chứng.
- Có cảnh báo bất thường.
- Bị chặn do sự cố nghiêm trọng.

## 7. Xếp hạng người đánh giá đồng nghiệp

### 7.1. Cách tạo danh sách ứng viên

Hệ thống lọc điều kiện hợp lệ trước, sau đó xếp hạng theo thứ tự ưu tiên:

1. Số ca làm chung với người được đánh giá, cao xuống thấp.
2. Tổng số ca làm trong tháng, cao xuống thấp.
3. Ưu tiên người chưa đánh giá nhân viên này trong kỳ gần nhất.
4. Tránh lặp lại cùng một cặp nhiều tháng liên tiếp.
5. Tránh hai người đánh giá chéo cho nhau trong cùng kỳ.
6. Dùng ID ổn định làm tie-breaker để kết quả không thay đổi ngẫu nhiên.

Không dùng công thức điểm bí mật hoặc AI khó giải thích. Giao diện phải hiển thị lý do xếp hạng như “Làm chung 12 ca · Tổng 18 ca”.

### 7.2. Quản lý chọn người

- Giao diện hiển thị 3–5 ứng viên phù hợp nhất.
- Quản lý chọn đúng 2 người.
- Nếu chọn người ngoài danh sách đề xuất, phải nhập lý do.
- Sau 24 giờ chưa chọn, hệ thống tự chọn hai người đứng đầu.
- Quản lý nhận thông báo trước khi hết hạn.

### 7.3. Người dự phòng

- Các ứng viên còn lại được giữ theo thứ tự xếp hạng.
- Khi một người chính quá hạn 48 giờ, hệ thống kích hoạt người dự phòng phù hợp tiếp theo cho vị trí còn thiếu.
- Người đã quá hạn không được gửi phiếu sau khi nhiệm vụ bị thay thế.
- Hệ thống lưu đầy đủ lịch sử thay thế.

## 8. Form đồng nghiệp ẩn danh

### 8.1. Mục tiêu trải nghiệm

- Mobile-first.
- Hoàn thành trong 2–3 phút.
- Không hiển thị KPI học thuật hoặc thuật ngữ nhân sự.
- Chỉ hỏi hành vi trực tiếp quan sát được.

### 8.2. Thông tin đầu form

- Người được đánh giá.
- Chức danh.
- Tháng đánh giá.
- Số ca đã làm chung.
- Thông báo bảo mật danh tính.

### 8.3. Năm câu bắt buộc

1. Bạn này phối hợp thế nào trong giờ cao điểm?
2. Bạn này có chủ động hỗ trợ đồng đội khi cần không?
3. Việc bàn giao ca của bạn này có rõ ràng và đầy đủ không?
4. Bạn này có tuân thủ vệ sinh và quy trình chung không?
5. Thái độ giao tiếp của bạn này với đồng đội như thế nào?

### 8.4. Thang trả lời

| Điểm | Nhãn hiển thị |
|---:|---|
| 1 | Thường xuyên gây ảnh hưởng công việc |
| 2 | Chưa ổn, cần được nhắc nhiều |
| 3 | Đạt yêu cầu |
| 4 | Làm tốt và đáng tin cậy |
| 5 | Rất tốt, có thể làm gương |

### 8.5. Bằng chứng bắt buộc

Khi chọn điểm 1, 2 hoặc 5:

- chọn ca/ngày hoặc loại tình huống đã quan sát;
- nhập giải thích tối thiểu 20 ký tự;
- xác nhận nội dung dựa trên quan sát trực tiếp.

Cuối form có hai câu:

- Một điều người này đang làm tốt.
- Một điều người này nên cải thiện trong tháng tới.

Không cho gửi form rỗng, nội dung chỉ có khoảng trắng hoặc nội dung xúc phạm rõ ràng.

## 9. Form người chấm chính

Form tự sinh từ bộ KPI đã publish theo chức danh.

Mỗi tiêu chí hiển thị:

- tên tiêu chí;
- hướng dẫn dễ hiểu;
- mục tiêu tháng;
- kết quả thực tế;
- nguồn dữ liệu;
- điểm hệ thống gợi ý;
- điểm người chấm xác nhận;
- lý do điều chỉnh nếu điểm xác nhận khác điểm gợi ý.

Ví dụ:

```text
Đi làm đúng giờ
Mục tiêu: Tỷ lệ đúng giờ từ 95%
Thực tế: 93% · 2 lần đi trễ
Hệ thống gợi ý: 3/5
Shift Leader xác nhận: 3/5
```

Cuối form bắt buộc có:

- Điểm mạnh nổi bật tháng này.
- Một việc cần cải thiện.
- Hành động tháng sau.
- Mức hỗ trợ cần thiết.
- Đề xuất tiếp theo: theo dõi bình thường, đào tạo, giao thử nhiệm vụ mới hoặc đưa vào danh sách theo dõi tăng bậc.

## 10. Form Quản lý duyệt

Quản lý không chấm lại toàn bộ hồ sơ.

Màn duyệt hiển thị:

- điểm KPI và xếp loại dự kiến;
- trạng thái dữ liệu;
- chênh lệch giữa điểm hệ thống và người chấm;
- kết quả đồng nghiệp đã gộp;
- cảnh báo bất thường hoặc thông đồng;
- nhận xét chuẩn bị gửi nhân viên;
- trạng thái sự cố và khiếu nại liên quan.

Hành động:

- Duyệt kết quả.
- Trả lại người chấm.
- Yêu cầu bổ sung bằng chứng.
- Chuyển HR kiểm tra.

Quản lý có thể duyệt hàng loạt hồ sơ sạch. Hồ sơ có cảnh báo phải được mở riêng.

Đối với Shift Leader, Quản lý cửa hàng vừa là người chấm chính vừa là người chịu trách nhiệm gửi kết quả. Không tạo thêm bước để cùng một Quản lý tự duyệt lại hồ sơ của mình. Sau khi Quản lý gửi:

- hồ sơ sạch được công bố theo lịch công bố của kỳ;
- hồ sơ có blocker hoặc cảnh báo được chuyển HR kiểm tra;
- HR không duyệt thủ công mọi Shift Leader nếu hồ sơ không có vấn đề.

## 11. Tính điểm

### 11.1. Nhân viên tuyến đầu

Nguồn kết quả gồm:

- dữ liệu vận hành;
- đánh giá chính của Shift Leader;
- đánh giá đồng nghiệp ẩn danh.

Điểm đồng nghiệp:

- lấy trung bình năm câu của từng phiếu;
- chỉ tổng hợp sau khi đủ hai phiếu hợp lệ;
- lấy trung bình của hai phiếu;
- chỉ áp dụng vào các tiêu chí hành vi được cấu hình mapping;
- không áp dụng vào doanh thu, chấm công, sự cố hoặc kỹ năng chuyên môn;
- tổng trọng số nguồn peer không vượt `peer_weight_cap` của chương trình.

### 11.2. Không đủ hai phiếu

- Không dùng phiếu của người đã gửi.
- Không hiển thị nội dung phiếu đơn lẻ.
- Đánh dấu “Không đủ mẫu đánh giá ẩn danh trong kỳ này”.
- Chuyển toàn bộ trọng số peer sang người chấm chính trên cùng nhóm tiêu chí hành vi.
- Không coi đây là lỗi của nhân viên được đánh giá.
- Không chặn công bố nếu các nguồn bắt buộc khác đã hoàn tất.

### 11.3. Shift Leader

Không dùng điểm của nhân viên cấp dưới trong đánh giá tháng.

Nguồn gồm:

- dữ liệu vận hành;
- nhật ký ca và sự cố;
- kết quả đội ngũ trong ca phụ trách;
- đánh giá của Quản lý cửa hàng;
- tiêu chí dẫn dắt, bàn giao và coaching.

## 12. Quy tắc ẩn danh

### 12.1. Người được đánh giá được xem

- Điểm peer đã gộp.
- Điểm mạnh đã tổng hợp.
- Điều cần cải thiện đã tổng hợp.

### 12.2. Người được đánh giá không được xem

- Tên người đánh giá.
- Thời điểm từng người gửi.
- Phiếu riêng.
- Câu trả lời thuộc người nào.

### 12.3. Quản lý cửa hàng

- Biết hai người được giao nhiệm vụ.
- Không xem phiếu riêng sau khi gửi.
- Không biết câu trả lời nào thuộc người nào.
- Chỉ xem kết quả gộp khi đủ hai phiếu.

### 12.4. HR/CEO mở danh tính

Chỉ được mở khi:

- xử lý khiếu nại;
- điều tra dấu hiệu thông đồng;
- xử lý nội dung xúc phạm hoặc vi phạm nghiêm trọng;
- có quyết định kiểm tra hợp lệ.

Trước khi mở phải nhập lý do. Audit log lưu actor, thời gian, hồ sơ, lý do và hành động tiếp theo.

## 13. Phát hiện dấu hiệu thông đồng

Hệ thống tạo cảnh báo, không tự kết luận gian lận.

Các tín hiệu:

- Hai người thường xuyên đánh giá chéo cho nhau.
- Một cặp được chọn liên tục nhiều tháng.
- Hai phiếu giống nhau bất thường.
- Luôn chấm tối đa nhưng ví dụ không rõ ràng.
- Điểm peer lệch xa dữ liệu vận hành và người chấm chính.
- Quản lý thường xuyên bỏ qua người hệ thống xếp hạng cao.
- Một người thường xuyên chấm mọi đồng nghiệp quá cao hoặc quá thấp.

HR có thể:

- giữ nguyên;
- loại một phiếu;
- loại cả hai phiếu;
- yêu cầu đánh giá lại;
- nhắc nhở người đánh giá;
- chuyển xử lý kỷ luật nếu có bằng chứng.

Mọi quyết định phải có lý do và audit log.

## 14. Điều kiện chặn công bố

Không được công bố khi:

- người chấm chính chưa hoàn thành;
- dữ liệu quan trọng chưa được xác nhận;
- có điểm 1, 2 hoặc 5 thiếu bằng chứng bắt buộc;
- có sự cố nghiêm trọng đang xử lý;
- có khiếu nại chưa đóng;
- có cảnh báo bất thường chưa được Quản lý hoặc HR xác nhận;
- hồ sơ bị trả lại nhưng chưa bổ sung.

Thiếu hai phiếu peer không chặn công bố nếu hệ thống đã xác nhận không đủ mẫu và đã chuyển trọng số đúng policy.

## 15. Công bố kết quả và khiếu nại

Sau khi Quản lý duyệt, `/kpi/result` hiển thị:

- xếp loại tháng;
- tổng điểm;
- điểm theo nhóm tiêu chí;
- điểm mạnh;
- điều cần cải thiện;
- hành động tháng sau;
- tiến độ số tháng đạt điều kiện tăng bậc;
- thời hạn khiếu nại.

Nhận xét peer được hệ thống tổng hợp thành nội dung chung. Quản lý được chỉnh nội dung tổng hợp trước khi duyệt, nhưng không được thêm thông tin làm lộ danh tính.

Nhân viên được khiếu nại trong 48 giờ và phải chọn:

- tiêu chí cụ thể;
- dữ liệu cụ thể;
- hoặc nội dung nhận xét cần xem lại.

Trong lúc khiếu nại:

- kết quả hiển thị trạng thái “Đang xem xét”;
- chưa dùng kỳ đó để chốt tăng bậc;
- sau quyết định, hệ thống cập nhật lại tiến độ tăng bậc nếu cần.

## 16. Cấu trúc giao diện

### 16.1. `/kpi/review` — Việc cần đánh giá

Một route duy nhất, nội dung theo role.

#### Người có nhiệm vụ đánh giá

- Danh sách việc cần làm.
- Hạn hoàn thành.
- Số ca đã làm chung.
- Nút mở form ngay trên cùng workspace.
- Trạng thái: Chưa làm, Đang làm, Đã gửi, Quá hạn, Cần bổ sung.

#### Quản lý cửa hàng

Ba nhóm:

1. Cần chọn người đánh giá.
2. Đang chờ hoàn thành.
3. Cần duyệt kết quả.

#### HR Admin

- Tiến độ toàn chuỗi.
- Cửa hàng đang trễ.
- Kỳ thiếu người đánh giá.
- Kỳ thiếu mẫu ẩn danh.
- Cảnh báo thông đồng.
- Khiếu nại chờ xử lý.
- Trường hợp chọn ngoài danh sách đề xuất.

### 16.2. `/kpi/result` — Kết quả cá nhân

Tái sử dụng route hiện tại và bổ sung nội dung kết quả tháng, phản hồi, tiến độ tăng bậc và khiếu nại.

### 16.3. `/kpi/settings` — Cấu hình

Bổ sung cấu hình peer assignment, deadline, trọng số, người dự phòng và rule thiếu mẫu vào chương trình KPI hiện tại.

Không tạo thêm route nghiệp vụ nếu chưa có nhu cầu bắt buộc.

## 17. Thông báo

Mỗi mốc chỉ gửi một lần:

- Được giao nhiệm vụ.
- Còn 24 giờ trước hạn.
- Quá hạn và người dự phòng được kích hoạt.
- Có form người chấm chính cần làm.
- Có kết quả cần duyệt.
- Form bị trả lại.
- Kết quả được công bố.
- Còn 24 giờ để khiếu nại.
- Khiếu nại có quyết định.

Thông báo không được làm lộ danh tính người đánh giá peer.

## 18. Audit log bắt buộc

Lưu tối thiểu:

- danh sách hệ thống đề xuất;
- thứ tự xếp hạng và dữ liệu giải thích;
- người Quản lý chọn;
- lý do chọn ngoài danh sách;
- thời điểm giao, gửi, quá hạn;
- người dự phòng được kích hoạt;
- điểm hệ thống gợi ý;
- điểm bị điều chỉnh và lý do;
- người duyệt kết quả;
- người mở danh tính và lý do;
- phiếu bị loại và căn cứ;
- quyết định khiếu nại.

Audit log không cho người dùng thông thường sửa hoặc xóa.

## 19. Các trường hợp thực tế

- Nghỉ việc giữa kỳ: dừng nhiệm vụ chưa hoàn thành, giữ dữ liệu đã chốt.
- Chuyển cửa hàng giữa kỳ: dùng cửa hàng và người quản lý nơi nhân viên làm phần lớn thời gian.
- Shift Leader nghỉ phép: Quản lý chọn người chấm thay và ghi lý do.
- Quản lý trực tiếp làm nhiều ca: vẫn chấm chính nhưng không thay thế hai phiếu peer.
- Không có ai đủ điều kiện: bỏ peer theo policy và chuyển trọng số.
- Người đánh giá rời công ty sau khi gửi: phiếu vẫn hợp lệ và tiếp tục được bảo mật.
- Có sự cố nghiêm trọng: khóa công bố tới khi hồ sơ được xử lý.
- Có khiếu nại: giữ kết quả ở trạng thái đang xem xét, chưa chốt tăng bậc.

## 20. Mô hình dữ liệu đề xuất

Tên type có thể điều chỉnh theo convention hiện tại, nhưng phải giữ ranh giới nghiệp vụ sau:

### 20.1. Monthly evaluation cycle

- ID kỳ.
- Tháng.
- Store scope.
- KPI version snapshot.
- Trạng thái kỳ.
- Mốc mở, deadline, khóa.

### 20.2. Evaluation subject

- Nhân viên được đánh giá.
- Chức danh và cửa hàng snapshot.
- Người chấm chính.
- Trạng thái flow.
- Cờ thiếu mẫu, cảnh báo, khiếu nại.

### 20.3. Peer assignment

- Subject ID.
- Reviewer ID bảo mật.
- Rank và lý do xếp hạng.
- Selected by system/manager.
- Trạng thái assigned/submitted/expired/replaced.
- Deadline và replacement reference.

### 20.4. Peer response

- Năm câu trả lời.
- Evidence cho điểm cực trị.
- Strength note.
- Improvement note.
- Submitted timestamp.
- Revision/audit metadata.

Phiếu riêng không được trả về DTO thông thường dành cho Quản lý hoặc nhân viên.

### 20.5. Peer aggregate

- Số phiếu hợp lệ.
- Điểm gộp theo câu.
- Điểm tổng.
- Nhận xét tổng hợp đã kiểm duyệt.
- Trạng thái đủ/thiếu mẫu.
- Trọng số thực tế sau fallback.

### 20.6. Primary evaluation

- Snapshot tiêu chí.
- Dữ liệu thực tế.
- Điểm gợi ý.
- Điểm xác nhận.
- Lý do điều chỉnh.
- Nhận xét và hành động tháng sau.

### 20.7. Approval record

- Người duyệt.
- Quyết định.
- Lý do trả lại/chuyển HR.
- Cảnh báo đã xác nhận.
- Thời điểm công bố.

### 20.8. Audit event

- Actor.
- Action.
- Target type/ID.
- Before/after metadata cần thiết.
- Reason.
- Timestamp.

### 20.9. Ranh giới bảo mật dữ liệu ẩn danh

Ẩn danh không được triển khai chỉ bằng cách giấu tên trên giao diện.

- Reviewer identity và peer response riêng phải nằm trong vùng dữ liệu có quyền truy cập riêng.
- DTO dành cho Quản lý và nhân viên chỉ nhận aggregate, không nhận mảng response riêng hoặc reviewer ID.
- API/repository dành cho HR/CEO mở danh tính phải kiểm tra role, reason và ghi audit trước khi trả dữ liệu.
- Không lưu reviewer identity và nội dung phiếu riêng trong một localStorage object mà mọi role trên client đều đọc được nếu triển khai production.
- Local adapter chỉ được dùng để mô phỏng flow demo; khi chạy thật phải dùng backend/repository có RLS hoặc cơ chế phân quyền tương đương.
- Nếu backend bảo mật chưa hoàn thành, giao diện phải được ghi nhận là demo và không được quảng bá là ẩn danh production.

## 21. Service boundaries đề xuất

Tách logic thuần TypeScript để test độc lập:

1. `peer-assignment-service`: eligibility, ranking, selection, auto-selection, replacement.
2. `peer-response-service`: validation form, evidence rules, submit lock.
3. `peer-aggregation-service`: anonymity threshold, aggregate, weight fallback.
4. `monthly-evaluation-service`: subject lifecycle và primary review.
5. `evaluation-approval-service`: blockers, approve, return, escalate.
6. `evaluation-integrity-service`: warning signals và HR resolution.
7. `evaluation-notification-service`: idempotent notification milestones.

Trang `/kpi/review` giữ vai trò controller và render theo role; không nhét thuật toán assignment hoặc scoring trực tiếp vào component.

## 22. Validation quan trọng

- Không giao chính subject làm reviewer.
- Reviewer phải đủ tổng ca và ca làm chung.
- Không có assignment trùng active cho cùng subject/reviewer.
- Không cho submit sau khi assignment bị thay thế.
- Điểm chỉ từ 1 đến 5.
- Điểm 1, 2, 5 bắt buộc evidence hợp lệ.
- Không aggregate khi dưới hai phiếu hợp lệ.
- Không trả reviewer identity trong employee/manager DTO.
- Peer cap không vượt 15%.
- Không publish khi còn blocker.
- Không mở identity nếu thiếu role hoặc reason.
- Không dùng kết quả đang appeal để chốt promotion readiness.

## 23. Kiểm thử bắt buộc

### 23.1. Unit tests

- Eligibility theo total shifts/shared shifts.
- Ranking ổn định và giải thích được.
- Chặn reciprocal review.
- Auto-select sau deadline.
- Replacement reviewer sau quá hạn.
- Validation evidence cho điểm cực trị.
- Aggregate chỉ khi đủ hai phiếu.
- Fallback trọng số khi thiếu mẫu.
- DTO không lộ reviewer identity.
- Publish blockers.
- Integrity flags không tự kết luận gian lận.
- Appeal giữ kết quả khỏi promotion readiness.

### 23.2. Integration tests

- Mở kỳ → phân công → gửi phiếu → primary review → manager approve → publish.
- Manager không chọn → hệ thống tự chọn.
- Reviewer quá hạn → người dự phòng hoàn thành.
- Không đủ mẫu → fallback và vẫn publish hợp lệ.
- Cảnh báo bất thường → chặn tới khi được xác nhận.
- Khiếu nại → quyết định → cập nhật readiness.

### 23.3. Browser QA

- Desktop Quản lý chọn 2 người.
- Mobile nhân viên hoàn thành form trong một màn hình cuộn hợp lý.
- Quản lý không xem được phiếu riêng.
- Nhân viên không thấy identity qua UI, URL hoặc payload hiển thị.
- Bulk approve chỉ áp dụng hồ sơ sạch.
- Responsive tối thiểu tại 390x844.

## 24. Tiêu chí nghiệm thu

- Quản lý chọn được 2 người từ danh sách hệ thống gợi ý.
- Hệ thống tự chọn khi Quản lý quá hạn.
- Người dự phòng được kích hoạt đúng lúc.
- Chỉ HR/CEO có quyền điều tra mới mở được danh tính.
- Không đủ hai phiếu vẫn chốt đúng policy.
- Form peer làm được trên mobile trong khoảng 3 phút.
- Người chấm chính không nhập lại dữ liệu đã có.
- Quản lý duyệt nhanh hồ sơ bình thường.
- Hồ sơ bất thường không thể công bố khi chưa xử lý.
- Kết quả đi vào tiến độ xét tăng bậc.
- Nhân viên khiếu nại được trong 48 giờ.
- Toàn bộ hành động quan trọng có audit log.

## 25. Quyết định đã chốt

1. Hệ thống đề xuất, Quản lý chọn 2 người.
2. Quản lý quá hạn 24 giờ thì hệ thống tự chọn.
3. Reviewer phải đạt setting tổng ca và ca làm chung; mặc định 8 và 5.
4. Phiếu peer gồm 5 câu chung.
5. Peer mặc định 10%, tối đa 15%.
6. Ẩn danh với subject; Quản lý chỉ xem aggregate; HR/CEO mở có lý do.
7. Không đủ hai phiếu thì bỏ peer và chuyển trọng số sang primary reviewer.
8. Primary form tự sinh từ KPI theo chức danh.
9. Reviewer deadline 48 giờ và có người dự phòng.
10. Quản lý duyệt kết quả nhân viên tuyến đầu.
11. Nhân viên khiếu nại trong 48 giờ.
12. Trụ sở tự mở kỳ theo lịch Admin.
13. Giai đoạn 2 gồm frontline và Shift Leader.
14. Store 360 quarterly tách sang giai đoạn riêng.

## 26. Trạng thái quyết định

Toàn bộ lựa chọn nghiệp vụ trong phạm vi Giai đoạn 2 đã được chốt. Implementation plan phải bám đúng phạm vi trên và chia nhỏ theo service thuần → repository bảo mật → workspace role-based → kết quả/khiếu nại → verification.
