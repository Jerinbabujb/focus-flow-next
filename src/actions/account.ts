"use server";

import prisma from "@/src/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/src/lib/session";
import { hash } from "bcryptjs"; // Make sure to npm install bcryptjs if you haven't

async function getUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const parsed = await decrypt(session);
  return parsed?.userId as string | undefined;
}

export async function updateNameAction(newName: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: userId },
    data: { name: newName },
  });
}

export async function updatePasswordAction(newPassword: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  const hashedPassword = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}