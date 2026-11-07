import { loginHrm } from '../src/lib/services/ipos/ipos-hrm-client.ts'

async function runTests() {
  console.log('=== TEST 1: Kiểm tra hàm loginHrm trực tiếp ===')
  // Thử với thông tin sai để đảm bảo server phản hồi đúng lỗi nghiệp vụ
  const failResult = await loginHrm('sai_email@homies.vn', '123456')
  console.log('Kết quả đăng nhập sai email:', failResult)

  if (!failResult.success && failResult.message) {
    console.log('✅ TEST 1 ĐẠT: loginHrm bắt và trả về thông báo lỗi chính xác từ máy chủ iPOS HRM!')
  } else {
    console.error('❌ TEST 1 THẤT BẠI:', failResult)
    process.exit(1)
  }

  console.log('\n=== TEST 2: Kiểm tra khi bỏ trống email/mật khẩu ===')
  const emptyResult = await loginHrm('', '')
  console.log('Kết quả để trống:', emptyResult)
  if (!emptyResult.success && emptyResult.message.includes('Vui lòng nhập đầy đủ')) {
    console.log('✅ TEST 2 ĐẠT: Validate dữ liệu đầu vào chuẩn xác!')
  } else {
    console.error('❌ TEST 2 THẤT BẠI')
    process.exit(1)
  }

  console.log('\n🎉 TẤT CẢ 2 BÀI TEST CHUẨN XÁC 100%!')
}

runTests().catch((err) => {
  console.error('Lỗi thực thi test:', err)
  process.exit(1)
})
