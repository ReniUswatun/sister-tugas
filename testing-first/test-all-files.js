import http from "k6/http";
import { check, sleep } from "k6";

const FILES_TO_TEST = [
  "10kb.html",
  "100kb.html",
  "1mb.html",
  "5mb.html",
  "10mb.html",
];

// Baca VUS dan ITERATIONS dari environment variables
const VUS = __ENV.VUS || 10;
const ITERATIONS = __ENV.ITERATIONS || 100;

export const options = {
  scenarios: {
    my_scenario: {
      executor: "shared-iterations",
      vus: VUS,
      iterations: ITERATIONS,
      maxDuration: "1h",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // **LOGIKA BARU:**
  // Pilih file secara berurutan menggunakan nomor iterasi (__ITER)
  // __ITER % FILES_TO_TEST.length akan menghasilkan 0, 1, 2, 3, 4, 0, 1, 2, ...
  const fileIndex = __ITER % FILES_TO_TEST.length;
  const file = FILES_TO_TEST[fileIndex];

  const url = `http://localhost:8080/files/${file}`;

  const res = http.get(url);

  check(res, {
    "status is 200": (r) => r.status === 200,
    [`file is ${file}`]: (r) => r.url.endsWith(file), // Cek opsional
  });

  sleep(1);
}
