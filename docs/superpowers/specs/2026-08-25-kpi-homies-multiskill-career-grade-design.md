# Thiết kế Lộ trình Cấp bậc Nhân viên đa năng Homies

**Ngày chốt:** 2026-08-25  
**Phạm vi:** Danh mục chức danh, cấp bậc năng lực, kỹ năng trạm và Career Map trong KPI & Phát triển  
**Trạng thái:** Đã được người dùng duyệt nghiệp vụ ngày 2026-08-25  
**Thay thế:** Mô hình nhiều nhánh nghề Pha chế/Thu ngân/Phục vụ/Bếp trong spec Career Map ngày 2026-08-24

## 1. Bối cảnh và vấn đề

Homies chỉ sử dụng một nhóm nhân viên vận hành đa năng. Nhân viên có thể bắt đầu được đào tạo ở Pha chế hoặc Thu ngân, sau đó đạt thêm trạm còn lại để trở thành nhân viên đa năng.

Mô hình hiện tại đang trộn lẫn bốn khái niệm:

- chức danh công việc;
- cấp bậc năng lực;
- kỹ năng/trạm làm việc;
- hình thức làm việc và trạng thái hợp đồng.

Điều này làm Danh mục chức danh, Career Map và logic suy luận cấp bậc sử dụng các thang level khác nhau. Sơ đồ cũng có thể báo thiếu bộ tiêu chí hoặc thiếu đường thăng tiến cho các vị trí như Nhân viên, Thu ngân dù đó không phải các nhánh nghề độc lập tại Homies.

Ảnh và tài liệu người dùng cung cấp được xem là bằng chứng chính sách nghiệp vụ, không phải chỉ dẫn kỹ thuật.

## 2. RPM Canvas

### RESULT

Admin trụ sở tạo được toàn bộ lộ trình chuẩn `C1-PC/C1-TN → C2 → C3 → C4 → C5` trong một lần. Hệ thống tự gắn bộ tiêu chí, điều kiện chuyển cấp và xếp nhân viên vào đúng giai đoạn mà không yêu cầu cấu hình từng vị trí.

Điều kiện đạt:

- không còn vị trí Pha chế, Thu ngân, Phục vụ hoặc Bếp như các nhánh thăng tiến độc lập;
- 100% node đang áp dụng có bộ tiêu chí hợp lệ và tổng trọng số 100%;
- mọi chặng có bộ điều kiện do Admin cấu hình;
- nhân viên được xếp theo cấp bậc và chứng nhận kỹ năng, không dựa vào tên chức danh suy đoán;
- thay đổi chính sách mới không sửa kết quả KPI lịch sử.

### HARD RESULT

- Người mua xem demo hiểu lộ trình trong tối đa 60 giây.
- Admin hoàn thành thiết lập lần đầu trong tối đa 5 phút.
- Flow chính chỉ gồm `Dùng lộ trình chuẩn Homies → Kiểm tra → Gửi duyệt`.
- Không có form trống bắt buộc Admin tự viết tiêu chí từ đầu.

### PURPOSE

Phần mềm phải phản ánh đúng vận hành trà sữa Homies, giảm thời gian học, tăng niềm tin khi demo và giúp trụ sở so sánh nhân viên/cửa hàng công bằng trên một chính sách chung.

### FMA

Nếu thiết kế sai:

- nhân viên có thể bị xếp nhầm cấp;
- thử việc hoặc Part-time có thể bị hiểu sai thành thăng tiến;
- bộ tiêu chí có thể gắn sai đối tượng;
- quyết định tăng lương và tăng bậc có thể dùng sai dữ liệu;
- lịch sử đánh giá có thể bị thay đổi khi Admin sửa chính sách;
- Admin thấy sơ đồ phức tạp và từ bỏ sử dụng tính năng.

## 3. Mô hình nghiệp vụ chuẩn

### 3.1 Chức danh

Danh mục vận hành chuẩn:

1. Nhân viên cửa hàng.
2. Trưởng ca.
3. Quản lý cửa hàng.
4. Quản lý khu vực - để dành cho giai đoạn sau, không thuộc lần triển khai này.

Pha chế và Thu ngân không phải chức danh riêng trong Career Map. Chúng là kỹ năng/trạm được chứng nhận của Nhân viên cửa hàng.

### 3.2 Cấp bậc năng lực

| Mã | Tên hiển thị | Chức danh | Ý nghĩa |
|---|---|---|---|
| C1-PC | C1 - Pha chế | Nhân viên cửa hàng | Đạt chuẩn trạm Pha chế, chưa đạt Thu ngân |
| C1-TN | C1 - Thu ngân | Nhân viên cửa hàng | Đạt chuẩn trạm Thu ngân, chưa đạt Pha chế |
| C2 | Nhân viên đa năng | Nhân viên cửa hàng | Đạt chuẩn cả Pha chế và Thu ngân |
| C3 | Senior | Nhân viên cửa hàng | Thành thạo hai trạm, xử lý tình huống cơ bản, hướng dẫn người mới |
| C4 | Trưởng ca | Trưởng ca | Điều hành ca và quản lý nhân sự trong ca |
| C5 | Quản lý cửa hàng | Quản lý cửa hàng | Chịu trách nhiệm toàn bộ hoạt động cửa hàng |

