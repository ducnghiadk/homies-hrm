# Identity Core - Hợp đồng dữ liệu HRM và LMS

**Phiên bản:** 0.2 - thiết kế đã chốt một phần, chưa triển khai  
**Ngày:** 2026-08-28  
**Cảnh báo:** Đây là hợp đồng dữ liệu dùng chung giữa dự án HRM Homies Milk Tea và dự án LMS riêng. Mọi thay đổi trái với mục 5 đều được xem là breaking change cho LMS.  
**Trạng thái công bố:** Chưa công bố cho LMS. Quy tắc bất biến ở mục 5 chỉ có hiệu lực kể từ khi LMS đọc view lần đầu.

## 0. Muc dich va pham vi

Tai lieu nay quy dinh phan du lieu nhan vien va dang nhap ma HRM cam ket cung cap on dinh cho LMS. Day la **data contract**, khong phai mo ta rang code hien tai da trien khai xong.

Pham vi contract gom:

- Bon bang Identity Core: `to_chuc`, `cua_hang`, `nhan_vien`, `nhan_vien_cua_hang`.
- Bốn giao diện đọc cho LMS: `identity_nhan_vien_v1`, `identity_nhan_vien_cua_hang_v1`, `identity_cua_hang_v1`, `identity_chuc_vu_v1`.
- Khoa dung chung duy nhat: `nhan_vien.id` kieu UUID.
- Xac thuc duy nhat: Supabase Auth; `nhan_vien.auth_id` chi la cau noi toi `auth.users.id`.
- Vai tro chuan: enum tieng Viet trong PostgreSQL.
- `employees` va `users` la schema da khai tu, khong con la nguon Identity.

Quyen thay doi:

- **HRM** la chu so huu bang goc, du lieu nghiep vu va migration.
- **HRM va LMS cung phe duyet** moi thay doi doi voi cot da cong bo trong view contract.
- **LMS chi duoc SELECT view contract**. LMS khong doc truc tiep bang goc, khong ghi vao Identity Core va khong phu thuoc cac bang ngoai muc 1.
- Them cot noi bo vao bang goc la quyen cua HRM, mien la khong tu dong lam thay doi view da cong bo.

Nguon dinh nghia hien tai duoc doi chieu tu `supabase/schema_v3_master_fixed.sql:73-164`. CODEMAP hien xac dinh schema v3 master va adapter Supabase la lop backend chinh tai `docs/CODEMAP.md:188-191`.

### Ky hieu trang thai

- **DANG CO:** da duoc dinh nghia trong schema hien tai.
- **SE THEM:** chua co, nam trong thiet ke dich.
- **SE BO SUNG RANG BUOC:** cot da co nhung con thieu constraint.
- **SE DOI RANG BUOC:** cột đã có constraint nhưng cần đổi sang constraint đúng theo tenant/contract.
- **SE CHUYEN:** du lieu se chuyen sang bang khac, sau do cot cu bi xoa.
- **SE XOA:** khong con thuoc mo hinh dich va khong duoc di chuyen vao contract.

## 1. Bang thuoc Identity Core (on dinh)

### 1.1. `to_chuc`

Nguon hien trang: `supabase/schema_v3_master_fixed.sql:76-87`.

| Cot | Kieu | Nullable | Default | Rang buoc | Trang thai | Ghi chu |
|---|---|---:|---|---|---|---|
| `id` | UUID | Khong | `uuid_generate_v4()` | PRIMARY KEY | DANG CO | Dinh danh to chuc. |
| `ten` | TEXT | Khong | Khong | Khong | DANG CO | Ten cong ty/chuoi. |
| `logo_url` | TEXT | Co | Khong | Khong | DANG CO | URL logo to chuc. |
| `dia_chi` | TEXT | Co | Khong | Khong | DANG CO | Dia chi tru so. |
| `so_dien_thoai` | TEXT | Co | Khong | Khong | DANG CO | So lien he cap to chuc. |
| `email` | TEXT | Co | Khong | Khong | DANG CO | Email lien he cap to chuc. |
| `ma_so_thue` | TEXT | Co | Khong | Khong | DANG CO | Ma so thue cua doanh nghiep; khong phai ma so thue ca nhan. |
| `cau_hinh` | JSONB | Co | `'{}'` | Khong | DANG CO | Cau hinh noi bo cua HRM; LMS khong phu thuoc cau truc JSON. |
| `ngay_tao` | TIMESTAMPTZ | Co | `NOW()` | Khong | DANG CO | Thoi diem tao ban ghi. |
| `ngay_cap_nhat` | TIMESTAMPTZ | Co | `NOW()` | Khong | DANG CO | Thoi diem cap nhat gan nhat. |

Quy tac on dinh:

- `to_chuc.id` la tenant key cua Identity Core.
- LMS chi nhan `to_chuc_id` nhu mot khoa pham vi; tai lieu nay chua cong bo view thong tin to chuc.

### 1.2. `cua_hang`

Nguon hien trang: `supabase/schema_v3_master_fixed.sql:92-106`. Index `to_chuc_id` tai `supabase/schema_v3_master_fixed.sql:607`.

