package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// func generateFiles() {
// 	files := map[string]int{
// 		"10kb.html":   10 * 1024,
// 		"100kb.html":  100 * 1024,
// 		"1mb.html":    1024 * 1024,
// 		"5mb.html":    5 * 1024 * 1024,
// 		"10mb.html":   10 * 1024 * 1024,
// 	}

// 	// bikin folder static kalau belum ada
// 	os.Mkdir("static", 0755)

// 	for name, size := range files {
// 		path := "static/" + name
// 		if _, err := os.Stat(path); err == nil {
// 			fmt.Println("File already exists:", path)
// 			continue
// 		}

// 		f, err := os.Create(path)
// 		if err != nil {
// 			panic(err)
// 		}

// 		header := `<!DOCTYPE html>
// <html lang="en">
// <head><meta charset="UTF-8"><title>Dummy</title></head>
// <body>
// <h1>` + name + `</h1>
// `
// 		footer := "</body></html>"

// 		f.WriteString(header)

// 		content := "<p>Dummy line for testing file size</p>\n"
// 		for written := len(header); written < size-len(footer); written += len(content) {
// 			f.WriteString(content)
// 		}

// 		f.WriteString(footer)
// 		f.Close()
// 		fmt.Println("Generated", path)
// 	}
// }

func main() {
	// generateFiles() // bikin file dummy dulu

	r := gin.Default()

	// Serve static files di /files
	r.StaticFS("/files", http.Dir("./static"))

	// Root route
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Welcome! Access files at /files/10kb.html, /files/100kb.html, /files/1mb.html, /files/5mb.html, /files/10mb.html",
		})
	})

	// Handle sw.js biar nggak 404
	r.GET("/sw.js", func(c *gin.Context) {
		c.String(200, "// no service worker")
	})

	r.Run(":8080") // listen and serve
}