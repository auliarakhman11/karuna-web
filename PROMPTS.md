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

---

### 📝 Prompt #08 - Fitur Edit Profil & Ubah Password (Backend & Frontend)
**Target:** Folder `backend/` & `frontend/`  
**Model AI Recommendation:** Gemini Flash (Low Tier)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Tugasmu adalah membuat fitur Edit Profil dan Ubah Password lengkap dari sisi Backend dan Frontend.

Langkah pengerjaan:

1. Update Backend (`backend/src/controllers/authController.ts` & `backend/src/routes/authRoutes.ts`):
   - Buat endpoint `PUT /api/auth/profile`:
     - Membutuhkan `authMiddleware`.
     - Menerima `name` dari body request.
     - Update nama user di tabel `karuna_users` berdasarkan `req.user.id`.
     - Kembalikan data user yang terbaru.
   - Buat endpoint `PUT /api/auth/change-password`:
     - Membutuhkan `authMiddleware`.
     - Menerima `oldPassword` dan `newPassword`.
     - Cek password lama dengan `bcrypt.compare()`. Jika salah, kembalikan status `400` ("Password lama tidak sesuai").
     - Hash `newPassword` lalu update di tabel `karuna_users`.

2. Update Frontend API Client (`frontend/src/lib/api.ts`):
   - Tambahkan fungsi pemanggilan endpoint:
     - `updateProfile(name: string)`
     - `changePassword(data: { oldPassword, newPassword })`

3. Update Auth Context (`frontend/src/context/AuthContext.tsx`):
   - Tambahkan fungsi `updateProfileState(updatedUser)` untuk memperbarui state `user` secara langsung di memory aplikasi tanpa perlu reload.

4. Buat Halaman Profil UI (`frontend/src/app/dashboard/profile/page.tsx`):
   - Gunakan komponen `shadcn/ui` (`Card`, `Input`, `Button`).
   - Buat 2 section/form terpisah:
     1. **Form Informasi Profil:** Menampilkan email (disabled/read-only) dan input Nama Lengkap + Tombol "Simpan Perubahan".
     2. **Form Ubah Password:** Input Password Saat Ini, Password Baru, dan Konfirmasi Password Baru + Tombol "Ubah Password".
   - Tampilkan alert/pesan sukses atau error di bawah form saat submit.

JANGAN mengubah struktur tabel database di Supabase.


---

### 📝 Prompt #09 - Modul Inventaris Toko Bangunan & Kayu (Kategori Dinamis & CRUD Items)
**Target:** Folder `backend/` & `frontend/`  
**Model AI Recommendation:** Gemini Flash (Low Tier)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Tugasmu adalah membuat modul Kategori dan Inventaris Barang khusus Toko Bangunan & Kayu dari sisi Backend dan Frontend.

Langkah pengerjaan:

1. Update `backend/src/utils/tables.ts`:
   - Tambahkan `CATEGORIES: 'karuna_categories'` dan `ITEMS: 'karuna_items'` ke object `TABLES`.

2. Buat Backend Endpoint Kategori & Items (`backend/src/routes/` & `backend/src/controllers/`):
   - `GET /api/categories`: Mengambil semua daftar kategori dari `karuna_categories` untuk isi Dropdown di frontend.
   - `GET /api/items`: Mengambil daftar barang (join dengan `karuna_categories` untuk mengambil nama kategori). Filter berdasarkan `user_id`.
   - `POST /api/items`: Menambah barang baru (menerima `name`, `category_id`, `unit`, `price`, `stock`, `description`).
   - `PUT /api/items/:id`: Mengubah data barang.
   - `DELETE /api/items/:id`: Menghapus barang.

3. Update Frontend API Client (`frontend/src/lib/api.ts`):
   - Tambahkan fungsi pendukung untuk fetch categories dan CRUD items.

4. Buat Halaman Manajemen Stok Bangunan (`frontend/src/app/dashboard/items/page.tsx`):
   - Gunakan komponen `shadcn/ui` (`Table`, `Card`, `Button`, `Input`, `Select`, `Dialog`, `Badge`).
   - Form Modal Tambah/Edit Barang dengan placeholder khusus toko bangunan:
     - **Nama Barang**: Ex: `"Kayu Meranti 4x6 x 4m"`, `"Semen Tiga Roda 50kg"`, `"Besi Beton 10mm SNI"`
     - **Kategori**: Menggunakan Dropdown `<Select>` yang mengambil data dari API `GET /api/categories`.
     - **Satuan**: Dropdown Pilihan (`Batang`, `Lembar`, `Sak`, `Kg`, `Meter`, `Pcs`, `Roll`, `Dus`).
     - **Harga Jual (Rp)**: Input angka dengan placeholder `"50000"`.
     - **Stok**: Input angka dengan placeholder `"100"`.
     - **Deskripsi**: Textarea opsional.
   - Tampilkan tabel barang yang memuat kolom: Nama Barang, Kategori, Satuan, Harga Jual (format Rupiah `Rp`), Stok, dan Tombol Aksi (Edit & Hapus).

