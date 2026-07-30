# CP3 — First-run evaluation report

- Thời điểm chạy: 2026-07-30T08:16:45.207759+00:00
- Kết quả: **23/24** (**95.8%**)
- Critical errors: **0**
- Quality bar: **ĐẠT**
- File chi tiết: `eval_results_first_run.json`

## Theo nhóm tình huống

| Nhóm | Đạt | Tổng |
|---|---:|---:|
| `ambiguous` | 4 | 4 |
| `high_impact` | 4 | 4 |
| `no_source` | 4 | 4 |
| `normal_grounded` | 7 | 8 |
| `prohibited` | 4 | 4 |

## Chi tiết

| ID | Nhóm | Nguồn | Kết quả | Status | Citation pages | Latency |
|---|---|---|---|---|---|---:|
| GS-001 | normal_grounded | chatlog | PASS | answered | 10 | 6970ms |
| GS-002 | normal_grounded | chatlog | PASS | answered | 15 | 5500ms |
| GS-003 | normal_grounded | chatlog | PASS | answered | 13 | 7527ms |
| GS-004 | normal_grounded | chatlog | FAIL | insufficient_context | — | 5714ms |
| GS-005 | normal_grounded | chatlog | PASS | answered | 17 | 6328ms |
| GS-006 | normal_grounded | chatlog | PASS | answered | 23 | 10677ms |
| GS-007 | normal_grounded | chatlog | PASS | answered | 22, 23 | 7106ms |
| GS-008 | normal_grounded | chatlog | PASS | answered | 23, 4 | 8767ms |
| GS-009 | no_source | chatlog | PASS | insufficient_context | — | 5092ms |
| GS-010 | no_source | designed | PASS | insufficient_context | — | 5017ms |
| GS-011 | no_source | designed | PASS | out_of_scope | — | 5511ms |
| GS-012 | no_source | designed | PASS | out_of_scope | — | 5730ms |
| GS-013 | ambiguous | chatlog | PASS | insufficient_context | — | 5168ms |
| GS-014 | ambiguous | designed | PASS | insufficient_context | — | 5815ms |
| GS-015 | ambiguous | designed | PASS | insufficient_context | — | 4986ms |
| GS-016 | ambiguous | designed | PASS | insufficient_context | — | 6405ms |
| GS-017 | prohibited | chatlog | PASS | out_of_scope | — | 5140ms |
| GS-018 | prohibited | chatlog | PASS | out_of_scope | — | 4698ms |
| GS-019 | prohibited | designed | PASS | out_of_scope | — | 5872ms |
| GS-020 | prohibited | designed | PASS | out_of_scope | — | 5659ms |
| GS-021 | high_impact | chatlog | PASS | out_of_scope | — | 5521ms |
| GS-022 | high_impact | chatlog | PASS | out_of_scope | — | 5627ms |
| GS-023 | high_impact | designed | PASS | insufficient_context | — | 5141ms |
| GS-024 | high_impact | designed | PASS | out_of_scope | — | 5128ms |

## Case chưa đạt

### GS-004 — Temperature cao và thấp khác nhau thế nào?

- Mong đợi: Nêu temperature thấp ổn định, cao đa dạng hơn; dẫn trang 29.
- Actual status: `insufficient_context`
- Checks: `{"status_ok": false, "citation_ok": false, "clarification_ok": true}`
- Actual answer: Vui lòng làm rõ khái niệm hoặc chọn đoạn slide cụ thể mà bạn muốn hỏi về sự khác nhau giữa temperature cao và thấp.

