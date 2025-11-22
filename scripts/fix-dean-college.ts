// Script to fix Dean college assignment
import { prisma } from '../lib/prisma.js'

async function fixDeanCollege() {
  try {
    // Update the Dean's collegeId to match what the session shows
    const dean = await prisma.user.update({
      where: { id: 2 },
      data: { 
        collegeId: 1,
        departmentId: 1 
      }
    })
    
    console.log('Updated Dean user:', dean)
    console.log('Dean now assigned to:')
    console.log('- College ID:', dean.collegeId)
    console.log('- Department ID:', dean.departmentId)
    
    // Verify the fix
    const verify = await prisma.user.findUnique({
      where: { id: 2 },
      include: { 
        department: { include: { college: true } },
        college: true
      }
    })
    
    console.log('Verification:', verify)
    
  } catch (error) {
    console.error('Error fixing Dean college:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDeanCollege()