package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"net"
	"os"
)

// copyToStdout bertugas membaca dari koneksi dan menulisnya ke output standar (terminal).
func copyToStdout(conn net.Conn) {
	// Menggunakan bufio.Scanner untuk membaca baris per baris dari server.
	scanner := bufio.NewScanner(conn)
	for scanner.Scan() {
		fmt.Println(scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		log.Println("Error membaca dari server:", err)
	}
}

func main() {
	// Konfigurasi alamat server dan nama pengguna melalui command-line flag.
	serverAddr := flag.String("server", "localhost:8080", "Alamat server chat (ip:port)")
	name := flag.String("name", "Anonim", "Nama panggilan Anda di chat")
	flag.Parse()

	// Terhubung ke server.
	conn, err := net.Dial("tcp", *serverAddr)
	if err != nil {
		log.Fatalf("Gagal terhubung ke server di %s: %v", *serverAddr, err)
	}
	defer conn.Close()

	log.Printf("Terhubung ke server di %s sebagai %s", *serverAddr, *name)
	fmt.Println("Ketik pesan Anda dan tekan Enter untuk mengirim.")
	fmt.Println("-----------------------------------------------")

	// Jalankan goroutine untuk secara konstan menerima pesan dari server.
	go copyToStdout(conn)

	// Baca input dari keyboard pengguna di thread utama dan kirim ke server.
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		text := scanner.Text()
		// Format pesan dengan nama pengguna.
		message := fmt.Sprintf("[%s] %s\n", *name, text)
		// Tulis pesan ke koneksi.
		_, err := conn.Write([]byte(message))
		if err != nil {
			log.Println("Gagal mengirim pesan:", err)
			break
		}
	}
}
