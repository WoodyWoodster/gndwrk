import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="family-setup" />
      <Stack.Screen name="kid-setup" />
    </Stack>
  );
}
