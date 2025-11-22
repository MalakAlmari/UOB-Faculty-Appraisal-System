import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { put } from "@vercel/blob"
import { prisma } from "@/lib/prisma" // Declare the prisma variable

export async function POST(request: NextRequest) {
   try {
     const session = await getServerSession(authOptions)

     // Debug logging
     console.log("Session:", JSON.stringify(session, null, 2))
     console.log("Session user:", session?.user)
     console.log("Session user id:", session?.user?.id)

     if (!session || !session.user || !session.user.id) {
       console.log("Session validation failed:", {
         hasSession: !!session,
         hasUser: !!session?.user,
         hasId: !!session?.user?.id
       })

       // Try to get user ID from email as fallback
       if (session?.user?.email) {
         console.log("Attempting fallback user lookup by email:", session.user.email)
         try {
           const user = await prisma.user.findUnique({
             where: { email: session.user.email }
           })
           if (user) {
             console.log("Found user by email, using ID:", user.id)
             session.user.id = user.id.toString()
           }
         } catch (error) {
           console.error("Fallback user lookup failed:", error)
         }
       }

       if (!session?.user?.id) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
       }
     }

     console.log("=== PARSING FORM DATA ===")
     const formData = await request.formData()
     console.log("FormData parsed successfully")

     const file = formData.get("file") as File
     const type = formData.get("type") as string // 'appraisal' or 'achievement'
     const entityId = formData.get("entityId") as string
     const achievementType = formData.get("achievementType") as string // 'awards', 'research', 'scientific', 'university', 'community'

     console.log("Parsed values:", { file: !!file, type: type, entityId: entityId, achievementType: achievementType })

     if (!file) {
       console.log("No file provided")
       return NextResponse.json({ error: "No file provided" }, { status: 400 })
     }

     if (!type) {
       console.log("No type provided, type value:", type)
       return NextResponse.json({ error: "No type provided. Expected 'appraisal' or 'achievement'" }, { status: 400 })
     }

     if (!entityId) {
       console.log("No entityId provided, entityId value:", entityId)
       return NextResponse.json({ error: "No entityId provided" }, { status: 400 })
     }

     // Validate file type
     const allowedTypes = [
       "application/pdf",
       "image/jpeg",
       "image/png",
       "image/gif",
       "application/msword",
       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
     ]

     if (!allowedTypes.includes(file.type)) {
       return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
     }

     // Validate file size (10MB max)
     const maxSize = 10 * 1024 * 1024 // 10MB
     if (file.size > maxSize) {
       return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 })
     }

     // Upload file to Vercel Blob Storage
     console.log("=== STARTING BLOB UPLOAD ===")
     const userId = session.user.id

     if (!userId || typeof userId !== 'string') {
       console.error("VALIDATION FAILED - No valid user ID:", {
         userId: userId,
         userIdType: typeof userId,
         sessionUserId: session.user.id,
         sessionUserIdType: typeof session.user.id
       })
       return NextResponse.json({ error: "User ID not available" }, { status: 400 })
     }

     // Generate unique filename
     const timestamp = Date.now()
     const extension = file.name.split(".").pop() || 'bin'
     const filename = `${entityId}-${timestamp}.${extension}`

     try {
       // Upload to Vercel Blob Storage
       const bytes = await file.arrayBuffer()
       const buffer = Buffer.from(bytes)

       console.log("Uploading to blob storage:", filename)
       const blob = await put(filename, buffer, {
         access: 'public',
         contentType: file.type,
         token: process.env.BLOB_READ_WRITE_TOKEN,
       })

       console.log("Blob upload successful:", blob.url)

       // Save file record to database
       const blobUrl = blob.url

       if (type === "appraisal") {
         await prisma.evidence.create({
           data: {
             appraisalId: parseInt(entityId),
             title: file.name,
             description: "Uploaded evidence file",
             url: blobUrl,
             fileKey: filename,
             points: 0,
           },
         })
       } else if (type === "achievement") {
         // For achievements, save to Evidence table with achievementType for later linking
         if (!achievementType) {
           return NextResponse.json({ error: "achievementType is required for achievement uploads" }, { status: 400 })
         }

         await prisma.evidence.create({
           data: {
             appraisalId: parseInt(entityId),
             title: file.name,
             description: `Uploaded ${achievementType} file`,
             url: blobUrl,
             fileKey: filename,
             points: 0,
             achievementType: achievementType,
           },
         })
       }

       return NextResponse.json({
         message: "File uploaded successfully",
         filename,
         url: blobUrl,
         fileKey: filename,
       })
     } catch (blobError) {
       console.error("Blob storage error:", blobError)

       // Fallback: Try alternative storage method
       try {
         console.log("Attempting fallback storage method...")

         // For now, return a base64 data URL as fallback
         // This is a temporary solution until proper blob storage is configured
         const bytes = await file.arrayBuffer()
         const buffer = Buffer.from(bytes)
         const base64Data = buffer.toString('base64')
         const dataUrl = `data:${file.type};base64,${base64Data}`

         // Save to database with data URL
         if (type === "appraisal") {
           await prisma.evidence.create({
             data: {
               appraisalId: parseInt(entityId),
               title: file.name,
               description: "Uploaded evidence file (fallback method)",
               url: dataUrl,
               fileKey: filename,
               points: 0,
             },
           })
         } else if (type === "achievement") {
           if (!achievementType) {
             return NextResponse.json({ error: "achievementType is required for achievement uploads" }, { status: 400 })
           }

           await prisma.evidence.create({
             data: {
               appraisalId: parseInt(entityId),
               title: file.name,
               description: `Uploaded ${achievementType} file (fallback method)`,
               url: dataUrl,
               fileKey: filename,
               points: 0,
               achievementType: achievementType,
             },
           })
         }

         return NextResponse.json({
           message: "File uploaded successfully (fallback method)",
           filename,
           url: dataUrl,
           fileKey: filename,
         })
       } catch (fallbackError) {
         console.error("Fallback storage also failed:", fallbackError)
         return NextResponse.json({
           error: "Failed to upload file. Both blob storage and fallback method failed."
         }, { status: 500 })
       }
     }
  } catch (error) {
    return NextResponse.json({error:"The file has been uploaded successfully" }, { status: 500 })
  }
}
