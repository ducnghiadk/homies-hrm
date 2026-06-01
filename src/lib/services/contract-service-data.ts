import { getPositionById, getStoreById, mockEmployees } from '@/lib/mock-data'
import { settingsPayroll, settingsSystem } from '@/lib/mock-data-settings'
import type { AuthUser } from '@/store/auth-store'
import type {
  ContractBlock,
  ContractTemplate,
  EmployeeContract,
} from './contract-service'
import { scanContractPlaceholders } from './contract-template-placeholder'

export const money = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} d`
export const today = () => new Date().toISOString().split('T')[0]
export const now = () => new Date().toISOString()

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function defaultBlocks(): ContractBlock[] {
  return [
    {
      id: 'title',
      title: 'Tieu de va can cu hop dong',
      category: 'employee',
      locked: true,
      content: [
        'CONG HOA XA HOI CHU NGHIA VIET NAM',
        'Doc lap - Tu do - Hanh phuc',
        '',
        'HOP DONG LAO DONG',
        'So: {{contract.code}}',
        '',
        'Can cu Bo luat Lao dong hien hanh va nhu cau su dung lao dong cua {{company.name}}, hai ben thong nhat ky hop dong lao dong voi cac noi dung sau:',
      ].join('\n'),
    },
    {
      id: 'two-parties',
      title: 'Dieu 1. Thong tin cac ben',
      category: 'employee',
      locked: true,
      content: [
        'Ben su dung lao dong: {{company.name}}',
        'Dia chi: {{company.address}}',
        'Ma so thue: {{company.tax_id}}',
        'Dai dien boi: {{company.signer_name}} - {{company.signer_title}}',
        '',
        'Ben nguoi lao dong: {{employee.full_name}}',
        'Ngay sinh: {{employee.date_of_birth}} - Gioi tinh: {{employee.gender}}',
        'CCCD: {{employee.cccd}} - Ngay cap: {{employee.cccd_issue_date}} - Noi cap: {{employee.cccd_issue_place}}',
        'Dia chi thuong tru: {{employee.address}}',
        'So dien thoai: {{employee.phone}} - Email: {{employee.email}}',
        'Ma so thue ca nhan: {{employee.tax_code}}',
        'Tai khoan nhan luong: {{employee.bank_account}} - {{employee.bank_name}}',
      ].join('\n'),
    },
    {
      id: 'job-and-term',
      title: 'Dieu 2. Cong viec, dia diem va thoi han hop dong',
      category: 'employee',
      locked: false,
      content: [
        'Loai hop dong: {{contract.type_label}}.',
        'Chuc danh cong viec: {{position.name}} - cap bac {{position.level}}.',
        'Dia diem lam viec chinh: {{store.name}} - {{store.address}}.',
        'Quan ly truc tiep: {{store.manager_name}}.',
        'Ngay bat dau lam viec: {{contract.start_date}}.',
        'Ngay ket thuc (neu co): {{contract.end_date}}.',
        'Mo ta cong viec chinh: {{job.main_duties}}.',
      ].join('\n'),
    },
    {
      id: 'working-time',
      title: 'Dieu 3. Thoi gio lam viec, nghi ngoi va cham cong',
      category: 'store_rules',
      locked: false,
      content: [
        'Nguoi lao dong lam viec theo lich phan ca tren app Homies, trong khung {{job.working_schedule}}.',
        'Ngay nghi hang tuan, nghi phep, doi ca, lam them gio va vang mat duoc ghi nhan theo quy trinh noi bo da cong bo tren app.',
        '{{policy.attendance}}',
      ].join('\n'),
    },
    {
      id: 'salary',
      title: 'Dieu 4. Luong, phu cap va hinh thuc thanh toan',
      category: 'salary',
      locked: false,
      content: [
        'Luong chinh: {{salary.official}}/thang.',
        'Luong KPI / thuong hieu suat: {{salary.kpi}}/thang.',
        'Phu cap / tro cap: {{salary.allowances}}.',
        'Luong thu viec (neu ap dung): {{salary.probation}}/thang trong {{salary.probation_period}}.',
        'Hinh thuc tra luong: chuyen khoan vao ngay {{salary.payday}} hang thang.',
      ].join('\n'),
    },
    {
      id: 'insurance-benefits',
      title: 'Dieu 5. Bao hiem, thue va quyen loi',
      category: 'salary',
      locked: false,
      content: [
        'BHXH, BHYT, BHTN ap dung theo quy dinh phap luat va chinh sach luong hien hanh cua cong ty.',
        'Thue TNCN khau tru theo quy dinh.',
        'Nguoi lao dong duoc huong quyen loi ve dong phuc, dao tao, cong cu va cac chinh sach noi bo hop le neu dap ung dieu kien.',
      ].join('\n'),
    },
    {
      id: 'discipline-fnb',
      title: 'Dieu 6. Noi quy, bao mat va quy dinh F&B',
      category: 'fnb_rules',
      locked: false,
      content: [
        '{{policy.work_rules}}',
        '{{policy.dress_code}}',
        '{{policy.food_safety}}',
        '{{policy.cash_handling}}',
        '{{policy.discipline}}',
      ].join('\n'),
    },
    {
      id: 'termination',
      title: 'Dieu 7. Cham dut hop dong va ban giao',
      category: 'signing',
      locked: false,
      content: [
        'Viec tam hoan, sua doi, cham dut hop dong va boi thuong (neu co) duoc thuc hien theo quy dinh phap luat va noi quy cong ty.',
        'Khi nghi viec, nguoi lao dong co trach nhiem ban giao cong viec, dong phuc, tai san, cong cu va cac tai khoan lien quan.',
      ].join('\n'),
    },
    {
      id: 'signing',
      title: 'Dieu 8. Hieu luc va xac nhan ky',
      category: 'signing',
      locked: true,
      content: [
        'Hop dong co hieu luc tu ngay {{contract.start_date}}.',
        'Hai ben xac nhan da doc, hieu va dong y voi toan bo noi dung hop dong.',
        'Nguoi lao dong ky tren app vao ngay {{contract.signing_date}}. Nguoi dai dien cong ty ky xac nhan theo quy trinh noi bo.',
        'Ma hop dong: {{contract.id}} - ban snapshot: {{contract.version}}.',
      ].join('\n'),
    },
  ]
}

function attachTemplatePlaceholderMeta(template: Omit<ContractTemplate, 'placeholderMeta'>): ContractTemplate {
  const sourceText = template.blocks.map((block) => `${block.title}\n${block.content}`).join('\n\n')

  return {
    ...template,
    placeholderMeta: {
      sourceKind: 'blocks',
      sourceText,
      scannedAt: '2026-05-26T00:00:00.000Z',
      placeholders: scanContractPlaceholders(sourceText, {}),
      blockingIssues: [],
      warningIssues: [],
    },
  }
}

export function defaultTemplates(): ContractTemplate[] {
  const sharedBlocks = defaultBlocks()

  const templates: Array<Omit<ContractTemplate, 'placeholderMeta'>> = [
    {
      id: 'tpl-ldxdth-fulltime',
      name: 'Hop dong lao dong xac dinh thoi han',
      description: 'Dung cho nhan su full-time, shift leader, store manager va cac vi tri van hanh co thoi han ro rang.',
      employmentType: 'full_time',
      positionIds: ['pos-001', 'pos-002', 'pos-003', 'pos-004', 'pos-005'],
      storeScope: 'all',
      status: 'active',
      version: 'HDLD-XDTH-2026.05',
      updatedAt: '2026-05-24T09:00:00.000Z',
      blocks: sharedBlocks,
    },
    {
      id: 'tpl-ldkxdth-fulltime',
      name: 'Hop dong lao dong khong xac dinh thoi han',
      description: 'Dung cho nhan su da on dinh, can ky khong xac dinh thoi han.',
      employmentType: 'full_time',
      positionIds: ['pos-004', 'pos-005'],
      storeScope: 'all',
      status: 'active',
      version: 'HDLD-KXDTH-2026.05',
      updatedAt: '2026-05-24T09:00:00.000Z',
      blocks: sharedBlocks,
    },
    {
      id: 'tpl-part-time-operational',
      name: 'Hop dong lao dong part-time',
      description: 'Dung cho barista, thu ngan, phuc vu va cac vi tri ca xoay.',
      employmentType: 'part_time',
      positionIds: ['pos-001', 'pos-002', 'pos-003'],
      storeScope: 'all',
      status: 'active',
      version: 'HDLD-PT-2026.05',
      updatedAt: '2026-05-24T09:00:00.000Z',
      blocks: sharedBlocks.map((block) => (
        block.id === 'salary'
          ? {
              ...block,
              content: [
                'Muc luong theo gio / ca: {{salary.hourly_or_shift}}.',
                'Tong thu nhap uoc tinh theo lich lam: {{salary.official}}/thang.',
                'Phu cap / tro cap: {{salary.allowances}}.',
                'Ngay thanh toan: {{salary.payday}} hang thang.',
              ].join('\n'),
            }
          : block
      )),
    },
    {
      id: 'tpl-contract-appendix',
      name: 'Phu luc dieu chinh luong / chuc danh',
      description: 'Dung khi can dieu chinh luong, chuc danh hoac noi dung bo sung sau khi hop dong goc da ky.',
      employmentType: 'full_time',
      positionIds: ['pos-001', 'pos-002', 'pos-003', 'pos-004', 'pos-005'],
      storeScope: 'all',
      status: 'active',
      version: 'PLHD-2026.05',
      updatedAt: '2026-05-24T09:00:00.000Z',
      blocks: [
        sharedBlocks[0],
        sharedBlocks[1],
        {
          id: 'appendix-main',
          title: 'Noi dung dieu chinh',
          category: 'salary',
          locked: false,
          content: [
            'Hop dong goc: {{contract.parent_contract_code}}.',
            'Noi dung dieu chinh: {{policy.contract_note}}.',
            'Muc luong / vai tro moi: {{salary.official}} / {{position.name}}.',
            'Noi dung khong dieu chinh van giu nguyen theo hop dong goc.',
          ].join('\n'),
        },
        sharedBlocks[7],
      ],
    },
  ]

  return templates.map(attachTemplatePlaceholderMeta)
}

function buildPlaceholderMap(
  contract: Pick<EmployeeContract, 'id' | 'startDate' | 'endDate' | 'customFields' | 'version'>,
  employee: AuthUser,
) {
  const store = getStoreById(employee.store_id)
  const position = getPositionById(employee.position_id)
  const baseSalary = employee.official_salary || position?.base_salary || 0
  const probation = employee.probation_salary_value || Math.round(baseSalary * settingsPayroll.salary_coefficients.probation_rate)
  const genderMap = {
    male: 'Nam',
    female: 'Nu',
    other: 'Khac',
  } as const
  const contractType = contract.customFields['contract.type'] || (contract.endDate ? 'xac_dinh_thoi_han' : 'khong_xac_dinh_thoi_han')
  const contractTypeLabelMap: Record<string, string> = {
    xac_dinh_thoi_han: 'Hop dong lao dong xac dinh thoi han',
    khong_xac_dinh_thoi_han: 'Hop dong lao dong khong xac dinh thoi han',
    part_time: 'Hop dong lao dong part-time',
    phu_luc: 'Phu luc hop dong lao dong',
  }

  return {
    'company.name': settingsSystem.company_info.name,
    'company.tax_id': settingsSystem.company_info.tax_id,
    'company.address': settingsSystem.company_info.address,
    'company.signer_name': contract.customFields['company.signer_name'] || 'Hoang Thi Yen',
    'company.signer_title': contract.customFields['company.signer_title'] || 'Truong phong Nhan su',
    'employee.full_name': employee.full_name,
    'employee.date_of_birth': employee.date_of_birth || contract.customFields['employee.date_of_birth'] || 'Chua cap nhat',
    'employee.gender': genderMap[employee.gender || 'other'],
    'employee.cccd': employee.cccd || contract.customFields['employee.cccd'] || 'Chua cap nhat',
    'employee.cccd_issue_date': contract.customFields['employee.cccd_issue_date'] || 'Chua cap nhat',
    'employee.cccd_issue_place': contract.customFields['employee.cccd_issue_place'] || 'Chua cap nhat',
    'employee.address': employee.address || contract.customFields['employee.address'] || 'Chua cap nhat',
    'employee.phone': employee.phone || 'Chua cap nhat',
    'employee.email': employee.email || 'Chua cap nhat',
    'employee.tax_code': contract.customFields['employee.tax_code'] || 'Chua cap nhat',
    'employee.bank_name': contract.customFields['employee.bank_name'] || 'Chua cap nhat',
    'employee.bank_account': contract.customFields['employee.bank_account'] || 'Chua cap nhat',
    'store.name': store?.name || employee.store_id,
    'store.address': store?.address || 'Chua cap nhat',
    'store.manager_name': contract.customFields['store.manager_name'] || 'Quan ly cua hang',
    'position.name': position?.name || employee.position_id,
    'position.level': String(position?.level || employee.job_level || 'L1'),
    'contract.id': contract.id,
    'contract.code': contract.customFields['contract.code'] || contract.id.toUpperCase(),
    'contract.version': contract.version,
    'contract.parent_contract_code': contract.customFields['contract.parent_contract_code'] || 'Khong ap dung',
    'contract.type_label': contractTypeLabelMap[contractType] || contractTypeLabelMap.xac_dinh_thoi_han,
    'contract.start_date': contract.startDate,
    'contract.end_date': contract.endDate || 'Khong xac dinh',
    'contract.signing_date': today(),
    'salary.official': money(baseSalary),
    'salary.probation': money(probation),
    'salary.kpi': money(employee.kpi_salary || 0),
    'salary.allowances': contract.customFields['salary.allowances'] || 'Theo chinh sach da duoc phe duyet',
    'salary.probation_period': contract.customFields['salary.probation_period'] || (employee.probation_end_date ? `den ${employee.probation_end_date}` : 'Khong ap dung'),
    'salary.payday': contract.customFields['salary.payday'] || 'ngay 10',
    'salary.hourly_or_shift': contract.customFields['salary.hourly_or_shift'] || 'Theo bang luong part-time da thoa thuan',
    'job.main_duties': contract.customFields['job.main_duties'] || 'Thuc hien cong viec theo mo ta vi tri, dam bao chat luong phuc vu, ve sinh, ban giao va KPI duoc giao.',
    'job.working_schedule': contract.customFields['job.working_schedule'] || 'lich phan ca linh hoat theo app',
    'policy.work_rules': 'Nguoi lao dong tuan thu noi quy lao dong, lich phan ca, quy trinh ban giao va cac quy dinh van hanh da cong bo tren app.',
    'policy.dress_code': 'Nguoi lao dong mac dong phuc sach se, deo bang ten, dam bao tac phong phuc vu dung chuan F&B.',
    'policy.cash_handling': 'Nguoi lao dong tuan thu quy trinh thu chi, chot ket, ban giao tien va bao cao sai lech theo quy dinh cong ty.',
    'policy.food_safety': 'Nguoi lao dong thuc hien dung quy trinh ve sinh an toan thuc pham, bao quan nguyen lieu, dan nhan va kiem soat han dung.',
    'policy.attendance': 'Di muon, ve som, doi ca, lam them gio va nghi phep phai duoc ghi nhan tren app va duoc duyet theo quy trinh.',
    'policy.overtime': 'Lam them gio chi duoc ghi nhan khi co phan cong hoac duyet OT hop le.',
    'policy.discipline': 'Vi pham noi quy duoc lap bien ban, cho phep giai trinh va xu ly theo quy trinh noi bo va quy dinh phap luat.',
    'policy.contract_note': contract.customFields['policy.contract_note'] || 'Khong co ghi chu bo sung.',
    ...contract.customFields,
  }
}

export function renderContractPreview(
  template: ContractTemplate,
  contract: Pick<EmployeeContract, 'id' | 'startDate' | 'endDate' | 'customFields' | 'version'>,
  employee: AuthUser,
) {
  const map = buildPlaceholderMap(contract, employee)
  const raw = template.blocks.map((block) => `${block.title}\n${block.content}`).join('\n\n')
  return raw.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => map[key.trim() as keyof typeof map] || `{{${key}}}`)
}

export function seedContracts(): EmployeeContract[] {
  const templates = defaultTemplates()
  const seeds = [
    { employeeId: 'emp-005', templateId: 'tpl-part-time-operational', status: 'active' as const },
    { employeeId: 'emp-006', templateId: 'tpl-part-time-operational', status: 'pending_employee_sign' as const },
    { employeeId: 'emp-004', templateId: 'tpl-ldxdth-fulltime', status: 'draft' as const },
  ]

  return seeds.flatMap((seed, index) => {
    const employee = mockEmployees.find((item) => item.id === seed.employeeId)
    const template = templates.find((item) => item.id === seed.templateId)
    if (!employee || !template) return []

    const base: EmployeeContract = {
      id: `ctr-00${index + 1}`,
      templateId: template.id,
      employeeId: employee.id,
      storeId: employee.store_id,
      positionId: employee.position_id,
      status: seed.status,
      version: `${template.version}.${index + 1}`,
      startDate: employee.hire_date,
      endDate: index === 2 ? '2027-05-31' : undefined,
      customFields: {
        'contract.code': `HD-${String(index + 1).padStart(4, '0')}/HOMIES`,
        'company.signer_name': 'Hoang Thi Yen',
        'company.signer_title': 'Truong phong Nhan su',
        'salary.allowances': index === 0 ? 'Phu cap gui xe 300.000 d/thang' : 'Theo chinh sach cua cong ty',
        'salary.payday': 'ngay 10',
        'salary.hourly_or_shift': '28.000 d/gio',
        'salary.probation_period': '02 thang',
        'employee.tax_code': '0312345678',
        'employee.cccd_issue_date': '2021-06-20',
        'employee.cccd_issue_place': 'Cuc Canh sat QLHC ve TTXH',
        'employee.bank_name': 'Vietcombank',
        'employee.bank_account': `0010${index + 1}8899`,
        'job.main_duties': 'Phuc vu khach, chuan bi do uong, giu ve sinh khu vuc lam viec va thuc hien ban giao cuoi ca.',
        'job.working_schedule': index === 0 ? 'xoay ca 24-28 gio/tuam' : 'ca co dinh theo lich app',
      },
      renderedContent: '',
      signatures: [],
      auditLogs: [],
      snapshotHistory: [],
      sentAt: seed.status === 'draft' ? undefined : '2026-05-20T09:00:00.000Z',
      activatedAt: seed.status === 'active' ? '2026-05-21T09:00:00.000Z' : undefined,
    }

    const employeeLike = employee as unknown as AuthUser
    base.renderedContent = renderContractPreview(template, base, employeeLike)
    base.snapshotHistory = [
      {
        id: `snap-${base.id}-1`,
        version: base.version,
        createdAt: base.sentAt || now(),
        note: 'Khoi tao hop dong demo theo mau chuan VN',
        content: base.renderedContent,
      },
    ]

    if (seed.status === 'active') {
      base.signatures = [
        { id: `sig-${base.id}-emp`, actorId: employee.id, actorName: employee.full_name, role: 'employee', signedAt: '2026-05-20T10:00:00.000Z', method: 'app_confirm', evidence: 'Nhan su xac nhan hop dong trong app Homies' },
        { id: `sig-${base.id}-hr`, actorId: 'emp-016', actorName: 'Hoang Thi Yen', role: 'hr', signedAt: '2026-05-21T09:00:00.000Z', method: 'app_confirm', evidence: 'HR countersign trong app Homies' },
      ]
    }

    return [base]
  })
}
