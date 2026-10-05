import os
import base64
import zipfile

def to_base64(filepath, mime):
    if not os.path.exists(filepath):
        return ""
    with open(filepath, "rb") as f:
        data = f.read()
    return f"data:{mime};base64," + base64.b64encode(data).decode("ascii")

logo_b64 = to_base64("assets/logo.png", "image/png")
logo_dark_b64 = to_base64("assets/logo-dark.png", "image/png")
logo_icon_b64 = to_base64("assets/logo-icon.png", "image/png")
favicon_b64 = to_base64("assets/favicon.png", "image/png")
apple_icon_b64 = to_base64("assets/apple-touch-icon.png", "image/png")
creator_b64 = to_base64("assets/creator.jpg", "image/jpeg")

# Read CSS
with open("assets/style.css", "r", encoding="utf-8") as f:
    css = f.read()

# Read JS files
def read_file(p):
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

config_js = read_file("assets/config.js")
# Replace image paths in config_js with base64 data URIs
config_js = config_js.replace("'assets/logo.png'", f"'{logo_b64}'")
config_js = config_js.replace("'assets/logo-dark.png'", f"'{logo_dark_b64}'")
config_js = config_js.replace("'assets/logo-icon.png'", f"'{logo_icon_b64}'")

registry_js = read_file("assets/registry.js")
icons_js = read_file("assets/icons.js")
jszip_js = read_file("assets/vendor/jszip.min.js")
pdflib_js = read_file("assets/vendor/pdf-lib.min.js")
pdfjs_js = read_file("assets/vendor/pdf.min.js")
qrcode_js = read_file("assets/vendor/qrcode.js")

ui_js = read_file("assets/ui.js")
# Replace creator.jpg with base64
ui_js = ui_js.replace("root + 'assets/creator.jpg'", f"'{creator_b64}'")
ui_js = ui_js.replace("'assets/creator.jpg'", f"'{creator_b64}'")

pdf_tools_js = read_file("assets/tools/pdf.js")
image_tools_js = read_file("assets/tools/image.js")
calc_tools_js = read_file("assets/tools/calc.js")
qr_tools_js = read_file("assets/tools/qr.js")
media_tools_js = read_file("assets/tools/media.js")
resume_tools_js = read_file("assets/tools/resume.js")

spa_js = read_file("toolghor-android-app/assets/spa.js")
# Replace logo references in spa_js with base64
spa_js = spa_js.replace("'assets/' + (CFG.logo || 'logo.png').replace(/^assets\\//, '')", "CFG.logo")
spa_js = spa_js.replace("'assets/' + (CFG.logoDark || CFG.logo || 'logo-dark.png').replace(/^assets\\//, '')", "CFG.logoDark")

