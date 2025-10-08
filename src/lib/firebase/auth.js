// Import GoogleAuthProvider, signInWithPopup, and the aliased auth state/token change functions from the 'firebase/auth' SDK.
import {
  GoogleAuthProvider, // Imports the class used to create a Google Sign-in provider.
  signInWithPopup, // Imports the function to initiate sign-in via a pop-up window.
  onAuthStateChanged as _onAuthStateChanged, // Imports and renames the core function for listening to sign-in state changes.
  onIdTokenChanged as _onIdTokenChanged, // Imports and renames the core function for listening to ID token changes.
} from "firebase/auth";

// Import the initialized Firebase Auth object (client-side configuration) from a local file.
import { auth } from "@/src/lib/firebase/clientApp";

// -----------------------------------------------------------------------------
// Wrapped State Listeners
// -----------------------------------------------------------------------------

// Wrapper function to expose the Firebase onAuthStateChanged listener.
export function onAuthStateChanged(cb) {
  // Calls the aliased Firebase function, passing the imported 'auth' instance and the callback.
  // Returns the function used to unsubscribe the listener.
  return _onAuthStateChanged(auth, cb);
}

// Wrapper function to expose the Firebase onIdTokenChanged listener.
export function onIdTokenChanged(cb) {
  // Calls the aliased Firebase function, passing the imported 'auth' instance and the callback.
  // Returns the function used to unsubscribe the listener.
  return _onIdTokenChanged(auth, cb);
}

// -----------------------------------------------------------------------------
// Authentication Actions
// -----------------------------------------------------------------------------

// Async function to handle Google Sign-in.
export async function signInWithGoogle() {
  // Creates a new instance of the Google Auth Provider.
  const provider = new GoogleAuthProvider();

  try {
    // Executes the sign-in using a pop-up with the auth instance and Google provider.
    await signInWithPopup(auth, provider);
  } catch (error) {
    // Logs any error that occurs during the sign-in process (e.g., pop-up blocked, user closed window).
    console.error("Error signing in with Google", error);
  }
}

// Async function to handle user sign-out.
export async function signOut() {
  try {
    // Calls the native Firebase signOut method on the auth instance.
    return auth.signOut();
  } catch (error) {
    // Logs any error that occurs during the sign-out process.
    console.error("Error signing out with Google", error);
  }
}
