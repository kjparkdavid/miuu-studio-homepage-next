import Link from "next/link";
import MiuuCardsPage, {
  Bullets,
  ExternalLink,
  MIUU_CARDS_SUPPORT_EMAIL,
  Section,
  SupportEmail,
} from "@/components/miuuCardsPage";

/** Drop table v1, as the app and its store listing show it (percent per grade). */
const DROP_RATES = [
  { grade: "Common", slots1to4: "74.6%", slot5: "—" },
  { grade: "Rare", slots1to4: "20%", slot5: "82.5%" },
  { grade: "Epic", slots1to4: "5%", slot5: "15%" },
  { grade: "Legendary", slots1to4: "0.3%", slot5: "2%" },
  { grade: "Secret", slots1to4: "0.1%", slot5: "0.5%" },
];

const MiuuCardsSupport = () => {
  return (
    <MiuuCardsPage
      title="Support"
      description="Help with Miuu Card Club: contact us, restore purchases, delete your account, and the drop rates for every pack."
      path="/miuu-cards/support/"
    >
      <div className="text-center pt-4 pb-6">
        <h1 className="text-3xl font-bold mb-3">Miuu Card Club</h1>
        <p className="text-gray-500">Open packs, collect cozy cards, and fill your binder.</p>
      </div>

      <Section title="Need help?">
        <p>
          Questions, problems or ideas: write to us and we&apos;ll get back to you as soon as we
          can. Tell us which phone you&apos;re on and what happened. For a purchase, include the
          order number from your App Store or Google Play receipt.
        </p>
        <div className="text-center pt-2">
          <a
            href={`mailto:${MIUU_CARDS_SUPPORT_EMAIL}`}
            className="inline-block bg-[#7350E8] text-white font-medium px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            {MIUU_CARDS_SUPPORT_EMAIL}
          </a>
        </div>
      </Section>

      <Section title="Keeping your collection on a new phone">
        <p>
          You start as a guest, and a guest account stays on the phone you started on. To keep
          your cards and coins, link a sign-in first: Settings → Account → Link Apple
          or Link Google. On the new phone, do the same with the same Apple or Google account,
          and choose Switch account.
        </p>
      </Section>

      <Section title="Restoring purchases">
        <p>
          Settings → Restore purchases asks the App Store or Google Play what your store account
          has bought, and our server checks each purchase with Apple or Google. Use it if a
          purchase doesn&apos;t show up in the game. An active Moon Pass is linked to the account
          that restores it, straight away. Coins are kept in your Miuu Card Club account, not in
          the store, so on a new phone, sign in to the same Apple or Google account first (see
          above) to keep them. If something you paid for is still missing, write to us at{" "}
          <SupportEmail />.
        </p>
      </Section>

      <Section title="The Moon Pass and refunds">
        <Bullets>
          <li>
            <strong>Cancelling:</strong> the Moon Pass renews every month until you cancel it in
            your App Store or Google Play subscriptions (also reachable from Shop → Moon Pass →
            Manage subscription). Deleting the game or your account doesn&apos;t cancel it.
          </li>
          <li>
            <strong>Refunds</strong> are handled by Apple or Google, not by us:{" "}
            <ExternalLink href="https://reportaproblem.apple.com/">App Store</ExternalLink>,{" "}
            <ExternalLink href="https://support.google.com/googleplay/answer/2479637">Google Play</ExternalLink>.
          </li>
        </Bullets>
      </Section>

      <section id="delete-account" className="mt-8 space-y-3 scroll-mt-8">
        <h2 className="text-lg font-semibold">Deleting your account</h2>
        <p>
          In the game: Settings → Delete account, then Delete forever. This permanently deletes your cards,
          coins, stardust, characters and pull history, and your sign-in. It can&apos;t be undone,
          and coins you bought aren&apos;t refunded. It doesn&apos;t cancel a Moon Pass: cancel it in
          your store account first. Our{" "}
          <Link href="/miuu-cards/privacy-policy/" className="underline text-[#7350E8]">
            Privacy Policy
          </Link>{" "}
          explains what is deleted and what is kept.
        </p>
        <p>
          Can&apos;t open the game, or deleted it? Email <SupportEmail /> and ask us to delete your
          account. If you linked Sign in with Apple or Google, write from that email address (or
          tell us which one it is) so we can find your account; we&apos;ll delete it within 30
          days and confirm. A guest account that was never linked is identified only by the
          phone it was made on: deleting the game leaves it unreachable, and you can delete it in
          the game while it is still installed.
        </p>
      </section>

      <section id="drop-rates" className="mt-8 space-y-3 scroll-mt-8">
        <h2 className="text-lg font-semibold">Drop rates</h2>
        <p>
          Every pack holds 5 cards from one set. Cards 1 to 4 and card 5 have their own odds per
          grade. The same odds are shown in the game before every pack (Settings → Drop rates).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="py-2 pr-4 font-semibold">Grade</th>
                <th className="py-2 pr-4 font-semibold">Cards 1–4</th>
                <th className="py-2 font-semibold">Card 5</th>
              </tr>
            </thead>
            <tbody>
              {DROP_RATES.map((row) => (
                <tr key={row.grade} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{row.grade}</td>
                  <td className="py-2 pr-4">{row.slots1to4}</td>
                  <td className="py-2">{row.slot5}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Bullets>
          <li>
            <strong>A Legendary is guaranteed within 35 packs of a set.</strong> After 34 packs of
            a set with no Legendary or Secret, the next pack&apos;s card 5 is a Legendary.
          </li>
          <li>
            While you are still missing a Legendary from a set, you never pull a duplicate
            Legendary from it.
          </li>
          <li>Your very first pack&apos;s card 5 is always Epic or better.</li>
          <li>
            Otherwise, within a grade, every card of the set is equally likely.
          </li>
        </Bullets>
      </section>
    </MiuuCardsPage>
  );
};

export default MiuuCardsSupport;
