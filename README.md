# Aplikasi POS Kasir = Cashier

Aplikasi ini dibuat menggunakan NestJS, React (Next.js), PostgreSQL (Prisma), dan Tailwind CSS. Berfungsi untuk manajemen kasir toko ritel kecil-menengah.

Tujuan aplikasi ini dibuat adalah untuk manajemen produk, keranjang belanja interaktif, proses checkout tunai dengan kalkulasi otomatis di sisi server, serta riwayat transaksi.

---

## Features

### Authentication & Security

- JWT-based Authentication
- User Registration & Login
- Protected Routes (Frontend & Backend)

Link registrasi diakses tanpa menggunakan button dan hanya diakses dengan menggunkan link yang hanya diketahui oleh pemilik.

### Dashboard Information

- Mendapatkan Laporan harian seperti total penjualan hari ini, jumlah transaksi, produk terlaris, produk stok tipis (belum terimplementasi)

### Product Management

- CRUD Produk (Nama, Kategori, Harga, Stok, SKU, Gambar(dalam bentuk link))
- Pengurangan stok otomatis ketika transaksi berhasil dilakukan
- Search produk menggunakan Nama atau SKU

### Cart & Checkout

- Tambah/Kurang item di keranjang
- Server-side Calculation: Subtotal dan total dihitung di sisi server untuk mencegah manipulasi data dari sisi klien
- Jika produk sudah ada di keranjang, qty produk otomatis ditambahkan ketika user lupa kalau item sudah ada di keranjang
- Proses checkout tunai (Input nominal bayar → Kalkulasi kembalian → Simpan record)

### Transaction History

- List semua riwayat transaksi yang telah selesai
- Detail transaksi (Produk yang dibeli, harga satuan snapshot, total, uang bayar, kembalian, waktu transaksi)
- Endpoint khusus untuk detail struk/receipt

---

## Tech Stack

| Tech | Description |
|------|------------|
| NestJS 11 (TypeScript) | Backend API Framework |
| Next.js (React) | Frontend Web Application |
| Tailwind CSS | Frontend Styling |
| Axios | API Handler Frontend |
| PostgreSQL | Relational Database |
| Prisma 7 | Object-Relational Mapping (ORM) |
| JWT, bcrypt, Passport | Authentication & Security |
| class-validator | Request Payload Validation |
| Jest & Supertest | Unit & E2E Testing Framework |

---

# Technical Reasoning & Architecture

Penilaian utama proyek ini terletak pada alasan di balik pengambilan keputusan teknis. Berikut adalah asumsi dan desain sistem yang diterapkan:

## 1. Kenapa Memilih REST API?

REST API lebih familiar untuk digunakan saya sendiri, selain itu dipilih karena sangat fleksibel.

Sehingga aplikasi ini bisa diexpand ke berbagai platform (iOS/android jika perlu)

Proses testing yang mudah menggunakan Postman.

---

## 2. Desain Database & Snapshot Pricing

### Kenapa menyimpan `price` di dalam tabel `transaction_details`?

Harga produk di tabel `products` bisa berubah karena update harga.
Oleh karena itu, saya simpan salinan harga ke `transaction_details` saat checkout, agar ketika harga pada `products` berubah, maka transaksi yang sudah dilakukan tetap memiliki harga pada saat transaksi dilakukan.

Jika harga tidak di-snapshot, maka struk bulan kemarin pasti ikut berubah ketika harga produk dinaikkan hari ini.

### Trade-off Tracking Stok
Stok dilakukan secara direct decrement pada kolom `qty` di tabel `products`.

**Kelebihan:**

- Sangat cepat
- Implementasi sederhana

**Kekurangan:**
- Kalau ada sistem manajemen pendataan produk masuk dan produk keluar, perlu ada perubahan logika mengurangan stok.

Menurut saya, logika seperti ini pas kalau untuk ritel kecil-menengah.
---

## 3. Clean Code / Separation of Concerns

Backend NestJS :

### Controller

- Tidak ada business logic
- Hanya enerima HTTP Request
- Validasi payload menggunakan DTO & class-validator
- Mengembalikan HTTP Response

### Service

- Berisi logika bisnis (business logic)
- Mengelola kalkulasi total transaksi
- Running ORM (Prisma)
- Service tidak berinteraksi langsung dengan HTTP Req/Res

---

## 4. Handling Race Conditions (Stok Habis Saat Checkout)

Ketika user gagal checkout karena stok habis yang tiba-tiba, maka salah satu yang checkout lebih lambat akan digagalkan dan rollback transaksi.

- Semua proses berhasil → commit
- Salah satu proses gagal → rollback seluruh transaksi

---

# Project Structure

