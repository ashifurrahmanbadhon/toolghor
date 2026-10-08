# ToolGhor Android App Package (All-in-One SPA Bundle)

এই ফোল্ডারটিতে **ToolGhor** এর সম্পূর্ণ ওয়েবসাইটটি একটি সিঙ্গেল-পেজ অ্যাপ (SPA) হিসেবে প্রস্তুত করা হয়েছে, যা যেকোনো অ্যান্ড্রয়েড অ্যাপ বিল্ডারে সরাসরি ইমপোর্ট করে এক ক্লিকে **Android APK** তৈরি করা যায়।

---

## 🌟 এই প্যাকেজের সুবিধাসমূহ (Key Features):

1. **সিঙ্গেল ফাইল আর্কিটেকচার (`index.html`):**
   - কোনো পেজ রিলোড বা সাবফোল্ডার নেভিগেশন এরর ছাড়া অ্যাপের ভেতরেই ২৪টি টুল স্মুথলি চালু হয়।
   - প্রতিটি টুলে রয়েছে স্পষ্ট `← সবগুলো টুল` (Back to Tools) বাটন এবং অ্যান্ড্রয়েডের ফিজিক্যাল ব্যাক বাটন চেপে সহজে হোম ভিউতে ফেরা যায়।
2. **অফলাইন ফ্রেন্ডলি (Offline Ready):**
   - `pdf-lib`, `pdfjs`, `jszip`, `qrcode` সহ সব মূল লাইব্রেরি লোকাল `assets/vendor` ফোল্ডারে যুক্ত থাকায় ইন্টারনেট ছাড়াও প্রয়োজনীয় ডকুমেন্ট ও ক্যালকুলেশন টুলস কাজ করে।
3. **দ্বিভাষিক (বাংলা ও ইংরেজি):**
   - অ্যাপের ভেতরেই 'EN' বা 'বাংলা' বাটনে ট্যাপ করলে তাৎক্ষণিক সম্পূর্ণ অ্যাপের ভাষা পরিবর্তন হয়ে যায়।

---

## 📱 কীভাবে এটি দিয়ে Android APK বানাবেন?

### পদ্ধতি ১: Website 2 APK Builder দিয়ে (সবচেয়ে সহজ)
1. **Website 2 APK Builder** সফটওয়্যারটি কম্পিউটারে ওপেন করুন।
2. "Select Website Type" এ **"Local HTML Website"** সিলেক্ট করুন।
3. "Directory of Local Website" এ এই আনজিপ করা ফোল্ডারটি সিলেক্ট করুন (যেখানে `index.html` ফাইলটি আছে)।
4. অ্যাপের নাম দিন: `ToolGhor`
5. প্যাকেজ নেম দিন: `com.toolghor.app`
6. অ্যাপ আইকন হিসেবে `assets/logo-icon.png` বা `assets/favicon.png` দিন।
7. **"GENERATE APK"** বাটনে ক্লিক করুন। কয়েক সেকেন্ডেই আপনার ইনস্টলেবল `.apk` ফাইল তৈরি হয়ে যাবে!

---

### পদ্ধতি ২: Android Studio দিয়ে (Native WebView)
1. Android Studio-তে একটি নতুন **Empty Views Activity** প্রজেক্ট খুলুন।
2. `app/src/main/` এর ভেতরে `assets` নামে একটি ফোল্ডার তৈরি করুন।
3. এই জিপ ফাইলের ভেতরের `index.html` এবং `assets/` ফোল্ডারটিকে সরাসরি `app/src/main/assets/` এর ভেতর পেস্ট করুন।
4. `MainActivity.java` বা `.kt` ফাইলে WebView লোড করুন:
   ```java
   WebView webView = findViewById(R.id.webView);
   webView.getSettings().setJavaScriptEnabled(true);
   webView.getSettings().setDomStorageEnabled(true);
   webView.getSettings().setAllowFileAccess(true);
   webView.loadUrl("file:///android_asset/index.html");
   ```
5. `AndroidManifest.xml`-এ ক্যামেরা ও স্টোরেজ পারমিশন যুক্ত করে **Build APK** করুন।

---

### পদ্ধতি ৩: Kodular / App Inventor / Thunkable দিয়ে
1. Kodular-এ নতুন প্রজেক্ট তৈরি করুন।
2. স্ক্রিনে একটি `WebViewer` কম্পোনেন্ট নিন।
3. Assets ম্যানেজারে এই জিপের সব ফাইল আপলোড করুন।
4. WebViewer এর `HomeUrl` দিন: `index.html` (অথবা ফাইল আপলোড পাথ)।
5. এক্সপোর্ট করে APK ডাউনলোড করুন।

---

© 2026 ToolGhor. Developed for seamless Android App wrapping.