`C1-PC` và `C1-TN` là hai điểm bắt đầu hội tụ tại C2. Không tồn tại các cấp `C2-PC`, `C2-TN`, `Senior PC` hoặc `Senior TN`.

### 3.3 Kỹ năng trạm

Trong phạm vi hiện tại có hai kỹ năng cốt lõi:

- Pha chế (`PC`);
- Thu ngân (`TN`).

Mỗi chứng nhận cần lưu tối thiểu:

- nhân viên;
- kỹ năng;
- trạng thái chưa học/đang học/đã đạt/hết hiệu lực;
- ngày đánh giá;
- điểm hoặc kết quả;
- người xác nhận;
- bằng chứng hoặc bài kiểm tra liên quan;
- phiên bản tiêu chuẩn đã sử dụng.

### 3.4 Hình thức làm việc và trạng thái hợp đồng

Hình thức làm việc:

- Part-time (`PT`);
- Full-time (`FT`).

Trạng thái hợp đồng:

- Thử việc (`TV`);
- Chính thức (`CT`).

Hai nhóm này độc lập với Career Map:

- `TV → CT` là thay đổi trạng thái hợp đồng, không phải tăng bậc;
- `PT → FT` là thay đổi hình thức làm việc, không phải tăng bậc;
- nhân viên thử việc đã được xếp `C1-PC` hoặc `C1-TN`;
- đạt thử việc không tự động chuyển từ C1 lên C2.

Mã nhân viên chính thức phải cố định, ví dụ `HM000123`. Không ghép cấp bậc, hình thức làm việc hoặc trạng thái hợp đồng vào mã nhân viên vì các thuộc tính này có thể thay đổi.

## 4. Sơ đồ lộ trình chuẩn

```text
C1-PC - Đạt Pha chế ──┐
                      ├→ C2 - Nhân viên đa năng → C3 - Senior → C4 - Trưởng ca → C5 - Quản lý cửa hàng
C1-TN - Đạt Thu ngân ─┘
```

Nguyên tắc:

- nhân viên bắt đầu ở một trong hai node C1;
- học và đạt trạm còn lại là điều kiện kỹ năng để xét C2;
- không cần chuyển ngang từ C1-PC sang C1-TN hoặc ngược lại;
- từ C2 trở đi chỉ có một tuyến phát triển chung;
- C5 được áp dụng ngay, không gắn nhãn lộ trình tương lai;
- hệ thống không tự động tăng hoặc hạ cấp.

## 5. Bộ tiêu chí theo cấp bậc & trạm làm việc (Chi tiết 100% trọng số)

Mỗi node cấp bậc trong lộ trình phải có một bộ tiêu chí đánh giá KPI chuẩn hóa toàn chuỗi với tổng trọng số luôn bằng **100%**. Tiêu chí và trọng số do Trụ sở ban hành thống nhất; các cửa hàng không được tự ý sửa đổi.

### 5.1 C1-PC: Nhân viên Cửa hàng - Trạm Pha chế
| STT | Tên tiêu chí | Trọng số | Loại chỉ số | Định mức chuẩn đạt |
|---|---|:---:|---|---|
| 1 | Tuân thủ công thức & Định lượng chuẩn vị | **25%** | Chất lượng (Quality) | 100% ly đồ uống chuẩn công thức Homies, không sai lệch đường/đá/topping |
| 2 | Tốc độ pha chế & Năng suất quầy bar | **20%** | Năng suất (Speed) | Thời gian ra món trung bình ≤ 90s/ly đơn; ≤ 3 phút/đơn 4 ly |
| 3 | Kiểm soát hao hụt & Bảo quản NVL | **20%** | Chi phí (Cost) | Tỷ lệ hao hụt nguyên vật liệu (cốt trà, sữa, syrup) ≤ 1.5%; dán tem date 100% |
| 4 | Vệ sinh trạm & Tiêu chuẩn VSATTP | **20%** | Tuân thủ (Safety) | Quầy bar, máy móc, dụng cụ sạch sẽ; 100% tuân thủ 5S và quy định an toàn thực phẩm |
| 5 | Tác phong, Chuyên cần & Kỷ luật ca | **15%** | Thái độ (Discipline) | Đúng giờ, đồng phục chuẩn, tác phong nhanh nhẹn, chấp hành phân công của Trưởng ca |
| **Tổng** | **5 tiêu chí chuẩn C1-PC** | **100%** | | |

---

