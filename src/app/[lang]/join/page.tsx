import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.comingSoon.joinTitle };
}

export default async function Page() {
  const dict = await getDictionary();
  return <ComingSoon title={dict.comingSoon.joinTitle} />;
}
