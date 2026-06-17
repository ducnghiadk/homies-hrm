from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

regular = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf', 16)
bold = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 16)
title = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 34)
section = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 22)
sub = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 18)
small = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf', 13)
small_bold = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 13)


def rr(draw, xy, fill, outline=None, width=1, r=18):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def wrap(draw, text, font, max_w):
    words = text.split()
    lines = []
    cur = ''
    for word in words:
        nxt = word if not cur else cur + ' ' + word
        if draw.textlength(nxt, font=font) <= max_w:
            cur = nxt
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines or ['']


def draw_text(draw, x, y, text, font, fill, max_w=None, gap=5):
    lines = wrap(draw, text, font, max_w) if max_w else text.split('\n')
    cy = y
    for line in lines:
        draw.text((x, cy), line, font=font, fill=fill)
        box = draw.textbbox((x, cy), line, font=font)
        cy += (box[3] - box[1]) + gap
    return cy


def pill(draw, x, y, text, fill, text_fill, outline=None):
    tw = draw.textlength(text, font=small_bold)
    rr(draw, (x, y, x + tw + 24, y + 30), fill, outline=outline, r=15)
    draw.text((x + 12, y + 7), text, font=small_bold, fill=text_fill)
    return x + tw + 24


def metric(draw, x, y, w, h, label, value, tone='neutral'):
    tones = {
        'neutral': ('#D9E1EA', '#0F2744'),
        'warn': ('#F1C97A', '#946000'),
        'bad': ('#F2B2AE', '#A62821'),
        'good': ('#BEE0C7', '#1D7A39'),
    }
    border, value_fill = tones[tone]
    rr(draw, (x, y, x+w, y+h), '#FAFCFF', outline=border, r=14)
    draw_text(draw, x+14, y+11, label, small, '#617186', max_w=w-28)
    draw.text((x+14, y+34), value, font=section, fill=value_fill)


def note(draw, x, y, w, h, title_text, body_text, fill='#FFF8E8', border='#E6D2A0', title_fill='#7C5A11', body_fill='#7A6540'):
    rr(draw, (x, y, x+w, y+h), fill, outline=border, r=16)
    draw.text((x+14, y+12), title_text, font=small_bold, fill=title_fill)
    draw_text(draw, x+14, y+34, body_text, small, body_fill, max_w=w-28)


def table(draw, x, y, w, headers, rows, widths, row_h=38, head_fill='#EEF5FB'):
    total_h = row_h * (len(rows)+1)
    rr(draw, (x, y, x+w, y+total_h), '#FFFFFF', outline='#D8E2EC', r=12)
    rr(draw, (x, y, x+w, y+row_h), head_fill, outline='#D8E2EC', r=12)
    cx = x
    for i, head in enumerate(headers):
        if i > 0:
            draw.line((cx, y, cx, y+total_h), fill='#D8E2EC', width=1)
        draw_text(draw, cx+10, y+9, head, small_bold, '#39536F', max_w=widths[i]-20, gap=2)
        cx += widths[i]
    for r_i in range(len(rows)):
        ly = y + row_h*(r_i+1)
        draw.line((x, ly, x+w, ly), fill='#D8E2EC', width=1)
    for r_i, row in enumerate(rows):
        cx = x
        for c_i, cell in enumerate(row):
            draw_text(draw, cx+10, y+row_h*(r_i+1)+8, cell, small, '#25384F', max_w=widths[c_i]-20, gap=2)
            cx += widths[c_i]


def make_base(title_text, subtitle_text, badge_text, badge_fill, badge_text_fill):
    width, height = 1680, 1120
    image = Image.new('RGB', (width, height), '#F6F2EA')
    draw = ImageDraw.Draw(image)
    rr(draw, (46, 86, width-46, height-46), '#FFFFFF', outline='#E5DCCF', r=28)
    box = draw.textbbox((0, 0), title_text, font=title)
    draw.text(((width-(box[2]-box[0]))/2, 26), title_text, font=title, fill='#1A2F46')
    draw_text(draw, 180, 72, subtitle_text, regular, '#5C6D81', max_w=width-360)
    pill(draw, 72, 116, badge_text, badge_fill, badge_text_fill)
    return image, draw


out = Path(r'C:\Users\Admin\.gemini\antigravity\scratch\hrm-tra-sua\output\mockups')
out.mkdir(parents=True, exist_ok=True)

