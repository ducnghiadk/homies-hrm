# Hermes SRE Autonomous Worker

Worker xử lý bất đồng bộ các sự cố ghi nhận từ ứng dụng Web Next.js (bảng `telemetry_error_logs` trên Supabase).

## Cách thiết lập & Chạy

1. Cài đặt dependencies:
   ```bash
   cd scripts/hermes-worker
   npm install
   ```

2. Tạo file `.env` từ `.env.example` và điền:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GITHUB_TOKEN` (Cần quyền `repo` để tạo branch và mở Pull Request)
   - `REPO_OWNER` & `REPO_NAME`

3. Chạy kiểm tra:
   ```bash
   npm start
   ```

4. Chạy dưới dạng cronjob (ví dụ mỗi 10 phút) hoặc daemon với PM2:
   ```bash
   pm2 start worker.mjs --name "hermes-sre-worker" --cron "*/10 * * * *"
   ```