| Cot | Kieu | Nullable | Default | Rang buoc | Trang thai | Ghi chu |
|---|---|---:|---|---|---|---|
| `id` | UUID | Khong | `uuid_generate_v4()` | PRIMARY KEY | DANG CO | Dinh danh cua hang dung noi bo va trong view LMS. |
| `to_chuc_id` | UUID | Khong | Khong | FK `to_chuc(id)` ON DELETE CASCADE; co index | DANG CO | To chuc so huu cua hang. |
| `ten` | TEXT | Khong | Khong | Khong | DANG CO | Ten hien thi cua cua hang. |
| `ma_cua_hang` | TEXT | Co | Khong | UNIQUE | DANG CO | Ma nghiep vu cua cua hang. |
| `dia_chi` | TEXT | Co | Khong | Khong | DANG CO | Dia chi cua hang. |
| `so_dien_thoai` | TEXT | Co | Khong | Khong | DANG CO | So lien he cua hang. |
| `vi_do` | DECIMAL(10,7) | Co | Khong | Khong | DANG CO | Vi do phuc vu cham cong; khong thuoc view LMS v1. |
| `kinh_do` | DECIMAL(10,7) | Co | Khong | Khong | DANG CO | Kinh do phuc vu cham cong; khong thuoc view LMS v1. |
| `ban_kinh_met` | INTEGER | Co | `100` | Khong | DANG CO | Ban kinh check-in; HRM tu do thay doi. |
| `quan_ly_id` | UUID | Co | Khong | Hien chua co FK | DANG CO | Nguoi quan ly cua hang; khong thuoc view LMS v1. |
| `trang_thai` | `trang_thai_cua_hang` | Co | `'hoat_dong'` | Enum | DANG CO | Trang thai van hanh cua hang. |
| `ngay_tao` | TIMESTAMPTZ | Co | `NOW()` | Khong | DANG CO | Thoi diem tao. |
| `ngay_cap_nhat` | TIMESTAMPTZ | Co | `NOW()` | Khong | DANG CO | Thoi diem cap nhat gan nhat. |

Tap enum hien tai cua `trang_thai_cua_hang`: `hoat_dong`, `ngung_hoat_dong`, `dong_cua` (`supabase/schema_v3_master_fixed.sql:14-16`).

### 1.3. `nhan_vien`

Nguon hien trang: `supabase/schema_v3_master_fixed.sql:125-164`. Index Identity tai `supabase/schema_v3_master_fixed.sql:611-615`.

`nhan_vien.id` la khoa contract duy nhat giua HRM va LMS. `auth_id`, email, ma nhan vien va moi khoa khac khong duoc dung thay cho `id` trong lien ket lien du an.