# Ảnh 1
image, draw = make_base(
    'Phóng to thẻ 1. Khung thử việc',
    'Thẻ này chỉ tập trung vào bộ khung chung: thời gian, người theo dõi, các chặng chính và bảng tóm tắt mức sẵn sàng.',
    'Bước 1', '#EAF7EE', '#1D7A39'
)

x, y, w = 72, 158, 1536
note(draw, x, y, w, 82, 'Khung thử việc đang ở trạng thái: Còn thiếu', 'Đã chọn thời gian và người theo dõi. Còn thiếu một chặng chính và còn hai nhóm áp dụng chưa gắn đủ.', fill='#FFF8E8', border='#E4D39E')
pill(draw, x+1100, y+24, 'Lưu và sang bước tiếp', '#EEF3FF', '#2F58C7', outline='#C9D8FF')
pill(draw, x+1288, y+24, 'Lưu khung thử việc', '#5D74E6', '#FFFFFF')

metric(draw, x, y+100, 180, 76, 'Thời gian thử việc', '14 ngày', 'good')
metric(draw, x+196, y+100, 180, 76, 'Số chặng chính', '4', 'neutral')
metric(draw, x+392, y+100, 180, 76, 'Người theo dõi', 'Nhân sự', 'neutral')
metric(draw, x+588, y+100, 180, 76, 'Chặng còn thiếu', '1', 'warn')
metric(draw, x+784, y+100, 180, 76, 'Nhóm chưa đủ', '2', 'warn')
metric(draw, x+980, y+100, 180, 76, 'Đủ để sang bước 2', 'Có', 'good')

rr(draw, (x, y+196, x+690, y+438), '#FFFFFF', outline='#E3E8EF', r=20)
draw.text((x+18, y+212), 'Thông tin khung chung', font=section, fill='#0F2744')
draw_text(draw, x+18, y+246, 'Người dùng mới vào lần đầu có thể hoàn tất toàn bộ nền tảng ở đây trước khi sang phần nội dung chi tiết.', small, '#66778F', max_w=650)
table(draw, x+18, y+290, 654, ['Mục cần thiết lập', 'Giá trị hiện tại', 'Trạng thái'], [
    ['Thời gian thử việc', '14 ngày', 'Đã có'],
    ['Người theo dõi chính', 'Nhân sự', 'Đã có'],
    ['Nguyên tắc đánh giá cuối kỳ', 'Đạt đủ kỹ năng và thái độ', 'Đã có'],
    ['Số chặng cần theo dõi', '4 chặng', 'Đã có'],
], [230, 270, 154], row_h=38)

rr(draw, (x+714, y+196, x+w, y+438), '#FFFFFF', outline='#E3E8EF', r=20)
draw.text((x+732, y+212), 'Các chặng chính', font=section, fill='#0F2744')
draw_text(draw, x+732, y+246, 'Bảng này chỉ để dựng xương sống của hành trình, chưa đưa tài liệu hay việc cần làm vào.', small, '#66778F', max_w=780)
table(draw, x+732, y+290, 790, ['Chặng thử việc', 'Thời điểm', 'Mục tiêu ngắn', 'Trạng thái'], [
    ['Ca đầu', 'Ngày 1', 'Tác phong, nội quy, giờ vào ca', 'Đã có'],
    ['3 ngày đầu', 'Ngày 1 đến 3', 'Nắm quy trình phục vụ cơ bản', 'Đã có'],
    ['Tuần đầu', 'Ngày 4 đến 7', 'Làm được đầu việc chính tại quầy', 'Đã có'],
    ['Đánh giá cuối kỳ', 'Ngày 14', 'Chưa khai báo mục tiêu', 'Còn thiếu'],
], [170, 150, 330, 140], row_h=38)

note(draw, x, y+462, 510, 104, 'Cảnh báo của bước 1', 'Chặng đánh giá cuối kỳ chưa có mục tiêu rõ. Hai nhóm áp dụng vẫn chưa gắn đủ với khung thử việc này.', fill='#FFF3F2', border='#E7BAB4', title_fill='#A62821', body_fill='#845C58')
note(draw, x+530, y+462, 488, 104, 'Nguyên tắc khi duyệt bước 1', 'Chỉ cần chốt bộ khung chung. Không kéo tài liệu, nội dung học hay báo cáo chi tiết vào bước này.', fill='#EFFAF1', border='#BEE0C7', title_fill='#1D7A39', body_fill='#4E6A53')

