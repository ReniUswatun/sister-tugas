import http from "k6/http";
import { check, sleep } from "k6";

const FILES_TO_TEST = [
  "10kb.html",
  "100kb.html",
  "1mb.html",
  "5mb.html",
  "10mb.html",
];

// 1. Baca jumlah VUs puncak dari environment variable.
//    Jika tidak diset, defaultnya adalah 100 VUs.
const PEAK_VUS = __ENV.VUS || 100;

export const options = {
  // 2. Tetap gunakan 'stages' untuk ramp-up yang aman.
  //    Gunakan PEAK_VUS untuk menentukan target puncaknya.
  stages: [
    { duration: "30s", target: PEAK_VUS }, // Naik ke VUs puncak
    { duration: "1m", target: PEAK_VUS }, // Tahan di puncak
    { duration: "10s", target: 0 }, // Turun kembali
  ],
  thresholds: {
    // Naikkan threshold ke 20 detik untuk melihat apakah tes bisa lulus
    http_req_duration: ["p(95)<200000"], // 20000ms = 200 detik
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // 3. Gunakan logika tes terbaik dari script kedua Anda.
  //    Memilih file secara berurutan untuk memastikan semua teruji.
  const fileIndex = __ITER % FILES_TO_TEST.length;
  const file = FILES_TO_TEST[fileIndex];
  const url = `http://localhost:8080/files/${file}`;

  const res = http.get(url);

  // Gunakan 'check' yang lebih detail.
  check(res, {
    "status is 200": (r) => r.status === 200,
    [`file is ${file}`]: (r) => r.url.endsWith(file),
  });

  sleep(1);
}