### 5.2 C1-TN: Nhân viên Cửa hàng - Trạm Thu ngân & Tiếp đón
| STT | Tên tiêu chí | Trọng số | Loại chỉ số | Định mức chuẩn đạt |
|---|---|:---:|---|---|
| 1 | Thao tác POS & Độ chính xác dòng tiền | **30%** | Tài chính (Accuracy) | Lệch két = 0 VNĐ; 100% ghi nhận đúng món, đúng ghi chú (note) của khách |
| 2 | Tốc độ phục vụ & Xử lý thanh toán | **20%** | Năng suất (Speed) | Thời gian order ≤ 45s/khách; thao tác thanh toán tiền mặt/QR/thẻ chuẩn xác |
| 3 | Kỹ năng Upsell & Giới thiệu chương trình | **20%** | Doanh thu (Sales) | Tỷ lệ mời thành công nâng size, thêm topping hoặc combo đạt ≥ 20% tổng lượt khách |
| 4 | Giao tiếp & Trải nghiệm khách hàng (CSAT) | **15%** | Dịch vụ (Service) | Thực hiện đúng quy chuẩn 4 bước đón tiếp Homies (Chào - Cười - Lắng nghe - Cảm ơn) |
| 5 | Tác phong, Chuyên cần & Kỷ luật ca | **15%** | Thái độ (Discipline) | Đúng giờ, đồng phục chuẩn, giữ khu vực thu ngân & sảnh luôn sạch sẽ, ngăn nắp |
| **Tổng** | **5 tiêu chí chuẩn C1-TN** | **100%** | | |

---

### 5.3 C2: Nhân viên Đa năng (Đạt cả Pha chế & Thu ngân)
| STT | Tên tiêu chí | Trọng số | Loại chỉ số | Định mức chuẩn đạt |
|---|---|:---:|---|---|
| 1 | Chất lượng & Năng suất Trạm Pha chế | **25%** | Chuyên môn (PC) | Đạt chuẩn chất lượng đồ uống, tốc độ ra món ổn định theo định mức C1-PC |
| 2 | Chất lượng & Năng suất Trạm Thu ngân | **25%** | Chuyên môn (TN) | Thao tác POS chuẩn xác, không lệch tiền, duy trì tỷ lệ Upsell ≥ 20% |
| 3 | Linh hoạt đổi trạm & Ứng biến giờ cao điểm | **20%** | Linh hoạt (Agility) | Sẵn sàng hoán đổi vị trí linh hoạt theo điều phối ca khi quán đông khách (Rush-hour) |
| 4 | Kiểm soát hao hụt & Vệ sinh toàn diện | **15%** | Vận hành (Ops) | Duy trì 5S cả quầy bar lẫn quầy thu ngân, giảm thiểu tối đa đổ vỡ/hỏng món |
| 5 | Tác phong, Tỷ lệ chuyên cần & Kỷ luật | **15%** | Thái độ (Discipline) | Tỷ lệ đi làm đúng ca 100%, không vi phạm nội quy, thái độ tích cực |
| **Tổng** | **5 tiêu chí chuẩn C2** | **100%** | | |

---

### 5.4 C3: Senior - Nhân viên Cứng (Nguồn kế cận Trưởng ca)
| STT | Tên tiêu chí | Trọng số | Loại chỉ số | Định mức chuẩn đạt |
|---|---|:---:|---|---|
| 1 | Hiệu suất vận hành xuất sắc cả 2 trạm | **25%** | Chuyên môn (Core) | Năng suất vượt trội, là trụ cột xử lý các đơn hàng lớn/phức tạp trong ca |
| 2 | Kèm cặp, Hướng dẫn nhân viên mới (Buddy) | **25%** | Đào tạo (Mentoring) | Trực tiếp hướng dẫn nhân viên mới; ≥ 90% mentee phụ trách vượt qua kỳ thử việc/test trạm |
| 3 | Xử lý tình huống & CSAT khách hàng | **20%** | Dịch vụ (CSAT) | Khéo léo xử lý phàn nàn/khiếu nại cấp độ 1 tại quầy, giữ chỉ số hài lòng khách hàng cao |
| 4 | Hỗ trợ quản lý Checklist & Kiểm kê ca | **15%** | Hỗ trợ (Support) | Hỗ trợ Trưởng ca mở ca, đóng ca, đếm tồn nguyên vật liệu và kiểm tra vệ sinh 5S |
| 5 | Gương mẫu văn hóa & Đóng góp cải tiến | **15%** | Văn hóa (Culture) | Gương mẫu về tác phong, chủ động đề xuất sáng kiến tối ưu thao tác quầy |
| **Tổng** | **5 tiêu chí chuẩn C3** | **100%** | | |

---

