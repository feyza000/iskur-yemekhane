# Canlıya Alma (Deployment) Rehberi

Bu rehber, **Anket Sistemi** projesini bir production sunucusuna nasıl kuracağınızı adım adım anlatır.

## Gereksinimler
- **Python 3.10+**
- **Node.js 18+ & npm**
- **PostgreSQL 14+**
- **Nginx** (Reverse Proxy olarak)

---

## Backend Kurulumu (Django)

1.  **Klasöre Git**
    Projeyi sunucuya çektikten sonra backend klasörüne girin:
    ```bash
    cd backend
    ```

2.  **Sanal Ortam (Virtual Environment) Oluşturma**
    Python kütüphanelerini izole etmek için venv kurun ve aktif edin:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Bağımlılıkları Yükle**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Ortam Değişkenleri (.env)**
    - Örnek dosyayı kopyalayarak gerçek `.env` dosyasını oluşturun:
      ```bash
      cp .env.example .env
      ```
    - **`.env` dosyasında şu kritik ayarları yapın:**
        - `DEBUG=False`
        - `SECRET_KEY`
        - `ALLOWED_HOSTS` (Sunucunun domain adresi. Örn: `anket.site.com`)
        - `FRONTEND_URL` (Frontend'in çalışacağı adres. Örn: `https://anket.site.com`. Şifre sıfırlama linkleri için gerekli.)

5.  **Veritabanı ve Statik Dosyalar**
    Tabloları oluşturun ve admin paneli CSS'lerini toparlayın:
    ```bash
    python manage.py migrate
    python manage.py collectstatic --noinput
    ```

6.  **Uygulamayı Başlatma (Gunicorn ile)**
    Örnek komut:
    ```bash
    gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
    ```

---

## Frontend Kurulumu (React/Vite)

1.  **Klasöre Git**
    ```bash
    cd ../frontend
    ```

2.  **Kurulum ve Ayarlar**
    ```bash
    npm install
    cp .env.example .env
    ```
    - `.env` dosyasını açın ve `VITE_API_URL` değerini backend adresiniz yapın.

3.  **Build (Derleme) İşlemi**
    Projeyi canlı ortam için derleyin:
    ```bash
    npm run build
    ```
    - Bu işlem `dist/` adında bir klasör oluşturur. Bu klasörün içindekiler sunucuya sunulacak html/css/js dosyalarıdır.

4.  **Sunum (Serve)**
    - Nginx kullanarak bu `dist/` klasörünü domainin ana dizininde (`/`) yayınlayın.
    - React "Single Page Application" olduğu için, 404 hatalarını `index.html`'e yönlendirmeniz gerekir.

---

## Nginx Konfigürasyonu (Örnek - Subdomain)

Bu proje `anket.site.com` gibi bir **subdomain** altında çalışacaksa aşağıdaki ayarı kullanın.
Ayar dosyasını `/etc/nginx/sites-available/anket` içine koyabilirsiniz:

```nginx
server {
    listen 80;
    server_name anket.site.com;

    # Frontend (React - Build dosyaları)
    # Ana dizine (/) gelen istekleri React'e gönderir
    location / {
        root /var/www/iskur-yemekhane/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend (Django API)
    # /api/ ile başlayan istekleri Gunicorn'a yönlendirir
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Statik Dosyalar (Django Admin CSS/JS vb.)
    location /django_static/ {
        alias /var/www/iskur-anket/backend/staticfiles/;
    }
}
```

## ⚠️ Kritik Güvenlik Kontrol Listesi
- [ ] Backend `.env` dosyasında `DEBUG=False` olduğundan emin olun.
- [ ] Backend `.env` içindeki `SECRET_KEY` değerini varsayılan bırakmayın, değiştirin.
- [ ] `CORS_ALLOWED_ORIGINS` ayarının sadece kendi frontend domaininize izin verdiğinden emin olun.