| Cot | Kieu | Nullable | Default | Rang buoc | Trang thai | Ghi chu |
|---|---|---:|---|---|---|---|
| `id` | UUID | Khong | `uuid_generate_v4()` | PRIMARY KEY | DANG CO | Khoa Identity Core va khoa contract HRM-LMS. Khong doi khi tai khoan Auth bi tao lai. |
| `auth_id` | UUID | Co | Khong | UNIQUE; co index; dich: FK `auth.users(id)` ON DELETE SET NULL | DANG CO; SE BO SUNG RANG BUOC | Cau noi xac thuc. Khong xuat hien trong view LMS v1 va khong phai khoa contract. |
| `to_chuc_id` | UUID | Khong | Khong | FK `to_chuc(id)` ON DELETE CASCADE; co index | DANG CO | Tenant cua nhan vien. |
| `cua_hang_id` | UUID | Co | Khong | FK `cua_hang(id)` ON DELETE SET NULL; co index | DANG CO | Cua hang chu quan, khac tap cua hang duoc phep lam viec. |
| `chuc_vu_id` | UUID | Co | Khong | FK `chuc_vu(id)` ON DELETE SET NULL | DANG CO | Chức vụ HRM; LMS chỉ đọc tên/cấp bậc qua `identity_chuc_vu_v1`, không đọc bảng gốc. |
| `ma_nhan_vien` | TEXT | Co | Khong | DANG CO: UNIQUE; dich: UNIQUE(`to_chuc_id`, `ma_nhan_vien`) | DANG CO; SE DOI RANG BUOC | Mã nghiệp vụ theo từng tổ chức; có thể đổi theo quy trình HR, không dùng làm khóa liên dự án. |
| `email` | TEXT | Co | Khong | DANG CO: UNIQUE; dich: UNIQUE(`to_chuc_id`, `email`) | DANG CO; SE DOI RANG BUOC | Email hồ sơ/liên hệ theo từng tổ chức. Thông tin đăng nhập do Supabase Auth quản lý. |
| `so_dien_thoai` | TEXT | Co | Khong | Dich: chuẩn hóa E.164 + UNIQUE | DANG CO; SE BO SUNG RANG BUOC | Số liên hệ; cần chuẩn hóa trước khi lập unique để tránh trùng do khác định dạng. |
| `mat_khau_hash` | TEXT | Co | Khong | Khong | SE XOA | Supabase Auth la nguon xac thuc duy nhat; HRM khong luu password hash. |
| `ho_ten` | TEXT | Khong | Khong | Khong | DANG CO | Ho ten hien thi chinh thuc. |
| `anh_dai_dien` | TEXT | Co | Khong | Khong | DANG CO | URL anh dai dien; duoc phep cong bo qua view v1. |
| `ngay_sinh` | DATE | Co | Khong | Khong | DANG CO | Du lieu ho so HRM; khong thuoc view LMS v1. |
| `gioi_tinh` | `gioi_tinh` | Co | Khong | Enum | DANG CO | Du lieu ho so HRM; khong thuoc view LMS v1. |
| `so_cccd` | TEXT | Co | Khong | Khong | DANG CO; SE XOA SAU KHI CHUYEN | Chuyen sang `nhan_vien_ho_so_nhay_cam`; khong thuoc contract. |
| `dia_chi` | TEXT | Co | Khong | Khong | DANG CO | Dia chi ho so HRM; khong thuoc view LMS v1. |
| `ten_ngan_hang` | TEXT | Co | Khong | Khong | DANG CO; SE XOA SAU KHI CHUYEN | Chuyen sang `nhan_vien_ho_so_nhay_cam`. |
| `so_tai_khoan` | TEXT | Co | Khong | Khong | DANG CO; SE XOA SAU KHI CHUYEN | Chuyen sang `nhan_vien_ho_so_nhay_cam`. |
| `chu_tai_khoan_ngan_hang` | TEXT | Co | Khong | Khong | DANG CO; SE XOA SAU KHI CHUYEN | Chuyen sang `nhan_vien_ho_so_nhay_cam`. |
| `noi_o_hien_tai` | TEXT | Co | Khong | Khong | DANG CO | Du lieu ho so HRM; khong thuoc view LMS v1. |
| `ngay_cap_cccd` | DATE | Co | Khong | Khong | DANG CO; SE XOA SAU KHI CHUYEN | Chuyen sang `nhan_vien_ho_so_nhay_cam`. |
| `anh_cccd_truoc` | TEXT | Co | Khong | Khong | DANG CO; SE XOA SAU KHI CHUYEN | Chuyen sang `nhan_vien_ho_so_nhay_cam`. |
| `anh_cccd_sau` | TEXT | Co | Khong | Khong | DANG CO; SE XOA SAU KHI CHUYEN | Chuyen sang `nhan_vien_ho_so_nhay_cam`. |
| `ma_so_thue` | TEXT | Co | Khong | Khong | DANG CO; SE XOA SAU KHI CHUYEN | Ma so thue ca nhan; chuyen sang bang nhay cam. |
| `muc_luong_co_ban` | DECIMAL(15,2) | Co | `0` | Khong | DANG CO; SE XOA SAU KHI CHUYEN | Chuyen sang `nhan_vien_ho_so_nhay_cam`; LMS khong duoc doc. |
| `muc_luong_kpi` | DECIMAL(15,2) | Co | `0` | Khong | DANG CO; SE XOA SAU KHI CHUYEN | Chuyen sang `nhan_vien_ho_so_nhay_cam`; LMS khong duoc doc. |
| `tham_gia_bao_hiem` | BOOLEAN | Co | `FALSE` | Khong | DANG CO | Du lieu HRM, khong thuoc contract. |
| `so_nguoi_phu_thuoc` | INTEGER | Co | `0` | Khong | DANG CO | Du lieu HRM, khong thuoc contract. |
| `dan_toc` | TEXT | Co | `'Kinh'` | Khong | DANG CO | Du lieu HRM, khong thuoc contract. |
| `ton_giao` | TEXT | Co | `'Không'` | Khong | DANG CO | Du lieu HRM, khong thuoc contract. |
| `cau_hinh_truong_bat_buoc` | JSONB | Co | `'{}'` | Khong | DANG CO | Cau hinh noi bo HRM; LMS khong phu thuoc cau truc JSON. |
| `ngay_bat_dau_lam` | DATE | Co | `CURRENT_DATE` | Khong | DANG CO | Ngày bắt đầu quan hệ lao động; đã công bố qua `identity_nhan_vien_v1` từ phiên bản 0.2. |
| `loai_hop_dong` | `loai_hop_dong` | Co | `'toan_thoi_gian'` | Enum | DANG CO | Nghiep vu HRM; chua cong bo qua view v1. |
| `trang_thai` | `trang_thai_nhan_vien` | Co | `'hoat_dong'` | Enum; co index | DANG CO | Trang thai ho so lao dong va dieu kien cap quyen. |
| `vai_tro` | `vai_tro_nhan_vien` | Co | `'nhan_vien'` | Enum; co index | DANG CO | Nguon vai tro duy nhat cho HRM, LMS va RLS. |
| `tong_diem` | INTEGER | Co | `0` | Khong | DANG CO | Gamification HRM; khong thuoc Identity contract. |
| `hang_thanh_vien` | TEXT | Co | `'dong'` | Khong | DANG CO | Gamification HRM; khong thuoc Identity contract. |
| `ngay_tao` | TIMESTAMPTZ | Co | `NOW()` | Khong | DANG CO | Thoi diem tao ho so. |
| `ngay_cap_nhat` | TIMESTAMPTZ | Co | `NOW()` | Khong | DANG CO | Moc dong bo thay doi cho consumer. |

Tap enum hien tai:

- `trang_thai_nhan_vien`: `hoat_dong`, `ngung_hoat_dong`, `thu_viec`, `da_nghi_viec` (`supabase/schema_v3_master_fixed.sql:23-25`).
- `vai_tro_nhan_vien`: `nhan_vien`, `truong_ca`, `quan_ly_cua_hang`, `quan_ly_khu_vuc`, `quan_tri_hr`, `ban_giam_doc` (`supabase/schema_v3_master_fixed.sql:26-28`).
- `loai_hop_dong`: `toan_thoi_gian`, `ban_thoi_gian`, `thuc_tap`, `thu_viec` (`supabase/schema_v3_master_fixed.sql:20-22`).

### 1.4. `nhan_vien_cua_hang`

