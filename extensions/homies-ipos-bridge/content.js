/**
 * Homies iPOS Bridge - Content Script
 * Receives captured data from injected-hook.js, renders Smart Toast Banner, and sends to Homies HRM.
 */
;(function () {
  console.log('[Homies Bridge] Content script initialized.')

  // 1. Inject injected-hook.js vào trang web
  try {
    const script = document.createElement('script')
    script.src = chrome.runtime.getURL('injected-hook.js')
    script.onload = function () {
      this.remove()
    }
    ;(document.head || document.documentElement).appendChild(script)
  } catch (err) {
    console.warn('[Homies Bridge] Failed to inject hook script:', err)
  }

  let currentCapturedData = null

  // 2. Lắng nghe tin nhắn từ injected-hook.js
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.type !== 'HOMIES_IPOS_DATA_CAPTURED') {
      return
    }

    currentCapturedData = event.data
    showFloatingToast(event.data)
  })

  // 3. Hiển thị Floating Toast Banner
  function showFloatingToast(info) {
    let container = document.getElementById('homies-ipos-bridge-toast')
    if (!container) {
      container = document.createElement('div')
      container.id = 'homies-ipos-bridge-toast'
      document.body.appendChild(container)
    }

    let moduleLabel = 'dữ liệu iPOS'
    if (info.module === 'payroll') moduleLabel = 'Bảng lương chu kỳ'
    if (info.module === 'attendance') moduleLabel = 'Bảng chấm công'
    if (info.module === 'employees') moduleLabel = 'Hồ sơ nhân sự'

    container.innerHTML = `
      <div class="homies-toast-inner">
        <div class="homies-toast-icon">⚡</div>
        <div class="homies-toast-body">
          <div class="homies-toast-title">Homies iPOS Bridge</div>
          <div class="homies-toast-desc">Phát hiện <strong>${moduleLabel}</strong> (${info.count} bản ghi)</div>
        </div>
        <div class="homies-toast-actions">
          <button id="homies-btn-sync" class="homies-btn-primary">Đồng bộ ngay</button>
          <button id="homies-btn-close" class="homies-btn-ghost">✕</button>
        </div>
      </div>
    `

    container.className = 'homies-toast-visible'

    // Gắn sự kiện nút
    document.getElementById('homies-btn-sync').onclick = handleSyncClick
    document.getElementById('homies-btn-close').onclick = () => {
      container.className = 'homies-toast-hidden'
    }
  }

  // 4. Xử lý khi người dùng bấm "Đồng bộ ngay"
  async function handleSyncClick() {
    const btn = document.getElementById('homies-btn-sync')
    if (!btn || !currentCapturedData) return

    btn.disabled = true
    btn.innerText = 'Đang đồng bộ...'

    // Đọc URL server cấu hình trong storage
    let serverUrl = 'http://localhost:3535'
    try {
      if (chrome.storage && chrome.storage.local) {
        const stored = await chrome.storage.local.get(['serverUrl'])
        if (stored.serverUrl) {
          serverUrl = stored.serverUrl.replace(/\/$/, '')
        }
      }
    } catch (e) {}

    const payload = {
      source: 'ipos_hrm',
      module: currentCapturedData.module,
      raw_data: currentCapturedData.data,
      period: new Date().toISOString().slice(0, 7),
      timestamp: new Date().toISOString(),
    }

    try {
      const res = await fetch(`${serverUrl}/api/ipos/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        btn.innerText = '✅ Thành công!'
        btn.style.backgroundColor = '#10B981'

        const toast = document.getElementById('homies-ipos-bridge-toast')
        if (toast) {
          const desc = toast.querySelector('.homies-toast-desc')
          if (desc) desc.innerHTML = `<span style="color:#059669;font-weight:600">Đã cập nhật ${json.count} mục vào Homies HRM!</span>`
          setTimeout(() => {
            toast.className = 'homies-toast-hidden'
          }, 4000)
        }
      } else {
        throw new Error(json.message || 'Lỗi xử lý máy chủ')
      }
    } catch (err) {
      console.error('[Homies Bridge Sync Error]:', err)
      btn.disabled = false
      btn.innerText = 'Thử lại'
      btn.style.backgroundColor = '#EF4444'

      const toast = document.getElementById('homies-ipos-bridge-toast')
      if (toast) {
        const desc = toast.querySelector('.homies-toast-desc')
        if (desc) desc.innerHTML = `<span style="color:#DC2626">Không kết nối được: ${serverUrl}</span>`
      }
    }
  }
})()
