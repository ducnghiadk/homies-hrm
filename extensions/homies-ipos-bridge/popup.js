/**
 * Homies iPOS Bridge - Popup Script
 * Handles settings storage and server health check.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const urlInput = document.getElementById('server-url-input')
  const saveBtn = document.getElementById('btn-save-server')
  const pingBtn = document.getElementById('btn-ping-server')
  const statusPill = document.getElementById('status-pill')
  const statusText = document.getElementById('status-text')
  const feedbackMsg = document.getElementById('msg-save')

  const DEFAULT_URL = 'http://localhost:3535'

  // 1. Tải URL cấu hình từ chrome.storage.local
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['serverUrl'], (res) => {
      if (res.serverUrl) {
        urlInput.value = res.serverUrl
      } else {
        urlInput.value = DEFAULT_URL
      }
      checkServerHealth(urlInput.value)
    })
  } else {
    urlInput.value = DEFAULT_URL
    checkServerHealth(DEFAULT_URL)
  }

  // 2. Hàm kiểm tra kết nối tới server Homies HRM
  async function checkServerHealth(targetUrl) {
    const cleanUrl = (targetUrl || DEFAULT_URL).replace(/\/$/, '')
    statusPill.className = 'status-pill status-checking'
    statusText.textContent = 'Đang kiểm tra...'

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      const res = await fetch(`${cleanUrl}/api/ipos/sync`, {
        method: 'GET',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const json = await res.json()
        if (json.status === 'ready') {
          statusPill.className = 'status-pill status-online'
          statusText.textContent = '🟢 Đã kết nối'
          return true
        }
      }
      throw new Error('Máy chủ phản hồi không đúng')
    } catch (err) {
      statusPill.className = 'status-pill status-offline'
      statusText.textContent = '🔴 Mất kết nối'
      return false
    }
  }

  // 3. Sự kiện bấm nút Lưu cài đặt
  saveBtn.addEventListener('click', () => {
    const val = urlInput.value.trim().replace(/\/$/, '')
    if (!val) {
      feedbackMsg.style.color = '#EF4444'
      feedbackMsg.textContent = 'Vui lòng nhập địa chỉ URL máy chủ'
      return
    }

    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ serverUrl: val }, () => {
        feedbackMsg.style.color = '#10B981'
        feedbackMsg.textContent = 'Đã lưu cấu hình máy chủ!'
        setTimeout(() => {
          feedbackMsg.textContent = ''
        }, 3000)
        checkServerHealth(val)
      })
    } else {
      feedbackMsg.style.color = '#10B981'
      feedbackMsg.textContent = 'Đã lưu (phiên tạm thời)!'
      checkServerHealth(val)
    }
  })

  // 4. Sự kiện bấm nút Kiểm tra kết nối
  pingBtn.addEventListener('click', () => {
    checkServerHealth(urlInput.value.trim())
  })
})