rr(draw, (x+1040, y+462, x+w, y+750), '#FFFFFF', outline='#E3E8EF', r=20)
draw.text((x+1058, y+478), 'Bảng nơi áp dụng tóm tắt', font=section, fill='#0F2744')
draw_text(draw, x+1058, y+512, 'Ở bước 1 chỉ cần nhìn tóm tắt để biết có nhóm nào còn bỏ sót. Việc gắn chi tiết sẽ xử lý ở bước 4.', small, '#66778F', max_w=446)
table(draw, x+1058, y+556, 446, ['Nhóm áp dụng', 'Số vị trí', 'Trạng thái'], [
    ['Thu ngân', '3', 'Đủ'],
    ['Pha chế', '2', 'Còn thiếu'],
    ['Ca trưởng', '1', 'Đủ'],
    ['Hỗ trợ quầy', '0', 'Chưa gắn'],
], [190, 100, 156], row_h=38)

rr(draw, (x, y+590, x+1018, y+750), '#FFFFFF', outline='#E3E8EF', r=20)
draw.text((x+18, y+606), 'Khu sửa nhanh trong bước 1', font=section, fill='#0F2744')
draw_text(draw, x+18, y+640, 'Dành cho người quay lại chỉnh một phần nhỏ mà không phải đi lại toàn bộ hành trình.', small, '#66778F', max_w=980)
qx = x+18
for label in ['Sửa thời gian thử việc', 'Sửa người theo dõi', 'Sửa các chặng', 'Xem nhóm còn thiếu']:
    qx = pill(draw, qx, y+678, label, '#F3F6FA', '#42586F', outline='#D5DEE8') + 10

note(draw, x, y+774, w, 250, 'Điểm quan trọng của thẻ 1', 'Thẻ này chỉ làm đúng một việc: dựng khung chung cho toàn bộ quy trình thử việc. Nhìn vào là biết thời gian, ai theo dõi, có bao nhiêu chặng và chặng nào còn thiếu. Mọi phần nội dung chi tiết, tài liệu hay việc cần làm đều để sang thẻ sau. Nhờ vậy người làm lần đầu không bị ngộp, còn người quay lại sửa cũng chạm đúng phần cần sửa.', fill='#F8FBFF', border='#D7E4F2', title_fill='#2F58C7', body_fill='#5A6C82')

path1 = out / 'phong-to-the-1-khung-thu-viec.png'
image.save(path1)

# Ảnh 2
image, draw = make_base(
    'Phóng to thẻ 4. Áp dụng và đưa vào dùng',
    'Thẻ này chỉ tập trung vào bảng nhóm áp dụng, kiểm tra còn thiếu gì và chốt đưa quy trình vào sử dụng.',
    'Bước 4', '#FFF3E0', '#9A6600'
)

x, y, w = 72, 158, 1536
note(draw, x, y, w, 82, 'Sẵn sàng đưa vào dùng: Chưa', 'Còn 2 lỗi cần xử lý trước khi áp dụng: chặng 3 ngày đầu còn thiếu nội dung và nhóm pha chế chưa gắn đủ.', fill='#FFF8E8', border='#E4D39E')
pill(draw, x+1242, y+24, 'Kiểm tra lần cuối', '#EEF3FF', '#2F58C7', outline='#C9D8FF')
pill(draw, x+1380, y+24, 'Đưa vào sử dụng', '#3A63E8', '#FFFFFF')

metric(draw, x, y+100, 220, 76, 'Nhóm áp dụng đã chọn', '2/4', 'warn')
metric(draw, x+236, y+100, 220, 76, 'Lỗi chặn đưa vào dùng', '2', 'bad')
metric(draw, x+472, y+100, 220, 76, 'Nhân sự lệch nhóm', '5', 'warn')
metric(draw, x+708, y+100, 220, 76, 'Lịch sử thay đổi mới nhất', '06/06', 'neutral')
metric(draw, x+944, y+100, 220, 76, 'Trạng thái bản hiện tại', 'Nháp', 'neutral')
metric(draw, x+1180, y+100, 220, 76, 'Đưa vào dùng ngay', 'Chưa', 'bad')

