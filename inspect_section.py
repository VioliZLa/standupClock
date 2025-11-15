from pathlib import Path
text = Path("styles.css").read_text(encoding="utf-8")
start = text.index('#app') - 10
end = start + 120
print(repr(text[start:end]))
