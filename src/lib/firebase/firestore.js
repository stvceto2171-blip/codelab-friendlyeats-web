// Import required Firestore functions from Firebase SDK
import {
  collection,     // Allows access to a specific collection in Firestore
  onSnapshot,     // Sets up a real-time listener to Firestore data
  query,          // Allows you to create Firestore queries with filters and sorting
  getDocs,        // Fetches documents from Firestore based on a query
  where,          // Used to apply filter conditions to queries
  orderBy         // Used to sort query results
} from "firebase/firestore";

// Import the initialized Firestore client instance
import { db } from "@/src/lib/firebase/clientApp"; // Your app’s Firestore client instance

// Filters a Firestore query with optional filters for category, city, price, and sort
function applyQueryFilters(q, { category, city, price, sort }) {
  // Filter by category if one is specified
  if (category) {
    q = query(q, where("category", "==", category));
  }

  // Filter by city if one is specified
  if (city) {
    q = query(q, where("city", "==", city));
  }

  // Filter by price if one is specified
  // Note: price is assumed to be a string like "$$" or "$$$"
  // Its length is used to convert to a numeric value (e.g., "$$$" → 3)
  if (price) {
    q = query(q, where("price", "==", price.length));
  }

  // Sort by average rating in descending order if sort is "Rating" or not specified
  if (sort === "Rating" || !sort) {
    q = query(q, orderBy("avgRating", "desc"));
  }
  // Sort by number of ratings if sort is "Review"
  else if (sort === "Review") {
    q = query(q, orderBy("numRatings", "desc"));
  }

  // Return the fully constructed query
  return q;
}

// Fetches a list of restaurants from Firestore, applying optional filters and sorting
export async function getRestaurants(db = db, filters = {}) {
  // Start by querying the "restaurants" collection in Firestore
  let q = query(collection(db, "restaurants"));

  // Apply the filters and sorting options using the applyQueryFilters helper
  q = applyQueryFilters(q, filters);

  // Execute the query and get the matching documents
  const results = await getDocs(q);

  // Map over the documents and convert them to plain JavaScript objects
  return results.docs.map((doc) => {
    return {
      id: doc.id,               // Include the document ID
      ...doc.data(),            // Spread the rest of the document data
      timestamp: doc.data().timestamp.toDate(), // Convert Firestore Timestamp to JS Date
    };
  });
}

// Sets up a real-time listener to the "restaurants" collection,
// applying filters and invoking a callback when data changes
export function getRestaurantsSnapshot(cb, filters = {}) {
  // Ensure the callback provided is a function
  if (typeof cb !== "function") {
    console.log("Error: The callback parameter is not a function");
    return; // Exit early if the callback is invalid
  }

  // Begin with a base query on the "restaurants" collection
  let q = query(collection(db, "restaurants"));

  // Apply optional filters like category, city, price, and sort
  q = applyQueryFilters(q, filters);

  // Set up the onSnapshot real-time listener for the query
  return onSnapshot(q, (querySnapshot) => {
    // When the snapshot is received, map over the documents
    const results = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,               // Include document ID
        ...doc.data(),            // Include all other fields in the document
        timestamp: doc.data().timestamp.toDate(), // Convert Timestamp to JS Date
      };
    });

    // Call the provided callback function with the results
    cb(results);
  });
}
