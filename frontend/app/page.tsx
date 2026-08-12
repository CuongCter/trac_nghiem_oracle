import { redirect } from "next/navigation";

/**
 * Root entry — purely a redirect.
 * If a session is in localStorage, the client-side auth guard at
 * /dashboard or /login will pick it up.
 */
export default function HomePage() {
  redirect("/dashboard");
}
