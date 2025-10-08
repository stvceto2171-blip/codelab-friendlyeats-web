// This directive marks the file as a Client Component in Next.js.
"use client";

// Import core React hooks and components.
import React, { useEffect } from "react";
// Import the Next.js component for client-side navigation.
import Link from "next/link";
// Import authentication utility functions from the local firebase/auth module.
import {
  signInWithGoogle, // Function to trigger Google Sign-in.
  signOut, // Function to sign the user out.
  onIdTokenChanged, // Listener for user's ID token and auth state changes.
} from "@/src/lib/firebase/auth.js";
// Import a function to populate the database with sample data.
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";
// Import cookie utility functions from the 'cookies-next' library.
import { setCookie, deleteCookie } from "cookies-next";

// Custom React hook to manage the user session and sync it with a session cookie.
function useUserSession(initialUser) {
  // useEffect runs once after the component mounts and sets up the listener.
  useEffect(() => {
    // Subscribe to Firebase ID token changes (login, logout, token refresh).
    return onIdTokenChanged(async (user) => {
      // Check if a user is currently logged in.
      if (user) {
        // Fetch the latest ID token.
        const idToken = await user.getIdToken();
        // Set the ID token as a session cookie named '__session'.
        // This cookie is used by the Next.js backend for server-side authentication.
        await setCookie("__session", idToken);
      } else {
        // If the user is logged out, delete the session cookie.
        await deleteCookie("__session");
      }

      // Check if the user has actually changed (logged in or logged out).
      // The 'initialUser' is the server-rendered user.
      if (initialUser?.uid === user?.uid) {
        // If the current user matches the initial user (e.g., just a token refresh), do nothing.
        return;
      }
      // If the user state has genuinely changed (login/logout), reload the page.
      // This forces Next.js to re-run server-side logic and read the new cookie/user state.
      window.location.reload();
    });
  // Dependency array ensures the effect only runs if the initialUser prop changes.
  }, [initialUser]);

  // Return the initial user object provided by the server.
  return initialUser;
}

// Main Header component, receiving the server-provided user object.
export default function Header({ initialUser }) {
  // Use the custom hook to manage the user session, getting the latest user state.
  const user = useUserSession(initialUser);

  // Event handler for signing out.
  const handleSignOut = (event) => {
    // Prevents the default action of the <a> tag (navigating to '#').
    event.preventDefault();
    // Calls the Firebase sign-out utility function.
    signOut();
  };

  // Event handler for signing in.
  const handleSignIn = (event) => {
    // Prevents the default action of the <a> tag (navigating to '#').
    event.preventDefault();
    // Calls the Firebase Google Sign-in utility function.
    signInWithGoogle();
  };

  // Render the header UI.
  return (
    <header>
      {/* Navigation link to the home page with a logo */}
      <Link href="/" className="logo">
        <img src="/friendly-eats.svg" alt="FriendlyEats" />
        Friendly Eats
      </Link>
      {/* Conditional rendering based on whether a user is logged in (truthy 'user' object) */}
      {user ? (
        // Renders the profile/signed-in view.
        <>
          <div className="profile">
            <p>
              {/* Display user's profile image or a default image */}
              <img
                className="profileImage"
                src={user.photoURL || "/profile.svg"}
                alt={user.email}
              />
              {/* Display user's display name */}
              {user.displayName}
            </p>

            {/* Dropdown menu for profile options */}
            <div className="menu">
              ...
              <ul>
                {/* Display the user's name again (often for context in a menu) */}
                <li>{user.displayName}</li>

                <li>
                  {/* Link to trigger the function to add sample data */}
                  <a href="#" onClick={addFakeRestaurantsAndReviews}>
                    Add sample restaurants
                  </a>
                </li>

                <li>
                  {/* Link to trigger the sign-out process */}
                  <a href="#" onClick={handleSignOut}>
                    Sign Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        // Renders the sign-in view.
        <div className="profile">
          {/* Link to trigger the Google Sign-in process */}
          <a href="#" onClick={handleSignIn}>
            <img src="/profile.svg" alt="A placeholder user image" />
            Sign In with Google
          </a>
        </div>
      )}
    </header>
  );
}
