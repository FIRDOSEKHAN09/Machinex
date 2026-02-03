import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated, Text, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import AdminPasswordModal from '@/src/components/AdminPasswordModal';

export default function Index() {
  const { isAuthenticated, isLoading, user, isAdmin } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [hasCheckedAdmin, setHasCheckedAdmin] = useState(false);
  
  // Animation values
  const excavatorPosition = new Animated.Value(-100);
  const wheelRotation = new Animated.Value(0);
  const armRotation = new Animated.Value(0);
  const logoOpacity = new Animated.Value(0);
  const logoScale = new Animated.Value(0.5);

  useEffect(() => {
    // Start animations
    Animated.sequence([
      // Logo fade in and scale
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
      // Excavator drives in
      Animated.timing(excavatorPosition, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous wheel rotation
    Animated.loop(
      Animated.timing(wheelRotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Arm movement
    Animated.loop(
      Animated.sequence([
        Animated.timing(armRotation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(armRotation, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Hide splash after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash && !isLoading) {
      if (isAuthenticated) {
        if (user?.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/home');
        }
      } else {
        router.replace('/auth/login');
      }
    }
  }, [showSplash, isLoading, isAuthenticated, user]);

  const spin = wheelRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const armAngle = armRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '15deg'],
  });

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          {[...Array(20)].map((_, i) => (
            <View key={i} style={[styles.patternDot, { left: `${(i % 5) * 25}%`, top: `${Math.floor(i / 5) * 25}%` }]} />
          ))}
        </View>

        {/* Logo */}
        <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoIcon}>
            <Ionicons name="construct" size={64} color="#f97316" />
          </View>
          <Text style={styles.logoText}>Machine Rental</Text>
          <Text style={styles.logoSubtext}>Rent • Track • Manage</Text>
        </Animated.View>

        {/* Animated Excavator */}
        <Animated.View style={[styles.excavatorContainer, { transform: [{ translateX: excavatorPosition }] }]}>
          {/* Excavator Body */}
          <View style={styles.excavatorBody}>
            <View style={styles.cabin}>
              <View style={styles.cabinWindow} />
            </View>
            {/* Arm */}
            <Animated.View style={[styles.armContainer, { transform: [{ rotate: armAngle }] }]}>
              <View style={styles.arm}>
                <View style={styles.bucket} />
              </View>
            </Animated.View>
          </View>
          {/* Tracks */}
          <View style={styles.tracks}>
            <Animated.View style={[styles.wheel, { transform: [{ rotate: spin }] }]}>
              <View style={styles.wheelSpoke} />
              <View style={[styles.wheelSpoke, { transform: [{ rotate: '90deg' }] }]} />
            </Animated.View>
            <View style={styles.trackBody} />
            <Animated.View style={[styles.wheel, styles.wheelRight, { transform: [{ rotate: spin }] }]}>
              <View style={styles.wheelSpoke} />
              <View style={[styles.wheelSpoke, { transform: [{ rotate: '90deg' }] }]} />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Ground Line */}
        <View style={styles.ground} />

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#f97316" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#f97316" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  patternDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f97316',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  logoSubtext: {
    fontSize: 16,
    color: '#64748b',
    letterSpacing: 2,
  },
  excavatorContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
  },
  excavatorBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cabin: {
    width: 50,
    height: 40,
    backgroundColor: '#f97316',
    borderRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cabinWindow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 18,
    backgroundColor: '#0f172a',
    borderRadius: 4,
  },
  armContainer: {
    position: 'absolute',
    left: 40,
    bottom: 25,
    transformOrigin: 'left center',
  },
  arm: {
    width: 60,
    height: 10,
    backgroundColor: '#fbbf24',
    borderRadius: 4,
  },
  bucket: {
    position: 'absolute',
    right: -8,
    top: -5,
    width: 15,
    height: 20,
    backgroundColor: '#fbbf24',
    borderRadius: 2,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  tracks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -5,
  },
  trackBody: {
    width: 40,
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  wheel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#334155',
    borderWidth: 3,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelRight: {
    marginLeft: -4,
  },
  wheelSpoke: {
    position: 'absolute',
    width: 2,
    height: 16,
    backgroundColor: '#475569',
  },
  ground: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#334155',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
});
