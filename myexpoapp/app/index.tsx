import { Redirect } from "expo-router";

export default function Index() {
  // In a real app, check if user is logged in using Context/Storage
  // For now, we redirect to login to show the auth flow
  return <Redirect href="/auth/login" />;
}