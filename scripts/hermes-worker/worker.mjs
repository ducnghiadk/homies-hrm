import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || 'ducnghiadk';
const REPO_NAME = process.env.REPO_NAME || 'homies-hrm';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GITHUB_TOKEN) {
  console.warn('[Hermes SRE Worker Warning] Missing environment variables. Please configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and GITHUB_TOKEN in .env');
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;
const octokit = GITHUB_TOKEN ? new Octokit({ auth: GITHUB_TOKEN }) : null;

export async function processPendingErrors() {
  if (!supabase || !octokit) {
    console.log('[Hermes SRE Worker] Worker cannot run without credentials. Standing by.');
    return;
  }

  console.log('[Hermes SRE Worker] Checking for pending errors in queue...');

  const { data: errors, error } = await supabase
    .from('telemetry_error_logs')
    .select('*')
    .eq('status', 'pending')
    .order('occurrences', { ascending: false })
    .limit(5);

  if (error) {
    console.error('[Worker] Supabase query error:', error);
    return;
  }

  if (!errors || errors.length === 0) {
    console.log('[Worker] No pending errors to process.');
    return;
  }

  for (const errRecord of errors) {
    console.log(`[Worker] Analyzing error: ${errRecord.error_name} (${errRecord.fingerprint})`);

    // Mark status as analyzing
    await supabase
      .from('telemetry_error_logs')
      .update({ status: 'analyzing', updated_at: new Date().toISOString() })
      .eq('id', errRecord.id);

    try {
      const branchName = `fix/hermes-${errRecord.fingerprint.slice(0, 8)}`;

      // 1. Get base branch SHA (main)
      const { data: refData } = await octokit.rest.git.getRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: 'heads/main'
      });
      const baseSha = refData.object.sha;

      // 2. Create branch if not exists
      try {
        await octokit.rest.git.createRef({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          ref: `refs/heads/${branchName}`,
          sha: baseSha
        });
      } catch (e) {
        console.log(`[Worker] Branch notice:`, e.message);
      }

      // 3. Formulate PR Body
      const prTitle = `[Hermes Auto-Fix] Fix ${errRecord.error_name} on route ${errRecord.route || 'app'}`;
      const prBody = `## 🤖 Hermes Automated Error Fix Report\n\n` +
        `### Thông tin Sự cố (Incident Details)\n` +
        `- **Tên lỗi:** \`${errRecord.error_name}\`\n` +
        `- **Thông báo:** ${errRecord.error_message}\n` +
        `- **Route bị ảnh hưởng:** \`${errRecord.route || 'N/A'}\`\n` +
        `- **Tần suất xuất hiện:** ${errRecord.occurrences} lần\n` +
        `- **Fingerprint:** \`${errRecord.fingerprint}\`\n\n` +
        `### Phân tích Ngữ cảnh (Root Cause Analysis)\n` +
        `Hệ thống Telemetry ghi nhận lỗi runtime khi thực thi logic giao diện hoặc API. Cần bổ sung kiểm tra điều kiện null/undefined hoặc bọc fallback xử lý.\n\n` +
        `### Khuyến nghị Kiểm thử (Testing Checklist)\n` +
        `- [ ] Xác nhận điều hướng tới route \`${errRecord.route}\` không còn bị crash.\n` +
        `- [ ] Kiểm tra tính toàn vẹn của dữ liệu trong bảng liên quan.\n`;

      // 4. Create Pull Request
      const { data: prData } = await octokit.rest.pulls.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: prTitle,
        head: branchName,
        base: 'main',
        body: prBody
      });

      console.log(`[Worker] Pull Request created successfully: ${prData.html_url}`);

      // 5. Update Supabase record
      await supabase
        .from('telemetry_error_logs')
        .update({
          status: 'pr_created',
          hermes_report: {
            pr_url: prData.html_url,
            pr_number: prData.number,
            analyzed_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', errRecord.id);

    } catch (err) {
      console.error(`[Worker] Failed to process error ${errRecord.id}:`, err);
      await supabase
        .from('telemetry_error_logs')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', errRecord.id);
    }
  }
}

if (process.argv[1]?.endsWith('worker.mjs')) {
  processPendingErrors();
}
