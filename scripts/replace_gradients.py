import os

SRC_DIR = r"c:\Users\Admin\.gemini\antigravity\scratch\hrm-tra-sua\src"

GRADIENT_REPLACEMENTS = [
    # Tím đậm / Indigo -> Primary Navy
    ('from-purple-600 via-purple-500 to-indigo-600', 'from-primary-800 to-primary-600'),
    ('from-purple-600 via-purple-500 to-indigo-500', 'from-primary-800 to-primary-600'),
    ('from-purple-500 to-indigo-600', 'from-primary-700 to-primary-500'),
    ('from-purple-500 to-indigo-500', 'from-primary-600 to-primary-500'),
    ('from-indigo-600 via-purple-600 to-pink-500', 'from-primary-700 to-primary-500'),
    ('from-gray-900 via-purple-900 to-gray-900', 'from-dark-900 to-dark-700'),
    ('from-purple-500/10 to-indigo-500/10', 'from-primary-600/10 to-primary-500/10'),
    
    # Xanh ngọc -> Mint / Success
    ('from-emerald-500 to-teal-500', 'from-success-600 to-success-500'),
    ('from-emerald-50 to-teal-50', 'from-success-50 to-success-100'),
    ('from-green-50 to-emerald-50', 'from-success-50 to-success-100'),
    
    # Vàng/Cam -> Vanilla / Warning
    ('from-amber-500 to-orange-500', 'from-warning-600 to-warning-500'),
    ('from-amber-50 to-orange-50', 'from-warning-50 to-warning-100'),
    
    # Đỏ/Hồng -> Error
    ('from-red-500 to-rose-500', 'from-error-600 to-error-500'),
    ('from-red-50 to-rose-50', 'from-error-50 to-error-100'),
    ('from-pink-50 to-purple-50', 'from-error-50 to-error-100'),
    
    # Xanh dương / Tím nhạt -> Info / Primary
    ('from-blue-500 to-indigo-500', 'from-primary-500 to-primary-600'),
    ('from-blue-50 to-cyan-50', 'from-primary-50 to-primary-100'),
    ('from-blue-50 to-indigo-50', 'from-primary-50 to-primary-100'),
    ('from-purple-50 to-indigo-50', 'from-primary-50 to-primary-100'),
    
    # Thêm shadow nếu có
    ('shadow-purple-500/30', 'shadow-primary-600/30'),
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

                for old_val, new_val in GRADIENT_REPLACEMENTS:
                    count = new_content.count(old_val)
                    if count > 0:
                        new_content = new_content.replace(old_val, new_val)
                        file_replacements += count

                if file_replacements > 0:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    total_files_modified += 1
                    total_replacements += file_replacements
                    print(f"[{file_replacements} changes] {filepath}")

            except Exception as e:
                print(f"Error processing {filepath}: {e}")

print(f"\nDONE! Modified {total_files_modified} files with a total of {total_replacements} gradient updates.")
