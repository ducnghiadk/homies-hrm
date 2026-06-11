# Thiết kế bộ cấu hình onboarding trọn vẹn

## 1. Mục tiêu

Hoàn thiện lớp cấu hình onboarding để đội vận hành có thể quản trị trọn vòng đời nội dung onboarding mà không cần sửa code, đồng thời vẫn giữ an toàn dữ liệu cho nhân viên đang onboarding.

Bản này phải đáp ứng đủ các năng lực sau:

- cấu hình role onboarding theo chức danh
- quản lý thư viện nội dung onboarding theo template
- quản lý vòng đời template `draft -> validate -> publish -> archive`
- preview hành trình onboarding cho góc nhìn `nhân viên` và `operations`
- báo cáo nhanh tình trạng cấu hình và vận hành onboarding
- import/export có `schema_version`
- audit log cho các thay đổi cấu hình quan trọng
- chuẩn hóa tiếng Việt có dấu trong toàn bộ vùng onboarding settings liên quan

## 2. Bối cảnh hiện tại

### 2.1. Đã có nền lõi nhưng chưa thành bộ hoàn chỉnh

Code hiện tại đã có một phần nền tảng:

- `src/app/career-path/settings/page.tsx` đã có tab `Cấu hình onboarding` và lớp summary cơ bản
- `src/components/onboarding-settings/OnboardingRoleCard.tsx` đã có UI map role, chọn template, gán chức danh
- `src/lib/career-path-service.ts` đã có:
  - `validateOnboardingRoleSettings()`
  - `duplicateOnboardingChecklistTemplate()`
  - `publishOnboardingChecklistTemplate()`
  - `assignOnboardingChecklistTemplateToEmployee()`
- `src/lib/services/onboarding-content-runtime-service.ts` đã có runtime builder dựng hành trình theo ngày từ template snapshot

Điều này nghĩa là hệ thống đã vượt khỏi mức mock đơn thuần. Tuy vậy, phần quản trị hiện mới thiên về đọc và gán role hơn là chỉnh sửa nội dung onboarding trọn vòng đời.

### 2.2. Khoảng trống còn lại

Các khoảng trống chính:

- chưa có editor đầy đủ cho `template`, `topic`, `stage`, `item`
- chưa có preview chính thức cho bản nháp trước khi publish
- chưa có luồng so sánh `draft` với `published`
- chưa có báo cáo tổng hợp template nào đang chạy, ai đang dùng version nào, cửa hàng nào đang lệch cấu hình
- chưa có import/export có version schema rõ ràng cho khối onboarding
- chưa có audit log quản trị onboarding đủ dùng
- vẫn còn một số chuỗi tiếng Việt lỗi mã hóa ở các file onboarding lớn

## 3. Phạm vi

### 3.1. Trong phạm vi

Bản trọn vẹn này gồm:

1. `Onboarding settings + journey rules`
2. `Onboarding content library editor`
3. `Publish flow` có validate trước publish
4. `Preview runtime` cho `nhân viên` và `operations`
5. `Reports` cho cấu hình và vận hành onboarding
6. `Import/export schema` có `schema_version`
7. `Audit log`
8. `Quét và sửa chuỗi tiếng Việt` trong vùng onboarding liên quan

### 3.2. Ngoài phạm vi

- phân quyền chi tiết theo vai trò người dùng
- adaptive learning theo từng nhân viên
- CMS rich media
- chỉnh lại toàn bộ kiến trúc onboarding ngoài vùng settings/content library/reports nếu không phục vụ trực tiếp mục tiêu này

## 4. Nguyên tắc nghiệp vụ phải khóa cứng

### 4.1. Published template chỉ áp dụng cho nhân viên mới

- `published template` là template sống dùng để gán cho nhân viên mới theo role onboarding
- khi template mới được publish, nhân viên mới nhận bản `published` mới nhất của role tương ứng
- nhân viên đang onboarding tiếp tục giữ `template_id` snapshot cũ đang gắn trong plan

### 4.2. Draft không được ảnh hưởng runtime đang chạy

- mọi chỉnh sửa nội dung phải diễn ra trên `draft`
- `draft` có thể được duplicate từ `published` hoặc từ `draft` khác theo rule cho phép
- `draft` không được làm đổi day journey, checklist, quiz, stage summary của nhân viên đang dùng plan cũ

