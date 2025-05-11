# Setup Domain untuk Aplikasi Node.js di VPS

Panduan ini menjelaskan cara menghubungkan domain `spotify.xbotzlauncher.biz.id` ke aplikasi Node.js yang berjalan di VPS pada port `3000`.

## 🔧 1. Arahkan Domain ke IP VPS

Masuk ke panel pengelolaan domain Anda (misalnya Niagahoster, Domainesia, Cloudflare, dll), lalu tambahkan **A record** berikut:

- **Name (Host)**: `class-viii`
- **Type**: `A`
- **Value**: `206.×××.××.××`
- **TTL**: Default atau 300 detik

Setelah disimpan, tunggu propagasi DNS selama 5–30 menit.

**Cek status DNS:**

```bash
dig spotify.xbotzlauncher.biz.id
```

## 🌐 2. Konfigurasi NGINX sebagai Reverse Proxy

Agar domain bisa diakses tanpa menyertakan port :`3000`, gunakan NGINX sebagai reverse proxy.

# a. Instal NGINX (jika belum)

```bash
sudo apt update
sudo apt install nginx
```

# b. Buat Server Block

```bash
sudo nano /etc/nginx/sites-available/spotify.xbotzlauncher.biz.id
```

Isi dengan konfigurasi berikut:

```bash
server {
    listen 80;
    server_name spotify.xbotzlauncher.biz.id;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

# c. Aktifkan Konfigurasi

```bash
sudo ln -s /etc/nginx/sites-available/spotify.xbotzlauncher.biz.id /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Setelah ini, domain `http://spotify.xbotzlauncher.biz.id` akan diarahkan ke aplikasi Node.js.

## 🔒 3. (Opsional) Tambahkan HTTPS dengan Let's Encrypt

Untuk mengamankan koneksi, gunakan Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d spotify.xbotzlauncher.biz.id
```

Ikuti instruksi untuk menyelesaikan konfigurasi SSL.

Setelah sukses, domain dapat diakses melalui:

`https://spotify.xbotzlauncher.biz.id`

## ✅ 4. Verifikasi Aplikasi

Pastikan aplikasi Node.js Anda berjalan di port `3001`. Gunakan perintah berikut untuk memastikan:

```bash
curl http://localhost:3000
```

Jika mendapatkan respons yang diharapkan, maka aplikasi berjalan dengan baik.