Bang nay **SE THEM**. Hien schema chi co `nhan_vien.cua_hang_id` tai `supabase/schema_v3_master_fixed.sql:129`, trong khi client dang giu `secondary_store_ids` ngoai DB tai `src/lib/adapters/employee-adapter.ts:56-77` va `src/lib/adapters/employee-adapter.ts:200-211`.

| Cot | Kieu | Nullable | Default | Rang buoc | Trang thai | Ghi chu |
|---|---|---:|---|---|---|---|
| `id` | UUID | Khong | `uuid_generate_v4()` | PRIMARY KEY | SE THEM | Dinh danh ky thuat cua quyen lam viec tai cua hang. |
| `nhan_vien_id` | UUID | Khong | Khong | FK `nhan_vien(id)` ON DELETE CASCADE | SE THEM | Nhan vien duoc cap quyen. |
| `cua_hang_id` | UUID | Khong | Khong | FK `cua_hang(id)` ON DELETE CASCADE | SE THEM | Cua hang nhan vien duoc phep lam viec. |
| `dang_hoat_dong` | BOOLEAN | Khong | `TRUE` | Khong | SE THEM | Quyen hien con hieu luc hay da thu hoi. |
| `ngay_tao` | TIMESTAMPTZ | Khong | `NOW()` | Khong | SE THEM | Thoi diem cap quyen lan dau. |
| `ngay_cap_nhat` | TIMESTAMPTZ | Khong | `NOW()` | Khong | SE THEM | Thoi diem cap nhat trang thai quyen. |

Rang buoc cap bang:

- UNIQUE (`nhan_vien_id`, `cua_hang_id`).
- Nhan vien va cua hang phai cung `to_chuc_id`; day la bat bien nghiep vu bat buoc khi trien khai.
- Moi nhan vien con hoat dong va co `nhan_vien.cua_hang_id` phai co mot dong `nhan_vien_cua_hang` dang hoat dong cho cua hang chu quan.
- Bang nay mo ta **quyen lam viec hien tai**. Lich su dieu chuyen van thuoc `lich_su_cong_tac`, hien duoc dinh nghia tai `supabase/schema_v3_master_fixed.sql:169-178`.

### 1.5. Quyết định enum cần chốt trước khi đóng băng

**CHỜ QUYẾT ĐỊNH:** Giá trị `thu_viec` hiện đang xuất hiện ở cả hai enum:

- `trang_thai_nhan_vien`: `hoat_dong`, `ngung_hoat_dong`, `thu_viec`, `da_nghi_viec` (`supabase/schema_v3_master_fixed.sql:23-25`).
- `loai_hop_dong`: `toan_thoi_gian`, `ban_thoi_gian`, `thuc_tap`, `thu_viec` (`supabase/schema_v3_master_fixed.sql:20-22`).

Đề xuất cần chốt trước khi đóng băng contract: tách bạch một enum mô tả **trạng thái hồ sơ lao động** và một enum mô tả **loại hợp đồng**. Nếu vẫn cần theo dõi thử việc, chỉ một nơi được giữ nghĩa chính thức, nơi còn lại phải đổi tên hoặc bỏ giá trị gây trùng nghĩa. Tài liệu này chưa tự chốt phương án.

## 2. Bang ngoai Identity Core

Những bảng sau do HRM sở hữu và có thể thay đổi mà không phát hành version Identity contract mới, miễn là các view v1 không đổi:

- Chuc vu va cau hinh: `chuc_vu`, `cau_hinh_to_chuc` (`supabase/schema_v3_master_fixed.sql:111-120`, `supabase/schema_v3_master_fixed.sql:183-190`).
- Lich su cong tac: `lich_su_cong_tac` (`supabase/schema_v3_master_fixed.sql:169-178`).
- Ca lam, phan ca, cham cong, don tu: `ca_lam`, `lich_phan_ca`, `cham_cong`, `don_tu` (`supabase/schema_v3_master_fixed.sql:195-276`).
- KPI va danh gia: `mau_kpi`, `chi_so_kpi`, `diem_kpi`, `dot_danh_gia`, `phan_cong_danh_gia` va cac bang `kpi_*` (`supabase/schema_v3_master_fixed.sql:281-355`, `supabase/migrations/20260821_kpi_saas_core.sql:12-300`).
- Gamification va tuong tac: `huy_hieu`, `huy_hieu_nhan_vien`, `giao_dich_diem`, `danh_muc_phan_thuong`, `doi_phan_thuong`, `tin_nhan_chat`, `khen_ngoi` (`supabase/schema_v3_master_fixed.sql:388-473`).
- Luong: `ky_luong`, `phieu_luong`, `phieu_luong_thanh_toan` (`supabase/schema_v3_master_fixed.sql:478-528`, `supabase/migrations/20260828_payroll_payment_ledger.sql:86-107`).
- Hop dong: `mau_hop_dong`, `hop_dong_nhan_vien` (`supabase/schema_v3_master_fixed.sql:533-562`).
- Bang dich `nhan_vien_ho_so_nhay_cam`: SE THEM, lien ket 1-1 bang `nhan_vien_id`, chua CCCD, ngay/anh CCCD, ngan hang, ma so thue ca nhan va luong duoc chuyen khoi `nhan_vien`.

LMS khong duoc:

- SELECT truc tiep bat ky bang nao trong danh sach tren.
- Suy dien contract tu ten cot bang goc.
- Dung `chuc_vu_id`, bang luong, KPI hoac hop dong lam khoa lien ket Identity.
- Doc `nhan_vien_ho_so_nhay_cam` trong bat ky truong hop nao.

## 3. Hop dong voi LMS: cac view

