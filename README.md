# Share a Book

Free school book exchange web app for Pakistani school parents. React + Firebase + Tailwind.

## Quick start

1. **Firebase project** — Create a project at [Firebase Console](https://console.firebase.google.com). Enable:
   - Authentication → Phone
   - Firestore
   - Storage
   - Hosting

2. **Environment** — Copy `.env.example` to `.env` and paste your Firebase web app config:

```bash
cp .env.example .env
```

3. **Schools list** — Parents pick a school on first login. Add schools using **one** of these:

   **Option A — Firebase Console (easiest):** Firestore → Start collection `schools` → Add documents with fields `name` (string) and `city` (string). Example: `Beaconhouse School System`, `Lahore`.

   **Option B — Seed script:** Download a service account key → save as `serviceAccountKey.json` → run `npm run seed:schools` (adds 10 sample schools from `seed/schools.json`).

   Parents can **only pick from this list** on signup. If a school is missing, they must contact the admin — add schools via Admin panel → Schools tab (requires `isAdmin: true`).

4. **Admin user** — After your first login, set `isAdmin: true` on your document in `users/{your-uid}`.

5. **Assets** — Add these files under `public/`:
   - `icon-192.png`, `icon-512.png` (PWA icons)
   - `easypaisa-qr.png` (donation QR)

6. **Run locally**

```bash
npm install
npm run dev
```

7. **Deploy**

```bash
npm run build
npx firebase login
npx firebase use your-project-id
npx firebase deploy
```

Deploy Firestore indexes, rules, and Storage rules:

```bash
npm run deploy:rules
npm run deploy:indexes
```

**Photo uploads** need **Firebase Storage** enabled and rules published. In Firebase Console → Storage → Rules, paste `storage.rules` from this project (or publish via CLI). Without this, posts with photos fail.

### Firestore indexes (required for fast browse)

The app sorts books on the server using composite indexes. Create them once:

**Option A — One-click from the app:** Open browse, press **F12** → Console. If an index is missing, Firebase prints a link — click it → **Create index** → wait 2–5 minutes → refresh.

**Option B — Firebase Console:** [Firestore → Indexes](https://console.firebase.google.com/project/share-a-book-bf6bc/firestore/indexes) → **Create index** (Composite):

| Index | Collection | Fields |
|-------|------------|--------|
| Browse | `listings` | `isActive` Ascending, `createdAt` Descending |
| My Books | `listings` | `postedByUid` Ascending, `isActive` Ascending, `createdAt` Descending |

**Option C — CLI:** `npm run deploy:indexes` (requires `firebase login`).

Indexes show **Building** for a few minutes, then **Enabled**. The app works fastest once both are enabled.

## Phone auth notes

**Local development:** Firebase phone OTP does **not** work on `localhost`. Use:

```
http://127.0.0.1:5173
```

Then in **Firebase Console → Authentication → Settings → Authorized domains**, add `127.0.0.1`.

**Testing without SMS (free):** In **Authentication → Sign-in method → Phone**, scroll to **Phone numbers for testing** and add e.g. `+923001234567` with code `123456`. Use that number in the app — no real SMS is sent.

**SMS region (required for +92 Pakistan):** New Firebase projects block all SMS regions by default. In **Authentication → Settings → SMS region policy**, set **Allow** and add **Pakistan** (or allow all regions). Without this, OTP fails even when Phone is enabled.

**Real SMS to parents:** Requires upgrading the Firebase project to the **Blaze** plan (pay-as-you-go). Set a $1 budget alert in Google Cloud.

- Complete the visible reCAPTCHA on the login screen before tapping Send OTP.
- If OTP fails, refresh the page and try again (reCAPTCHA resets automatically).

## Project structure

```
src/
  components/   Layout, nav, cards, filters
  contexts/   AuthContext
  pages/      All screens
  utils/      phone, WhatsApp, images, dates
  firebase.js
  constants.js
```

## Features

- Phone OTP login (+92)
- Onboarding (name + school)
- Browse with grade / subject / type filters
- Book detail + WhatsApp contact (privacy notice first)
- Post books with image compression (&lt;300KB)
- My Books (20 listing limit)
- Admin panel (delete listings, block users)
- About page with live stats + Easypaisa modal
- PWA install support

## License

Built for school communities — use and adapt freely.
