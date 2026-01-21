import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const currentUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn ? {} : "skip"
  );

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/(auth)/sign-in");
      return;
    }

    if (currentUser === undefined) return; // Still loading

    if (!currentUser) {
      // New user, needs onboarding
      router.replace("/(onboarding)/welcome");
      return;
    }

    // Route based on user type
    if (currentUser.role === "parent") {
      router.replace("/(parent)/dashboard");
    } else {
      router.replace("/(kid)/dashboard");
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text className="mt-4 text-text-muted">Loading...</Text>
    </View>
  );
}
