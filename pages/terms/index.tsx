import Head from "next/head";
import Link from "next/link";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

const TermsPage = () => {
  return (
    <>
      <Head>
        <title>Miuu Note Terms of Use</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" type="image/x-icon" href="favicon.ico" />
      </Head>

      <main
        className={`flex min-h-screen flex-col justify-between ${montserrat.className} p-6`}
      >
        <strong>Terms of Use</strong>
        <p>
          These terms apply to the Miuu Note &mdash; Diary With Lock app
          (&ldquo;the app&rdquo;), published by Miuu Studio, a sole
          proprietorship registered in Ontario, Canada (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;). By using the app you agree to
          them. If you obtained the app from the Apple App Store, Apple&apos;s
          Licensed Application End User License Agreement also applies and takes
          precedence where the two differ.
        </p>

        <p>
          <strong>The app</strong>
        </p>
        <p>
          The app is a personal diary. The base version is free and shows ads.
          Optional in-app purchases remove ads and unlock additional features,
          either as a subscription or as a one-time upgrade.
        </p>

        <p>
          <strong>Your content</strong>
        </p>
        <p>
          Everything you write, draw, record or add to the app is yours. We
          claim no ownership of it and no licence to use it, beyond what is
          needed to run the features you turn on &mdash; for example storing a
          backup you asked for, or sending an entry&apos;s text to the AI
          provider if you enable the optional AI features. How that works, and
          what leaves your device, is described in our{" "}
          <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>
        <p>
          Your entries are stored on your device. They are not recoverable by us
          if you delete the app without a backup, so we recommend keeping backup
          turned on.
        </p>

        <p>
          <strong>Purchases and subscriptions</strong>
        </p>
        <ul>
          <li>
            Payment, renewal and refunds are handled by the App Store or Google
            Play under their terms, not by us. We never see your card details.
          </li>
          <li>
            A subscription renews automatically until you cancel it in your
            store account. Cancelling stops future renewals; it does not refund
            the current period.
          </li>
          <li>
            Deleting the app, or deleting your Miuu account, does not cancel a
            subscription. Cancel it in your store account.
          </li>
          <li>
            Prices and what a plan includes may change. Changes apply to new
            purchases and to renewals after we tell you.
          </li>
        </ul>

        <p>
          <strong>Using the app fairly</strong>
        </p>
        <p>Please do not:</p>
        <ul>
          <li>
            use the app to break the law, or to store or distribute content that
            is illegal where you are;
          </li>
          <li>
            attempt to gain access to other users&apos; data, or to our systems
            beyond what the app offers;
          </li>
          <li>
            automate, script or otherwise call our services in a way that is not
            the app doing its ordinary work.
          </li>
        </ul>
        <p>
          We may suspend access to the paid or server-backed features of an
          account that is being used this way.
        </p>

        <p>
          <strong>Age</strong>
        </p>
        <p>
          The app is intended for users aged 18 and over. The AI features are
          available only to adults, and you will be asked to confirm your age
          before you can turn them on.
        </p>

        <p>
          <strong>AI features</strong>
        </p>
        <p>
          The optional AI features produce interpretations of what you have
          written. They can be wrong, and they are not advice of any kind &mdash;
          medical, psychological, legal or otherwise. If you are in distress,
          please contact a qualified professional or a local emergency service.
        </p>

        <p>
          <strong>Availability and changes</strong>
        </p>
        <p>
          We may add, change or withdraw features, and the app depends on
          services (app stores, cloud providers) we do not control. We do not
          promise uninterrupted availability.
        </p>

        <p>
          <strong>Our responsibility</strong>
        </p>
        <p>
          The app is provided as-is. To the extent permitted by the law that
          applies to you, we are not liable for lost or corrupted data, for
          failed backups or restores, or for indirect or consequential loss.
          Nothing here limits rights you have as a consumer that cannot be
          limited by agreement, including your statutory rights in the European
          Economic Area, the United Kingdom, and other places with similar
          protections.
        </p>

        <p>
          <strong>Ending these terms</strong>
        </p>
        <p>
          You may stop using the app at any time by deleting it. We may end
          these terms if you breach them materially.
        </p>

        <p>
          <strong>Governing law</strong>
        </p>
        <p>
          These terms are governed by the laws of the Province of Ontario and
          the federal laws of Canada applicable therein, without affecting any
          mandatory consumer protections in your country of residence.
        </p>

        <p>
          <strong>Contact</strong>
        </p>
        <p>
          Questions about these terms:{" "}
          <a href="mailto:support@miuustudio.com">support@miuustudio.com</a>
        </p>

        <p>Effective Date: September 19, 2026</p>
      </main>
    </>
  );
};

export default TermsPage;
