import React from "react";
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, 
  ActivityIndicator, Alert, StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { signupApi } from "../../services/parkingService";

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [vehicle, setVehicle] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !vehicle) {
      Alert.alert("Error", "Please fill all fields, including vehicle plate");
      return;
    }
    setLoading(true);
    const res = await signupApi({ 
      full_name: name, 
      email, 
      password, 
      vehicle_plate: vehicle.toUpperCase() 
    });
    setLoading(false);
    
    if (res.message) {
      Alert.alert("Success", "Account created! Now you can login.");
      router.push("/auth/login");
    } else {
      Alert.alert("Signup Failed", res.error || "Something went wrong");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us to enjoy automated parking experiences</Text>
        </View>

        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.icon} />
              <TextInput 
                style={styles.input}
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.icon} />
              <TextInput 
                style={styles.input}
                placeholder="john@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Vehicle Plate - CRITICAL FIELD */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Vehicle Plate Number (FASTag)</Text>
            <View style={[styles.inputContainer, styles.plateContainer]}>
              <Ionicons name="card-outline" size={20} color="#3b82f6" style={styles.icon} />
              <TextInput 
                style={[styles.input, { fontWeight: "bold", color: "#3b82f6" }]}
                placeholder="MH12DE1433"
                value={vehicle}
                onChangeText={setVehicle}
                autoCapitalize="characters"
              />
            </View>
            <Text style={styles.hint}>This plate will be used for automated payments</Text>
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.icon} />
              <TextInput 
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#94a3b8" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.signupBtn, loading && styles.btnDisabled]} 
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.signupBtnText}>Create Account</Text>
                <Ionicons name="checkmark-circle" size={22} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/login")}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollContent: { paddingHorizontal: 30, paddingTop: 40, paddingBottom: 40 },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30
  },
  header: { marginBottom: 35 },
  title: { fontSize: 32, fontWeight: "800", color: "#1e293b", letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: "#64748b", marginTop: 8, lineHeight: 24 },
  form: { width: "100%" },
  inputWrapper: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "700", color: "#475569", marginBottom: 8, marginLeft: 4 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 60
  },
  plateContainer: { borderColor: "#dbeafe", backgroundColor: "#f0f7ff" },
  icon: { marginRight: 12 },
  input: { flex: 1, color: "#1e293b", fontSize: 16, fontWeight: "500" },
  hint: { fontSize: 12, color: "#94a3b8", marginTop: 6, marginLeft: 4 },
  signupBtn: {
    backgroundColor: "#3b82f6",
    height: 62,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 15,
    elevation: 8,
    shadowColor: "#3b82f6",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  btnDisabled: { backgroundColor: "#94a3b8", elevation: 0 },
  signupBtnText: { color: "white", fontSize: 18, fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 40 },
  footerText: { color: "#64748b", fontSize: 15 },
  loginLink: { color: "#3b82f6", fontWeight: "bold", fontSize: 15 }
});
