import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Create a test user with minimal required fields
    const hashedPassword = await bcrypt.hash('Passw0rd!', 10)

    const user = await prisma.user.create({
      data: {
        email: 'test@uob.edu',
        name: 'Test User',
        role: 'ADMIN',
        status: 'ACTIVE',
        passwordHash: hashedPassword,
      }
    })

    console.log('Test user created:', user)
  } catch (error) {
    console.error('Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()