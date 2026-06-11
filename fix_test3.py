import sys
sys.stdout.reconfigure(encoding="utf-8")
content = open("src/tests/unit/auto-assign.test.ts", "r", encoding="utf-8").read()
# Fix assertion to check for Vietnamese text instead of English
content = content.replace(
    "expect(result.message).toContain('published')",
    "expect(result.message).toContain('xuat ban')"
)
content = content.replace(
    "expect(result.message).toContain('xuất bản')",
    "expect(result.message).toContain('xuat ban')"
)
with open("src/tests/unit/auto-assign.test.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
