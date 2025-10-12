// Corrected relative imports for Firebase helpers
import { getReviewsByRestaurantId } from "../../lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "../../lib/firebase/serverApp";

// Standard Firebase and utility imports
import { getFirestore } from "firebase/firestore";

// --- Gemini API Configuration (Replaces Genkit) ---
// Initialize API key as empty string for Canvas environment auto-injection
const apiKey = "";
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

/**
 * Generates a one-sentence summary of all restaurant reviews using the Gemini API.
 * Runs on the server side using the authenticated user.
 */
export async function GeminiSummary({ restaurantId }) {
  // 1. Fetch authenticated app and reviews
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  const reviews = await getReviewsByRestaurantId(
    getFirestore(firebaseServerApp),
    restaurantId
  );

  // 2. Construct the prompt for the model
  const reviewSeparator = "@";
  const prompt = `
    Based on the following restaurant reviews, 
    where each review is separated by a '${reviewSeparator}' character, 
    create a concise, one-sentence summary of what people think of the restaurant. 

    Here are the reviews: ${reviews.map((review) => review.text).join(reviewSeparator)}
  `;

  try {
    // 3. Prepare payload for the Gemini API call
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      // Use system instruction to enforce the one-sentence rule
      systemInstruction: {
        parts: [{ text: "Act as a concise summarization engine. Always return a single, clear sentence." }]
      },
    };

    // 4. Call the Gemini API directly (Replaces genkit.ai.generate)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    const candidate = result.candidates?.[0];

    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error("Gemini API returned an invalid response structure.");
    }
    
    const text = candidate.content.parts[0].text;

    // 5. Return the result in JSX
    return (
      <div className="restaurant__review_summary bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-400 mt-4">
        <p className="text-gray-800 font-medium italic">{text}</p>
        <p className="text-xs text-right text-gray-500 mt-2 font-semibold">✨ Summarized with Gemini</p>
      </div>
    );
  } catch (e) {
    // 6. Handle errors
    console.error("Error summarizing reviews with Gemini API:", e);
    return <p className="text-sm text-red-500 p-4 bg-red-50 rounded-lg border border-red-200 mt-4">Error summarizing reviews.</p>;
  }
}

/**
 * Returns a simple loading state skeleton for the summary.
 */
export function GeminiSummarySkeleton() {
  return (
    <div className="restaurant__review_summary bg-gray-100 p-4 rounded-lg border-l-4 border-gray-300 shadow-sm mt-4 animate-pulse">
      <div className="h-4 bg-gray-300 w-3/4 rounded mb-2"></div>
      <p className="text-xs font-semibold mt-4 text-gray-500">
        ✨ Summarizing reviews with Gemini...
      </p>
    </div>
  );
}
