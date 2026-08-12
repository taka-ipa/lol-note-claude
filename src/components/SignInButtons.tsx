import { signInWithDiscord, signInWithGoogle } from "@/lib/authActions";

export default function SignInButtons({
  callbackUrl,
  compact = false,
}: {
  callbackUrl?: string;
  compact?: boolean;
}) {
  const buttonClassName = compact
    ? "rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
    : "rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <form action={signInWithGoogle.bind(null, callbackUrl)}>
        <button type="submit" className={buttonClassName}>
          Googleでログイン
        </button>
      </form>
      <form action={signInWithDiscord.bind(null, callbackUrl)}>
        <button type="submit" className={buttonClassName}>
          Discordでログイン
        </button>
      </form>
    </div>
  );
}
