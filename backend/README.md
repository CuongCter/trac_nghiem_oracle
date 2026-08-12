# Backend — Hệ thống Quản lý Thi Trắc Nghiệm

Node.js + Express + TypeScript + Oracle 19c. Tương thích với hợp đồng FE hiện tại ở `../frontend`.

## Yêu cầu

- Node.js >= 18 (khuyến nghị 20 LTS).
- Oracle Database 19c sẵn sàng với user có quyền CREATE/ALTER/DROP ở schema mặc định.
- Nếu chạy qua Node mà `oracledb` cần Instant Client, hãy cài Oracle Instant Client 19c và trỏ `OCI_LIB_DIR`/`PATH` tới thư mục `instantclient` (xem [oracledb docs](https://oracle.github.io/node-oracledb/)).

## Cài đặt

```bash
cd backend
cp .env.example .env
npm install
```

Sau đó sửa `.env` cho đúng `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING` của máy bạn.

## Khởi tạo schema

Kết nối bằng SQL*Plus / SQLcl / DBeaver… rồi chạy:

```sql
@database/schema.sql
@database/seed.sql   -- tuỳ chọn, chèn admin@local (cần thay hash)
```

Nếu muốn dùng tài khoản `admin@local / Admin@123`, chạy tool sau (yêu cầu DB đã được tạo sẵn schema):

```bash
npm run seed:admin
```

## Chạy server

```bash
npm run dev    # hot reload trên http://localhost:5000
npm run build
npm start      # production
```

Cổng mặc định: 5000. FE đọc `NEXT_PUBLIC_API_URL=http://localhost:5000/api`.

## Health check

```bash
curl http://localhost:5000/api/health
```

Trả về `{ success, data: { status: "ok", db: "up" } }` khi cả hai đều ổn.

## Smoke test

```bash
# Login với tài khoản admin đã seed
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local","password":"Admin@123"}'
```

Sau đó dùng `token` trong header `Authorization: Bearer <token>` cho các endpoint khác.

## Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/           # env, database
│   ├── middleware/       # auth, error
│   ├── routes/           # express routers
│   ├── controllers/      # request handlers
│   ├── services/         # business logic
│   ├── repositories/     # SQL access
│   ├── validators/       # zod schemas
│   ├── types/            # shared ts types
│   ├── utils/            # auth/jwt/bcrypt, errors, response, etc.
│   ├── realtime/         # socket.io bridge
│   ├── app.ts
│   └── server.ts
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── drop.sql
└── README.md
```

## Hợp đồng API

Tất cả response đều theo envelope `{ success: true|false, data, message?, errors? }` (trừ các mảng ngắn cho dropdown và dashboard khi cần). Xem chi tiết FE ở `../frontend/lib/api.ts` + `../frontend/types/api.ts`.

## Realtime

Socket.IO chạy ở `path: "/ws"`. Client kết nối tới `http://localhost:5000` (không `/api`), truyền `auth: { token }`, gửi `teacher:subscribe` để nhận event `violation`.