### 4.3. Publish là thao tác nguyên tử

Khi publish thành công một template cho 1 `role_code`:

- bản `published` cũ của cùng role bị chuyển sang `archived`
- bản `draft` mục tiêu thành `published`
- dữ liệu được save đủ một lần, tránh trạng thái nửa publish nửa dở
- ghi audit log đầy đủ

### 4.4. Preview phải dùng chung runtime builder

- preview `nhân viên`
- preview `operations`
- report ngày/chặng

đều phải dùng chung service dựng runtime từ template để tránh mỗi nơi render một kiểu.

### 4.5. Import phải qua cùng validator như save UI

- import không được bypass validation
- payload onboarding lỗi phải reject toàn bộ
- nếu schema cũ còn hỗ trợ migrate, migration phải chạy trước validate

## 5. Thiết kế chức năng

### 5.1. Khối A - Journey Rules và role mapping

Mục tiêu khối này là chốt “nhân viên nào nhận template nào”.

Năng lực cần có:

- map `chức danh -> role onboarding`
- map `role onboarding -> template đang dùng`
- hiển thị role đang bật/tắt
- hiển thị nhân viên chưa khớp role
- hiển thị chức danh đang gán trùng nhiều role
- hiển thị impact khi đổi template: chỉ áp dụng nhân viên mới, không làm đổi snapshot cũ

Rule dữ liệu:

- role bật phải có template hợp lệ
- template phải tồn tại và cùng `role_code`
- archived template không được chọn làm template active
- import hoặc save role settings sai phải fail ngay

### 5.2. Khối B - Content Library Editor

Đây là trung tâm của bản hoàn chỉnh.

Editor nên tách thành các đơn vị rõ:

- `Template list / summary`
- `Template metadata editor`
- `Topic editor`
- `Stage editor`
- `Checklist item editor`
- `Validation panel`
- `Publish actions`

#### 5.2.1. Template list

Phải hiển thị:

- tên template
- `role_label`
- version
- trạng thái `draft | published | archived`
- số topic
- số item
- số ngày hành trình
- thời gian cập nhật gần nhất

Action cần có:

- tạo draft mới
- duplicate từ template hiện có
- mở editor
- archive draft hoặc archived item theo rule cho phép
- publish draft

#### 5.2.2. Template metadata editor

Trường cần chỉnh:

- tên template
- mô tả
- role liên kết nếu rule cho phép đổi trong draft
- số ngày hành trình `journey_length_days` trong ngưỡng hỗ trợ
- trạng thái lưu local `đã sửa/chưa lưu`

Bản đầu nên giữ `journey_length_days` trong khoảng hẹp và tương thích runtime hiện tại, ví dụ từ 1 đến 14 ngày.

#### 5.2.3. Topic editor

Phải cho phép:

- thêm topic
- sửa label
- sửa code nếu hệ thống đang dùng code rõ ràng
- bật/tắt active
- đổi thứ tự
- xóa mềm hoặc archive theo rule

Không được tự phát minh field mới ngoài contract lõi.

#### 5.2.4. Stage editor

Phải quản được các stage onboarding đã chuẩn hóa, ví dụ:

- `pre_start`
- `day_1`
- `day_2_3`
- `day_4_7`
- `week_2`

Cho phép chỉnh:

- label hiển thị
- mô tả ngắn
- thứ tự
- trạng thái active

Không mở scope thành stage engine động hoàn toàn nếu runtime hiện tại chưa hỗ trợ. Ưu tiên tương thích service sẵn có.

#### 5.2.5. Checklist item editor

Mỗi item cần chỉnh được:

- title
- description
- topic
- stage
- estimated minutes
- required/optional
- active/inactive
- completion method nếu model đang có
- evidence type nếu model đang có
- người xác nhận nếu model đang có
- `is_focus_block_eligible`
- `ops_visibility`

Cần có các action tối thiểu:

- thêm item
- sửa item
- duplicate item
- đổi thứ tự
- archive hoặc tắt active

### 5.3. Khối C - Publish validation

Publish validation phải trả về report có cấu trúc, không chỉ là chuỗi text ghép lỗi.

