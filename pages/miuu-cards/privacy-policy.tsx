import Link from "next/link";
import MiuuCardsPage, { Bullets, ExternalLink, Section, SupportEmail } from "@/components/miuuCardsPage";

const MiuuCardsPrivacyPolicy = () => {
  return (
    <MiuuCardsPage
      title="Privacy Policy"
      description="How Miuu Card Club, the card-collecting game, handles your information: your account, your game, analytics, ads, purchases and deleting it all."
      path="/miuu-cards/privacy-policy/"
    >
      <h1 className="text-2xl font-bold mb-1">Privacy Policy</h1>
      <p className="text-sm text-gray-400">Effective Date: October 16, 2026</p>

      <div className="mt-6 space-y-3">
        <p>
          Miuu Card Club is a free card-collecting game for iPhone and Android: you open packs of 5
          cards and fill your binder. It is made by Miuu Studio, a sole proprietorship registered
          in Ontario, Canada (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
        </p>
        <p>
          This policy explains what Miuu Card Club collects, why, who helps us run it, and how to
          delete it. The short version: we keep your game (cards, coins, packs opened) in our
          cloud database so it can&apos;t be lost or changed by anyone but our server, we count how
          the game is played, and the optional reward videos are ads from Google AdMob. We
          don&apos;t sell or rent your information.
        </p>
      </div>

      <Section title="Your account">
        <Bullets>
          <li>
            <strong>As a guest.</strong> The first time you open the game, it creates a guest
            account for you with Firebase Authentication. A guest account has a random account
            ID and no name or email address. If you delete the game or lose your phone before you
            link a sign-in, you can&apos;t get back into a guest account.
          </li>
          <li>
            <strong>When you link Sign in with Apple or Google</strong> (Settings → Account), we
            keep the identifier, email address and name that Apple or Google provides, so you can
            sign in to the same account on another phone. If you use Apple&apos;s &ldquo;Hide My
            Email&rdquo;, we only see the relay address. We never see your Apple or Google
            password.
          </li>
        </Bullets>
      </Section>

      <Section title="Your game">
        <p>
          Your game lives on our servers (Google Firebase), linked to your account ID, so our server
          can decide every pack fairly and your collection can follow you to a new phone:
        </p>
        <Bullets>
          <li>
            <strong>Your collection:</strong> the cards you own, how many of each, their shine
            stars, and the characters you have.
          </li>
          <li>
            <strong>Your pulls:</strong> a record of every pack you open: its set, the five cards,
            how you paid (free, coins, Moon Pass or video), which odds it used and when. Settings
            → Pull history shows your last 100.
          </li>
          <li>
            <strong>Your balances:</strong> a ledger of every coin and stardust you gain or spend,
            and your level.
          </li>
          <li>
            <strong>Daily things:</strong> your missions, your free, Moon Pass and video packs, and
            whether you have an active Moon Pass (when it ends, which store it came from and
            whether it renews).
          </li>
          <li>
            <strong>Settings:</strong> sound, music and haptics, and the character in your lobby.
          </li>
          <li>
            <strong>Time zone and language setting:</strong> read from your phone once, when you
            first play. The time zone sets when your day starts (4:00 local), for daily missions
            and packs.
          </li>
        </Bullets>
      </Section>

      <Section title="Analytics">
        <p>
          We use Google Firebase Analytics to understand how the game is played and to make it
          better. It records gameplay events such as:
        </p>
        <Bullets>
          <li>the steps of the first-run tutorial;</li>
          <li>
            packs viewed and opened (the set, how you paid, the best grade in the pack, and how
            many packs since your last Legendary);
          </li>
          <li>cards revealed (their grade), shine added, characters bought, sets completed;</li>
          <li>missions claimed, and opening the drop rates;</li>
          <li>
            store purchases started, completed or failed (which product, and why one failed), and
            reward videos started and watched to the end.
          </li>
        </Bullets>
        <p>
          Firebase Analytics also records some things on its own: first launch, sessions and
          screens viewed, your device model, operating system and app version, your approximate
          region, worked out from your IP address, and diagnostic and performance data about the
          app (such as how quickly it starts). These events are linked to an ID
          Firebase gives this install of the game. We don&apos;t send Analytics your account ID,
          name or email address.{" "}
          <ExternalLink href="https://firebase.google.com/support/privacy">Firebase privacy</ExternalLink>
        </p>
      </Section>

      <Section title="Ads">
        <p>
          Miuu Card Club has one kind of ad: a rewarded video you choose to watch for an extra
          pack. Nothing plays unless you tap it. The videos come from Google AdMob.
        </p>
        <Bullets>
          <li>
            <strong>Your choice comes first.</strong> Nothing about ads is asked at launch. When you
            tap your first video, players in regions that require it (such as the European
            Economic Area and the United Kingdom) see Google&apos;s consent form. On iPhone, the
            game then asks Apple&apos;s App Tracking Transparency question (only if the consent
            form allows it). No ad is requested before that.
          </li>
          <li>
            <strong>Saying no changes nothing else.</strong> The videos still play and still give
            the pack; the ads just aren&apos;t personalised.
          </li>
          <li>
            <strong>What AdMob may collect:</strong> your phone&apos;s advertising ID (on iPhone,
            only if you allow tracking), your IP address and the approximate location it reveals,
            device details, how you interact with the ad, and diagnostic and performance data
            about the ad code (such as load times and errors). Google uses this to show, measure
            and, where you allow it, personalise ads.{" "}
            <ExternalLink href="https://policies.google.com/technologies/partner-sites">
              How Google uses information from apps that use its services
            </ExternalLink>
          </li>
          <li>
            <strong>Checking you watched.</strong> Each video carries your account ID, so that
            Google can tell our server directly that you watched to the end. We keep a record of
            each video (your account ID, the day and Google&apos;s reference for it) so the reward
            is given once.
          </li>
        </Bullets>
        <p>
          Where Google&apos;s consent form applies, you can reopen it at any time from the
          game&apos;s Settings → Ad privacy choices and change your answer. You can change your
          tracking choice at any time in iPhone Settings → Privacy &amp; Security → Tracking. On
          Android, you can reset or delete your advertising ID in your phone&apos;s settings.
        </p>
      </Section>

      <Section title="Purchases">
        <p>
          Coin packs and the Moon Pass subscription are bought through the App Store or Google
          Play, which take the payment under their own terms. We never see your card or payment
          details.
        </p>
        <p>
          Your account has a random purchase ID, which the game sends to Apple or Google with each
          purchase, so that the store&apos;s messages about it name your account and nothing
          else about you. After you buy, our own server (on Google Cloud) checks the purchase
          with Apple or Google before it adds your coins or turns on your Moon Pass. Apple and
          Google also tell our server directly about renewals, cancellations and refunds.
        </p>
        <p>
          For each purchase, our server keeps a record of: the product, the store&apos;s
          transaction or order ID, the purchase token, the price and currency, the country, the
          dates (bought, renewed, expires, refunded), and your purchase ID. We use it to give you
          what you bought exactly once, to handle renewals and refunds, and to keep our accounts.
        </p>
      </Section>

      <Section title="Notifications">
        <p>
          After your first pack, the game asks whether it may remind you when your free pack is
          ready. The reminder is a notification scheduled on your phone itself: no push token is
          collected, and nothing about it is sent to us. You can turn it off in your phone&apos;s
          settings.
        </p>
      </Section>

      <Section title="What we don't collect">
        <Bullets>
          <li>
            no crash reports of our own: the game has no crash reporter. Google&apos;s AdMob and
            Firebase code does collect diagnostic and performance data, as described above;
          </li>
          <li>no precise location;</li>
          <li>no contacts, photos or files;</li>
          <li>
            no microphone or camera: the game plays music and sounds, but never records;
          </li>
          <li>
            no motion data: tilting a card uses your phone&apos;s motion sensor on the phone only,
            and nothing is recorded or sent.
          </li>
        </Bullets>
      </Section>

      <Section title="How we use your information">
        <Bullets>
          <li>to run the game: open your packs, keep your collection and balances, and sync them;</li>
          <li>to give you the coins and Moon Pass you buy, and the packs you earn;</li>
          <li>to show the reward videos you choose to watch;</li>
          <li>to understand how the game is played and improve it;</li>
          <li>to keep the game fair and secure, prevent cheating and fix problems;</li>
          <li>to answer you when you contact us.</li>
        </Bullets>
      </Section>

      <Section title="Who helps us run Miuu Card Club">
        <p>These services process information for us, only to run the features above:</p>
        <Bullets>
          <li>
            <strong>Google Firebase and Google Cloud</strong>: sign-in (Firebase Authentication),
            the game&apos;s database (Firestore) and server (Cloud Functions), which also checks
            and records your purchases, Remote Config (which lets us pause pack opening if
            something goes wrong), Analytics, and the storage that serves card pictures to your
            phone.{" "}
            <ExternalLink href="https://firebase.google.com/support/privacy">Firebase privacy</ExternalLink>
          </li>
          <li>
            <strong>Google AdMob</strong>: the optional reward videos.{" "}
            <ExternalLink href="https://policies.google.com/privacy">Google Privacy Policy</ExternalLink>
          </li>
          <li>
            <strong>Apple and Google</strong>: Sign in with Apple and Sign in with Google, and
            payments in the App Store and Google Play. They also confirm each purchase to our
            server.{" "}
            <ExternalLink href="https://www.apple.com/legal/privacy/">Apple Privacy Policy</ExternalLink>
          </li>
        </Bullets>
        <p>
          Your account, your game and our purchase records are stored in the United States, in
          Google Cloud&apos;s us-central1 region (Iowa). Analytics, AdMob, Apple and Google may
          also process information in the United States and other countries. Because of this,
          your information is stored and processed outside your country, including outside
          Canada, and may be accessible to courts and authorities there under the local law. We
          may also disclose information when the law requires it, or to protect someone&apos;s
          safety.
        </p>
      </Section>

      <Section title="Deleting your account">
        <p>
          Settings → Delete account permanently deletes your account: your cards, coins, stardust,
          characters, pull history, missions and settings, the records of your reward videos, and
          your sign-in. If you signed in with Apple, the game also revokes its access to your Apple
          ID. It can&apos;t be undone, and coins you bought aren&apos;t refunded.
        </p>
        <p>Some information is not deleted with your account:</p>
        <Bullets>
          <li>
            our records of your purchases (described under Purchases), kept only where we need
            them to handle refunds and for accounting, and the purchase records Apple and Google
            keep under their own terms;
          </li>
          <li>
            Analytics and AdMob data, which isn&apos;t linked to your account ID and is kept by
            Google for a limited period under its own retention rules.
          </li>
        </Bullets>
        <p>
          Deleting the game doesn&apos;t delete your account, and deleting your account doesn&apos;t
          cancel a Moon Pass: cancel it in your App Store or Google Play subscriptions.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your game for as long as your account exists, and delete it when you delete your
          account, as described above.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Your information travels encrypted (HTTPS/TLS) and is stored encrypted by Google Cloud.
          Access rules on our servers let only you read your game, and only our server can change
          your cards, coins or packs. No system is perfectly secure, so please keep your phone
          and your sign-in safe.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export or delete
          your information, and to object to or restrict how it is used. You can delete your
          account in the app. For anything else, write to us at <SupportEmail /> and we&apos;ll
          answer within 30 days. You can also complain to your local privacy regulator: in Canada,
          the Office of the Privacy Commissioner; in Australia, the Office of the Australian
          Information Commissioner; in New Zealand, the Office of the Privacy Commissioner.
        </p>
      </Section>

      <Section title="If you live in the United States">
        <p>
          Some US states, including California, Virginia, Colorado and Connecticut, give their
          residents specific privacy rights. This section explains how they apply to Miuu Card
          Club.
        </p>
        <p>
          <strong>What we collect</strong>, as described above:
        </p>
        <Bullets>
          <li>
            identifiers: your account ID, the ID Firebase gives this install, your IP address, and
            your phone&apos;s advertising ID (on iPhone, only if you allow tracking);
          </li>
          <li>commercial information: your store purchases and Moon Pass subscription;</li>
          <li>
            game and app activity: packs opened, cards collected, missions and the other gameplay
            events listed under Analytics, and how you interact with reward videos;
          </li>
          <li>approximate location, worked out from your IP address.</li>
        </Bullets>
        <p>
          We collect it from you and your phone, use it for the purposes listed under &ldquo;How
          we use your information&rdquo;, and keep it as described under &ldquo;How long we keep
          it&rdquo;. We don&apos;t collect sensitive personal information.
        </p>
        <p>
          <strong>Selling and sharing.</strong> We don&apos;t sell your information for money.
          When you allow it, Google AdMob may use your advertising ID to show personalised ads in
          the reward videos, which some state laws call &ldquo;sharing&rdquo; or &ldquo;targeted
          advertising&rdquo;. To opt out:
        </p>
        <Bullets>
          <li>
            on iPhone, choose &ldquo;Ask App Not to Track&rdquo; when asked, or turn tracking off
            later in Settings → Privacy &amp; Security → Tracking. Without tracking permission,
            the game asks Google only for ads that aren&apos;t personalised;
          </li>
          <li>
            on Android, delete your advertising ID in your phone&apos;s settings (Settings →
            Privacy → Ads, or Google → Ads, depending on your phone).
          </li>
        </Bullets>
        <p>
          <strong>Your rights.</strong> You may have the right to know what we collect about you
          and get a copy of it, to correct it, to delete it, and to opt out of targeted
          advertising. You can delete your account in the app (Settings → Delete account). For
          anything else, write to us at <SupportEmail />. We&apos;ll answer within 45 days, and
          may ask for details that show the account is yours. Someone you authorise can make a
          request for you. If we turn down your request, you can appeal by replying to our answer;
          if we turn down the appeal, you can contact your state&apos;s attorney general. Using
          these rights never changes how the game treats you.
        </p>
      </Section>

      <Section title="Age">
        <p>
          Miuu Card Club is meant for players aged 13 and over. We don&apos;t knowingly collect
          information from children under 13. If you believe a child under 13 is playing, contact
          us and we&apos;ll delete their account.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If we change this policy, we&apos;ll post the new version here with a new effective date.
          If a change matters, for example new information we collect or a new service that
          receives it, we&apos;ll also tell you in the game before it applies.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions, requests or concerns about your privacy: <SupportEmail />. See also our{" "}
          <Link href="/miuu-cards/terms/" className="underline text-[#7350E8]">
            Terms of Service
          </Link>
          .
        </p>
      </Section>
    </MiuuCardsPage>
  );
};

export default MiuuCardsPrivacyPolicy;
