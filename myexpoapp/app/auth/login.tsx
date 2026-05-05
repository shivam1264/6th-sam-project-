import React from "react";
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, 
  ActivityIndicator, Alert, Dimensions, StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loginApi } from "../../services/parkingService";
import { AuthStore } from "../../services/authStore";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    setLoading(true);
    const res = await loginApi({ email, password });
    setLoading(false);
    
    if (res.user) {
      AuthStore.setLoggedInUser(email);
      router.replace("/(tabs)");
    } else {
      Alert.alert("Login Failed", res.error || "Invalid credentials");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="car-sport" size={50} color="#3b82f6" />
          </View>
          <Text style={styles.title}>Smart Parking</Text>
          <Text style={styles.subtitle}>Welcome back! Please login to your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.icon} />
              <TextInput 
                style={styles.input}
                placeholder="example@mail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

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

          <TouchableOpacity style={styles.forgotPass}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginBtn, loading && styles.btnDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Login</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/signup")}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollContent: { paddingHorizontal: 30, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 40 },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: "#eff6ff",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  title: { fontSize: 32, fontWeight: "800", color: "#1e293b", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#64748b", textAlign: "center", marginTop: 8, lineHeight: 22 },
  form: { width: "100%" },
  inputWrapper: { marginBottom: 20 },
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
  icon: { marginRight: 12 },
  input: { flex: 1, color: "#1e293b", fontSize: 16, fontWeight: "500" },
  forgotPass: { alignSelf: "flex-end", marginBottom: 30 },
  forgotText: { color: "#3b82f6", fontWeight: "700", fontSize: 14 },
  loginBtn: {
    backgroundColor: "#3b82f6",
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    elevation: 8,
    shadowColor: "#3b82f6",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  btnDisabled: { backgroundColor: "#94a3b8", elevation: 0 },
  loginBtnText: { color: "white", fontSize: 18, fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 40 },
  footerText: { color: "#64748b", fontSize: 15 },
  signupLink: { color: "#3b82f6", fontWeight: "bold", fontSize: 15 }
});
