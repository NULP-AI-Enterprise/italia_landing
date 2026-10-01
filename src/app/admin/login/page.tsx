import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Вхід" };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <main className="admin-login">
      <h1>Адмін-панель Made in Ukraine for Italy</h1>
      <p className="admin-muted">Заявки та всі тексти, фото й списки сайту.</p>
      <LoginForm />
    </main>
  );
}
