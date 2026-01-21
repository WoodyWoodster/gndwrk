export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatRelativeTime(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffWeek > 0) {
    return diffWeek === 1 ? "1 week ago" : `${diffWeek} weeks ago`;
  }
  if (diffDay > 0) {
    return diffDay === 1 ? "1 day ago" : `${diffDay} days ago`;
  }
  if (diffHr > 0) {
    return diffHr === 1 ? "1 hour ago" : `${diffHr} hours ago`;
  }
  if (diffMin > 0) {
    return diffMin === 1 ? "1 minute ago" : `${diffMin} minutes ago`;
  }
  return "Just now";
}

export function getTrustScoreLabel(score: number): string {
  if (score >= 750) return "Excellent";
  if (score >= 650) return "Good";
  if (score >= 550) return "Building";
  return "New";
}

export function getTrustScoreColor(score: number): string {
  if (score >= 750) return "#10B981"; // Green
  if (score >= 650) return "#4F46E5"; // Indigo
  if (score >= 550) return "#F59E0B"; // Amber
  return "#6B7280"; // Gray
}
