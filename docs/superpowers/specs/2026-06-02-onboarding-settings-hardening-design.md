# Gia cố cấu hình onboarding và chuẩn hóa tiếng Việt có dấu

## 1. Mục tiêu

Hoàn thiện lớp cấu hình onboarding để:

- không thể gán nhầm checklist template sang role khác
- không thể import cấu hình onboarding sai mà hệ thống vẫn nuốt lỗi
- đồng bộ seed onboarding plan với template ID hiện hành
- bảo đảm toàn bộ phần onboarding settings hiển thị tiếng Việt có dấu

## 2. Hiện trạng và vấn đề

### 2.1. UI đang cho chọn sai template

`src/components/onboarding-settings/OnboardingRoleCard.tsx` đang render toàn bộ template active trong dropdown. Điều này cho phép HR gán template `barista` cho role `counter_staff`.

### 2.2. Validation chưa đủ chặt

`validateOnboardingRoleSettings()` mới chặn các lỗi cơ bản như label trống, thiếu template, trùng position, tắt toàn bộ role. Hàm này chưa kiểm tra:

- template có tồn tại hay không
- template có cùng `role_code` với role đang cấu hình hay không

### 2.3. Import đang bypass validation

`importSettings()` parse JSON rồi save thẳng vào store. Nếu file import chứa onboarding settings sai, hệ thống vẫn nhận và chỉ phát hiện muộn ở các thao tác sau.

### 2.4. Seed plan đang lệch template ID

`sampleEmployeeOnboardingChecklistPlans` vẫn dùng template ID legacy như `onb-template-counter-v1` và `onb-template-barista-v1`, trong khi registry template mặc định đã chuyển sang `...-published-v1`. Một số luồng operations vẫn đọc `plan.template_id` trực tiếp nên dữ liệu seed có thể hiển thị thiếu stage/item.

### 2.5. Chuỗi giao diện onboarding settings chưa đạt chuẩn tiếng Việt có dấu

`src/app/career-path/settings/page.tsx` còn nhiều chuỗi bị lỗi mã hóa hoặc cố ý để ASCII, gây trải nghiệm không đạt yêu cầu.

## 3. Thiết kế thay đổi

### 3.1. Chặn sai từ UI

- Dropdown checklist trong `OnboardingRoleCard` chỉ hiển thị template có `template.role_code === role.role_code` và trạng thái `published` hoặc `draft`.
- Nếu role đang giữ `template_id` không còn hợp lệ hoặc sai role do dữ liệu cũ, card vẫn render trạng thái cảnh báo rõ ràng để người dùng sửa.

### 3.2. Chặn sai từ service

Mở rộng `OnboardingRoleSettingsValidationIssue['code']` với các mã mới:

- `template_not_found`
- `template_role_mismatch`

`validateOnboardingRoleSettings()` sẽ:

- tra template theo `template_id`
- báo lỗi nếu template không tồn tại hoặc đã archived
- báo lỗi nếu `template.role_code !== role.role_code`

`updateOnboardingRoleSettings()` không cần đổi luồng lớn, chỉ hưởng lợi từ validator mới.

### 3.3. Siết import

`importSettings()` sẽ đổi từ kiểu “parse được là save” sang “parse, normalize, validate rồi mới save”.

Nguyên tắc:

- nếu onboarding settings sai, reject toàn bộ import và trả `false`
- không save nửa chừng để tránh trạng thái dữ liệu nửa hợp lệ nửa lỗi

### 3.4. Đồng bộ seed onboarding plan

Đổi các `template_id` legacy trong `sampleEmployeeOnboardingChecklistPlans` sang template ID hiện hành:

- `onb-template-counter-v1` -> `onb-template-counter-published-v1`
- `onb-template-barista-v1` -> `onb-template-barista-published-v1`

Pass này không thêm role onboarding mới cho `pos-003` nếu chưa có template riêng tương ứng. Trường hợp `pos-003` tiếp tục unmatched sẽ được giữ như tín hiệu cấu hình còn thiếu, không vá bằng mapping giả.

### 3.5. Chuẩn hóa tiếng Việt có dấu

Rà lại toàn bộ chuỗi trong màn onboarding settings:

- message save/reload/conflict/error
- summary metrics
- urgent panel
- title/subtitle/help text

Mục tiêu là mọi chuỗi hiển thị cho người dùng ở khu này đều có dấu đầy đủ, không còn chuỗi lỗi mã hóa.

## 4. Ảnh hưởng hành vi

- người dùng không còn chọn nhầm template khác role từ UI
- dữ liệu import sai bị chặn ngay từ đầu
- onboarding plan seed dùng đúng template registry hiện tại
- metrics/cảnh báo ở màn cấu hình onboarding dễ hiểu hơn vì dùng tiếng Việt có dấu

## 5. Kiểm thử

Thêm hoặc cập nhật test cho các trường hợp sau:

- validate pass với role-template đúng cặp
- validate fail khi template không tồn tại
- validate fail khi template khác `role_code`
- import fail khi onboarding settings không hợp lệ
- seed onboarding plan tham chiếu đúng template ID hiện hành

## 6. Ngoài phạm vi

- không thiết kế CRUD template mới trong pass này
- không thay đổi cấu trúc runtime day hoặc operations journey ngoài phần bị ảnh hưởng bởi seed/template ID
- không tự động sinh mapping mới cho các position chưa có template hợp lệ
