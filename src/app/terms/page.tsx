import type { Metadata } from "next";
import LegalPage, { ContactSection, LegalSection } from "@/components/LegalPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `利用規約 - ${SITE_NAME}`,
};

export default function TermsPage() {
  return (
    <LegalPage title="利用規約">
      <LegalSection title="1. 適用">
        <p>
          本規約は、{SITE_NAME}(以下「本サービス」)の利用条件を定めるものです。利用者は、本サービスを利用することで、本規約に同意したものとみなされます。
        </p>
      </LegalSection>

      <LegalSection title="2. サービスの内容">
        <p>
          本サービスは、League of
          Legendsのマッチアップ(対面)に関するメモの作成と、Riot
          Gamesが提供するデータを用いた戦績の表示を行う、個人が運営する非営利のツールです。
        </p>
      </LegalSection>

      <LegalSection title="3. Riot Gamesとの関係">
        <p>
          本サービスは、Riot Gamesの公認・提携を受けたものではなく、Riot
          Gamesまたはその関係者の見解を反映するものではありません。League of
          LegendsおよびRiot Gamesは、Riot Games,
          Inc.の商標または登録商標です。League of Legends © Riot Games, Inc.
        </p>
      </LegalSection>

      <LegalSection title="4. アカウントとログイン">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            マッチアップメモの作成・閲覧には、GoogleまたはDiscordのアカウントでのログインが必要です。
          </li>
          <li>
            利用者は、自己のアカウントを適切に管理するものとし、第三者に利用させてはいけません。
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. 禁止事項">
        <p>利用者は、次の行為をしてはいけません。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>法令または公序良俗に反する行為</li>
          <li>
            本サービスのAPIや画面に対する、自動化されたプログラム等による過度なアクセスなど、サービスの運営や他の利用者の利用を妨げる行為
          </li>
          <li>
            本サービスや、Riot
            Gamesのサービスに対する、不正アクセスやその試み、脆弱性の悪用
          </li>
          <li>
            メモに、他者の権利を侵害する内容や、個人を特定できる情報を含める行為
          </li>
          <li>その他、運営者が不適切と判断する行為</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. 利用者が作成したメモ">
        <p>
          メモの内容に関する権利は、利用者に帰属します。運営者は、メモを、本サービスの提供および障害対応に必要な範囲でのみ取り扱い、他の利用者に公開しません。
        </p>
      </LegalSection>

      <LegalSection title="7. 免責事項">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            本サービスは、現状有姿で提供されます。表示される戦績等のデータは、Riot
            Gamesが提供するものに基づいており、その正確性・完全性・最新性を保証するものではありません。
          </li>
          <li>
            個人が運営するサービスのため、予告なく、機能の変更・中断・終了を行うことがあります。メモ等のデータが失われる可能性もあるため、重要な内容は、利用者自身でも控えを取ることをおすすめします。
          </li>
          <li>
            本サービスの利用により生じた損害について、運営者は、故意または重過失がある場合を除き、責任を負いません。
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. 利用の停止">
        <p>
          利用者が本規約に違反した場合、運営者は、事前の通知なく、利用の停止やアカウントの削除を行うことがあります。
        </p>
      </LegalSection>

      <LegalSection title="9. 規約の変更">
        <p>
          運営者は、必要に応じて、本規約を変更することがあります。変更後の内容は、本ページに掲載した時点から効力を生じます。
        </p>
      </LegalSection>

      <LegalSection title="10. 準拠法">
        <p>本規約は、日本法に基づき解釈されます。</p>
      </LegalSection>

      <LegalSection title="11. 個人情報の取り扱い">
        <p>
          利用者の情報の取り扱いについては、
          <a
            href="/privacy"
            className="text-sky-400 underline-offset-2 hover:underline"
          >
            プライバシーポリシー
          </a>
          をご確認ください。
        </p>
      </LegalSection>

      <ContactSection />
    </LegalPage>
  );
}
