# SynqSquad — The One-Click Teammate Matchmaker on Gmail

> **The One USP:** One person finds the one person they want to work with, and connects with them directly on verified Gmail. That is the entire product.

---

## 🎯 The Philosophy: Calm, Editorial & Craft-First
- **No Chat Walled Gardens:** Zero internal messaging clutter. Every collaborator has a verified Google account, and conversations happen directly in native Gmail.
- **Privacy by Default:** Public visitors cannot scrape creator emails (masked as `a••••a@gmail.com`). Only signed-in Google users can initiate a Gmail connect.
- **Anti-AI Design:** Zero purple-cyan gradient text, zero glowing neon blobs, zero fake statistics, zero emoji in UI headings. Styled like an intentional, calm academic noticeboard (inspired by Linear, Arc, and Notion).
- **Abuse Protected:** Maximum 10 Gmail connect clicks per user per day to protect creators from automated spam.

---

## 💡 Core User Flows
1. **Browse Without Friction:** Visitors can immediately filter and search by hackathon, research topic, or skill without logging in.
2. **One Primary Action ("Connect on Gmail"):**
   - Clicking opens a prefilled Gmail compose window (`mail.google.com/mail/?view=cm...`) with a polite, human template referencing the project title, event, and the sender's verified role and skills.
   - Automatically saves the listing to the sender's **Contacted** list.
   - Includes a "Copy email" fallback for popup blockers.
3. **6-Field Requirement Posting:**
   - Title, Type (Hackathon / Research / Solo), Event & Deadline, Skills, Slots, Description.
   - Tied to the verified Google account. Posts auto-expire after 30 days and can be marked as "Filled" with one click.
4. **Simple, Honest Suggestions ("Suggested for you"):**
   - Compares user skills with open requirements and highlights matching skills in plain English. No fake robot percentages.

---

## 🚀 Quick Start
```bash
# Install dependencies
npm install

# Run in Development mode
npm run dev

# Or run Production build
npm run build
npm run start
```
Open **`http://localhost:3000`** in your browser.

---

## 🧪 E2E Automated Tests (20/20 Passed)
```bash
node tests/api-e2e.mjs
```
- **Test 1:** Public email privacy masking
- **Test 2:** Authenticated Gmail resolution
- **Test 3:** Listing creation with Google profile
- **Test 4:** Gmail connect trigger and daily rate-limiting
- **Test 5:** Contacted listings persistence
- **Test 6:** Owner-authenticated status updates ("Filled" / "Open")
- **Test 7:** Owner-authenticated deletion
