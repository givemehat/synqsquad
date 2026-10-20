# Google Play Console Form Answers & Questionnaire Cheat-Sheet

Use this comprehensive reference when completing the required declaration forms under **Policy and programs** > **App content** in Google Play Console.

---

## 1. App Access (Mandatory Review Credentials)

Because RIVQ requires Google Sign-In to post requisitions or reveal unmasked Gmail addresses to prevent scraper abuse, Google Play reviewers **must** be provided credentials or test instructions to access all features.

In Google Play Console, go to **App content** > **App access** and select:
**"All or some functionality is restricted"** > Click **"Add new instructions"**:

| Field | Reviewer Instruction Value |
|---|---|
| **Title** | Google Reviewer Sign-In Access |
| **User name / Email** | `rivq.reviewer@gmail.com` *(or your test Google account)* |
| **Password** | *(Provide the app password or note: "OAuth Test Mode")* |
| **Explanation / Instructions for Reviewer** | RIVQ uses Google Identity Services (OAuth 2.0) with basic profile and email scopes (`email`, `profile`). Reviewers can tap the "Sign in with Google" button in the top navigation bar or inside any listing card drawer. When prompted, select the configured test Google account. Once authenticated, reviewers have unrestricted access to: (1) create hackathon/research requisitions, (2) reveal unmasked collaborator emails and trigger Gmail compose drafts, (3) export user data in JSON format, and (4) execute immediate permanent account erasure in Account Settings. Browsing open listings and offline caching are available immediately without login. |

---

## 2. Data Safety Form (Exact Questionnaire Answers)

In Google Play Console, go to **App content** > **Data safety**.

### Overall Data Collection Questions
* **Does your app collect or share any of the required user data types?**  
  👉 **Yes**
* **Is all of the user data collected by your app encrypted in transit?**  
  👉 **Yes** *(All communication uses HTTPS/TLS 1.3)*
* **Do you provide a way for users to request that their data be deleted?**  
  👉 **Yes**
* **Account Deletion Web Link:**  
  👉 `https://synqsquad.vercel.app/account-deletion`

---

### Data Collection & Purpose Breakdown Table

| Data Type | Collected? | Shared? | Purpose | Ephemeral? | Required or Optional? |
|---|---|---|---|---|---|
| **Name** (Personal info) | **Yes** | **No** | App functionality, Account management | **No** (Stored in profile) | **Required** (Provided via Google Auth) |
| **Email Address** (Personal info) | **Yes** | **No** | App functionality, Account management, Peer-to-peer outreach | **No** (Stored in user database) | **Required** (Provided via Google Auth) |
| **User IDs** (Identifiers) | **Yes** | **No** | Account management | **No** (Primary key) | **Required** |
| **Other Personal Info** (College/Affiliation, Role, Bio, Social Links) | **Yes** | **No** | App functionality (Collaborator matching) | **No** | **Optional** (Can be skipped during onboarding) |
| **User Content / Requisitions & Talent Profiles** (Title, skills, headline, bio) | **Yes** | **No** | App functionality (Public requisition feed & Talent directory) | **No** (Stored until deleted by user or auto-expired) | **Optional** (Created voluntarily by user) |
| **Messages / Outreach Requests** (Two-way collaboration text) | **Yes** | **No** | App functionality (Collaborator introduction) | **No** (Stored until resolved or user deleted) | **Optional** (Sent voluntarily) |
| **App Activity / Outreach history & Rate Limits** (10/day shared rate limit audit) | **Yes** | **No** | Fraud prevention, security, and spam protection | **No** (Rolling 24-hour audit log) | **Required** for connect actions |
| **Safety Data / Reports & Blocks** (UGC report logs, blocked users) | **Yes** | **No** | Security, abuse moderation, and policy enforcement | **No** (Stored in database until resolved/unblocked) | **Optional** (Triggered on report/block) |
| **Crash logs / Diagnostics** | **No** | **No** | N/A | N/A | N/A |
| **Financial Info** | **No** | **No** | N/A | N/A | N/A |
| **Location (GPS / Fine)** | **No** | **No** | N/A | N/A | N/A |
| **Photos / Videos** (Google profile avatar) | **Yes** | **No** | Account management (Display avatar) | **No** (URL reference only) | **Optional** |
| **Device Storage / Cookies** (Theme preference, local session tokens) | **Yes** | **No** | App functionality (Session persistence, dark/light theme) | **No** (On-device only, never sent to 3rd parties) | **Required** for session |