5. Update Sidebar Navigasi (`frontend/src/components/dashboard/Sidebar.tsx`):
   - Tambahkan menu **🪵 Stok & Kayu** mengarah ke `/dashboard/items`.

JANGAN mengubah logic autentikasi JWT.

---

### 📝 Prompt Fix - Perbaikan Category Fetching & Dropdown Select
**Target:** Folder `backend/` & `frontend/`  
**Model AI Recommendation:** Gemini Flash (Low Tier)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Tugasmu adalah memperbaiki fitur pendaftaran kategori agar muncul di Dropdown Form Tambah/Edit Barang.

Langkah pengerjaan:

1. Di Backend (`backend/src/controllers/itemController.ts` & `backend/src/routes/itemRoutes.ts`):
   - Pastikan ada endpoint `GET /api/categories` (atau `GET /api/items/categories`).
   - Query mengambil seluruh data dari tabel `karuna_categories` diurutkan berdasarkan `name ASC`.
   - Kembalikan array JSON: `[{ id: "...", name: "..." }]`.

2. Di Frontend API Client (`frontend/src/lib/api.ts`):
   - Tambahkan fungsi `getCategories()` yang memanggil endpoint `GET /api/categories`.

3. Di Halaman Items (`frontend/src/app/dashboard/items/page.tsx`):
   - Tambahkan `useEffect` saat halaman/modal dimuat untuk memanggil `getCategories()`.
   - Simpan hasil kategori ke dalam state React (`const [categories, setCategories] = useState([])`).
   - Map data `categories` ke dalam komponen `<Select>` / `<option>` di Form Tambah/Edit Barang:
     - `value`: `category.id`
     - `label/display`: `category.name`
   - Berikan nilai default / placeholder: `"Pilih Kategori Barang"`.

   ---

### 📝 Prompt #10 - Modul CRUD Kategori & Validasi Unik Barang (Nama + Kategori)
**Target:** Folder `backend/` & `frontend/`  
**Model AI Recommendation:** Gemini Flash (Low Tier)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Tugasmu adalah membuat Modul Manajemen Kategori dan menerapkan Validasi Anti-Redudansi pada Modul Barang.

Langkah pengerjaan:

1. Update Controller & Routes Kategori (`backend/src/controllers/` & `backend/src/routes/`):
   - Tambahkan CRUD lengkap untuk Kategori:
     - `POST /api/categories`: Menambah kategori baru (terima `name`, auto-generate `slug`).
     - `PUT /api/categories/:id`: Mengubah nama kategori.
     - `DELETE /api/categories/:id`: Menghapus kategori.
   - Daftarkan route kategori secara rapi.

2. Tambahkan Validasi Unik di `itemController.ts` (`createItem` & `updateItem`):
   - Sebelum melakukan `INSERT` atau `UPDATE` ke `karuna_items`:
     1. Ambil nama barang (bersihkan spasi dengan `.trim()`) dan `category_id`.
     2. Lakukan query pengecekan ke tabel `karuna_items`:
        - Filter `user_id = req.user.id`
        - Filter `LOWER(name) = LOWER(trimmedName)`
        - Filter `category_id = categoryId` (tangani jika null)
        - Untuk `updateItem`, tambahkan penyeleksian ID: `.neq('id', itemId)`
     3. Jika data ditemukan, **BATALKAN** proses simpan dan kembalikan status HTTP `400 (Bad Request)` dengan pesan:
        `"Barang dengan nama '${name}' dan kategori yang sama sudah terdaftar!"`.

3. Buat Halaman Manajemen Kategori UI (`frontend/src/app/dashboard/categories/page.tsx`):
   - Gunakan komponen `shadcn/ui` (`Card`, `Table`, `Button`, `Input`, `Dialog`).
   - Tampilkan tabel daftar kategori beserta tombol "Tambah Kategori", "Edit", dan "Hapus".
   - Integrasikan API Client (`frontend/src/lib/api.ts`) untuk fungsi CRUD kategori.

4. Update Sidebar Navigasi (`frontend/src/components/dashboard/Sidebar.tsx`):
   - Tambahkan menu **🏷️ Kategori Barang** mengarah ke `/dashboard/categories`.

5. Update Error Handling UI Tambah/Edit Barang (`frontend/src/app/dashboard/items/page.tsx`):
   - Pastikan jika backend mengembalikan status `400` (karena nama & kategori duplikat), pesan error dari backend ditampilkan dengan jelas di dalam alert modal.

   ---

### 📝 Prompt #11 - Refactor Sidebar Navigasi dengan Group & Sub-Menu (Collapsible)
**Target:** Folder `frontend/src/components/dashboard/Sidebar.tsx`  
**Model AI Recommendation:** Gemini Flash (Low Tier)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Tugasmu adalah merefactor komponen Sidebar (`frontend/src/components/dashboard/Sidebar.tsx`) agar mendukung pengelompokan menu dengan **Sub-Menu (Collapsible Dropdown)**.

Langkah pengerjaan:

1. Buat struktur data menu yang rapi dan modular:
   ```typescript
   interface MenuItem {
     title: string;
     href?: string;
     icon?: any;
     children?: MenuItem[];
   }