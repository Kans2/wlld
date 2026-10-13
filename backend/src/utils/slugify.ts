/**
 * Generates a URL-friendly, unique slug from a string.
 * Example: "Nike Summer Reel Challenge" -> "nike-summer-reel-challenge-a8f2k"
 */
export const generateSlug = (text: string): string => {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric except spaces and dashes
    .replace(/[\s_-]+/g, '-')    // collapse consecutive spaces/dashes to a single dash
    .replace(/^-+|-+$/g, '');    // trim leading/trailing dashes

  // Append a short 5-character alphanumeric random string for guaranteed uniqueness
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base || 'campaign'}-${suffix}`;
};
