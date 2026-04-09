import Head from "next/head";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

const PaceonPrivacyPolicy = () => {
  return (
    <>
      <Head>
        <title>Paceon Privacy Policy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <main className={`${montserrat.className} max-w-2xl mx-auto px-6 py-10`}>
        <h1 className="text-2xl font-bold mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Effective Date: April 8, 2026</p>

        <p>
          Paceon is a running training app built by Miuu Studio. This Privacy Policy explains how we
          collect, use, and protect your information when you use the Paceon mobile application.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-2">Information We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Account information:</strong> Your email address and password when you sign up.</li>
          <li><strong>Onboarding data:</strong> Your race goal, race date, current fitness level, and training preferences used to generate your plan.</li>
          <li><strong>Training data:</strong> Your training plans, workouts, and completion status.</li>
          <li><strong>Strava data:</strong> If you connect Strava, we access your activity history, routes, pace, distance, and elevation data via the Strava API.</li>
          <li><strong>Push notification token:</strong> If you grant permission, your device token is stored to send daily workout reminders.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-8 mb-2">How We Use Your Information</h2>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Generate and personalize your AI-powered training plan.</li>
          <li>Display your daily workouts, weekly progress, and Strava-connected routes.</li>
          <li>Send push notifications for daily workout reminders (only if you opt in).</li>
          <li>Improve the accuracy and quality of our AI recommendations over time.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-8 mb-2">Third-Party Services</h2>
        <p>Paceon uses the following third-party services that may process your data:</p>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>
            <strong>Supabase</strong> -- authentication and database hosting. Your account and training
            data are stored securely on Supabase infrastructure.{" "}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
              Supabase Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Strava</strong> -- if you connect your Strava account, activity data is imported
            via the Strava API in accordance with Strava&apos;s terms.{" "}
            <a href="https://www.strava.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline">
              Strava Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Anthropic</strong> -- your onboarding data and training context are sent to the
            Anthropic Claude API to generate your training plan. No personally identifiable information
            beyond training preferences is included in these requests.{" "}
            <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
              Anthropic Privacy Policy
            </a>
            .
          </li>
        </ul>

        <h2 className="text-lg font-semibold mt-8 mb-2">Data Storage and Security</h2>
        <p>
          Your data is stored on Supabase-managed Postgres databases hosted on secure cloud
          infrastructure. We use industry-standard encryption in transit (HTTPS/TLS) and at rest.
          We do not sell your data to third parties.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-2">Data Retention and Deletion</h2>
        <p>
          Your data is retained as long as your account is active. You may request deletion of your
          account and all associated data at any time by contacting us at the email below. We will
          process deletion requests within 30 days.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-2">Push Notifications</h2>
        <p>
          If you grant notification permissions, we store your device push token to send daily workout
          reminders. You can disable notifications at any time in your device settings. Revoking
          permission removes your token from our system on the next sync.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-2">Children&apos;s Privacy</h2>
        <p>
          Paceon is not intended for children under the age of 13. We do not knowingly collect personal
          information from children under 13. If you believe your child has provided us with personal
          information, please contact us and we will delete it promptly.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-2">Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this page
          with an updated effective date. Continued use of the app after changes constitutes
          acceptance of the revised policy.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-2">Contact Us</h2>
        <p>
          For questions, data requests, or concerns, contact us at:{" "}
          <a href="mailto:support@miuustudio.com" className="underline">
            support@miuustudio.com
          </a>
        </p>
      </main>
    </>
  );
};

export default PaceonPrivacyPolicy;