SQL trong muc nay la **dinh nghia dich**, chua duoc tao trong database.

### 3.1. `identity_nhan_vien_v1`

View trả một dòng cho mỗi nhân viên mà RLS của người gọi cho phép nhìn thấy. View không lộ `auth_id`, password, CCCD, ngân hàng, mã số thuế, lương, ngày sinh, địa chỉ, giới tính, bảo hiểm hay dữ liệu gamification.

`cua_hang_duoc_phep_ids` đã bị loại khỏi view này từ phiên bản 0.2. Lý do tách: mảng phụ thuộc RLS người đọc có thể bị thiếu phần tử mà không báo lỗi, làm LMS hiểu sai âm thầm về tập cửa hàng được phép.

```sql
CREATE OR REPLACE VIEW public.identity_nhan_vien_v1
WITH (security_invoker = true)
AS
SELECT
  nv.id,
  nv.to_chuc_id,
  nv.cua_hang_id AS cua_hang_chu_quan_id,
  nv.chuc_vu_id,
  nv.ma_nhan_vien,
  nv.ho_ten,
  nv.email,
  nv.so_dien_thoai,
  nv.anh_dai_dien,
  nv.ngay_bat_dau_lam,
  nv.trang_thai,
  nv.vai_tro,
  nv.ngay_cap_nhat
FROM public.nhan_vien AS nv;
```

| Cot view | Kieu | Co the NULL | Gia tri hop le / y nghia |
|---|---|---:|---|
| `id` | UUID | Khong | Bang `nhan_vien.id`; khoa contract duy nhat. |
| `to_chuc_id` | UUID | Khong | Tenant cua nhan vien. |
| `cua_hang_chu_quan_id` | UUID | Co | Cua hang chu quan; khong dong nghia voi toan bo noi duoc phep lam viec. |
| `chuc_vu_id` | UUID | Co | Khóa chức vụ hiện tại; LMS lấy tên/cấp bậc qua `identity_chuc_vu_v1`. |
| `ma_nhan_vien` | TEXT | Co | Ma nghiep vu de hien thi/tim kiem, khong phai khoa contract. |
| `ho_ten` | TEXT | Khong | Ho ten hien thi. |
| `email` | TEXT | Co | Email ho so/lien he; khong dai dien cho `auth.users.id`. |
| `so_dien_thoai` | TEXT | Co | So lien he. |
| `anh_dai_dien` | TEXT | Co | URL anh dai dien. |
| `ngay_bat_dau_lam` | DATE | Co | Ngày bắt đầu quan hệ lao động. |
| `trang_thai` | `trang_thai_nhan_vien` | Co | `hoat_dong`, `ngung_hoat_dong`, `thu_viec`, `da_nghi_viec`. |
| `vai_tro` | `vai_tro_nhan_vien` | Co | `nhan_vien`, `truong_ca`, `quan_ly_cua_hang`, `quan_ly_khu_vuc`, `quan_tri_hr`, `ban_giam_doc`. |
| `ngay_cap_nhat` | TIMESTAMPTZ | Co | Moc thay doi gan nhat cua ho so; LMS phai xu ly duoc NULL trong du lieu cu. |

### 3.2. `identity_nhan_vien_cua_hang_v1`

View này thay cho mảng `cua_hang_duoc_phep_ids`. Mỗi dòng là một phân công cửa hàng mà RLS của người gọi cho phép nhìn thấy.

```sql
CREATE OR REPLACE VIEW public.identity_nhan_vien_cua_hang_v1
WITH (security_invoker = true)
AS
SELECT
  nvc.nhan_vien_id,
  nvc.cua_hang_id,
  nvc.dang_hoat_dong,
  nvc.ngay_cap_nhat
FROM public.nhan_vien_cua_hang AS nvc;
```

| Cot view | Kieu | Co the NULL | Gia tri hop le / y nghia |
|---|---|---:|---|
| `nhan_vien_id` | UUID | Khong | Bang `nhan_vien.id`; khoa contract cua nhan vien. |
| `cua_hang_id` | UUID | Khong | Cua hang nhan vien duoc phep lam viec. |
| `dang_hoat_dong` | BOOLEAN | Khong | `TRUE` neu quyen lam viec con hieu luc, `FALSE` neu da thu hoi. |
| `ngay_cap_nhat` | TIMESTAMPTZ | Khong | Moc thay doi gan nhat cua phan cong. |

### 3.3. `identity_cua_hang_v1`

```sql
CREATE OR REPLACE VIEW public.identity_cua_hang_v1
WITH (security_invoker = true)
AS
SELECT
  ch.id,
  ch.to_chuc_id,
  ch.ma_cua_hang,
  ch.ten,
  ch.dia_chi,
  ch.so_dien_thoai,
  ch.trang_thai,
  ch.ngay_cap_nhat
FROM public.cua_hang AS ch;
```

| Cot view | Kieu | Co the NULL | Gia tri hop le / y nghia |
|---|---|---:|---|
| `id` | UUID | Khong | Khoa cua hang. |
| `to_chuc_id` | UUID | Khong | Tenant so huu cua hang. |
| `ma_cua_hang` | TEXT | Co | Ma nghiep vu cua cua hang. |
| `ten` | TEXT | Khong | Ten hien thi. |
| `dia_chi` | TEXT | Co | Dia chi cua hang. |
| `so_dien_thoai` | TEXT | Co | So lien he cua hang. |
| `trang_thai` | `trang_thai_cua_hang` | Co | `hoat_dong`, `ngung_hoat_dong`, `dong_cua`. |
| `ngay_cap_nhat` | TIMESTAMPTZ | Co | Moc thay doi gan nhat. |

