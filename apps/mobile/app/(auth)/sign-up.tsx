import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const onSignUp = useCallback(async () => {
    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      setError(clerkError.errors?.[0]?.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, email, password, firstName, lastName]);

  const onVerify = useCallback(async () => {
    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(onboarding)/welcome");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      setError(clerkError.errors?.[0]?.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, code, setActive, router]);

  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center px-6">
          <View className="mb-8">
            <Text className="text-2xl font-bold text-text">
              Verify your email
            </Text>
            <Text className="mt-2 text-text-muted">
              We sent a verification code to {email}
            </Text>
          </View>

          {error ? (
            <View className="mb-4 rounded-lg bg-red-50 p-3">
              <Text className="text-red-600">{error}</Text>
            </View>
          ) : null}

          <View>
            <Text className="mb-2 text-sm font-medium text-text">
              Verification Code
            </Text>
            <TextInput
              className="rounded-lg border border-gray-300 bg-surface px-4 py-3 text-center text-2xl tracking-widest text-text"
              placeholder="000000"
              placeholderTextColor="#6B7280"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            className="mt-6 rounded-lg bg-primary px-4 py-4"
            onPress={onVerify}
            disabled={loading}
          >
            <Text className="text-center text-lg font-semibold text-white">
              {loading ? "Verifying..." : "Verify Email"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-primary">Gndwrk</Text>
            <Text className="mt-2 text-lg text-text-muted">
              Create your account to get started.
            </Text>
          </View>

          {error ? (
            <View className="mb-4 rounded-lg bg-red-50 p-3">
              <Text className="text-red-600">{error}</Text>
            </View>
          ) : null}

          <View className="space-y-4">
            <View className="flex-row space-x-4">
              <View className="flex-1">
                <Text className="mb-2 text-sm font-medium text-text">
                  First Name
                </Text>
                <TextInput
                  className="rounded-lg border border-gray-300 bg-surface px-4 py-3 text-text"
                  placeholder="First"
                  placeholderTextColor="#6B7280"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoComplete="given-name"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-2 text-sm font-medium text-text">
                  Last Name
                </Text>
                <TextInput
                  className="rounded-lg border border-gray-300 bg-surface px-4 py-3 text-text"
                  placeholder="Last"
                  placeholderTextColor="#6B7280"
                  value={lastName}
                  onChangeText={setLastName}
                  autoComplete="family-name"
                />
              </View>
            </View>

            <View className="mt-4">
              <Text className="mb-2 text-sm font-medium text-text">Email</Text>
              <TextInput
                className="rounded-lg border border-gray-300 bg-surface px-4 py-3 text-text"
                placeholder="Enter your email"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View className="mt-4">
              <Text className="mb-2 text-sm font-medium text-text">
                Password
              </Text>
              <TextInput
                className="rounded-lg border border-gray-300 bg-surface px-4 py-3 text-text"
                placeholder="Create a password"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <TouchableOpacity
              className="mt-6 rounded-lg bg-primary px-4 py-4"
              onPress={onSignUp}
              disabled={loading}
            >
              <Text className="text-center text-lg font-semibold text-white">
                {loading ? "Creating account..." : "Create Account"}
              </Text>
            </TouchableOpacity>

            <View className="mt-6 flex-row justify-center">
              <Text className="text-text-muted">Already have an account? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                  <Text className="font-semibold text-primary">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
