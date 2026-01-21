import { SVGProps } from "react";

type IllustrationProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// Step 1: Parent Signs Up illustration
export function SignUpIllustration({ size = 120, className, ...props }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-label="Parent signing up"
      {...props}
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="55" fill="#F0F7FE" />

      {/* Phone/device */}
      <rect x="35" y="20" width="50" height="80" rx="8" fill="#3080D8" />
      <rect x="38" y="25" width="44" height="65" rx="4" fill="white" />

      {/* Logo on screen */}
      <circle cx="52" cy="45" r="4" fill="#F06050" opacity="0.9" />
      <circle cx="60" cy="45" r="4" fill="#38BDF8" opacity="0.9" />
      <circle cx="52" cy="53" r="4" fill="#A78BFA" opacity="0.9" />
      <circle cx="60" cy="53" r="4" fill="#84CC16" opacity="0.9" />
      <circle cx="56" cy="49" r="2" fill="white" />

      {/* Form fields on screen */}
      <rect x="43" y="62" width="34" height="6" rx="2" fill="#ECEEF0" />
      <rect x="43" y="72" width="34" height="6" rx="2" fill="#ECEEF0" />

      {/* Sign up button */}
      <rect x="43" y="82" width="34" height="8" rx="2" fill="#22C772" />

      {/* Parent figure */}
      <circle cx="95" cy="50" r="10" fill="#3080D8" />
      <path d="M82 85c0-8 6-13 13-13s13 5 13 13" fill="#3080D8" />

      {/* Sparkles */}
      <circle cx="25" cy="35" r="2" fill="#F59315" />
      <circle cx="30" cy="85" r="3" fill="#A78BFA" />
      <circle cx="100" cy="25" r="2" fill="#22C772" />
    </svg>
  );
}

// Step 2: Add Your Kids illustration
export function AddKidsIllustration({ size = 120, className, ...props }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-label="Adding kids to account"
      {...props}
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="55" fill="#EFFDF5" />

      {/* Parent figure (smaller, in back) */}
      <circle cx="30" cy="40" r="12" fill="#3080D8" />
      <path d="M15 75c0-10 7-15 15-15s15 5 15 15" fill="#3080D8" />

      {/* Kid 1 */}
      <circle cx="60" cy="45" r="10" fill="#F59315" />
      <path d="M47 75c0-8 6-13 13-13s13 5 13 13" fill="#F59315" />

      {/* Kid 2 */}
      <circle cx="90" cy="45" r="10" fill="#A78BFA" />
      <path d="M77 75c0-8 6-13 13-13s13 5 13 13" fill="#A78BFA" />

      {/* Plus icons */}
      <circle cx="60" cy="85" r="8" fill="#22C772" />
      <path d="M60 81v8M56 85h8" stroke="white" strokeWidth="2" strokeLinecap="round" />

      {/* Connection lines */}
      <path
        d="M38 50l15 0M75 50l8 0"
        stroke="#D8DDE2"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Age badges */}
      <rect x="50" y="28" width="20" height="10" rx="5" fill="white" stroke="#F59315" strokeWidth="2" />
      <text x="60" y="36" textAnchor="middle" fill="#F59315" fontSize="8" fontWeight="bold">8yr</text>

      <rect x="80" y="28" width="20" height="10" rx="5" fill="white" stroke="#A78BFA" strokeWidth="2" />
      <text x="90" y="36" textAnchor="middle" fill="#A78BFA" fontSize="8" fontWeight="bold">12yr</text>
    </svg>
  );
}

