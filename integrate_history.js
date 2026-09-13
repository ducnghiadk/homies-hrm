/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const filePath = 'src/components/scheduling/ScheduleResultView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Thêm import
const importHistory = "\r\nimport { getScheduleGenerations, compareGenerations } from '@/lib/scheduling/generation-history'";
const importHistoryLF = "\nimport { getScheduleGenerations, compareGenerations } from '@/lib/scheduling/generation-history'";

content = content.replace(
  "import { analyzeSchedulePreferences } from '@/lib/scheduling/preference-aware-scheduler'",
  "import { analyzeSchedulePreferences } from '@/lib/scheduling/preference-aware-scheduler'" + importHistory
);
content = content.replace(
  "import { analyzeSchedulePreferences } from '@/lib/scheduling/preference-aware-scheduler'",
  "import { analyzeSchedulePreferences } from '@/lib/scheduling/preference-aware-scheduler'" + importHistoryLF
);

// 2. Thêm Props onSelectVersion
content = content.replace(
  "  onPublish?: (result: ScheduleResult) => void\r\n}",
  "  onPublish?: (result: ScheduleResult) => void\r\n  onSelectVersion?: (result: ScheduleResult) => void\r\n}"
);
content = content.replace(
  "  onPublish?: (result: ScheduleResult) => void\n}",
  "  onPublish?: (result: ScheduleResult) => void\n  onSelectVersion?: (result: ScheduleResult) => void\n}"
);

// 3. Sửa destructuring tham số
content = content.replace(
  "export default function ScheduleResultView({ result, weekLabel, weekStartDate, onBack, onRegenerate, onEdit, onPublish }: Props) {",
  "export default function ScheduleResultView({ result, weekLabel, weekStartDate, onBack, onRegenerate, onEdit, onPublish, onSelectVersion }: Props) {"
);

