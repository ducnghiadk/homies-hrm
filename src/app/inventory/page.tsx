'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getEmployeeById } from '@/lib/mock-data'
import {
  mockIngredients, mockStockHistory, INGREDIENT_CATEGORIES,
  getLowStockItems, formatVND
} from '@/lib/mock-data-p4'
import { Package, AlertTriangle, TrendingDown, TrendingUp, Plus, Search } from 'lucide-react'

export default function InventoryPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'stock'|'history'|'alerts'>('stock')
  const [filterCat, setFilterCat] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const lowStock = getLowStockItems()
  const filtered = mockIngredients.filter(i =>
    (filterCat === 'all' || i.category === filterCat) &&
    (!search || i.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <AppShell title="Kho nguyên liệu 📦">
      <div className="space-y-4">
        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <div className="p-3 rounded-xl flex items-center gap-2 animate-fade-in" style={{
            background: 'var(--error-light)', border: '1px solid var(--error)20'
          }}>
            <AlertTriangle size={18} style={{ color: 'var(--error)' }} />
            <div>
              <div className="text-xs font-bold" style={{ color: 'var(--error)' }}>⚠️ {lowStock.length} nguyên liệu sắp hết</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {lowStock.map(i => i.name).join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 animate-fade-in">
          {[
            { k: 'stock' as const, l: '📦 Tồn kho', badge: mockIngredients.length },
            { k: 'history' as const, l: '📋 Nhập/Xuất' },
            { k: 'alerts' as const, l: '⚠️ Cảnh báo', badge: lowStock.length },
          ].map(({ k, l, badge }) => (
            <button key={k} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all relative"
              style={{
                background: tab === k ? 'var(--primary)' : 'var(--gray-100)',
                color: tab === k ? 'white' : 'var(--text-secondary)',
              }} onClick={() => setTab(k)}>
              {l}
              {badge && k === 'alerts' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: 'var(--error)', color: 'white' }}>{badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* STOCK */}
        {tab === 'stock' && (
          <div className="space-y-3 animate-slide-up">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input className="input text-sm pl-9" placeholder="Tìm nguyên liệu..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Category Filter */}
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                style={{
                  background: filterCat === 'all' ? 'var(--primary)' : 'var(--gray-100)',
                  color: filterCat === 'all' ? 'white' : 'var(--text-secondary)',
                }} onClick={() => setFilterCat('all')}>Tất cả</button>
              {INGREDIENT_CATEGORIES.map(cat => (
                <button key={cat.key} className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                  style={{
                    background: filterCat === cat.key ? `${cat.color}15` : 'var(--gray-100)',
                    color: filterCat === cat.key ? cat.color : 'var(--text-secondary)',
                    border: filterCat === cat.key ? `1px solid ${cat.color}` : '1px solid transparent',
                  }} onClick={() => setFilterCat(cat.key)}>{cat.label}</button>
              ))}
            </div>

            {/* Ingredient List */}
            {filtered.map(item => {
              const isLow = item.stock <= item.min_stock
              const cat = INGREDIENT_CATEGORIES.find(c => c.key === item.category)
              const pct = Math.min(100, (item.stock / (item.min_stock * 3)) * 100)
              return (
                <div key={item.id} className="card p-3" style={{
                  borderLeft: `3px solid ${isLow ? 'var(--error)' : cat?.color || 'var(--gray-300)'}`,
                }}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{item.name}</span>
                        {isLow && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>Sắp hết</span>}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {cat?.label} · {formatVND(item.price)}/{item.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: isLow ? 'var(--error)' : 'var(--text-primary)' }}>
                        {item.stock}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.unit} (min: {item.min_stock})</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full" style={{ background: 'var(--gray-200)' }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${pct}%`,
                      background: isLow ? 'var(--error)' : pct < 50 ? 'var(--warning)' : 'var(--success)',
                    }} />
                  </div>
                </div>
              )
            })}

            {/* FAB */}
            {user.role !== 'employee' && (
              <button className="fixed bottom-20 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-50"
                style={{ background: 'var(--primary)', color: 'white' }}>
                <Plus size={20} />
              </button>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div className="space-y-2 animate-slide-up">
            {mockStockHistory.map(h => {
              const ing = mockIngredients.find(i => i.id === h.ingredient_id)
              const emp = getEmployeeById(h.by)
              return (
                <div key={h.id} className="card p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                    background: h.type === 'in' ? 'var(--success-light)' : 'var(--error-light)',
                  }}>
                    {h.type === 'in' ? <TrendingUp size={16} style={{ color: 'var(--success)' }} /> : <TrendingDown size={16} style={{ color: 'var(--error)' }} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{ing?.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{h.note} · {emp?.full_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: h.type === 'in' ? 'var(--success)' : 'var(--error)' }}>
                      {h.type === 'in' ? '+' : '-'}{h.quantity} {ing?.unit}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{h.date}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ALERTS */}
        {tab === 'alerts' && (
          <div className="space-y-3 animate-slide-up">
            {lowStock.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm" style={{ color: 'var(--success)' }}>Tất cả nguyên liệu đủ tồn kho!</p>
              </div>
            ) : (
              lowStock.map(item => {
                const cat = INGREDIENT_CATEGORIES.find(c => c.key === item.category)
                return (
                  <div key={item.id} className="card p-4" style={{ border: '1px solid var(--error)30', background: 'var(--error-light)' }}>
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={24} style={{ color: 'var(--error)' }} />
                      <div className="flex-1">
                        <div className="text-sm font-bold">{item.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cat?.label}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black" style={{ color: 'var(--error)' }}>{item.stock}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>min: {item.min_stock} {item.unit}</div>
                      </div>
                    </div>
                    <button className="btn btn-block mt-3 text-xs py-2" style={{ background: 'var(--error)', color: 'white' }}>
                      📞 Đặt hàng ngay
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
