import json
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

def extract_summary(filepath):
    with open(filepath, "r") as f:
        data = json.load(f)

    metrics = data.get("metrics", {})
    root_group = data.get("root_group", {})

    # Request & error
    total_requests = metrics.get("http_reqs", {}).get("count", 0)
    error_rate = metrics.get("http_req_failed", {}).get("value", 0)
    failed_requests = int(total_requests * error_rate)
    success_requests = total_requests - failed_requests
    success_rate = (success_requests / total_requests * 100) if total_requests > 0 else 0

    # Response time
    duration = metrics.get("http_req_duration", {})
    avg_duration = duration.get("avg", 0)
    p95_duration = duration.get("p(95)", 0)
    max_duration = duration.get("max", 0)

    # Throughput
    rps = metrics.get("http_reqs", {}).get("rate", 0)

    # Data transfer
    data_sent = metrics.get("data_sent", {}).get("count", 0)
    data_received = metrics.get("data_received", {}).get("count", 0)

    # Resource load
    iteration_duration = metrics.get("iteration_duration", {}).get("avg", 0)
    vus_max = metrics.get("vus_max", {}).get("value", 0)

    # Checks
    checks = root_group.get("checks", {})
    total_checks = len(checks)
    passed_checks = sum(1 for c in checks.values() if c.get("passes", 0) > 0)

    # Ambil nama file singkat (tanpa "result_" dan ".json")
    short_name = filepath.stem.replace("result_", "")

    return {
        "File": short_name,
        "Total Requests": total_requests,
        "Success Requests": f"{success_requests} ({success_rate:.2f}%)",
        "Failed Requests": f"{failed_requests} ({error_rate*100:.2f}%)",
        "Checks Passed": f"{passed_checks}/{total_checks}",
        "Resp Time Avg (ms)": f"{avg_duration:.2f}",
        "Resp Time p95 (ms)": f"{p95_duration:.2f}",
        "Resp Time Max (ms)": f"{max_duration:.2f}",
        "RPS": f"{rps:.2f}",
        "Data Sent (bytes)": data_sent,
        "Data Received (bytes)": data_received,
        "Iter Avg Duration (ms)": f"{iteration_duration:.2f}",
        "VUs Max": vus_max,
    }

def save_table_as_image(df, vus, output_dir):
    fig, ax = plt.subplots(figsize=(16, 6))
    ax.axis("off")

    # Buat tabel
    table = ax.table(
        cellText=df.values,
        colLabels=df.columns,
        cellLoc="center",
        loc="center"
    )

    # Styling tabel
    table.auto_set_font_size(False)
    table.set_fontsize(9)
    table.scale(1.1, 1.3)
    table.auto_set_column_width(col=list(range(len(df.columns))))

    # Header style
    for (row, col), cell in table.get_celld().items():
        if row == 0:
            cell.set_text_props(weight="bold", color="white")
            cell.set_facecolor("#4B8BBE")
        else:
            cell.set_facecolor("#f9f9f9" if row % 2 == 0 else "#ffffff")

    plt.title(f"Ringkasan Hasil Tes (VUs = {vus})", fontsize=12, pad=20)
    output_file = output_dir / f"summary_vus{vus}.png"
    plt.savefig(output_file, bbox_inches="tight", dpi=200)
    plt.close()

def main():
    folder = Path("systematic-results")
    output_dir = Path("summary-tables")
    output_dir.mkdir(exist_ok=True)

    results = []
    for file in folder.glob("*.json"):
        results.append(extract_summary(file))

    df = pd.DataFrame(results)

    # Grouping berdasarkan VUs
    for vus in sorted(df["VUs Max"].unique()):
        df_vus = df[df["VUs Max"] == vus].sort_values("File")
        save_table_as_image(df_vus, vus, output_dir)

    print(f"✅ Semua tabel ringkasan sudah disimpan di folder: {output_dir}")

if __name__ == "__main__":
    main()
