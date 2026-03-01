import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { adminAPI } from "@/src/services/api";

export default function AdminAllMachinesScreen() {
  const router = useRouter();
  const [machines, setMachines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMachines = async () => {
    try {
      const response = await adminAPI.getAllMachines();
      setMachines(response.data || []);
    } catch (error) {
      console.error("Error fetching machines:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMachines();
      const interval = setInterval(fetchMachines, 15000);
      return () => clearInterval(interval);
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMachines();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      </SafeAreaView>
    );
  }

  const runningCount = machines.filter((m) => m.is_running).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Machines ({machines.length})</Text>
        <View style={styles.placeholder} />
      </View>

      {runningCount > 0 && (
        <View style={styles.runningBanner}>
          <View style={styles.pulseIcon}>
            <Ionicons name="pulse" size={18} color="#22c55e" />
          </View>
          <Text style={styles.runningBannerText}>
            {runningCount} machine(s) running NOW
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f97316"
          />
        }
      >
        {machines.map((machine) => (
          <View
            key={machine.id}
            style={[
              styles.machineCard,
              machine.is_running && styles.machineCardRunning,
            ]}
          >
            <View style={styles.machineHeader}>
              <View
                style={[
                  styles.machineIcon,
                  machine.is_running && styles.machineIconRunning,
                ]}
              >
                <Ionicons
                  name="construct"
                  size={24}
                  color={machine.is_running ? "#22c55e" : "#f97316"}
                />
                {machine.is_running && <View style={styles.runningDot} />}
              </View>
              <View style={styles.machineInfo}>
                <Text style={styles.machineName}>{machine.model_name}</Text>
                <Text style={styles.machineType}>
                  {machine.machine_type} • {machine.fuel_type}
                </Text>
                <Text style={styles.machineOwner}>
                  Owner: {machine.owner_name}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  machine.status === "available"
                    ? styles.statusAvailable
                    : styles.statusRented,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    machine.status === "available"
                      ? styles.statusTextAvailable
                      : styles.statusTextRented,
                  ]}
                >
                  {machine.status === "available" ? "AVAILABLE" : "RENTED"}
                </Text>
              </View>
            </View>

            {machine.status === "rented" && (
              <View style={styles.rentalInfo}>
                <View style={styles.rentalRow}>
                  <Text style={styles.rentalLabel}>Current Renter:</Text>
                  <Text style={styles.rentalValue}>
                    {machine.current_renter || "N/A"}
                  </Text>
                </View>
                <View style={styles.rentalRow}>
                  <Text style={styles.rentalLabel}>Working Hours:</Text>
                  <Text
                    style={[
                      styles.rentalValue,
                      machine.is_running && styles.runningText,
                    ]}
                  >
                    {machine.total_working_hours?.toFixed(1) || 0}h{" "}
                    {machine.is_running && "(LIVE)"}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.machineSpecs}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Engine</Text>
                <Text style={styles.specValue}>{machine.engine_capacity}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Hourly</Text>
                <Text style={styles.specValue}>₹{machine.hourly_rate}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Daily</Text>
                <Text style={styles.specValue}>₹{machine.daily_rate}</Text>
              </View>
            </View>
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f8fafc",
  },
  placeholder: {
    width: 40,
  },
  runningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 12,
  },
  pulseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  runningBannerText: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  machineCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  machineCardRunning: {
    borderWidth: 1,
    borderColor: "#22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.05)",
  },
  machineHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  machineIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  machineIconRunning: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  runningDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#1e293b",
  },
  machineInfo: {
    flex: 1,
    marginLeft: 12,
  },
  machineName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
  },
  machineType: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  machineOwner: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusAvailable: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  statusRented: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  statusTextAvailable: {
    color: "#22c55e",
  },
  statusTextRented: {
    color: "#f97316",
  },
  rentalInfo: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  rentalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  rentalLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  rentalValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f8fafc",
  },
  runningText: {
    color: "#22c55e",
  },
  machineSpecs: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 12,
  },
  specItem: {
    alignItems: "center",
  },
  specLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  specValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f8fafc",
    marginTop: 2,
  },
  bottomSpacer: {
    height: 32,
  },
});
