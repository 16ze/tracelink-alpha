import { Footer } from "@/components/layout/footer";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <Footer locale={locale} />
    </div>
  );
}

