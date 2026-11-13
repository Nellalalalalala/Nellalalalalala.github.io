#!/usr/bin/env python3
"""Recalculate the published research from data/input.json. Python 3, no dependencies.

Run from any directory: python3 /path/to/ussr-suicides/recalculate.py
Writes data/annual.json, data/annual.csv and data/summary.json.
Missing years remain null; this program never interpolates a missing suicide rate.
"""
import csv
import json
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def calculate(data):
    rows = []
    for year in range(1922, 1992):
        key = str(year)
        row = dict(year=year, kind="missing", coverage="Не установлено",
                   value=None, rate=None, population_start_m=None,
                   population_next_m=None, population_mean_m=None,
                   sources=[], men=None, women=None, locator="", precision="",
                   formula="Не вычисляется: нет выбранного годового числа или коэффициента.",
                   note="Пробел в этой подборке; это не ноль и не доказательство отсутствия данных в архивах.")
        if key in data["counts"]:
            row.update(data["counts"][key])
            row["value"] = str(row["value"])
            if row["men"] is not None and row["women"] is not None:
                assert Decimal(row["men"]) + Decimal(row["women"]) == Decimal(row["value"]), year
                row["formula"] = f"{row['men']} (мужчины) + {row['women']} (женщины) = {row['value']}"
            else:
                row["formula"] = f"{row['value']} (абсолютное число из указанного источника)"
        elif key in data["rates"]:
            rate_entry = data["rates"][key]
            p0 = data["population"][key]
            p1 = data["population"][str(year + 1)]
            rate, start, end = map(Decimal, (rate_entry["value"], p0["value"], p1["value"]))
            mean = (start + end) / 2
            value = rate * mean * 10  # million persons / 100,000
            row.update(kind="derived", coverage="СССР, всё население; приближённый расчёт",
                       value=str(value), rate=str(rate), population_start_m=str(start),
                       population_next_m=str(end), population_mean_m=str(mean),
                       sources=list(dict.fromkeys(rate_entry["sources"] + p0["sources"] + p1["sources"])),
                       formula=f"{rate} × ({start} + {end}) / 2 × 10 = {value}",
                       note=rate_entry.get("note", "") + " Среднегодовое население приближённо равно полусумме двух соседних значений; исходные величины округлены. Это не найденное архивное абсолютное число.")
        rows.append(row)

    def total(selected):
        return str(sum((Decimal(r["value"]) for r in selected if r["value"] is not None), Decimal(0)))

    observed = [r for r in rows if r["kind"] in ("partial", "published")]
    derived = [r for r in rows if r["kind"] == "derived"]
    summary = {
        "full_1922_1991_total": None,
        "reason": "Missing years and incomplete territorial coverage; no defensible all-period total.",
        "published_arithmetic_sum": total(observed),
        "derived_arithmetic_sum": total(derived),
        "augmented_arithmetic_sum": total(rows),
        "published_without_1922": total(r for r in observed if r["year"] != 1922),
        "augmented_without_1922": total(r for r in rows if r["year"] != 1922),
        "early_1922_1927": total(r for r in observed if r["year"] <= 1927),
        "urban_1935_1954": total(r for r in observed if 1935 <= r["year"] <= 1954),
        "published_union_1965_1990": total(r for r in observed if r["year"] >= 1965),
        "derived_1956_1960_1962": total(r for r in derived if r["year"] < 1970),
        "derived_1970_1990": total(r for r in derived if r["year"] >= 1970),
        "selected_1970_1990": total(r for r in rows if 1970 <= r["year"] <= 1990),
        "published_years": len(observed),
        "derived_years": len(derived),
        "missing_years": [r["year"] for r in rows if r["kind"] == "missing"],
        "partial_years": [r["year"] for r in rows if r["kind"] == "partial"],
        "note": "Exact arithmetic on approximate inputs is not an exact historical count or a strict lower bound. All source counts are as reported; no under-registration correction."
    }
    return rows, summary


def main():
    data = json.loads((ROOT / "data/input.json").read_text(encoding="utf-8"))
    rows, summary = calculate(data)
    for name, value in (("annual.json", rows), ("summary.json", summary)):
        (ROOT / "data" / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    fields = list(rows[0])
    with (ROOT / "data/annual.csv").open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({**row, "sources": ";".join(row["sources"])})
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
