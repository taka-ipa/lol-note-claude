import type { ReactNode } from "react";
import Link from "next/link";
import { CONTACT_INFO, LEGAL_UPDATED_AT } from "@/lib/site";

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-base font-semibold text-white">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-neutral-300">
        {children}
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <LegalSection title="お問い合わせ">
      <p>
        本サービスに関するお問い合わせ、保存された情報の確認・削除のご依頼は、次の窓口までご連絡ください。
      </p>
      <p className="text-neutral-200">
        {CONTACT_INFO ? (
          <a
            href={CONTACT_INFO.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 underline-offset-2 hover:underline"
          >
            {CONTACT_INFO.label}
          </a>
        ) : (
          "(準備中)"
        )}
      </p>
    </LegalSection>
  );
}

export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-neutral-400 transition-colors hover:text-white"
      >
        ← トップへ戻る
      </Link>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="mt-1 text-xs text-neutral-500">
        制定・最終更新: {LEGAL_UPDATED_AT}
      </p>
      {children}
    </article>
  );
}
