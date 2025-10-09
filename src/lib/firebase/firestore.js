// Filters a Firestore query with optional filters for category, city, price, and sort
function applyQueryFilters(q, { category, city, price, sort }) {
  // Filter by category if specified
  if (category) {
    q = query(q, where("category", "==", category));
  }

  // Filter by city if specified
  if (city) {
    q = query(q, where("city", "==", city));
  }

  // Filter by price if specified
  // Note: price is assumed to be an array (like "$$$"), and its length maps to a number
  if (price) {
    q = query(q, where("price", "==", price.length));
  }

  // Sort by average rating descending if sort is "Rating" or not specified
  if (sort === "Rating" || !sort) {
    q = query(q, orderBy("avgRating", "desc"));
  }
  // Otherwise, if sort is "Review", sort by number of ratings descending
  else if (sort === "Review") {
    q = query(q, orderBy("numRatings", "desc"));
  }

  // Return the fully constructed query
  return q;
}

// Retrieves a list of restaurants from Firestore, optionally filtered and sorted
export async function getRestaurants(db = db, filters = {}) {
  // Start with a base query on the "restaurants" collection
  let q = query(collection(db, "restaurants"));

  // Apply filters such as category, city, price, and sort
  q = applyQueryFilters(q, filters);

  // Execute the query and get the snapshot of matching documents
  const results = await getDocs(q);

  // Map over the document snapshots and return plain JS objects with restaurant data
  return results.docs.map((doc) => {
    return {
      id: doc.id, // Include the document ID
      ...doc.data(), // Spread the document data
      // Convert Firestore Timestamp to JS Date so it can be used in client components
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}