### 5.5 C4: Trưởng ca (Quản trị Vận hành Ca trực)
| STT | Tên tiêu chí | Trọng số | Loại chỉ số | Định mức chuẩn đạt |
|---|---|:---:|---|---|
| 1 | Chỉ tiêu Doanh thu & Năng suất ca trực | **25%** | Doanh thu (Sales) | Ca trực đạt kế hoạch doanh thu phân bổ; phân chia ca làm việc tối ưu năng suất |
| 2 | Điều phối nhân sự & Kỷ luật ca | **20%** | Quản trị (Leadership) | Phân công trạm hợp lý, duy trì nhịp độ làm việc, xử lý kịp thời nhân sự phát sinh |
| 3 | Kiểm soát thất thoát, NVL & Két tiền ca | **20%** | Chi phí (Cost) | Bàn giao tiền két chuẩn 100%; tỷ lệ hao hụt nguyên vật liệu trong ca ≤ 1.2% |
| 4 | Hoàn thành Checklist mở/giao/đóng ca & 5S | **20%** | Vận hành (Checklist) | 100% ca hoàn thành checklist số hóa; đạt chuẩn an toàn vệ sinh thực phẩm toàn diện |
| 5 | Đào tạo tại chỗ (OJT) & Đánh giá nhân viên | **15%** | Đào tạo (Coaching) | Kèm cặp nhân sự trong ca, ghi nhận và đánh giá KPI thành viên ca minh bạch, công bằng |
| **Tổng** | **5 tiêu chí chuẩn C4** | **100%** | | |

---

### 5.6 C5: Quản lý Cửa hàng (Quản trị Toàn diện Chi nhánh)
| STT | Tên tiêu chí | Trọng số | Loại chỉ số | Định mức chuẩn đạt |
|---|---|:---:|---|---|
| 1 | Doanh thu, Lợi nhuận P&L & Tăng trưởng | **30%** | Tài chính (P&L) | Đạt và vượt chỉ tiêu doanh số tháng; kiểm soát chi phí vận hành cửa hàng trong hạn mức |
| 2 | Kiểm soát Cost NVL & Hao hụt toàn cửa hàng | **20%** | Chi phí (Cost) | Tỷ lệ Cost NVL thực tế bám sát định mức (Cost Variance ≤ 1.0%); kiểm kê kho chuẩn |
| 3 | Quản trị nhân sự, Đào tạo & Giữ chân | **20%** | Nhân sự (HR) | Đảm bảo định biên nhân sự, tỷ lệ gắn kết cao, đào tạo thành công tối thiểu 1 Trưởng ca mới |
| 4 | Trải nghiệm khách hàng & Chất lượng dịch vụ | **15%** | Thương hiệu (CSAT) | Điểm đánh giá CSAT cửa hàng ≥ 4.8/5.0 sao; 0 khiếu nại nghiêm trọng về thái độ/VSATTP |
| 5 | Tuân thủ tiêu chuẩn Audit chuỗi & Pháp lý | **15%** | Tuân thủ (Audit) | Điểm thanh tra/audit định kỳ từ Trụ sở ≥ 95/100; chấp hành đầy đủ quy chuẩn chuỗi & pháp luật |
| **Tổng** | **5 tiêu chí chuẩn C5** | **100%** | | |

---

## 6. Điều kiện & Quy chuẩn chuyển cấp cho từng đoạn

Hệ thống cung cấp Preset điều kiện F&B Homies mặc định. Tất cả các con số điều kiện là tham số do **Admin Trụ sở** thiết lập và quản lý. Khi nhân viên đáp ứng đủ 100% tiêu chí, hệ thống đưa vào danh sách **Đủ điều kiện xét tăng bậc** (không tự động đổi lương/cấp).

### 6.1 Đoạn 1A: C1-PC → C2 (Nhân viên Pha chế học thêm trạm Thu ngân)
- **Mục tiêu:** Mở khóa năng lực trạm thứ hai để trở thành Nhân viên Đa năng.
- **Thâm niên tối thiểu:** Đủ **02 tháng** làm việc liên tục ở cấp C1-PC.
- **Thời lượng làm việc:** Tích lũy tối thiểu **≥ 160 giờ làm việc** (hoặc ≥ 30 ca làm việc hợp lệ).
- **Điểm KPI yêu cầu:** Điểm KPI trung bình 2 tháng gần nhất đạt **≥ 80/100 điểm** (không có tháng nào dưới 75 điểm).
- **Chứng nhận kỹ năng bắt buộc:** Đạt chứng nhận **Trạm Thu ngân (TN)** với bài Test lý thuyết + thực hành POS đạt **≥ 85/100 điểm**.
- **Điều kiện chặn (Gate):** 0 vi phạm kỷ luật ca; 0 vi phạm VSATTP nghiêm trọng trong thời gian xét.
- **Thẩm quyền phê duyệt:** Quản lý Cửa hàng đề xuất → HR Admin Trụ sở xác nhận hồ sơ.

---

### 6.2 Đoạn 1B: C1-TN → C2 (Nhân viên Thu ngân học thêm trạm Pha chế)
- **Mục tiêu:** Mở khóa năng lực trạm thứ hai để trở thành Nhân viên Đa năng.
- **Thâm niên tối thiểu:** Đủ **02 tháng** làm việc liên tục ở cấp C1-TN.
- **Thời lượng làm việc:** Tích lũy tối thiểu **≥ 160 giờ làm việc** (hoặc ≥ 30 ca làm việc hợp lệ).
- **Điểm KPI yêu cầu:** Điểm KPI trung bình 2 tháng gần nhất đạt **≥ 80/100 điểm** (không có tháng nào dưới 75 điểm).
- **Chứng nhận kỹ năng bắt buộc:** Đạt chứng nhận **Trạm Pha chế (PC)** với bài Test công thức & định lượng chuẩn vị đạt **≥ 85/100 điểm**.
- **Điều kiện chặn (Gate):** 0 vi phạm kỷ luật ca; 0 sự cố làm hỏng mẻ trà/nguyên liệu nghiêm trọng.
- **Thẩm quyền phê duyệt:** Quản lý Cửa hàng đề xuất → HR Admin Trụ sở xác nhận hồ sơ.

