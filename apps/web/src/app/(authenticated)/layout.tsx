import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { PageContainer } from "@/components/layout/page-container";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-gray-100 dark">
      <TopNav />
      <main className="flex-1 w-full py-8">
        <PageContainer>
          {children}
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
}
