import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../src/services/api';

const ROLES = [
  { id: 'owner', label: 'Machine Owner', icon: 'business', description: 'I own machines and rent them out' },
  { id: 'user', label: 'User/Farmer', icon: 'person', description: 'I want to rent machines' },
  { id: 'manager', label: 'Manager/Operator', icon: 'settings', description: 'I operate machines' },
];

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    if (step === 1) {
      if (!name.trim() || !phoneOrEmail.trim()) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!password || !confirmPassword) {
        Alert.alert('Error', 'Please enter password');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedRole) {
        Alert.alert('Error', 'Please select your role');
        return;
      }
      handleRegister();
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      await authAPI.register({
        name: name.trim(),
        phone_or_email: phoneOrEmail.trim(),
        password: password,
        role: selectedRole,
      });
      
      router.push({
        pathname: '/auth/verify-otp',
        params: { phoneOrEmail: phoneOrEmail.trim() },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.progressContainer}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= step && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 1 && (
            <View style={styles.form}>
              <Text style={styles.stepTitle}>Personal Information</Text>
              <Text style={styles.stepSubtitle}>Enter your details</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#64748b"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone or Email"
                  placeholderTextColor="#64748b"
                  value={phoneOrEmail}
                  onChangeText={setPhoneOrEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.form}>
              <Text style={styles.stepTitle}>Set Password</Text>
              <Text style={styles.stepSubtitle}>Create a secure password</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#64748b"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#64748b"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.form}>
              <Text style={styles.stepTitle}>Select Your Role</Text>
              <Text style={styles.stepSubtitle}>How will you use the app?</Text>

              <View style={styles.rolesContainer}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.roleCard,
                      selectedRole === role.id && styles.roleCardSelected,
                    ]}
                    onPress={() => setSelectedRole(role.id)}
                  >
                    <View style={[
                      styles.roleIconContainer,
                      selectedRole === role.id && styles.roleIconContainerSelected,
                    ]}>
                      <Ionicons
                        name={role.icon as any}
                        size={28}
                        color={selectedRole === role.id ? '#f97316' : '#94a3b8'}
                      />
                    </View>
                    <Text style={[
                      styles.roleLabel,
                      selectedRole === role.id && styles.roleLabelSelected,
                    ]}>
                      {role.label}
                    </Text>
                    <Text style={styles.roleDescription}>{role.description}</Text>
                    {selectedRole === role.id && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={24} color="#f97316" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Please wait...' : step === 3 ? 'Create Account' : 'Continue'}
            </Text>
            {!isLoading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  progressDotActive: {
    backgroundColor: '#f97316',
    width: 24,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  form: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    color: '#f8fafc',
    fontSize: 16,
  },
  rolesContainer: {
    gap: 12,
  },
  roleCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
  },
  roleCardSelected: {
    borderColor: '#f97316',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roleIconContainerSelected: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  roleLabelSelected: {
    color: '#f97316',
  },
  roleDescription: {
    fontSize: 13,
    color: '#94a3b8',
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
