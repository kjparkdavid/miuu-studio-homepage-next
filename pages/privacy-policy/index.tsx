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
          <li>Google Play Services</li>
          <li>PostHog (Product analytics)</li>
        </ul>

        <p>
          <strong>Analytics &amp; Product Usage Data</strong>
        </p>
        <p>
          We use a third-party analytics service (PostHog) to understand how
          users interact with the app and to improve features, usability, and
          performance.
        </p>
        <p>
          PostHog may collect <strong>anonymous or pseudonymous usage data</strong>, such as:
        </p>
        <ul>
          <li>App feature interactions (e.g., button taps, screen views)</li>
          <li>Device type, operating system, and app version</li>
          <li>Approximate location (derived from IP address, anonymized)</li>
          <li>Event timestamps and session duration</li>
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
          Analytics data is used strictly for product improvement and is never
          sold or used for advertising purposes. For more information, please
          review{" "}
          <a
            href="https://posthog.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            PostHog&apos;s Privacy Policy
          </a>
          .
        </p>
        <p>
        Note: Email addresses and display names collected at sign-in are used solely for account management and customer
  support, not for analytics or advertising purposes.
        </p>

        <p>
          <strong>Data Backup and Storage</strong>
        </p>
        <p>Account Information: When you sign in, your email address and display name are stored on our secure servers
  (Google Cloud Firestore) for account identification, customer support, and data recovery purposes. This account
  metadata is stored separately from your diary content and is not used for marketing or advertising.
        </p>
        <p>
          <strong>Apple Login Users</strong>: For users who sign in with Apple
          Login, we use our secure backup system powered by Google Cloud Storage
          to back up user-input data (such as diary entries). This ensures your
          data is recoverable if you switch devices or reinstall the app. Miuu
          Studio retains management control of the data stored on Google Cloud
          but does not directly access or read your personal content. For more
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
          <strong>Google Login Users</strong>: For users who sign in with Google
          Login, you can choose between two backup methods:
        </p>
        <ul>
          <li>
            <strong>Cross-Platform Backup (Recommended)</strong>: Your data is
            backed up to our secure servers powered by Google Cloud Storage.
            This provides seamless backup and restore across both iOS and
            Android devices. Miuu Studio retains management control of the data
            stored on Google Cloud but does not directly access or read your
            personal content.
          </li>
          <li>
            <strong>Google Drive Backup</strong>: Your data is backed up
            directly to your personal Google Drive. This means no data is sent
            to or stored by Miuu Studio. You retain full ownership and control
            of the data stored in your Google Drive.
          </li>
        </ul>
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
        <p>Under our commercial agreement with Anthropic:</p>
        <ul>
          <li>
            Your content is <strong>not used to train AI models</strong>.
          </li>
          <li>
            Your content is processed to return a result and then deleted by the
            provider a short time afterward; it is not retained long-term.
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
          <strong>Changes to This Policy</strong>
        </p>
        <p>
          This Privacy Policy may be updated occasionally. Users are encouraged
          to review this page regularly. Changes will be posted here and are
          effective immediately.
        </p>
        <p>Effective Date: July 16, 2026</p>

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
