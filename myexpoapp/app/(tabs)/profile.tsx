import React from "react";
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, 
  SafeAreaView, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, StatusBar, Dimensions, RefreshControl 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { fetchUserHistoryApi, fetchProfileApi, updateProfileApi } from "../../services/parkingService";
import { AuthStore } from "../../services/authStore";

const { height: screenHeight } = Dimensions.get("window");
const statusBarHeight = Platform.OS === "android" ? (StatusBar.currentHeight || 0) : 0;

export default function ProfileTab() {
  const router = useRouter();
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Profile States
  const [userName, setUserName] = React.useState("User");
  const [userEmail, setUserEmail] = React.useState(AuthStore.getLoggedInUser());
  const [wallet, setWallet] = React.useState(0);
  const [isEditModalVisible, setEditModalVisible] = React.useState(false);
  const [tempName, setTempName] = React.useState("");
  const [tempEmail, setTempEmail] = React.useState("");
  const [vehicles, setVehicles] = React.useState<string[]>([]);
  const [newPlate, setNewPlate] = React.useState("");

  const fetchProfile = async () => {
    const currentEmail = AuthStore.getLoggedInUser();
    console.log("Fetching profile for:", currentEmail);
    
    setLoading(true);
    const data = await fetchProfileApi(currentEmail);
    if (data && !data.error) {
      setUserName(data.full_name || "User");
      setWallet(data.wallet_balance); // Direct update from DB
      setVehicles(data.vehicles || []);
      setUserEmail(currentEmail);
    }
    setLoading(false);
  };

  const fetchHistory = async () => {
    const currentEmail = AuthStore.getLoggedInUser();
    const data = await fetchUserHistoryApi(currentEmail);
    if (data && !data.error) {
      setHistory(data);
    }
  };

  React.useEffect(() => {
    fetchProfile();
    fetchHistory();
  }, []);

  const onRefresh = () => {
    fetchProfile();
    fetchHistory();
  };

  const handleSaveProfile = async () => {
    const success = await updateProfileApi({ email: tempEmail, full_name: tempName, vehicles });
    if (success) {
      setUserName(tempName);
      setUserEmail(tempEmail);
      setEditModalVisible(false);
    }
  };

  const addVehicle = async () => {
    if (!newPlate) return;
    const updatedVehicles = [...vehicles, newPlate.toUpperCase()];
    const success = await updateProfileApi({ email: userEmail, full_name: userName, vehicles: updatedVehicles });
    if (success) {
      setVehicles(updatedVehicles);
      setNewPlate("");
    }
  };

  const removeVehicle = async (plate: string) => {
    const updatedVehicles = vehicles.filter(v => v !== plate);
    const success = await updateProfileApi({ email: userEmail, full_name: userName, vehicles: updatedVehicles });
    if (success) {
      setVehicles(updatedVehicles);
    }
  };

  const totalSpent = history.reduce((acc, curr) => {
    const cost = parseInt(curr.cost.replace("₹", "")) || 0;
    return acc + cost;
  }, 0);

  const menuItems = [
    { icon: "time-outline", label: "Parking History", route: "/history", color: "#3b82f6" },
    { icon: "wallet-outline", label: "Payments & Wallet", route: null, color: "#d97706" },
    { icon: "settings-outline", label: "Settings", route: null, color: "#64748b" },
  ];

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: Platform.OS === "android" ? statusBarHeight + 20 : 20 }]} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: `https://ui-avatars.com/api/?name=${userName}&background=3b82f6&color=fff&size=128` }} 
              style={styles.avatar} 
            />
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => {
                setTempName(userName);
                setTempEmail(userEmail);
                setEditModalVisible(true);
              }}
            >
              <Ionicons name="pencil" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setEditModalVisible(true)}>
            <Text style={styles.userName}>{userName} <Ionicons name="chevron-forward" size={16} color="#cbd5e1" /></Text>
          </TouchableOpacity>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>

        {/* Dynamic Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{history.length}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>₹{wallet}</Text>
            <Text style={styles.statLabel}>Wallet</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Vehicles Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Vehicles</Text>
          <Text style={styles.sectionSubtitle}>{vehicles.length} plate(s) linked</Text>
        </View>

        <View style={styles.vehiclesContainer}>
          {vehicles.map((plate, idx) => (
            <View key={idx} style={styles.vehicleCard}>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{plate}</Text>
              </View>
              <TouchableOpacity onPress={() => removeVehicle(plate)}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          
          <View style={styles.addVehicleBox}>
            <TextInput 
              style={styles.addInput} 
              placeholder="Enter Plate (e.g. MP04AB1234)"
              value={newPlate}
              onChangeText={setNewPlate}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addVehicle}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => item.route && router.push(item.route)}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + "15" }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace("/auth/login")}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput 
                style={styles.input}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Enter your name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput 
                style={styles.input}
                value={tempEmail}
                onChangeText={setTempEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 24 },
  profileHeader: { alignItems: "center", marginBottom: 32 },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: "white" },
  editBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#3b82f6",
    padding: 10,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#f8fafc"
  },
  userName: { fontSize: 24, fontWeight: "bold", color: "#1e293b" },
  userEmail: { fontSize: 14, color: "#64748b", marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  statBox: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: "600" },
  statDivider: { width: 1, height: "100%", backgroundColor: "#f1f5f9" },
  menuContainer: { backgroundColor: "white", borderRadius: 24, padding: 8, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16
  },
  menuLabel: { fontSize: 16, fontWeight: "600", color: "#334155" },
  logoutBtn: {
    marginTop: 32,
    backgroundColor: "#fff1f2",
    padding: 18,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  logoutText: { color: "#ef4444", fontWeight: "bold", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "white", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: 50 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#1e293b" },
  formGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#64748b", marginBottom: 8 },
  input: { backgroundColor: "#f1f5f9", padding: 15, borderRadius: 15, fontSize: 16, color: "#1e293b" },
  saveBtn: { backgroundColor: "#3b82f6", padding: 18, borderRadius: 20, alignItems: "center", marginTop: 10 },
  saveBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  sectionHeader: { marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  sectionSubtitle: { fontSize: 12, color: "#64748b" },
  vehiclesContainer: { marginBottom: 32 },
  vehicleCard: { 
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", 
    backgroundColor: "white", padding: 15, borderRadius: 18, marginBottom: 12,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05 
  },
  plateBadge: { backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  plateText: { fontWeight: "bold", color: "#1e293b", fontSize: 15 },
  addVehicleBox: { flexDirection: "row", gap: 10, marginTop: 8 },
  addInput: { 
    flex: 1, backgroundColor: "white", padding: 12, borderRadius: 15, 
    borderWidth: 1, borderColor: "#e2e8f0", fontSize: 14 
  },
  addBtn: { 
    backgroundColor: "#3b82f6", width: 50, borderRadius: 15, 
    justifyContent: "center", alignItems: "center" 
  }
});
