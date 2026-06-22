import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// In production, set this in your Vercel Environment Variables
const secretKey = process.env.SESSION_SECRET || "hackathon-super-secret-key";
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, expiresAt });

  // 1. Await the cookies object here
  const cookieStore = await cookies(); 

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

// 2. Make this function async
export async function deleteSession() {
  // 3. Await the cookies object here too
  const cookieStore = await cookies(); 
  cookieStore.delete("session");
}