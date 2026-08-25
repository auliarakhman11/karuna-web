
### 📝 Prompt #42 - HARD FIX: Journal GET API & Next-Themes Implementation
**Target:** `app/api/reports/journals/route.ts`, `reports/journals/page.tsx`, `app/layout.tsx`, `tailwind.config.ts`
**Model AI Recommendation:** Gemini Flash / Pro (High Tier recommended for debugging)

---
BANGKITKAN PROMPT DI BAWAH INI KE AGENT:
---

Terdapat BUG KRITIKAL dari pekerjaan sebelumnya. Jurnal Umum tidak tampil dan Dark Mode gagal berfungsi. Lakukan perbaikan spesifik dengan langkah-langkah wajib berikut:

### 1. FIX BUKU JURNAL UMUM (API & FRONTEND TAMPILAN)
Masalahnya ada pada endpoint GET dan mapping tabel di frontend.
- **Buat/Perbaiki API Endpoint (`app/api/reports/journals/route.ts`):**
  Buat fungsi GET yang secara eksplisit mengambil data dari Supabase:
  ```typescript
  import { NextResponse } from 'next/server';
  import { createClient } from '@/utils/supabase/server'; // Sesuaikan path supabase auth

  export async function GET(request: Request) {
    const supabase = createClient();
    // Ambil param tanggal jika ada
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase.from('karuna_journals').select('*').order('created_at', { ascending: false });
    
    if (startDate && endDate) {
       query = query.gte('journal_date', startDate).lte('journal_date', endDate);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

* **Perbaiki Frontend (`reports/journals/page.tsx`):**
Pastikan ada `useEffect` yang melakukan `fetch('/api/reports/journals')`.
Pastikan tabel me-render data menggunakan `map()`:
`{journals.map((j) => ( <tr key={j.id}>...<td>{j.account_name}</td>...</tr> ))}`.
Jika data kosong, tampilkan teks: "Data jurnal tidak ditemukan".

### 2. FIX DARK / LIGHT MODE DENGAN NEXT-THEMES

Tema gagal karena tidak ditangani sesuai standar React/Next.js.

* **Langkah 1:** Pastikan `next-themes` sudah ter-install di `package.json` (`npm install next-themes`).
* **Langkah 2 (`tailwind.config.ts`):**
Wajib tambahkan konfigurasi ini di dalam file tailwind:
`darkMode: ["class"],`
* **Langkah 3 (`app/layout.tsx` atau `providers.tsx`):**
Bungkus `{children}` dengan `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>`.
* **Langkah 4 (Tombol Toggle di Settings / Navbar):**
Gunakan hook dari `next-themes` untuk tombolnya:
```tsx
"use client"
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Toggle Tema (Saat ini: {theme})
    </button>
  )
}

```


Terapkan komponen ini di halaman Pengaturan agar user bisa memindahkannya, dan pastikan warna background class Tailwind menggunakan prefix `dark:` (contoh: `bg-white dark:bg-gray-900`).

```

