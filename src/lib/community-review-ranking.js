const reviewCategories = new Set(["Community", "Photography", "Events", "Talent"]);

export function getCommunityReviewPriority(pathname) {
  if (pathname === "/creators/ifi" || pathname.startsWith("/creators/ifi/")) return "Talent";
  if (pathname.toLowerCase().includes("photograph")) return "Photography";
  return "";
}

function reviewAgeInDays(review, now) {
  const createdAt = new Date(review.createdAt || review.created_at).getTime();
  return Number.isFinite(createdAt) ? Math.max(0, (now - createdAt) / 86_400_000) : Infinity;
}

export function rankCommunityReviews(reviews, {
  priorityCategory = "",
  preferredCategory = "",
  now = Date.now()
} = {}) {
  const priority = reviewCategories.has(priorityCategory) ? priorityCategory : "";
  const preferred = reviewCategories.has(preferredCategory) ? preferredCategory : "";

  return [...reviews].sort((first, second) => {
    if (priority && first.category !== second.category) {
      if (first.category === priority) return -1;
      if (second.category === priority) return 1;
    }
    if (!priority && preferred && first.category !== second.category) {
      if (first.category === preferred) return -1;
      if (second.category === preferred) return 1;
    }

    const firstAge = reviewAgeInDays(first, now);
    const secondAge = reviewAgeInDays(second, now);
    const firstScore = first.likes + 24 / (firstAge + 1);
    const secondScore = second.likes + 24 / (secondAge + 1);
    return secondScore - firstScore
      || firstAge - secondAge
      || second.likes - first.likes;
  });
}
