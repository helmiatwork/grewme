# i18n with Paraglide.js — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add English + Bahasa Indonesia translations to all 51 SvelteKit pages using Paraglide.js 2.0, with a language switcher dropdown in the navbar.

**Architecture:** Paraglide.js Vite plugin compiles `messages/*.json` into type-safe `$lib/paraglide/` at build time. Cookie-based locale detection in `hooks.server.ts`. Language switcher in Navbar component.

**Tech Stack:** @inlang/paraglide-js 2.0, SvelteKit 2, Svelte 5 runes, Vite 7

---

### Task 1: Install Paraglide.js and configure Vite plugin

**Files:**
- Create: `front-end/project.inlang/settings.json`
- Modify: `front-end/vite.config.ts`
- Modify: `front-end/src/app.html`
- Modify: `front-end/.gitignore`

**Step 1: Install Paraglide.js**

Run in `front-end/`:
```bash
npm install @inlang/paraglide-js
```

**Step 2: Create inlang settings**

Create `front-end/project.inlang/settings.json`:
```json
{
  "baseLocale": "en",
  "locales": ["en", "id"]
}
```

**Step 3: Configure Vite plugin**

Modify `front-end/vite.config.ts`:
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { paraglide } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglide({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	]
});
```

**Step 4: Make HTML lang dynamic**

Modify `front-end/src/app.html` — change `lang="en"` to `lang="%paraglide.lang%"`:
```html
<!doctype html>
<html lang="%paraglide.lang%">
```

**Step 5: Add paraglide output to .gitignore**

Append to `front-end/.gitignore`:
```
/src/lib/paraglide
```

**Step 6: Run dev to verify compilation**

```bash
npm run dev
```
Expected: Paraglide generates `src/lib/paraglide/` directory with `messages.js` and `runtime.js`.

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: install Paraglide.js i18n with EN/ID locale config"
```

---

### Task 2: Configure middleware and language switcher

**Files:**
- Modify: `front-end/src/hooks.server.ts`
- Modify: `front-end/src/lib/components/layout/Navbar.svelte`

**Step 1: Add Paraglide middleware to hooks.server.ts**

The existing `hooks.server.ts` has auth logic. We need to integrate Paraglide middleware with it. Wrap the existing handle with Paraglide's middleware using SvelteKit's `sequence`:

```typescript
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { i18n } from '$lib/paraglide/adapter';
import {
  getAccessToken,
  getRefreshToken,
  getRole,
  decodeJwtPayload,
  isTokenExpired,
  setAuthCookies,
  clearAuthCookies
} from '$lib/api/auth';
import { graphql } from '$lib/api/client';
import { REFRESH_TOKEN_MUTATION } from '$lib/api/queries/auth';

const PUBLIC_PATHS = ['/login', '/register', '/api/'];

const authHandle: Handle = async ({ event, resolve }) => {
  // ... existing auth logic (lines 17-104 unchanged) ...
  return resolve(event);
};

export const handle = sequence(i18n.handle(), authHandle);
```

Note: If Paraglide v2 doesn't export `i18n.handle()` from adapter, use the reroute approach instead:
- Add `export const reroute = i18n.reroute()` to `hooks.ts` (client hooks)
- Add `export const handle = sequence(i18n.handle(), authHandle)` to `hooks.server.ts`

**Step 2: Add language switcher to Navbar**

Modify `front-end/src/lib/components/layout/Navbar.svelte` — add a language dropdown between the notification bell and the role badge:

```svelte
<!-- Add import at top of script -->
import { getLocale, setLocale } from '$lib/paraglide/runtime';
import * as m from '$lib/paraglide/messages';

<!-- Add between notification bell and Badge -->
<select
  value={getLocale()}
  onchange={(e) => setLocale(e.currentTarget.value)}
  class="text-sm bg-transparent border border-slate-200 rounded-lg px-2 py-1 text-text-muted hover:text-text cursor-pointer"
>
  <option value="en">🇬🇧 EN</option>
  <option value="id">🇮🇩 ID</option>
</select>
```

**Step 3: Also add switcher to login page (unauthenticated users)**

