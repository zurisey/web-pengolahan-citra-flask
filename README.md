# SnapSense ⚡

SnapSense adalah aplikasi berbasis web untuk **Pengolahan Citra Digital** yang dibangun menggunakan Python Flask. Aplikasi ini dirancang untuk memproses gambar secara efisien, menyediakan fitur optimasi ukuran file (kompresi) serta analisis tingkat kemiripan wajah secara cepat dan interaktif.

---

## 🚀 Fitur Utama

1. **Optimasi & Kompresi Citra**
   - Mengurangi ukuran file gambar tanpa mengorbankan kualitas visual secara signifikan.
   - Menyediakan statistik visual perbandingan sebelum dan sesudah kompresi.

2. **Analisis Kemiripan Wajah (Face Matcher)**
   - Mendeteksi dan menganalisis wajah pada dua gambar yang diunggah.
   - Menggunakan algoritma pengolahan citra (berbasis Eigenface/PCA) untuk menghitung persentase tingkat kemiripan wajah.

3. **Antarmuka Modern & Responsif**
   - Desain UI/UX interaktif dengan fitur *Drag and Drop* untuk mempermudah pengguna mengunggah gambar.

---

## 🛠️ Teknologi yang Digunakan

- **Backend:** [Python](https://www.python.org/) & [Flask Framework](https://flask.palletsprojects.com/)
- **Pengolahan Citra:** [OpenCV (Headless Edition)](https://opencv.org/)
- **Server Produksi:** [Gunicorn](https://gunicorn.org/) (untuk deployment di cloud)
- **Frontend:** HTML5, CSS3, & Vanilla JavaScript

---

## 💻 Cara Menjalankan di Komputer Lokal (Localhost)

Jika Anda ingin menjalankan atau mengembangkan projek ini di komputer lokal, ikuti langkah-langkah berikut:

1. **Clone Repository**
```bash
   git clone [https://github.com/zurisey/web-pengolahan-citra.git](https://github.com/zurisey/web-pengolahan-citra.git)
   cd web-pengolahan-citra
