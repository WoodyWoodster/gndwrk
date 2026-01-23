"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";
import { TrustScoreIcon } from "@/components/icons";

// US States for dropdown
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

export default function KYCPage() {
  const router = useRouter();
  const status = useQuery(api.onboarding.getStatus);
  const storePersonalInfo = useMutation(api.onboarding.storePersonalInfo);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [dob, setDob] = useState({ month: "", day: "", year: "" });
  const [ssn, setSsn] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  // Format phone as user types (XXX) XXX-XXXX
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 3) {
      formatted = "(" + digits.slice(0, 3) + ") " + digits.slice(3);
    }
    if (digits.length > 6) {
      formatted = "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6, 10);
    }
    setPhone(formatted);
  };

  // Format SSN as user types (XXX-XX-XXXX)
  const handleSsnChange = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Format with dashes
    let formatted = digits;
    if (digits.length > 3) {
      formatted = digits.slice(0, 3) + "-" + digits.slice(3);
    }
    if (digits.length > 5) {
      formatted = digits.slice(0, 3) + "-" + digits.slice(3, 5) + "-" + digits.slice(5, 9);
    }

    setSsn(formatted);
  };

  const validateForm = (): string | null => {
    // Validate DOB
    const month = parseInt(dob.month);
    const day = parseInt(dob.day);
    const year = parseInt(dob.year);

    if (!month || month < 1 || month > 12) {
      return "Please enter a valid month (1-12)";
    }
    if (!day || day < 1 || day > 31) {
      return "Please enter a valid day (1-31)";
    }
    if (!year || year < 1900 || year > new Date().getFullYear() - 18) {
      return "You must be at least 18 years old";
    }

    // Validate SSN (9 digits)
    const ssnDigits = ssn.replace(/\D/g, "");
    if (ssnDigits.length !== 9) {
      return "Please enter a valid 9-digit SSN";
    }

    // Validate phone (10 digits)
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      return "Please enter a valid 10-digit phone number";
    }

    // Validate address
    if (!address.line1.trim()) {
      return "Please enter your street address";
    }
    if (!address.city.trim()) {
      return "Please enter your city";
    }
    if (!address.state) {
      return "Please select your state";
    }
    if (!address.postalCode.trim() || !/^\d{5}(-\d{4})?$/.test(address.postalCode.trim())) {
      return "Please enter a valid ZIP code";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await storePersonalInfo({
        dateOfBirth: {
          day: parseInt(dob.day),
          month: parseInt(dob.month),
          year: parseInt(dob.year),
        },
        ssn: ssn.replace(/\D/g, ""), // Store digits only
        phone: "+1" + phone.replace(/\D/g, ""), // E.164 format
        address: {
          line1: address.line1.trim(),
          line2: address.line2.trim() || undefined,
          city: address.city.trim(),
          state: address.state,
          postalCode: address.postalCode.trim(),
        },
      });

      router.push("/onboarding/treasury");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save information");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-50 shadow-elevation-2">
          <TrustScoreIcon size={32} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Verify Your Identity</h1>
        <p className="mt-2 text-gray-600">
          We need some information to set up your banking account. This is required by financial regulations.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date of Birth
          </label>
          <div className="mt-1 grid grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="MM"
                maxLength={2}
                value={dob.month}
                onChange={(e) => setDob({ ...dob, month: e.target.value.replace(/\D/g, "") })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={isSubmitting}
              />
              <span className="mt-1 block text-xs text-gray-500 text-center">Month</span>
            </div>
            <div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="DD"
                maxLength={2}
                value={dob.day}
                onChange={(e) => setDob({ ...dob, day: e.target.value.replace(/\D/g, "") })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={isSubmitting}
              />
              <span className="mt-1 block text-xs text-gray-500 text-center">Day</span>
            </div>
            <div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="YYYY"
                maxLength={4}
                value={dob.year}
                onChange={(e) => setDob({ ...dob, year: e.target.value.replace(/\D/g, "") })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={isSubmitting}
              />
              <span className="mt-1 block text-xs text-gray-500 text-center">Year</span>
            </div>
          </div>
        </div>

        {/* SSN */}
        <div>
          <label htmlFor="ssn" className="block text-sm font-medium text-gray-700">
            Social Security Number
          </label>
          <input
            type="text"
            id="ssn"
            inputMode="numeric"
            placeholder="XXX-XX-XXXX"
            value={ssn}
            onChange={(e) => handleSsnChange(e.target.value)}
            maxLength={11}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 font-mono tracking-wider focus:border-primary focus:ring-1 focus:ring-primary"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Required for banking verification. Encrypted and secure.
          </p>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <div className="mt-1 flex">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
              +1
            </span>
            <input
              type="tel"
              id="phone"
              inputMode="numeric"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              maxLength={14}
              className="w-full rounded-r-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Home Address
          </label>

          <input
            type="text"
            placeholder="Street address"
            value={address.line1}
            onChange={(e) => setAddress({ ...address, line1: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            disabled={isSubmitting}
          />

          <input
            type="text"
            placeholder="Apt, suite, unit (optional)"
            value={address.line2}
            onChange={(e) => setAddress({ ...address, line2: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="City"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
              disabled={isSubmitting}
            />

            <select
              value={address.state}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
              disabled={isSubmitting}
            >
              <option value="">State</option>
              {US_STATES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            inputMode="numeric"
            placeholder="ZIP code"
            value={address.postalCode}
            onChange={(e) => setAddress({ ...address, postalCode: e.target.value.replace(/[^\d-]/g, "") })}
            maxLength={10}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary sm:w-1/2"
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </span>
          ) : (
            "Continue"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500">
        Your information is encrypted and securely processed. We never share your SSN.
      </p>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center gap-2">
        <div className="h-2 w-8 rounded-full bg-bucket-spend" />
        <div className="h-2 w-8 rounded-full bg-bucket-save" />
        <div className="h-2 w-8 rounded-full bg-bucket-give" />
        <div className="h-2 w-8 rounded-full bg-bucket-invest" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
