import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-provider";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gndwrk.com";

export const metadata: Metadata = {
  title: {
    default: "Gndwrk - Family Banking for Financial Literacy",
    template: "%s | Gndwrk",
  },
  description:
    "Teach your kids financial literacy through real banking experience. Four-bucket system (Spend, Save, Give, Invest), Trust Score that converts to real credit benefits at 18, and AI coaching. Trusted by 12,000+ families.",
  keywords: [
    "family banking app",
    "kids money management",
    "financial literacy for kids",
    "children's debit card",
    "teach kids about money",
    "allowance app",
    "chore app for kids",
    "kids savings account",
    "youth banking",
    "family finance app",
  ],
  authors: [{ name: "Gndwrk" }],
  creator: "Gndwrk",
  publisher: "Gndwrk",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Gndwrk",
    title: "Gndwrk - Teach Your Kids Real Financial Skills",
    description:
      "The family banking app that builds financial habits from age 6 to 18. 4-bucket system, Trust Score, AI coach, and real debit cards.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gndwrk - Family Banking for Financial Literacy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gndwrk - Family Banking for Financial Literacy",
    description:
      "Teach your kids real financial skills. 4-bucket system, Trust Score, and AI coaching.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// JSON-LD Structured Data
function getJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      // Organization
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "Gndwrk",
        url: baseUrl,
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/logo.png`,
          width: 512,
          height: 512,
        },
        description:
          "Family banking app that teaches kids financial literacy through real money management.",
        foundingDate: "2024",
        sameAs: [
          "https://twitter.com/gndwrk",
          "https://facebook.com/gndwrk",
          "https://instagram.com/gndwrk",
          "https://linkedin.com/company/gndwrk",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@gndwrk.com",
        },
      },
      // Software Application
      {
        "@type": "SoftwareApplication",
        "@id": `${baseUrl}/#app`,
        name: "Gndwrk",
        applicationCategory: "FinanceApplication",
        operatingSystem: "iOS, Android, Web",
        offers: [
          {
            "@type": "Offer",
            name: "Starter",
            price: "0",
            priceCurrency: "USD",
            description: "Free plan with 1 child, 2 buckets, basic features",
          },
          {
            "@type": "Offer",
            name: "Family",
            price: "7.99",
            priceCurrency: "USD",
            description:
              "Up to 5 kids, all 4 buckets, AI coach, loans, full features",
          },
          {
            "@type": "Offer",
            name: "Family+",
            price: "12.99",
            priceCurrency: "USD",
            description:
              "Unlimited kids, investment simulation, premium cards, priority support",
          },
        ],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "2847",
          bestRating: "5",
          worstRating: "1",
        },
        featureList: [
          "4-Bucket Money System (Spend, Save, Give, Invest)",
          "Trust Score (300-850) that converts to real credit benefits",
          "AI Money Coach with age-appropriate guidance",
          "Real debit cards with parent controls",
          "Chore marketplace for earning money",
          "Kid loans to teach about credit and interest",
          "Savings goals with visual progress tracking",
          "Real-time transaction notifications",
        ],
      },
      // Website
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "Gndwrk",
        publisher: { "@id": `${baseUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      // HowTo - Getting Started
      {
        "@type": "HowTo",
        name: "How to Get Started with Gndwrk",
        description:
          "Set up your family banking account in 4 simple steps and start teaching your kids financial literacy.",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Parent Signs Up",
            text: "Create your family account in minutes. Link your bank for easy transfers.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Add Your Kids",
            text: "Create profiles for each child with age-appropriate settings and permissions.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Fund & Configure",
            text: "Set up allowances, bucket splits, and order optional debit cards.",
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: "Watch Them Grow",
            text: "Track progress as they build their Trust Score and learn money skills.",
          },
        ],
      },
    ],
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // JSON-LD structured data - static content, no user input
  const jsonLdString = JSON.stringify(getJsonLd());

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLdString,
            }}
          />
        </head>
        <body
          className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        >
          <ConvexClientProvider>
            <QueryProvider>{children}</QueryProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
