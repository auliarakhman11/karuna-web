# Dokumentasi Log Prompt Antigravity

---

### 📝 Prompt #01 - Inisialisasi Struktur Folder Backend & Frontend
**Target:** Root Folder (`backend/` dan `frontend/`)  
**Model AI Recomendation:** Gemini Flash (Low Tier)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Tugasmu adalah melakukan inisialisasi struktur proyek dasar untuk folder `backend` dan `frontend`. 

Ikuti langkah-langkah berikut secara presisi:

1. Di dalam folder `backend/`:
   - Inisialisasi proyek Node.js dengan TypeScript.
   - Buat file `package.json` dengan dependensi dasar: `express`, `cors`, `dotenv`, `cookie-parser`, `jsonwebtoken`.
   - Buat `tsconfig.json` dengan konfigurasi TypeScript standar Node.js.
   - Buat struktur folder berikut di dalam `backend/src/`:
     - `config/`
     - `controllers/`
     - `middlewares/`
     - `routes/`
     - `services/`
     - `utils/`
   - Buat file entry point sederhana `backend/src/app.ts` yang menjalankan server Express di port 5000 dan endpoint kesehatan `GET /api/health` yang mengembalikan respon `{ status: "ok" }`.

2. Di dalam folder `frontend/`:
   - Buat file `package.json` dasar untuk Next.js dengan TypeScript dan Tailwind CSS.
   - Buat `tsconfig.json` standar Next.js.
   - Buat struktur folder dasar `src/app/` dengan file `page.tsx` sederhana berespon "Frontend Ready" ber-styling Tailwind CSS.

JANGAN menambahkan fitur logika database atau autentikasi dulu. Fokus HANYA pada inisialisasi struktur file dan konfigurasi dasar.


---

### 📝 Prompt #02 - Setup Environment Variables & Koneksi Database Supabase
**Target:** Folder `backend/`  
**Model AI Recomendation:** Gemini Flash (Low Tier)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Tugasmu adalah menambahkan konfigurasi Environment Variables dan setup koneksi Supabase Database di folder `backend/`.

Ikuti langkah-langkah berikut secara presisi:

1. Di dalam `backend/package.json`:
   - Pastikan package `@supabase/supabase-js` dan `dotenv` masuk ke daftar dependensi (`dependencies`).

2. Buat file `backend/.env.example` dengan isi berikut:
   PORT=5000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   JWT_SECRET=rahasia_access_token_123
   JWT_REFRESH_SECRET=rahasia_refresh_token_123

3. Buat file `backend/.env` dengan variabel yang sama seperti `.env.example`.

4. Buat file `backend/src/config/database.ts`:
   - Muat environment variables menggunakan `dotenv`.
   - Inisialisasi Supabase client menggunakan `@supabase/supabase-js` dengan mengambil `SUPABASE_URL` dan `SUPABASE_KEY` dari `process.env`.
   - Ekspor instance `supabase` client agar bisa digunakan di service/controller lain.
   - Sertakan penanganan log sederhana jika variabel `SUPABASE_URL` atau `SUPABASE_KEY` belum diisi di `.env`.

5. Di file `backend/src/app.ts`:
   - Panggil `dotenv.config()` di baris paling atas agar environment variables terload sebelum server berjalan.

JANGAN mengubah file apa pun di folder `frontend/`. Fokus HANYA pada konfigurasi backend di atas.

---

### 📝 Prompt #03 - Setup Skema Database (Prefix `karuna_`) & Auth JWT Middleware
**Target:** Folder `backend/`  
**Model AI Recommendation:** Gemini Flash (Low Tier)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Tugasmu adalah membuat struktur tabel autentikasi dan middleware JWT di folder `backend/`.

ATURAN WAJIB DATABASE:
Semua nama tabel WAJIB menggunakan prefix `karuna_`.

Langkah pengerjaan:

1. Buat file `backend/src/utils/tables.ts`:
   - Ekspor konstanta object `TABLES` yang berisi mapping nama tabel dengan prefix `karuna_`:
     ```typescript
     export const TABLES = {
       USERS: 'karuna_users',
       REFRESH_TOKENS: 'karuna_refresh_tokens',
     } as const;
     ```

2. Buat file `backend/schema.sql` (sebagai referensi DDL untuk Supabase SQL Editor):
   - Buat tabel `karuna_users`:
     - `id` (UUID, Primary Key, default gen_random_uuid())
     - `email` (VARCHAR, Unique, Not Null)
     - `password` (VARCHAR, Not Null)
     - `name` (VARCHAR, Not Null)
     - `created_at` (TIMESTAMP, default now())
     - `updated_at` (TIMESTAMP, default now())
   - Buat tabel `karuna_refresh_tokens`:
     - `id` (UUID, Primary Key, default gen_random_uuid())
     - `user_id` (UUID, Foreign Key ke `karuna_users.id` ON DELETE CASCADE)
     - `token` (TEXT, Not Null, Unique)
     - `expires_at` (TIMESTAMP, Not Null)
     - `created_at` (TIMESTAMP, default now())

