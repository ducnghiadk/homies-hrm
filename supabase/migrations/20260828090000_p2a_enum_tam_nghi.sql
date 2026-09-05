-- P2a: file này PHẢI chạy riêng, một mình, không nằm chung transaction
-- với bất kỳ lệnh nào dùng giá trị enum mới.
ALTER TYPE trang_thai_nhan_vien ADD VALUE IF NOT EXISTS 'tam_nghi';
