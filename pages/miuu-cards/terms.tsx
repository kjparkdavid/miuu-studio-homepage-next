import Link from "next/link";
import MiuuCardsPage, { Bullets, Section, SupportEmail } from "@/components/miuuCardsPage";

const linkClass = "underline text-[#7350E8]";

const MiuuCardsTerms = () => {
  return (
    <MiuuCardsPage
      title="Terms of Service"
      description="The terms for playing Miuu Card Club: your account, coins and other virtual items, the Moon Pass, packs with random cards, ads and fair play."
      path="/miuu-cards/terms/"
    >
      <h1 className="text-2xl font-bold mb-1">Terms of Service</h1>
      <p className="text-sm text-gray-400">Effective Date: October 14, 2026</p>

      <div className="mt-6 space-y-3">
        <p>
          These terms apply to the Miuu Card Club game (&ldquo;the game&rdquo;), published by Miuu
          Studio, a sole proprietorship registered in Ontario, Canada (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;). By playing, you agree to them. If you got the game from the Apple App
          Store, Apple&apos;s Licensed Application End User License Agreement also applies, and it
          takes precedence where the two differ.
        </p>
        <p>
          How we handle your information is described in our{" "}
          <Link href="/miuu-cards/privacy-policy/" className={linkClass}>
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <Section title="The game">
        <p>
          Miuu Card Club is a card-collecting game: you open packs of 5 cards and fill your binder.
          It is free to play. It offers optional in-app purchases, including packs with random
          contents, and optional reward videos, which are ads.
        </p>
      </Section>

      <Section title="Your account">
        <Bullets>
          <li>
            You must be 13 or over to play. If you are under the age of majority where you live,
            you need a parent or guardian&apos;s permission to play and to make purchases.
          </li>
          <li>
            You start as a guest. A guest account can&apos;t be recovered if you delete the game or
            lose your phone, so link Sign in with Apple or Google in Settings to keep your
            collection.
          </li>
          <li>
            You&apos;re responsible for keeping your phone and your sign-in secure. Tell us if you
            think someone else has access to your account.
          </li>
        </Bullets>
      </Section>

      <Section title="Coins and other virtual items">
        <p>
          Coins can be bought or earned in the game. They, and the other things in the game, such
          as cards, stardust, shine stars, characters and packs, are virtual items. We give you a
          personal, limited, revocable licence to use them in the game; you don&apos;t own them.
          Virtual items:
        </p>
        <Bullets>
          <li>have no cash value, and can&apos;t be exchanged for money or anything outside the game;</li>
          <li>can&apos;t be sold, traded or transferred to another player or account;</li>
          <li>
            are non-refundable once bought, except where the law requires otherwise;
          </li>
          <li>are lost if your account is deleted or closed.</li>
        </Bullets>
        <p>
          Purchases are made through the App Store or Google Play, and refunds are handled by
          Apple or Google under their own policies, not by us. If a store refunds a coin pack, we
          remove those coins from your balance (never more than you have left). We may change how
          many coins things earn or cost, and we may correct a balance or remove items that are
          wrong because of an error.
        </p>
      </Section>

      <Section title="The Moon Pass">
        <Bullets>
          <li>
            The Moon Pass is a monthly subscription that gives you one extra pack each day while it
            is active. The price is shown in the game before you subscribe.
          </li>
          <li>
            <strong>It renews automatically every month</strong> until you cancel it in your App
            Store or Google Play subscription settings. Cancel at least 24 hours before the period
            ends to stop the next renewal. Cancelling stops future renewals, and you keep the Moon
            Pass until the end of the period you&apos;ve paid for; it does not refund the current
            period.
          </li>
          <li>
            <strong>Deleting the game or deleting your account doesn&apos;t cancel it.</strong>{" "}
            Cancel it in your store account.
          </li>
          <li>
            Prices and what the Moon Pass includes may change. Changes apply to new purchases, and
            to renewals after we tell you.
          </li>
        </Bullets>
      </Section>

      <Section title="Packs with random cards">
        <p>
          The cards in a pack are random, including packs you pay for with coins. Our server
          decides every pack, and the odds for each grade are shown in the game before you open
          one (on the Packs screen, in the lobby and in Settings → Drop rates) and on our{" "}
          <Link href="/miuu-cards/support/#drop-rates" className={linkClass}>
            support page
          </Link>
          .
        </p>
        <p>
          Odds never change in place: if we change them, the new odds are shown in the game before
          they apply, and each pack you open keeps a record of the odds it used. A Legendary card
          is guaranteed within 35 packs of a set.
        </p>
      </Section>

      <Section title="Ads">
        <p>
          The game offers reward videos, which are ads served by Google AdMob, that you can choose
          to watch for an extra pack. We don&apos;t control the content of each ad. A reward is
          given once Google confirms to our server that the video was watched to the end. Videos
          may not always be available, and we may change or end the reward.
        </p>
      </Section>

      <Section title="Playing fairly">
        <p>Please don&apos;t:</p>
        <Bullets>
          <li>cheat, or use bugs or exploits to get coins, cards or other items;</li>
          <li>
            modify, hack or reverse-engineer the game, or use any tool that changes how it works;
          </li>
          <li>
            automate, script or otherwise call our services in a way that isn&apos;t the game doing
            its ordinary work;
          </li>
          <li>try to get at other players&apos; data, or into our systems beyond what the game offers;</li>
          <li>buy, sell or trade accounts or items outside the game;</li>
          <li>use the game to break the law.</li>
        </Bullets>
        <p>
          If you do, we may remove items gained this way, and suspend or close your account without
          a refund, to the extent the law allows.
        </p>
      </Section>

      <Section title="Availability and changes">
        <p>
          We may add, change or withdraw features, sets and cards, and we may pause pack opening
          for a while if something goes wrong. The game depends on services we don&apos;t control,
          such as the app stores and our cloud providers, so we can&apos;t promise it will always be
          available or free of errors.
        </p>
      </Section>

      <Section title="Our responsibility">
        <p>
          The game is provided as-is. To the extent permitted by the law that applies to you, we
          aren&apos;t liable for lost virtual items or progress, for interruptions or errors, or for
          indirect or consequential loss, and our total liability to you is limited to the amount
          you paid for in-game purchases in the 12 months before the claim. Nothing here limits
          rights you have as a consumer that can&apos;t be limited by agreement, including your
          statutory rights in Canada, Australia, New Zealand, the European Economic Area, the
          United Kingdom, and other places with similar protections.
        </p>
      </Section>

      <Section title="Ending these terms">
        <p>
          You can stop playing at any time, and delete your account in Settings → Delete account.
          We may suspend or close your account, or end these terms, if you breach them materially.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          If we change these terms, we&apos;ll post the new version here with a new effective
          date, and tell you in the game if the change matters. If you keep playing after that,
          the new terms apply.
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
    </MiuuCardsPage>
  );
};

export default MiuuCardsTerms;
