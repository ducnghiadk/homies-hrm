import os
import re

# Định nghĩa các thư mục cần quét
SRC_DIR = r"c:\Users\Admin\.gemini\antigravity\scratch\hrm-tra-sua\src"

# Bộ quy tắc thay thế mã HEX cũ -> HEX chuẩn Homies (Cho Mock data và SVG)
HEX_REPLACEMENTS = {
    r'(?i)#3B82F6': '#2F6FA8', # Blue -> Primary Navy
    r'(?i)#F59E0B': '#F6C85F', # Amber -> Vanilla/Yellow
    r'(?i)#FCD34D': '#FCECC6', # Amber-300 -> Light Vanilla
    r'(?i)#8B5CF6': '#001D3D', # Purple -> Dark Navy
    r'(?i)#10B981': '#1E9E57', # Emerald -> Mint
    r'(?i)#22C55E': '#48C079', # Green -> Light Mint
    r'(?i)#EF4444': '#D9381E', # Red -> Homies Red
    r'(?i)#FEF3C7': '#FFF8E8', # Light Amber -> Cream BG
}

# Bộ quy tắc thay thế class Tailwind (Regex)
CLASS_REPLACEMENTS = [
    # BLUE -> PRIMARY
    (r'\btext-blue-(\d+)\b', r'text-primary-\1'),
    (r'\bbg-blue-(\d+)\b', r'bg-primary-\1'),
    (r'\bborder-blue-(\d+)\b', r'border-primary-\1'),
    # GREEN -> SUCCESS
    (r'\btext-green-(\d+)\b', r'text-success-\1'),
    (r'\bbg-green-(\d+)\b', r'bg-success-\1'),
    (r'\bborder-green-(\d+)\b', r'border-success-\1'),
    # AMBER/YELLOW/ORANGE -> WARNING
    (r'\btext-(?:amber|yellow|orange)-(\d+)\b', r'text-warning-\1'),
    (r'\bbg-(?:amber|yellow|orange)-(\d+)\b', r'bg-warning-\1'),
    (r'\bborder-(?:amber|yellow|orange)-(\d+)\b', r'border-warning-\1'),
    # RED -> ERROR
    (r'\btext-red-(\d+)\b', r'text-error-\1'),
    (r'\bbg-red-(\d+)\b', r'bg-error-\1'),
    (r'\bborder-red-(\d+)\b', r'border-error-\1'),
    # PURPLE -> ACCENT / NEUTRAL
    (r'\btext-purple-(\d+)\b', r'text-primary-\1'),
    (r'\bbg-purple-(\d+)\b', r'bg-primary-\1'),
    (r'\bborder-purple-(\d+)\b', r'border-primary-\1'),
]

total_files_modified = 0
total_replacements = 0

for root, _, files in os.walk(SRC_DIR):
    for filename in files:
        if filename.endswith((".ts", ".tsx")):
            filepath = os.path.join(root, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                new_content = content
                file_replacements = 0

                # 1. Replace HEX codes
                for old_hex_pattern, new_hex in HEX_REPLACEMENTS.items():
                    new_content, count = re.subn(old_hex_pattern, new_hex, new_content)
                    file_replacements += count

                # 2. Replace Tailwind classes
                for old_pattern, new_pattern in CLASS_REPLACEMENTS:
                    new_content, count = re.subn(old_pattern, new_pattern, new_content)
                    file_replacements += count

                if file_replacements > 0:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    total_files_modified += 1
                    total_replacements += file_replacements
                    print(f"[{file_replacements} changes] {filepath}")

            except Exception as e:
                print(f"Error processing {filepath}: {e}")

print(f"\n✅ DONE! Modified {total_files_modified} files with a total of {total_replacements} color updates.")
