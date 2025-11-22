import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is required. Please check your .env file."
    )
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma