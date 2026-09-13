import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/common/States";
import { AuthShell } from "@/components/auth/AuthShell";

const DEMO_ACCOUNTS = [
  "shashank@demo.io",
  "supreeth@demo.io",
  "vishal@demo.io",
  "vijay@demo.io",
  "shreya@demo.io",
  "rahul@demo.io",
];

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const [email, setEmail] = useState("shashank@demo.io");
  const [password, setPassword] = useState("password123");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/chat");
    } catch {
      // error surfaced via store
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep the conversation going."
      footer={
        <p className="text-sm text-ink-500 dark:text-ink-400">
          New here?{" "}
          <Link to="/register" className="font-semibold text-accent-500 hover:text-accent-600">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

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
          Sign in
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-ink-200 p-3 text-xs text-ink-400 dark:border-ink-700 dark:text-ink-500">
        <p className="mb-1 font-semibold text-ink-500 dark:text-ink-300">Demo accounts (password: password123)</p>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc}
              type="button"
              onClick={() => setEmail(acc)}
              className="rounded-full bg-ink-100 px-2.5 py-1 font-medium text-ink-500 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
            >
              {acc}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-600 dark:text-ink-300">{label}</span>
      <input
        type={type}
        required
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none transition focus:border-accent-400 focus:ring-2 focus:ring-accent-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-accent-900/40"
      />
    </label>
  );
}