// Step 3: Fund & Configure illustration
export function ConfigureIllustration({ size = 120, className, ...props }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-label="Fund and configure accounts"
      {...props}
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="55" fill="#FEF5F4" />

      {/* Debit card */}
      <g transform="rotate(-10 60 40)">
        <rect x="25" y="25" width="70" height="45" rx="6" fill="#3080D8" />
        <rect x="25" y="38" width="70" height="10" fill="#1E4F8E" />
        <rect x="32" y="52" width="15" height="10" rx="2" fill="#F59315" />

        {/* Logo on card */}
        <circle cx="80" cy="32" r="3" fill="white" opacity="0.8" />
        <circle cx="86" cy="32" r="3" fill="white" opacity="0.6" />
      </g>

      {/* Four buckets */}
      <g transform="translate(15, 70)">
        {/* Spend */}
        <rect x="0" y="5" width="18" height="25" rx="3" fill="#F06050" />
        <rect x="2" y="0" width="14" height="7" rx="2" fill="#D94538" />
        <circle cx="9" cy="17" r="4" fill="#F59315" />

        {/* Save */}
        <rect x="24" y="5" width="18" height="25" rx="3" fill="#38BDF8" />
        <rect x="26" y="0" width="14" height="7" rx="2" fill="#0EA5E9" />
        <circle cx="33" cy="17" r="4" fill="#F59315" />

        {/* Give */}
        <rect x="48" y="5" width="18" height="25" rx="3" fill="#A78BFA" />
        <rect x="50" y="0" width="14" height="7" rx="2" fill="#8B5CF6" />
        <circle cx="57" cy="17" r="4" fill="#F59315" />

        {/* Invest */}
        <rect x="72" y="5" width="18" height="25" rx="3" fill="#84CC16" />
        <rect x="74" y="0" width="14" height="7" rx="2" fill="#65A30D" />
        <circle cx="81" cy="17" r="4" fill="#F59315" />
      </g>

      {/* Money flowing down */}
      <circle cx="50" cy="62" r="3" fill="#F59315" />
      <circle cx="60" cy="58" r="3" fill="#F59315" />
      <circle cx="70" cy="64" r="3" fill="#F59315" />

      {/* Settings gear */}
      <circle cx="100" cy="25" r="10" fill="#6F7E8A" />
      <circle cx="100" cy="25" r="4" fill="white" />
      <g fill="#6F7E8A">
        <rect x="98" y="12" width="4" height="6" rx="1" />
        <rect x="98" y="32" width="4" height="6" rx="1" />
        <rect x="111" y="23" width="6" height="4" rx="1" />
        <rect x="83" y="23" width="6" height="4" rx="1" />
      </g>
    </svg>
  );
}

// Step 4: Watch Them Grow illustration
export function GrowthIllustration({ size = 120, className, ...props }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-label="Watch your kids grow financially"
      {...props}
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="55" fill="#FFFAF0" />

      {/* Trust score chart */}
      <g transform="translate(15, 35)">
        {/* Steps */}
        <rect x="0" y="50" width="18" height="20" fill="#6F7E8A" opacity="0.5" />
        <rect x="22" y="40" width="18" height="30" fill="#38BDF8" />
        <rect x="44" y="28" width="18" height="42" fill="#22C772" />
        <rect x="66" y="15" width="18" height="55" fill="#F59315" />

        {/* Score labels */}
        <text x="9" y="65" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">350</text>
        <text x="31" y="55" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">500</text>
        <text x="53" y="45" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">650</text>
        <text x="75" y="32" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">800</text>
      </g>

      {/* Star at the top */}
      <path
        d="M82 25l2 4.5h5l-4 3.2 1.5 4.8-4.5-3.2-4.5 3.2 1.5-4.8-4-3.2h5L82 25z"
        fill="#F59315"
      />

      {/* Graduation cap */}
      <g transform="translate(85, 55)">
        <rect x="0" y="8" width="24" height="4" fill="#151C24" />
        <path d="M12 0l12 8h-24l12-8z" fill="#151C24" />
        <circle cx="12" cy="8" r="3" fill="#F59315" />
        <path d="M22 10v8" stroke="#151C24" strokeWidth="2" />
        <rect x="20" y="18" width="4" height="6" fill="#F59315" />
      </g>

      {/* Upward arrow */}
      <path
        d="M20 80l8-15 8 15"
        stroke="#22C772"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M28 65v25"
        stroke="#22C772"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Coins floating up */}
      <circle cx="50" cy="95" r="4" fill="#F59315" />
      <circle cx="65" cy="100" r="3" fill="#F59315" />
      <circle cx="42" cy="105" r="3" fill="#F59315" />
    </svg>
  );
}

// Connecting dotted line for step flow
export function StepConnector({ className }: { className?: string }) {
  return (
    <svg
      width="40"
      height="24"
      viewBox="0 0 40 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0 12h40"
        stroke="#D8DDE2"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <path
        d="M32 6l8 6-8 6"
        stroke="#D8DDE2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
