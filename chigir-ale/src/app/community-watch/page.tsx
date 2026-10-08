import { Metadata } from "next";
import { CommunityWatchApp } from "@/features/community/components/community-watch-app";

export const metadata: Metadata = {
  title: "Chigr Ale — Hyperlocal Civic Action",
  description:
    "Community reporting platform with live voice interaction, clustering map, and municipal dispatch across Addis Ababa.",
};

export default function CommunityWatchPage() {
  return <CommunityWatchApp />;
}
