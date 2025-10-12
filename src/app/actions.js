// Tell Next.js this file uses server-only features (server actions, not for the browser)
"use server";

// Import the function to add a review to a restaurant in Firestore
import { addReviewToRestaurant } from "@/src/lib/firebase/firestore.js";

// Import a helper that initializes a Firebase app with authenticated user context (e.g., session-based)
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";

// Import Firestore to interact with Firestore database
import { getFirestore } from "firebase/firestore";

// -----------------------------------------------------------------------------
// Exported Server Action: handleReviewFormSubmission
// -----------------------------------------------------------------------------

// This is a Next.js Server Action (alpha feature — use with caution).
// Docs: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
export async function handleReviewFormSubmission(data) {
  // Get the authenticated Firebase app instance for the current user (e.g., via cookies/session)
  const { app } = await getAuthenticatedAppForUser();

  // Get a Firestore instance using the authenticated app
  const db = getFirestore(app);

  // Call helper function to add the review to the Firestore restaurant document
  await addReviewToRestaurant(db, data.get("restaurantId"), {
    text: data.get("text"),         // Get review text from form data
    rating: data.get("rating"),     // Get numerical rating (e.g., "5")

    userId: data.get("userId"),     // Get user ID from a hidden input field in the form
  });
}
