// main.go

package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath" // <-- TAMBAH: Library untuk mengelola path file

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// Konfigurasi koneksi, ditaruh di atas agar mudah diubah
const (
	endpoint        = "localhost:9000"
	accessKeyID     = "minioadmin"
	secretAccessKey = "minioadmin"
	useSSL          = false
)

// func main adalah titik masuk utama program Go
func main() {
	// 1. Inisialisasi Client MinIO
	ctx := context.Background()
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatalln("Koneksi ke MinIO gagal:", err)
	}
	log.Println("Koneksi ke MinIO berhasil!")

	// 2. Persiapan Bucket dan Path File Gambar Anda <-- UBAH BAGIAN INI
	bucketName := "gambar-meme"
	// Ganti dengan path lengkap ke gambar Anda.
	// PENTING: Gunakan garis miring ganda (\\) atau garis miring biasa (/) untuk path di Windows.
	filePath := "C:\\Users\\Lenovo\\Downloads\\meme.avif"

	// Kita ambil nama file dari path secara otomatis
	objectName := filepath.Base(filePath)
	// Nama file saat diunduh kembali
	downloadedFilePath := "./" + "hasil-unduh-" + objectName

	// Buat bucket jika belum ada
	err = minioClient.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
	if err != nil {
		exists, errBucketExists := minioClient.BucketExists(ctx, bucketName)
		if errBucketExists == nil && exists {
			log.Printf("Bucket '%s' sudah ada.\n", bucketName)
		} else {
			log.Fatalln("Gagal membuat/memeriksa bucket:", err)
		}
	} else {
		log.Printf("Bucket '%s' berhasil dibuat.\n", bucketName)
	}

	// 3. FUNGSI ADD FILES (Upload)
	fmt.Println("\n--- 1. Proses Add/Upload File ---")

	// (Opsional tapi sangat disarankan) Cek dulu apakah file lokalnya ada
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		log.Fatalln("File tidak ditemukan di path:", filePath)
	}

	// <-- HAPUS BAGIAN PEMBUATAN FILE CONTOH
	// Kita tidak perlu lagi membuat file, karena filenya sudah ada.

	// Langsung upload file gambar yang ada ke MinIO menggunakan FPutObject
	uploadInfo, err := minioClient.FPutObject(ctx, bucketName, objectName, filePath, minio.PutObjectOptions{})
	if err != nil {
		log.Fatalln("Gagal upload file:", err)
	}
	log.Printf("File gambar '%s' berhasil di-upload, size: %d bytes.\n", objectName, uploadInfo.Size)
	log.Println("Silakan cek di http://localhost:9001")
	fmt.Print("Tekan Enter untuk lanjut ke proses Retrieve...")
	fmt.Scanln()

	// 4. FUNGSI RETRIEVE FILES (Download)
	fmt.Println("\n--- 2. Proses Retrieve/Download File ---")
	err = minioClient.FGetObject(ctx, bucketName, objectName, downloadedFilePath, minio.GetObjectOptions{})
	if err != nil {
		log.Fatalln("Gagal download file:", err)
	}
	log.Printf("File berhasil diunduh dan disimpan sebagai '%s'.\n", downloadedFilePath)
	fmt.Print("Tekan Enter untuk lanjut ke proses Remove...")
	fmt.Scanln()

	// 5. FUNGSI REMOVE FILES (Delete)
	fmt.Println("\n--- 3. Proses Remove/Hapus File ---")
	err = minioClient.RemoveObject(ctx, bucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		log.Fatalln("Gagal menghapus file:", err)
	}
	log.Printf("File '%s' berhasil dihapus dari bucket.\n", objectName)
	log.Println("Silakan cek kembali di http://localhost:9001, file seharusnya sudah hilang.")

	// Cleanup file LOKAL HASIL UNDUHAN saja <-- UBAH BAGIAN INI
	// JANGAN HAPUS FILE ASLI ANDA!
	os.Remove(downloadedFilePath)
}
