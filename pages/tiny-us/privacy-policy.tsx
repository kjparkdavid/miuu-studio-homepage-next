import Link from "next/link";
import TinyUsPage, { Bullets, ExternalLink, Section, SupportEmail } from "@/components/tinyUsPage";

const TinyUsPrivacyPolicy = () => {
  return (
    <TinyUsPage
      title="Privacy Policy"
      description="How Tiny Us, the app for two, handles your information: what is stored, who sees it and how to delete it."
      path="/tiny-us/privacy-policy/"
    >
      <h1 className="text-3xl font-extrabold mb-1">Privacy Policy</h1>
      <p className="text-sm text-[#9A97A6]">Effective Date: October 10, 2026</p>

      <div className="mt-6 space-y-3">
        <p>
          Tiny Us is an app for two people: you and your person answer a daily question together,
          keep a shared diary, and furnish a little room where your two cats live. It is made by
          Miuu Studio, a sole proprietorship registered in Ontario, Canada (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;).
        </p>
        <p>
          This policy explains what Tiny Us stores, who can see it, who helps us run it, and how to
          get it or delete it. The short version: what you share in Tiny Us is shared with your
          Partner, and nobody else. We don&apos;t show ads, we don&apos;t sell or rent your
          information, and the app has no analytics or tracking tools.
        </p>
      </div>

      <Section title="Your account">
        <p>You can start Tiny Us without creating an account, as a Guest.</p>
        <Bullets>
          <li>
            <strong>As a Guest,</strong> you get an account identifier that exists only on this
            phone. If you delete the app or lose the phone before you save your spot, the account
            can&apos;t be recovered.
          </li>
          <li>
            <strong>When you save your spot,</strong> you sign in with Apple, Google, or an email
            address and password. We keep the identifier and email address that Apple or Google
            gives us. If you use Sign in with Apple&apos;s &ldquo;Hide My Email&rdquo;, we only see
            the relay address. For an email account, we keep your email address. We never see your
            password: our sign-in provider stores only a hashed version of it.
          </li>
        </Bullets>
      </Section>

      <Section title="What you put into Tiny Us">
        <p>Tiny Us stores what you create so it can show it on both of your phones:</p>
        <Bullets>
          <li>
            <strong>Your profile:</strong> the name your person calls you, your cat, an optional
            profile photo, an optional birthday, your Mood and Status, and your phone&apos;s time
            zone, so the daily question changes at the right time for both of you.
          </li>
          <li>
            <strong>Your Couple:</strong> your answers to the daily questions, check-ins, your
            shared diary and its photos, little notes, places and visits with their photos and
            ratings, gifts, cat interactions, your anniversary, your room and everything in it, and
            the coins you&apos;ve earned and spent.
          </li>
          <li>
            <strong>Onboarding answers:</strong> the goals you pick when you start (&ldquo;what do
            you two want more of&rdquo;) and any words you add under &ldquo;Something else&rdquo;.
            These are private to you.
          </li>
          <li>
            <strong>Invites:</strong> the code you send your person, which expires after 7 days.
          </li>
        </Bullets>
        <p>
          Photos are resized and re-encoded on your phone before they are uploaded. This removes
          their embedded details (EXIF), including where a photo was taken.
        </p>
      </Section>

      <Section title="What your Partner sees">
        <p>
          Tiny Us is built to be shared, so almost everything is visible to your Partner while you
          are Connected:
        </p>
        <Bullets>
          <li>
            your profile: name, cat, photo, birthday, Mood, Status and time zone, and whether you
            have Plus and from which store;
          </li>
          <li>
            everything in your Couple: the diary, notes, places, photos, room, gifts and coins;
          </li>
          <li>
            your answer to a daily question, but only once they have answered it too. An answer
            they never matched stays private to you.
          </li>
        </Bullets>
        <p>Only you can see:</p>
        <Bullets>
          <li>your sign-in details and email address;</li>
          <li>your notification settings and the devices you&apos;ve signed in on;</li>
          <li>your onboarding goals and &ldquo;Something else&rdquo; words;</li>
          <li>the invite codes you created.</li>
        </Bullets>
        <p>
          Your Partner can also take things out of Tiny Us, for example by sharing a photo,
          exporting your Couple&apos;s data or sharing a Little Notes book. What happens to it after
          that is up to them.
        </p>
        <p>
          If either of you Disconnects, your Couple is put away: neither of you can see it, or the
          other&apos;s profile, until you Reconnect or one of you deletes it.
        </p>
      </Section>

      <Section title="Your location">
        <p>
          Tiny Us asks for your location only while you use it, and only on the Places map. It uses
          it to start the map where you are and to find places near you. Your location is never
          tracked in the background.
        </p>
        <p>Your location is stored only when you choose to save it:</p>
        <Bullets>
          <li>
            <strong>Saving a place from Google&apos;s search</strong> stores Google&apos;s identifier
            for the place and your own name for it. We keep its coordinates for up to 28 days to
            draw your map.
          </li>
          <li>
            <strong>Saving where you are (&ldquo;Here&rdquo;) or dropping a pin</strong> stores that
            point and its address, and your Partner can see it.
          </li>
        </Bullets>
      </Section>

      <Section title="Photos, notifications and the widget">
        <Bullets>
          <li>
            <strong>Photos:</strong> Tiny Us reads only the photos you pick from your library, to
            add to your profile, diary, visits or the wall of your room. It never saves anything to
            your library.
          </li>
          <li>
            <strong>Notifications:</strong> Tiny Us asks before sending notifications. To send them,
            we store a push token for each phone you sign in on. Notifications can show your
            Partner&apos;s name and Status on your lock screen. You can turn each kind off in
            Settings. Even with notifications off, we may send your phone silent updates to refresh
            the home screen widget.
          </li>
          <li>
            <strong>The widget:</strong> if you add the Tiny Us widget, it shows your
            Partner&apos;s name, Mood and Status, and your days together, on your home screen.
          </li>
        </Bullets>
      </Section>

      <Section title="How we use your information">
        <Bullets>
          <li>to run Tiny Us: show your shared home on both phones and keep them in sync;</li>
          <li>to send the notifications you&apos;ve allowed;</li>
          <li>to give you Plus when one of you buys it;</li>
          <li>to keep Tiny Us secure, prevent abuse and fix problems;</li>
          <li>to answer you when you contact us.</li>
        </Bullets>
        <p>
          We don&apos;t read your diary, answers or notes, and we don&apos;t use them for
          advertising. We don&apos;t profile you, and we don&apos;t sell or rent your information.
        </p>
      </Section>

      <Section title="Who helps us run Tiny Us">
        <p>These services process information on our behalf, only to run the features above:</p>
        <Bullets>
          <li>
            <strong>Google Firebase and Google Cloud</strong> store your account and everything in
            your Couple, run our servers and deliver notifications. Your data is stored in the
            United States.{" "}
            <ExternalLink href="https://firebase.google.com/support/privacy">
              Firebase privacy
            </ExternalLink>
          </li>
          <li>
            <strong>Apple</strong> handles Sign in with Apple, delivers notifications to iPhones and
            looks up the address of a pin on iPhone.{" "}
            <ExternalLink href="https://www.apple.com/legal/privacy/">Apple Privacy Policy</ExternalLink>
          </li>
          <li>
            <strong>Google</strong> handles Sign in with Google, draws the Places map, and powers
            place search. Search is sent from our servers, so Google gets what you typed and the
            area you&apos;re looking in, but not your device or account. Google also looks up the
            address of a pin on Android.{" "}
            <ExternalLink href="https://policies.google.com/privacy">Google Privacy Policy</ExternalLink>
          </li>
          <li>
            <strong>RevenueCat</strong> tracks whether your Couple has Plus. It receives your
            account identifier and your purchase details from the App Store or Google Play, never
            your card details.{" "}
            <ExternalLink href="https://www.revenuecat.com/privacy/">
              RevenueCat Privacy Policy
            </ExternalLink>
          </li>
          <li>
            <strong>The App Store and Google Play</strong> handle payments under their own terms.
          </li>
        </Bullets>
        <p>
          Because these services are in the United States, your information may be stored and
          processed outside your country, including outside Canada. It may then be accessible to
          courts and authorities there under the local law.
        </p>
        <p>
          We may also disclose information when the law requires it, or to protect someone&apos;s
          safety.
        </p>
      </Section>

      <Section title="Getting your data, and deleting it">
        <Bullets>
          <li>
            <strong>Export:</strong> while you are Connected, Settings → &ldquo;Export our
            data&rdquo; gives you a copy of your Couple&apos;s data. For a fuller copy, including
            your profile, write to us.
          </li>
          <li>
            <strong>Disconnect</strong> hides your Couple from both of you, but deletes nothing. You
            can Reconnect later and find it as you left it.
          </li>
          <li>
            <strong>Delete Couple</strong> (after a Disconnect) permanently erases everything in
            that Couple, for both of you: the diary, photos, notes, places and room. Either of you
            can do this alone.
          </li>
          <li>
            <strong>Delete account</strong> (Settings) permanently deletes your profile and sign-in,
            and every Couple you were in, including your Partner&apos;s entries and photos in it. If
            you aren&apos;t Connected, it happens straight away. If you are, your Partner is told
            and gets a short notice period to export your shared data first. You can cancel during
            that time. If you signed in with Apple, we also revoke Tiny Us&apos;s access to your
            Apple ID.
          </li>
        </Bullets>
        <p>
          Some information can remain for a while after deletion: copies cached on your
          Partner&apos;s phone until it next updates, our server logs (which record account
          identifiers, not what you wrote), and records of purchases, which we keep as long as we
          need them for accounting and legal reasons. Deleting the app doesn&apos;t delete your
          account, and deleting your account doesn&apos;t cancel a subscription: cancel it in your
          App Store or Google Play account.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your information for as long as your account exists, and delete it as described
          above. A Couple that has been Disconnected is kept until you Reconnect or one of you
          deletes it or your account. A Guest account that is never saved is kept until it is
          deleted.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Your information travels encrypted (HTTPS/TLS) and is stored encrypted by Google Cloud.
          Access rules on our servers let only you and your Partner read your Couple. No system is
          perfectly secure, so please keep your phone and your sign-in safe.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export or delete
          your information, and to object to or restrict how it is used. Most of this you can do
          in the app. For anything else, write to us at <SupportEmail /> and we&apos;ll answer
          within 30 days. You can also complain to your local privacy regulator. In Canada, that is
          the Office of the Privacy Commissioner.
        </p>
      </Section>

      <Section title="Age">
        <p>
          Tiny Us is meant for adults aged 18 and over, and we don&apos;t knowingly collect
          information from anyone younger. If you believe a child is using Tiny Us, contact us and
          we&apos;ll delete their account.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If we change this policy, we&apos;ll post the new version here with a new effective date.
          If a change matters, for example new information we collect or a new service that
          receives it, we&apos;ll also tell you in the app before it applies.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions, requests or concerns about your privacy: <SupportEmail />. See also our{" "}
          <Link href="/tiny-us/terms/" className="underline text-[#651DFF]">
            Terms of Use
          </Link>
          .
        </p>
      </Section>
    </TinyUsPage>
  );
};

export default TinyUsPrivacyPolicy;
