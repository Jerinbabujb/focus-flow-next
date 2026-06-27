"use server";

import prisma from "@/src/lib/prisma";
import { hash } from "bcryptjs"; // Ensure you have this installed

export async function updatePasswordAction(newPassword: string, userId: string) {
  const hashedPassword = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
  return { success: true };
}