3. Instalasi dependensi tambahan di `backend/`:
   - Pastikan package `bcryptjs` dan `@types/bcryptjs` terinstall untuk hashing password.

4. Buat JWT Utilities (`backend/src/utils/jwt.ts`):
   - Buat fungsi untuk generate `Access Token` (expired 15m) dan `Refresh Token` (expired 7d).
   - Buat fungsi untuk verify token.

5. Buat Auth Controller & Routes (`backend/src/controllers/authController.ts` & `backend/src/routes/authRoutes.ts`):
   - `POST /api/auth/register`: Menerima email, password, name. Hash password dengan bcrypt, simpan ke tabel `karuna_users` (gunakan `TABLES.USERS`).
   - `POST /api/auth/login`: Validasi email & password. Buat Access Token & Refresh Token. Simpan Refresh Token di tabel `karuna_refresh_tokens` (gunakan `TABLES.REFRESH_TOKENS`) dan set di `HttpOnly Cookie`. Kirim Access Token di response body.
   - `POST /api/auth/refresh`: Membaca Refresh Token dari Cookie, validasi ke tabel `karuna_refresh_tokens`, lalu buatkan Access Token baru.
   - `POST /api/auth/logout`: Hapus Refresh Token dari tabel `karuna_refresh_tokens` dan bersihkan cookie.

6. Buat Auth Middleware (`backend/src/middlewares/authMiddleware.ts`):
   - Middleware untuk memverifikasi Access Token dari header `Authorization: Bearer <token>`.

7. Daftarkan `authRoutes` di `backend/src/app.ts` pada path `/api/auth`.

---

### 📝 Prompt #04 - Setup Client API, Auth Context & Halaman UI Login/Register
**Target:** Folder `frontend/`  
**Model AI Recommendation:** Gemini Flash (Low Tier)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Tugasmu adalah membuat sistem autentikasi lengkap di folder `frontend/` (Next.js App Router).

Langkah pengerjaan:

1. Buat file `frontend/.env.local`:
   NEXT_PUBLIC_API_URL=http://localhost:5000/api

2. Install dependensi HTTP client & helper icons di `frontend/`:
   - `axios` dan `lucide-react` (untuk ikon UI sederhana).

3. Buat API Client (`frontend/src/lib/api.ts`):
   - Inisialisasi `axios` instance dengan `baseURL` dari `process.env.NEXT_PUBLIC_API_URL`.
   - Set `withCredentials: true` agar HttpOnly Cookie (Refresh Token) otomatis terkirim.
   - Tambahkan Interceptor Respon: Jika mendapat status `401` (Unauth), otomatis panggil endpoint `POST /auth/refresh`. Jika berhasil, lakukan retry request utama. Jika gagal refresh, redirect user ke `/login`.

4. Buat Auth Context (`frontend/src/context/AuthContext.tsx`):
   - Sediakan state `user` dan `loading`.
   - Sediakan fungsi `login(email, password)`, `register(email, password, name)`, dan `logout()`.
   - Saat komponen di-mount, lakukan pengecekan status login awal.
   - Bungkus komponen utama di `frontend/src/app/layout.tsx` menggunakan `AuthProvider`.

5. Buat Halaman Auth (UI Tailwind CSS):
   - `frontend/src/app/register/page.tsx`: Form pendaftaran (Name, Email, Password) dengan penanganan error & loading state.
   - `frontend/src/app/login/page.tsx`: Form login (Email, Password) dengan navigasi otomatis ke `/dashboard` setelah sukses.

6. Buat Halaman Protected Dashboard (`frontend/src/app/dashboard/page.tsx`):
   - Tampilkan informasi user yang sedang login.
   - Sediakan tombol "Logout".
   - Jika user belum login/unauthenticated, alihkan (*redirect*) secara otomatis ke halaman `/login`.



### 📝 Prompt #05 - Inisialisasi shadcn/ui & Upgrade UI Dashboard
**Target:** Folder `frontend/`  
**Model AI Recommendation:** Gemini Flash (Low Tier)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Tugasmu adalah mengonfigurasi `shadcn/ui` dan memperbarui tampilan `frontend/src/app/dashboard/page.tsx` menggunakan komponen shadcn.

Langkah pengerjaan:

1. Install dependensi pendukung di `frontend/`:
   - `clsx`
   - `tailwind-merge`
   - `class-variance-authority`
   - `lucide-react`

2. Pastikan file `frontend/tsconfig.json` memiliki path alias:
   ```json
   "compilerOptions": {
     "baseUrl": ".",
     "paths": {
       "@/*": ["./src/*"]
     }
   }


3. Buat file helper `frontend/src/lib/utils.ts`:
```typescript
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

```


4. Buat file `frontend/components.json` di root folder `frontend/`:
```json
{
  "$schema": "[https://ui.shadcn.com/schema.json](https://ui.shadcn.com/schema.json)",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}

