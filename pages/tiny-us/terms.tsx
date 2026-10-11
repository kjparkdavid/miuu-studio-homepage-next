import Link from "next/link";
import TinyUsPage, { Bullets, Section, SupportEmail } from "@/components/tinyUsPage";

const linkClass = "underline text-[#651DFF]";

const TinyUsTerms = () => {
  return (
    <TinyUsPage
      title="Terms of Use"
      description="The terms for using Tiny Us, the app for two: your content, Plus, coins, and what happens when you delete."
      path="/tiny-us/terms/"
    >
      <h1 className="text-3xl font-extrabold mb-1">Terms of Use</h1>
      <p className="text-sm text-[#9A97A6]">Effective Date: October 10, 2026</p>

      <div className="mt-6 space-y-3">
        <p>
          These terms apply to the Tiny Us app (&ldquo;Tiny Us&rdquo;), published by Miuu Studio, a
          sole proprietorship registered in Ontario, Canada (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By
          using Tiny Us, you agree to them. If you got Tiny Us from the Apple App Store,
          Apple&apos;s Licensed Application End User License Agreement also applies, and it takes
          precedence where the two differ.
        </p>
        <p>
          How we handle your information is described in our{" "}
          <Link href="/tiny-us/privacy-policy/" className={linkClass}>
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <Section title="Tiny Us">
        <p>
          Tiny Us is an app for two people. You and your Partner answer a daily question, keep a
          shared diary, earn coins and decorate a shared room. Tiny Us is free to use. Plus, an
          optional subscription, adds more.
        </p>
      </Section>

      <Section title="Your account">
        <Bullets>
          <li>You must be 18 or over to use Tiny Us.</li>
          <li>
            You can start as a Guest, without saving your spot. A Guest account exists only on your
            phone: if you delete the app or lose your phone before saving your spot with Apple,
            Google or email, the account and everything in it can&apos;t be recovered.
          </li>
          <li>
            You&apos;re responsible for keeping your phone and your sign-in secure. Tell us if you
            think someone else has access to your account.
          </li>
        </Bullets>
      </Section>

      <Section title="Your content, and your Partner">
        <p>
          What you write, answer, photograph or add to Tiny Us is yours. You give us only the
          permission we need to store it, copy it to your Partner&apos;s phone and show it to the
          two of you. We claim no other rights to it.
        </p>
        <p>Tiny Us is shared by design, so please keep in mind:</p>
        <Bullets>
          <li>
            Almost everything you add is visible to your Partner while you are Connected, and they
            can save or share it outside Tiny Us.
          </li>
          <li>
            Your shared home belongs to both of you. Either of you can Disconnect, and either of you
            can then delete the Couple, without the other&apos;s agreement. Deleting a Couple, or
            deleting your account, permanently erases the shared diary, photos, notes, places and
            room for both of you.
          </li>
          <li>
            Only add content you have the right to share. That includes photos of other people.
          </li>
        </Bullets>
        <p>
          Tiny Us doesn&apos;t keep backups we can restore for you, so export anything you want to
          keep before you or your Partner delete it.
        </p>
      </Section>

      <Section title="Plus and purchases">
        <Bullets>
          <li>
            <strong>Plus is shared.</strong> When one of you buys it, both of you have it while you
            are Connected. If you Disconnect, the person who paid keeps Plus.
          </li>
          <li>
            <strong>Payment, renewal and refunds</strong> are handled by the App Store or Google
            Play under their terms, not by us. We never see your card details.
          </li>
          <li>
            <strong>A subscription renews automatically</strong> until you cancel it in your store
            account. Cancelling stops future renewals, and you keep Plus until the end of the
            period you&apos;ve paid for. If a plan comes with a free trial, it turns into a paid
            subscription when the trial ends unless you cancel before then.
          </li>
          <li>
            <strong>Deleting the app, Disconnecting or deleting your account</strong> doesn&apos;t
            cancel a subscription. Cancel it in your store account.
          </li>
          <li>
            <strong>Prices and what Plus includes may change.</strong> Changes apply to new
            purchases, and to renewals after we tell you.
          </li>
        </Bullets>
      </Section>

      <Section title="Coins and items">
        <p>
          Coins are earned in Tiny Us, for example by answering the daily question, and spent on
          items for your room and gifts for your Partner. Coins and items:
        </p>
        <Bullets>
          <li>are a feature of the app, not money: they have no cash value;</li>
          <li>can&apos;t be bought, sold, transferred or exchanged for anything outside Tiny Us;</li>
          <li>belong to your Couple, and are lost if the Couple is deleted.</li>
        </Bullets>
        <p>
          We may change how many coins things earn or cost, and we may correct a balance that is
          wrong because of an error.
        </p>
      </Section>

      <Section title="Using Tiny Us fairly">
        <p>Please don&apos;t:</p>
        <Bullets>
          <li>use Tiny Us to break the law, or to harass, threaten or harm anyone;</li>
          <li>add content that is illegal where you are, or that you don&apos;t have the right to share;</li>
          <li>use Tiny Us to watch or control someone without their consent;</li>
          <li>
            try to get at other people&apos;s data, or into our systems beyond what the app
            offers;
          </li>
          <li>
            automate, script or otherwise call our services in a way that isn&apos;t the app doing
            its ordinary work.
          </li>
        </Bullets>
        <p>We may suspend or close an account that is used this way.</p>
      </Section>

      <Section title="Not a substitute for help">
        <p>
          Tiny Us is a place to stay close, not relationship counselling or any other professional
          advice. If you are in an unsafe relationship or in distress, please contact a qualified
          professional or a local emergency service.
        </p>
      </Section>

      <Section title="Availability and changes">
        <p>
          We may add, change or withdraw features. Tiny Us depends on services we don&apos;t control,
          such as the app stores and our cloud providers, so we can&apos;t promise it will always
          be available or free of errors.
        </p>
      </Section>

      <Section title="Our responsibility">
        <p>
          Tiny Us is provided as-is. To the extent permitted by the law that applies to you, we
          aren&apos;t liable for lost or deleted content, including content deleted by your Partner,
          or for indirect or consequential loss. Nothing here limits rights you have as a consumer
          that can&apos;t be limited by agreement, including your statutory rights in the European
          Economic Area, the United Kingdom, and other places with similar protections.
        </p>
      </Section>

      <Section title="Ending these terms">
        <p>
          You can stop using Tiny Us at any time by deleting your account in Settings. We may end
          these terms if you breach them materially.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          If we change these terms, we&apos;ll post the new version here with a new effective
          date, and tell you in the app if the change matters. If you keep using Tiny Us after
          that, the new terms apply.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These terms are governed by the laws of the Province of Ontario and the federal laws of
          Canada that apply there. This doesn&apos;t affect any mandatory consumer protections in
          your country of residence.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms: <SupportEmail />
        </p>
      </Section>
    </TinyUsPage>
  );
};

export default TinyUsTerms;