### 3.4. `identity_chuc_vu_v1`

Nguồn hiện trạng của bảng `chuc_vu`: `supabase/schema_v3_master_fixed.sql:111-120`. Schema hiện có `cap_bac` tại `supabase/schema_v3_master_fixed.sql:116`, nhưng chưa có cột `ngay_cap_nhat`; vì vậy định nghĩa đích dưới đây không bịa thêm cột gốc và tạm trả `NULL::TIMESTAMPTZ` cho đến khi migration bổ sung mốc cập nhật thật.

```sql
CREATE OR REPLACE VIEW public.identity_chuc_vu_v1
WITH (security_invoker = true)
AS
SELECT
  cv.id,
  cv.to_chuc_id,
  cv.ten,
  cv.cap_bac,
  NULL::TIMESTAMPTZ AS ngay_cap_nhat
FROM public.chuc_vu AS cv;
```

| Cot view | Kieu | Co the NULL | Gia tri hop le / y nghia |
|---|---|---:|---|
| `id` | UUID | Khong | Khoa chuc vu de `identity_nhan_vien_v1.chuc_vu_id` tham chieu. |
| `to_chuc_id` | UUID | Khong | Tenant so huu chuc vu. |
| `ten` | TEXT | Khong | Ten hien thi cua chuc vu. |
| `cap_bac` | INTEGER | Co | Cap bac 1-10 theo schema hien tai. |
| `ngay_cap_nhat` | TIMESTAMPTZ | Co | Chua co cot goc trong schema v3; can bo sung truoc khi dung lam moc dong bo that. |

### 3.5. Vi sao bat buoc `security_invoker = true`

`security_invoker = true` buoc view thuc thi voi quyen cua role/user dang goi, thay vi ngam dung quyen cua chu so huu view. Muc dich:

- RLS tren `nhan_vien`, `nhan_vien_cua_hang`, `cua_hang` va `chuc_vu` van duoc ap dung theo nguoi dung LMS hien tai.
- Tranh viec view owner co quyen cao vo tinh bo qua pham vi to chuc/cua hang.
- Khong bien view contract thanh duong tat de doc toan bo nhan vien.

`security_invoker` khong thay the RLS. Truoc khi cong bo view, cac bang goc phai bat RLS, policy phai fail-closed, role truy cap LMS chi duoc `SELECT` view va khong duoc `SELECT` bang goc.

## 4. Mo hinh xac thuc

```text
auth.users
  id UUID (khoa xac thuc Supabase)
       1
       |
       | nhan_vien.auth_id UNIQUE, nullable
       | FK dich: auth.users(id) ON DELETE SET NULL
       0..1
nhan_vien
  id UUID                 <- khoa contract HRM-LMS
  auth_id UUID NULL       <- chi la cau noi xac thuc
  vai_tro vai_tro_nhan_vien <- nguon phan quyen nghiep vu duy nhat
```

Quy tac:

- Supabase Auth xac minh email/phone/password/OTP va quan ly session. Phương thức cụ thể vẫn **CHỜ QUYẾT ĐỊNH**: SĐT + OTP hay email + mật khẩu.
- `nhan_vien.vai_tro` la nguon role duy nhat. Khong dung role tieng Anh va khong coi `user_metadata`/`app_metadata` la nguon nghiep vu chinh.
- Moi `auth.users.id` chi gan toi toi da mot `nhan_vien` do `auth_id` UNIQUE.
- Mot ho so `nhan_vien` co the chua co tai khoan, vi vay `auth_id` duoc phep NULL.
- Mot `auth.users` khong lien ket toi `nhan_vien` phai xac thuc duoc o lop Auth nhung bi tu choi truy cap du lieu HRM/LMS theo nguyen tac fail-closed.
- Middleware/server phải đọc session Supabase Auth thật. Cookie role do client tự đặt và auto-login demo không được xem là cơ chế xác thực hợp lệ.

### Khi nhan vien nghi viec

1. Giu nguyen `nhan_vien.id` va ho so lich su.
2. Dat `nhan_vien.trang_thai = 'da_nghi_viec'`.
3. Tat cac dong `nhan_vien_cua_hang.dang_hoat_dong` cua nhan vien.
4. Vo hieu hoa kha nang dang nhap Supabase Auth va thu hoi session dang ton tai.
5. LMS nhan thay trang thai `da_nghi_viec` qua view; LMS khong xoa khoa ngoai lich su gan voi `nhan_vien.id`.

### Khi tai khoan Auth bi tao lai

1. Khong tao ho so `nhan_vien` moi neu day van la cung mot con nguoi.
2. Tao `auth.users` moi theo quy trinh da duyet.
3. Cap nhat `nhan_vien.auth_id` sang UUID Auth moi.
4. `nhan_vien.id` va moi lien ket HRM-LMS giu nguyen.
5. Tai khoan Auth cu khong con quyen truy cap.

### Khi ho so ton tai nhung chua co tai khoan

- `nhan_vien.auth_id IS NULL` la trang thai hop le.
- Ho so van co the xuat hien trong view neu RLS cua nguoi doc cho phep.
- Nhan vien khong the dang nhap cho den khi co `auth.users` va `auth_id` duoc gan.
- LMS khong duoc tu tao `auth_id` hoac coi email la dinh danh thay the.

## 5. Quy tac thay doi

