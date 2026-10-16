# Mobile Audit Checklist (375px & 390px Viewports)

**Audit Date**: 2026-10-16  
**Target Environment**: `https://toolghor.vercel.app` (Live Production)  
**Emulated Devices**: iPhone SE (375x667px) & iPhone 12/13/14 (390x844px)  
**Methodology**: Automated Chrome DevTools Protocol (CDP) + Device Metrics Override + Bounding Box Collision & Overflow Evaluation

---

## 1. Summary of Audit Findings

| Audit Criteria | Status | Notes |
| :--- | :---: | :--- |
| **Horizontal Scroll / Overflow** | ✅ **PASSED** (0/30) | All 28+ pages have `scrollWidth === clientWidth` (375px & 390px). No horizontal scrollbar. |
| **Element / Text Overlap** | ✅ **PASSED** | Flex containers and CSS grid columns collapse to `1fr` below 760px/980px. |
| **Workspace End-to-End Usability** | ✅ **PASSED** | Tools mount correctly in `#tool-root`, inputs accept touch typing, calculations work. |
| **Header, Lang Toggle & Footer** | ✅ **PASSED** | Top navigation wraps cleanly at 768px; language toggle and footer social render without breakage. |
| **Touch Target Accessibility (< 44px)** | ⚠️ **MINOR ISSUE** | Header buttons (`.btn-top-about`, `.btn-api-connect`, `.btn-request-tool`, `.lang a/button`, `.pill`) have height ~28–32px on mobile screens (< 44px WCAG touch target). |

---

## 2. Per-Page Audit Checklist

