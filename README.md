# ToolGhor (টুলঘর) 🛠️

**ToolGhor** is a privacy-first, ultra-fast online utility platform powered by **Next.js 16 (App Router)** and **Tailwind CSS**. It provides **28+ everyday tools** across 6 categories with 100% in-browser processing, multi-language support (Bangla & English), and an integrated **Admin Console**.

---

## ✨ Features

- ⚡ **Next.js 16 App Router & Turbopack:** Blazing fast performance with SSR and SSG.
- 🔒 **100% In-Browser Privacy:** All document, image, and calculation operations run in the user's browser without uploading files to third-party servers.
- 🌐 **Dual Language Support:** Full support for both Bangla (বাংলা) and English.
- 📄 **28+ Powerful Tools:**
  - **Document Tools:** Merge PDF, Split PDF, Compress PDF, PDF to Image, PDF to Word (DOCX), Word to PDF, JPG to PDF.
  - **Image Tools:** Compress Image, Resize, Crop, Merge, Format Conversion, Passport Photo Maker, Background Remover.
  - **Calculators:** Live Currency Converter, BMI Calculator, Unit Converter, Percentage, Age, Time Zone Converter.
  - **QR Tools:** QR Code Generator, QR Code Decoder / Scanner.
  - **Media Tools:** YouTube HD Downloader (MP4/MP3), Audio Extractor, Social Video Cropper.
  - **Resume Builder:** Professional Resume Builder, CV Templates.
- 🛡️ **Interactive Admin Console (`/admin`):**
  - Tool Status Manager (enable/disable tools on the fly).
  - API Keys & Proxy Configuration (ConvertAPI, Gemini AI, remove.bg).
  - Global Announcement Banner manager.
  - System performance & runtime diagnostics.

---

## 🚀 Getting Started

First, install the dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the website.

To access the **Admin Console**, visit [http://localhost:3000/admin](http://localhost:3000/admin) (Default passcode: `admin123`).

---

## 🏗️ Project Architecture

```
ToolGhor/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Modern Homepage with search & category filters
│   │   ├── layout.tsx             # Root layout with fonts & global CSS
│   │   ├── admin/page.tsx         # Comprehensive Admin Console
│   │   ├── tools/[slug]/page.tsx  # Dynamic tool page route
│   │   └── api/                   # Serverless API routes (ConvertAPI, YouTube)
│   ├── components/                # Modular React components (Header, Footer, ToolCard, ToolRunner)
│   ├── context/                   # AppContext (Language, Search, Active Category)
│   └── data/                      # Tool registry and site configuration
├── public/
│   └── assets/                    # Optimized logos, icons, and vendor libraries
└── backup/                        # Preserved legacy static files & android templates
```

---

## 📦 Deployment

The project is fully optimized for **Vercel**, **Netlify**, or standard Node.js server deployment:

```bash
npm run build
npm start
```

---

## 👨‍💻 Creator

Developed with passion by **[Ashifur Rahman Badhon](https://github.com/ashifurrahmanbadhon)**.
