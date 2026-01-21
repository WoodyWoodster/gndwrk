import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// Brand LogoMark - Four overlapping circles forming abstract "G"
export function LogoMark({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Gndwrk logo"
      {...props}
    >
      <circle cx="9" cy="9" r="5" fill="#F06050" opacity="0.9" />
      <circle cx="15" cy="9" r="5" fill="#38BDF8" opacity="0.9" />
      <circle cx="9" cy="15" r="5" fill="#A78BFA" opacity="0.9" />
      <circle cx="15" cy="15" r="5" fill="#84CC16" opacity="0.9" />
      <circle cx="12" cy="12" r="2" fill="white" />
    </svg>
  );
}

// Four-bucket system icon
export function BucketIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Four buckets"
      {...props}
    >
      {/* Spend bucket */}
      <path
        d="M2 8h4v10a1 1 0 01-1 1H3a1 1 0 01-1-1V8z"
        fill="#F06050"
      />
      <path d="M2 8l0.5-2a1 1 0 011-1h1a1 1 0 011 1l0.5 2" stroke="#D94538" strokeWidth="0.5" />

      {/* Save bucket */}
      <path
        d="M7 8h4v10a1 1 0 01-1 1H8a1 1 0 01-1-1V8z"
        fill="#38BDF8"
      />
      <path d="M7 8l0.5-2a1 1 0 011-1h1a1 1 0 011 1l0.5 2" stroke="#0EA5E9" strokeWidth="0.5" />

      {/* Give bucket */}
      <path
        d="M12 8h4v10a1 1 0 01-1 1h-2a1 1 0 01-1-1V8z"
        fill="#A78BFA"
      />
      <path d="M12 8l0.5-2a1 1 0 011-1h1a1 1 0 011 1l0.5 2" stroke="#8B5CF6" strokeWidth="0.5" />

      {/* Invest bucket */}
      <path
        d="M17 8h4v10a1 1 0 01-1 1h-2a1 1 0 01-1-1V8z"
        fill="#84CC16"
      />
      <path d="M17 8l0.5-2a1 1 0 011-1h1a1 1 0 011 1l0.5 2" stroke="#65A30D" strokeWidth="0.5" />

      {/* Coins flowing */}
      <circle cx="4" cy="11" r="1" fill="#F59315" />
      <circle cx="9" cy="12" r="1" fill="#F59315" />
      <circle cx="14" cy="11" r="1" fill="#F59315" />
      <circle cx="19" cy="12" r="1" fill="#F59315" />
    </svg>
  );
}

// Trust Score icon - ascending steps with star
export function TrustScoreIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Trust score"
      {...props}
    >
      {/* Ascending steps */}
      <path
        d="M3 20h4v-4H3v4z"
        fill="#6F7E8A"
      />
      <path
        d="M8 20h4v-7H8v7z"
        fill="#38BDF8"
      />
      <path
        d="M13 20h4v-10h-4v10z"
        fill="#22C772"
      />
      <path
        d="M18 20h4V7h-4v13z"
        fill="#F59315"
      />
      {/* Star at peak */}
      <path
        d="M20 4l0.5 1.1h1.2l-1 0.8 0.4 1.1-1.1-0.7-1.1 0.7 0.4-1.1-1-0.8h1.2L20 4z"
        fill="#F59315"
      />
    </svg>
  );
}

// AI Coach icon - friendly robot with speech bubble
export function CoachIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="AI money coach"
      {...props}
    >
      {/* Robot head */}
      <rect x="5" y="6" width="11" height="12" rx="3" fill="#3080D8" />
      {/* Eyes */}
      <circle cx="8" cy="11" r="1.5" fill="white" />
      <circle cx="13" cy="11" r="1.5" fill="white" />
      <circle cx="8.5" cy="11" r="0.5" fill="#151C24" />
      <circle cx="13.5" cy="11" r="0.5" fill="#151C24" />
      {/* Smile */}
      <path
        d="M8 15c1.5 1 3.5 1 5 0"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Antenna */}
      <line x1="10.5" y1="6" x2="10.5" y2="3" stroke="#3080D8" strokeWidth="1.5" />
      <circle cx="10.5" cy="2.5" r="1.5" fill="#F59315" />
      {/* Speech bubble */}
      <path
        d="M17 5h5a1 1 0 011 1v4a1 1 0 01-1 1h-1l-1.5 2-0.5-2H17a1 1 0 01-1-1V6a1 1 0 011-1z"
        fill="#22C772"
      />
      <circle cx="18.5" cy="8" r="0.5" fill="white" />
      <circle cx="20" cy="8" r="0.5" fill="white" />
      <circle cx="21.5" cy="8" r="0.5" fill="white" />
    </svg>
  );
}

