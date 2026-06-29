"use server";

import prisma from "@/src/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/src/lib/session";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

// Import your email templates (Make sure you created these in the previous step!)
import { ExistingUserEmail, NewUserEmail } from "@/src/lib/emails/group-invite";

const resend = new Resend(process.env.RESEND_API_KEY);

async function getUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const parsed = await decrypt(session);
  if (!parsed?.userId) throw new Error("Unauthorized");
  
  return prisma.user.findUnique({ where: { id: parsed.userId as string } });
}

export async function createGroupAction(name: string, type: "GROCERY" | "DEBT" = "GROCERY") {
  const user = await getUser();
  if (!user) return;

  await prisma.group.create({
    data: {
      name,
      type,
      members: {
        create: {
          userId: user.id,
          email: user.email,
          name: user.name || "You",
          role: "owner",
          status: "joined",
        }
      }
    }
  });
  revalidatePath("/");
}

export async function deleteGroupAction(groupId: string) {
  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath("/");
}

export async function inviteMemberAction(groupId: string, email: string, name: string) {
  const inviter = await getUser();
  if (!inviter) throw new Error("Unauthorized");

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Group not found");

  // 1. Check if the invited email already belongs to a registered User
  const existingUser = await prisma.user.findUnique({ where: { email } });

  let resultStatus = "invited";

  if (existingUser) {
    // SCENARIO A: User exists -> Add to group immediately as ACTIVE
    await prisma.groupMember.create({
      data: {
        groupId,
        userId: existingUser.id,
        email,
        name: existingUser.name || name || email.split("@")[0],
        role: "member",
        status: "joined",
      }
    });
    resultStatus = "joined";

    // Attempt to send "Added to group" email
    try {
      await resend.emails.send({
        from: 'Flux <hello@your-domain.com>', // Update this to your verified Resend domain
        to: email,
        subject: `You've been added to ${group.name}`,
        react: ExistingUserEmail({ groupName: group.name, inviterName: inviter.name || "A friend" }),
      });
    } catch (e) { console.error("Email failed to send:", e) }

  } else {
    // SCENARIO B: Shadow Account -> Add to group as INACTIVE
    await prisma.groupMember.create({
      data: {
        groupId,
        // No userId provided, meaning this is a shadow account
        email,
        name: name || email.split("@")[0],
        role: "member",
        status: "invited",
      }
    });

    // Attempt to send "Create an account" email
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev', // Update this to your verified Resend domain
        to: email,
        subject: `${inviter.name || "A friend"} invited you to Flux`,
        react: NewUserEmail({ groupName: group.name, inviterName: inviter.name || "A friend" }),
      });
    } catch (e) { console.error("Email failed to send:", e) }
  }

  revalidatePath("/");
  return { status: resultStatus };
}

export async function removeMemberAction(memberId: string) {
  await prisma.groupMember.delete({ where: { id: memberId } });
  revalidatePath("/");
}

export async function addSharedGroceryItem(groupId: string, name: string, quantity: number, amount: number | null) {
  const user = await getUser();
  if (!user) return;

  await prisma.groceryItem.create({
    data: {
      userId: user.id,
      groupId,
      name,
      quantity,
      amount,
      addedByName: user.name || "You",
    }
  });
  revalidatePath("/");
}