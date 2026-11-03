import type { Metadata } from "next";
import LegalPage, { ContactSection, LegalSection } from "@/components/LegalPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `プライバシーポリシー - ${SITE_NAME}`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title="プライバシーポリシー">
      <LegalSection title="1. はじめに">
        <p>
          {SITE_NAME}(以下「本サービス」)は、個人が運営する、League of
          Legendsのマッチアップメモ・戦績確認ツールです。本ポリシーは、本サービスが利用者の情報をどのように取得・利用・保管するかを定めます。
        </p>
      </LegalSection>

      <LegalSection title="2. 取得する情報">
        <p className="font-medium text-neutral-200">
          (1) ログインした場合に保存する情報
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            GoogleまたはDiscordのアカウントから提供される、表示名・メールアドレス・プロフィール画像
          </li>
          <li>
            ログインの維持に必要な、認証用のトークンおよびセッション情報
          </li>
          <li>
            利用者が作成したマッチアップメモ(チャンピオン、レーン、メモ本文)
          </li>
          <li>
            利用者が検索したサモナー(リージョン、ゲーム名、タグ)の検索履歴
          </li>
        </ul>
        <p className="font-medium text-neutral-200">
          (2) ログインしなくても保存される情報
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            検索履歴(利用者の端末のブラウザ内に保存されます。本サービスのサーバーには送信されません)
          </li>
          <li>
            サーバーのアクセスログ(IPアドレス等)。ホスティング事業者が不正アクセスの防止・障害対応のために記録します
          </li>
        </ul>
        <p>
          なお、本サービスは、アクセス解析ツールや広告配信サービスを利用していません。
        </p>
      </LegalSection>

      <LegalSection title="3. 利用目的">
        <ul className="list-disc space-y-1 pl-5">
          <li>ログイン機能の提供と、利用者ごとのメモ・検索履歴の管理</li>
          <li>複数の端末(PC・スマホ等)でメモや検索履歴を共有するため</li>
          <li>不正利用の防止、障害の調査、サービスの改善</li>
        </ul>
        <p>取得した情報を、上記以外の目的で利用することはありません。</p>
      </LegalSection>

      <LegalSection title="4. 他の利用者への表示">
        <p>
          マッチアップメモと検索履歴は、ログインした本人のみが閲覧できます。他の利用者に公開されることはありません。
        </p>
      </LegalSection>

      <LegalSection title="5. 外部サービスの利用と情報の送信">
        <p>本サービスは、次の外部サービスを利用しています。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Google・Discord: ログインの認証のため。各社のプライバシーポリシーが適用されます
          </li>
          <li>
            Riot Games API: 戦績の取得のため。利用者が検索したサモナーのゲーム名・タグ・リージョンが、Riot
            Gamesに送信されます。取得した戦績は、負荷軽減のため、一定時間、本サービスのデータベースに一時保存されます
          </li>
          <li>Vercel: 本サービスのホスティング(サーバーの提供)</li>
          <li>Neon: データベースの提供(日本国外のサーバーに保存される場合があります)</li>
          <li>
            Riot GamesのData Dragon: チャンピオンやアイテムなどの画像・データの配信
          </li>
        </ul>
        <p>
          上記のほか、法令に基づく場合を除き、利用者の個人情報を第三者に提供・販売することはありません。
        </p>
      </LegalSection>

      <LegalSection title="6. Cookie等の利用">
        <p>
          ログイン状態を維持するために、Cookieを利用します。ブラウザの設定でCookieを無効にすると、ログインできない場合があります。また、ログインしていない場合の検索履歴の保存には、ブラウザのlocalStorageを利用します。
        </p>
      </LegalSection>

      <LegalSection title="7. 保管期間と削除">
        <p>
          保存した情報は、サービスの提供に必要な期間、保管します。ログインの状態は、一定期間(目安として最終利用から30日程度)利用がない場合に、自動的に失効します。
        </p>
        <p>
          保存された情報の確認や、アカウントおよびメモ・検索履歴の削除を希望される場合は、下記のお問い合わせ窓口までご連絡ください。
        </p>
      </LegalSection>

      <LegalSection title="8. 安全管理">
        <p>
          取得した情報は、不正なアクセス、紛失、漏えい等を防ぐため、アクセス制限やパッケージの更新など、合理的な安全対策を行います。ただし、インターネット上の通信やサービスについて、完全な安全性を保証するものではありません。
        </p>
      </LegalSection>

      <LegalSection title="9. 本ポリシーの変更">
        <p>
          必要に応じて、本ポリシーを変更することがあります。変更後の内容は、本ページに掲載した時点から効力を生じます。
        </p>
      </LegalSection>

      <ContactSection />
    </LegalPage>
  );
}
