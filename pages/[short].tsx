import type { GetStaticPaths, GetStaticProps } from "next";
import { SHORT_LINKS } from "@/lib/attribution";

// miuunote.site/ig, /tt, /yt: the home page itself, for social bios. Its canonical
// stays `/`, and `captureAttribution` credits the visit to that network.
export { default } from "@/pages/index";

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: Object.keys(SHORT_LINKS).map((short) => ({ params: { short } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async () => ({ props: {} });
