"use client";

import { useState } from "react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "getting-started" | "security" | "pricing" | "features";
}

const faqItems: FAQItem[] = [
  // Getting Started
  {
    id: "1",
    question: "What age range is Gndwrk designed for?",
    answer:
      "Gndwrk is designed for children ages 6 to 18. The app automatically adjusts its interface, language, and financial concepts based on your child's age. Younger kids (6-10) see simplified visuals and basic savings concepts, while teens (13-18) can explore more advanced features like loans, investing simulations, and credit-building behaviors.",
    category: "getting-started",
  },
  {
    id: "2",
    question: "How do I get started with Gndwrk?",
    answer:
      "Getting started takes just 3 minutes. First, create your parent account and verify your identity. Then, add your children's profiles with their names, ages, and photos. Finally, fund their accounts and set up automatic allowances. Each child will receive their own login and can optionally get a physical debit card delivered in 5-7 days.",
    category: "getting-started",
  },
  {
    id: "3",
    question: "What is the 4-bucket money system?",
    answer:
      "The 4-bucket system divides every dollar your child receives into four purpose-driven accounts: Spend (for everyday purchases), Save (for short-term goals), Give (for charitable donations), and Invest (for learning about long-term wealth building). This proven framework teaches kids to think intentionally about every dollar, not just spend it all. You can customize the default split—many families start with 50% Spend, 30% Save, 10% Give, and 10% Invest.",
    category: "getting-started",
  },

  // Security & Privacy
  {
    id: "4",
    question: "Is my family's money safe with Gndwrk?",
    answer:
      "Yes, absolutely. All funds are held at our FDIC-insured partner bank, meaning deposits up to $250,000 are federally protected. We use bank-level 256-bit encryption for all data transmission, and our systems are SOC 2 Type II certified. Kids' spending is protected by real-time parent controls, instant notifications, and the ability to freeze cards instantly from your phone.",
    category: "security",
  },
  {
    id: "5",
    question: "What data do you collect about my children?",
    answer:
      "We collect only what's necessary to provide our service: basic profile information (name, age, parent-provided email), transaction history, and app usage patterns to improve our AI coaching. We never sell your data or show ads to children. All data is encrypted, and you can request complete deletion at any time. We're fully COPPA compliant for children's privacy protection.",
    category: "security",
  },
  {
    id: "6",
    question: "Can I control where my kids spend money?",
    answer:
      "Yes, you have full control. Set spending limits (daily, weekly, or monthly), block specific merchant categories (like gambling or adult content), require approval for purchases over a certain amount, and receive instant notifications for every transaction. You can also instantly freeze any card from your parent dashboard if a card is lost or misused.",
    category: "security",
  },

  // Pricing
  {
    id: "7",
    question: "Is Gndwrk really free to start?",
    answer:
      "Yes, our Starter plan is completely free with no credit card required. It includes one child account, two buckets (Spend and Save), basic chore tracking, and a debit card ($5 shipping). Paid plans unlock additional children, all four buckets, the AI Money Coach, kid loans, and premium features. All paid plans include a 14-day free trial.",
    category: "pricing",
  },
  {
    id: "8",
    question: "Are there any hidden fees?",
    answer:
      "No hidden fees, ever. Your subscription includes everything—unlimited transfers between family members, free ATM withdrawals at 55,000+ locations, free card replacements (first per year), and no overdraft fees (cards simply decline if there's not enough balance). The only additional costs are optional expedited card shipping and premium card designs.",
    category: "pricing",
  },
  {
    id: "9",
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription at any time with no cancellation fees. Your account will remain active until the end of your billing period. After cancellation, you can continue using the free Starter features, or withdraw all funds via bank transfer. We'll retain your data for 30 days in case you want to reactivate.",
    category: "pricing",
  },

  // Features
  {
    id: "10",
    question: "What is the Trust Score and how does it work?",
    answer:
      "The Trust Score is like a 'credit score for kids' ranging from 300 to 850. It's built through positive financial behaviors: completing chores on time, saving consistently, paying back loans, sticking to budgets, and giving to causes. When your child turns 18, their Trust Score history can help them qualify for real banking benefits like better interest rates and higher credit limits through our partner institutions.",
    category: "features",
  },
  {
    id: "11",
    question: "How does the AI Money Coach work?",
    answer:
      "Our AI Money Coach is a friendly, age-appropriate assistant that helps kids understand money concepts. It can explain why saving matters, help set and track goals, suggest ways to earn extra money, and answer financial questions in kid-friendly language. For younger children, it uses simple analogies and visuals. For teens, it discusses more sophisticated concepts like compound interest and investing basics. Parents can review all conversations.",
    category: "features",
  },
  {
    id: "12",
    question: "Can kids really take out loans from parents?",
    answer:
      "Yes! Kid Loans are a powerful teaching tool. Parents can offer loans for larger purchases (like a gaming console or bike). Kids learn to understand interest rates, make regular payments, and experience the consequences of borrowing—all in a safe, family environment. On-time payments boost their Trust Score, while missed payments provide valuable lessons without real-world credit damage.",
    category: "features",
  },
];

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200">
      <button
        className="flex w-full items-center justify-between py-5 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="pr-4 text-lg font-medium text-gray-900">
          {item.question}
        </span>
        <span
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-gray-600 leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openId, setOpenId] = useState<string | null>("1");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "getting-started", label: "Getting Started" },
    { id: "security", label: "Security & Privacy" },
    { id: "pricing", label: "Pricing" },
    { id: "features", label: "Features" },
  ];

  const filteredItems =
    activeCategory === "all"
      ? faqItems
      : faqItems.filter((item) => item.category === activeCategory);

  return (
    <section id="faq" className="bg-white py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Everything you need to know about teaching your kids financial
            literacy with Gndwrk.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === category.id
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="mx-auto mt-10 max-w-3xl">
          {filteredItems.map((item) => (
            <AccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Still have questions?{" "}
            <a
              href="mailto:support@gndwrk.com"
              className="font-medium text-primary hover:text-primary-600"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

// Export FAQ data for Schema.org JSON-LD
export function getFAQSchemaData() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
