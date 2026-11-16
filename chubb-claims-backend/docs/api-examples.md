# API examples

All endpoints are under `/api/v1/claims`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Submit a claim |
| GET | `/{id}` | Retrieve claim tracking details |
| GET | `/` | Paginated claims list; optional `status` filter |
| PATCH | `/{id}/assignment` | Assign to claims officer |
| PATCH | `/{id}/status?status=...` | Move through permitted lifecycle states |
| POST | `/{id}/decision` | Approve or reject with reason |
