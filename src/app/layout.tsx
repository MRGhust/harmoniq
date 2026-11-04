import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Harmoniq • گوش دادن همزمان به موزیک در روم آنلاین',
  description: 'پلتفرم رایگان، اپن‌سورس و با تاخیر صفر برای ساخت اتاق، گوش دادن هماهنگ به موسیقی، چت و تعامل با دوستان.',
  keywords: ['Listen Together', 'Music Room', 'همگام‌سازی موزیک', 'موزیک آنلاین', 'گوش دادن گروهی', 'روم موسیقی'],
  openGraph: {
    title: 'Harmoniq • پلتفرم اشتراک و پخش همگام موسیقی',
    description: 'در اتاق‌های اختصاصی با دوستانتان همزمان و بدون تاخیر به موزیک گوش دهید!',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen text-slate-100 antialiased selection:bg-purple-500 selection:text-white" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-[128px]" />
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px]" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
