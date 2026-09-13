import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/common/States";
import { AuthShell } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate("/chat");
    } catch {
      // error surfaced via store
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start chatting with your team in seconds."
      footer={
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-accent-500 hover:text-accent-600">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-600 dark:text-ink-300">Full name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jordan Lee"
            className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none transition focus:border-accent-400 focus:ring-2 focus:ring-accent-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-accent-900/40"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-600 dark:text-ink-300">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none transition focus:border-accent-400 focus:ring-2 focus:ring-accent-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-accent-900/40"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-600 dark:text-ink-300">Password</span>
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none transition focus:border-accent-400 focus:ring-2 focus:ring-accent-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-accent-900/40"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-coral-500/10 px-3 py-2 text-sm text-coral-600 dark:text-coral-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-2.5 font-semibold text-white transition hover:bg-accent-600 disabled:opacity-60"
        >
          {status === "loading" && <Spinner className="h-4 w-4 text-white" />}
          Create account
        </button>
      </form>
    </AuthShell>
  );
}
