import os
import time
import gc
import numpy as np
from scipy.sparse.linalg import svds
from flask import Flask, render_template, request, jsonify
from PIL import Image
from werkzeug.utils import secure_filename

# Import modul pencocokan wajah bawaan Anda
import model.eigenface as ef

app = Flask(__name__, template_folder='templates', static_folder='static')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
PROCESSED_FOLDER = os.path.join(BASE_DIR, "static", "processed")

# Memastikan direktori penyimpanan selalu tersedia di lingkungan Render
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

def hitung_pca_core(matrix, n_comp):
    """ 
    Inti komputasi PCA menggunakan Partial SVD (scipy).
    10x lebih hemat memori karena tidak menghitung seluruh komponen.
    """
    h, w = matrix.shape
    rata_rata = np.mean(matrix, axis=0)
    centered = (matrix - rata_rata).astype(np.float32)
    
    # svds mensyaratkan k (n_comp) lebih kecil dari min(w, h)
    n = min(n_comp, w-1, h-1)
    if n < 1: n = 1
    
    # Hanya hitung ruang SVD yang diperlukan
    U, S, Vt = svds(centered, k=n)
    
    # scp.sparse.linalg.svds mengurutkan nilai dari terkecil ke terbesar,
    # urutan perlu dibalik agar komponen utama (PCA) ada di depan
    U = U[:, ::-1]
    S = S[::-1]
    Vt = Vt[::-1, :]
    
    S_diag = np.diag(S)
    reconstructed = np.dot(U, np.dot(S_diag, Vt)) + rata_rata
    
    # Hapus variabel matriks besar dari RAM secara paksa
    del centered, U, S, Vt, S_diag
    gc.collect()
    
    return np.clip(reconstructed, 0, 255).astype(np.uint8)

def proses_pca_grayscale(img_arr, n_components):
    return hitung_pca_core(img_arr, n_components)

def proses_pca_rgb(img_arr, n_components):
    """ Memisahkan masing-masing channel warna (R, G, B) sebelum dikompresi """
    r_chan = hitung_pca_core(img_arr[:, :, 0], n_components)
    g_chan = hitung_pca_core(img_arr[:, :, 1], n_components)
    b_chan = hitung_pca_core(img_arr[:, :, 2], n_components)
    return np.stack([r_chan, g_chan, b_chan], axis=2)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/process_image', methods=['POST'])
def process_image():
    try:
        n_components = int(request.form.get('n_components', 50))
        file = request.files.get('image')
        if not file: 
            return jsonify({"success": False, "error": "Berkas gambar belum dipilih"}), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Gunakan 'with' agar Pillow langsung membebaskan memori
        with Image.open(filepath) as img_original:
            lebar, tinggi = img_original.size
            MAX_RESOLUTION = 450
            if lebar > MAX_RESOLUTION or tinggi > MAX_RESOLUTION:
                img_original.thumbnail((MAX_RESOLUTION, MAX_RESOLUTION))
                img_original.save(filepath)
                lebar, tinggi = img_original.size

        ukuran_asli_kb = os.path.getsize(filepath) / 1024
        ts = int(time.time())
        
        # 1. EKSEKUSI PEMROSESAN GRAYSCALE
        with Image.open(filepath) as img:
            img_gray = img.convert('L')
            arr_gray = np.array(img_gray)
        res_gray = proses_pca_grayscale(arr_gray, n_components)
        
        file_gray_name = f"gray_{ts}.png"
        path_gray_out = os.path.join(app.config['PROCESSED_FOLDER'], file_gray_name)
        Image.fromarray(res_gray).save(path_gray_out)
        size_gray_kb = os.path.getsize(path_gray_out) / 1024

        del arr_gray, res_gray, img_gray
        gc.collect()

        # 2. EKSEKUSI PEMROSESAN RGB (WARNA)
        with Image.open(filepath) as img:
            img_rgb = img.convert('RGB')
            arr_rgb = np.array(img_rgb)
        res_rgb = proses_pca_rgb(arr_rgb, n_components)
        
        file_rgb_name = f"rgb_{ts}.png"
        path_rgb_out = os.path.join(app.config['PROCESSED_FOLDER'], file_rgb_name)
        Image.fromarray(res_rgb).save(path_rgb_out)
        size_rgb_kb = os.path.getsize(path_rgb_out) / 1024
        
        del arr_rgb, res_rgb, img_rgb
        gc.collect()

        # Pengondisian teks statistik informasi data citra kompresi
        stats_gray_msg = (
            f"Dimensi Gambar: {lebar}x{tinggi} px\n"
            f"Ukuran File Awal: {ukuran_asli_kb:.2f} KB\n"
            f"Ukuran Hasil: {size_gray_kb:.2f} KB\n"
            f"Komponen Terpilih: {n_components}"
        )

        stats_rgb_msg = (
            f"Dimensi Gambar: {lebar}x{tinggi} px\n"
            f"Ukuran File Awal: {ukuran_asli_kb:.2f} KB\n"
            f"Ukuran Hasil: {size_rgb_kb:.2f} KB\n"
            f"Komponen Terpilih: {n_components} (Per Channel)"
        )

        return jsonify({
            "success": True,
            "grayscale": f"/static/processed/{file_gray_name}",
            "rgb": f"/static/processed/{file_rgb_name}",
            "stats_gray": stats_gray_msg,
            "stats_rgb": stats_rgb_msg
        })

    except Exception as e:
        app.logger.error(f"Error pemrosesan gambar: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/compare_faces', methods=['POST'])
def compare_faces_route():
    try:
        file1 = request.files.get('baby')
        file2 = request.files.get('adult')
        
        if not file1 or not file2:
            return jsonify({"success": False, "error": "Kedua foto wajah wajib dilampirkan"}), 400
            
        p1 = os.path.join(app.config['UPLOAD_FOLDER'], "face1_" + secure_filename(file1.filename))
        p2 = os.path.join(app.config['UPLOAD_FOLDER'], "face2_" + secure_filename(file2.filename))
        
        file1.save(p1)
        file2.save(p2)
        
        sim_percentage, cosine_score, kesimpulan = ef.compare_faces(p1, p2)
        
        return jsonify({
            "success": True,
            "similarity": sim_percentage,
            "distance": cosine_score,
            "result": kesimpulan
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

if __name__ == '__main__':
    if not ef.model.is_trained:
        ef.run_training_manually()
    app.run(host='0.0.0.0', port=5000)