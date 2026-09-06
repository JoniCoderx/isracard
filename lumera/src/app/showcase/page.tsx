import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import ShowcaseGrid from "@/components/showcase/ShowcaseGrid";
import FinalSection from "@/components/sections/FinalSection";

export const metadata: Metadata = {
  title: "The Showcase",
  description: "A small, exceptional selection — diamond tennis, rings, necklaces, high jewellery and bespoke.",
};

export default function ShowcasePage() {
  return (
    <>
      <PageHeader
        eyebrow="The Showcase"
        title="A few exceptional pieces,"
        titleItalic="presented one at a time."
        intro="We hold very little in stock and show even less. Each piece here is available now or made to order in our Dubai atelier."
      />
      <ShowcaseGrid />
      <div className="h-32" />
      <FinalSection />
    </>
  );
}
