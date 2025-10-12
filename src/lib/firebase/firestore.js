// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------

// Import required Firestore functions from Firebase SDK
import {
  collection,    // Allows access to a Firestore collection
  onSnapshot,    // Sets up real-time listeners to Firestore collections/documents
  query,         // Creates query instances with filters and sort options
  getDocs,       // Fetches documents from Firestore based on a query
  where,         // Adds filter conditions to a query
  orderBy,       // Sorts query results based on a field
  Timestamp,     // Creates Firestore-compatible timestamp values
  doc,           // Gets a reference to a single Firestore document
  runTransaction // Runs multiple Firestore reads/writes atomically
} from "firebase/firestore";

// Import the initialized Firestore client instance
import { db } from "@/src/lib/firebase/clientApp"; // Your app’s Firestore client instance

// -----------------------------------------------------------------------------
// Helper Function: Apply Filters
// -----------------------------------------------------------------------------

// Filters a Firestore query with optional filters for category, city, price, and sort
function applyQueryFilters(q, { category, city, price, sort }) {
  // Filter by category if provided
  if (category) {
    q = query(q, where("category", "==", category));
  }

  // Filter by city if provided
  if (city) {
    q = query(q, where("city", "==", city));
  }

  // Filter by price level if provided (e.g., "$$", "$$$" → numeric via length)
  if (price) {
    q = query(q, where("price", "==", price.length));
  }

  // Sort by average rating in descending order by default or if "Rating" is specified
  if (sort === "Rating" || !sort) {
    q = query(q, orderBy("avgRating", "desc"));
  }
  // Sort by number of ratings if "Review" is specified
  else if (sort === "Review") {
    q = query(q, orderBy("numRatings", "desc"));
  }

  // Return the final query object
  return q;
}

// -----------------------------------------------------------------------------
// Exported Function: Get Restaurants (Once)
// -----------------------------------------------------------------------------

// Fetches a list of restaurants with optional filters and sorting
export async function getRestaurants(db = db, filters = {}) {
  // Start the query on the "restaurants" collection
  let q = query(collection(db, "restaurants"));

  // Apply filters using the helper function
  q = applyQueryFilters(q, filters);

  // Run the query and fetch documents
  const results = await getDocs(q);

  // Convert Firestore documents into plain JS objects
  return results.docs.map((doc) => {
    return {
      id: doc.id, // Include document ID
      ...doc.data(), // Spread remaining fields from document
      timestamp: doc.data().timestamp.toDate(), // Convert Firestore Timestamp to JS Date
    };
  });
}

// -----------------------------------------------------------------------------
// Exported Function: Real-time Listener
// -----------------------------------------------------------------------------

// Sets up a real-time listener for restaurants, with optional filters
export function getRestaurantsSnapshot(cb, filters = {}) {
  // Validate that the callback is a function
  if (typeof cb !== "function") {
    console.log("Error: The callback parameter is not a function");
    return; // Exit early if invalid
  }

  // Begin with a base query
  let q = query(collection(db, "restaurants"));

  // Apply filters using the helper function
  q = applyQueryFilters(q, filters);

  // Set up the real-time listener
  return onSnapshot(q, (querySnapshot) => {
    // Convert documents into plain JS objects
    const results = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id, // Document ID
        ...doc.data(), // All other fields
        timestamp: doc.data().timestamp.toDate(), // Convert timestamp
      };
    });

    // Pass the result to the callback
    cb(results);
  });
}

// -----------------------------------------------------------------------------
// Exported Function: Update Ratings Inside Transaction
// -----------------------------------------------------------------------------

// Updates restaurant's ratings in a transaction and adds the new review
export const updateWithRating = async (
  transaction,        // Firestore transaction object
  docRef,             // Reference to the restaurant document
  newRatingDocument,  // Reference to the new rating document in subcollection
  review              // Review object with rating and other fields
) => {
  const restaurant = await transaction.get(docRef); // Get current restaurant document
  const data = restaurant.data(); // Extract its data

  // Increment rating count
  const newNumRatings = data?.numRatings ? data.numRatings + 1 : 1;

  // Add new rating to existing sum
  const newSumRating = (data?.sumRating || 0) + Number(review.rating);

  // Calculate new average rating
  const newAverage = newSumRating / newNumRatings;

  // Update the restaurant document with new values
  transaction.update(docRef, {
    numRatings: newNumRatings,
    sumRating: newSumRating,
    avgRating: newAverage,
  });

  // Add the new rating document to the subcollection with timestamp
  transaction.set(newRatingDocument, {
    ...review, // Spread review fields
    timestamp: Timestamp.fromDate(new Date()), // Add Firestore timestamp
  });
};

// -----------------------------------------------------------------------------
// Exported Function: Add Review to Restaurant
// -----------------------------------------------------------------------------

// Adds a review to a restaurant by running a Firestore transaction
export async function addReviewToRestaurant(db, restaurantId, review) {
  // Check if restaurant ID is valid
  if (!restaurantId) {
    throw new Error("No restaurant ID has been provided.");
  }

  // Check if review object is valid
  if (!review) {
    throw new Error("A valid review has not been provided.");
  }

  try {
    // Reference to the restaurant document
    const docRef = doc(collection(db, "restaurants"), restaurantId);

    // Create a new rating document reference in subcollection
    const newRatingDocument = doc(
      collection(db, `restaurants/${restaurantId}/ratings`)
    );

    // Run a Firestore transaction to update the restaurant and add the review
    await runTransaction(db, (transaction) =>
      updateWithRating(transaction, docRef, newRatingDocument, review)
    );
  } catch (error) {
    // Handle and log errors
    console.error(
      "There was an error adding the rating to the restaurant",
      error
    );
    throw error; // Re-throw to allow external error handling
  }
}
