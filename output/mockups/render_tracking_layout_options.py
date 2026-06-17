# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

W, H = 2200, 1380
bg = '#F5F1E8'
card_bg = '#FFFFFF'
ink = '#14324A'
muted = '#5E6D79'
line = '#DDD3C2'
header = '#F7E8C9'
blue = '#2F6FA8'
warn = '#FFF2D8'
warn_line = '#E7C67A'
soft = '#F8FBFF'
soft_line = '#D9E6F2'
shadow = '#EAE3D6'
green_bg = '#EEF8F1'
green_line = '#B9DEC3'
red_bg = '#FFF3F1'
red_line = '#E9B8B1'

out = Path(r'C:\Users\Admin\.gemini\antigravity\scratch\hrm-tra-sua\output\mockups')
out.mkdir(parents=True, exist_ok=True)
path = out / 'so-sanh-bo-cuc-theo-doi-thu-viec-bang-nhan-vien.png'

font_reg = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf', 22)
font_small = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf', 18)
font_bold = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 22)
font_big = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 40)
font_title = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 56)
font_head = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 28)
font_chip = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 17)
font_table = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf', 16)
font_table_bold = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 16)

img = Image.new('RGB', (W, H), bg)
d = ImageDraw.Draw(img)


def rr(x1, y1, x2, y2, fill, outline=None, width=1, r=26):
    d.rounded_rectangle((x1, y1, x2, y2), radius=r, fill=fill, outline=outline, width=width)


def text_box(text, font, max_w):
    words = text.split()
    lines = []
    cur = ''
    for word in words:
        nxt = word if not cur else cur + ' ' + word
        if d.textlength(nxt, font=font) <= max_w:
            cur = nxt
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def draw_wrapped(x, y, text, font, fill, max_w, gap=6):
    cy = y
    for line in text_box(text, font, max_w):
        d.text((x, cy), line, font=font, fill=fill)
        box = d.textbbox((x, cy), line, font=font)
        cy += (box[3] - box[1]) + gap
    return cy


def chip(x, y, text, active=False):
    fill = '#FFF0CC' if active else '#FFFFFF'
    outline = '#E3C98A' if active else '#E3D7C6'
    color = '#8C6500' if active else '#5F6D79'
    tw = d.textlength(text, font=font_chip)
    rr(x, y, x + tw + 28, y + 34, fill, outline, r=17)
    d.text((x + 14, y + 8), text, font=font_chip, fill=color)
    return x + tw + 42


def mini_table(x, y, w, headers, rows, widths, row_h=34):
    total_h = row_h * (len(rows) + 1)
    rr(x, y, x + w, y + total_h, '#FFFFFF', line, r=14)
    rr(x, y, x + w, y + row_h, header, line, r=14)
    cx = x
    for i, head in enumerate(headers):
        if i > 0:
            d.line((cx, y, cx, y + total_h), fill=line, width=1)
        d.text((cx + 10, y + 9), head, font=font_table_bold, fill='#4A5B66')
        cx += widths[i]
    for ri in range(len(rows)):
        ly = y + row_h * (ri + 1)
        d.line((x, ly, x + w, ly), fill=line, width=1)
    for ri, row in enumerate(rows):
        cx = x
        for ci, cell in enumerate(row):
            d.text((cx + 10, y + row_h * (ri + 1) + 9), cell, font=font_table, fill='#20384D')
            cx += widths[ci]
    return y + total_h


def metric(x, y, w, label, value, tone='neutral'):
    tones = {
        'neutral': ('#F8FBFF', '#D8E4F0', '#1D3750'),
        'good': (green_bg, green_line, '#1E7B3D'),
        'warn': (warn, warn_line, '#9A6600'),
    }
    fill, outline, color = tones[tone]
    rr(x, y, x + w, y + 88, fill, outline, r=18)
    d.text((x + 16, y + 15), label, font=font_small, fill=muted)
    d.text((x + 16, y + 44), value, font=font_head, fill=color)


def panel_title(x, y, title, body, max_w):
    d.text((x, y), title, font=font_head, fill=ink)
    return draw_wrapped(x, y + 38, body, font_small, muted, max_w)


