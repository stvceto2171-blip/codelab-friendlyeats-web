// Enforces that this code is only run on the server (not in the browser)
import "server-only";

import { cookies } from "next/headers"; // Provides access to cookies in server-side functions
import { initializeServerApp, initializeApp } from "firebase/app"; // Firebase SDK initialization functions
import { getAuth } from "firebase/auth"; // Auth module from Firebase

// Returns an authenticated Firebase App and the current user
export async function getAuthenticatedAppForUser() {
  // Retrieve the "__session" cookie (which contains the user's Firebase ID token)
  const authIdToken = (await cookies()).get("__session")?.value;

  // Initialize a Firebase App instance specifically for server-side usage,
  // using the ID token passed from the client
  // First, we call initializeApp() to get a config object (it's safe here since this is server-side)
  const firebaseServerApp = initializeServerApp(
    initializeApp(), // This sets up the default Firebase config
    {
      authIdToken, // Pass the client’s ID token to authenticate the server-side Firebase app
    }
  );

  // Get the Auth instance from the server-side Firebase app
  const auth = getAuth(firebaseServerApp);

  // Wait until the authentication state is ready
  await auth.authStateReady();

  // Return both the initialized server-side app and the authenticated user
  return { firebaseServerApp, currentUser: auth.currentUser };
}
