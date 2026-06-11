"use client";

/**
 * ProfileCardHero — thin client wrapper around <ProfileCard /> so the
 * server-rendered /about page can still pass an `onContactClick`
 * handler (Next.js forbids passing inline functions from a server
 * component to a client component, but a client component is free to
 * define handlers locally and forward them to another client child).
 *
 * Renders the React Bits canonical ProfileCard with the user-specified
 * prop set verbatim — see /assets/demo/iconpattern.png for the
 * character-pattern overlay this card relies on.
 */

import ProfileCard from "@/components/ProfileCard";

export default function ProfileCardHero() {
  return (
    <ProfileCard
      className="pc-no-text"
      name=""
      title=""
      avatarUrl="/og-default.jpg"
      iconUrl="/assets/demo/iconpattern.png"
      grainUrl="/assets/demo/grain.webp"
      showUserInfo={false}
      enableTilt={true}
      enableMobileTilt
      behindGlowColor="rgba(125, 190, 255, 0.67)"
      behindGlowEnabled
      innerGradient="linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)"
    />
  );
}
