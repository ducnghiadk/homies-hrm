/**
 * Homies iPOS Bridge - Injected Hook
 * Runs inside the webpage (MAIN world) to safely intercept internal JSON responses from iPOS HRM/FABi APIs.
 */
;(function () {
  console.log('[Homies Bridge] Injected hook activated on iPOS page.')

  function analyzeAndBroadcast(url, responseData) {
    if (!responseData || typeof responseData !== 'object') return

    // 1. Phân tích gói dữ liệu nhân viên
    if (
      Array.isArray(responseData) &&
      responseData.length > 0 &&
      (responseData[0].employeeCode || responseData[0].fullName || responseData[0].userCode)
    ) {
      window.postMessage(
        {
          type: 'HOMIES_IPOS_DATA_CAPTURED',
          module: 'employees',
          count: responseData.length,
          data: responseData,
          url,
        },
        '*'
      )
      return
    }

    // 2. Phân tích gói dữ liệu bảng lương / phiếu lương chu kỳ
    if (
      url.includes('salary') ||
      url.includes('payroll') ||
      url.includes('bang-luong') ||
      (responseData.data && Array.isArray(responseData.data) && responseData.data[0]?.netSalary !== undefined)
    ) {
      const list = Array.isArray(responseData) ? responseData : responseData.data || responseData.items || []
      if (list.length > 0) {
        window.postMessage(
          {
            type: 'HOMIES_IPOS_DATA_CAPTURED',
            module: 'payroll',
            count: list.length,
            data: list,
            url,
          },
          '*'
        )
        return
      }
    }

    // 3. Phân tích gói dữ liệu chấm công / ca kíp
    if (
      url.includes('time-attendance') ||
      url.includes('cham-cong') ||
      url.includes('attendance') ||
      url.includes('checkin') ||
      (responseData.data && Array.isArray(responseData.data) && responseData.data[0]?.checkInTime !== undefined)
    ) {
      const list = Array.isArray(responseData) ? responseData : responseData.data || responseData.items || []
      if (list.length > 0) {
        window.postMessage(
          {
            type: 'HOMIES_IPOS_DATA_CAPTURED',
            module: 'attendance',
            count: list.length,
            data: list,
            url,
          },
          '*'
        )
        return
      }
    }
  }

  // Hook Fetch
  const originalFetch = window.fetch
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args)
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || ''

    if (url.includes('api') || url.includes('fabi') || url.includes('ipos')) {
      try {
        const clone = response.clone()
        clone
          .json()
          .then((data) => {
            analyzeAndBroadcast(url, data)
          })
          .catch(() => {})
      } catch (e) {}
    }

    return response
  }

  // Hook XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open
  const originalSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url
    return originalOpen.apply(this, [method, url, ...rest])
  }

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      if (this._url && (this._url.includes('api') || this._url.includes('fabi') || this._url.includes('ipos'))) {
        try {
          const data = JSON.parse(this.responseText)
          analyzeAndBroadcast(this._url, data)
        } catch (e) {}
      }
    })
    return originalSend.apply(this, args)
  }
})()
