// ============================================
// HRM Trà Sữa — Phase 4 Mock Data
// Payroll, Inventory, Reports, Settings
// ============================================

import { mockEmployees } from './mock-data'

// ========== PAYROLL ==========

export type PayrollStatus = 'draft' | 'confirmed' | 'paid'

export const mockPayrollPeriods = [
  { id: 'pr-2026-02', period: '2026-02', status: 'draft' as PayrollStatus, total_gross: 87500000, total_net: 78750000, employee_count: 12 },
  { id: 'pr-2026-01', period: '2026-01', status: 'paid' as PayrollStatus, total_gross: 85200000, total_net: 76680000, employee_count: 12 },
  { id: 'pr-2025-12', period: '2025-12', status: 'paid' as PayrollStatus, total_gross: 92100000, total_net: 82890000, employee_count: 13 },
]

export const mockPayslips = [
  { employee_id: 'emp-005', period: '2026-02', base: 6000000, ot_hours: 12, ot_amount: 600000, bonus: 750000, penalty: -150000, allowance: 500000, insurance: -480000, tax: -0, gross: 7850000, net: 7220000 },
  { employee_id: 'emp-006', period: '2026-02', base: 6500000, ot_hours: 8, ot_amount: 400000, bonus: 500000, penalty: 0, allowance: 500000, insurance: -520000, tax: -0, gross: 7900000, net: 7380000 },
  { employee_id: 'emp-007', period: '2026-02', base: 5000000, ot_hours: 4, ot_amount: 200000, bonus: 0, penalty: -100000, allowance: 300000, insurance: -400000, tax: -0, gross: 5500000, net: 5000000 },
  { employee_id: 'emp-008', period: '2026-02', base: 7000000, ot_hours: 16, ot_amount: 800000, bonus: 1000000, penalty: 0, allowance: 600000, insurance: -560000, tax: -200000, gross: 9400000, net: 8640000 },
  { employee_id: 'emp-009', period: '2026-02', base: 5500000, ot_hours: 6, ot_amount: 300000, bonus: 200000, penalty: 0, allowance: 400000, insurance: -440000, tax: -0, gross: 6400000, net: 5960000 },
  { employee_id: 'emp-010', period: '2026-02', base: 5000000, ot_hours: 2, ot_amount: 100000, bonus: 0, penalty: -50000, allowance: 300000, insurance: -400000, tax: -0, gross: 5350000, net: 4950000 },
]

// ========== INVENTORY ==========

export type IngredientCategory = 'tea' | 'milk' | 'topping' | 'syrup' | 'cup' | 'other'

export const INGREDIENT_CATEGORIES = [
  { key: 'tea' as IngredientCategory, label: '🍵 Trà', color: '#16a34a' },
  { key: 'milk' as IngredientCategory, label: '🥛 Sữa', color: '#3b82f6' },
  { key: 'topping' as IngredientCategory, label: '🧋 Topping', color: '#f59e0b' },
  { key: 'syrup' as IngredientCategory, label: '🍯 Syrup', color: '#ef4444' },
  { key: 'cup' as IngredientCategory, label: '🥤 Ly/Ống hút', color: '#8b5cf6' },
  { key: 'other' as IngredientCategory, label: '📦 Khác', color: '#6b7280' },
]

export const mockIngredients = [
  { id: 'ing-001', name: 'Trà Oolong', category: 'tea' as IngredientCategory, unit: 'kg', stock: 12, min_stock: 5, price: 350000, store_id: 'store-001' },
  { id: 'ing-002', name: 'Trà đen Ceylon', category: 'tea' as IngredientCategory, unit: 'kg', stock: 8, min_stock: 5, price: 280000, store_id: 'store-001' },
  { id: 'ing-003', name: 'Sữa tươi Vinamilk', category: 'milk' as IngredientCategory, unit: 'lít', stock: 45, min_stock: 20, price: 32000, store_id: 'store-001' },
  { id: 'ing-004', name: 'Sữa đặc Ông Thọ', category: 'milk' as IngredientCategory, unit: 'lon', stock: 30, min_stock: 15, price: 18000, store_id: 'store-001' },
  { id: 'ing-005', name: 'Trân châu đen', category: 'topping' as IngredientCategory, unit: 'kg', stock: 3, min_stock: 5, price: 65000, store_id: 'store-001' },
  { id: 'ing-006', name: 'Thạch dừa', category: 'topping' as IngredientCategory, unit: 'kg', stock: 6, min_stock: 3, price: 45000, store_id: 'store-001' },
  { id: 'ing-007', name: 'Syrup đường nâu', category: 'syrup' as IngredientCategory, unit: 'lít', stock: 4, min_stock: 3, price: 120000, store_id: 'store-001' },
  { id: 'ing-008', name: 'Ly M 500ml', category: 'cup' as IngredientCategory, unit: 'cái', stock: 150, min_stock: 200, price: 800, store_id: 'store-001' },
  { id: 'ing-009', name: 'Ly L 700ml', category: 'cup' as IngredientCategory, unit: 'cái', stock: 280, min_stock: 200, price: 1000, store_id: 'store-001' },
  { id: 'ing-010', name: 'Ống hút giấy', category: 'cup' as IngredientCategory, unit: 'cái', stock: 450, min_stock: 500, price: 500, store_id: 'store-001' },
]

