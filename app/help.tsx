import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Dimensions } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
});

export default function HelpScreen() {
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const isWeb = width > 768;

  // ✅ Safe role handling
  const params = useLocalSearchParams();
  const role = Array.isArray(params.role) ? params.role[0] : params.role;

  const getContent = () => {
    switch (role) {
      case "operator":
        return {
          title: "Operator Guide",
          description: "Learn how to operate and manage daily work logs.",
          video: "https://www.w3schools.com/html/mov_bbb.mp4",
          steps: [
            "Login as Operator",
            "Accept assigned contract",
            "Start engine using Start button",
            "Stop engine after work",
            "Enter fuel usage",
            "Submit daily log",
          ],
          faqs: ["How to edit fuel entry?", "What if I forget to stop engine?"],
        };

      case "owner":
        return {
          title: "Machine Owner Guide",
          description: "Manage machines, contracts and earnings.",
          video: "https://www.w3schools.com/html/mov_bbb.mp4",
          steps: [
            "Add your machine",
            "Create a new contract",
            "Assign operator",
            "Track daily logs",
            "Monitor fuel expenses",
            "View earnings dashboard",
          ],
          faqs: ["How to add new machine?", "How is revenue calculated?"],
        };

      default:
        return {
          title: "User / Farmer Guide",
          description: "Hire machines and track your work easily.",
          video: "https://www.w3schools.com/html/mov_bbb.mp4",
          steps: [
            "Browse available machines",
            "Select required machine",
            "Create contract request",
            "Confirm pricing",
            "Track work progress",
            "Complete payment",
          ],
          faqs: ["How to cancel booking?", "How is pricing calculated?"],
        };
    }
  };

  const content = getContent();

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#0f172a",
    },
    content: {
      padding: 16,
      paddingBottom: 40,
      maxWidth: isWeb ? 900 : "100%",
      alignSelf: "center",
      width: "100%",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      gap: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#f8fafc",
    },
    card: {
      backgroundColor: "#1e293b",
      borderRadius: 16,
      padding: 12,
      marginBottom: 16,
    },
    video: {
      width: "100%",
      height: isWeb ? 300 : 200,
      borderRadius: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#f8fafc",
      marginBottom: 6,
    },
    description: {
      color: "#94a3b8",
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#f8fafc",
      marginBottom: 12,
      marginTop: 10,
    },
    grid: {
      flexDirection: isWeb ? "row" : "column",
      flexWrap: "wrap",
      gap: 12,
    },
    stepCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#1e293b",
      padding: 14,
      borderRadius: 12,
      marginBottom: 10,
      width: isWeb ? "48%" : "100%",
    },
    stepNumber: {
      backgroundColor: "#f97316",
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    stepText: {
      color: "#e2e8f0",
      flex: 1,
    },
    faqCard: {
      backgroundColor: "#1e293b",
      padding: 12,
      borderRadius: 10,
      marginBottom: 8,
    },
    faqText: {
      color: "#cbd5f5",
    },
  });

  return (
    <ScrollView
      style={dynamicStyles.container}
      contentContainerStyle={dynamicStyles.content}
    >
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Help & Guide</Text>
      </View>

      {/* Video Card */}
      <View style={dynamicStyles.card}>
        <Video
          source={{ uri: content.video }}
          style={dynamicStyles.video}
          useNativeControls
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <Text style={dynamicStyles.title}>{content.title}</Text>
      <Text style={dynamicStyles.description}>{content.description}</Text>

      {/* Steps */}
      <Text style={dynamicStyles.sectionTitle}>Steps</Text>
      <View style={dynamicStyles.grid}>
        {content.steps.map((step, index) => (
          <View key={index} style={dynamicStyles.stepCard}>
            <View style={dynamicStyles.stepNumber}>
              <Text style={{ color: "#fff", fontSize: 12 }}>{index + 1}</Text>
            </View>
            <Text style={dynamicStyles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* FAQ */}
      <Text style={dynamicStyles.sectionTitle}>FAQs</Text>
      {content.faqs.map((faq, index) => (
        <View key={index} style={dynamicStyles.faqCard}>
          <Text style={dynamicStyles.faqText}>{faq}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