rr(draw, (x, y+196, x+980, y+622), '#FFFFFF', outline='#E3E8EF', r=20)
draw.text((x+18, y+212), 'Bảng nhóm áp dụng', font=section, fill='#0F2744')
draw_text(draw, x+18, y+246, 'Đây là bảng chính của bước 4. Người dùng nhìn một lần là biết nhóm nào đã đủ, nhóm nào còn thiếu.', small, '#66778F', max_w=940)
table(draw, x+18, y+290, 944, ['Nhóm áp dụng', 'Số vị trí đã gắn', 'Mẫu quy trình', 'Trạng thái', 'Ghi chú'], [
    ['Thu ngân', '3', 'Mẫu thu ngân', 'Đủ', 'Có thể áp dụng ngay'],
    ['Pha chế', '2', 'Mẫu pha chế', 'Còn thiếu', 'Thiếu nội dung ở chặng 3 ngày đầu'],
    ['Ca trưởng', '1', 'Mẫu ca trưởng', 'Đủ', 'Không có lỗi'],
    ['Hỗ trợ quầy', '0', 'Chưa chọn', 'Chưa gắn', 'Cần chọn nhóm hoặc bỏ khỏi phạm vi'],
], [170, 170, 220, 130, 254], row_h=42)

note(draw, x+18, y+486, 944, 118, 'Còn thiếu gì trước khi đưa vào dùng', 'Pha chế còn thiếu nội dung cho chặng 3 ngày đầu. Hỗ trợ quầy chưa có nhóm áp dụng. Sau khi xử lý xong hai điểm này mới nên bấm đưa vào sử dụng.', fill='#FFF3F2', border='#E7BAB4', title_fill='#A62821', body_fill='#845C58')

rr(draw, (x+1000, y+196, x+w, y+622), '#FFFFFF', outline='#E3E8EF', r=20)
draw.text((x+1018, y+212), 'Bảng kiểm tra lần cuối', font=section, fill='#0F2744')
draw_text(draw, x+1018, y+246, 'Bảng này giúp nhân sự tự tin chốt dùng mà không phải đọc lại toàn bộ quy trình.', small, '#66778F', max_w=500)
table(draw, x+1018, y+290, 486, ['Điều kiện cần có', 'Kết quả'], [
    ['Đã có thời gian thử việc', 'Đạt'],
    ['Đã có đủ các chặng chính', 'Đạt'],
    ['Mỗi chặng có nội dung', 'Chưa đạt'],
    ['Đã chọn nhóm áp dụng', 'Chưa đạt'],
    ['Không còn lỗi chặn', 'Chưa đạt'],
], [336, 150], row_h=40)

note(draw, x+1018, y+520, 486, 84, 'Hành động đề xuất', 'Quay lại thẻ 3 để bổ sung nội dung còn thiếu, sau đó quay lại thẻ 4 để kiểm tra lần cuối.', fill='#F8FBFF', border='#D7E4F2', title_fill='#2F58C7', body_fill='#5A6C82')

rr(draw, (x, y+646, x+w, y+844), '#FFFFFF', outline='#E3E8EF', r=20)
draw.text((x+18, y+662), 'Lịch sử thay đổi gần đây', font=section, fill='#0F2744')
draw_text(draw, x+18, y+696, 'Phần này nằm cuối bước 4, không chen vào giữa luồng chính. Khi cần rà lại thì nhìn nhanh theo dạng bảng.', small, '#66778F', max_w=1490)
table(draw, x+18, y+736, 1500, ['Thay đổi', 'Người thực hiện', 'Thời gian', 'Ảnh hưởng'], [
    ['Cập nhật thời gian thử việc từ 10 lên 14 ngày', 'Nhân sự', '06/06 10:25', 'Ảnh hưởng toàn bộ cửa hàng'],
    ['Bổ sung mục tiêu cho chặng tuần đầu', 'Nhân sự', '06/06 09:10', 'Ảnh hưởng nhóm thu ngân và pha chế'],
    ['Đổi mẫu quy trình cho ca trưởng', 'Nhân sự', '05/06 16:40', 'Ảnh hưởng nhóm ca trưởng'],
], [600, 180, 180, 540], row_h=40)

rr(draw, (x, y+868, x+w, y+1024), '#EFFAF1', outline='#BEE0C7', r=20)
draw.text((x+18, y+884), 'Điểm quan trọng của thẻ 4', font=section, fill='#1D7A39')
draw_text(draw, x+18, y+920, 'Thẻ này là nơi chốt cuối cùng. Người dùng chỉ cần nhìn bảng nhóm áp dụng, bảng kiểm tra lần cuối và danh sách lỗi chặn là đủ ra quyết định. Mọi thông tin phụ như lịch sử thay đổi được đặt xuống dưới để không cản trở việc đưa vào dùng.', regular, '#4E6A53', max_w=1490)

path2 = out / 'phong-to-the-4-ap-dung-va-dua-vao-dung.png'
image.save(path2)

print(path1)
print(path2)