---

### 6.3 Đoạn 2: C2 → C3 (Nhân viên Đa năng → Senior / Nhân viên Cứng)
- **Mục tiêu:** Nâng cao tay nghề, trở thành trụ cột vận hành và người hướng dẫn (Buddy) cho nhân viên mới.
- **Thâm niên tối thiểu:** Đủ **03 tháng** làm việc liên tục ở cấp C2.
- **Thời lượng làm việc:** Tích lũy tối thiểu **≥ 240 giờ** (Full-time) hoặc **≥ 150 giờ** (Part-time).
- **Điểm KPI yêu cầu:** Điểm KPI trung bình 3 tháng gần nhất đạt **≥ 85/100 điểm** (không có tiêu chí cốt lõi nào dưới 70 điểm).
- **Đóng góp & Kèm cặp:** Đã hoàn thành kèm cặp (Buddy/Mentor) tối thiểu **01 nhân viên mới** vượt qua kỳ thử việc hoặc đạt chứng nhận C1.
- **Kiểm tra nâng cao:** Đạt bài kiểm tra "Xử lý tình huống & Kỹ năng phục vụ Homies" đạt **≥ 85/100 điểm**.
- **Điều kiện chặn (Gate):** Không có khiếu nại khách hàng chưa xử lý; không đi làm trễ quá 2 lần trong 3 tháng.
- **Thẩm quyền phê duyệt:** Quản lý Cửa hàng đánh giá & đề xuất bằng văn bản → HR Trụ sở thẩm định và phê duyệt.

---

### 6.4 Đoạn 3: C3 → C4 (Senior → Trưởng Ca)
- **Mục tiêu:** Chuyển đổi từ nhân viên thực thi sang cấp cán bộ điều hành và quản trị ca làm việc.
- **Thâm niên tối thiểu:** Đủ **03 tháng** làm việc liên tục ở cấp C3 (Senior).
- **Điểm KPI yêu cầu:** Điểm KPI trung bình 3 tháng gần nhất đạt **≥ 85/100 điểm** (trong đó có ít nhất 2 tháng đạt loại Xuất sắc A/A+).
- **Khóa đào tạo & Thi nghiệp vụ:** Hoàn thành khóa học "Nghiệp vụ Quản lý Ca Homies" (Điều phối ca, Kiểm soát NVL, Xử lý khủng hoảng) và thi đỗ đạt **≥ 85/100 điểm**.
- **Thử vai thực tế (Shadowing):** Hoàn thành thử vai điều hành tối thiểu **04 ca làm việc thực tế** có biên bản đánh giá "Đạt" từ Quản lý Cửa hàng.
- **Đánh giá tín nhiệm (360):** Đạt phiếu đánh giá tín nhiệm từ các thành viên trong ca trực đạt **≥ 80% đồng thuận**.
- **Điều kiện chặn (Gate):** 0 vi phạm liên quan đến tính trung thực dòng tiền/nguyên vật liệu; 0 vi phạm quy chế quản lý.
- **Thẩm quyền phê duyệt:** Quản lý Cửa hàng lập hồ sơ đề cử → HR Trụ sở phỏng vấn nghiệp vụ → CEO ký quyết định bổ nhiệm Trưởng ca & điều chỉnh khung lương.

---

### 6.5 Đoạn 4: C4 → C5 (Trưởng Ca → Quản Lý Cửa Hàng)
- **Mục tiêu:** Chuyển đổi sang cấp quản lý toàn diện hoạt động kinh doanh và nhân sự của một chi nhánh.
- **Thâm niên tối thiểu:** Đủ **06 tháng** làm việc liên tục ở cấp C4 (Trưởng ca).
- **Điểm KPI yêu cầu:** Đạt loại Xuất sắc (≥ 88/100 điểm) tối thiểu **5 trong 6 tháng** gần nhất.
- **Khóa đào tạo Quản trị:** Tốt nghiệp khóa học "Quản trị Chi nhánh F&B Toàn diện Homies" (Quản trị P&L, Nhân sự, Cost, Pháp lý & Kiểm toán) đạt **≥ 90/100 điểm**.
- **Thử vai Quyền Quản lý (Acting SM):** Hoàn thành thử vai phụ trách điều hành cửa hàng tối thiểu **04 tuần** dưới sự kèm cặp trực tiếp từ Quản lý Khu vực / HR.
- **Hiệu quả kinh doanh thực tế:** Chi nhánh trong giai đoạn thử vai đạt hoặc vượt chỉ tiêu doanh thu và định mức chi phí (Cost NVL & Nhân sự) theo kế hoạch giao.
- **Điều kiện chặn (Gate):** Chi nhánh phụ trách không có biên bản xử phạt nặng từ thanh tra chuỗi/cơ quan nhà nước; 0 sự cố thất thoát tài sản lớn.
- **Thẩm quyền phê duyệt:** HR Trụ sở thẩm định hồ sơ toàn diện → CEO trực tiếp phỏng vấn chiến lược và ký quyết định bổ nhiệm Quản lý Cửa hàng.

