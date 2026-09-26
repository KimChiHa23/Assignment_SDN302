import { PrismaClient } from "@prisma/client";

// Chuẩn hóa DATABASE_URL tự động:
// Vercel Serverless chỉ hỗ trợ IPv4, trong khi direct host `db.<ref>.supabase.co` là IPv6.
// Đoạn code này đảm bảo tự động chuyển đổi sang IPv4 Connection Pooler nếu người dùng vô tình truyền direct URL.
function getDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  if (url.includes("db.ujvjehrcfkwkfwdtlfka.supabase.co")) {
    url = url
      .replace("postgresql://postgres:", "postgresql://postgres.ujvjehrcfkwkfwdtlfka:")
      .replace("db.ujvjehrcfkwkfwdtlfka.supabase.co:5432", "aws-0-ap-southeast-1.pooler.supabase.com:6543");
    if (!url.includes("pgbouncer=true")) {
      url += url.includes("?") ? "&pgbouncer=true" : "?pgbouncer=true";
    }
  }

  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
