import puppeteer from 'puppeteer-core'
import path from 'path'

const outputDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\2e723446-499d-48f9-acab-a0049c27415b'

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 950, deviceScaleFactor: 1.5 }
  })

  try {
    const page = await browser.newPage()

    await page.goto('http://localhost:3535', { waitUntil: 'domcontentloaded' })

    await page.evaluate(() => {
      const authData = {
        state: {
          user: {
            id: 'ceo-001',
            full_name: 'Nguyễn Minh Tuấn',
            email: 'tuan@bobahouse.vn',
            role: 'ceo',
            store_id: 'store-001',
            position_id: 'pos-ceo',
            department_name: 'Ban Giám Đốc'
          },
          token: 'mock-jwt-token-ceo',
          isAuthenticated: true,
          hasHydrated: true
        },
        version: 0
      }
      localStorage.setItem('hrm-auth-v2', JSON.stringify(authData))
    })

    await page.goto('http://localhost:3535/bsc-bonus?tab=logs', { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 1500))

    // Click Tab 4
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const logTab = buttons.find(b => b.textContent && b.textContent.includes('Nhật Ký Lỗi'))
      if (logTab) logTab.click()
    })
    await new Promise(r => setTimeout(r, 1200))

    // Click Có vi phạm
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const viphamBtn = buttons.find(b => b.textContent && b.textContent.includes('Có vi phạm'))
      if (viphamBtn) viphamBtn.click()
    })
    await new Promise(r => setTimeout(r, 1000))

    // Mở card Cao Văn Thắng
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, div'))
      const thang = buttons.find(b => b.textContent && b.textContent.includes('Cao Văn Thắng'))
      if (thang) thang.click()
    })
    await new Promise(r => setTimeout(r, 1000))

    // Click nút "Bằng chứng"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const proofBtn = buttons.find(b => b.textContent && b.textContent.includes('Bằng chứng'))
      if (proofBtn) proofBtn.click()
    })
    await new Promise(r => setTimeout(r, 1500))

    const modalScreenshotPath = path.join(outputDir, 'screenshot-proof-modal.png')
    await page.screenshot({ path: modalScreenshotPath, fullPage: false })
    console.log('Saved:', modalScreenshotPath)
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await browser.close()
  }
}

run()
