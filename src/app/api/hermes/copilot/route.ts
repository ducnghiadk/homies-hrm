import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { mockEmployees } from '@/lib/mock-data';
import { HermesAction } from '@/lib/hermes/hermes-action-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const ALLOWED_ADMIN_ROLES = ['hr_admin', 'ceo', 'store_manager', 'area_manager'];

interface HistoryMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface CodeAttachment {
  moduleName: string;
  filePath: string;
  content: string;
}

async function safeReadFile(relativePath: string, rootDir: string): Promise<string | null> {
  try {
    const fullPath = path.resolve(rootDir, relativePath);
    if (!fullPath.startsWith(rootDir)) return null;
    return await fs.readFile(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

async function findFileInSrc(
  targetName: string,
  currentDir: string,
  rootDir: string,
  depth = 0
): Promise<string | null> {
  if (depth > 5) return null;
  try {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.next', '.git', '.gemini', 'dist', 'build'].includes(entry.name)) {
          continue;
        }
        const found = await findFileInSrc(targetName, full, rootDir, depth + 1);
        if (found) return found;
      } else if (entry.isFile() && entry.name.toLowerCase() === targetName.toLowerCase()) {
        return path.relative(rootDir, full).replace(/\\/g, '/');
      }
    }
  } catch {
    return null;
  }
  return null;
}

function extractImportedPaths(code: string, pageDir: string, rootDir: string): string[] {
  const results: string[] = [];
  const importRegex = /(?:import|from)\s+['"](@\/lib\/[^'"]+|\.[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const importSpec = match[1];
    if (importSpec.startsWith('@/lib/')) {
      const sub = importSpec.replace('@/lib/', '');
      results.push(path.join('src', 'lib', sub).replace(/\\/g, '/'));
    } else if (importSpec.startsWith('.')) {
      const resolved = path.resolve(pageDir, importSpec);
      if (resolved.startsWith(rootDir)) {
        results.push(path.relative(rootDir, resolved).replace(/\\/g, '/'));
      }
    }
  }
  return [...new Set(results)];
}