Các nhóm lỗi tối thiểu:

- `missing_topic`
- `missing_item`
- `missing_orientation`
- `missing_hygiene`
- `missing_service`
- stage không có item active
- item không có `topic_id` hợp lệ
- item không có `stage_id` hợp lệ
- item bắt buộc nhưng thiếu dữ liệu hiển thị cốt lõi

UI publish phải hiển thị:

- danh sách lỗi theo nhóm
- lỗi nào chặn publish
- lỗi nào chỉ là cảnh báo nếu có hỗ trợ warning

### 5.4. Khối D - Preview runtime

Preview phải cho xem cùng một template dưới 2 góc nhìn.

#### 5.4.1. Preview nhân viên

Hiển thị:

- hero tiến độ onboarding
- stage hiện tại
- checklist theo ngày hoặc theo chặng
- mini quiz nếu có
- self review nếu có
- trạng thái `đây là preview`, không phải dữ liệu nhân viên thật

#### 5.4.2. Preview operations

Hiển thị:

- day journey summary
- focus block theo ngày
- các item visible cho operations
- các chặng cần chốt hoặc follow-up

#### 5.4.3. Diff draft vs published

Cần có summary so sánh ít nhất:

- số topic thay đổi
- số item thêm/bớt
- item bắt buộc thay đổi
- ngày hành trình thay đổi
- stage nào thay đổi nhiều nhất

Mục tiêu là giúp HR biết bản publish sắp tới khác gì bản đang chạy.

### 5.5. Khối E - Reports

Reports cần trả lời nhanh các câu hỏi vận hành:

- role nào đang bật nhưng thiếu template hợp lệ
- template nào đang published, draft, archived
- nhân viên nào đang dùng template version nào
- cửa hàng nào có nhân viên unmatched role
- cửa hàng nào có nhân viên đang dùng template archived snapshot
- số lượng nhân viên theo role onboarding và theo template version

Dạng hiển thị nên là summary cards + bảng ngắn + deep links về đúng khu settings/editor.

### 5.6. Khối F - Import/Export schema

Import/export onboarding phải có envelope riêng hoặc trường onboarding đủ rõ trong envelope settings tổng.

Tối thiểu cần có:

- `schema_version`
- metadata export như `exported_at`, `source`, `module`
- payload cho:
  - role settings
  - templates
  - topics
  - stages
  - items

Rule:

- schema sai version mà chưa có migration thì reject
- schema cũ nhưng hỗ trợ migration thì migrate rồi validate
- mọi import thành công phải ghi audit log

### 5.7. Khối G - Audit log

Audit log quản trị onboarding phải ghi tối thiểu các event:

- tạo draft template
- duplicate template
- sửa metadata template
- thêm/sửa/xóa mềm topic
- thêm/sửa/xóa mềm stage
- thêm/sửa/xóa mềm item
- publish template
- archive template
- đổi role mapping
- import onboarding settings/content

Shape tối thiểu của event:

- `id`
- `event_type`
- `entity_type`
- `entity_id`
- `summary`
- `changed_fields`
- `actor`
- `created_at`

UI audit log cần có:

- danh sách event mới nhất
- lọc cơ bản theo loại hành động nếu chi phí thấp
- trạng thái rỗng rõ ràng

### 5.8. Khối H - Tiếng Việt có dấu

Quét và sửa toàn bộ copy onboarding liên quan:

- settings page
- content library panels
- editor labels
- preview labels
- audit/report labels
- warning/error/help text

Nguyên tắc:

- ưu tiên đúng nghĩa tiếng Việt, không chỉ sửa ký tự hỏng
- không đổi logic khi chỉ làm pass copy
- với file lớn đang lỗi mã hóa nặng, phải sửa theo scope onboarding để tránh diff lan quá rộng

## 6. Kiến trúc module và biên file

Để hỗ trợ triển khai song song bằng `antigravity`, hệ thống nên chia theo lát cắt dọc có contract lõi chung.

### 6.1. Core contract

Khối lõi cần chốt trước:

- type cho template/topic/stage/item/snapshot
- type cho publish validation report
- type cho template diff summary
- type cho audit entry
- type cho import/export envelope
- helper normalize/validate/migrate cần thiết

