import Head from "next/head";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

const PrivacyPolicyPage = () => {
  return (
    <>
      <Head>
        <title>Miuu Studio Privacy Policy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" type="image/x-icon" href="favicon.ico" />
      </Head>

      <main
        className={`flex min-h-screen flex-col justify-between ${montserrat.className} p-6`}
      >
        <strong>Privacy Policy</strong>
        <p>
          Miuu Studio created the Miuu Note - Diary With Lock app as a free
          application with optional in-app purchases and ads. The base version
          of this Service is provided at no cost and is intended for use as-is.
          Users can opt to purchase a subscription or a one-time permanent
          upgrade for an ad-free experience and access to premium features.
        </p>
        <p>
          This Privacy Policy informs users about how their Personal Information
          is collected, used, and disclosed when using this Service. By using
          the Service, you agree to the collection and use of information as
          described in this policy.
        </p>

        <p>
          <strong>Information Collection and Use</strong>
        </p>
        <p>
          The app may request personally identifiable information for a better user experience. When you sign in with Apple 
  Login or Google Login, we collect your email address and display name for account identification and customer
  support purposes. This information is stored securely on our servers powered by Google Cloud. User-generated
  content (such as diary entries and images) is stored on your device by default. It leaves your device only when you
  use our backup service (see &ldquo;Data Backup and Storage&rdquo;) or when you choose to enable optional AI-powered
  features (see &ldquo;AI Features and Third-Party AI Processing&rdquo;). We do not otherwise collect your diary
  content. Limited anonymous or pseudonymous usage data may be collected through third-party analytics services for
  product improvement, as described below.
        </p>
        <p>
          However, the app uses third-party services that may collect data to
          identify you. These include:
        </p>
        <ul>
          <li>Google Play Services / Apple App Store</li>
          <li>
            Google Firebase &mdash; sign-in, analytics, crash reporting, push
            notifications and feature configuration
          </li>
          <li>Sentry &mdash; error reporting</li>
          <li>Google AdMob &mdash; advertising in the free version</li>
          <li>
            RevenueCat &mdash; subscription and purchase status, and Apple
            Search Ads attribution on iOS
          </li>
          <li>Google Cloud &mdash; our servers, backup storage</li>
          <li>Anthropic &mdash; the optional AI features (see below)</li>
        </ul>

        <p>
          <strong>Analytics &amp; Product Usage Data</strong>
        </p>
        <p>
          We use third-party analytics and error-reporting services (Google
          Firebase Analytics and Crashlytics, and Sentry) to understand how
          users interact with the app and to improve features, usability, and
          performance.
        </p>
        <p>
          These services may collect{" "}
          <strong>anonymous or pseudonymous usage data</strong>, such as:
        </p>
        <ul>
          <li>App feature interactions (e.g., button taps, screen views)</li>
          <li>Device type, operating system, and app version</li>
          <li>Approximate location (derived from IP address, anonymized)</li>
          <li>Event timestamps and session duration</li>
          <li>
            Estimated age range, gender and interests, seen only as totals
            across many users (see Google signals below)
          </li>
        </ul>
        <p>
          <strong>What we do NOT collect through analytics:</strong>
        </p>
        <ul>
          <li>Diary content or text entries</li>
          <li>Photos, images, or attachments</li>
          <li>User names, email addresses, or login credentials</li>
          <li>Any personally identifiable journal data</li>
        </ul>
        <p>
          <strong>Google signals</strong>: we have turned on Google signals in
          Google Analytics. If you are signed in to a Google account and have
          allowed Google to personalise ads for you, Google may link the
          app&apos;s analytics data to that account so that it can give us
          estimates of our users&apos; age ranges, genders and interests. We
          only ever see totals across many users. Google hides any group too
          small to stay anonymous, and we never receive your Google account
          details. We use these reports to understand who uses Miuu Note, not
          to target ads. In the European Economic Area and the UK this happens
          only if you agreed to personalised ads in the consent form described
          under Advertising. You can switch it off for your Google account at
          any time by turning off ad personalisation in{" "}
          <a
            href="https://myadcenter.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            My Ad Center
          </a>
          .
        </p>
        <p>
          Analytics data is used strictly for product improvement and is never
          sold. For more information, please review{" "}
          <a
            href="https://firebase.google.com/support/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Firebase&apos;s Privacy and Security page
          </a>{" "}
          and{" "}
          <a
            href="https://sentry.io/privacy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sentry&apos;s Privacy Policy
          </a>
          . The app also shows ads through Google AdMob; see{" "}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google&apos;s advertising policies
          </a>
          .
        </p>
        <p>
        Note: Email addresses and display names collected at sign-in are used solely for account management and customer
  support, not for analytics or advertising purposes.
        </p>

        <p>
          <strong>Purchases and Subscriptions</strong>
        </p>
        <p>
          Payment is handled entirely by the App Store or Google Play. We never
          see your card details. We use <strong>RevenueCat</strong> to tell the
          app whether a purchase or subscription is active; it receives an
          anonymous app user identifier and the purchase information the store
          provides. Cancelling or refunding a subscription is done through your
          store account.
        </p>
        <p>
          On iOS, if you installed the app from an Apple Search Ads ad,
          RevenueCat also receives Apple&apos;s attribution token, which tells
          us which ad campaign led to the install. It contains no advertising
          identifier and does not require tracking permission.
        </p>

        <p>
          <strong>Advertising</strong>
        </p>
        <p>
          The free version shows ads through <strong>Google AdMob</strong>.
          Buying the ad-free upgrade or a subscription removes them.
        </p>
        <ul>
          <li>
            In the European Economic Area and the UK, the app shows Google&apos;s
            consent form before any personalised ads. You may choose
            non-personalised ads, and you can change your choice later.
          </li>
          <li>
            On iOS, the system &ldquo;Allow app to track&rdquo; prompt asks
            whether the app may use your device&apos;s advertising identifier.
            If you decline, ads still appear but are non-personalised. Apple
            Search Ads attribution (see Purchases and Subscriptions) does not
            use this permission.
          </li>
          <li>
            We never share your diary content, photos or voice notes with
            advertising partners. Ads are not targeted using anything you write.
          </li>
        </ul>

        <p>
          <strong>Push Notifications</strong>
        </p>
        <p>
          If you turn on reminders, the app registers a device notification
          token with Firebase Cloud Messaging so we can send the reminder you
          asked for. The token identifies a device installation, not you, and it
          is removed when the reminder is turned off, the app is uninstalled, or
          the token stops working. Notifications never contain your diary
          content. You can turn them off in the app or in your device settings.
        </p>

        <p>
          <strong>Invite a Friend</strong>
        </p>
        <p>
          When you invite a friend, or accept a friend&apos;s invite, the app uses
          our referral service so that both of you can receive in-app coins and
          rewards. This is what it stores and why:
        </p>
        <ul>
          <li>
            <strong>Invite codes</strong>: your personal code, when it was
            created, whether your phone is iOS or Android, and a one-way hash of
            the secret key that proves the code is yours. The key itself stays on
            your device.
          </li>
          <li>
            <strong>A device check</strong>: so that a phone cannot invite itself
            or be invited twice, the app sends a{" "}
            <strong>one-way, salted hash of your device&apos;s identifier</strong>{" "}
            (on Android, the Android ID; on iPhone, the identifier Apple gives
            each app developer). The identifier itself never leaves your device
            and cannot be recovered from the hash, and it is{" "}
            <strong>never linked to your advertising identifier</strong>. We use
            it only to prevent fraud.
          </li>
          <li>
            <strong>The link between friends</strong>: when a friend uses your
            code, we record that their (hashed) device used it, when, whether it
            came through a link or was typed, and when they wrote their first
            entry. We never record a friend&apos;s name, email or diary content,
            and the person who invited them sees only how many friends joined,
            not who they are.
          </li>
          <li>
            <strong>Install referrer</strong>: on Android, when you install Miuu
            from an invite link, the app reads the invite code that Google Play
            passes along with the install.
          </li>
          <li>
            <strong>Abuse limits</strong>: our server counts invite requests from
            each network address per hour. It stores only a one-way hash of the
            address and deletes it within about two days.
          </li>
          <li>
            <strong>Backups</strong>: your own code and any invite you accepted
            are included in your backup, so they come back when you restore.
          </li>
        </ul>

        <p>
          <strong>Data Backup and Storage</strong>
        </p>
        <p>Account Information: When you sign in, your email address and display name are stored on our secure servers
  (Google Cloud Firestore) for account identification, customer support, and data recovery purposes. This account
  metadata is stored separately from your diary content and is not used for marketing or advertising.
        </p>
        <p>
          <strong>Your backups</strong>: Whether you sign in with Apple or
          Google, the backup service stores your user-input data (such as
          diary entries, images and voice notes) on our secure servers powered
          by Google Cloud Storage. This keeps your data recoverable if you
          switch devices or reinstall the app, on iOS or Android. Miuu Studio
          retains management control of the data stored on Google Cloud but
          does not directly access or read your personal content. For more
          information, please review{" "}
          <a
            href="https://cloud.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Cloud&apos;s Privacy Policy
          </a>
          .
        </p>
        <p>
          <strong>Older Google Drive backups</strong>: Before February 2026,
          Android users who signed in with Google could choose to back up to
          their own Google Drive instead. Those backups were never sent to or
          stored by Miuu Studio. This option is no longer offered and is being
          retired: updated versions of the app move those devices to the backup
          service above, and no longer write to Google Drive. If you have an
          old Drive backup, it stays in your Drive, and the app reads it only
          when you ask it to import it. For this, when you sign in with Google
          the app asks for access to the files it created in your Drive
          (Google&apos;s &ldquo;drive.file&rdquo; permission), which does not
          let it see anything else in your Drive.
        </p>
        <p>
          Please refer to{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google&apos;s Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="https://cloud.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Cloud&apos;s Privacy Policy
          </a>{" "}
          for details on their data handling practices.
        </p>

        <p>
          <strong>AI Features and Third-Party AI Processing</strong>
        </p>
        <p>
          The app offers optional, AI-powered features (for example, features
          that answer questions about your notes, or that automatically organize
          the people, places, and themes you write about). These features are
          <strong> turned off by default</strong> and only operate if you
          explicitly turn them on. They are intended for adult users (18 and
          older).
        </p>
        <p>
          If you enable an AI feature, the text of the relevant notes is sent to
          a third-party AI provider, <strong>Anthropic</strong> (the maker of
          Claude), to process your request. Depending on the feature, this may
          happen only when you ask a question, or continuously in the background
          as you write. We never send your photos, images, or voice notes to the
          AI provider &mdash; only text.
        </p>
        <p>
          For features that build a picture of the people, places and things you
          write about, <strong>you choose which past entries are included</strong>{" "}
          when you turn the feature on &mdash; for example your most recent
          entries, or entries you pick yourself &mdash; and each new entry is
          sent when you save it. You can change that choice at any time in the
          app.
        </p>
        <p>Under our commercial agreement with Anthropic:</p>
        <ul>
          <li>
            Your content is <strong>not used to train AI models</strong>.
          </li>
          <li>
            Your content is processed to return a result and is not retained
            long-term. When past entries are processed together in the
            background, the provider holds them until the results have been
            delivered to your app, and we delete them as soon as they are; if
            they are never collected, the provider deletes them within 30 days.
          </li>
          <li>
            The results &mdash; such as the names of people, places and things
            you wrote about, together with short quotes from your own entries
            &mdash; are stored <strong>on your device</strong>, and, like your
            entries, in your backup if you use our backup service. You can
            remove them at any time from the app&apos;s settings.
          </li>
          <li>
            Miuu Studio does not keep the AI results on our servers beyond what
            is needed to operate the feature (such as counting usage against any
            free limit).
          </li>
        </ul>
        <p>
          You can decline these features and continue using the rest of the app
          normally, and you can turn them off at any time. Because these features
          send the content of personal journal entries to a third party, we do
          not knowingly make them available to, or process the content of,
          children. For details on how the provider handles data, please review{" "}
          <a
            href="https://www.anthropic.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Anthropic&apos;s Privacy Policy
          </a>
          .
        </p>

        <p>
          <strong>Log Data</strong>
        </p>
        <p>
          If the app encounters an error, it collects data such as your
          device&apos;s IP address, name, operating system, and usage statistics
          through third-party services. No user-input data is ever collected.
        </p>
        <p>
          To protect the AI features from abuse, the app may also send our
          service a short-lived token from Apple App Attest or Google Play
          Integrity confirming that the request comes from a genuine copy of the
          app. These tokens contain no personal content and are not stored.
        </p>

        <p>
          <strong>Cookies</strong>
        </p>
        <p>
          The app itself does not use cookies but may include third-party code
          or libraries that do. You can choose to accept or refuse cookies in
          your settings, but some features may be affected.
        </p>

        <p>
          <strong>Third-Party Service Providers</strong>
        </p>
        <ul>
          <li>Facilitate the Service</li>
          <li>Perform Service-related functions</li>
          <li>Analyze Service usage</li>
        </ul>
        <p>
          These providers may access your Personal Information but are obligated
          not to misuse it.
        </p>

        <p>
          <strong>Security</strong>
        </p>
        <p>
          We take reasonable measures to protect your Personal Information but
          cannot guarantee absolute security due to the nature of internet
          transmission and electronic storage.
        </p>

        <p>
          <strong>Data Breach Response</strong>
        </p>
        <p>
          In the event of a data breach that may affect your Personal
          Information, we will:
        </p>
        <ul>
          <li>
            Investigate the incident promptly and take immediate steps to
            contain the breach
          </li>
          <li>
            Notify affected users within 72 hours of discovering the breach,
            where technically feasible
          </li>
          <li>
            Provide details about what information was involved, steps we are
            taking to address the breach, and recommended actions for users
          </li>
          <li>
            Comply with applicable data protection laws and regulations
            regarding breach notification
          </li>
          <li>
            Implement additional security measures to prevent similar incidents
          </li>
        </ul>

        <p>
          <strong>Limitation of Liability</strong>
        </p>
        <p>
          While we implement industry-standard security measures and follow best
          practices to protect your data, we cannot be held liable for:
        </p>
        <ul>
          <li>
            Unauthorized access due to user negligence (sharing passwords, using
            insecure devices, etc.)
          </li>
          <li>
            Breaches caused by third-party services beyond our control (Apple
            iCloud, Google Drive, etc.)
          </li>
          <li>
            Acts of nature, cyber attacks, or other events beyond our reasonable
            control
          </li>
          <li>
            Data loss, corruption, or unavailability resulting from device
            failure, app deletion, user error, or failed backup/restore
            processes.
          </li>
        </ul>
        <p>
          Our liability is limited to the maximum extent permitted by applicable
          law. We recommend users maintain their own backups and use strong,
          unique passwords.
        </p>

        <p>
          <strong>Links to Other Sites</strong>
        </p>
        <p>
          The app may contain links to external websites. Miuu Studio is not
          responsible for the privacy practices or content of these sites.
          Review their Privacy Policies for more information.
        </p>

        <p>
          <strong>Children&apos;s Privacy</strong>
        </p>
        <p>
          This app is intended for users aged 18 and older and is not directed to
          or designed for children. On the Google Play Store it is declared for a
          target audience of 18 and over.
        </p>
        <p>
          Consistent with the Children&apos;s Online Privacy Protection Act
          (COPPA), we do not knowingly collect personal information from children
          under 13, and we do not knowingly send any child&apos;s content to
          third-party AI providers. The optional AI features described above are
          intended for adult users only. If we learn that we have collected
          personal information from a child under 13 without appropriate parental
          consent, we will delete it.
        </p>
        <p>
          Parents or guardians who believe their child has provided personal
          information to us should contact us immediately at{" "}
          <a href="mailto:support@miuustudio.com">support@miuustudio.com</a> for
          prompt deletion of such information.
        </p>

        <p>
          <strong>How Long We Keep Data</strong>
        </p>
        <ul>
          <li>
            <strong>Invite records</strong> (codes, the hashed device check and
            the link between friends): kept while the invite program runs, so a
            phone cannot be invited twice. To have yours deleted, email us with
            your invite code (Settings &rarr; Invite friends).
          </li>
          <li>
            <strong>Backups</strong>: kept for as long as your account exists,
            so a backup is there when you need it. We keep the current backup
            and the previous one; older ones are replaced. Delete your account
            (below) and they go with it.
          </li>
          <li>
            <strong>Account record</strong> (email address, display name): kept
            while your account exists.
          </li>
          <li>
            <strong>Usage counters</strong> for free limits on the AI features:
            monthly counts, and a one-time count for the first build of your
            universe. They hold numbers, never your text.
          </li>
          <li>
            <strong>Reminder schedules</strong>: kept while the reminder is on,
            and removed shortly after it is turned off or stops working.
          </li>
          <li>
            <strong>Diagnostic logs</strong> (errors, request records): kept for
            a limited period, normally no more than 90 days.
          </li>
          <li>
            <strong>Diary content on your device</strong>: yours, for as long as
            you keep the app installed. Deleting the app deletes it, which is
            why we recommend keeping a backup.
          </li>
        </ul>

        <p>
          <strong>Your Rights and Choices</strong>
        </p>
        <p>
          The app is published by Miuu Studio, a sole proprietorship registered
          in Ontario, Canada, which is responsible for the personal information
          described here. Canadian federal privacy law (PIPEDA) applies to us.
        </p>
        <p>
          Wherever you live, you can ask us to give you a copy of the personal
          information we hold, correct it, or delete it. If you are in the
          European Economic Area or the UK, you also have the right to object to
          or restrict certain processing, to receive your data in a portable
          form, and to complain to your local data protection authority.
        </p>
        <p>
          Our legal bases for processing are: performing the service you asked
          for (your account and backups); your consent (the AI features,
          personalised ads and Google signals, notifications), which you can withdraw at any time
          without losing the rest of the app; and our legitimate interests in
          keeping the service working and safe from abuse.
        </p>
        <p>
          You can act on most of this inside the app: turn the AI features off
          or choose &ldquo;Forget my universe&rdquo;, turn off reminders, change
          your ads choice, delete individual entries, or stop backing up. For
          anything else, write to us at{" "}
          <a href="mailto:support@miuustudio.com">support@miuustudio.com</a>.
        </p>
        <p>
          <strong>Deleting your account and backups</strong>: email{" "}
          <a href="mailto:support@miuustudio.com">support@miuustudio.com</a>{" "}
          from the address you signed in with, and we will delete your account
          record and everything stored for it on our servers &mdash; your
          backups, their media, your reminder schedules and your usage counters
          &mdash; within 30 days. Diary entries on your own device are not
          affected; delete the app to remove those. If you have an older backup
          in your own Google Drive, that copy is yours to delete from Drive.
        </p>
        <p>
          We do not sell your personal information, and we do not share it for
          cross-context behavioural advertising. California residents may
          exercise the rights above without being treated differently for doing
          so. If you are in Canada and we have not resolved your concern, you
          may contact the Office of the Privacy Commissioner of Canada.
        </p>
        <p>
          <strong>Where your data is processed</strong>: we are based in Canada,
          and the providers listed above &mdash; Google Cloud, Firebase,
          RevenueCat, Sentry and Anthropic &mdash; process data in the United
          States. Personal information handled by us in Canada is protected
          under Canadian federal privacy law; for transfers on to those
          providers we rely on the safeguards in our agreements with them, such
          as the standard contractual clauses, where the law requires them.
        </p>

        <p>
          <strong>Changes to This Policy</strong>
        </p>
        <p>
          This Privacy Policy may be updated occasionally. Users are encouraged
          to review this page regularly. Changes will be posted here and are
          effective immediately.
        </p>
        <p>Effective Date: September 26, 2026</p>

        <p>
          <strong>Contact Us</strong>
        </p>
        <p>
          For questions or suggestions, contact us at:{" "}
          <a href="mailto:support@miuustudio.com">support@miuustudio.com</a>
        </p>
      </main>
    </>
  );
};

export default PrivacyPolicyPage;