// 4. Thêm state và logic so sánh
const stateInsertion = `  const [selectedCompareId, setSelectedCompareId] = useState<string | null>(null)

  const generations = useMemo(() => {
    return getScheduleGenerations(result.weekStart)
  }, [result.weekStart, result.id])

  const renderGenerationHistory = () => {
    if (generations.length <= 1) return null

    const compareVersion = selectedCompareId 
      ? generations.find(g => g.id === selectedCompareId) 
      : null

    const compResult = (compareVersion && result)
      ? compareGenerations(compareVersion, result)
      : null

    return (
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden p-4 mb-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between border-b pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="font-bold text-gray-800 text-sm">Lịch sử tối ưu & So sánh bản thảo ({generations.length})</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Bản đang xem:</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {result.versionLabel || \`Bản thảo v\${result.version || 1}\`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Selector */}
          <div className="lg:col-span-1 border-r pr-4 max-h-[160px] overflow-y-auto space-y-1.5">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Danh sách bản thảo:</div>
            {generations.map((g) => {
              const isActive = g.id === result.id
              const isSelectedForCompare = g.id === selectedCompareId
              return (
                <div 
                  key={g.id} 
                  className={\`flex items-center justify-between p-2 rounded-lg text-xs transition-all \${
                    isActive 
                      ? 'bg-blue-600 text-white font-bold shadow-sm' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }\`}
                >
                  <button 
                    onClick={() => {
                      if (!isActive && onSelectVersion) {
                        onSelectVersion(g)
                      }
                    }}
                    type="button"
                    className="flex-1 text-left font-semibold truncate hover:underline"
                    title="Khôi phục phiên bản này"
                  >
                    {g.versionLabel || \`Bản thảo v\${g.version || 1}\`}
                  </button>
                  
                  {!isActive && (
                    <button
                      onClick={() => {
                        setSelectedCompareId(isSelectedForCompare ? null : g.id)
                      }}
                      type="button"
                      className={\`ml-2 px-2 py-0.5 rounded font-bold transition-all text-[10px] \${
                        isSelectedForCompare 
                          ? 'bg-amber-500 text-white hover:bg-amber-600' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }\`}
                    >
                      {isSelectedForCompare ? 'Đang so' : 'So sánh'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Details */}
          <div className="lg:col-span-2 flex flex-col justify-center">
            {compResult && compareVersion ? (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <span>So sánh:</span>
                  <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{compareVersion.versionLabel || \`v\${compareVersion.version}\`}</span>
                  <span>➜</span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{result.versionLabel || \`v\${result.version}\`}</span>
                  <span className="text-[10px] text-gray-400 font-medium">(Đang xem)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Chi phí lương</div>
                    <div className={\`text-xs font-black \${compResult.costDiff < 0 ? 'text-green-600 bg-green-50/50 px-1 rounded' : compResult.costDiff > 0 ? 'text-red-500 bg-red-50/50 px-1 rounded' : 'text-gray-500'}\`}>
                      {compResult.costDiff < 0 ? '↓ ' : compResult.costDiff > 0 ? '↑ +' : ''}
                      {Math.abs(compResult.costDiff) >= 1000 ? \`\${(compResult.costDiff / 1000).toFixed(0)}k\` : \`\${compResult.costDiff}đ\`}
                    </div>
                  </div>

                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Giờ làm việc</div>
                    <div className={\`text-xs font-black \${compResult.hourDiff < 0 ? 'text-green-600 bg-green-50/50 px-1 rounded' : compResult.hourDiff > 0 ? 'text-red-500 bg-red-50/50 px-1 rounded' : 'text-gray-500'}\`}>
                      {compResult.hourDiff < 0 ? '↓ ' : compResult.hourDiff > 0 ? '↑ +' : ''}
                      {compResult.hourDiff.toFixed(1)}h
                    </div>
                  </div>

                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Độ bao phủ</div>
                    <div className={\`text-xs font-black \${compResult.coverageDiff > 0 ? 'text-green-600 bg-green-50/50 px-1 rounded' : compResult.coverageDiff < 0 ? 'text-red-500 bg-red-50/50 px-1 rounded' : 'text-gray-500'}\`}>
                      {compResult.coverageDiff > 0 ? '↑ +' : compResult.coverageDiff < 0 ? '↓ ' : ''}
                      {compResult.coverageDiff}%
                    </div>
                  </div>

                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Cảnh báo luật</div>
                    <div className={\`text-xs font-black \${compResult.warningCountDiff < 0 ? 'text-green-600 bg-green-50/50 px-1 rounded' : compResult.warningCountDiff > 0 ? 'text-red-500 bg-red-50/50 px-1 rounded' : 'text-gray-500'}\`}>
                      {compResult.warningCountDiff < 0 ? '↓ ' : compResult.warningCountDiff > 0 ? '↑ +' : ''}
                      {compResult.warningCountDiff}
                    </div>
                  </div>
                </div>

                {compResult.preferenceMatchRateDiff !== undefined && (
                  <div className={\`text-xs font-bold px-3 py-1.5 rounded-lg border text-center \${
                    compResult.preferenceMatchRateDiff > 0 
                      ? 'bg-green-50 border-green-100 text-green-700' 
                      : compResult.preferenceMatchRateDiff < 0 
                      ? 'bg-amber-50 border-amber-100 text-amber-700' 
                      : 'bg-gray-50 border-gray-100 text-gray-600'
                  }\`}>
                    Đáp ứng nguyện vọng: {compResult.preferenceMatchRateDiff > 0 ? 'Cải thiện +' : compResult.preferenceMatchRateDiff < 0 ? 'Suy giảm ' : 'Bằng nhau '}
                    {compResult.preferenceMatchRateDiff}%
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic text-center py-8 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                Hãy click nút <strong className="text-blue-500">So sánh</strong> của phiên bản khác ở danh sách bên trái để so khớp hiệu suất tối ưu hóa.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
`;

content = content.replace(
  "  const [showPreferencePanel, setShowPreferencePanel] = useState(false)",
  stateInsertion + "\r\n  const [showPreferencePanel, setShowPreferencePanel] = useState(false)"
);
content = content.replace(
  "  const [showPreferencePanel, setShowPreferencePanel] = useState(false)",
  stateInsertion + "\n  const [showPreferencePanel, setShowPreferencePanel] = useState(false)"
);

// 5. Kết xuất panel history
content = content.replace(
  "        {renderStats()}\r\n        {renderWarnings()}",
  "        {renderStats()}\r\n        {renderGenerationHistory()}\r\n        {renderWarnings()}"
);
content = content.replace(
  "        {renderStats()}\n        {renderWarnings()}",
  "        {renderStats()}\n        {renderGenerationHistory()}\n        {renderWarnings()}"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully integrated history UI, compare logic, and selections in ScheduleResultView.tsx!");
