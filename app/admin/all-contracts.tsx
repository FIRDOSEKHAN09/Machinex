import React, { useState, useEffect } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { adminAPI } from "@/src/services/api";

export default function AdminAllContractsScreen() {
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const fetchContracts = async () => {
    try {
      const response = await adminAPI.getAllContracts();
      setContracts(response.data || []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContracts();
  };

  const filteredContracts = contracts.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          All Contracts ({contracts.length})
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filterContainer}>
        {(["all", "active", "completed"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
        {filteredContracts.map((contract) => (
          <View key={contract.id} style={styles.contractCard}>
            <View style={styles.contractHeader}>
              <View style={styles.machineInfo}>
                <View
                  style={[
                    styles.machineIcon,
                    contract.is_machine_running && styles.machineIconRunning,
                  ]}
                >
                  <Ionicons
                    name="construct"
                    size={20}
                    color={contract.is_machine_running ? "#22c55e" : "#f97316"}
                  />
                  {contract.is_machine_running && (
                    <View style={styles.runningDot} />
                  )}
                </View>
                <View>
                  <Text style={styles.machineName}>
                    {contract.machine_name}
                  </Text>
                  <Text style={styles.machineType}>
                    {contract.machine_type}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  contract.status === "active"
                    ? styles.statusActive
                    : styles.statusCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    contract.status === "active"
                      ? styles.statusTextActive
                      : styles.statusTextCompleted,
                  ]}
                >
                  {contract.status === "active" ? "ACTIVE" : "DONE"}
                </Text>
              </View>
            </View>

            <View style={styles.partiesRow}>
              <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>Owner</Text>
                <Text style={styles.partyName}>{contract.owner_name}</Text>
                <Text style={styles.partyContact}>
                  {contract.owner_contact}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#475569" />
              <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>Renter</Text>
                <Text style={styles.partyName}>{contract.renter_name}</Text>
                <Text style={styles.partyContact}>
                  {contract.renter_contact}
                </Text>
              </View>
            </View>

            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Total</Text>
                <Text style={styles.financialValue}>
                  ₹{contract.total_amount?.toLocaleString()}
                </Text>
              </View>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Advance</Text>
                <Text style={[styles.financialValue, styles.greenText]}>
                  ₹{contract.advance_amount?.toLocaleString()}
                </Text>
              </View>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Remaining</Text>
                <Text style={[styles.financialValue, styles.orangeText]}>
                  ₹{contract.remaining_amount?.toLocaleString()}
                </Text>
              </View>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Days</Text>
                <Text style={styles.financialValue}>{contract.total_days}</Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.dateText}>
                Started: {formatDate(contract.start_date)}
              </Text>
              {contract.deductions > 0 && (
                <Text style={styles.deductionText}>
                  Deductions: ₹{contract.deductions?.toLocaleString()}
                </Text>
              )}
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1e293b",
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: "#f97316",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#94a3b8",
  },
  filterTextActive: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  contractCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  contractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  machineInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  machineIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#1e293b",
  },
  machineName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
  },
  machineType: {
    fontSize: 12,
    color: "#64748b",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  statusCompleted: {
    backgroundColor: "rgba(100, 116, 139, 0.1)",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  statusTextActive: {
    color: "#22c55e",
  },
  statusTextCompleted: {
    color: "#64748b",
  },
  partiesRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  partyInfo: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  partyName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f8fafc",
  },
  partyContact: {
    fontSize: 11,
    color: "#94a3b8",
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  financialItem: {
    alignItems: "center",
  },
  financialLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  financialValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f8fafc",
    marginTop: 2,
  },
  greenText: {
    color: "#22c55e",
  },
  orangeText: {
    color: "#f97316",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 10,
  },
  dateText: {
    fontSize: 11,
    color: "#64748b",
  },
  deductionText: {
    fontSize: 11,
    color: "#f97316",
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 32,
  },
});
