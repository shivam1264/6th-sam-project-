// Simple Session Store to keep track of the logged-in user
export const AuthStore = {
  userEmail: "",
  setLoggedInUser: (email: string) => {
    AuthStore.userEmail = email;
  },
  getLoggedInUser: () => {
    return AuthStore.userEmail || "user@test.com"; // Fallback
  }
};