---

### 6.6 Bảng tổng hợp các chặng chuyển cấp

| Chặng | Tên chặng | Thâm niên tối thiểu | Giờ/Ca tối thiểu | KPI TB yêu cầu | Bài Test / Chứng nhận | Thử vai / Đóng góp | Thẩm quyền duyệt |
|---|---|:---:|:---:|:---:|---|---|---|
| **C1-PC → C2** | Bổ sung Thu ngân | 2 tháng | ≥ 160 giờ (30 ca) | ≥ 80 đ (min 75) | Test Trạm TN ≥ 85 đ | Không | Cửa hàng trưởng → HR |
| **C1-TN → C2** | Bổ sung Pha chế | 2 tháng | ≥ 160 giờ (30 ca) | ≥ 80 đ (min 75) | Test Trạm PC ≥ 85 đ | Không | Cửa hàng trưởng → HR |
| **C2 → C3** | Lên Senior | 3 tháng | ≥ 240h (FT) / 150h (PT) | ≥ 85 đ (core ≥ 70) | Test CSAT ≥ 85 đ | Kèm 1 nhân viên mới (Buddy) | Cửa hàng trưởng → HR |
| **C3 → C4** | Lên Trưởng ca | 3 tháng | Đủ ca theo lịch | ≥ 85 đ (2 tháng A) | Test Quản lý ca ≥ 85 đ | Thử vai 4 ca + Tín nhiệm 80% | Cửa hàng trưởng → HR → CEO |
| **C4 → C5** | Lên Quản lý | 6 tháng | Đủ ca theo lịch | ≥ 88 đ (5/6 tháng) | Test Quản trị SM ≥ 90 đ | Thử vai 4 tuần (Acting SM) | HR Trụ sở → CEO duyệt |

## 7. Trải nghiệm Admin

### 7.1 Flow chính

```text
Dùng lộ trình chuẩn Homies
        ↓
Hệ thống tạo sơ đồ + tiêu chí + điều kiện mẫu
        ↓
Admin kiểm tra các cảnh báo có hành động xử lý ngay
        ↓
Xem trước nhân viên và cửa hàng bị ảnh hưởng
        ↓
Gửi duyệt
        ↓
Người có thẩm quyền duyệt và chọn ngày hiệu lực
```

Kéo thả, sửa từng node và chỉnh trọng số chỉ nằm trong `Tùy chỉnh nâng cao`.

### 7.2 Xử lý node thiếu tiêu chí

Không chỉ hiển thị dòng lỗi. Tại lỗi phải có các hành động:

1. `Dùng bộ Homies` - lựa chọn mặc định.
2. `Sao chép từ cấp gần nhất`.
3. `Chọn từ thư viện F&B`.
4. `Tạo tiêu chí riêng`.

Nếu dùng mẫu Homies, hệ thống tự tạo đủ bộ tiêu chí và tự cân trọng số về 100%, sau đó cho Admin xem trước trước khi lưu.

### 7.3 Xử lý hàng loạt

Admin có thể chọn `Hoàn thiện toàn bộ sơ đồ`. Hệ thống tự:

- gắn bộ tiêu chí còn thiếu;
- gắn preset điều kiện còn thiếu;
- báo các nhân viên chưa xác định được C1-PC hoặc C1-TN;
- không tự đoán dữ liệu nhân viên khi thiếu bằng chứng.

## 8. Xếp nhân viên vào lộ trình

Ưu tiên dữ liệu theo thứ tự:

1. quyết định cấp bậc đang có hiệu lực;
2. chứng nhận kỹ năng đang có hiệu lực;
3. hồ sơ chuyển đổi đã được HR xác nhận;
4. nếu thiếu, đưa vào danh sách `Cần xác nhận cấp bậc`.

Không suy luận cấp bậc chỉ từ tên chức danh chứa các từ `thử việc`, `chính`, `senior`, `trưởng ca` hoặc `quản lý`.

Quy tắc C1:

- chỉ đạt Pha chế → C1-PC;
- chỉ đạt Thu ngân → C1-TN;
- đạt cả hai nhưng chưa có quyết định C2 → giữ cấp hiện tại và hiển thị `Đủ điều kiện xét C2`;
- không có chứng nhận hợp lệ → `Chưa xác định trạm ban đầu`.

## 9. Quy trình xét tăng bậc

```text
Hệ thống phát hiện đủ điều kiện
        ↓
Đưa vào danh sách Đủ điều kiện xét
        ↓
Quản lý cửa hàng đề xuất
        ↓
Trụ sở kiểm tra dữ liệu mới nhất
        ↓
Test hoặc thử vai nếu chặng yêu cầu
        ↓
Admin duyệt cấp, lương và ngày hiệu lực
        ↓
Lưu lịch sử và thông báo
```

