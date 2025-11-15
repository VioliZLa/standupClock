from pathlib import Path
text = Path("styles.css").read_text(encoding="utf-8")
media_start = text.index('@media (max-width')
minimize_start = text.index('.note-editor-actions .note-minimize')
prefix = text[:media_start]
suffix = text[minimize_start:]
media_block = """@media (max-width: 680px) {\n  .notes-overlay {\n    align-items: stretch;\n    padding: 12px;\n  }\n\n  .note-panel {\n    position: fixed;\n    inset: 12px;\n    width: auto;\n    min-width: 0;\n    height: auto;\n    transform: translate3d(0, 12px, 0);\n  }\n\n  #app.notes-open .content,\n  #app.notes-open .stats {\n    margin-right: 0;\n    filter: blur(1.5px);\n    transform: scale(0.94);\n    pointer-events: none;\n  }\n\n  #app.notes-open .bubble {\n    opacity: 0.15;\n  }\n\n  .note-body {\n    flex-direction: column;\n  }\n\n  .note-list {\n    width: 100%;\n    max-height: 160px;\n    flex: 0 0 auto;\n    flex-direction: row;\n    overflow-x: auto;\n  }\n\n  .note-card {\n    min-width: 160px;\n  }\n}\n\n#app .content,\n#app .stats {\n  transition: margin 0.25s ease, filter 0.25s ease, transform 0.25s ease;\n}\n\n#app.notes-open .content,\n#app.notes-open .stats {\n  margin-right: clamp(240px, 34vw, 360px);\n}\n\n"""
Path("styles.css").write_text(prefix + media_block + suffix, encoding="utf-8")