Khối này phải ổn định trước khi giao UI song song.

### 6.2. UI slices độc lập

Các khối có thể song song tương đối tốt khi core contract đã chốt:

- template list
- topic editor
- stage editor
- item editor
- preview employee
- preview operations
- report panels
- audit panel
- copy cleanup

### 6.3. Integration layer

`src/app/career-path/settings/page.tsx` không nên tiếp tục phình vô hạn. Bản này nên ưu tiên tách component con theo vùng:

- `OnboardingSettingsOverviewSection`
- `OnboardingTemplateLibrarySection`
- `OnboardingTemplateEditorSection`
- `OnboardingTemplatePreviewSection`
- `OnboardingReportsSection`
- `OnboardingAuditLogSection`

Tên cụ thể có thể điều chỉnh theo pattern repo, nhưng nguyên tắc là tách rõ trách nhiệm.

## 7. Chiến lược triển khai song song

### 7.1. Nhóm việc lõi, phải làm trước hoặc review rất kỹ

- chốt core types và contract
- chốt publish validation report
- chốt import/export schema
- chốt audit event shape
- chốt snapshot/publish rules

Đây là phần không nên giao `flash 3.5` tự quyết định.

### 7.2. Nhóm việc thích hợp giao `Anti`

- UI component độc lập
- panel báo cáo
- panel audit
- editor con cho topic/stage/item khi contract đã rõ
- preview UI khi runtime service đã rõ input
- test contract và test render bám theo behavior đã chốt
- quét tiếng Việt file scope nhỏ

### 7.3. Nhóm việc hợp nhất cuối

- nối các panel vào settings page
- chạy test tích hợp
- rà copy tiếng Việt lần cuối
- rà impact import/export và migration
- kiểm tra không có task nào lỡ thêm field lệch contract

## 8. Kiểm thử bắt buộc

Bản này cần tối thiểu các lớp test sau:

### 8.1. Service tests

- duplicate template giữ đúng quan hệ topic/stage/item
- publish archive đúng published cũ
- publish fail khi validation lỗi
- import fail khi schema sai hoặc payload sai
- migration hoạt động với schema cũ còn hỗ trợ
- role settings không nhận template archived hoặc khác role

### 8.2. Runtime tests

- preview draft và published đều dựng đúng day journey
- employee plan cũ giữ snapshot cũ sau khi publish template mới
- diff summary phản ánh thay đổi chính xác ở mức aggregate

### 8.3. Contract/UI tests

- settings page có đủ IA section
- editor hiển thị đúng trạng thái draft/published/archived
- audit panel hiển thị event shape chuẩn
- report panel hiển thị metric và trạng thái rỗng đúng
- copy tiếng Việt không còn chuỗi lỗi mã hóa trong vùng onboarding đã chốt

## 9. Rủi ro và cách chặn

### 9.1. Rủi ro file lớn và dirty workspace

`settings/page.tsx`, `career-path-service.ts`, `mock-data-career-path.ts` đều là file lớn và workspace đang dirty.

Cách chặn:

- tránh refactor lan man ngoài scope onboarding
- tách component mới thay vì nhồi thêm vào page hiện tại
- review kỹ diff ở file lõi trước khi merge

### 9.2. Rủi ro `Anti` tự phát minh contract

Cách chặn:

- task giao `Anti` phải ghi rõ file được sửa và file cấm sửa
- không cho `Anti` đổi type lõi nếu task không yêu cầu
- mọi task phải có test/acceptance rõ

### 9.3. Rủi ro lệch logic giữa preview và runtime thật

Cách chặn:

- mọi preview dùng cùng runtime builder
- không cho mỗi panel tự group item theo logic riêng nếu service đã có output chuẩn

## 10. Kết quả mong muốn

Khi hoàn tất bản này:

- HR có thể tự quản trị nội dung onboarding bằng UI
- published template an toàn cho nhân viên mới
- nhân viên đang onboarding không bị đổi snapshot giữa chừng
- operations và employee preview phản ánh đúng runtime thật
- import/export có version schema và không nuốt dữ liệu lỗi
- có audit trail đủ dùng cho truy vết thay đổi
- vùng onboarding quan trọng hiển thị tiếng Việt có dấu rõ ràng