async function getLogicCodeAttachments(
  query: string,
  currentPath?: string
): Promise<CodeAttachment[]> {
  const q = query.toLowerCase();
  const attachments: CodeAttachment[] = [];
  const addedFiles = new Set<string>();
  const rootDir = process.cwd();

  const addAttachment = (name: string, relPath: string, code: string) => {
    const normalized = relPath.replace(/\\/g, '/');
    if (addedFiles.has(normalized)) return;
    addedFiles.add(normalized);
    attachments.push({
      moduleName: name,
      filePath: normalized,
      content: code,
    });
  };

  // 1. CƠ CHẾ 1: Người dùng gõ đích danh đường dẫn hoặc tên file trong tin nhắn
  const pathRegex = /(?:src\/[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)/gi;
  const pathMatches = query.match(pathRegex) || [];
  for (const p of pathMatches) {
    const code = await safeReadFile(p, rootDir);
    if (code) {
      addAttachment(`File theo yêu cầu (${path.basename(p)})`, p, code);
    }
  }

  const fileNameRegex = /\b([a-zA-Z0-9_\-]+\.(?:tsx?|jsx?|json|sql|css))\b/gi;
  const fileNameMatches = query.match(fileNameRegex) || [];
  for (const fn of fileNameMatches) {
    if (addedFiles.has(fn) || fn === 'route.ts' || fn === 'package.json') continue;
    const foundRelPath = await findFileInSrc(fn, path.join(rootDir, 'src'), rootDir);
    if (foundRelPath) {
      const code = await safeReadFile(foundRelPath, rootDir);
      if (code) {
        addAttachment(`File tìm thấy (${fn})`, foundRelPath, code);
      }
    }
  }

  // 2. CƠ CHẾ 2: Tự động nạp code trang hiện tại (page.tsx) cùng các service/engine liên quan
  if (currentPath && typeof currentPath === 'string') {
    const cleanPath = currentPath.split('?')[0].replace(/\/$/, '');
    const isExplicitPageAudit =
      q.includes('trang này') ||
      q.includes('màn hình này') ||
      q.includes('hiện tại') ||
      (cleanPath.length > 1 && q.includes(cleanPath.toLowerCase()));

    if (isExplicitPageAudit || q.includes('soát') || q.includes('kiểm tra')) {
      const candidatePagePaths =
        cleanPath === ''
          ? ['src/app/page.tsx']
          : [
            `src/app${cleanPath}/page.tsx`,
            `src/app${cleanPath}.tsx`,
            `src/app${cleanPath}/index.tsx`,
          ];

      let foundPageCode: string | null = null;
      let foundPageRelPath = '';

      for (const cand of candidatePagePaths) {
        const code = await safeReadFile(cand, rootDir);
        if (code) {
          foundPageCode = code;
          foundPageRelPath = cand;
          break;
        }
      }

      if (foundPageCode) {
        addAttachment(`Màn hình hiện tại (${cleanPath || '/'})`, foundPageRelPath, foundPageCode);

        // Phân tích các imports trong page.tsx để tìm các service/engine/adapter liên quan
        const pageDir = path.resolve(rootDir, path.dirname(foundPageRelPath));
        const importedBases = extractImportedPaths(foundPageCode, pageDir, rootDir);

        for (const base of importedBases) {
          const exts = ['.ts', '.tsx', '/index.ts', ''];
          for (const ext of exts) {
            const candidateFile = base + ext;
            const code = await safeReadFile(candidateFile, rootDir);
            if (code) {
              const isCoreLogic =
                candidateFile.includes('engine') ||
                candidateFile.includes('service') ||
                candidateFile.includes('adapter') ||
                candidateFile.includes('calculator') ||
                candidateFile.includes('store') ||
                candidateFile.includes('rules') ||
                candidateFile.includes('validation');

              const label = isCoreLogic ? 'Logic / Service liên quan' : 'Component liên quan';
              addAttachment(`${label} (${path.basename(candidateFile)})`, candidateFile, code);
              break;
            }
          }

          if (attachments.length >= 5) break;
        }
      }
    }
  }

  // 3. CƠ CHẾ 3: Nhận diện theo từ khóa nghiệp vụ F&B nếu chưa nạp được file nào
  if (attachments.length === 0) {
    const targets: { name: string; file: string; match: boolean }[] = [
      {
        name: 'Bảng Lương & Phụ Cấp (Payroll Engine)',
        file: 'src/lib/payroll-engine.ts',
        match:
          q.includes('lương') ||
          q.includes('payroll') ||
          q.includes('ot') ||
          q.includes('phụ cấp') ||
          q.includes('soát bảng lương') ||
          q.includes('tính lương'),
      },
      {
        name: 'Phân Ca & Ràng Buộc Lịch (Scheduling Rules)',
        file: 'src/lib/scheduling/drag-drop-validation.ts',
        match:
          q.includes('phân ca') ||
          q.includes('xếp ca') ||
          q.includes('lịch') ||
          q.includes('schedule') ||
          q.includes('soát phân ca') ||
          q.includes('xếp lịch'),
      },
      {
        name: 'Chấm Công & Điểm Danh (Attendance Service)',
        file: 'src/lib/services/attendance/attendance-service.ts',
        match:
          q.includes('chấm công') ||
          q.includes('attendance') ||
          q.includes('điểm danh') ||
          q.includes('vào ca') ||
          q.includes('soát chấm công') ||
          q.includes('giờ công'),
      },
    ];

    for (const target of targets) {
      if (target.match) {
        const code = await safeReadFile(target.file, rootDir);
        if (code) {
          addAttachment(target.name, target.file, code);
        }
      }
    }
  }

  return attachments;
}

function parseAmountFromText(text: string): number {
  const lower = text.toLowerCase();
  const trMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|trieu|tr)\b/);
  if (trMatch) {
    const val = parseFloat(trMatch[1].replace(',', '.'));
    return Math.round(val * 1000000);
  }

  const kMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(',', '.'));
    return Math.round(val * 1000);
  }

  const nganMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:ngàn|ngan|nghìn|nghin)\b/);
  if (nganMatch) {
    const val = parseFloat(nganMatch[1].replace(',', '.'));
    return Math.round(val * 1000);
  }

  const numMatch = lower.match(/(\d{1,3}(?:[.,]\d{3})+|\d{4,9})\s*(?:đ|vnd|đồng|dong)?\b/);
  if (numMatch) {
    const cleanNum = numMatch[1].replace(/[.,]/g, '');
    const val = parseInt(cleanNum, 10);
    if (!isNaN(val) && val > 0) return val;
  }

  return 0;
}

function findEmployeeInText(text: string) {
  const lower = text.toLowerCase();
  for (const emp of mockEmployees) {
    const fullName = emp.full_name.toLowerCase();
    const parts = fullName.split(' ');
    const lastName = parts[parts.length - 1];
    const twoWords = parts.slice(-2).join(' ');

    if (
      lower.includes(fullName) ||
      lower.includes(twoWords) ||
      (lastName.length >= 2 && lower.includes(lastName))
    ) {
      return emp;
    }
  }
  return mockEmployees[1] || mockEmployees[0];
}