html_content = f"""<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>ToolGhor – দৈনন্দিন কাজের সব টুল, এখন এক প্ল্যাটফর্মে</title>
<meta name="description" content="দৈনন্দিন কাজের সব টুল, এখন এক প্ল্যাটফর্মে। ২৪টি ফ্রি অনলাইন ও অফলাইন টুল।">
<meta name="theme-color" content="#0e7a5a">
<link rel="icon" type="image/png" href="{favicon_b64}">
<link rel="apple-touch-icon" href="{apple_icon_b64}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@500;700;800&family=Hind+Siliguri:wght@400;500;600&display=swap">
<style>
{css}

/* In-App SPA Enhancements */
.spa-tool-top-bar {{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--line);
}}
.btn-tool-back {{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: color-mix(in srgb, var(--paddy) 10%, var(--paper));
  border: 1.5px solid var(--paddy);
  color: var(--paddy-d);
  font-weight: 700;
  font-size: 14.5px;
  border-radius: 999px;
  padding: 7px 18px 7px 14px;
  cursor: pointer;
  transition: all .2s ease;
  user-select: none;
  min-height: 40px;
}}
.btn-tool-back:hover {{
  background: var(--paddy);
  color: #fff;
  transform: translateX(-2px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--paddy) 30%, transparent);
}}
.btn-tool-back:active {{
  transform: translateX(0);
}}
.btn-tool-back-arrow {{
  font-size: 16px;
  line-height: 1;
}}
.tool-title {{
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 800;
  border-top: 4px solid var(--cat, var(--paddy));
  padding-top: 12px;
  margin: 8px 0 6px;
}}
#tool-view {{
  animation: spaFadeIn .22s ease-out;
}}
#home-view {{
  animation: spaFadeIn .22s ease-out;
}}
@keyframes spaFadeIn {{
  from {{ opacity: 0; transform: translateY(6px); }}
  to {{ opacity: 1; transform: translateY(0); }}
}}
</style>
</head>
<body data-root="" data-home="1">

<!-- Sticky Global Header -->
<header class="top"><div class="wrap top-in">
<a class="brand" href="#" onclick="location.hash=''; return false;" aria-label="ToolGhor">
  <picture>
    <source data-cfg="logoDark" srcset="{logo_dark_b64}" media="(prefers-color-scheme: dark)">
    <img class="brand-logo" data-cfg="logo" src="{logo_b64}" alt="ToolGhor" height="48">
  </picture>
</a>

<div class="top-actions" style="margin-inline-start:auto">
  <button type="button" class="btn-top-about" id="btn-top-about" aria-label="About ToolGhor" title="ToolGhor সম্পর্কে">
    <span class="btn-about-ic" aria-hidden="true">ℹ️</span>
    <span>আমাদের সম্পর্কে</span>
  </button>
  <div class="lang" role="group" aria-label="ভাষা">
    <span class="lang-ic" aria-hidden="true">🌐</span>
    <a href="#lang-en" id="lang-btn-en" lang="en">EN</a>
    <a href="#lang-bn" id="lang-btn-bn" class="on" lang="bn">বাংলা</a>
  </div>
  <button type="button" class="btn-api-connect" id="btn-ai-keys" aria-label="API কি কানেক্ট করুন" title="টুলসগুলোর আরও উন্নত ফলাফলের জন্য API কি কানেক্ট করুন">
    <span class="ic" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg></span>
    <span>API কী</span>
    <span class="api-dot" hidden></span>
  </button>
  <button type="button" class="btn-request-tool" id="btn-request-tool" aria-label="টুলের অনুরোধ" title="নতুন টুলের অনুরোধ বা আইডিয়া পাঠান">
    <span class="btn-req-icon" aria-hidden="true">🛠️</span>
    <span>টুলের অনুরোধ</span>
  </button>
</div>
</div></header>

<!-- ==================== 1. HOME VIEW ==================== -->
<div id="home-view">
  <section class="hero"><div class="wrap hero-wrap">
    <h1 class="hero-tag" id="hero-tagline" data-cfg="tagline">দৈনন্দিন কাজের সব টুল, এখন এক প্ল্যাটফর্মে</h1>
    <div class="search big" id="search-wrap" role="search">
      <div class="search-box">
        <span class="ic" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34" /> <circle cx="11" cy="11" r="8" /></svg></span>
        <input type="search" id="q" placeholder="কোন টুল খুঁজছেন? যেমন: পিডিএফ, ছবি, কিউআর, বয়স…" autocomplete="off" aria-label="টুল খুঁজুন" aria-controls="sugg">
      </div>
      <ul class="sugg" id="sugg" hidden></ul>
    </div>
    <nav class="chips" id="cat-chips" aria-label="ক্যাটাগরি">
      <a class="chip chip-all" href="#all" data-cat="all"><span class="chip-sym">✨</span>সবগুলো (Expand All)</a>
      <a class="chip cat-documents" href="#cat-documents" data-cat="documents"><span class="chip-sym">📄</span>ডকুমেন্ট টুলস</a>
      <a class="chip cat-images" href="#cat-images" data-cat="images"><span class="chip-sym">🖼️</span>ছবি ও ফটো</a>
      <a class="chip cat-calculators" href="#cat-calculators" data-cat="calculators"><span class="chip-sym">🧮</span>ক্যালকুলেটর</a>
      <a class="chip cat-qr" href="#cat-qr" data-cat="qr"><span class="chip-sym">🏁</span>কিউআর কোড</a>
      <a class="chip cat-media" href="#cat-media" data-cat="media"><span class="chip-sym">🎬</span>ভিডিও ও অডিও</a>
      <a class="chip cat-resume" href="#cat-resume" data-cat="resume"><span class="chip-sym">💼</span>রেজিউমে বিল্ডার</a>
    </nav>
  </div></section>

  <main class="wrap cats" id="main">
    <div class="all-expand-bar" id="allExpandBar">
      <div class="all-expand-info">
        <span class="all-expand-sym" aria-hidden="true">📂</span>
        <span class="all-expand-text" id="all-expand-count">ক্যাটাগরি (৬টি ক্যাটাগরি, ২৪টি টুল)</span>
      </div>
      <button type="button" class="btn-all-toggle" id="btnAllToggle" aria-expanded="false">
        <span class="all-toggle-ic" aria-hidden="true">↕️</span>
        <span class="all-toggle-text" id="all-toggle-label">সবগুলো খুলুন</span>
      </button>
    </div>

    <!-- Category sections container (dynamically rendered from registry) -->
    <div id="cats-container"></div>

    <p class="empty" id="emptyMsg" hidden>কোনো টুল পাওয়া যায়নি। অন্য শব্দে চেষ্টা করুন।</p>
  </main>
</div>

<!-- ==================== 2. TOOL VIEW ==================== -->
<div id="tool-view" hidden>
  <main class="wrap tool-page" id="tool-page-container">
    <div class="spa-tool-top-bar">
      <button type="button" class="btn-tool-back" id="btn-tool-back">
        <span class="btn-tool-back-arrow" aria-hidden="true">←</span>
        <span id="btn-back-text">সবগুলো টুল</span>
      </button>
      <nav class="crumb" id="tool-crumb" aria-label="Breadcrumb"></nav>
    </div>

    <h1 id="tool-title" class="tool-title"></h1>
    <p class="lead" id="tool-lead"></p>
    <p class="trust" id="tool-trust">
      <span class="ic" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /> <path d="m9 12 2 2 4-4" /></svg></span>
      <span id="tool-trust-text">আপনার ফাইল বা তথ্য কোথাও আপলোড হয় না। সম্পূর্ণ প্রসেসিং সরাসরি আপনার ডিভাইসে সম্পন্ন হয়।</span>
    </p>

    <!-- Tool Root Container -->
    <section class="panel" id="tool-root" aria-live="polite">
      <p class="lead">Loading…</p>
    </section>

    <!-- How to use -->
    <section class="how" id="tool-how-section">
      <h2 id="how-to-title">কীভাবে ব্যবহার করবেন</h2>
      <ol id="tool-steps-list"></ol>
    </section>

    <!-- Related tools -->
    <section class="related" id="tool-related-section">
      <h2 id="related-tools-title">আরও প্রয়োজনীয় টুলস</h2>
      <div class="grid" id="tool-related-grid"></div>
    </section>
  </main>
</div>

<!-- Footer -->
<footer class="foot">
  <div class="wrap">© 2026 <span data-cfg="name">ToolGhor</span>. Your files and data are processed locally in your browser.</div>
</footer>

<!-- Floating WhatsApp Action Button -->
<a href="https://wa.me/8801521417284?text=Hello%20ToolGhor" target="_blank" rel="noopener" class="fab" aria-label="WhatsApp" title="WhatsApp Support">
  <span class="ic" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.183 8.183 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24h.01zm-3.52 4.63c-.19 0-.5.07-.76.35-.26.29-1 1-1 2.44s1.02 2.83 1.16 3.02c.15.19 2.01 3.07 4.87 4.31.68.29 1.21.47 1.63.6.69.22 1.31.19 1.8.12.55-.08 1.69-.69 1.93-1.36.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.33s-1.69-.83-1.95-.93c-.26-.09-.45-.14-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.22-.62.07-.29-.14-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.44.13-.58.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.09-.19.05-.36-.02-.5-.07-.14-.64-1.54-.87-2.11-.23-.56-.47-.48-.64-.49-.17-.01-.36-.01-.56-.01z"/></svg></span>
</a>

<!-- ==================== ALL JAVASCRIPT & LIBRARIES INLINED ==================== -->
<script>
{config_js}
</script>
<script>
{registry_js}
</script>
<script>
{icons_js}
</script>
<script>
{jszip_js}
</script>
<script>
{pdflib_js}
</script>
<script>
{pdfjs_js}
</script>
<script>
{qrcode_js}
</script>
<script>
{ui_js}
</script>
<script>
{pdf_tools_js}
</script>
<script>
{image_tools_js}
</script>
<script>
{calc_tools_js}
</script>
<script>
{qr_tools_js}
</script>
<script>
{media_tools_js}
</script>
<script>
{resume_tools_js}
</script>
<script>
{spa_js}
</script>

</body>
</html>
"""

# Write to toolghor-standalone-app/index.html
os.makedirs("toolghor-standalone-app", exist_ok=True)
with open("toolghor-standalone-app/index.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Generated toolghor-standalone-app/index.html - Size: {len(html_content)} bytes")

# Also copy to toolghor-android-app/index.html so both standard and standalone work
with open("toolghor-android-app/index.html", "w", encoding="utf-8") as f:
    f.write(html_content)

# Create ZIP with ONLY index.html
zip_path = "toolghor-single-index.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    z.write("toolghor-standalone-app/index.html", "index.html")

print(f"Created {zip_path} - Size: {os.path.getsize(zip_path)} bytes")

# Also update toolghor-android-app.zip
with zipfile.ZipFile("toolghor-android-app.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk("toolghor-android-app"):
        for file in files:
            full_p = os.path.join(root, file)
            arc_p = os.path.relpath(full_p, "toolghor-android-app")
            z.write(full_p, arc_p)

print(f"Updated toolghor-android-app.zip - Size: {os.path.getsize('toolghor-android-app.zip')} bytes")
