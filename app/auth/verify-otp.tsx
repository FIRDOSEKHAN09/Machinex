import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '@/src/services/api';
import { useAuth } from '@/src/context/AuthContext';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { phoneOrEmail } = useLocalSearchParams<{ phoneOrEmail: string }>();

  const [captcha, setCaptcha] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    setCaptcha(random);
  };

  const handleVerify = async () => {
    if (userInput !== captcha) {
      Alert.alert('Error', 'Incorrect security code');
      generateCaptcha();
      setUserInput('');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.verifyOTP({
        phone_or_email: phoneOrEmail,
        otp: "123456", // Backend still expects this mock OTP
      });

      await login(response.data.access_token, response.data.user);
      router.replace('/home');
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#f97316" />
          </View>

          <Text style={styles.title}>Security Check</Text>
          <Text style={styles.subtitle}>
            Enter the security code shown below to continue{'\n'}
            <Text style={styles.highlight}>{phoneOrEmail}</Text>
          </Text>

          {/* Captcha Display */}
          <View style={styles.captchaBox}>
            <Text style={styles.captchaText}>{captcha}</Text>
          </View>

          {/* Input Field */}
          <TextInput
            style={styles.input}
            placeholder="Enter security code"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            value={userInput}
            onChangeText={setUserInput}
          />

          <TouchableOpacity onPress={generateCaptcha} style={styles.refreshButton}>
            <Text style={styles.refreshText}>Refresh Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  highlight: {
    color: '#f97316',
    fontWeight: '600',
  },
  captchaBox: {
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 20,
  },
  captchaText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#f97316',
    letterSpacing: 4,
  },
  input: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    color: '#f8fafc',
    fontSize: 18,
    marginBottom: 12,
  },
  refreshButton: {
    marginBottom: 24,
  },
  refreshText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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