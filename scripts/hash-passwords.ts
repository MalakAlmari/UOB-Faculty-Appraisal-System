import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function hashExistingPasswords() {
  console.log("🔐 Hashing existing passwords...")

  try {
    // Get all users
    const users = await prisma.user.findMany()

    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2)
      if (!user.password.startsWith("$2")) {
        console.log(`Hashing password for user: ${user.email}`)

        // Hash the plain text password
        const hashedPassword = await bcrypt.hash(user.password, 10)

        // Update the user with hashed password
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        })

        console.log(`✅ Password hashed for: ${user.email}`)
      } else {
        console.log(`⏭️ Password already hashed for: ${user.email}`)
      }
    }

    console.log("🎉 All passwords have been processed!")
  } catch (error) {
    console.error("❌ Error hashing passwords:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

hashExistingPasswords()