rr(38, 38, W - 38, H - 38, '#FFFDFC', shadow, r=36)
d.text((90, 82), 'So sánh bố cục màn theo dõi thử việc', font=font_title, fill=ink)
d.text((90, 156), 'Trọng tâm đã chốt: bảng danh sách nhân viên là vùng chính. Dưới đây là 3 hướng bố cục để chốt tiếp.', font=font_reg, fill=muted)

metric(90, 214, 250, 'Hướng khuyên dùng', 'Phương án A', 'good')
metric(358, 214, 250, 'Trọng tâm', 'Bảng nhân sự', 'neutral')
metric(626, 214, 250, 'Nguy cơ rối', 'Thấp', 'good')
metric(894, 214, 250, 'Tốc độ xử lý gấp', 'Trung bình', 'warn')

cards_y = 340
card_w = 650
card_h = 930
start_x = 90
gap = 35


def draw_card(x, y, tag, title, summary, recommend=False):
    rr(x, y, x + card_w, y + card_h, card_bg, '#DCD4C7', r=30)
    if recommend:
        rr(x, y, x + card_w, y + card_h, None, '#69AF7D', width=4, r=30)
        rr(x + 22, y + 18, x + 240, y + 58, '#EEF8F1', '#B9DEC3', r=18)
        d.text((x + 38, y + 29), 'Khuyên dùng', font=font_chip, fill='#1E7B3D')
    rr(x + 22, y + 74, x + 130, y + 112, '#F7E8C9', '#E9D7B3', r=16)
    d.text((x + 44, y + 84), tag, font=font_chip, fill='#856100')
    d.text((x + 22, y + 132), title, font=font_big, fill=ink)
    draw_wrapped(x + 22, y + 184, summary, font_small, muted, card_w - 44)


x = start_x
draw_card(x, cards_y, 'Phương án A', 'Danh sách làm trung tâm', 'HR vào màn là quét toàn bộ nhân sự mới trước. Khi bấm vào từng dòng mới mở chi tiết và xử lý tiếp.', True)
chip_x = x + 28
chip_x = chip(chip_x, cards_y + 270, 'Tất cả')
chip_x = chip(chip_x, cards_y + 270, 'Cần xử lý ngay', True)
chip(chip_x, cards_y + 270, 'Đang đúng tiến độ')
mini_table(x + 24, cards_y + 320, 602, ['Nhân sự', 'Chặng hiện tại', 'Việc còn thiếu', 'Thao tác'], [['Ngọc Anh', 'Ngày đầu', 'Chưa chốt người kèm', 'Mở'], ['Minh Khoa', 'Kèm cặp', 'Đủ bước', 'Xem'], ['Hoài Nam', 'Đánh giá', 'Chờ chốt kết quả', 'Mở']], [125, 140, 220, 117], row_h=38)
rr(x + 24, cards_y + 500, x + 626, cards_y + 620, soft, soft_line, r=18)
d.text((x + 42, cards_y + 520), 'Điểm mạnh', font=font_bold, fill=blue)
draw_wrapped(x + 42, cards_y + 554, 'Dễ quét toàn cảnh. Hợp với HR khi cần chọn đúng người rồi mới xử lý sâu.', font_small, muted, 540)
rr(x + 24, cards_y + 640, x + 626, cards_y + 770, warn, warn_line, r=18)
d.text((x + 42, cards_y + 660), 'Lưu ý', font=font_bold, fill='#9A6600')
draw_wrapped(x + 42, cards_y + 694, 'Cần cột cảnh báo và bộ lọc rõ, nếu không việc nóng sẽ bị chìm trong danh sách.', font_small, muted, 540)
panel_title(x + 24, cards_y + 796, 'Khi nào nên dùng', 'Khi người dùng chính là HR và thói quen làm việc là vào tìm nhân sự mới trước, rồi xem từng hành trình sau.', 600)

x = start_x + card_w + gap
draw_card(x, cards_y, 'Phương án B', 'Việc nóng nổi lên trước', 'Màn mở ra là khối việc cần xử lý ngay trong ngày. Danh sách nhân sự bị đẩy xuống dưới.', False)
rr(x + 24, cards_y + 270, x + 626, cards_y + 346, warn, warn_line, r=18)
d.text((x + 42, cards_y + 292), 'Hôm nay cần xử lý: 3 nhân sự chậm người kèm, 2 nhân sự chờ chốt kết quả ca đầu', font=font_small, fill='#8A6500')
mini_table(x + 24, cards_y + 370, 602, ['Nhân sự', 'Chặng', 'Cần làm ngay'], [['Ngọc Anh', 'Ngày đầu', 'Chốt người kèm'], ['Hoài Nam', 'Đánh giá', 'Chốt kết quả'], ['Mai Vy', 'Chuẩn bị', 'Bổ sung tài liệu']], [140, 145, 317], row_h=38)
rr(x + 24, cards_y + 548, x + 626, cards_y + 668, soft, soft_line, r=18)
d.text((x + 42, cards_y + 568), 'Điểm mạnh', font=font_bold, fill=blue)
draw_wrapped(x + 42, cards_y + 602, 'Rất hợp khi đội vận hành đang xử lý gấp trong ngày và cần nhìn ngay các ca nóng.', font_small, muted, 540)
rr(x + 24, cards_y + 688, x + 626, cards_y + 838, red_bg, red_line, r=18)
d.text((x + 42, cards_y + 708), 'Điểm yếu', font=font_bold, fill='#B04135')
draw_wrapped(x + 42, cards_y + 742, 'Lệch trọng tâm đã chốt. Người dùng khó quét toàn bộ danh sách nhân sự mới, dễ bỏ sót người đang đúng tiến độ nhưng sắp tới hạn.', font_small, muted, 540)
panel_title(x + 24, cards_y + 864, 'Khi nào nên dùng', 'Chỉ hợp nếu đội coi đây là màn điều hành việc nóng hằng ngày, không phải màn theo dõi danh sách nhân sự.', 600)

x = start_x + (card_w + gap) * 2
draw_card(x, cards_y, 'Phương án C', 'Danh sách kèm chi tiết mở sẵn', 'Bên trái là bảng nhân sự. Bên phải luôn mở khung chi tiết của người đang chọn.', False)
mini_table(x + 24, cards_y + 300, 340, ['Nhân sự', 'Chặng'], [['Ngọc Anh', 'Ngày đầu'], ['Minh Khoa', 'Kèm cặp'], ['Hoài Nam', 'Đánh giá']], [170, 170], row_h=38)
rr(x + 388, cards_y + 300, x + 626, cards_y + 510, '#FFFFFF', '#D9E6F2', r=16)
d.text((x + 406, cards_y + 320), 'Chi tiết nhân sự', font=font_bold, fill=ink)
draw_wrapped(x + 406, cards_y + 358, 'Chặng: Ngày đầu nhận việc Mốc tới: Chốt ca đầu Thiếu: Người kèm Thao tác: Mở xử lý ngay', font_small, muted, 190, gap=10)
rr(x + 24, cards_y + 548, x + 626, cards_y + 678, soft, soft_line, r=18)
d.text((x + 42, cards_y + 568), 'Điểm mạnh', font=font_bold, fill=blue)
draw_wrapped(x + 42, cards_y + 602, 'Sau khi chọn người là có ngay phần chi tiết để xử lý, ít phải chuyển bước.', font_small, muted, 540)
rr(x + 24, cards_y + 698, x + 626, cards_y + 848, warn, warn_line, r=18)
d.text((x + 42, cards_y + 718), 'Điểm yếu', font=font_bold, fill='#9A6600')
draw_wrapped(x + 42, cards_y + 752, 'Màn dễ chật. Nếu chi tiết dài, bảng bị co lại và cảm giác nặng mắt hơn phương án A.', font_small, muted, 540)
panel_title(x + 24, cards_y + 874, 'Khi nào nên dùng', 'Khi người dùng xử lý sâu từng người liên tục và chấp nhận bố cục dày hơn để đổi lấy tốc độ thao tác.', 600)

rr(90, 1290, W - 90, 1330, '#EEF8F1', '#B9DEC3', r=20)
d.text((114, 1301), 'Khuyến nghị chốt: Phương án A. Nó bám đúng trọng tâm bảng nhân sự, ít ngộp hơn, vẫn đủ chỗ cho cảnh báo và thao tác nhanh.', font=font_bold, fill='#1E7B3D')

img.save(path)
