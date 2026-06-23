# Sistem Analisis Wajah dan Kompresi Citra (Flask Version)

Aplikasi web berbasis Python Flask yang menyediakan layanan pengolahan citra digital, mencakup teknik kompresi menggunakan Principal Component Analysis (PCA) dan deteksi kemiripan wajah berbasis Eigenface.

## Fitur Utama

- Kompresi Gambar: Mereduksi dimensi citra menggunakan algoritma PCA untuk efisiensi penyimpanan tanpa menghilangkan fitur visual utama.
- Analisis Wajah: Sistem pengenalan identitas wajah berbasis Eigenface dan Local Binary Pattern (LBP) untuk membandingkan kecocokan antar wajah.

## Struktur Proyek

- /model: Berisi logika algoritma PCA, LBP, dan model training (.pkl).
- /static: Menyimpan file aset (CSS, JS, dan gambar).
- /templates: Berisi file HTML untuk antarmuka pengguna.
- app.py: File utama aplikasi Flask.

## Instalasi dan Menjalankan Proyek

1. Clone repositori ini:
   git clone https://github.com/zurisey/web-pengolahan-citra-flask.git

2. Masuk ke direktori aplikasi:
   cd web-pengolahan-citra-flask

3. Buat dan aktifkan virtual environment:
   python -m venv env
   # Windows: .\env\Scripts\activate
   # Linux/Mac: source env/bin/activate

4. Instal dependensi:
   pip install -r requirements.txt

5. Jalankan aplikasi:
   python app.py

## Teknologi yang Digunakan

- Flask (Web Framework)
- Scikit-learn (Machine Learning Library)
- Scikit-image (Image Processing)
- OpenCV (Computer Vision)
- NumPy (Scientific Computing)