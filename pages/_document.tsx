import { Html, Head, Main, NextScript } from "next/document";
import { GA_MEASUREMENT_ID, gtagBootstrap } from "@/lib/analytics";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* lets CSS hide scroll-reveal content only when JS is there to show it again */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {/* Google Analytics (lib/analytics.ts): consent defaults and config before gtag.js loads */}
        <script dangerouslySetInnerHTML={{ __html: gtagBootstrap }} />
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