### 5.1. Quy tac bat bien cua view da cong bo

Sau khi view `_v1` duoc cong bo cho LMS:

- KHONG doi ten cot.
- KHONG xoa cot.
- KHONG doi kieu du lieu.
- KHONG doi NULL thanh NOT NULL hoac nguoc lai neu LMS co the quan sat thay.
- KHONG thay doi y nghia nghiep vu cua cot.
- KHONG them gia tri enum moi vao tap gia tri ma view `_v1` co the tra ve.
- KHONG thay doi mot dong/mot nhan vien thanh cau truc nhieu dong neu chua tao version moi.
- KHONG them cot vao view `_v1` chi vi bang goc co cot moi.

Neu can bat ky thay doi nao o tren, HRM phai tao view `_v2` song song, cho LMS chuyen doi va chi go bo `_v1` sau khi co xac nhan chinh thuc.

### 5.2. Thay doi bang goc

- HRM duoc tu do them cot moi vao bang goc.
- Cot moi khong tu dong tro thanh contract.
- LMS khong duoc dung `SELECT *` tren bang goc hoac view.
- Xoa/doi kieu cot bang goc dang duoc view tham chieu van la breaking change va phai di theo quy trinh `_v2` hoac migration tuong thich.
- Enum DB co the duoc mo rong cho nghiep vu HRM, nhung view `_v1` khong duoc tra ve gia tri moi neu LMS chua chuyen sang version moi.

### 5.3. Checklist bat buoc truoc khi doi muc 1 hoac muc 3

- [ ] Xac dinh thay doi thuoc bang goc noi bo hay contract LMS.
- [ ] Doi chieu ten cot, kieu, nullable, enum va y nghia voi tai lieu nay.
- [ ] Xac nhan `nhan_vien.id` van la khoa lien ket duy nhat.
- [ ] Xac nhan khong dua `auth_id` hoac du lieu nhay cam vao view.
- [ ] Xac nhan quan he cua hang chu quan va cua hang duoc phep lam viec khong bi tron nghia.
- [ ] Kiem tra RLS tren tat ca bang ma view truy cap.
- [ ] Kiem tra view van co `security_invoker = true`.
- [ ] Kiem tra role LMS khong co quyen SELECT bang goc.
- [ ] Chay contract test cho danh sach cot, kieu, nullable va enum cua ca `_v1` va version moi.
- [ ] Backfill va doi soat du lieu truoc khi xoa cot cu.
- [ ] Co ke hoach rollback khong lam thay doi `nhan_vien.id`.
- [ ] HRM va LMS cung phe duyet breaking change.
- [ ] Neu la breaking change, tao `_v2` song song va dat moc ngung `_v1`.

## 6. KHOANG CACH GIUA TAI LIEU VA THUC TE

Tat ca muc duoi day la **chua khop thiet ke**. Khong muc nao duoc xem la da hoan thanh chi vi no xuat hien trong tai lieu nay.

| Muc do | Khoang cach hien tai | Bang chung |
|---|---|---|
| Nghiem trong | Login mock khong doi chieu password hash. Code chi chan password rong; `validatePassword` duoc khai bao nhung khong duoc goi trong login. | `src/store/auth-store.ts:209-213`, `src/store/auth-store.ts:228-284` |
| Nghiem trong | Auth store tu dong khoi tao/fallback sang tai khoan CEO `tuan@bobahouse.vn`, ke ca khi khong co session hop le. | `src/store/auth-store.ts:128-139`, `src/store/auth-store.ts:373-410` |
| Nghiem trong | Cookie `hrm-role` va `hrm-auth` do JavaScript client tu dat bang `document.cookie`, nen khong HttpOnly; proxy lai tin hai cookie nay de quyet dinh quyen. | `src/store/auth-store.ts:97-103`, `src/proxy.ts:165-197` |
| Nghiem trong | `/verify` la OTP gia: `111111` vao CEO, `222222` vao quan ly, ma 6 so khac vao nhan vien. | `src/app/verify/page.tsx:62-74` |
| Nghiem trong | `auth_id` da co trong schema nhung cac seed v3 canonical khong dua cot nay vao INSERT, nen nhan vien seed khong duoc gan `auth.users`. | `supabase/schema_v3_master_fixed.sql:125-134`, `supabase/seed_v3_clean.sql:52`, `supabase/seed_v3_master.sql:59-80` |
| Nghiem trong | Helper RLS mang ten `is_admin_or_manager()` luon `RETURN TRUE`. | `supabase/migrations/20260815_rls_security_policies.sql:22-27` |
| Cao | `secondary_store_ids` chi nam trong type/client metadata va localStorage, khong co bang quan he DB. | `src/store/auth-store.ts:19`, `src/lib/adapters/employee-adapter.ts:56-77`, `src/lib/adapters/employee-adapter.ts:200-211` |
| Cao | Ba mo hinh identity van song song trong repo: `employees`, `users`, `nhan_vien`. | `supabase/schema.sql:60`, `supabase/schema-v2.sql:91`, `supabase/pilot_ready_v1_schema.sql:84`, `supabase/schema_v3_master_fixed.sql:125` |
| Cao | `mat_khau_hash` van nam trong `nhan_vien` va seed v3 van ghi hash, trai voi quyet dinh Supabase Auth duy nhat. | `supabase/schema_v3_master_fixed.sql:134`, `supabase/seed_v3_master.sql:53-60` |
| Cao | CCCD, anh CCCD, ngan hang, ma so thue ca nhan va luong van nam chung bang `nhan_vien`; bang `nhan_vien_ho_so_nhay_cam` chua co. | `supabase/schema_v3_master_fixed.sql:139-150` |
| Cao | Client van dung role tieng Anh va map qua lai role tieng Viet. | `src/store/auth-store.ts:11`, `src/lib/adapters/employee-adapter.ts:106-125` |
| Cao | `auth_id` chi UNIQUE, chua co FK toi `auth.users(id)`, trong khi RLS canonical tim nhan vien bang `auth_id = auth.uid()`. | `supabase/schema_v3_master_fixed.sql:127`, `supabase/rls_v3_policies.sql:4-15` |
| Cao | Login va session van luu user vao ca localStorage va sessionStorage thay vi dung Supabase Auth session. | `src/store/auth-store.ts:74-95`, `src/store/auth-store.ts:276-280` |
| Trung binh | `nhan_vien.cua_hang_id` hien la quan he cua hang duy nhat trong DB; chua co cach DB phan biet cua hang chu quan va tap cua hang duoc phep lam viec. | `supabase/schema_v3_master_fixed.sql:128-130`, `supabase/schema_v3_master_fixed.sql:612` |
| Trung binh | `cua_hang.quan_ly_id` chua co FK den `nhan_vien`, lam giam tinh toan ven cua Identity Core. | `supabase/schema_v3_master_fixed.sql:92-105` |

