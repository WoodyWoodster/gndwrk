"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  quote: string;
  kidAge: string;
  highlight?: string;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah M.",
    role: "Mom of 3",
    location: "Austin, TX",
    avatar: "/testimonials/sarah.jpg",
    quote:
      "My kids finally understand why we can't buy everything they want. The 4-bucket system made saving feel like a game, not a chore. My 10-year-old saved up for a Nintendo Switch entirely on his own!",
    kidAge: "Ages 8, 10 & 13",
    highlight: "Saved $350 in 4 months",
  },
  {
    id: "2",
    name: "Marcus J.",
    role: "Dad of 2",
    location: "Denver, CO",
    avatar: "/testimonials/marcus.jpg",
    quote:
      "The Trust Score concept is brilliant. My daughter is now obsessed with keeping her score high. She actually ASKS for chores now. Never thought I'd see the day.",
    kidAge: "Ages 11 & 14",
    highlight: "Trust Score: 742",
  },
  {
    id: "3",
    name: "Jennifer L.",
    role: "Mom of 2",
    location: "Seattle, WA",
    avatar: "/testimonials/jennifer.jpg",
    quote:
      "We tried three other family banking apps before Gndwrk. This is the only one that actually teaches financial concepts instead of just being a digital piggy bank. The AI coach answers their questions better than I can!",
    kidAge: "Ages 9 & 12",
    highlight: "Daily user for 8 months",
  },
  {
    id: "4",
    name: "David & Michelle K.",
    role: "Parents",
    location: "Chicago, IL",
    avatar: "/testimonials/david.jpg",
    quote:
      "Our son took out his first 'loan' from us to buy a skateboard. Watching him make weekly payments and learn about interest at age 12 was priceless. He's more financially aware than most adults I know.",
    kidAge: "Age 12",
    highlight: "First loan paid off early",
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-elevation-2">
      {/* Quote icon */}
      <div className="absolute -top-3 left-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </span>
      </div>

      {/* Quote */}
      <blockquote className="mt-4 flex-1 text-gray-700">
        "{testimonial.quote}"
      </blockquote>

      {/* Highlight badge */}
      {testimonial.highlight && (
        <div className="mt-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-50 px-3 py-1 text-sm font-medium text-secondary-700">
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {testimonial.highlight}
          </span>
        </div>
      )}

      {/* Author */}
      <div className="mt-6 flex items-center gap-4 border-t border-gray-100 pt-4">
        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-primary-100 to-secondary-100">
          {/* Placeholder avatar with initials */}
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-primary">
            {testimonial.name.split(" ").map((n) => n[0]).join("")}
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-900">{testimonial.name}</div>
          <div className="text-sm text-gray-500">
            {testimonial.role} · {testimonial.kidAge}
          </div>
          <div className="text-sm text-gray-400">{testimonial.location}</div>
        </div>
      </div>
    </div>
  );
}

function AnimatedCounter({
  end,
  duration = 2000,
  suffix = "",
  prefix = "",
}: {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            const startTime = Date.now();
            const animate = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // Ease out cubic
              const eased = 1 - Math.pow(1 - progress, 3);
              setCount(Math.floor(eased * end));

              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };
            animate();
          }
        });
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("trust-counter-section");
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function TrustCounter() {
  return (
    <div
      id="trust-counter-section"
      className="flex flex-wrap justify-center gap-8 md:gap-16"
    >
      <div className="text-center">
        <div className="text-4xl font-bold text-primary md:text-5xl">
          <AnimatedCounter end={12847} suffix="+" />
        </div>
        <div className="mt-2 text-gray-600">Families Trust Us</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-secondary md:text-5xl">
          <AnimatedCounter end={2} suffix="M+" prefix="$" />
        </div>
        <div className="mt-2 text-gray-600">Saved by Kids</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-accent md:text-5xl">
          <AnimatedCounter end={47293} suffix="+" />
        </div>
        <div className="mt-2 text-gray-600">Chores Completed</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-bucket-give md:text-5xl">
          <AnimatedCounter end={89} suffix="%" />
        </div>
        <div className="mt-2 text-gray-600">Parent Satisfaction</div>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary-50 px-4 py-2 text-sm font-medium text-secondary-700">
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Trusted by Families Nationwide
          </span>
          <h2 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Real Families. Real Results.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Join thousands of parents who are raising financially confident
            kids. Here's what they have to say.
          </p>
        </div>

        {/* Trust Counter */}
        <div className="mt-12">
          <TrustCounter />
        </div>

        {/* Testimonials Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>

        {/* Mini testimonials row */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-medium text-gray-900">
              "Finally, an app that works!"
            </span>
            <span className="text-sm text-gray-500">— Emily R.</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-medium text-gray-900">
              "My kids love the AI coach"
            </span>
            <span className="text-sm text-gray-500">— James T.</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-medium text-gray-900">
              "Best investment in their future"
            </span>
            <span className="text-sm text-gray-500">— Priya S.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
