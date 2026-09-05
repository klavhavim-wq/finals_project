import type { Metadata } from "next";
import PrivacyNotice from "@/components/PrivacyNotice";
import { PRIVACY } from "@/lib/i18n/privacy";

export const metadata: Metadata = { title: PRIVACY.en.title };

export default function PrivacyEn() {
  return <PrivacyNotice locale="en" />;
}
