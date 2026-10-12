import TinyUsPage, { Bullets, Section, SupportEmail } from "@/components/tinyUsPage";

const TinyUsSupport = () => {
  return (
    <TinyUsPage
      title="Support"
      description="Help with Tiny Us, the app for two: contact us, find Plus, and delete your account."
      path="/tiny-us/support/"
    >
      <h1 className="text-3xl font-extrabold mb-2">A tiny home for the two of you</h1>
      <p>
        Answer one question together each day, keep a shared diary, and furnish a little room where
        your two cats live.
      </p>

      <Section title="Need help?">
        <p>
          Questions, problems or ideas: write to us at <SupportEmail />. Tell us which phone
          you&apos;re on and what happened, and we&apos;ll get back to you as soon as we can.
        </p>
      </Section>

      <Section title="Common questions">
        <Bullets>
          <li>
            <strong>Inviting your person:</strong> send the invite from the app. Their code works
            for 7 days; if it runs out, send a new one.
          </li>
          <li>
            <strong>A new phone:</strong> sign in with the Apple, Google or email account you saved
            your spot with. A Guest account that was never saved can&apos;t be moved to a new
            phone.
          </li>
          <li>
            <strong>Plus:</strong> one of you buys it and both of you have it. To cancel, use your
            App Store or Google Play subscriptions; deleting the app doesn&apos;t cancel it.
          </li>
          <li>
            <strong>Deleting your account:</strong> Settings → Delete account. This also erases
            your shared home for your Partner, so export anything you want to keep first.
          </li>
        </Bullets>
      </Section>
    </TinyUsPage>
  );
};

export default TinyUsSupport;
