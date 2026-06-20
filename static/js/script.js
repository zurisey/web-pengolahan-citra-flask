document.addEventListener('DOMContentLoaded', () => {
    
    /* ====================================================
       1. NAVIGASI SINGLE PAGE (SPA)
       ==================================================== */
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.app-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            item.classList.add('active');
            
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    /* ====================================================
       2. KOMPRESI: DRAG AND DROP, SLIDER, & PREVIEW INPUT
       ==================================================== */
    const dropzone = document.getElementById('dropzone-compress');
    const fileInput = document.getElementById('file-compress');
    const filenameDisplay = document.getElementById('compress-filename');
    const slider = document.getElementById('comp-slider');
    const compValDisplay = document.getElementById('comp-val');

    if (slider) {
        slider.addEventListener('input', () => compValDisplay.textContent = slider.value);
    }

    function showInputPreview(file) {
        if (!file.type.match('image.*')) return;

        let previewImg = document.getElementById('compress-input-preview');
        if (!previewImg) {
            previewImg = document.createElement('img');
            previewImg.id = 'compress-input-preview';
            previewImg.style.display = 'block';
            previewImg.style.margin = '15px auto'; 
            previewImg.style.maxWidth = '100%';
            previewImg.style.maxHeight = '180px'; 
            previewImg.style.borderRadius = '8px';
            previewImg.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            previewImg.style.objectFit = 'contain';
            
            if (filenameDisplay) {
                filenameDisplay.parentNode.insertBefore(previewImg, filenameDisplay.nextSibling);
            } else {
                dropzone.appendChild(previewImg);
            }
        }
        previewImg.src = URL.createObjectURL(file);
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if(files.length > 0) {
            fileInput.files = files;
            if (filenameDisplay) filenameDisplay.textContent = files[0].name;
            showInputPreview(files[0]); 
        }
    });

    fileInput.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            if (filenameDisplay) filenameDisplay.textContent = e.target.files[0].name;
            showInputPreview(e.target.files[0]); 
        }
    });

    /* ====================================================
       3. FETCH API: KOMPRESI & REKONSTRUKSI PCA
       ==================================================== */
    const compressForm = document.getElementById('compression-form');
    const compressResult = document.getElementById('compression-result');
    const btnCompress = document.getElementById('btn-compress');

    compressForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!fileInput.files.length) return alert("Pilih gambar terlebih dahulu!");

        btnCompress.textContent = "Memproses...";
        btnCompress.disabled = true;

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('n_components', slider ? slider.value : 50);

        try {
            const response = await fetch('/process_image', { method: 'POST', body: formData });
            const data = await response.json();

            if(data.success) {
                const ts = new Date().getTime(); 
                compressResult.style.display = 'block';
                
                compressResult.innerHTML = `
                    <h3>Hasil Analisis Kompresi</h3>
                    
                    <div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom: 25px;">
                        <div style="flex:1; min-width:250px; text-align: center;">
                            <p style="margin-bottom: 8px; font-size: 16px;"><b>Grayscale</b></p>
                            <img src="${data.grayscale}?v=${ts}" alt="Hasil Grayscale" style="width:100%; max-width: 400px; border:1px solid #ccc; border-radius:6px; box-shadow: 0 2px 5px rgba(0,0,0,0.15); margin-bottom: 12px; margin-left:auto; margin-right:auto;">
                            <a href="${data.grayscale}" download="kompresi_grayscale.png" class="btn-download">
                                Unduh Grayscale
                            </a>
                        </div>
                        
                        <div style="flex:1; min-width:250px; text-align: center;">
                            <p style="margin-bottom: 8px; font-size: 16px;"><b>Format RGB</b></p>
                            <img src="${data.rgb}?v=${ts}" alt="Hasil RGB" style="width:100%; max-width: 400px; border:1px solid #ccc; border-radius:6px; box-shadow: 0 2px 5px rgba(0,0,0,0.15); margin-bottom: 12px; margin-left:auto; margin-right:auto;">
                            <a href="${data.rgb}" download="kompresi_rgb.png" class="btn-download">
                                Unduh RGB
                            </a>
                        </div>
                    </div>

                    <div style="display:flex; gap:20px; flex-wrap:wrap;">
                        <div style="flex:1; min-width:250px; background:#f9f9f9; padding:20px; border-radius:8px; border:1px solid #eee;">
                            <h4 style="margin:0 0 15px 0; color:#333; border-bottom: 2px solid #ddd; padding-bottom: 8px; text-align:left;">Statistik Grayscale</h4>
                            <pre style="white-space:pre-wrap; font-family: monospace; margin:0; font-size: 13px; color:#555; line-height: 1.5; text-align:left;">${data.stats_gray}</pre>
                        </div>
                        
                        <div style="flex:1; min-width:250px; background:#f9f9f9; padding:20px; border-radius:8px; border:1px solid #eee;">
                            <h4 style="margin:0 0 15px 0; color:#333; border-bottom: 2px solid #ddd; padding-bottom: 8px; text-align:left;">Statistik RGB</h4>
                            <pre style="white-space:pre-wrap; font-family: monospace; margin:0; font-size: 13px; color:#555; line-height: 1.5; text-align:left;">${data.stats_rgb}</pre>
                        </div>
                    </div>
                `;
                
                // Otomatis scroll ke container hasil agar user tahu proses selesai
                compressResult.scrollIntoView({ behavior: 'smooth' });
            } else { 
                alert("Gagal memproses: " + data.error); 
            }
        } catch (err) { 
            console.error(err);
            alert("Terjadi kesalahan koneksi ke server."); 
        } finally { 
            btnCompress.textContent = "Mulai Optimasi"; 
            btnCompress.disabled = false; 
        }
    });

    /* ====================================================
       4. FETCH API: SIMILARITY (FACE RECOGNITION)
       ==================================================== */
    const similarityForm = document.getElementById('similarity-form');
    const similarityResult = document.getElementById('similarity-result');
    const btnSimilarity = document.getElementById('btn-similarity');

    if (similarityForm) {
        similarityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const babyFile = document.getElementById('file-baby').files[0];
            const adultFile = document.getElementById('file-adult').files[0];
            if(!babyFile || !adultFile) return alert("Mohon unggah kedua gambar wajah!");

            btnSimilarity.textContent = "Menganalisis...";
            btnSimilarity.disabled = true;

            const formData = new FormData();
            formData.append('baby', babyFile);
            formData.append('adult', adultFile);

            try {
                const response = await fetch('/compare_faces', { method: 'POST', body: formData });
                const data = await response.json();

                if(data.success) {
                    const p = data.similarity; 
                    similarityResult.style.display = 'block';
                    similarityResult.innerHTML = `
                        <h3>Hasil Analisis Kemiripan</h3>
                        <div style="background:#fff; padding:20px; border-radius:12px; border: 1px solid #e2e8f0;">
                            <div class="progress-container">
                                <div class="progress-bar-fill" style="width: 0%; text-align:center;">0%</div>
                            </div>
                            <p style="margin-top:15px; text-align:left;">Cosine Similarity: <strong>${data.distance.toFixed(4)}</strong></p>
                            <p style="text-align:left;">Kesimpulan: <strong style="color:#669899;">${data.result}</strong></p>
                        </div>
                    `;
                    
                    // Efek transisi progress bar naik perlahan
                    setTimeout(() => {
                        const fill = similarityResult.querySelector('.progress-bar-fill');
                        if(fill) {
                            fill.style.width = `${p}%`;
                            fill.textContent = `${p}%`;
                        }
                    }, 200);

                    similarityResult.scrollIntoView({ behavior: 'smooth' });
                } else { 
                    alert("Gagal menganalisis wajah: " + data.error); 
                }
            } catch (err) { 
                console.error(err);
                alert("Terjadi kesalahan sistem saat menghubungi fungsi pencocokan wajah."); 
            } finally { 
                btnSimilarity.textContent = "Mulai Analisis"; 
                btnSimilarity.disabled = false; 
            }
        });
    }

    /* --- FUNGSI PREVIEW GAMBAR --- */
    function setupPreview(inputId, imgId) {
        const input = document.getElementById(inputId);
        const img = document.getElementById(imgId);
        if(input && img) {
            input.addEventListener('change', () => {
                const [file] = input.files;
                if (file) {
                    img.src = URL.createObjectURL(file);
                    img.style.display = 'block';
                }
            });
        }
    }
    setupPreview('file-baby', 'preview-baby');
    setupPreview('file-adult', 'preview-adult');
});