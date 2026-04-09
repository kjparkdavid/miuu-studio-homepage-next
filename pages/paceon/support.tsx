import Head from "next/head";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

const PaceonSupportPage = () => {
  return (
    <>
      <Head>
        <title>Paceon Support</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <main className={`${montserrat.className} min-h-screen bg-[#F7F3EE]`}>
        {/* Hero */}
        <div className="max-w-2xl mx-auto px-6 pt-16 pb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Paceon</h1>
          <p className="text-lg text-gray-500">AI running coach for your race</p>
        </div>

        {/* Screenshots */}
        <div className="flex justify-center gap-4 px-6 overflow-x-auto pb-10">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex-shrink-0 w-48 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={`/images/paceon/${n}.png`}
                alt={`Paceon screenshot ${n}`}
                width={390}
                height={844}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>

        {/* Support */}
        <div className="max-w-xl mx-auto px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need help?</h2>
          <p className="text-gray-500 mb-6">
            For support, questions, or feedback about Paceon, reach out to us and we&apos;ll get back to you as soon as possible.
          </p>
          <a
            href="mailto:support@miuustudio.com"
            className="inline-block bg-[#C94B2A] text-white font-medium px-8 py-3 rounded-full text-base hover:opacity-90 transition-opacity"
          >
            support@miuustudio.com
          </a>

          <div className="mt-12 text-sm text-gray-400">
            <a href="/paceon/privacy-policy" className="underline hover:text-gray-600">
              Privacy Policy
            </a>
          </div>
        </div>
      </main>
    </>
  );
};

export default PaceonSupportPage;
