import type { Metadata } from "next";
import { headers } from "next/headers";
import { Noto_Sans_SC, ZCOOL_XiaoWei } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans_SC({
  variable: "--font-sans-cn",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = ZCOOL_XiaoWei({
  variable: "--font-display-cn",
  subsets: ["latin"],
  weight: ["400"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") || "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "针迹小屋 · 图片转十字绣图纸";
  const description = "上传图片生成十字绣图纸，智能匹配 DMC 线号，也可从原创图纸库直接开始。";

  return {
    metadataBase: new URL(origin),
    title,
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1744, height: 909, alt: "针迹小屋十字绣工作室" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${sans.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}
