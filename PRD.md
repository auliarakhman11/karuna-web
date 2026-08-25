# Product Requirements Document (PRD)
**Karuna Web - Sistem Point of Sales & Inventaris**

| Informasi | Detail |
| :--- | :--- |
| **Dokumen Versi** | 1.0 |
| **Tanggal** | 15 Agustus 2026 |
| **Disusun Oleh** | Aulia Rakhman |
| **Metodologi** | Rapid Application Development (RAD) |

---

## 1. Pendahuluan

### 1.1. Tujuan Dokumen
Dokumen ini mendefinisikan spesifikasi, fitur, aturan bisnis, dan arsitektur untuk pengembangan Karuna Web, sebuah sistem Point of Sales (POS) dan manajemen inventaris. Dokumen ini berfungsi sebagai panduan utama (*single source of truth*) selama siklus pengembangan sistem.

### 1.2. Visi Produk
Menciptakan aplikasi POS berbasis web yang responsif, cepat, dan handal untuk mengelola penjualan, pelacakan stok secara *real-time*, pencatatan hutang/piutang pelanggan, dan perhitungan laba-rugi secara presisi.

---

## 2. Arsitektur & Teknologi

*   **Frontend:** Next.js (React), Tailwind CSS, UI Components (shadcn/ui), Axios.
*   **Backend:** Node.js dengan framework Express.js.
*   **Database:** PostgreSQL (Supabase) dengan skema relasional.
*   **Deployment & Integrasi:** API berbasis REST, arsitektur Client-Server, dan integrasi eksternal untuk pengiriman struk digital (WhatsApp `wa.me`).

---

## 3. Spesifikasi Fitur Utama

### 3.1. Modul Manajemen Inventaris
*   **Master Barang & Kategori:** Pencatatan data barang meliputi SKU/Kode, Nama, Kategori, Harga Modal (HPP), Harga Jual, dan Stok.
*   **Riwayat Mutasi Stok:** Setiap penambahan atau pengurangan stok (penjualan, retur, penyesuaian) wajib dicatat ke dalam log mutasi stok untuk *audit trail*.

### 3.2. Modul Kasir (Point of Sales)
*   **Antarmuka Responsif:** Layout *split-screen* (katalog & keranjang) yang dioptimalkan untuk perangkat mobile (vertikal) dan desktop (horizontal) dengan sistem *scroll* per komponen.
*   **Metode Pembayaran:** Mendukung pembayaran Tunai, Transfer, dan Kredit (Piutang).
*   **Manajemen Struk:** Dukungan cetak struk *thermal* dan pengiriman rincian belanja digital via WhatsApp secara otomatis.

### 3.3. Modul Pelanggan & Piutang
*   **Master Pelanggan:** Manajemen entitas data pelanggan (Nama, No. Telepon/WA, Alamat).
*   **Manajemen Piutang:** Pencatatan transaksi belum lunas (Kredit) beserta tanggal jatuh tempo, serta sistem pencatatan pembayaran cicilan hingga status berubah menjadi "LUNAS".

---

## 4. Skema Database (Inti)

| Nama Tabel | Fungsi / Deskripsi Utama |
| :--- | :--- |
| **`karuna_items`** | Penyimpanan data barang (`name`, `stock`, `price`, `cost_price`, `category_id`). |
| **`karuna_sales`** | Header transaksi penjualan (`invoice_number`, `total_amount`, `payment_status`, `customer_id`, `due_date`). |
| **`karuna_sale_items`** | Detail barang yang terjual per transaksi (merekam *snapshot* `price` & `cost_price` saat transaksi terjadi). |
| **`karuna_stock_mutations`** | Log riwayat keluar-masuk stok barang beserta referensi ID transaksinya. |
| **`karuna_customers`** | Data master pelanggan untuk mendukung pendataan dan transaksi non-tunai/kredit. |
| **`karuna_debt_payments`** | Mencatat histori nominal cicilan dari transaksi piutang yang belum lunas. |

---

## 5. Aturan Bisnis (Business Rules)

*   **Kalkulasi Laba Kotor:** Dihitung berdasarkan formula `(Harga Jual - Harga Modal) * Kuantitas Terjual`. Nilai Harga Modal (`cost_price`) dikunci ke dalam tabel `sale_items` saat *checkout* terjadi untuk menjaga konsistensi laba masa lalu jika harga modal barang diubah di masa depan.
*   **Pengurangan Stok:** Validasi sisa stok dilakukan di sisi backend. Jika kuantitas transaksi melebihi stok yang tersedia, transaksi ditolak sistem.
*   **Status Pembayaran Transaksi:**
    *   `LUNAS`: Jumlah dibayar >= Total nilai transaksi.
    *   `CICILAN`: Jumlah dibayar > 0 tetapi < Total nilai transaksi.
    *   `BELUM_LUNAS`: Jumlah dibayar = 0.

---

## 6. Peta Jalan (Roadmap) Fase Pengembangan

*   **Fase 1 (Berjalan):** Pembangunan fungsi inti POS, CRUD Barang/Kategori, Transaksi Piutang, dan pencatatan Mutasi Stok berbasis *online*.
*   **Fase 2 (Mendatang):** Implementasi arsitektur *Offline-First* menggunakan IndexedDB (Dexie.js) dan sistem antrean sinkronisasi (*Background Sync*) untuk ketahanan pada kondisi tanpa internet.
*   **Fase 3:** Penyusunan *dashboard* analitik laporan keuangan dan rekap penjualan secara mendetail.