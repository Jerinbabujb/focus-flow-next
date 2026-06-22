"use client"

import type React from "react"
import { useState } from "react"
import { Sparkles, Mail, Lock, User, Eye, EyeOff, Check, X } from "lucide-react"
import { useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils"
import { authenticate } from "@/src/actions/auth";
import { useTransition } from "react";
type Mode = "login" | "signup"

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [submitted, setSubmitted] = useState<string | null>(null)
  const router= useRouter();

  const isSignup = mode === "signup"
  const passwordsMatch =
    form.password.length > 0 && form.password === form.confirmPassword

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSubmitted(null)
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setSubmitted(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  startTransition(async () => {
    const formData = new FormData();
    formData.append("email", form.email);
    formData.append("password", form.password);
    if (isSignup) formData.append("username", form.username);

    const result = await authenticate(formData, isSignup);
    
    if (result?.error) {
      setSubmitted(result.error); // Show error in your UI
    }
  });
};

  return (
    <main className="app-backdrop flex min-h-screen items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-2xl p-6 sm:p-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <Sparkles className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
              {isSignup
                ? "Sign up to start organizing your day with Flux."
                : "Sign in to continue to your Flux workspace."}
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-secondary/60 p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                mode === m
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={mode === m}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {isSignup && (
            <Field
              id="username"
              label="Username"
              icon={<User className="size-4" aria-hidden="true" />}
            >
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                placeholder="janedoe"
                className={inputClass}
              />
            </Field>
          )}

          <Field
            id="email"
            label="Email"
            icon={<Mail className="size-4" aria-hidden="true" />}
          >
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </Field>

          <Field
            id="password"
            label="Password"
            icon={<Lock className="size-4" aria-hidden="true" />}
          >
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="••••••••"
              className={cn(inputClass, "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </Field>

          {isSignup && (
            <Field
              id="confirmPassword"
              label="Confirm password"
              icon={<Lock className="size-4" aria-hidden="true" />}
            >
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                placeholder="••••••••"
                className={cn(inputClass, "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                aria-label={
                  showConfirm ? "Hide confirm password" : "Show confirm password"
                }
              >
                {showConfirm ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </Field>
          )}

          {isSignup && form.confirmPassword.length > 0 && (
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs",
                passwordsMatch ? "text-chart-3" : "text-destructive",
              )}
            >
              {passwordsMatch ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <X className="size-3.5" aria-hidden="true" />
              )}
              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
            </p>
          )}

          {!isSignup && (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSignup && !passwordsMatch}
            className="mt-1 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSignup ? "Create account" : "Log in"}
          </button>

          {submitted && (
            <p
              className="rounded-lg bg-chart-3/15 px-3 py-2 text-center text-sm text-chart-3"
              role="status"
            >
              {submitted}
            </p>
          )}
        </form>

        {/* Footer switch */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(isSignup ? "login" : "signup")}
            className="font-medium text-primary hover:underline"
          >
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </main>
  )
}

const inputClass =
  "w-full rounded-xl border border-input bg-secondary/50 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/30"

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}
