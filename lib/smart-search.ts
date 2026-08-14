/**
 * Smart Natural Language Search Engine for Kynisto.
 * Understands conversational queries, Hinglish phrases, price constraints, distance limits, and ratings.
 */

export interface ParsedSearchIntent {
  rawQuery: string;
  cleanedTokens: string[];
  categoryHints: string[];
  maxPrice?: number;
  minPrice?: number;
  maxDistanceKm?: number;
  minRating?: number;
  openNow?: boolean;
  sortBy?: "nearest" | "rated" | "newest" | "relevance";
  isConversational: boolean;
}

// Common Hinglish and conversational stop words that shouldn't pollute search terms
const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "for", "with", "from", "of", "and", "or",
  "is", "are", "me", "my", "near", "nearby", "to", "so", "as", "well", "like",
  "i", "want", "need", "looking", "find", "shop", "store", "place", "best", "good",
  "meri", "mera", "mere", "ko", "ki", "ke", "ka", "hai", "ho", "gayi", "gaya",
  "chahiye", "karna", "theek", "kharab", "paas", "wala", "wali", "wale", "kahan",
  "kisi", "batao", "dikhao", "recommend", "recomended", "please"
]);

// Semantic keyword dictionary to map intents to categories & subcategories
const SEMANTIC_INTENT_MAP: Record<string, { categories: string[]; synonyms: string[] }> = {
  cycle: {
    categories: ["Automobile & Mechanics", "Retail & Hardware", "Local Services"],
    synonyms: ["cycle", "bicycle", "cycle repair", "puncture", "panchar", "brake", "gear", "chain", "tube", "tyre", "pedal"]
  },
  food: {
    categories: ["Restaurants & Dining", "Cafes & Bakeries", "Street Food", "Food & Grocery"],
    synonyms: ["restaurant", "resturanent", "cafe", "dhaba", "food", "khana", "dishes", "dish", "meal", "biryani", "pizza", "burger", "roti", "chai", "coffee", "sweet", "mithai", "snack", "dinner", "lunch"]
  },
  doctor: {
    categories: ["Healthcare", "Clinics & Doctors", "Pharmacies & Chemist", "Diagnostics & Lab"],
    synonyms: ["doctor", "clinic", "hospital", "dispensary", "physician", "pediatrician", "dentist", "eye", "dawa", "dawai", "medicine", "chemist", "pharmacy", "medical", "checkup", "consultation", "treatment"]
  },
  salon: {
    categories: ["Salon & Spa", "Personal Care & Grooming"],
    synonyms: ["salon", "parlour", "beauty", "haircut", "barber", "spa", "facial", "makeup", "shave", "grooming"]
  },
  repair: {
    categories: ["Home Services", "Electrician", "Plumber", "Appliance Repair"],
    synonyms: ["electrician", "plumber", "carpenter", "ac repair", "wiring", "fan", "motor", "water", "cooler", "fridge", "tv", "repair", "service"]
  },
  grocery: {
    categories: ["Kirana & General Store", "Vegetables & Fruits", "Supermarket"],
    synonyms: ["kirana", "ration", "grocery", "sabzi", "vegetable", "fruit", "milk", "dairy", "atta", "oil", "rice"]
  },
  clothing: {
    categories: ["Clothing & Fashion", "Tailor & Boutique"],
    synonyms: ["clothes", "kapde", "shirt", "pant", "suit", "saree", "tailor", "boutique", "fashion", "garment"]
  }
};

/**
 * Parses a user query to extract structured intent, filters, and semantic search terms.
 */