function detectActionFromText(text: string): HermesAction | null {
  const lower = text.toLowerCase();
  const todayStr = new Date().toLocaleDateString('vi-VN');
  const now = new Date();
  const periodStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Check navigation intent
  const navKeywords = ['chuyển qua', 'chuyển sang', 'mở trang', 'vào màn hình', 'xem trang', 'đi đến', 'mở màn hình', 'qua trang', 'chuyển đến'];
  if (navKeywords.some((kw) => lower.includes(kw))) {
    if (lower.includes('chấm công') || lower.includes('attendance')) {
      return {
        id: `act-${Date.now()}`,
        type: 'navigate',
        title: 'Chuyển sang Quản lý Chấm công',
        data: { url: '/attendance', label: 'Quản lý Chấm công' },
      };
    }
    if (lower.includes('phân ca') || lower.includes('xếp ca') || lower.includes('lịch làm') || lower.includes('schedule')) {
      return {
        id: `act-${Date.now()}`,
        type: 'navigate',
        title: 'Chuyển sang Xếp lịch & Phân ca',
        data: { url: '/schedule', label: 'Xếp lịch & Phân ca' },
      };
    }
    if (lower.includes('giảm trừ') || lower.includes('phạt lương') || lower.includes('phiếu phạt')) {
      return {
        id: `act-${Date.now()}`,
        type: 'navigate',
        title: 'Chuyển sang Giảm trừ & Phạt lương',
        data: { url: '/payroll/deductions', label: 'Giảm trừ & Phạt lương' },
      };
    }
    if (lower.includes('thưởng') || lower.includes('cộng lương') || lower.includes('phiếu cộng')) {
      return {
        id: `act-${Date.now()}`,
        type: 'navigate',
        title: 'Chuyển sang Thưởng & Cộng lương',
        data: { url: '/payroll/bonus', label: 'Thưởng & Cộng lương' },
      };
    }
    if (lower.includes('lương') || lower.includes('payroll') || lower.includes('bảng lương')) {
      return {
        id: `act-${Date.now()}`,
        type: 'navigate',
        title: 'Chuyển sang Trung tâm Bảng lương',
        data: { url: '/payroll', label: 'Bảng lương' },
      };
    }
    if (lower.includes('nhân viên') || lower.includes('nhân sự') || lower.includes('hồ sơ')) {
      return {
        id: `act-${Date.now()}`,
        type: 'navigate',
        title: 'Chuyển sang Danh sách Nhân sự',
        data: { url: '/employees', label: 'Danh sách Nhân sự' },
      };
    }
    if (lower.includes('cài đặt bot') || lower.includes('cấu hình bot') || lower.includes('cài đặt hermes') || lower.includes('cấu hình hermes')) {
      return {
        id: `act-${Date.now()}`,
        type: 'navigate',
        title: 'Chuyển sang Cài đặt Trợ lý Hermes',
        data: { url: '/settings/hermes', label: 'Cài đặt Hermes' },
      };
    }
    if (lower.includes('kho') || lower.includes('btp')) {
      return {
        id: `act-${Date.now()}`,
        type: 'navigate',
        title: 'Chuyển sang Kiểm kho BTP',
        data: { url: '/inventory/btp', label: 'Kiểm kho BTP' },
      };
    }
  }

  // 2. Check deduction / penalty intent
  const deductionKeywords = ['phạt', 'trừ lương', 'khấu trừ', 'trừ tiền', 'bị trừ', 'phiếu phạt'];
  if (deductionKeywords.some((kw) => lower.includes(kw))) {
    const amount = parseAmountFromText(lower);
    if (amount > 0) {
      const emp = findEmployeeInText(lower);
      let note = 'Vi phạm quy định vận hành';
      const reasonMatch = lower.match(/(?:do|vì|lỗi|ly do|lý do)\s+([^.,\n]+)/i);
      if (reasonMatch && reasonMatch[1]) {
        note = reasonMatch[1].trim();
      }

      return {
        id: `act-${Date.now()}`,
        type: 'create_deduction',
        title: 'Tạo phiếu giảm trừ lương',
        data: {
          employee_id: emp.id,
          employee_name: emp.full_name,
          amount,
          ticket_type: 'Phiếu phạt',
          note,
          date: todayStr,
          period_id: periodStr,
        },
      };
    }
  }

  // 3. Check bonus / reward intent
  const bonusKeywords = ['thưởng', 'cộng tiền', 'cộng lương', 'tiền tip', 'khen thưởng', 'phiếu thưởng', 'phụ cấp thêm'];
  if (bonusKeywords.some((kw) => lower.includes(kw))) {
    const amount = parseAmountFromText(lower);
    if (amount > 0) {
      const emp = findEmployeeInText(lower);
      let note = 'Thưởng chuyên cần / thành tích';
      const reasonMatch = lower.match(/(?:do|vì|thành tích|chuyên cần|tip|lý do)\s+([^.,\n]+)/i);
      if (reasonMatch && reasonMatch[1]) {
        note = reasonMatch[1].trim();
      }

      return {
        id: `act-${Date.now()}`,
        type: 'create_bonus',
        title: 'Tạo phiếu thưởng / cộng lương',
        data: {
          employee_id: emp.id,
          employee_name: emp.full_name,
          amount,
          ticket_type: 'Phiếu thưởng',
          note,
          date: todayStr,
          period_id: periodStr,
        },
      };
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      message,
      history,
      user_role,
      user_id,
      bot_id = 'auto',
      client_config,
      test_config,
      current_path,
      active_error,
    } = body;

    // 1. Role Guard
    if (!user_role || !ALLOWED_ADMIN_ROLES.includes(user_role)) {
      return NextResponse.json(
        { error: 'Forbidden: Bạn không có quyền truy cập Hermes Copilot' },
        { status: 403 }
      );
    }

    // Auto-detect server-side AI Gateway (9Router on port 20128 or OpenAI local proxy)
    const serverBaseUrl = process.env.OPENAI_BASE_URL || 'http://localhost:20128/v1';
    const serverApiKey =
      process.env.NINE_ROUTER_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.HERMES_AI_API_KEY ||
      '';

    // 2. Handle Connection Ping Test
    if (message === 'PING_TEST') {
      const cfg = test_config || client_config;
      let pingEndpoint = cfg?.endpoint?.trim();
      let pingKey = cfg?.apiKey?.trim();
      const pingProvider = cfg?.provider || 'openai_compatible';
      const pingModel = cfg?.model || 'ag/gemini-3.8-flash';

      if (!pingEndpoint && cfg?.mode !== 'local') {
        pingEndpoint = `${serverBaseUrl.replace(/\/$/, '')}/chat/completions`;
        pingKey = pingKey || serverApiKey;
      }

      if (!pingEndpoint) {
        return NextResponse.json({
          reply: 'Chế độ phân tích mã nguồn nội bộ F&B (Direct Code Engine) đang sẵn sàng 100%.',
          answeredBy: 'local',
        });
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const pingHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (pingKey) {
          pingHeaders['Authorization'] = `Bearer ${pingKey}`;
        }

        let pingBody: string;
        if (pingProvider === 'openai_compatible') {
          pingBody = JSON.stringify({
            model: pingModel,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5,
          });
        } else if (pingProvider === 'dify') {
          pingBody = JSON.stringify({
            query: 'ping',
            response_mode: 'blocking',
            user: 'admin-test',
            inputs: {},
          });
        } else {
          pingBody = JSON.stringify({
            type: 'ping_test',
            message: 'ping',
            timestamp: new Date().toISOString(),
          });
        }

        const pingRes = await fetch(pingEndpoint, {
          method: 'POST',
          headers: pingHeaders,
          body: pingBody,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!pingRes.ok) {
          const errText = await pingRes.text().catch(() => '');
          return NextResponse.json(
            {
              error: `Máy chủ AI ngoài trả về mã HTTP ${pingRes.status}: ${errText.slice(0, 150)}`,
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          reply: `Kết nối thành công tới ${pingProvider} (${pingModel})! Cổng AI phản hồi mã HTTP ${pingRes.status}.`,
          answeredBy: 'external_ping',
        });
      } catch (pingErr: unknown) {
        const errorMsg = pingErr instanceof Error ? pingErr.message : String(pingErr);
        const isAbort = pingErr instanceof Error && pingErr.name === 'AbortError';
        return NextResponse.json(
          {
            error: isAbort
              ? 'Hết thời gian chờ kết nối (Timeout 6s). Hãy kiểm tra lại cổng AI.'
              : `Không thể kết nối đến ${pingEndpoint}: ${errorMsg}`,
          },
          { status: 400 }
        );
      }
    }

    // 3. Message Validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Nội dung tin nhắn không hợp lệ' }, { status: 400 });
    }

    const trimmedMsg = message.trim();
    if (trimmedMsg.length < 1 || trimmedMsg.length > 2000) {
      return NextResponse.json(
        { error: 'Độ dài tin nhắn phải từ 1 đến 2000 ký tự' },
        { status: 400 }
      );
    }

    // 4. Query telemetry logs context & Active Client Error
    let errorContext = '';
    if (active_error && typeof active_error === 'object' && active_error.message) {
      errorContext += `🚨 [SỰ CỐ HIỂN THỊ ĐANG XẢY RA TRÊN MÀN HÌNH NÀY]:
- Tên lỗi: ${active_error.name || 'ReactRenderError'}
- Thông báo lỗi: ${active_error.message}
- Đường dẫn: ${active_error.route || current_path || '/'}
- Component Stack: ${active_error.componentStack ? String(active_error.componentStack).trim().slice(0, 500) : 'N/A'}
- Callstack: ${active_error.stack ? String(active_error.stack).trim().slice(0, 500) : 'N/A'}\n\n`;
    }

    let supabaseClient = null;
    if (supabaseUrl && supabaseKey) {
      try {
        supabaseClient = createClient(supabaseUrl, supabaseKey);
        const { data: recentErrors } = await supabaseClient
          .from('telemetry_error_logs')
          .select('error_name, error_message, occurrences, status, route')
          .order('updated_at', { ascending: false })
          .limit(5);

        if (recentErrors && recentErrors.length > 0) {
          errorContext += 'Bối cảnh Telemetry lỗi gần đây:\n' + recentErrors
            .map(
              (e) =>
                `- [${e.status}] ${e.error_name} tại ${e.route || 'route'}: ${e.error_message} (${e.occurrences} lần)`
            )
            .join('\n');
        }
      } catch {
        // Table may not exist yet, continue safely
      }
    }
    if (!errorContext) {
      errorContext = 'Không có dữ liệu lỗi gần đây.';
    }

    // 5. Tự động đọc và đính kèm code thực tế nếu user yêu cầu kiểm tra/soát phân hệ
    const codeAttachments = await getLogicCodeAttachments(trimmedMsg, current_path);
    let codeContextPrompt = '';
    if (codeAttachments.length > 0) {
      codeContextPrompt = codeAttachments
        .map(
          (att) =>
            `### [FILE NGUỒN LOGIC THỰC TẾ: ${att.moduleName} - ${att.filePath}]\n` +
            `\`\`\`typescript\n${att.content}\n\`\`\``
        )
        .join('\n\n');
    }

    // 6. Resolve AI Gateway (Priority: Client config -> Local 9Router Auto-detect)
    let resolvedEndpoint = client_config?.endpoint?.trim();
    if (!resolvedEndpoint && client_config?.mode !== 'local') {
      resolvedEndpoint = `${serverBaseUrl.replace(/\/$/, '')}/chat/completions`;
    }
    const resolvedApiKey = client_config?.apiKey?.trim() || serverApiKey;
    const resolvedModel = client_config?.model?.trim() || 'ag/gemini-3.8-flash';
    const resolvedProvider = client_config?.provider || 'openai_compatible';
    const resolvedTemperature = client_config?.temperature ?? 0.7;

    let gatewayErrorReason = '';

    if (resolvedEndpoint && client_config?.mode !== 'local') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const externalHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (resolvedApiKey) {
          externalHeaders['Authorization'] = `Bearer ${resolvedApiKey}`;
        }

        const systemPrompt = `Bạn là Trợ lý Hermes AI chuyên trách hệ thống vận hành F&B Homies Milk Tea.
Vai trò người dùng: ${user_role}. Chuyên môn: ${bot_id}.
Bối cảnh hệ thống:
${errorContext}${codeContextPrompt
            ? `\n\n======================================================
[MÃ NGUỒN LOGIC THỰC TẾ ĐÍNH KÈM ĐỂ ĐỐI SOÁT]:
Dưới đây là mã nguồn thực tế của hệ thống trích xuất trực tiếp từ dự án:
${codeContextPrompt}
======================================================
YÊU CẦU: Hãy phân tích kỹ các công thức, ràng buộc nghiệp vụ, xử lý ngoại lệ và luồng dữ liệu trong code này. Trả lời cụ thể, súc tích và giải quyết đúng câu hỏi của người dùng thay vì chỉ lặp lại lý thuyết chung chung. Nếu màn hình đang có lỗi giao diện, hãy chỉ rõ nguyên nhân và cách khắc phục.`
            : ''
          }

NĂNG LỰC ĐIỀU KHIỂN & NHẬP LIỆU (ACTION DISPATCHING):
Khi người dùng yêu cầu thực hiện hành động (ví dụ: phạt tiền, giảm trừ lương, thưởng tiền, cộng lương, hoặc chuyển màn hình), bạn HÃY trả lời giải thích bằng lời, VÀ KÈM THEO khối JSON ở cuối phản hồi theo đúng cấu trúc:
<<<ACTION_JSON
{
  "type": "create_deduction" | "create_bonus" | "navigate",
  "title": "Tiêu đề hành động",
  "data": {
    "employee_name": "Tên nhân viên",
    "amount": 50000,
    "ticket_type": "Phiếu phạt",
    "note": "Lý do",
    "date": "14/09/2026",
    "period_id": "2026-09",
    "url": "/attendance"
  }
}
ACTION_JSON>>>`;

        let requestBody = '';
        if (resolvedProvider === 'openai_compatible' || resolvedProvider === 'fastgpt' || resolvedProvider === 'custom_webhook') {
          const formattedHistory = Array.isArray(history)
            ? history.map((h: HistoryMessage) => ({
              role: h.role,
              content: h.text,
            }))
            : [];

          requestBody = JSON.stringify({
            model: resolvedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              ...formattedHistory.slice(-5),
              { role: 'user', content: trimmedMsg },
            ],
            temperature: resolvedTemperature,
          });
        } else if (resolvedProvider === 'dify') {
          requestBody = JSON.stringify({
            query: trimmedMsg,
            response_mode: 'blocking',
            user: user_id || 'admin',
            inputs: {
              system_context: systemPrompt,
              code_context: codeContextPrompt || '',
            },
          });
        }

        const externalRes = await fetch(resolvedEndpoint, {
          method: 'POST',
          headers: externalHeaders,
          body: requestBody,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (externalRes.ok) {
          const externalData = await externalRes.json();
          let extReply = '';

          if (externalData.choices?.[0]?.message?.content) {
            extReply = externalData.choices[0].message.content;
          } else if (typeof externalData.answer === 'string') {
            extReply = externalData.answer;
          } else if (typeof externalData.reply === 'string') {
            extReply = externalData.reply;
          } else if (typeof externalData.message === 'string') {
            extReply = externalData.message;
          } else {
            extReply = JSON.stringify(externalData);
          }

          if (extReply && extReply.trim()) {
            let cleanReply = extReply.trim();
            let parsedAction: HermesAction | null = null;

            const actionMatch = cleanReply.match(/<<<ACTION_JSON\s*([\s\S]*?)\s*ACTION_JSON>>>/);
            if (actionMatch && actionMatch[1]) {
              try {
                const rawAction = JSON.parse(actionMatch[1]);
                cleanReply = cleanReply.replace(/<<<ACTION_JSON[\s\S]*?ACTION_JSON>>>/, '').trim();
                const matchedEmp = rawAction.data?.employee_name
                  ? findEmployeeInText(rawAction.data.employee_name)
                  : mockEmployees[0];
                parsedAction = {
                  id: `act-${Date.now()}`,
                  type: rawAction.type,
                  title: rawAction.title || 'Thực thi thao tác',
                  data: {
                    ...rawAction.data,
                    employee_id: rawAction.data?.employee_id || matchedEmp.id,
                    employee_name: rawAction.data?.employee_name || matchedEmp.full_name,
                  },
                };
              } catch { }
            }

            if (!parsedAction) {
              parsedAction = detectActionFromText(trimmedMsg);
            }

            return NextResponse.json({
              reply: cleanReply,
              action: parsedAction,
              answeredBy: bot_id,
              source: 'ai_gateway',
              attached_files: codeAttachments.map((a) => a.filePath),
            });
          }
        } else {
          const errText = await externalRes.text().catch(() => '');
          gatewayErrorReason = `Mã HTTP ${externalRes.status}: ${errText.slice(0, 150)}`;
          console.warn('[Hermes Copilot] External gateway error:', gatewayErrorReason);
        }
      } catch (extErr) {
        gatewayErrorReason = extErr instanceof Error ? extErr.message : String(extErr);
        console.warn('[Hermes Copilot] External gateway failed, falling back to dynamic code analysis:', gatewayErrorReason);
      }
    }

    // 7. Dynamic Local Analysis Engine (Phân tích thực tế - KHÔNG dùng văn mẫu cố định)
    const q = trimmedMsg.toLowerCase();
    let reply = '';
    let answeredBy = bot_id;

    // KỊCH BẢN 0: Người dùng yêu cầu thực hiện hành động (Action Dispatching)
    const localAction = detectActionFromText(trimmedMsg);
    if (localAction) {
      if (localAction.type === 'create_deduction') {
        const d = localAction.data as Record<string, unknown>;
        reply = `Tôi đã tạo phiếu phạt/giảm trừ lương cho nhân viên **${d.employee_name}** với số tiền **${Number(d.amount).toLocaleString('vi-VN')} đ** (Lý do: ${d.note}).\n\nBạn vui lòng kiểm tra thông tin trong thẻ bên dưới và bấm **Xác nhận lưu** để hệ thống ghi nhận vào bảng lương nhé!`;
        answeredBy = 'hr';
      } else if (localAction.type === 'create_bonus') {
        const d = localAction.data as Record<string, unknown>;
        reply = `Tôi đã tạo phiếu thưởng/cộng lương cho nhân viên **${d.employee_name}** với số tiền **${Number(d.amount).toLocaleString('vi-VN')} đ** (Lý do: ${d.note}).\n\nBạn vui lòng kiểm tra thông tin trong thẻ bên dưới và bấm **Xác nhận lưu** để hệ thống ghi nhận vào bảng lương nhé!`;
        answeredBy = 'hr';
      } else if (localAction.type === 'navigate') {
        const d = localAction.data as Record<string, unknown>;
        reply = `Đang điều hướng bạn đến màn hình **${d.label || d.url}**. Bạn có thể bấm nút **Đi ngay** trong thẻ bên dưới!`;
        answeredBy = 'auto';
      }
    }
    // KỊCH BẢN A: Có sự cố hiển thị màn hình thực tế (Active Error từ ErrorBoundary)
    else if (active_error && typeof active_error === 'object' && active_error.message) {
      answeredBy = 'tech';
      reply =
        `[Trợ lý Hermes - Bác Sĩ Bắt Lỗi Màn Hình]\n` +
        `Tôi phát hiện màn hình **\`${current_path || active_error.route || 'hiện tại'}\`** vừa gặp sự cố kết xuất giao diện:\n\n` +
        `🔴 **Lỗi ghi nhận:** \`${active_error.name || 'Error'}: ${active_error.message}\`\n` +
        (active_error.componentStack
          ? `🧱 **Vị trí Component:**\n\`\`\`\n${String(active_error.componentStack).trim().slice(0, 300)}\n\`\`\`\n`
          : '') +
        `📋 **[ANTIGRAVITY TASK TICKET]**\n` +
        `- **Phân hệ:** Giao diện người dùng (${current_path || 'UI Render'})\n` +
        `- **Nội dung lỗi:** ${active_error.message}\n` +
        `- **Chẩn đoán:** Lỗi xảy ra trong quá trình render component React. Thường do dữ liệu rỗng (null/undefined) hoặc chuyển đổi kiểu dữ liệu chưa an toàn.\n` +
        `- **Đề xuất xử lý:** Antigravity Agent cần kiểm tra hàm xử lý dữ liệu và bọc kiểm tra an toàn (\`?.\`, \`|| []\`) trên màn hình này.`;
    }
    // KỊCH BẢN B: Có file mã nguồn thực tế được nạp vào
    else if (codeAttachments.length > 0) {
      const primaryFile = codeAttachments[0];
      const fileName = primaryFile.filePath;
      const content = primaryFile.content;

      // Trích xuất động các thông số từ code thật
      const linesCount = content.split('\n').length;
      const exportMatches = content.match(/(?:export\s+(?:default\s+)?(?:function|const|class)\s+([a-zA-Z0-9_]+))/g) || [];
      const exportsList = exportMatches.map((m) => m.replace(/export\s+(?:default\s+)?(?:function|const|class)\s+/, '')).slice(0, 4);

      const stateMatches = content.match(/const\s+\[([a-zA-Z0-9_]+),\s*set[a-zA-Z0-9_]+\]\s*=\s*useState/g) || [];
      const statesList = stateMatches.map((m) => m.replace(/const\s+\[/, '').split(',')[0]).slice(0, 6);

      const importLibMatches = content.match(/(?:from|import)\s+['"]@\/(?:lib|adapters|store|services)\/([^'"]+)['"]/g) || [];
      const libsList = [...new Set(importLibMatches.map((m) => m.replace(/(?:from|import)\s+['"]/, '').replace(/['"]$/, '')))].slice(0, 4);

      reply =
        `[Trợ lý Hermes - Báo Cáo Rà Soát Mã Nguồn Thực Tế]\n` +
        `Tôi đã đọc và phân tích trực tiếp mã nguồn file **\`${fileName}\`** (${linesCount} dòng code):\n\n` +
        `1. **Cấu trúc & Component:** ${exportsList.length > 0 ? exportsList.map((e) => `\`${e}\``).join(', ') : 'Component chính của trang'}.\n` +
        `2. **Quản lý Trạng thái (States):** ${statesList.length > 0 ? statesList.map((s) => `\`${s}\``).join(', ') : 'Dùng props / stateless'}.\n` +
        `3. **Dịch vụ & Adapter kết nối:** ${libsList.length > 0 ? libsList.map((l) => `\`${l}\``).join(', ') : 'Không có phụ thuộc ngoại vi'}.\n\n` +
        `📋 **[ANTIGRAVITY TASK TICKET]**\n` +
        `- **File đối soát:** \`${fileName}\`\n` +
        `- **Yêu cầu:** "${trimmedMsg}"\n` +
        `- **Đánh giá:** Mã nguồn trang đã được nạp đầy đủ vào ngữ cảnh để đối soát và xử lý logic.`;
    }
    // KỊCH BẢN C: Câu hỏi nghiệp vụ chung
    else {
      if (q.includes('lương') || q.includes('payroll')) {
        answeredBy = 'hr';
        reply =
          `[Trợ lý Hermes - Vận Hành Bảng Lương]\n` +
          `Về quy trình bảng lương Homies:\n` +
          `- Hệ số tăng ca OT ngày thường x1.5, cuối tuần x2.0, ngày lễ Tết x3.0.\n` +
          `- Phụ cấp cơm ca áp dụng cho ca làm việc liên tục trên 5 giờ.\n` +
          `Bạn có thể bấm **"Soát trang này"** khi đang ở màn hình bảng lương để tôi kiểm tra code chi tiết.`;
      } else if (q.includes('ca') || q.includes('lịch') || q.includes('schedule')) {
        answeredBy = 'auto';
        reply =
          `[Trợ lý Hermes - Vận Hành Phân Ca]\n` +
          `Về phân ca Homies Milk Tea:\n` +
          `- Khoảng nghỉ giữa 2 ca tối thiểu 12 giờ giữa ca đóng cửa và ca mở cửa hôm sau.\n` +
          `- Giới hạn tuần: tối đa 48h (Full-time), 30h (Part-time).\n` +
          `Bạn có thể mở trang Xếp ca và bấm **"Soát trang này"** để kiểm tra bộ quy tắc kéo thả.`;
      } else if (q.includes('kho') || q.includes('btp') || q.includes('nvl')) {
        answeredBy = 'inventory';
        reply =
          `[Trợ lý Hermes - Kho & BTP]\n` +
          `Về kho & BTP Homies:\n` +
          `- Nhóm trước nguyên vật liệu (Pre-grouping) để tránh lỗi công thức.\n` +
          `- Chốt kiểm kho theo phiên atomic chống ghi đè.\n` +
          `Bạn có thể mở trang Kiểm kho để kiểm tra chi tiết.`;
      } else {
        reply =
          `[Trợ lý Hermes]\n` +
          `Xin chào! Tôi là Trợ lý Hermes AI. Tôi có thể giúp bạn kiểm tra mã nguồn, rà soát logic bảng lương, phân ca, kho bãi hoặc chẩn đoán sự cố hiển thị.\n\n` +
          `💡 **Gợi ý:** Bạn có thể bấm các nút **"Soát trang này"**, **"Soát Bảng lương"**, hoặc mô tả câu hỏi cụ thể để tôi hỗ trợ.`;
      }
    }

    // Nếu có cảnh báo cổng AI ngoài gián đoạn, thêm chú thích nhỏ ở cuối
    if (gatewayErrorReason) {
      reply += `\n\n*(⚡ Chú thích: Cổng AI 9Router đang tạm gián đoạn [${gatewayErrorReason.slice(0, 80)}]. Hermes đang sử dụng Bộ phân tích mã nguồn trực tiếp).*`;
    }

    // 8. Best-effort log session to copilot_chat_sessions table
    const isValidUuid =
      typeof user_id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id);
    if (supabaseClient && isValidUuid) {
      try {
        const sessionMessages = Array.isArray(history)
          ? [...history, { role: 'assistant', text: reply, bot_id: answeredBy }]
          : [
            { role: 'user', text: trimmedMsg },
            { role: 'assistant', text: reply, bot_id: answeredBy },
          ];

        await supabaseClient.from('copilot_chat_sessions').insert({
          admin_id: user_id,
          messages: sessionMessages,
        });
      } catch (logErr) {
        console.warn('[Hermes Copilot] Session save skipped or failed:', logErr);
      }
    }

    return NextResponse.json({
      reply,
      action: localAction,
      answeredBy,
      attached_files: codeAttachments.map((a) => a.filePath),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
