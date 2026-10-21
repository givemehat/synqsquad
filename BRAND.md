# Brand & Android Package ID Reference (Round 6)

> [!WARNING]
> **CRITICAL PLAY STORE POLICY NOTICE**:
> The Android **applicationId / Package Name** (`com.rivq.app` vs `com.synqsquad.app`) is **PERMANENT** once your first APK/AAB is uploaded to Google Play Console. Google Play associates licenses, ratings, statistics, and certificates irreversibly with this ID. It **CANNOT** be changed later without creating a completely new app entry and losing all users.
>
> Decide your final brand and package ID BEFORE creating the app entry in Play Console or uploading the first bundle.

---

## 1. Current Configuration Values

| Key | Current Value in Repository | Configuration Location |
|---|---|---|
| **Product Brand Name** | `RIVQ` | `src/config/brand.ts` (`BRAND_CONFIG.name`) |
| **Short Name** | `RIVQ` | `src/config/brand.ts` (`BRAND_CONFIG.shortName`) |
| **Android Package Name (applicationId)** | `com.rivq.app` | `src/config/brand.ts`, `android/app/build.gradle` |
| **Production Domain** | `synqsquad.vercel.app` | `src/config/brand.ts`, `src/app/robots.ts`, `src/app/sitemap.ts` |
| **Support & Grievance Email** | `rajnishsingh.work@gmail.com` | `src/config/brand.ts`, `store/play_console_form_answers.md` |
| **Legacy / Transition References** | `synqsquad` | Kept for backwards-compatible `localStorage` migration & Vercel domain |

---

## 2. Occurrence Breakdown by File and Purpose

| Category | File Path | Current Brand Reference | Purpose |
|---|---|---|---|
| **Central Config** | `src/config/brand.ts` | `RIVQ`, `com.rivq.app`, `synqsquad.vercel.app` | Single source of truth for web app metadata & copy |
| **Web App Manifest** | `public/manifest.json` | `RIVQ — Match & Connect on Gmail` | PWA installation descriptor |
| **Web App Manifest** | `src/app/manifest.ts` | `RIVQ — Match & Connect on Gmail` | Next.js dynamic manifest |
| **Asset Links** | `public/.well-known/assetlinks.json` | `com.rivq.app` | Digital Asset Links for full-screen TWA verification |
| **Asset Links Route** | `src/app/.well-known/assetlinks.json/route.ts` | `com.rivq.app` | Server-rendered Assetlinks API endpoint |
| **Android Build** | `android/app/build.gradle` | `applicationId "com.rivq.app"` | Android package ID definition |
| **Android Manifest** | `android/app/src/main/AndroidManifest.xml` | `package="com.rivq.app"`, `@string/app_name` | Android App Manifest |
| **Android Strings** | `android/app/src/main/res/values/strings.xml` | `app_name: "RIVQ"`, `host_name: "synqsquad.vercel.app"` | Android string resources |
| **Android Themes** | `android/app/src/main/res/values/styles.xml` | `Theme.RIVQ` | Android launch theme |
| **Android Settings** | `android/settings.gradle` | `rootProject.name = "RIVQ"` | Gradle root project name |
| **Play Store Copy** | `store/listing_metadata.txt` | `RIVQ` | Play Store listing title, short description, full description |
| **Play Store Answers** | `store/play_console_form_answers.md` | `RIVQ`, `com.rivq.app` | Data Safety & IARC declaration answers |
| **Root Package** | `package.json` | `"name": "rivq"` | npm project package name |
| **Root Metadata** | `src/app/layout.tsx` | `title: "RIVQ"`, `openGraph`, `twitter` | Root SEO metadata & OpenGraph tags |
| **Security Contact** | `public/.well-known/security.txt` | `rajnishsingh.work@gmail.com`, `synqsquad.vercel.app` | RFC 9116 security contact |
| **Client Auth Context** | `src/context/AuthContext.tsx` | Dual read: `rivq_user` & fallback to legacy `synqsquad_user` | Client authentication persistence |
| **Legal Pages** | `src/app/privacy/page.tsx`, `terms`, etc. | `RIVQ` | Privacy Policy, Terms, Guidelines, Disclaimers |
| **Offline Fallback** | `src/app/offline/page.tsx` | `RIVQ requires an active internet connection...` | PWA offline screen |

---

## 3. How to Execute a 1-Line Brand Rename

1. **For Web**:
   Update `src/config/brand.ts`. All components and metadata importing from `BRAND_CONFIG` will immediately update.
2. **For Android** (MUST BE DONE BEFORE FIRST PLAY CONSOLE UPLOAD):
   If changing to another name or reverting to `com.synqsquad.app`:
   - Update `applicationId` in `android/app/build.gradle`
   - Update `app_name` in `android/app/src/main/res/values/strings.xml`
   - Update `package_name` in `public/.well-known/assetlinks.json`
   - Rebuild AAB via `./gradlew bundleRelease`
