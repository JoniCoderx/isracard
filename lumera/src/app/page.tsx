import CinematicHero from "@/components/hero/CinematicHero";
import HouseStatement from "@/components/sections/HouseStatement";
import ShowcasePreview from "@/components/sections/ShowcasePreview";
import InsideTheStone from "@/components/sections/InsideTheStone";
import BespokeTeaser from "@/components/sections/BespokeTeaser";
import PrivateClient from "@/components/sections/PrivateClient";
import TrustEditorial from "@/components/sections/TrustEditorial";
import FinalSection from "@/components/sections/FinalSection";

export default function Home() {
  return (
    <>
      <CinematicHero />
      <div className="relative z-10 bg-obsidian">
        <HouseStatement />
        <ShowcasePreview />
        <InsideTheStone />
        <BespokeTeaser />
        <PrivateClient />
        <TrustEditorial />
        <FinalSection />
      </div>
    </>
  );
}