Quyết định phải lưu:

- cấp cũ và cấp mới;
- chức danh cũ và chức danh mới nếu có;
- người đề xuất và người duyệt;
- kết quả kiểm tra điều kiện;
- kết quả test/thử vai;
- mức lương cũ và mức lương mới;
- ngày hiệu lực;
- lý do và ghi chú;
- phiên bản chính sách được sử dụng.

## 10. Trường hợp đặc biệt

- Nhân viên chuyển cửa hàng vẫn giữ cấp bậc, kỹ năng và lịch sử.
- Nhân viên làm nhiều cửa hàng được tổng hợp theo ca/giờ thực tế.
- Tháng không đủ ca/giờ do nghỉ dài ngày không tự tính là đạt hoặc không đạt.
- Chuyển cấp giữa tháng áp dụng từ ngày hiệu lực; kỳ cũ giữ snapshot cũ.
- KPI giảm không tự động hạ cấp; dùng luồng cải thiện năng lực hoặc kỷ luật riêng.
- Lỗi nghiêm trọng chặn xét đến ngày được cấu hình và phải có bằng chứng/người xác nhận.
- Nếu bài test hoặc thử vai hết hạn, hệ thống yêu cầu thực hiện lại theo chính sách hiện hành.
- Nếu nhân viên đang trong một đề xuất tăng bậc, không tạo đề xuất trùng cho cùng chặng.

## 11. Dữ liệu và tương thích

Thiết kế cần tách các khái niệm sau thành dữ liệu độc lập:

- `Position`: chức danh công việc;
- `CareerGrade`: cấp bậc năng lực;
- `OperationalSkill`: kỹ năng/trạm;
- `EmployeeSkillCertification`: chứng nhận kỹ năng của nhân viên;
- `EmployeeCareerPlacement`: cấp bậc đang có hiệu lực;
- `CareerTransitionRule`: điều kiện của từng chặng;
- `EmploymentType`: Part-time/Full-time;
- `ContractStatus`: Thử việc/Chính thức.

Tên kỹ thuật cuối cùng được quyết định trong implementation plan sau khi đối chiếu schema thật. Spec không cho phép gộp lại các khái niệm trên chỉ để giảm số bảng/trường.

### 11.1 Chuyển đổi dữ liệu cũ

- Không xóa hoặc đổi hàng loạt chức danh cũ ngay lập tức.
- Tạo bảng đối chiếu dữ liệu cũ sang mô hình mới.
- Nhân viên có dữ liệu rõ ràng được chuẩn bị bản xem trước chuyển đổi.
- Nhân viên mang chức danh Pha chế/Thu ngân nhưng không đủ chứng nhận được đưa vào danh sách HR xác nhận.
- Không tự cấp C2 chỉ vì hồ sơ cũ có hai vị trí kiêm nhiệm.
- Kết quả KPI, quyết định lương và lịch sử công tác cũ phải giữ nguyên.
- Triển khai theo phiên bản và có khả năng quay lại bản Career Map trước đó nếu chưa phát sinh quyết định mới.

## 12. Phân quyền

- **Admin trụ sở/HR:** tạo bản nháp, sửa tiêu chí, trọng số, preset điều kiện và xử lý dữ liệu cần xác nhận.
- **Người phê duyệt trụ sở:** duyệt và ban hành phiên bản; duyệt quyết định tăng bậc/lương theo quyền được cấu hình.
- **Quản lý cửa hàng:** xem điều kiện, theo dõi tiến độ, đề xuất nhân viên và đánh giá thử vai; không sửa chính sách.
- **Trưởng ca:** ghi nhận vận hành/đánh giá trong phạm vi được giao; không duyệt tăng bậc.
- **Nhân viên:** xem cấp hiện tại, kỹ năng đã đạt, điều kiện còn thiếu và lịch sử quyết định của chính mình.

Mọi hành động sửa chính sách, phê duyệt hoặc từ chối phải có nhật ký.

## 13. Phiên bản và bảo vệ lịch sử

- Mỗi thay đổi sau khi ban hành tạo phiên bản mới.
- Phiên bản mới có ngày hiệu lực, không áp dụng hồi tố.
- Kỳ KPI đã chốt giữ snapshot tiêu chí, trọng số, mục tiêu và điều kiện đã dùng.
- Quyết định tăng bậc giữ snapshot chính sách tại thời điểm duyệt.
- Không cho xóa cứng cấp bậc hoặc kỹ năng đã có dữ liệu lịch sử; chỉ ngưng áp dụng.

## 14. Đánh giá ảnh hưởng 5D

