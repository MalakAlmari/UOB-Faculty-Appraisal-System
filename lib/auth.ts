import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      departmentId: string | null
      departmentName: string | null
      collegeId: string | null
      collegeName: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    departmentId: string | null
    departmentName: string | null
    collegeId: string | null
    collegeName: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    departmentId: string | null
    departmentName: string | null
    collegeId: string | null
    collegeName: string | null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            department: {
              include: {
                college: true,
              },
            },
          },
        })

        if (!user || user.status !== "ACTIVE") {
          console.log('User not found or not active:', credentials.email)
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash || "")

        if (!isPasswordValid) {
          console.log('Invalid password for user:', credentials.email)
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId?.toString() ?? null,
          departmentName: user.department?.name ?? null,
          collegeId: user.department?.collegeId?.toString() ?? null,
          collegeName: user.department?.college?.name ?? null,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.departmentId = user.departmentId
        token.departmentName = user.departmentName
        token.collegeId = user.collegeId
        token.collegeName = user.collegeName
      }
      return token
    },
    async session({ session, token }) {
       console.log("Session callback - token:", token)
       console.log("Session callback - token.sub:", token?.sub)

       if (token?.sub) {
         try {
           const user = await prisma.user.findUnique({
             where: { id: parseInt(token.sub) },
             include: {
               department: {
                 include: {
                   college: true,
                 },
               },
             },
           });

           console.log("Session callback - found user:", user?.id)

           if (user) {
             session.user.id = user.id.toString();
             session.user.name = user.name;
             session.user.email = user.email;
             session.user.role = user.role;
             session.user.departmentId = user.departmentId?.toString() ?? null;
             session.user.departmentName = user.department?.name ?? null;
             session.user.collegeId = user.department?.collegeId?.toString() ?? null;
             session.user.collegeName = user.department?.college?.name ?? null;

             console.log("Session callback - set user id:", session.user.id)
           } else {
             console.log("Session callback - user not found for id:", token.sub)
           }
         } catch (error) {
           console.error("Session callback - error:", error)

           // Handle specific Prisma connection errors
           if (error instanceof Error) {
             if (error.message.includes("Connection timeout") || error.message.includes("connection pool")) {
               console.error("Session callback - database connection error:", error.message)
             }
           }

           // Don't throw error, just log it and continue with existing session data
         }
       } else {
         console.log("Session callback - no token.sub")
       }
       return session;
     },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
