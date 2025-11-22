import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashed }, // ensure your field is correct
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