```


5. Buat komponen dasar `shadcn/ui` secara manual di folder `frontend/src/components/ui/`:
* `button.tsx`: Gunakan `class-variance-authority` untuk mendukung varian `default`, `destructive`, `outline`, `ghost`, `link`.
* `card.tsx`: Sertakan komponen `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
* `input.tsx`: Komponen input ter-styling Tailwind dengan `cn()`.
* `avatar.tsx`: Komponen avatar profil sederhana.


6. Refactor Halaman Dashboard (`frontend/src/app/dashboard/page.tsx`):
* Gunakan komponen `Card`, `Button`, `Avatar`, dan ikon dari `lucide-react`.
* Buat tampilan dashboard modern dengan Header (salam pengawas/nama user, tombol Logout), Card Statistik Ringkas (Status Akun, Role, Last Login), dan Container Konten Utama.



JANGAN mengubah logic `AuthContext` atau API Client di `src/lib/api.ts`. Fokus HANYA pada setup UI `shadcn/ui` dan tampilan Dashboard.

```

---

### 📝 Prompt #06 - Proteksi Halaman Guest (/login & /register)
**Target:** Folder `frontend/`  
**Model AI Recommendation:** Gemini Flash (Low Tier)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Tugasmu adalah mencegah user yang SUDAH LOGIN untuk mengakses halaman `/login` dan `/register`. Jika user yang sudah login mengakses kedua halaman tersebut, alihkan (*redirect*) secara otomatis ke `/dashboard`.

Langkah pengerjaan:

1. Buat Komponen `GuestGuard` (`frontend/src/components/GuestGuard.tsx`):
   - Komponen ini menerima `children` (React.ReactNode).
   - Gunakan `useAuth()` dari `AuthContext` untuk mendapatkan state `user` dan `loading`.
   - Gunakan `useRouter()` dari `next/navigation`.
   - Gunakan `useEffect`: Jika `!loading` dan `user` ADA (user sudah login), panggil `router.replace('/dashboard')`.
   - Saat `loading` masih `true`, tampilkan UI loading sederhana (misal spinner/layar muat) agar form login tidak muncul sekejap (*flash of unauthenticated content*).
   - Jika `!loading` dan `user` TIDAK ADA (guest), tampilkan `children`.

2. Bungkus Halaman Auth dengan `GuestGuard`:
   - Di `frontend/src/app/login/page.tsx`, bungkus isi komponen halaman dengan `<GuestGuard> ... </GuestGuard>`.
   - Di `frontend/src/app/register/page.tsx`, bungkus isi komponen halaman dengan `<GuestGuard> ... </GuestGuard>`.

JANGAN mengubah logic backend atau halaman `/dashboard`. Fokus HANYA pada pembatasan akses halaman `/login` dan `/register`.


---

### 📝 Prompt #07 - Setup Layout Dashboard Modular (Sidebar & Header Navigasi)
**Target:** Folder `frontend/`  
**Model AI Recommendation:** Gemini Flash (Low Tier)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Tugasmu adalah membuat sistem Layout Modular untuk area Dashboard di folder `frontend/` (Next.js App Router).

Langkah pengerjaan:

1. Buat Komponen UI Dropdown Menu (`frontend/src/components/ui/dropdown-menu.tsx`):
   - Buat komponen dropdown menu sederhana menggunakan Tailwind CSS dan `lucide-react` untuk menampung menu profil & tombol logout.

2. Buat Komponen Sidebar (`frontend/src/components/dashboard/Sidebar.tsx`):
   - Komponen navigasi samping (collapsible/responsive friendly).
   - Buat menu navigasi: 
     - 📊 Dashboard (`/dashboard`)
     - 👤 Profil Saya (`/dashboard/profile`)
     - ⚙️ Pengaturan (`/dashboard/settings`)
   - Tandai menu yang sedang aktif berdasarkan path URL saat ini (`usePathname`).

3. Buat Komponen Header (`frontend/src/components/dashboard/Header.tsx`):
   - Menampilkan judul halaman dinamis.
   - Menampilkan User Profile Card di pojok kanan (Avatar, Nama User, dan Dropdown yang berisi tombol Logout).

4. Buat Next.js Layout (`frontend/src/app/dashboard/layout.tsx`):
   - Bungkus semua rute di bawah `/dashboard` dengan `Sidebar` di sebelah kiri dan `Header` di atas.
   - Sediakan area `<main>` tempat `children` akan dirender.
   - Terapkan proteksi Auth Guard: jika user belum login, alihkan otomatis ke `/login`.

5. Merapikan Halaman Dashboard Utama (`frontend/src/app/dashboard/page.tsx`):
   - Ubah isi `page.tsx` menjadi ringkasan statistik (misal: Card Selamat Datang, Card Status Sistem, dan Quick Action Cards) tanpa perlu mengulang komponen Header/Sidebar secara manual.

JANGAN mengubah logic `backend` atau file `.env`. Fokus HANYA pada pembentukan struktur Layout Dashboard di frontend.