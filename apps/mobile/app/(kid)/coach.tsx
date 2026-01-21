import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <View
      className={`mb-3 flex-row ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <View className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-accent-100">
          <Ionicons name="sparkles" size={16} color="#F59E0B" />
        </View>
      )}
      <View
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser ? "bg-primary" : "bg-surface"
        }`}
      >
        <Text className={isUser ? "text-white" : "text-text"}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function SuggestedQuestion({
  question,
  onPress,
}: {
  question: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="mr-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2"
      onPress={onPress}
    >
      <Text className="text-primary-700">{question}</Text>
    </TouchableOpacity>
  );
}

export default function CoachScreen() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const conversation = useQuery(api.ai.getCurrentConversation);
  const sendMessage = useAction(api.ai.chat);

  const messages = conversation?.messages ?? [];

  const suggestedQuestions = [
    "How can I save more?",
    "What is a Trust Score?",
    "How do loans work?",
    "Help me set a goal",
  ];

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleSend = async (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText || isLoading) return;

    setInput("");
    setIsLoading(true);

    try {
      await sendMessage({ message: messageText });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        {/* Header */}
        <View className="border-b border-gray-200 bg-surface px-4 py-3">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-100">
              <Ionicons name="sparkles" size={20} color="#F59E0B" />
            </View>
            <View className="ml-3">
              <Text className="text-lg font-semibold text-text">
                Money Coach
              </Text>
              <Text className="text-sm text-text-muted">
                Your personal financial guide
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View className="items-center py-8">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-accent-100">
                <Ionicons name="sparkles" size={40} color="#F59E0B" />
              </View>
              <Text className="mt-4 text-xl font-semibold text-text">
                Hi there!
              </Text>
              <Text className="mt-2 text-center text-text-muted">
                I'm your Money Coach. Ask me anything about saving, spending,
                earning, or managing your money!
              </Text>

              <View className="mt-6">
                <Text className="mb-3 text-center text-sm font-medium text-text-muted">
                  Try asking:
                </Text>
                <View className="flex-row flex-wrap justify-center">
                  {suggestedQuestions.map((q) => (
                    <View key={q} className="m-1">
                      <SuggestedQuestion
                        question={q}
                        onPress={() => handleSend(q)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && (
            <View className="mb-3 flex-row items-center">
              <View className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-accent-100">
                <Ionicons name="sparkles" size={16} color="#F59E0B" />
              </View>
              <View className="rounded-2xl bg-surface px-4 py-3">
                <ActivityIndicator size="small" color="#F59E0B" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="border-t border-gray-200 bg-surface px-4 py-3">
          <View className="flex-row items-center">
            <TextInput
              className="mr-3 flex-1 rounded-full bg-background px-4 py-3 text-text"
              placeholder="Ask me anything..."
              placeholderTextColor="#6B7280"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity
              className={`h-12 w-12 items-center justify-center rounded-full ${
                input.trim() && !isLoading ? "bg-primary" : "bg-gray-200"
              }`}
              onPress={() => handleSend()}
              disabled={!input.trim() || isLoading}
            >
              <Ionicons
                name="send"
                size={20}
                color={input.trim() && !isLoading ? "white" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