| Khu vực | Ảnh hưởng | Mức độ | Giải thích |
|---|---|---|---|
| UX | Có | YELLOW | Rút flow chính còn ba bước và chuyển cấu hình chi tiết vào nâng cao |
| UI | Có | YELLOW | Sơ đồ, node, cảnh báo và màn hình chi tiết cấp bậc thay đổi |
| FE/BE | Có | RED | Thay logic suy luận level, mapping nhân viên, validation và promotion |
| Data | Có | RED | Tách chức danh, cấp bậc, kỹ năng và trạng thái; cần chuyển đổi dữ liệu cũ |
| Security | Có | YELLOW | Giữ mô hình quyền hiện tại nhưng phải kiểm tra lại quyền sửa/duyệt và nhật ký |

Stop rule đã được kích hoạt do FE/BE và Data ở mức RED. Người dùng đã chọn phương án A ngày 2026-08-25: đồng ý thay đổi cấu trúc dữ liệu và tiếp tục spec.

## 15. Kiểm thử và tiêu chí nghiệm thu

### 15.1 Nghiệp vụ

- [ ] C1-PC và C1-TN hội tụ đúng tại C2.
- [ ] C2 chỉ đủ điều kiện khi có chứng nhận Pha chế và Thu ngân hợp lệ.
- [ ] Thử việc → Chính thức không làm thay đổi cấp bậc.
- [ ] Part-time → Full-time không làm thay đổi cấp bậc.
- [ ] Đủ điều kiện chỉ tạo trạng thái chờ xét, không tự tăng bậc hoặc lương.
- [ ] C5 được phép áp dụng và xét tăng bậc.
- [ ] Không có đường nối nghề riêng Pha chế/Thu ngân/Phục vụ/Bếp.

### 15.2 Trải nghiệm Admin

- [ ] Một thao tác tạo đủ sơ đồ, tiêu chí và preset điều kiện Homies.
- [ ] Lỗi thiếu tiêu chí có nút `Dùng bộ Homies` ngay tại lỗi.
- [ ] Admin không phải mở từng node để hoàn thiện sơ đồ chuẩn.
- [ ] Admin xem được số nhân viên/cửa hàng bị ảnh hưởng trước khi gửi duyệt.
- [ ] Cửa hàng không sửa được tiêu chí, trọng số hoặc điều kiện.

### 15.3 Dữ liệu và lịch sử

- [ ] Nhân viên thiếu dữ liệu được đưa vào hàng chờ xác nhận, không bị tự đoán cấp.
- [ ] Chuyển cửa hàng không làm mất cấp, kỹ năng hoặc lịch sử.
- [ ] Phiên bản mới không sửa KPI hoặc quyết định cũ.
- [ ] Migration có bản xem trước, danh sách loại trừ và báo cáo đối chiếu.
- [ ] Có phương án rollback trước khi phiên bản mới phát sinh quyết định tăng bậc.

### 15.4 Quyền và nhật ký

- [ ] Chỉ đúng vai trò trụ sở được sửa hoặc ban hành chính sách.
- [ ] Quản lý cửa hàng chỉ đề xuất và đánh giá thử vai trong phạm vi cửa hàng.
- [ ] Mọi thay đổi chính sách và quyết định tăng bậc có nhật ký đầy đủ.

## 16. Ngoài phạm vi

- Lộ trình Quản lý khu vực C6.
- Tự động quyết định tăng lương hoặc tăng bậc.
- Tự động hạ cấp khi KPI giảm.
- Cho từng cửa hàng tạo sơ đồ hoặc trọng số riêng.
- Dùng AI tự sinh chính sách và ban hành mà không có Admin xác nhận.
- Thay đổi mã nhân viên theo cấp bậc hoặc trạng thái.

## 17. Rollback

- Giữ nguyên phiên bản Career Map đang áp dụng cho đến khi phiên bản mới được duyệt và đến ngày hiệu lực.
- Migration phải chạy theo chế độ xem trước trước khi ghi dữ liệu.
- Nếu đối chiếu sai, hủy bản nháp chuyển đổi và giữ placement cũ.
- Không rollback bằng cách xóa lịch sử KPI, chứng nhận hoặc quyết định nhân sự.
- Sau khi phiên bản mới đã phát sinh quyết định tăng bậc, rollback phải tạo phiên bản sửa sai và quyết định điều chỉnh có nhật ký, không sửa trực tiếp lịch sử.

## 18. Quyết định đã chốt

1. Homies chỉ có một chức danh nhân viên vận hành: Nhân viên cửa hàng.
2. C1 có hai điểm bắt đầu: C1-PC hoặc C1-TN.
3. C2 bắt buộc đạt Pha chế và Thu ngân.
4. C3 là Senior, hướng dẫn người mới và là nguồn Trưởng ca.
5. C5 Quản lý cửa hàng được áp dụng ngay.
6. Nhân viên thử việc đã được xếp C1; đạt thử việc không tự tăng cấp.
7. Phần mềm không tự tăng bậc hoặc đổi lương.
8. Mọi con số điều kiện do Admin trụ sở cấu hình; phần mềm cung cấp preset đề xuất.
9. Flow chính dùng mẫu Homies, kiểm tra và gửi duyệt; kéo thả nằm trong nâng cao.
10. Người dùng đã duyệt thay đổi cấu trúc dữ liệu cần thiết để tách đúng các khái niệm nghiệp vụ.
