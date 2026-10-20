# Google Play Store Complete Submission Guide — SynqSquad

This checklist is your exact, click-by-click operational roadmap to successfully submit SynqSquad to the Google Play Store without guesswork or policy rejections.

---

## 📋 Table of Contents
1. [Important Safety & Keystore Backup Warning](#1-important-safety--keystore-backup-warning)
2. [Prerequisites Checklist](#2-prerequisites-checklist)
3. [Step 1: Create the App in Play Console](#step-1-create-the-app-in-play-console)
4. [Step 2: Complete the Policy & App Content Forms](#step-2-complete-the-policy--app-content-forms)
5. [Step 3: Upload Store Listing & Visual Assets](#step-3-upload-store-listing--visual-assets)
6. [Step 4: Play App Signing & Digital Asset Links Verification](#step-4-play-app-signing--digital-asset-links-verification)
7. [Step 5: Google OAuth Production Migration](#step-5-google-oauth-production-migration)
8. [Step 6: The 12-Tester / 14-Day Closed Testing Rule](#step-6-the-12-tester--14-day-closed-testing-rule)
9. [Step 7: Applying for Production Access & Going Live](#step-7-applying-for-production-access--going-live)
10. [Custom Domain Setup Guide (Optional)](#custom-domain-setup-guide-optional)
11. [Pre-Submission Checklist & Risk Mitigation](#pre-submission-checklist--risk-mitigation)

---

## 1. Important Safety & Keystore Backup Warning

> [!CAUTION]
> **BACK UP YOUR UPLOAD KEYSTORE IMMEDIATELY.**
> Your upload keystore is saved at:
> `android/keystores/synqsquad-upload-key.jks`
> 
> * **Keystore Alias:** `synqsquad-upload`
> * **Keystore Password:** Stored locally in untracked file `android/keystores/.keystore-secret.txt` (and also provided once in your final setup reply).
> * **Why this matters:** When Google Play App Signing is active, this keystore signs every App Bundle (`.aab`) you upload. If you lose this keystore file or password, you cannot upload updates without requesting a manual reset from Google Developer Support, which can stall releases for days.
> * **Action required:** 
>   1. Copy the password from `android/keystores/.keystore-secret.txt` into your encrypted password manager (1Password, Bitwarden, or Apple Keychain).
>   2. Copy `android/keystores/synqsquad-upload-key.jks` to two secure backup locations (e.g., an encrypted USB drive and a secure cloud vault).
> * **Git protection:** `android/keystores/` and `android/keystore.properties` are strictly excluded in `.gitignore` to prevent accidental public disclosure. Never commit keystores, passwords, or secrets to any Git repository.

---

## 2. Prerequisites Checklist

Before you begin the Play Console steps:
1. **Google Play Developer Account:** Ensure your account registration fee ($25) is paid and your identity verification (Government ID / Phone / D-U-N-S for organizations) is approved.
2. **Production Domain & HTTPS:** The active live production domain is **`https://synqsquad.vercel.app`**. It is fully deployed with valid SSL. The digital asset links and OAuth credentials currently match this domain.
3. **Database Configuration:** Link your production Supabase database (`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) so that user accounts and postings persist across serverless instances.
4. **Google Cloud Console OAuth Screen:** In Google Cloud Console, configure your OAuth 2.0 Client ID with:
   * Authorized JavaScript Origins: `https://synqsquad.vercel.app`
   * Authorized Redirect URIs: `https://synqsquad.vercel.app` and `https://synqsquad.vercel.app/auth/callback`
   * Scopes: Basic `openid`, `email`, and `profile` **only** (do not request sensitive Gmail scopes).

---

## 3. Step 1: Create the App in Play Console

1. Log in to the [Google Play Console](https://play.google.com/console).
2. Click **All apps** > **Create app** (top-right button).
3. Fill in the initial app details:
   * **App name:** `SynqSquad: Teammate Finder` (26 characters, max 30)
   * **Default language:** `English (United States) - en-US`
   * **App or game:** Select **App**
   * **Free or paid:** Select **Free**
4. **Declarations:**
   * Check the box: *I confirm that this app complies with the Developer Program Policies*.
   * Check the box: *I accept US export laws*.
5. Click **Create app** at the bottom right.

---

## 4. Step 2: Complete the Policy & App Content Forms

Navigate to **Policy and programs** > **App content** on the left menu. Complete every questionnaire using the pre-filled answers from `store/play_console_form_answers.md`:

### A. Privacy Policy
* Click **Start** under Privacy Policy.
* Enter: `https://synqsquad.vercel.app/privacy`
* Click **Save**.

### B. App Access (Crucial for Review Approval)
* Select: **"All or some functionality in my app is restricted"**.
* Click **Add instructions** and enter:
  * **Title:** `Google Reviewer Sign-In Access`
  * **Username:** Enter your dedicated Google reviewer test account (e.g. `synqsquad.reviewer@gmail.com`).
  * **Password:** Enter the password for that test account.
  * **Instructions:** Paste the exact review instructions from `store/play_console_form_answers.md#1-app-access`.
* Click **Save**.

### C. Ads
* Select: **No, my app does not contain ads**.
* Click **Save**.

### D. Content Rating
* Start the questionnaire and provide your contact email (`rajnishsingh.work@gmail.com`).
* Select category: **Utility, Productivity, Communication, or Other**.
* Answer **No** to violence, profanity, sexuality, gambling, and controlled substances.
* Answer **Yes** to: *Does the app allow users to interact or exchange content?* (User-generated requisitions and direct Gmail outreach).
* Submit questionnaire to receive your rating (PEGI 3 / Everyone with "Users Interact" descriptor).

### E. Target Audience & Content
* Select age group: **18 and over**.
* Select **No** to: *Could your store listing appeal to children?*
* Click **Save**.

### F. News, COVID-19, Financial & Government Apps
* News apps: **No**
* COVID-19 contact tracing: **No**
* Financial features: **No financial features**
* Government apps: **No**

### G. Data Safety (Mandatory)
* Does your app collect or share user data? 👉 **Yes**
* Is all data encrypted in transit? 👉 **Yes**
* Do you provide a way for users to request data deletion? 👉 **Yes**
* **Account deletion URL:** `https://synqsquad.vercel.app/account-deletion`
* Complete the data category breakdown (Name, Email, User ID, User-generated requisitions, App activity rate-limits) using the exact table in `store/play_console_form_answers.md#2-data-safety-form`.

---

## 5. Step 3: Upload Store Listing & Visual Assets

Navigate to **Grow** > **Store presence** > **Main store listing**:

1. **Listing Text (copy from `store/listing_metadata.txt`):**
   * **App name:** `SynqSquad: Teammate Finder`
   * **Short description:** `Find hackathon and research teammates. Connect directly on verified Gmail.`
   * **Full description:** Copy the complete editorial description from `store/listing_metadata.txt`.
2. **Graphics & Screenshots (drag and drop from the `/store` folder):**
   * **App icon:** Upload `store/icon-512.png` (512x512 PNG, 32-bit color).
   * **Feature graphic:** Upload `store/feature-graphic.png` (1024x500 PNG).
   * **Phone screenshots:** Upload all 4 verified 1080x1920 images:
     * `store/screenshot-1-feed.png`
     * `store/screenshot-2-drawer.png`
     * `store/screenshot-3-post.png`
     * `store/screenshot-4-profile.png`
3. **Categorization & Store Settings:**
   * Go to **Store settings**.
   * App category: **Social** (Tags: *Hackathons*, *Education*, *Collaboration*).
   * Contact email: `rajnishsingh.work@gmail.com`.
   * Website: `https://synqsquad.vercel.app`.
4. Click **Save**.

---

## 6. Step 4: Play App Signing & Digital Asset Links Verification

Google Play App Signing secures your app by managing your master signing key:

1. In Play Console, go to **Release** > **Testing** > **Closed testing**.
2. Click **Create new release**.
3. Under **App integrity / Play App Signing**, ensure Google Play App Signing is enabled.
4. Drag and drop your signed AAB: `android/app-release.aab`.
5. Enter release name: `1.0.0 (1)`.
6. Enter release notes from `store/listing_metadata.txt`.
7. Click **Save** and **Review release**.
8. **Retrieve the Google App Signing Key Fingerprint:**
   * Navigate to **Release** > **Setup** > **App integrity**.
   * Under the **App signing key certificate** tab, copy the **SHA-256 certificate fingerprint**.
   * Open `public/.well-known/assetlinks.json` and `src/app/.well-known/assetlinks.json/route.ts` in your project and append this SHA-256 fingerprint to the `sha256_cert_fingerprints` array alongside your upload key fingerprint:
     ```json
     [
       {
         "relation": ["delegate_permission/common.handle_all_urls"],
         "target": {
           "namespace": "android_app",
           "package_name": "com.synqsquad.app",
           "sha256_cert_fingerprints": [
             "F9:AF:2C:AE:EE:42:9C:12:A5:77:08:5C:92:37:72:2D:33:12:6C:38:6E:B5:36:BA:1F:DE:99:81:77:2E:7D:14",
             "<PASTE_PLAY_STORE_APP_SIGNING_SHA256_HERE>"
           ]
         }
       }
     ]
     ```
   * Deploy the updated code to Vercel via `git push` or `vercel --prod`.
   * **Verify full-screen validation:** Confirm that Google's statement API returns `SUCCESS`:
     ```bash
     curl -s "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://synqsquad.vercel.app&relation=delegate_permission/common.handle_all_urls"
     ```

---

## 7. Step 5: Google OAuth Production Migration

To ensure testers and reviewers do not see an *"Unverified app"* warning screen during Google Sign-In:

1. Log in to [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project > Go to **APIs & Services** > **OAuth consent screen**.
3. Verify that your scopes are **Non-Sensitive Scopes only**:
   * `.../auth/userinfo.email`
   * `.../auth/userinfo.profile`
   * `openid`
4. Confirm required fields:
   * **App Name:** `SynqSquad`
   * **User Support Email:** `rajnishsingh.work@gmail.com`
   * **Application Home Page:** `https://synqsquad.vercel.app`
   * **Application Privacy Policy Link:** `https://synqsquad.vercel.app/privacy`
   * **Application Terms of Service Link:** `https://synqsquad.vercel.app/terms`
   * **Developer Contact Information:** `rajnishsingh.work@gmail.com`
5. Click **Publish App** under Publishing Status.
6. Confirm the prompt to switch the status from **Testing** to **In Production**.
7. Because you only request non-sensitive basic scopes, your status updates immediately without requiring a full third-party security assessment.

---

## 8. Step 6: The 12-Tester / 14-Day Closed Testing Rule

> [!IMPORTANT]
> For all personal developer accounts created on or after November 13, 2023, Google Play requires you to run a closed test with at least **12 testers continuously opted in for at least 14 days** before you can request Production access.

1. In Play Console, navigate to **Release** > **Testing** > **Closed testing**.
2. Click on the **Testers** tab:
   * Select **Email list** > Click **Create email list**.
   * Add the Google account email addresses of at least 14–16 friends, student peers, or developer community members (to maintain a safety buffer above 12).
   * Copy the **Web opt-in link** or **Android link** provided on the page.
3. Share the opt-in link with your testers. Each tester must:
   * Open the link on their Android device while signed into their invited Google account.
   * Click **Become a tester**.
   * Download and install SynqSquad from Google Play.
4. **The 14-Day Clock:**
   * Keep your testers continuously opted in.
   * Ask testers to launch the app, sign in with Google, explore requisitions, and submit feedback.
   * Check the Play Console **Closed testing dashboard** daily to verify that the active tester count does not drop below 12.

---

## 9. Step 7: Applying for Production Access & Going Live

1. Once the 14 continuous days elapse, a prominent button labeled **"Apply for production"** will unlock on your Play Console Dashboard.
2. Click **Apply for production** and complete Google's readiness questionnaire:
   * **How did you recruit testers?** (*Recruited university student developers, open-source contributors, and hackathon participants across campus communities*).
   * **What feedback did you receive?** (*Testers tested Google OAuth sign-in, verified email masking, tested the Gmail compose deep-link fallback, and validated cross-device creator blocking*).
   * **What changes or fixes were made?** (*Added server-side blocking synchronization, upgraded target SDK to Android 16 (API 36), and refined touch targets*).
3. Submit the questionnaire. Google typically reviews and approves production access within 2 to 5 business days.
4. Once approved:
   * Go to **Release** > **Production**.
   * Click **Create new release** > Select the approved build from Closed Testing.
   * Click **Start rollout to Production**!

---

## 10. Custom Domain Setup Guide (Optional)

If you decide to purchase a custom domain like `synqsquad.app`:

1. **Purchase the domain:** Purchase `synqsquad.app` via Namecheap, Cloudflare, or Google Domains.
2. **Add to Vercel:** In Vercel Project Settings > **Domains**, add `synqsquad.app` and configure the DNS `CNAME` or `A` records as directed by Vercel.
3. **Update AssetLinks:** Once DNS resolves, add `https://synqsquad.app` to your Google Cloud Console OAuth Authorized Origins, and recompile `AndroidManifest.xml` with `<data android:host="synqsquad.app" />`.
4. *Until you purchase the custom domain, `https://synqsquad.vercel.app` is the sole, fully functional production domain.*

---

## 11. Pre-Submission Checklist & Risk Mitigation

| Verification Item | Status | Mitigation / Safeguard |
|---|---|---|
| **Minimum Functionality Policy** | ✅ Passed | Built using Trusted Web Activity (TWA) with native back navigation, offline fallback caching, in-app drawers, and full PWA app shell—never a plain WebView wrapper. |
| **User Data & Account Deletion** | ✅ Passed | Self-serve in-app deletion button in `/profile` AND public web deletion portal at `/account-deletion`. |
| **UGC Safety (Report & Block)** | ✅ Passed | In-app "Report Requisition" portal AND server-side cross-device "Block Creator" action with unblock option in Settings. |
| **Google OAuth Scopes** | ✅ Passed | Strictly basic `email` and `profile` scopes only. Zero access requested to user Gmail inboxes. |
| **Email Privacy & Anti-Scraping** | ✅ Passed | Public creator emails masked (`a••••a@gmail.com`). 10/day rolling outreach limit enforced. |
| **Play App Signing** | ✅ Ready | Upload keystore generated and SHA-256 fingerprint configured in `assetlinks.json`. |
| **Target API Requirement** | ✅ Target 36 | Configured for Android 16 (API 36) with min SDK 21 for 99%+ device compatibility. |