Add a small language toggle to the login page footer area (since Navbar isn't shown on login):

In `front-end/src/routes/login/+page.svelte`, add after the terms/privacy links:
```svelte
<div class="mt-2 text-center">
  <select
    value={getLocale()}
    onchange={(e) => setLocale(e.currentTarget.value)}
    class="text-xs bg-transparent border border-slate-200 rounded px-2 py-0.5 text-text-muted"
  >
    <option value="en">🇬🇧 EN</option>
    <option value="id">🇮🇩 ID</option>
  </select>
</div>
```

**Step 4: Verify switching works**

Run dev server, switch language, verify cookie is set and page re-renders.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Paraglide middleware and language switcher in navbar"
```

---

### Task 3: Extract common/shared strings + create EN/ID message files

**Files:**
- Create: `front-end/messages/en.json`
- Create: `front-end/id.json`
- Modify: `front-end/src/lib/components/layout/Navbar.svelte` — replace hardcoded strings
- Modify: `front-end/src/lib/components/layout/Sidebar.svelte` — if it has strings

**Step 1: Create English message file with common keys**

Create `front-end/messages/en.json` with all common/shared strings:
```json
{
  "common_save": "Save",
  "common_cancel": "Cancel",
  "common_delete": "Delete",
  "common_edit": "Edit",
  "common_close": "Close",
  "common_back": "Back",
  "common_loading": "Loading...",
  "common_error": "Something went wrong",
  "common_no_data": "No data available",
  "common_search": "Search...",
  "common_submit": "Submit",
  "common_confirm": "Confirm",
  "common_yes": "Yes",
  "common_no": "No",
  "common_actions": "Actions",
  "common_status": "Status",
  "common_date": "Date",
  "common_name": "Name",
  "common_email": "Email",
  "common_password": "Password",
  "common_sign_out": "Sign out",
  "common_notifications": "Notifications",
  "common_no_notifications": "No new notifications",
  "nav_dashboard": "Dashboard",
  "nav_class_feed": "Class Feed",
  "nav_messages": "Messages",
  "nav_calendar": "Calendar",
  "nav_curriculum": "Curriculum",
  "nav_yearly_plan": "Yearly Plan",
  "nav_exams": "Exams",
  "nav_profile": "Profile",
  "nav_students": "Students",
  "nav_teachers": "Teachers",
  "nav_classrooms": "Classrooms",
  "nav_settings": "Settings",
  "nav_data_rights": "Data Rights",
  "nav_children": "My Children",
  "role_teacher": "Teacher",
  "role_parent": "Parent",
  "role_school_manager": "School Manager"
}
```

**Step 2: Create Bahasa Indonesia message file**

Create `front-end/messages/id.json`:
```json
{
  "common_save": "Simpan",
  "common_cancel": "Batal",
  "common_delete": "Hapus",
  "common_edit": "Ubah",
  "common_close": "Tutup",
  "common_back": "Kembali",
  "common_loading": "Memuat...",
  "common_error": "Terjadi kesalahan",
  "common_no_data": "Tidak ada data",
  "common_search": "Cari...",
  "common_submit": "Kirim",
  "common_confirm": "Konfirmasi",
  "common_yes": "Ya",
  "common_no": "Tidak",
  "common_actions": "Tindakan",
  "common_status": "Status",
  "common_date": "Tanggal",
  "common_name": "Nama",
  "common_email": "Email",
  "common_password": "Kata Sandi",
  "common_sign_out": "Keluar",
  "common_notifications": "Notifikasi",
  "common_no_notifications": "Tidak ada notifikasi baru",
  "nav_dashboard": "Beranda",
  "nav_class_feed": "Feed Kelas",
  "nav_messages": "Pesan",
  "nav_calendar": "Kalender",
  "nav_curriculum": "Kurikulum",
  "nav_yearly_plan": "Rencana Tahunan",
  "nav_exams": "Ujian",
  "nav_profile": "Profil",
  "nav_students": "Siswa",
  "nav_teachers": "Guru",
  "nav_classrooms": "Kelas",
  "nav_settings": "Pengaturan",
  "nav_data_rights": "Hak Data",
  "nav_children": "Anak Saya",
  "role_teacher": "Guru",
  "role_parent": "Orang Tua",
  "role_school_manager": "Kepala Sekolah"
}
```

**Step 3: Replace hardcoded strings in Navbar.svelte**

Replace all hardcoded text with `m.key()` calls:
- `"Notifications"` → `{m.common_notifications()}`
- `"No new notifications"` → `{m.common_no_notifications()}`
- `"School Manager"` → `{m.role_school_manager()}`
- `"Sign out"` → `{m.common_sign_out()}`

**Step 4: Replace nav labels in layout files**

In `teacher/+layout.svelte`, `parent/+layout.svelte`, `school/+layout.svelte` — replace hardcoded `label` strings in `navItems` with `m.nav_*()` calls.

Example for teacher:
```typescript
import * as m from '$lib/paraglide/messages';

const navItems = [
  { label: m.nav_dashboard(), href: '/teacher/dashboard', icon: '🏠' },
  { label: m.nav_class_feed(), href: '/teacher/feed', icon: '📢' },
  { label: m.nav_messages(), href: '/teacher/messages', icon: '💬' },
  // ...
];
```

**Step 5: Verify common strings render in both languages**

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add EN/ID translations for common strings, nav, and navbar"
```

---

### Task 4: Extract auth pages (login, register)

**Files:**
- Modify: `front-end/messages/en.json` — add auth keys
- Modify: `front-end/messages/id.json` — add auth translations
- Modify: `front-end/src/routes/login/+page.svelte`
- Modify: `front-end/src/routes/register/+page.svelte`

**Step 1: Add auth keys to en.json**

```json
{
  "login_title": "Sign in to your account",
  "login_email_placeholder": "you@example.com",
  "login_password_placeholder": "••••••••",
  "login_role_label": "I am a...",
  "login_role_teacher": "Teacher",
  "login_role_parent": "Parent",
  "login_role_school": "School",
  "login_submit": "Sign in",
  "login_no_account": "Don't have an account?",
  "login_register_link": "Register",
  "login_privacy": "Privacy Policy",
  "login_terms": "Terms of Service",
  "app_name": "GrewMe",
  "app_tagline": "Kids Learning Radar",
  "register_title": "Create your account",
  "register_name": "Full Name",
  "register_name_placeholder": "Your full name",
  "register_confirm_password": "Confirm Password",
  "register_submit": "Create account",
  "register_have_account": "Already have an account?",
  "register_login_link": "Sign in"
}
```

**Step 2: Add Bahasa translations to id.json**

```json
{
  "login_title": "Masuk ke akun Anda",
  "login_email_placeholder": "anda@contoh.com",
  "login_password_placeholder": "••••••••",
  "login_role_label": "Saya adalah...",
  "login_role_teacher": "Guru",
  "login_role_parent": "Orang Tua",
  "login_role_school": "Sekolah",
  "login_submit": "Masuk",
  "login_no_account": "Belum punya akun?",
  "login_register_link": "Daftar",
  "login_privacy": "Kebijakan Privasi",
  "login_terms": "Ketentuan Layanan",
  "app_name": "GrewMe",
  "app_tagline": "Radar Belajar Anak",
  "register_title": "Buat akun Anda",
  "register_name": "Nama Lengkap",
  "register_name_placeholder": "Nama lengkap Anda",
  "register_confirm_password": "Konfirmasi Kata Sandi",
  "register_submit": "Buat akun",
  "register_have_account": "Sudah punya akun?",
  "register_login_link": "Masuk"
}
```

**Step 3: Replace strings in login/+page.svelte**

Add `import * as m from '$lib/paraglide/messages';` and replace all hardcoded strings with `m.*()` calls.

**Step 4: Replace strings in register/+page.svelte**

Same pattern.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add EN/ID translations for login and register pages"
```

---

### Task 5: Extract legal pages (privacy, terms, consent, invite)

**Files:**
- Modify: `front-end/messages/en.json` — add legal keys
- Modify: `front-end/messages/id.json` — add legal translations
- Modify: `front-end/src/routes/privacy/+page.svelte`
- Modify: `front-end/src/routes/terms/+page.svelte`
- Modify: `front-end/src/routes/consent/[token]/+page.svelte`
- Modify: `front-end/src/routes/invite/[token]/+page.svelte`

Extract all hardcoded strings, add EN keys and ID translations. Commit.

```bash
git add -A && git commit -m "feat: add EN/ID translations for privacy, terms, consent, invite pages"
```

---

### Task 6: Extract teacher pages (16 pages)

**Files:**
- Modify: `front-end/messages/en.json` — add teacher_* keys
- Modify: `front-end/messages/id.json` — add teacher translations
- Modify: All 16 teacher page files

**Pages to extract:**
1. `teacher/dashboard/+page.svelte` — "My Classrooms", "No classrooms yet", etc.
2. `teacher/profile/+page.svelte` — profile form labels
3. `teacher/feed/+page.svelte` — feed post strings
4. `teacher/calendar/+page.svelte` — calendar labels
5. `teacher/messages/+page.svelte` — chat strings
6. `teacher/classrooms/[id]/+page.svelte` — classroom detail, score grid
7. `teacher/students/[id]/+page.svelte` — student detail, radar chart
8. `teacher/students/[id]/health/+page.svelte` — health checkup form
9. `teacher/curriculum/+page.svelte` — curriculum list
10. `teacher/curriculum/[subjectId]/+page.svelte` — subject detail
11. `teacher/curriculum/[subjectId]/[topicId]/+page.svelte` — topic detail
12. `teacher/curriculum/yearly/+page.svelte` — yearly plan
13. `teacher/exams/+page.svelte` — exam list
14. `teacher/exams/new/+page.svelte` — create exam form
15. `teacher/exams/[examId]/+page.svelte` — exam detail
16. `teacher/exams/[examId]/grade/[submissionId]/+page.svelte` — grading

For each page: read file, identify all hardcoded strings, add keys to en.json, add translations to id.json, replace strings with `m.*()` calls.

```bash
git add -A && git commit -m "feat: add EN/ID translations for all teacher pages"
```

---

### Task 7: Extract parent pages (12 pages)

**Files:**
- Modify: `front-end/messages/en.json` — add parent_* keys
- Modify: `front-end/messages/id.json` — add parent translations
- Modify: All 12 parent page files

**Pages to extract:**
1. `parent/dashboard/+page.svelte`
2. `parent/profile/+page.svelte`
3. `parent/calendar/+page.svelte`
4. `parent/messages/+page.svelte`
5. `parent/data-rights/+page.svelte`
6. `parent/children/[id]/+page.svelte`
7. `parent/children/[id]/exams/+page.svelte`
8. `parent/children/[id]/health/+page.svelte`
9. `parent/curriculum/+page.svelte`
10. `parent/curriculum/[subjectId]/+page.svelte`
11. `parent/curriculum/[subjectId]/[topicId]/+page.svelte`
12. `parent/curriculum/yearly/+page.svelte`

```bash
git add -A && git commit -m "feat: add EN/ID translations for all parent pages"
```

---

### Task 8: Extract school manager pages (14 pages)

**Files:**
- Modify: `front-end/messages/en.json` — add school_* keys
- Modify: `front-end/messages/id.json` — add school translations
- Modify: All 14 school page files

**Pages to extract:**
1. `school/dashboard/+page.svelte`
2. `school/profile/+page.svelte`
3. `school/feed/+page.svelte`
4. `school/calendar/+page.svelte`
5. `school/classrooms/+page.svelte`
6. `school/teachers/+page.svelte`
7. `school/students/+page.svelte`
8. `school/curriculum/+page.svelte`
9. `school/curriculum/[subjectId]/+page.svelte`
10. `school/curriculum/[subjectId]/[topicId]/+page.svelte`
11. `school/curriculum/yearly/+page.svelte`
12. `school/exams/+page.svelte`
13. `school/exams/[examId]/+page.svelte`
14. `school/settings/academic-years/+page.svelte`

```bash
git add -A && git commit -m "feat: add EN/ID translations for all school manager pages"
```

---

### Task 9: Extract remaining pages (admin, posts, error, home)

**Files:**
- Modify: `front-end/messages/en.json` — add remaining keys
- Modify: `front-end/messages/id.json` — add remaining translations
- Modify: `front-end/src/routes/admin/permissions/+page.svelte`
- Modify: `front-end/src/routes/posts/[id]/+page.svelte`
- Modify: `front-end/src/routes/+page.svelte`
- Modify: `front-end/src/routes/+error.svelte`

```bash
git add -A && git commit -m "feat: add EN/ID translations for admin, posts, home, and error pages"
```

---

### Task 10: Verify and test

**Step 1: Run build to check for missing translations**

```bash
npm run build
```

Paraglide will error at compile time if any key exists in en.json but not id.json.

**Step 2: Run dev and test language switching**

- Start dev server
- Login as teacher → verify all strings in English
- Switch to ID → verify all strings in Bahasa
- Navigate through all major pages
- Switch back to EN → verify persistence via cookie

**Step 3: Test SSR**

- Hard refresh page in ID locale → verify HTML `lang="id"` and strings render server-side

**Step 4: Commit final**

```bash
git add -A && git commit -m "feat: i18n complete — EN/ID translations for all 51 pages"
```

---

## Summary

| Task | Scope | Est. Keys |
|------|-------|-----------|
| 1 | Install + Vite config | 0 |
| 2 | Middleware + switcher | 0 |
| 3 | Common/nav strings | ~40 |
| 4 | Auth pages (login, register) | ~25 |
| 5 | Legal pages (4) | ~80 |
| 6 | Teacher pages (16) | ~600 |
| 7 | Parent pages (12) | ~500 |
| 8 | School pages (14) | ~500 |
| 9 | Remaining pages (4) | ~50 |
| 10 | Verify + test | 0 |
| **Total** | **51 pages** | **~1,795** |
