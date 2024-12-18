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
    Miuu Studio created the Miuu Note - Diary With Lock app as a free application
    with optional in-app purchases and ads. The base version of this Service is
    provided at no cost and is intended for use as-is. Users can opt to purchase
    a subscription or a one-time permanent upgrade for an ad-free experience and
    access to premium features.
  </p>
  <p>
    This Privacy Policy informs users about how their Personal Information is
    collected, used, and disclosed when using this Service. By using the Service,
    you agree to the collection and use of information as described in this
    policy.
  </p>
  <p>
    <strong>Information Collection and Use</strong>
  </p>
  <p>
    The app may request personally identifiable information for a better user
    experience. This information is stored on your device and is not collected
    by Miuu Studio.
  </p>
  <p>
    However, the app uses third-party services that may collect data to identify
    you. These include:
  </p>
  <ul>
    <li>Google Play Services</li>
  </ul>
  <p>
    <strong>Data Backup and Storage</strong>
  </p>
  <p>
    <strong>Apple Login Users</strong>: For users who sign in with Apple Login, we
    use Google Cloud Storage to securely back up user-input data (such as diary
    entries). This ensures your data is recoverable if you switch devices or
    reinstall the app. Miuu Studio retains management control of the data stored
    on Google Cloud but does not directly host or access it. For more
    information, please review{' '}
    <a
      href="https://cloud.google.com/privacy"
      target="_blank"
      rel="noopener noreferrer"
    >
      Google Cloud’s Privacy Policy
    </a>
    .
  </p>
  <p>
    <strong>Google Login Users</strong>: For users who sign in with Google Login,
    user-input data is backed up directly to your Google Drive. This means no
    data is sent to or stored by Miuu Studio. You retain full ownership and
    control of the data stored in your Google Drive. Please refer to{' '}
    <a
      href="https://policies.google.com/privacy"
      target="_blank"
      rel="noopener noreferrer"
    >
      Google Drive’s Privacy Policy
    </a>{' '}
    for details on their data handling practices.
  </p>
  <p>
    <strong>Log Data</strong>
  </p>
  <p>
    If the app encounters an error, it collects data such as your device&apos;s IP
    address, name, operating system, and usage statistics through third-party
    services. No user-input data is ever collected.
  </p>
  <p>
    <strong>Cookies</strong>
  </p>
  <p>
    The app itself does not use cookies but may include third-party code or
    libraries that do. You can choose to accept or refuse cookies in your
    settings, but some features may be affected.
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
    These providers may access your Personal Information but are obligated not to
    misuse it.
  </p>
  <p>
    <strong>Security</strong>
  </p>
  <p>
    We take reasonable measures to protect your Personal Information but cannot
    guarantee absolute security due to the nature of internet transmission and
    electronic storage.
  </p>
  <p>
    <strong>Links to Other Sites</strong>
  </p>
  <p>
    The app may contain links to external websites. Miuu Studio is not
    responsible for the privacy practices or content of these sites. Review their
    Privacy Policies for more information.
  </p>
  <p>
    <strong>Children&apos;s Privacy</strong>
  </p>
  <p>
    This Service is not intended for children under 13. We do not knowingly
    collect data from children under 13. If you believe your child has provided
    Personal Information, please contact us for prompt deletion.
  </p>
  <p>
    <strong>Changes to This Policy</strong>
  </p>
  <p>
    This Privacy Policy may be updated occasionally. Users are encouraged to
    review this page regularly. Changes will be posted here and are effective
    immediately.
  </p>
  <p>
    Effective Date: July 1, 2022
  </p>
  <p>
    <strong>Contact Us</strong>
  </p>
  <p>
    For questions or suggestions, contact us at:{' '}
    <a href="mailto:support@miuustudio.com">support@miuustudio.com</a>
  </p>
</main>

    </>
  );
};

export default PrivacyPolicyPage;