## 7. Việc cần làm để khớp thiết kế

Danh sách sau chỉ là thứ tự thực hiện để lập kế hoạch sau này; **không thực hiện trong tài liệu này**.

| Giai đoạn | Công việc chính | Tiêu chí nghiệm thu kiểm chứng được bằng tay |
|---|---|---|
| P2-AUTH | Kiểm kê dữ liệu nhân viên, email trùng, mã nhân viên trùng, SĐT trùng, tài khoản Auth hiện có và dữ liệu nhạy cảm. Tạo/đối soát `auth.users`, backfill `nhan_vien.auth_id`, thêm FK `nhan_vien.auth_id -> auth.users.id` ON DELETE SET NULL. Thay login bằng Supabase Auth. Gỡ auto-login CEO và cookie client tự đặt. | Mở danh sách nhân viên thấy mỗi hồ sơ vẫn giữ nguyên `nhan_vien.id`. Đăng nhập phải đi qua Supabase Auth thật. Tắt session thì vào trang nội bộ bị chặn. Không còn tự vào CEO khi thiếu session. DevTools không còn thấy client tự set cookie `hrm-role`/`hrm-auth` để quyết định quyền. |
| P3-CHAN-SERVER | Middleware/server đọc session Supabase Auth thật và dùng hồ sơ `nhan_vien.auth_id = auth.uid()` để xác định quyền. | Mở trang nội bộ khi chưa đăng nhập bị chuyển về đăng nhập. Đăng nhập nhân viên thường không mở được trang quản trị. Đổi/xóa session rồi tải lại trang thì quyền bị thu hồi ngay. |
| P4-DU-LIEU | Tạo `nhan_vien_cua_hang`, bảo đảm cửa hàng chủ quản có dòng phân công đang hoạt động. Tạo bảng nhạy cảm tách CCCD, ảnh CCCD, ngân hàng, mã số thuế cá nhân và lương. Tạo các view `identity_nhan_vien_v1`, `identity_nhan_vien_cua_hang_v1`, `identity_cua_hang_v1`, `identity_chuc_vu_v1` với `security_invoker = true`. | Xem view nhân viên không thấy `auth_id`, `mat_khau_hash`, CCCD, ngân hàng, mã số thuế cá nhân hay lương. Xem view phân công thấy mỗi dòng là một cặp nhân viên-cửa hàng. Nhân viên có cửa hàng chủ quản luôn có một dòng phân công đang hoạt động cho cửa hàng đó. |
| P5-RLS | Bật RLS fail-closed cho `to_chuc`, `cua_hang`, `nhan_vien`, `nhan_vien_cua_hang`, `chuc_vu` và bảng nhạy cảm. Bỏ helper luôn `TRUE`. Chỉ cấp quyền đọc view cho LMS, không cấp quyền đọc bảng gốc. | Dùng tài khoản không có quyền thì truy vấn trả rỗng hoặc bị chặn. Nhân viên chỉ thấy đúng phạm vi của mình. Role LMS SELECT được view nhưng SELECT bảng gốc bị từ chối. Helper `is_admin_or_manager()` không còn trả `TRUE` vô điều kiện. |
| P6-DON-DEP | Đổi role frontend/service sang tiếng Việt. Xóa `nhan_vien.mat_khau_hash` và code/seed liên quan. Khai tử schema cũ `employees`/`users` trong tài liệu, script khởi tạo và quy trình vận hành; không xóa lịch sử migration nếu còn cần audit. | Màn hình vẫn hiển thị đúng quyền sau khi bỏ role tiếng Anh. Tìm trong code/seed không còn luồng đăng nhập bằng `mat_khau_hash`. Người vận hành chỉ dùng `nhan_vien` và các view identity làm nguồn chính, không còn tạo dữ liệu mới theo schema cũ. |

## CÂU HỎI CHO CHỦ DỰ ÁN

1. Phương thức đăng nhập chính thức là SĐT + OTP hay email + mật khẩu?
2. Xử lý enum `thu_viec` thế nào để không trùng nghĩa giữa `trang_thai_nhan_vien` và `loai_hop_dong`?