export const mockStockHistory = [
  { id: 'sh-001', ingredient_id: 'ing-001', type: 'in' as const, quantity: 5, note: 'Nhập NCC Phúc Long', date: '2026-02-14', by: 'emp-002' },
  { id: 'sh-002', ingredient_id: 'ing-005', type: 'out' as const, quantity: 2, note: 'Bán hết ca sáng', date: '2026-02-14', by: 'emp-005' },
  { id: 'sh-003', ingredient_id: 'ing-003', type: 'in' as const, quantity: 20, note: 'Nhập Vinamilk', date: '2026-02-13', by: 'emp-002' },
  { id: 'sh-004', ingredient_id: 'ing-008', type: 'in' as const, quantity: 500, note: 'Nhập ly M', date: '2026-02-12', by: 'emp-002' },
  { id: 'sh-005', ingredient_id: 'ing-007', type: 'out' as const, quantity: 1, note: 'Dùng hết ca chiều', date: '2026-02-11', by: 'emp-006' },
]

// ========== REPORTS & ANALYTICS ==========

export const mockRevenueByStore = [
  { store_id: 'store-001', name: 'Boba House Q.1', revenue: 125000000, orders: 3200, avg_ticket: 39063 },
  { store_id: 'store-002', name: 'Boba House Q.3', revenue: 98000000, orders: 2800, avg_ticket: 35000 },
  { store_id: 'store-003', name: 'Boba House Q.7', revenue: 110000000, orders: 3100, avg_ticket: 35484 },
]

export const mockRevenueByMonth = [
  { month: '2025-09', revenue: 280000000, cost: 168000000, profit: 112000000 },
  { month: '2025-10', revenue: 310000000, cost: 180000000, profit: 130000000 },
  { month: '2025-11', revenue: 295000000, cost: 172000000, profit: 123000000 },
  { month: '2025-12', revenue: 350000000, cost: 195000000, profit: 155000000 },
  { month: '2026-01', revenue: 320000000, cost: 185000000, profit: 135000000 },
  { month: '2026-02', revenue: 333000000, cost: 190000000, profit: 143000000 },
]

export const mockLaborCost = [
  { month: '2025-09', salary: 72000000, ot: 8000000, bonus: 5000000, total: 85000000, ratio: 30.4 },
  { month: '2025-10', salary: 73000000, ot: 9500000, bonus: 6000000, total: 88500000, ratio: 28.5 },
  { month: '2025-11', salary: 74000000, ot: 7000000, bonus: 4500000, total: 85500000, ratio: 29.0 },
  { month: '2025-12', salary: 76000000, ot: 12000000, bonus: 10000000, total: 98000000, ratio: 28.0 },
  { month: '2026-01', salary: 75000000, ot: 8500000, bonus: 7000000, total: 90500000, ratio: 28.3 },
  { month: '2026-02', salary: 77000000, ot: 10000000, bonus: 8000000, total: 95000000, ratio: 28.5 },
]

export const mockTopProducts = [
  { name: 'Trà sữa Oolong', sold: 1850, revenue: 74000000, trend: 'up' },
  { name: 'Matcha Latte', sold: 1200, revenue: 60000000, trend: 'up' },
  { name: 'Trà đào cam sả', sold: 980, revenue: 39200000, trend: 'stable' },
  { name: 'Sữa tươi trân châu', sold: 850, revenue: 34000000, trend: 'down' },
  { name: 'Hồng trà', sold: 720, revenue: 25200000, trend: 'stable' },
]

// ========== SETTINGS ==========

export const mockOrgSettings = {
  org_name: 'Boba House',
  logo_emoji: '🧋',
  timezone: 'Asia/Ho_Chi_Minh',
  currency: 'VND',
  late_threshold_minutes: 15,
  ot_rate: 1.5,
  check_in_radius_meters: 100,
  max_leave_days: 12,
  probation_months: 2,
  payroll_day: 5,
  fiscal_year_start: '01',
}

export const mockRoles = [
  { key: 'ceo', label: 'CEO / Chủ doanh nghiệp', permissions: ['all'] },
  { key: 'manager', label: 'Quản lý cửa hàng', permissions: ['view_store', 'manage_schedule', 'approve_requests', 'manage_attendance', 'view_reports'] },
  { key: 'employee', label: 'Nhân viên', permissions: ['self_checkin', 'view_schedule', 'send_requests', 'view_profile'] },
]

// ========== HELPERS ==========

export const getPayslipForEmployee = (empId: string, period: string) =>
  mockPayslips.find(p => p.employee_id === empId && p.period === period)

export const getLowStockItems = () =>
  mockIngredients.filter(i => i.stock <= i.min_stock)

export const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
