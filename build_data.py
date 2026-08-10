#!/usr/bin/env python3
# 把 v2 的 16 语言 JSON 映射成原 promptwisp 架构格式：
#   data/prompts.json      英文母本，字段对齐原架构 {id,title,image,prompt,category,model,ratio,authorUrl,tags}
#   data/translations.json 其余语言按 id 索引 {title,category,description}
import json, os, glob

SRC = "D:/_Personal/AI_PromptWisp/promptwisp-v2/data"
OUT = "D:/_Personal/AI_PromptWisp/promptwisp-v3/data"
os.makedirs(OUT, exist_ok=True)

# 语言文件 -> 显示名（顺序即下拉顺序，en 为首）
LANGS = [
    ("en", "English"),
    ("zh", "简体中文"),
    ("zh-TW", "繁體中文"),
    ("ja", "日本語"),
    ("ko", "한국어"),
    ("th", "ไทย"),
    ("vi", "Tiếng Việt"),
    ("hi", "हिन्दी"),
    ("es", "Español"),
    ("es-419", "Español (Latinoamérica)"),
    ("de", "Deutsch"),
    ("fr", "Français"),
    ("it", "Italiano"),
    ("pt-BR", "Português (Brasil)"),
    ("pt-PT", "Português (Portugal)"),
    ("tr", "Türkçe"),
]

def load(code):
    return json.load(open(os.path.join(SRC, code + ".json"), encoding="utf-8"))

# 英文母本
en = load("en")
prompts = []
for i, p in enumerate(en, start=1):
    imgs = p.get("images") or []
    author_url = p.get("tryUrl") or ""
    if not author_url and isinstance(p.get("details"), list):
        for d in p["details"]:
            if d.get("label") in ("Source", "来源") and d.get("url"):
                author_url = d["url"]
                break
    prompts.append({
        "id": str(i),
        "title": p.get("title", ""),
        "image": imgs[0] if imgs else "",
        "prompt": p.get("prompt", ""),
        "category": p.get("category", ""),
        "model": "Nano Banana Pro",
        "ratio": "",
        "authorUrl": author_url,
        "tags": [],
    })

with open(os.path.join(OUT, "prompts.json"), "w", encoding="utf-8") as f:
    json.dump(prompts, f, ensure_ascii=False, indent=2)

# 翻译：所有语言按 1-based id 索引（en 也在内，补上 description；prompts.json 不含 description 以贴合原架构字段）
translations = {}
for code, _name in LANGS:
    data = load(code)
    tr = {}
    for i, p in enumerate(data, start=1):
        tr[str(i)] = {
            "title": p.get("title", ""),
            "category": p.get("category", ""),
            "description": p.get("description", ""),
        }
    translations[code] = tr

with open(os.path.join(OUT, "translations.json"), "w", encoding="utf-8") as f:
    json.dump(translations, f, ensure_ascii=False, indent=2)

# 元信息：语言列表给前端
meta = {"languages": [{"code": c, "name": n} for c, n in LANGS], "count": len(prompts)}
with open(os.path.join(OUT, "_meta.json"), "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)

print(f"prompts.json: {len(prompts)} 条")
print(f"translations.json: {len(translations)} 语言 ->", list(translations.keys()))
print(f"_meta.json: {len(meta['languages'])} 语言")
