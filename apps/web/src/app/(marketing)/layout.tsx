import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="saas-editorial min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
