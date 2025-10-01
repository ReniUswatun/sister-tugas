#!/bin/bash

# --- Konfigurasi Skenario Tes ---
# Format: "JUMLAH_VUS:JUMLAH_ITERATIONS"
# Ini adalah matriks yang Anda minta.
SCENARIOS=(
    # tidak menggunakan 100: 1000 karena jumlah iterations (100) tidak boleh lebih kecil dari jumlah VUs (1000) saat menggunakan executor shared-iterations.
    # 1000 Users
    # "1000:100"
    "1000:1000"
    "1000:10000"
)

# Nama file script k6 yang baru
K6_SCRIPT="test-fileserver-1000vus.js"

# Tentukan nama folder untuk menyimpan semua hasil
RESULTS_DIR="systematic-results"
mkdir -p $RESULTS_DIR

# --------------------------------------------------

echo "Memulai Rangkaian Tes Sistematis"
echo "Hasil akan disimpan di folder '${RESULTS_DIR}'"
echo "=========================================="
echo ""

# Loop melalui setiap skenario
for scenario in "${SCENARIOS[@]}"; do
    VUS=$(echo $scenario | cut -d':' -f1)
    ITERATIONS=$(echo $scenario | cut -d':' -f2)

    # Buat nama file output yang unik
    OUTPUT_FILE="${RESULTS_DIR}/result_${VUS}vus_${ITERATIONS}iter.json"

    echo "--- Menjalankan: ${VUS} VUs, ${ITERATIONS} Iterations ---"
    echo "Menyimpan hasil ke: ${OUTPUT_FILE}"

    # Jalankan k6 dengan flag --summary-export
    k6 run \
        -e VUS=${VUS} \
        -e ITERATIONS=${ITERATIONS} \
        --summary-export=${OUTPUT_FILE} \
        ${K6_SCRIPT}

    if [ $? -ne 0 ]; then
        echo ""
        echo "!!! Tes Gagal untuk skenario ${VUS} VUs / ${ITERATIONS} Iterations. Menghentikan script. !!!"
        exit 1
    fi

    echo "--- Skenario Selesai. Jeda 10 detik. ---"
    echo ""
    sleep 10
done

echo "✅ Semua skenario tes sistematis telah selesai."