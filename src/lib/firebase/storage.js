// Import necessary Firebase Storage functions
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Import the initialized Firebase Storage instance from your app config
import { storage } from "@/src/lib/firebase/clientApp";

// Import the Firestore helper to update the image reference in the restaurant document
import { updateRestaurantImageReference } from "@/src/lib/firebase/firestore";

// -----------------------------------------------------------------------------
// Exported Function: updateRestaurantImage
// -----------------------------------------------------------------------------

// Main function to handle updating a restaurant's image
export async function updateRestaurantImage(restaurantId, image) {
  try {
    // Throw an error if no restaurant ID is provided
    if (!restaurantId) {
      throw new Error("No restaurant ID has been provided.");
    }

    // Throw an error if no valid image is provided
    if (!image || !image.name) {
      throw new Error("A valid image has not been provided.");
    }

    // Upload the image to Firebase Storage and get the public URL
    const publicImageUrl = await uploadImage(restaurantId, image);

    // Update the restaurant document in Firestore with the new image URL
    await updateRestaurantImageReference(restaurantId, publicImageUrl);

    // Return the public URL so it can be used in the UI or elsewhere
    return publicImageUrl;
  } catch (error) {
    // Catch and log any errors that occur during the image update process
    console.error("Error processing request:", error);
  }
}

// -----------------------------------------------------------------------------
// Internal Helper Function: uploadImage
// -----------------------------------------------------------------------------

// Handles uploading the image to Firebase Storage
async function uploadImage(restaurantId, image) {
  // Define a unique file path for the image based on restaurant ID and image name
  const filePath = `images/${restaurantId}/${image.name}`;

  // Create a reference to the storage path where the image will be saved
  const newImageRef = ref(storage, filePath);

  // Upload the image file using a resumable upload (supports large files and progress tracking)
  await uploadBytesResumable(newImageRef, image);

  // After upload completes, get the publicly accessible download URL
  return await getDownloadURL(newImageRef);
}
