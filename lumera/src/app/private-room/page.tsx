import type { Metadata } from "next";
import PrivateRoom from "@/components/private/PrivateRoom";
import FinalSection from "@/components/sections/FinalSection";

export const metadata: Metadata = {
  title: "The Private Room",
  description: "Reserve a private appointment in Dubai — viewing, bespoke consultation or stone sourcing.",
};

export default function PrivateRoomPage() {
  return (
    <>
      <PrivateRoom />
      <FinalSection />
    </>
  );
}
