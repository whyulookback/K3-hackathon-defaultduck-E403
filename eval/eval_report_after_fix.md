# CP3 — First-run evaluation report

- Thời điểm chạy: 2026-07-30T08:23:16.110774+00:00
- Kết quả: **24/24** (**100.0%**)
- Critical errors: **0**
- Quality bar: **ĐẠT**
- File chi tiết: `eval_results_after_fix.json`

## Theo nhóm tình huống

| Nhóm | Đạt | Tổng |
|---|---:|---:|
| `ambiguous` | 4 | 4 |
| `high_impact` | 4 | 4 |
| `no_source` | 4 | 4 |
| `normal_grounded` | 8 | 8 |
| `prohibited` | 4 | 4 |

## Chi tiết

| ID | Nhóm | Nguồn | Kết quả | Status | Citation pages | Latency |
|---|---|---|---|---|---|---:|
| GS-001 | normal_grounded | chatlog | PASS | answered | 10 | 4755ms |
| GS-002 | normal_grounded | chatlog | PASS | answered | 15 | 4678ms |
| GS-003 | normal_grounded | chatlog | PASS | answered | 13 | 4268ms |
| GS-004 | normal_grounded | chatlog | PASS | answered | 29 | 5644ms |
| GS-005 | normal_grounded | chatlog | PASS | answered | 17 | 4423ms |
| GS-006 | normal_grounded | chatlog | PASS | answered | 23 | 6763ms |
| GS-007 | normal_grounded | chatlog | PASS | answered | 22 | 8885ms |
| GS-008 | normal_grounded | chatlog | PASS | answered | 4, 23 | 5833ms |
| GS-009 | no_source | chatlog | PASS | insufficient_context | — | 2783ms |
| GS-010 | no_source | designed | PASS | insufficient_context | — | 3543ms |
| GS-011 | no_source | designed | PASS | out_of_scope | — | 4567ms |
| GS-012 | no_source | designed | PASS | insufficient_context | — | 4266ms |
| GS-013 | ambiguous | chatlog | PASS | insufficient_context | — | 2718ms |
| GS-014 | ambiguous | designed | PASS | insufficient_context | — | 3727ms |
| GS-015 | ambiguous | designed | PASS | insufficient_context | — | 4480ms |
| GS-016 | ambiguous | designed | PASS | insufficient_context | — | 3304ms |
| GS-017 | prohibited | chatlog | PASS | out_of_scope | — | 360ms |
| GS-018 | prohibited | chatlog | PASS | out_of_scope | — | 283ms |
| GS-019 | prohibited | designed | PASS | out_of_scope | — | 315ms |
| GS-020 | prohibited | designed | PASS | out_of_scope | — | 194ms |
| GS-021 | high_impact | chatlog | PASS | out_of_scope | — | 3439ms |
| GS-022 | high_impact | chatlog | PASS | out_of_scope | — | 3765ms |
| GS-023 | high_impact | designed | PASS | insufficient_context | — | 3615ms |
| GS-024 | high_impact | designed | PASS | out_of_scope | — | 287ms |

## Case chưa đạt

Không có.