// Chore icon - clipboard with checkmark and coin
export function ChoreIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Chore marketplace"
      {...props}
    >
      {/* Clipboard */}
      <rect x="4" y="4" width="13" height="17" rx="2" fill="#F06050" />
      <rect x="7" y="2" width="6" height="4" rx="1" fill="#D94538" />
      {/* Checklist lines */}
      <rect x="7" y="9" width="7" height="1.5" rx="0.5" fill="white" opacity="0.7" />
      <rect x="7" y="13" width="5" height="1.5" rx="0.5" fill="white" opacity="0.7" />
      {/* Checkmark */}
      <path
        d="M7 17l2 2 4-4"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Coin */}
      <circle cx="18" cy="17" r="4" fill="#F59315" />
      <text x="18" y="19" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">$</text>
    </svg>
  );
}

// Loan icon - two hands exchanging with return arrow
export function LoanIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Kid loans"
      {...props}
    >
      {/* Coin being exchanged */}
      <circle cx="12" cy="10" r="4" fill="#F59315" />
      <text x="12" y="12" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">$</text>

      {/* Left hand (parent) */}
      <path
        d="M3 12c0-1 1-2 2-2h2l1 2v4H4c-1 0-1-1-1-1v-3z"
        fill="#3080D8"
      />

      {/* Right hand (child) */}
      <path
        d="M21 12c0-1-1-2-2-2h-2l-1 2v4h4c1 0 1-1 1-1v-3z"
        fill="#22C772"
      />

      {/* Return arrow (dotted) */}
      <path
        d="M8 18c2 2 6 2 8 0"
        stroke="#6F7E8A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
      <path
        d="M17 17l-1 2 2 0"
        stroke="#6F7E8A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Card icon - debit card with family silhouettes
export function CardIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Debit cards"
      {...props}
    >
      {/* Card */}
      <rect x="2" y="5" width="20" height="14" rx="2" fill="#3080D8" />
      {/* Magnetic stripe */}
      <rect x="2" y="9" width="20" height="3" fill="#1E4F8E" />
      {/* Chip */}
      <rect x="5" y="13" width="4" height="3" rx="0.5" fill="#F59315" />
      {/* Parent silhouette */}
      <circle cx="16" cy="14" r="1.5" fill="white" opacity="0.8" />
      <path d="M14 18c0-1.5 1-2 2-2s2 0.5 2 2" fill="white" opacity="0.8" />
      {/* Child silhouette */}
      <circle cx="19" cy="15" r="1" fill="white" opacity="0.6" />
      <path d="M17.5 18c0-1 0.75-1.5 1.5-1.5s1.5 0.5 1.5 1.5" fill="white" opacity="0.6" />
    </svg>
  );
}

// Family icon - abstract family of 3-4 figures
export function FamilyIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Family"
      {...props}
    >
      {/* Parent 1 */}
      <circle cx="6" cy="6" r="3" fill="#3080D8" />
      <path d="M2 18c0-3 2-5 4-5s4 2 4 5" fill="#3080D8" />

      {/* Parent 2 */}
      <circle cx="18" cy="6" r="3" fill="#22C772" />
      <path d="M14 18c0-3 2-5 4-5s4 2 4 5" fill="#22C772" />

      {/* Child 1 */}
      <circle cx="10" cy="10" r="2" fill="#F59315" />
      <path d="M7 20c0-2 1.5-3 3-3s3 1 3 3" fill="#F59315" />

      {/* Child 2 */}
      <circle cx="14" cy="10" r="2" fill="#A78BFA" />
      <path d="M11 20c0-2 1.5-3 3-3s3 1 3 3" fill="#A78BFA" />
    </svg>
  );
}

// Growth icon - seedling becoming tree with coins as leaves
export function GrowthIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Financial growth"
      {...props}
    >
      {/* Ground */}
      <path
        d="M2 20h20"
        stroke="#84CC16"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Trunk */}
      <path
        d="M12 20v-10"
        stroke="#65A30D"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Branches */}
      <path d="M12 14l-3-3" stroke="#65A30D" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 14l3-3" stroke="#65A30D" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 10l-4-2" stroke="#65A30D" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 10l4-2" stroke="#65A30D" strokeWidth="1.5" strokeLinecap="round" />

      {/* Coin leaves */}
      <circle cx="9" cy="11" r="2" fill="#F59315" />
      <circle cx="15" cy="11" r="2" fill="#F59315" />
      <circle cx="8" cy="8" r="2" fill="#F59315" />
      <circle cx="16" cy="8" r="2" fill="#F59315" />
      <circle cx="12" cy="5" r="2.5" fill="#F59315" />

      {/* Dollar signs on coins */}
      <text x="12" y="6.5" textAnchor="middle" fill="white" fontSize="3" fontWeight="bold">$</text>
    </svg>
  );
}

// Check icon for pricing features
export function CheckIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Included"
      {...props}
    >
      <circle cx="12" cy="12" r="10" fill="#22C772" />
      <path
        d="M8 12l3 3 5-6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Star icon for highlighting recommended plan
export function StarIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Recommended"
      {...props}
    >
      <path
        d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6L12 2z"
        fill="#F59315"
      />
    </svg>
  );
}
