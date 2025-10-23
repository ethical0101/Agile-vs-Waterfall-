// Firebase Auth Error Codes and User-Friendly Messages
export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Only one sign-in popup is allowed at a time.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Please allow popups for this site.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    case 'auth/invalid-api-key':
      return 'Invalid API key. Please check Firebase configuration.';
    case 'auth/app-deleted':
      return 'Firebase app has been deleted. Please contact support.';
    case 'auth/app-not-authorized':
      return 'App not authorized to use Firebase Authentication.';
    case 'auth/argument-error':
      return 'Invalid authentication arguments provided.';
    case 'auth/invalid-user-token':
      return 'User token is invalid. Please sign in again.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};
