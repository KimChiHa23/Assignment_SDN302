# Assignment 1 – Task & Team Management App (SDN302)

Ứng dụng quản lý công việc và đội nhóm (**Task & Team Management App**) được xây dựng bằng **Next.js (App Router, TypeScript)**, **Tailwind CSS**, **Prisma ORM**, và **PostgreSQL (Supabase)**, sẵn sàng để deploy lên **Vercel**.

---

## 🚀 1. Công nghệ sử dụng (Tech Stack)

- **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database ORM**: [Prisma ORM](https://www.prisma.io/)
- **Database**: [PostgreSQL (Supabase)](https://supabase.com/)
- **Code Quality**: ESLint, Prettier

---

## 📊 2. Sơ đồ thực thể quan hệ cơ sở dữ liệu (Mermaid ERD)

Dưới đây là sơ đồ quan hệ giữa 4 bảng: `User`, `Team`, `TeamMember`, và `Task`:

```mermaid
erDiagram
    USER ||--o{ TEAM : "sở hữu (ownerId)"
    USER ||--o{ TEAM_MEMBER : "tham gia (userId)"
    USER ||--o{ TASK : "được giao việc (assigneeId)"
    TEAM ||--o{ TEAM_MEMBER : "có thành viên (teamId)"
    TEAM ||--o{ TASK : "chứa các công việc (teamId)"

    USER {
        String id PK "cuid"
        String name
        String email UK "unique"
        String password
        DateTime createdAt
    }

    TEAM {
        String id PK "cuid"
        String name
        String description "optional"
        String ownerId FK
        DateTime createdAt
    }

    TEAM_MEMBER {
        String id PK "cuid"
        String teamId FK
        String userId FK
        String role "MEMBER | ADMIN"
        DateTime joinedAt
    }

    TASK {
        String id PK "cuid"
        String title
        String description "optional"
        String status "To Do | In Progress | Done"
        String priority "Low | Medium | High"
        DateTime dueDate "optional"
        String teamId FK "optional"
        String assigneeId FK "optional"
        DateTime createdAt
        DateTime updatedAt
    }
```

---

## 📁 3. Cấu trúc thư mục dự án

```text
assignment1/
├── app/
│   ├── api/
│   │   └── tasks/
│   │       ├── route.ts              # GET all tasks, POST create task
│   │       └── [id]/
│   │           └── route.ts          # PUT update task, DELETE remove task
│   ├── teams/
│   │   └── page.tsx                  # Placeholder "Coming Soon" cho Teams
│   ├── login/
│   │   └── page.tsx                  # Placeholder Login page
│   ├── favicon.ico
│   ├── globals.css                   # Tailwind CSS styling
│   ├── layout.tsx                    # Root layout chung (Navbar & Footer)
│   └── page.tsx                      # Homepage (Hero, Stats, Form, Tasks & Modals)
├── components/
│   ├── Navbar.tsx                    # Header điều hướng (Home, Teams, Login)
│   ├── Footer.tsx                    # Footer hiển thị thông tin đồ án
│   ├── StatusFilter.tsx              # Bộ lọc trạng thái (All, To Do, In Progress, Done)
│   ├── TaskForm.tsx                  # Form tạo task mới với client validation
│   ├── TaskList.tsx                  # Bảng & Card hiển thị task, kèm actions
│   ├── TaskModal.tsx                 # Modal popup chỉnh sửa task
│   └── DeleteConfirmModal.tsx        # Modal xác nhận xóa task an toàn
├── lib/
│   └── prisma.ts                     # Prisma Client Singleton kết nối database
├── prisma/
│   └── schema.prisma                 # Định nghĩa Data Model 4 bảng (User, Team, TeamMember, Task)
├── types/
│   └── task.ts                       # TypeScript interfaces
├── .env                              # Biến môi trường kết nối Supabase
├── .env.example                      # Template biến môi trường mẫu
├── .prettierrc                       # Cấu hình Prettier code formatting
├── .prettierignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ 4. Hướng dẫn cài đặt & Khởi chạy

### Bước 1: Cài đặt dependencies

```bash
npm install
```

### Bước 2: Cấu hình biến môi trường `.env`

Mở file `.env` và cập nhật thông tin Supabase:

```env
# Supabase Public API Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ujvjehrcfkwkfwdtlfka.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tbha_3hG8JcBcnVCyo4gtQ_uNYDqM_6

# PostgreSQL Connection Strings (Thay [YOUR-PASSWORD] bằng mật khẩu database Supabase)
DATABASE_URL="postgresql://postgres.ujvjehrcfkwkfwdtlfka:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.ujvjehrcfkwkfwdtlfka:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

> _Lưu ý: Bạn có thể lấy chuỗi kết nối chuẩn tại **Supabase Dashboard** -> **Project Settings** -> **Database** -> **Connection string**._

### Bước 3: Đồng bộ Database với Prisma

Sau khi đã điền mật khẩu Database trong file `.env`, chạy lệnh đẩy schema lên PostgreSQL:

```bash
# Sinh Prisma Client
npx prisma generate

# Đẩy schema lên database Supabase (tạo bảng User, Team, TeamMember, Task)
npx prisma db push
```

### Bước 4: Khởi chạy môi trường phát triển (Development)

```bash
npm run dev
```

Truy cập ứng dụng tại: [http://localhost:3000](http://localhost:3000)

### Bước 5: Kiểm tra Code Quality & Build Production

```bash
# Kiểm tra ESLint
npm run lint

# Tự động định dạng code với Prettier
npm run format

# Build production bundle
npm run build
```

---

## 🌐 5. Hướng dẫn Deploy lên Vercel

1. Đẩy code lên GitHub repository của bạn.
2. Truy cập [Vercel](https://vercel.com/) và import repository.
3. Trong phần **Environment Variables**, thêm các biến sau:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Cấu hình **Build Command**: `npx prisma generate && next build`
5. Bấm **Deploy**.

---

## 📝 6. Gợi ý 5 thông điệp Commit Git chuẩn (Conventional Commits)

Khi commit mã nguồn để nộp bài, bạn có thể thực hiện theo 5 commit sau:

1. **`chore: initialize next.js 15 project with typescript, tailwind css, and eslint`**
   - _Khởi tạo cấu trúc dự án Next.js App Router, cấu hình Tailwind, ESLint và Prettier._
2. **`feat(prisma): define database schema with user, team, teammember, and task models`**
   - _Thiết lập Prisma ORM, khai báo 4 models cùng quan hệ ràng buộc và tạo singleton client._
3. **`feat(api): implement task CRUD route handlers with validation and error handling`**
   - _Xây dựng các API endpoints: GET /api/tasks, POST /api/tasks, PUT /api/tasks/[id], DELETE /api/tasks/[id]._
4. **`feat(ui): build task management dashboard with navbar, footer, modals, and status filters`**
   - _Hoàn thiện giao diện người dùng: Form tạo task, danh sách task, modal chỉnh sửa/xóa, và cập nhật state tức thì._
5. **`docs: complete project documentation with mermaid erd and deployment guide`**
   - _Cập nhật README đầy đủ sơ đồ ERD, hướng dẫn cấu hình Supabase và quy trình deploy lên Vercel._
