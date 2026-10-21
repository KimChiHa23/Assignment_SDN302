# TaskFlow – Team & Task Management App (Assignment 3 & 4 – SDN302)

Ứng dụng quản lý công việc và đội nhóm (**Task & Team Management App**) hoàn chỉnh cho **Assignment 3 & 4**, nâng cấp từ Assignment 2 trên nền tảng **Next.js (App Router, React 19, TypeScript)**, **Tailwind CSS**, **Prisma ORM**, **PostgreSQL (Supabase)**, xác thực **JWT & bcryptjs**, bổ sung **Real-time Collaboration**, **Hệ thống phân quyền nâng cao (Advanced RBAC: Owner, Admin, Member)**, **Live Team Chat**, **Kanban Board kéo thả real-time**, và **Hệ thống Notification System**.

---

## 🚀 1. Công nghệ sử dụng (Tech Stack)

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database ORM**: [Prisma ORM](https://www.prisma.io/)
- **Database**: [PostgreSQL (Supabase)](https://supabase.com/)
- **Real-time Engine**: 
  - **Supabase Realtime Broadcast** (`@supabase/supabase-js`)
  - **Pusher Channels** (`pusher` server & `pusher-js` client)
  - **Server-Sent Events (SSE)** (`/api/realtime/sse` zero-config fallback)
  - **BroadcastChannel API** (Đồng bộ tức thời giữa các tab trình duyệt ở môi trường local)
- **Authentication**: JWT Token (`jose`), Password Hashing (`bcryptjs`), HttpOnly Cookie, Next.js Proxy/Middleware Access Control
- **Code Quality**: ESLint 9 (Flat Config), Prettier

---

## 📊 2. Sơ đồ thực thể quan hệ cơ sở dữ liệu (Mermaid ERD)

Hệ thống cơ sở dữ liệu đã được mở rộng gồm 6 model (`User`, `Team`, `TeamMember`, `Task`, `Message`, `Notification`) và 2 Enums (`Role`, `NotificationType`):

```mermaid
erDiagram
    USER ||--o{ TEAM : "sở hữu (ownerId)"
    USER ||--o{ TEAM_MEMBER : "tham gia (userId)"
    USER ||--o{ TASK : "được giao việc (assigneeId)"
    USER ||--o{ TASK : "tạo ra (creatorId)"
    USER ||--o{ MESSAGE : "gửi tin nhắn (senderId)"
    USER ||--o{ NOTIFICATION : "nhận thông báo (userId)"

    TEAM ||--o{ TEAM_MEMBER : "chứa thành viên (teamId)"
    TEAM ||--o{ TASK : "chứa công việc (teamId)"
    TEAM ||--o{ MESSAGE : "chứa tin nhắn chat (teamId)"

    USER {
        String id PK "cuid"
        String name
        String email UK "unique"
        String password "hashed with bcrypt"
        DateTime createdAt
    }

    TEAM {
        String id PK "cuid"
        String name
        String description "optional"
        String ownerId FK "User"
        DateTime createdAt
    }

    TEAM_MEMBER {
        String id PK "cuid"
        String teamId FK "Team"
        String userId FK "User"
        Role role "OWNER | ADMIN | MEMBER"
        DateTime joinedAt
    }

    TASK {
        String id PK "cuid"
        String title
        String description "optional"
        String status "To Do | In Progress | Done"
        String priority "Low | Medium | High"
        DateTime dueDate "optional"
        String teamId FK "Team"
        String assigneeId FK "User"
        String creatorId FK "User"
        DateTime createdAt
        DateTime updatedAt
    }

    MESSAGE {
        String id PK "cuid"
        String content "Nội dung tin nhắn"
        String teamId FK "Team"
        String senderId FK "User"
        DateTime createdAt
    }

    NOTIFICATION {
        String id PK "cuid"
        String userId FK "User (người nhận)"
        NotificationType type "TASK_ASSIGNED | TEAM_INVITED"
        String title
        String message
        String link "URL điều hướng"
        Boolean isRead "default: false"
        DateTime createdAt
    }
```

---

## 🔒 3. Ma trận Phân quyền Nâng cao (Advanced RBAC Matrix)

| Chức năng | OWNER | ADMIN | MEMBER | Ghi chú & Server Validation |
| :--- | :---: | :---: | :---: | :--- |
| **Xem Team & Task Board** | ✅ | ✅ | ✅ | Bắt buộc là thành viên hoặc chủ sở hữu team |
| **Tham gia Team Chat** | ✅ | ✅ | ✅ | Gửi và nhận tin nhắn real-time |
| **Tạo Task mới** | ✅ | ✅ | ✅ | Mọi thành viên đều được tạo task |
| **Chỉnh sửa Task** | ✅ (Mọi task) | ✅ (Mọi task) | ⚠️ **Chỉ Creator hoặc Assignee** | Server chặn Member sửa task của người khác |
| **Xóa Task** | ✅ (Mọi task) | ✅ (Mọi task) | ⚠️ **Chỉ Creator hoặc Assignee** | Server chặn Member xóa task của người khác |
| **Mời thành viên mới (Invite)** | ✅ | ✅ | ❌ | Gán vai trò mặc định là `MEMBER` |
| **Thay đổi vai trò (Role Management)** | ✅ (Sửa Admin & Member) | ⚠️ (Chỉ sửa role Member) | ❌ | **Chặn Admin sửa Owner hoặc Admin khác** |
| **Xóa thành viên (Remove Member)** | ✅ (Xóa Admin & Member) | ⚠️ (Chỉ xóa Member) | ❌ | **Chặn Admin xóa Owner hoặc Admin khác** |
| **Chỉnh sửa thông tin Team** | ✅ | ❌ | ❌ | Chỉ Owner |
| **Xóa Team** | ✅ | ❌ | ❌ | **Admin & Member không được xóa team** |

---

## 📡 4. Danh sách API Endpoints

### 4.1. Authentication
- `POST /api/auth/register`: Đăng ký tài khoản (hỗ trợ hash bcrypt, auto-login JWT HttpOnly cookie).
- `POST /api/auth/login`: Đăng nhập bằng email/password, trả về JWT & cấp cookie HttpOnly.
- `POST /api/auth/logout`: Đăng xuất và xóa session cookie.
- `GET /api/auth/me`: Lấy thông tin user đăng nhập hiện tại.

### 4.2. Teams Management
- `GET /api/teams`: Lấy danh sách teams của user (kèm `currentUserRole`).
- `POST /api/teams`: Tạo team mới (người tạo tự động trở thành `OWNER`).
- `GET /api/teams/[id]`: Lấy chi tiết team, danh sách thành viên, danh sách task.
- `PUT /api/teams/[id]`: Cập nhật tên/mô tả team (**OWNER ONLY**). Phát sóng `team:updated`.
- `DELETE /api/teams/[id]`: Xóa toàn bộ team (**OWNER ONLY**). Phát sóng `team:deleted`.

### 4.3. Role Management & Members
- `POST /api/teams/[id]/members`: Thêm thành viên bằng email (**OWNER & ADMIN**). Tự động tạo notification `TEAM_INVITED` và phát sóng `member:added`.
- `PATCH /api/teams/[id]/members/[memberId]/role`: Cập nhật vai trò thành viên (**OWNER & ADMIN**, có server validation chặn Admin sửa Owner/Admin khác). Phát sóng `member:updated`.
- `DELETE /api/teams/[id]/members/[memberId]`: Xóa thành viên khỏi team (**OWNER & ADMIN**, Admin chỉ xóa Member). Unassign task và phát sóng `member:removed`.

### 4.4. Task Management
- `GET /api/teams/[id]/tasks`: Lấy danh sách tasks trong team.
- `POST /api/teams/[id]/tasks`: Tạo task mới. Tự động tạo notification `TASK_ASSIGNED` nếu có gán người khác. Phát sóng `task:created`.
- `PUT` & `PATCH /api/tasks/[id]`: Cập nhật task (kiểm tra RBAC). Tự động tạo notification nếu đổi assignee. Phát sóng `task:updated`.
- `DELETE /api/tasks/[id]`: Xóa task (Owner & Admin xóa mọi task; Member chỉ xóa task do mình tạo hoặc được gán). Phát sóng `task:deleted`.

### 4.5. Team Chat (Real-time)
- `GET /api/teams/[id]/messages`: Lấy lịch sử chat của team (sắp xếp tăng dần theo thời gian).
- `POST /api/teams/[id]/messages`: Gửi tin nhắn mới, lưu CSDL và phát sóng real-time `chat:message` tới các thành viên online.

### 4.6. Notifications System
- `GET /api/notifications`: Lấy danh sách thông báo và số lượng chưa đọc (`unreadCount`) của user hiện tại.
- `PATCH /api/notifications/[id]/read`: Đánh dấu 1 thông báo là đã đọc.
- `PATCH /api/notifications/read-all`: Đánh dấu tất cả thông báo của user là đã đọc.

### 4.7. Real-time Fallback Stream
- `GET /api/realtime/sse?channel=[channelName]`: Kênh Server-Sent Events tự động giữ kết nối mở phục vụ realtime stream.

---

## ⚡ 5. Hướng dẫn Cấu hình Real-time (Supabase Realtime & Pusher)

Hệ thống được thiết kế theo kiến trúc **đa tầng (Multi-tier Realtime)**:
1. **Supabase Realtime Broadcast**: Khi cấu hình `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (hoặc Anon Key).
2. **Pusher Channels**: Khi cấu hình `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`.
3. **Server-Sent Events (SSE)**: Tự động chạy sẵn qua Next.js Route Handler `/api/realtime/sse` mà không cần cấu hình bên ngoài.
4. **Browser BroadcastChannel**: Đồng bộ giữa các tab trình duyệt trong môi trường phát triển local.

### 5.1. Cấu hình biến môi trường (`.env`)
Sao chép `.env.example` thành `.env` và điền thông tin:

```env
# 1. Supabase (Database & Realtime)
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# 2. Prisma Connection Strings (Pooler & Direct)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# 3. JWT Authentication
JWT_SECRET="taskflow-super-secure-jwt-secret-sdn302-2026"

# 4. Pusher Channels (Tùy chọn Realtime dự phòng)
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```

### 5.2. Chống Memory Leak khi Unsubscribe
Tất cả client components (`TeamChat`, `KanbanBoard`, `TeamDetailPage`, `NotificationBell`) đều sử dụng hook:

```ts
useEffect(() => {
  const unsubscribe = subscribeToRealtimeChannel(channelName, (event, payload) => {
    // Xử lý event
  });

  return () => {
    unsubscribe(); // Dọn dẹp sạch sẽ EventSource, Supabase channel, Pusher channel & BroadcastChannel
  };
}, [channelName]);
```

---

## 🛠️ 6. Hướng dẫn Chạy Dự án (Getting Started)

### Bước 1: Cài đặt Dependencies
```bash
npm install
```

### Bước 2: Đồng bộ Prisma Database & Client
```bash
# Tạo Prisma Client types
npx prisma generate

# Đẩy schema lên database (hoặc migrate)
npx prisma db push
```

### Bước 3: Khởi chạy Development Server
```bash
npm run dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

### Bước 4: Kiểm tra Code Quality & Build Production
```bash
# Chạy linter
npm run lint

# Build production bundle
npm run build
```