```text
pos-kasir/
├── backend-cashier/         # NestJS Application
│   ├── prisma/               # Database schema & migrations
│   ├── src/
│   │   ├── auth/             # Authentication Module
│   │   ├── cart/             # Shopping Cart Module
│   │   ├── file/             # File Handling Module
│   │   ├── generated/prisma/ # Prisma Generated Client 
│   │   ├── prisma/           # Prisma DB Service
│   │   ├── products/         # Products CRUD Module
│   │   ├── saveFile/         # Save File Utility Module 
│   │   ├── transaction/      # Checkout & History Module
│   ├── test/                 # E2E Tests (belum dicoba)
│   ├── docker-compose.yml    # PostgreSQL Docker configuration
│   ├── .env                  # Environment Variables
│   ├── .env-example          
│   └── package.json
│
├── frontend-cashiers/                      # Next.js Frontend Application
│   ├── src/
│   │   └── app/
│   │       ├── (dashboardLayout)/ # Protected Dashboard Layout
│   │       ├── auth/              # Authentication Pages
│   │       └── layout.tsx         # Root Application Layout
│   │
│   ├── public/                    # Static Assets 
│   ├── components/                # UI Components
│   ├── services/                  # API Service Layer (Axios)
│   ├── hooks/                     # Custom Hooks
│   ├── lib/                       # Shared Utilities & Helpers
│   ├── .env.example               # Environment Variables
│   ├── tailwind.config.ts         # Tailwind CSS Configuration
│   ├── next.config.ts             # Next.js Configuration
│   └── package.json
│
└── README.md                      # Project Documentation
```

Keterangan : 
- Folder saveFile tadinya untuk simpan gambar yang diupload ke backend hanya sementara, karena logic upload gambar belum selesai jadi masih kosong.
- Pada frontend, semua view dashboard, cart, products, dll dimasukan ke folder (dashboardLayout).

File struktur modul seperti ini karena ketika pertama kali ikut tutorial membuat auth, tutor membungkus komponen-komponen modul menjadi satu module, sehingga ketika ada error atau update, mencari codenya akan lebih mudah.

```text            
├── auth/                   # Authentication Module
│   │   └── dto/                   # Data Validation
│   ├── auth.controller.ts         # Controller 
│   ├── auth.module.ts             # Modul
│   ├── auth.service.ts            # Service
```

sumber : YT : https://www.youtube.com/watch?v=t0OXttCeufQ

---

# Environment Variables

## Backend (`backend/.env`)

```env
# PostgreSQL Container Info
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=db_cashier
POSTGRES_PORT=5433 //(default 5432)

# Prisma Database URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/db_cashier?schema=public

# Security (JWT)
JWT_SECRET="secret"

# Path Image
IMAGE_PATH=/images
```

## Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

---

# How to Run

## 1. Database Setup

Pastikan PostgreSQL sudah terinstall dan berjalan.

Running PostgreSQL Docker Container:

```bash
cd backend-cashier

docker-compose up
```

Buat database (jika sudah ada PostgreSQL):

```sql
CREATE DATABASE pos_kasir;
```

---

## 2. Run Backend (NestJS)

```bash
cd backend

npm install

npx prisma migrate dev --name init

npm run start:dev
```

Backend berjalan di:

```text
http://localhost:3000
```

---

## 3. Run Frontend (Next.js)

Update code package.json:

```json
"scripts": {
    "dev": "next dev -p 3001", //ubah ini agar port tidak conflict dengan BE
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
}
```

Buka terminal baru:

```bash
cd frontend-cashiers

npm install

npm run dev
```

Frontend berjalan di:

```text
http://localhost:3001
```

---
## Frontend Journey

1. Authentication
   - Saat pertama kali buka halaman, user langsung diarahkan ke halaman login

2. Dashboard & Manajemen Produk
   - Menampilkan semua produk
   - Menampilkan informasi penjualan hari ini, jumlah transaksi, produk terlaris, produk stok tipis
   - Menambahkan produk ke keranjang dengan qty default 1 (qty bisa dirubah)
   - Mencari produk berdasarkan Nama atau SKU
   - Mengedit informasi produk

3. Keranjang
   - Menampilkan semua produk di keranjang
   - Mengubah qty item di keranjang
   - Menghapus item di keranjang
   - Tombol checkout diarahkan ke halaman checkout

4. Checkout
   - Menampilkan semua produk di keranjang
   - Menghitung total belanja
   - Tombol checkout diarahkan ke halaman riwayat transaksi

5. Riwayat Transaksi
   - Menampilkan semua riwayat transaksi
   - Mencetak struk belanja

---

## Backend Journey

1. Authentication
   - user -> register
   - user -> login- > return JWT Access Token

2. Manajemen Produk
   - user -> get all product -> return all product
   - user -> get product by id -> return product
   - user -> get product by name -> return product
   - user -> create product -> return product
   - user -> update product -> return product
   - user -> delete product -> return product

3. Keranjang
   - user -> get all cart -> return all cart
   - user -> create cart -> return cart
   - user -> update cart -> return cart
   - user -> delete cart -> return cart