export function parseSearchIntent(rawQuery: string): ParsedSearchIntent {
  const query = rawQuery.trim().toLowerCase();
  let text = query;

  let maxPrice: number | undefined;
  let minPrice: number | undefined;
  let maxDistanceKm: number | undefined;
  let minRating: number | undefined;
  let openNow = false;
  let sortBy: "nearest" | "rated" | "newest" | "relevance" = "relevance";

  // 1. Extract Price Filters (e.g. "under 50rs", "below 100", "starts from 99", "less than ₹200")
  const underPriceMatch = text.match(/(?:under|below|less than|upto|cost under|under rs\.?|under ₹)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i) ||
                          text.match(/(?:rs\.?|inr|₹)\s*(\d+)\s*(?:under|below|less than|upto)/i);
  if (underPriceMatch) {
    maxPrice = Number(underPriceMatch[1]);
    text = text.replace(underPriceMatch[0], " ");
  }

  const startPriceMatch = text.match(/(?:starts? from|from|starting at|starting from|above|minimum)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  if (startPriceMatch) {
    minPrice = Number(startPriceMatch[1]);
    text = text.replace(startPriceMatch[0], " ");
  }

  // 2. Extract Distance Filters (e.g. "within 1 km", "under 2km", "in 500m")
  const distanceMatch = text.match(/(?:within|under|in|around|upto)\s*(\d+(?:\.\d+)?)\s*(?:km|kms|kilometer|kilometers)/i);
  if (distanceMatch) {
    maxDistanceKm = Number(distanceMatch[1]);
    text = text.replace(distanceMatch[0], " ");
  } else {
    const meterMatch = text.match(/(?:within|under|in|around|upto)\s*(\d+)\s*(?:m|meter|meters)/i);
    if (meterMatch) {
      maxDistanceKm = Number(meterMatch[1]) / 1000;
      text = text.replace(meterMatch[0], " ");
    }
  }

  // Check for "near me", "nearby", "paas me"
  if (/(?:near me|nearby|paas me|paas|close to me|aas paas)/i.test(text)) {
    sortBy = "nearest";
    text = text.replace(/(?:near me|nearby|paas me|paas|close to me|aas paas)/ig, " ");
  }

  // 3. Extract Rating Filters (e.g. "5 star", "4.5 star rating", "top rated", "highly recommended")
  const ratingMatch = text.match(/(\d(?:\.\d)?)\s*(?:star|stars|\*)\s*(?:rating)?/i);
  if (ratingMatch) {
    minRating = Number(ratingMatch[1]);
    sortBy = "rated";
    text = text.replace(ratingMatch[0], " ");
  } else if (/(?:top rated|best rated|highest rated|5 star|highly recommended|top)/i.test(text)) {
    minRating = 4.0;
    sortBy = "rated";
    text = text.replace(/(?:top rated|best rated|highest rated|5 star|highly recommended)/ig, " ");
  }

  // 4. Open Now Filter (e.g. "open now", "khula hai")
  if (/(?:open now|khula hai|open today)/i.test(text)) {
    openNow = true;
    text = text.replace(/(?:open now|khula hai|open today)/ig, " ");
  }

  // 5. Clean and tokenize remaining words
  const rawTokens = text.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const cleanedTokens: string[] = [];
  const categoryHints: string[] = [];

  for (const token of rawTokens) {
    // Check if token matches semantic dictionary
    for (const [intentKey, data] of Object.entries(SEMANTIC_INTENT_MAP)) {
      if (data.synonyms.includes(token) || intentKey === token) {
        data.categories.forEach((cat) => {
          if (!categoryHints.includes(cat)) categoryHints.push(cat);
        });
        if (!cleanedTokens.includes(token)) cleanedTokens.push(token);
      }
    }

    if (!STOP_WORDS.has(token) && token.length > 1) {
      if (!cleanedTokens.includes(token)) {
        cleanedTokens.push(token);
      }
    }
  }

  const isConversational = rawTokens.length >= 3 || Boolean(maxPrice || maxDistanceKm || minRating);

  return {
    rawQuery,
    cleanedTokens: cleanedTokens.length > 0 ? cleanedTokens : rawTokens,
    categoryHints,
    maxPrice,
    minPrice,
    maxDistanceKm,
    minRating,
    openNow,
    sortBy,
    isConversational,
  };
}
