import Image from "next/image";
import { auth, signOut } from "@/auth";
import SignInButtons from "@/components/SignInButtons";

export default async function AuthStatus() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return <SignInButtons compact />;
  }

  return (
    <div className="flex items-center gap-2">
      {user.image && (
        <Image
          src={user.image}
          alt=""
          width={26}
          height={26}
          unoptimized
          className="rounded-full"
        />
      )}
      <span className="hidden max-w-[8rem] truncate text-sm text-neutral-300 sm:inline">
        {user.name}
      </span>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button
          type="submit"
          className="rounded-lg border border-neutral-700 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          ログアウト
        </button>
      </form>
    </div>
  );
}
