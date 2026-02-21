/**
 * Score Normalization Utilities
 * 
 * Ensures all credibility scores are displayed consistently in 0-100% range.
 * Handles both 0-1 decimal scores and 0-100 percentage scores.
 */

/**
 * Normalize a score to 0-100 percentage range
 * Handles both 0-1 decimal scores and 0-100 percentage scores
 * 
 * @param score - The score to normalize (can be null or undefined)
 * @returns Normalized score in 0-100 range
 * 
 * @example
 * normalizeScore(0.75) // returns 75
 * normalizeScore(85) // returns 85
 * normalizeScore(null) // returns 50
 * normalizeScore(1.5) // returns 100 (clamped)
 */
export function normalizeScore(score: number | null | undefined): number {
  // Default to 50% for missing scores
  if (score == null) {
    return 50;
  }
  
  // If score is already in percentage range (> 1), return as-is (clamped to 0-100)
  if (score > 1) {
    return Math.min(100, Math.max(0, score));
  }
  
  // If score is in 0-1 range, convert to percentage (clamped to 0-100)
  return Math.min(100, Math.max(0, score * 100));
}

/**
 * Format a score for display with consistent precision
 * 
 * @param score - The score to format (can be null or undefined)
 * @param decimals - Number of decimal places to display (default: 0)
 * @returns Formatted score string with percentage symbol
 * 
 * @example
 * formatScore(0.75) // returns "75%"
 * formatScore(0.756, 1) // returns "75.6%"
 * formatScore(85) // returns "85%"
 * formatScore(null) // returns "50%"
 */
export function formatScore(score: number | null | undefined, decimals: number = 0): string {
  const normalized = normalizeScore(score);
  return `${normalized.toFixed(decimals)}%`;
}
