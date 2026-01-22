import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";

export function TutorialCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasTutorialCompleted = useQuery(api.users.hasTutorialCompleted);

  useEffect(() => {
    // Only redirect if we've confirmed tutorial is not completed
    // null/undefined means still loading
    if (hasTutorialCompleted === false) {
      router.replace("/(kid)/tutorial");
    }
  }, [hasTutorialCompleted, router]);

  // Show loading state while checking
  if (hasTutorialCompleted === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3080D8" />
      </View>
    );
  }

  // If tutorial not completed, don't render children (we're redirecting)
  if (hasTutorialCompleted === false) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3080D8" />
      </View>
    );
  }

  // Tutorial completed, render children
  return <>{children}</>;
}
