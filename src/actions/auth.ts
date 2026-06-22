"use server";

import prisma from "@/src/lib/prisma"; // Adjust path to your Prisma client
import bcrypt from "bcryptjs";
import { createSession } from "@/src/lib/session";
import { redirect } from "next/navigation";

export async function authenticate(formData: FormData, isSignup: boolean) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  if (isSignup) {
    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { error: "Email already in use" };

    // 2. Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: username,
        password: hashedPassword,
      },
    });

    // 3. Create session
    await createSession(user.id);
  } else {
    // 1. Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "Invalid credentials" };

    // 2. Verify password
    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) return { error: "Invalid credentials" };

    // 3. Create session
    await createSession(user.id);
  }

  // Redirect to your Dashboard
  redirect("/");
}