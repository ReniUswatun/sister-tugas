package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"net"
)

// client merepresentasikan satu klien yang terhubung, dengan channel untuk pesan keluar.
type client chan<- string

var (
	// Channel untuk mendaftarkan klien baru.
	entering = make(chan client)
	// Channel untuk klien yang keluar.
	leaving = make(chan client)
	// Channel untuk semua pesan masuk dari klien.
	messages = make(chan string)
)

// broadcaster bertugas mengelola state (klien yang terhubung)
// dan menyebarkan pesan ke semua klien.
func broadcaster() {
	// clients menyimpan semua klien yang sedang terhubung.
	clients := make(map[client]bool)

	for {
		select {
		case msg := <-messages:
			// Kirim pesan masuk ke semua klien yang terhubung.
			log.Printf("Broadcasting message to %d clients", len(clients))
			for cli := range clients {
				cli <- msg
			}

		case cli := <-entering:
			// Daftarkan klien baru.
			clients[cli] = true
			log.Printf("New client entered. Total clients: %d", len(clients))

		case cli := <-leaving:
			// Hapus klien yang keluar dan tutup channel-nya.
			delete(clients, cli)
			close(cli)
			log.Printf("Client left. Total clients: %d", len(clients))
		}
	}
}

// handleConn menangani koneksi untuk satu klien.
// Dijalankan di goroutine terpisah untuk setiap klien.
func handleConn(conn net.Conn) {
	// defer memastikan koneksi ditutup saat fungsi selesai.
	defer conn.Close()

	// Buat channel untuk pesan keluar klien ini.
	ch := make(chan string)
	go clientWriter(conn, ch)

	// Dapatkan alamat remote klien untuk identifikasi.
	who := conn.RemoteAddr().String()
	ch <- "Selamat datang di server chat!"
	messages <- who + " telah bergabung"
	entering <- ch

	// Baca pesan masuk dari klien.
	input := bufio.NewScanner(conn)
	for input.Scan() {
		messages <- who + ": " + input.Text()
	}

	// Setelah scanner selesai (klien disconnect), daftarkan klien untuk keluar.
	leaving <- ch
	messages <- who + " telah pergi"
	log.Printf("Connection closed from %s", who)
}

// clientWriter menulis pesan dari channel ke koneksi TCP klien.
func clientWriter(conn net.Conn, ch <-chan string) {
	for msg := range ch {
		// fmt.Fprintln menambahkan newline di akhir, penting untuk klien.
		fmt.Fprintln(conn, msg)
	}
}

func main() {
	// Ambil port dari command-line flag, defaultnya adalah 8080.
	// Ini penting untuk deployment!
	addr := flag.String("addr", ":8080", "Alamat dan port untuk server")
	flag.Parse()

	// Mulai mendengarkan koneksi TCP.
	listener, err := net.Listen("tcp", *addr)
	if err != nil {
		log.Fatal(err)
	}
	defer listener.Close()

	// Jalankan broadcaster di goroutine terpisah.
	go broadcaster()

	log.Printf("Server chat berjalan dan mendengarkan di %s", *addr)

	// Loop tak terbatas untuk menerima koneksi baru.
	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Print(err)
			continue
		}
		log.Printf("Menerima koneksi dari %s", conn.RemoteAddr().String())
		// Tangani setiap koneksi di goroutine baru agar server tidak terblokir.
		go handleConn(conn)
	}
}
