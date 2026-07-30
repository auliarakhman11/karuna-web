# Panduan Pengerjaan Proyek (AI Agent Rules)

## 1. Prinsip Utama
- Proyek terbagi menjadi dua bagian utama: `frontend/` (Next.js TS) dan `backend/` (Express TS).
- Selalu tulis kode menggunakan TypeScript yang ketat (strict mode).
- Kerjakan tugas secara bertahap dan terisolasi. JANGAN mengubah file di luar cakupan tugas.

## 2. Standar Backend (`backend/`)
- Gunakan arsitektur berlapis: `routes` -> `controllers` -> `services` -> `models`.
- Penanganan error wajib menggunakan middleware terpusat.
- Keamanan: Gunakan `HttpOnly Cookie` untuk Refresh Token dan sertakan validasi input di setiap endpoint.

## 3. Standar Frontend (`frontend/`)
- Gunakan Next.js App Router (`src/app/`).
- Komponen UI dipisah rapi di `src/components/`.
- Styling menggunakan Tailwind CSS secara konsisten.

## 4. Konvensi Database (Sangat Penting!)
- **Table Naming Prefix**: Proyek ini menggunakan prefix `karuna_` untuk SEMUA nama tabel di Supabase.
- Contoh: `karuna_users`, `karuna_refresh_tokens`, `karuna_products`, dll.
- DILARANG keras membuat tabel, query, atau skema tanpa awalan `karuna_`.
- Gunakan file konstanta `backend/src/utils/tables.ts` untuk mengelola nama-nama tabel agar tidak terjadi hardcode string.