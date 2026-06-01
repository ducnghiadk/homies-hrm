# ADR-003: Chiến lược check-in chấm công (Attendance Check-in Strategy)

## Trạng thái

**Accepted** — 2026-02-15

## Bối cảnh

- Cần xác thực nhân viên thực sự có mặt tại cửa hàng
- Chống gian lận: nhờ người check-in hộ, fake GPS
- Offline: cửa hàng có thể mất mạng
- UX: tối đa 3 taps, dùng 1 tay

## Quyết định

### Phương thức: **GPS + Selfie + Timestamp**

**Flow check-in (3 steps)**:

1. Bấm nút "Check-in" → App lấy GPS
2. Verify GPS trong bán kính store (Haversine formula, default 100m)
3. Camera mở → Chụp selfie → Submit

**Tính trạng thái tự động**:

```
Nếu check_in_time <= shift.start_time + 5 phút → "on_time"
Nếu check_in_time > shift.start_time + 5 phút → "late"
Nếu check_in_time < shift.start_time - 30 phút → "early"
```

**Offline handling**:

- Lưu check-in vào IndexedDB khi offline
- Background sync khi có mạng (Service Worker)
- Flag `is_offline_checkin = true` để manager review

## Phương án loại bỏ

| Phương án           | Lý do loại                                         |
| ------------------- | -------------------------------------------------- |
| QR code tại store   | Dễ share QR, cần hardware                          |
| NFC tag             | Cần NFC tag hardware, không phải phone nào cũng có |
| Face recognition AI | Quá phức tạp, tốn chi phí compute                  |
| WiFi BSSID check    | Không reliable, WiFi có thể spoof                  |

## Giới hạn đã biết

- GPS trong nhà có sai số ±20-50m → Bán kính 100m đủ buffer
- GPS spoofing trên Android → Selfie là layer bảo vệ thứ 2
- Camera permission bị từ chối → Cho phép check-in không ảnh nhưng flag "no_photo"