4. Checkout
   - user -> create transaction -> return transaction
   - user -> get all transaction -> return all transaction
   - user -> get transaction by id -> return transaction

5. Riwayat Transaksi
   - user -> get all transaction -> return all transaction

---

## Database Schema
Relational database schema: https://dbdiagram.io/d/Cashier-6a1bec8ef15b4b04523ab5e9

[Database Schema](./db%20schema.jpg)





---
# API Contract (REST API)



> **Catatan:** Semua endpoint dengan status **Auth = Yes** wajib input di header:

```http
Authorization: Bearer <token>
```
## Auth

| Method | Endpoint | Description | Auth |
|----------|----------|----------|----------|
| POST | `/auth/register` | Membuat akun baru (Hidden Route) | No |
| POST | `/auth/login` | Auth user & get JWT Access Token | No |


---

Asumsi : 
- Ketika hit Dashboard, user langsung diarahkan ke halaman login.
- Pendaftaran akun baru hanya bisa dilakukan dengan link yang hanya diketahui oleh pemilik (Frontend), sehingga tidak perlu menggunakan button untuk pendaftaran akun baru.

## Products

| Method | Endpoint | Description | Auth |
|----------|----------|----------|----------|
| GET | `/product` | Mengambil semua list produk | Yes |
| GET | `/product/:id` | Mengambil detail produk berdasarkan ID | Yes |
| GET | `/product/search/:name` | Mencari produk berdasarkan nama | Yes |
| POST | `/product/add` | Membuat produk baru | Yes |
| PATCH | `/product/:id` | Mengupdate data produk | Yes |
| DELETE | `/product/:id` | Menghapus produk | Yes |

---

Asumsi :
- Update produk hanya menggunakan PATCH karena sudah ada logika untuk mengurangi stok otomatis ketika transaksi berhasil dilakukan.

## Cart

| Method | Endpoint | Description | Auth |
|----------|----------|----------|----------|
| GET | `/cart/:userId` | Mengambil isi keranjang user | Yes |
| POST | `/cart/:productId` | Menambah produk ke keranjang | Yes |
| PATCH | `/cart/:id` | Mengubah quantity item | Yes |
| DELETE | `/cart/:id` | Menghapus item keranjang | Yes |

---
Asumsi :
- Button untuk mengurangi qty item ada pada card item di halaman keranjang, sehingga api menggunakan `/id` = `cartId`

## Transaction & Checkout

| Method | Endpoint | Description | Auth |
|----------|----------|----------|----------|
| POST | `/transaction` | Checkout, pembayaran, hitung kembalian, mengurangi stok | Yes |
| GET | `/transaction` | Mengambil seluruh riwayat transaksi | Yes |
| GET | `/transaction/:id` | Detail transaksi / untuk preview dan cetak receipt | Yes |
---
Asumsi :
- User membuka page checkout di halaman keranjang. Kemudian user input uang bayar dan klik tombol `Checkout`. Bagian ini akan melakukan hitung kembalian dan mengurangi stok otomatis kemudian redirect ke halaman riwayat transaksi dengan `id` transaksi.

---
## Blocker

Pada saat mengerjakan proyek ini, ada beberapa blocker yang terjadi:
1. Bahasa pemrograman framework yang dipakai belum saya kuasai jadi perlu waktu untuk mempelajari.
2. Error code yang dialami agak sulit diperbaiki karena perlu referensi dari internet.
3. Pengerjaan Backend agak lama karena perlu memahami dan membuat business logic.
4. Tutorial tidak ada yang spesifik sama dengan apa yang dikerjakan jadi perlu waktu untuk memahami dan mempelajari.
5. Selama pengembangan, banyak revisi yang diperlukan seperti update kolom atau pembuatan tabel baru.
6. Flow data dari API backend ke frontend belum saya kuasai jadi perlu waktu untuk mempelajari.
7. Error pada pengerjaan frontend sangat sulit diperbaiki karena saya belum selesai mengikuti tutorial untuk 1 business logic (authentication).
8. Jika ada waktu lebih, project ini bisa saya selesaikan.

## Flow Pengerjaan

1. Mempelajari dan memahami case studi POS Kasir.
2. Menyusun asumsi, design, api contract, user action, flow data, flow user dan flow backend.
3. Mempelajari, memahami dan install framework NestJS dan library
4. Install database PostgreSQL dan migrasi ke Prisma.
5. Membuat Auth Module (dengan tutorial) dan testing Postman. (fix bug)
6. Membuat CRUD Product, Cart, Transaction Module dan testing Postman. (fix bug)
7. Membuat File Upload Module. (tidak selesai)

8. Lanjut membuat Frontend.
9. Belajar Framework ReactJS(NextJS) + TailwindCSS, install libs.
---
10. Membuat Frontend (tidak selesai)

Rencananya setelah Backend selesai, akan membuat Frontend.