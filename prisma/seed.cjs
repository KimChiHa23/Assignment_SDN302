const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Assignment 3 & 4 demo data to Supabase...");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("123456", salt);

  // 1. Tạo 3 người dùng đại diện 3 vai trò
  const owner = await prisma.user.upsert({
    where: { email: "owner@taskflow.dev" },
    update: { password: hashedPassword },
    create: {
      name: "Tran Van Owner",
      email: "owner@taskflow.dev",
      password: hashedPassword,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@taskflow.dev" },
    update: { password: hashedPassword },
    create: {
      name: "Le Thi Admin",
      email: "admin@taskflow.dev",
      password: hashedPassword,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@taskflow.dev" },
    update: { password: hashedPassword },
    create: {
      name: "Pham Van Member",
      email: "member@taskflow.dev",
      password: hashedPassword,
    },
  });

  console.log("Users created/verified:");
  console.log(" - Owner: owner@taskflow.dev (Pass: 123456)");
  console.log(" - Admin: admin@taskflow.dev (Pass: 123456)");
  console.log(" - Member: member@taskflow.dev (Pass: 123456)");

  // 2. Tạo Team mẫu
  let team = await prisma.team.findFirst({
    where: { name: "SDN302 Real-time Project" },
  });

  if (!team) {
    team = await prisma.team.create({
      data: {
        name: "SDN302 Real-time Project",
        description:
          "Team thực hiện Assignment 3 & 4 với Real-time Collaboration, RBAC, Team Chat và Notifications",
        ownerId: owner.id,
      },
    });
  }

  // 3. Thêm các thành viên với vai trò OWNER, ADMIN, MEMBER
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: { teamId: team.id, userId: owner.id },
    },
    update: { role: "OWNER" },
    create: {
      teamId: team.id,
      userId: owner.id,
      role: "OWNER",
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: { teamId: team.id, userId: admin.id },
    },
    update: { role: "ADMIN" },
    create: {
      teamId: team.id,
      userId: admin.id,
      role: "ADMIN",
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: { teamId: team.id, userId: member.id },
    },
    update: { role: "MEMBER" },
    create: {
      teamId: team.id,
      userId: member.id,
      role: "MEMBER",
    },
  });

  // Nếu có user hiện tại khác trong CSDL, thêm họ vào team này với quyền OWNER để họ dùng ngay được
  const existingUsers = await prisma.user.findMany({
    where: {
      email: { notIn: ["owner@taskflow.dev", "admin@taskflow.dev", "member@taskflow.dev"] },
    },
  });

  for (const u of existingUsers) {
    await prisma.teamMember.upsert({
      where: {
        teamId_userId: { teamId: team.id, userId: u.id },
      },
      update: {},
      create: {
        teamId: team.id,
        userId: u.id,
        role: "OWNER",
      },
    });
  }

  // 4. Tạo Tasks phân bố đều 3 cột Kanban (To Do, In Progress, Done)
  const existingTasks = await prisma.task.findMany({ where: { teamId: team.id } });
  if (existingTasks.length === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: "Thiết lập Supabase Realtime Channels",
          description: "Cấu hình kênh broadcast và kiểm thử gửi nhận tin nhắn real-time giữa các client.",
          status: "Done",
          priority: "High",
          teamId: team.id,
          creatorId: owner.id,
          assigneeId: admin.id,
          dueDate: new Date(Date.now() + 86400000 * 2),
        },
        {
          title: "Xây dựng Live Kanban Task Board kéo thả",
          description: "Triển khai giao diện Kanban 3 cột To Do, In Progress, Done kèm đồng bộ real-time.",
          status: "In Progress",
          priority: "High",
          teamId: team.id,
          creatorId: admin.id,
          assigneeId: member.id,
          dueDate: new Date(Date.now() + 86400000 * 4),
        },
        {
          title: "Kiểm thử hệ thống RBAC cho Admin và Member",
          description: "Chặn Admin xóa Owner, chặn Member xóa task người khác.",
          status: "To Do",
          priority: "Medium",
          teamId: team.id,
          creatorId: owner.id,
          assigneeId: member.id,
          dueDate: new Date(Date.now() + 86400000 * 6),
        },
        {
          title: "Tối ưu hóa UI Dark Mode và Responsive Mobile",
          description: "Kiểm tra giao diện chat và notification bell trên màn hình di động.",
          status: "To Do",
          priority: "Low",
          teamId: team.id,
          creatorId: member.id,
          assigneeId: owner.id,
          dueDate: new Date(Date.now() + 86400000 * 7),
        },
      ],
    });
  }

  // 5. Tạo tin nhắn mẫu trong Team Chat
  const existingMessages = await prisma.message.findMany({ where: { teamId: team.id } });
  if (existingMessages.length === 0) {
    await prisma.message.createMany({
      data: [
        {
          content: "Chào cả team! Chúng ta bắt đầu triển khai Assignment 3 & 4 nhé.",
          teamId: team.id,
          senderId: owner.id,
          createdAt: new Date(Date.now() - 3600000 * 3),
        },
        {
          content: "Chào anh Owner! Em đã chuẩn bị sẵn các API route cho Live Chat và Notifications.",
          teamId: team.id,
          senderId: admin.id,
          createdAt: new Date(Date.now() - 3600000 * 2),
        },
        {
          content: "Tuyệt vời, em đang hoàn thiện phần kéo thả task trên Kanban Board ạ!",
          teamId: team.id,
          senderId: member.id,
          createdAt: new Date(Date.now() - 3600000),
        },
      ],
    });
  }

  // 6. Tạo Notifications mẫu
  for (const u of [owner, admin, member, ...existingUsers]) {
    const userNotifs = await prisma.notification.findMany({ where: { userId: u.id } });
    if (userNotifs.length === 0) {
      await prisma.notification.createMany({
        data: [
          {
            userId: u.id,
            type: "TEAM_INVITED",
            title: "Team Invitation",
            message: `You were added to team "${team.name}" by Tran Van Owner`,
            link: `/teams/${team.id}`,
            isRead: false,
            createdAt: new Date(Date.now() - 1800000),
          },
          {
            userId: u.id,
            type: "TASK_ASSIGNED",
            title: "Task Assigned",
            message: `You were assigned to task "Xây dựng Live Kanban Task Board kéo thả" in team "${team.name}"`,
            link: `/teams/${team.id}`,
            isRead: false,
            createdAt: new Date(Date.now() - 900000),
          },
        ],
      });
    }
  }

  console.log("Successfully seeded demo data for Assignment 3 & 4!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