- [x] **1. Homepage (`/`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`, `overflowExcess: 0px`).
  - **Overlaps / Cut-offs**: None. Hero search, categories bar, and tool card grid collapse responsively.
  - **Touch Targets**: Header action buttons (`About`, `API Keys`, `Request a Tool`, `Admin`) and language toggle are 28–32px tall (< 44px).
  - **Screenshot Description**: Homepage at 375px shows centered ToolGhor logo, search bar filling 100% width, category chips wrapping horizontally with snap scrolling, and 1-column tool cards with comfortable margins.

- [x] **2. Tool: merge-pdf (`/tools/merge-pdf`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: File dropzone renders at ~329px width. File picker trigger works.
  - **Touch Targets**: Action buttons inside workspace meet touch target; header buttons are ~32px.
  - **Screenshot Description**: Top breadcrumbs wrap cleanly, trust note box spans full container width, file upload dropzone adapts to 329px without clipping.

- [x] **3. Tool: split-pdf (`/tools/split-pdf`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: File dropzone and range inputs stack vertically without horizontal overflow.
  - **Screenshot Description**: Clean vertical stacking of dropzone, split options segment, and page range fields.

- [x] **4. Tool: compress-pdf (`/tools/compress-pdf`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Compression mode radio buttons and slider controls fit within viewport.
  - **Screenshot Description**: Single-column layout with slider control and compression level badges.

- [x] **5. Tool: pdf-to-image (`/tools/pdf-to-image`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Image format selector (JPG/PNG) and DPI controls fit mobile screen.
  - **Screenshot Description**: Dropzone and resolution options stack cleanly with zero side-overflow.

- [x] **6. Tool: pdf-to-doc (`/tools/pdf-to-doc`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Document conversion engine dropzone and start conversion button are fully tappable.
  - **Screenshot Description**: Centered upload box with clear file size indicator.

- [x] **7. Tool: word-to-pdf (`/tools/word-to-pdf`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: File selection and server proxy submission trigger properly.
  - **Screenshot Description**: Clean conversion workspace with privacy indicator below the header.

- [x] **8. Tool: jpg-to-pdf (`/tools/jpg-to-pdf`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Multi-image thumbnail list wraps responsively without clipping.
  - **Screenshot Description**: Image list grid adapts to 2-column or 1-column layout on 375px.

- [x] **9. Tool: compress-image (`/tools/compress-image`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Tested end-to-end; dropzone width is 329px; quality slider is touch-draggable.
  - **Screenshot Description**: Dropzone, percentage reduction slider, and output size badge stacked neatly.

- [x] **10. Tool: resize-image (`/tools/resize-image`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Width and Height numeric input fields stack or flex-wrap without overflowing.
  - **Screenshot Description**: Dimension input rows collapse gracefully on screens under 560px.

- [x] **11. Tool: crop-image (`/tools/crop-image`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Aspect ratio pill buttons wrap horizontally; image canvas scales with `max-width: 100%`.
  - **Screenshot Description**: Responsive canvas container with aspect ratio presets (Free, 1:1, 16:9, 4:3) accessible.

- [x] **12. Tool: merge-image (`/tools/merge-image`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Vertical/Horizontal merge direction toggle and preview adapt to 375px.
  - **Screenshot Description**: Direction segment controls and preview pane stacked vertically.

- [x] **13. Tool: convert-image (`/tools/convert-image`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Output format selector (WEBP, PNG, JPG, AVIF) wraps within viewport.
  - **Screenshot Description**: Format pills aligned in 2 rows on 375px, easily selectable.

- [x] **14. Tool: passport-photo (`/tools/passport-photo`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Country preset dropdown (Bangladesh, USA, Schengen, India, etc.) and print grid preview fit mobile.
  - **Screenshot Description**: Country selector full width, photo crop frame centered, preview grid scaled to container width.

- [x] **15. Tool: remove-background (`/tools/remove-background`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Single image upload and before/after comparison view adapt to mobile.
  - **Screenshot Description**: Upload box with background removal trigger and download button.

- [x] **16. Tool: currency-converter (`/tools/currency-converter`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Base amount input, currency selectors, and swap button stack cleanly without side-overflow.
  - **Screenshot Description**: From/To currency dropdowns stacked with centered swap icon, rate card displayed below.

- [x] **17. Tool: bmi-calculator (`/tools/bmi-calculator`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Tested end-to-end: inputting 70kg and 175cm computes BMI 22.9 with normal weight badge.
  - **Screenshot Description**: Unit toggles (kg/lb, cm/ft-in), input fields, and BMI meter bar rendering smoothly within 375px.

- [x] **18. Tool: unit-converter (`/tools/unit-converter`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Unit category tabs (Length, Weight, Temp, Area, Volume, Speed) wrap cleanly.
  - **Screenshot Description**: Category selector pills wrapping across rows, dual input fields with responsive typography.

- [x] **19. Tool: percentage-calculator (`/tools/percentage-calculator`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: 4 distinct percentage scenario cards stack vertically with clean input padding.
  - **Screenshot Description**: Each scenario card occupies full mobile width with inline inputs and calculated result pills.

- [x] **20. Tool: age-calculator (`/tools/age-calculator`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Date of birth picker and current date picker fit without horizontal scroll.
  - **Screenshot Description**: Date inputs stacked vertically, detailed age breakdown (years, months, days, hours) cleanly carded.

- [x] **21. Tool: time-zone-converter (`/tools/time-zone-converter`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: City search input, base time picker, and target city cards stack cleanly.
  - **Screenshot Description**: Base city selector on top with time picker, converted time cards below with time difference badges.

- [x] **22. Tool: qr-generator (`/tools/qr-generator`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Tested end-to-end: typing URL and clicking generate renders canvas inside 375px viewport.
  - **Screenshot Description**: Textarea/input field with color pickers and size controls, generated QR code centered with download buttons.

- [x] **23. Tool: qr-decoder (`/tools/qr-decoder`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Image upload dropzone and decoded result text box adapt to mobile width.
  - **Screenshot Description**: QR upload area followed by decoded content card with copy-to-clipboard button.

- [x] **24. Tool: video-downloader (`/tools/video-downloader`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: URL input field and Fetch/Download button wrap properly.
  - **Screenshot Description**: Full-width URL input bar with prominent download button and format options.

- [x] **25. Tool: audio-extractor (`/tools/audio-extractor`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Video upload area and audio format options (MP3/WAV/AAC) fit within mobile width.
  - **Screenshot Description**: Video dropzone on top, audio bitrate and format toggles below with extract button.

- [x] **26. Tool: social-video-cropper (`/tools/social-video-cropper`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Aspect ratio pills (9:16 Story/Reel, 1:1 Feed, 16:9 Landscape) wrap on mobile.
  - **Screenshot Description**: Social platform presets wrapped neatly with responsive video canvas container.

- [x] **27. Tool: resume-builder (`/tools/resume-builder`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Tested end-to-end: `.rb` 2-column layout collapses to single column (`rbWidth: 329px`); preview pane adapts to `329px` without overflow.
  - **Screenshot Description**: Form tabs (Personal, Experience, Education, Skills) across the top, active section form below, and live A4 preview scaled to container width at the bottom.

- [x] **28. Tool: cv-templates (`/tools/cv-templates`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Template cards stack in a 1-column layout on 375px/390px with download Word/PDF actions.
  - **Screenshot Description**: Vertical card stream of CV templates with preview thumbnails and download buttons.

- [x] **29. Admin Login & Dashboard (`/admin`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: Admin passcode input, unlock button, forgot password link, and dashboard sections fit within mobile viewport.
  - **Screenshot Description**: Admin card centered with full-width passcode input and secure login button.

- [x] **30. Forgot Password (`/forgot-password`)**
  - **Horizontal Overflow (375px / 390px)**: None (`scrollWidth: 375px / 390px`).
  - **Workspace Usability**: 3-step recovery flow (Email input -> OTP 6-digit boxes -> New Password inputs) fits cleanly.
  - **Screenshot Description**: Centered card with email input, back-to-login button, and OTP code entry elements.

---

## 3. Minimal Issues Identified for Phase 2 Fixing

1. **Header Touch Targets on Mobile (< 600px)**:
   - Header top buttons (`.btn-top-about`, `.btn-api-connect`, `.btn-request-tool`, `.pill`) have height ~32px, below the recommended 44px touch target.
   - Language selector buttons (`.lang a`, `.lang button`, `.lang span`) have height ~28px.
   - **Recommended Minimal Fix**: Inside existing `@media (max-width: 600px)` or `@media (max-width: 768px)`, set `min-height: 40px` and slightly increase vertical touch padding on `.lang`, `.lang a`, `.lang button`, and `.btn-api-connect`, `.btn-top-about`, `.btn-request-tool`. Zero changes on desktop.

2. **Tool Loading Speed ("Preparing tool workspace...")**:
   - In `ToolRunner.tsx`, core scripts + vendor scripts + tool group scripts were loading sequentially in 3 separate `await` phases instead of parallel `Promise.all`.
   - Initial `loading` state was unconditionally `true` even when `Tools[tool.slug]` was already loaded.
   - Background prefetching of tool group scripts (`calc.js`, `image.js`, `pdf.js`, `qr.js`, `media.js`, `resume.js`) on idle ensures instant clicks without waiting.

3. **Admin Panel & Website Sync**:
   - `next.config.ts` had a 5-minute CDN cache rule (`public, s-maxage=60, stale-while-revalidate=300`) on `/api/public/data`.
   - `clearSiteDataCache()` was not being called in all database write paths.
   - Invalidate cache instantly on admin updates so changes reflect immediately on the site.

4. **Git Repository Hygiene**:
   - Remove unused Next.js boilerplate SVGs (`public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`).
   - Clean up scratch test scripts (`scripts/mobile_audit.mjs`, `scripts/test_interactive_mobile.mjs`, `mobile_audit_raw.json`).
