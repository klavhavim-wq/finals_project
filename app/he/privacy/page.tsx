import type { Metadata } from "next";
import PrivacyNotice from "@/components/PrivacyNotice";
import { PRIVACY } from "@/lib/i18n/privacy";

export const metadata: Metadata = { title: PRIVACY.he.title };

export default function PrivacyHe() {
  return <PrivacyNotice locale="he" />;
}