---

## 3. Account Deletion & Data Retention Declaration

* **Can users delete their account from within the app?**  
  👉 **Yes** *(Available under `/profile` via "Permanently Erase Account & All Data")*
* **Can users request deletion from a web resource?**  
  👉 **Yes**
* **Enter the URL for account deletion:**  
  👉 `https://synqsquad.vercel.app/account-deletion`
* **What data is deleted when requested?**  
  👉 User profile, all listings/requisitions created, contact records, and rate limit counters are immediately and permanently erased from the active database.

---

## 4. Content Rating Questionnaire (IARC)

In Google Play Console, go to **App content** > **Content rating**:

1. **Category:** Select **Utility, Productivity, Communication, or Other**.
2. **Violence:** Select **No** to all questions.
3. **Sexuality / Nudity:** Select **No** to all questions.
4. **Language / Profanity:** Select **No**.
5. **Controlled Substance:** Select **No**.
6. **Miscellaneous:**
   * Does the app allow users to interact or exchange content with other users?  
     👉 **Yes** *(Users post hackathon/research requisitions and connect via Gmail).*
   * Does the app share the user's current physical location?  
     👉 **No**.
   * Does the app allow users to purchase digital goods?  
     👉 **No**.
7. **Result:** Typically rated **PEGI 3 / USK 0 / Everyone** with a "Users Interact" content descriptor.

---

## 5. Target Audience and Content

In Google Play Console, go to **App content** > **Target audience and content**:

* **Target age groups:**  
  👉 Select **18 and over**.
* **Could your store listing unintentionally appeal to children?**  
  👉 Select **No**. (The app is specifically tailored for university students, researchers, and professional developers).

---

## 6. Ads & In-App Purchases Declaration

In Google Play Console, go to **App content** > **Ads**:

* **Does your app contain ads?**  
  👉 **No, my app does not contain ads**.
* **In-app purchases:**  
  👉 **No, the app is 100% free with no digital goods or microtransactions**.

---

## 7. Financial Features Declaration

In Google Play Console, go to **App content** > **Financial features**:

* **Does your app provide financial features (banking, loans, crypto trading, wallets)?**  
  👉 **No financial features**. (RIVQ strictly facilitates hackathon and research paper team collaboration).

---

## 8. Government Apps Declaration

In Google Play Console, go to **App content** > **Government apps**:

* **Is your app developed by or on behalf of a government entity?**  
  👉 **No**. (RIVQ is an independent technological platform).

---

## 9. User-Generated Content (UGC) Policy Compliance Checklist

Google Play strictly regulates apps featuring user-generated content (listings, comments, profiles):

* ✅ **Terms of Service prohibiting abuse:** Present in app footer and at `/terms`.
* ✅ **Community Guidelines:** Clear standards defining acceptable requisitions and zero tolerance for harassment at `/guidelines`.
* ✅ **In-App Reporting:** Accessible on every listing drawer and talent profile via **"Report"** submitting directly to our server-side moderation triage table (`/api/report`).
* ✅ **In-App Blocking:** Accessible on every listing drawer and talent profile via **"Block Member"**, instantly removing that user's content in both directions across feed and search.
* ✅ **Moderation process:** Reports are logged to the Supabase `reports` database with designated grievance officer review within 24 hours.
