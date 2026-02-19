import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const MACHINE_CATALOG = {
  excavators: [
    {
      id: '1',
      name: 'Hyundai HX220L',
      img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400',
      specs: {
        Engine: 'Cummins QSB6.7',
        Power: '173 HP (129 kW)',
        OperatingWeight: '22,100 kg',
        BucketCapacity: '1.05 m³',
        MaxDigDepth: '6.73 m',
        FuelType: 'Diesel',
      },
    },
    {
      id: '2',
      name: 'CAT 320D',
      img: 'https://images.unsplash.com/photo-1621922688758-e2e8b902c8ec?w=400',
      specs: {
        Engine: 'Cat C6.4 ACERT',
        Power: '148 HP (110 kW)',
        OperatingWeight: '20,200 kg',
        BucketCapacity: '0.93 m³',
        MaxDigDepth: '6.65 m',
        FuelType: 'Diesel',
      },
    },
    {
      id: '3',
      name: 'Komatsu PC200',
      img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
      specs: {
        Engine: 'Komatsu SAA6D107E',
        Power: '155 HP (116 kW)',
        OperatingWeight: '20,600 kg',
        BucketCapacity: '0.91 m³',
        MaxDigDepth: '6.47 m',
        FuelType: 'Diesel',
      },
    },
  ],
  jcbs: [
    {
      id: '4',
      name: 'JCB 3DX Super',
      img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      specs: {
        Engine: 'JCB Dieselmax',
        Power: '92 HP (69 kW)',
        OperatingWeight: '8,090 kg',
        BucketCapacity: '0.3 m³',
        MaxDigDepth: '5.46 m',
        FuelType: 'Diesel',
      },
    },
    {
      id: '5',
      name: 'JCB 4DX',
      img: 'https://images.unsplash.com/photo-1570275239925-4af0aa93a0dc?w=400',
      specs: {
        Engine: 'JCB Dieselmax 448',
        Power: '100 HP (75 kW)',
        OperatingWeight: '8,370 kg',
        BucketCapacity: '0.3 m³',
        MaxDigDepth: '5.88 m',
        FuelType: 'Diesel',
      },
    },
    {
      id: '6',
      name: 'JCB 3DX Xtra',
      img: 'https://images.unsplash.com/photo-1629644638636-4d149be1cb86?w=400',
      specs: {
        Engine: 'JCB Dieselmax 444',
        Power: '76 HP (57 kW)',
        OperatingWeight: '7,630 kg',
        BucketCapacity: '0.27 m³',
        MaxDigDepth: '4.73 m',
        FuelType: 'Diesel',
      },
    },
  ],
};

export default function CatalogScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'excavators' | 'jcbs'>('excavators');
  const [selectedMachine, setSelectedMachine] = useState<any>(null);

  const machines = MACHINE_CATALOG[activeTab];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Machine Catalog</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'excavators' && styles.tabActive]}
          onPress={() => setActiveTab('excavators')}
        >
          <Ionicons 
            name="construct" 
            size={20} 
            color={activeTab === 'excavators' ? '#f97316' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'excavators' && styles.tabTextActive]}>
            Excavators
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'jcbs' && styles.tabActive]}
          onPress={() => setActiveTab('jcbs')}
        >
          <Ionicons 
            name="car" 
            size={20} 
            color={activeTab === 'jcbs' ? '#f97316' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'jcbs' && styles.tabTextActive]}>
            JCB's
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Machine Cards */}
        {machines.map((machine) => (
          <TouchableOpacity
            key={machine.id}
            style={styles.machineCard}
            onPress={() => setSelectedMachine(selectedMachine?.id === machine.id ? null : machine)}
            activeOpacity={0.8}
          >
            {/* Machine Image */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: machine.img }}
                style={styles.machineImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {activeTab === 'excavators' ? 'EXCAVATOR' : 'JCB'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Machine Name */}
            <View style={styles.machineInfo}>
              <Text style={styles.machineName}>{machine.name}</Text>
              <View style={styles.quickSpecs}>
                <View style={styles.quickSpec}>
                  <Ionicons name="speedometer" size={14} color="#f97316" />
                  <Text style={styles.quickSpecText}>{machine.specs.Power}</Text>
                </View>
                <View style={styles.quickSpec}>
                  <Ionicons name="water" size={14} color="#3b82f6" />
                  <Text style={styles.quickSpecText}>{machine.specs.FuelType}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.expandButton}>
                <Text style={styles.expandText}>
                  {selectedMachine?.id === machine.id ? 'Hide Specs' : 'View Specs'}
                </Text>
                <Ionicons 
                  name={selectedMachine?.id === machine.id ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color="#f97316" 
                />
              </TouchableOpacity>
            </View>

            {/* Expanded Specifications */}
            {selectedMachine?.id === machine.id && (
              <View style={styles.specsContainer}>
                <Text style={styles.specsTitle}>Full Specifications</Text>
                <View style={styles.specsGrid}>
                  {Object.entries(machine.specs).map(([key, value]) => (
                    <View key={key} style={styles.specItem}>
                      <Text style={styles.specLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                      <Text style={styles.specValue}>{value as string}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#f97316',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  machineCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  machineImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#334155',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 12,
  },
  categoryBadge: {
    backgroundColor: '#f97316',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  machineInfo: {
    padding: 16,
  },
  machineName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  quickSpecs: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  quickSpec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickSpecText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  expandText: {
    fontSize: 13,
    color: '#f97316',
    fontWeight: '500',
  },
  specsContainer: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  specsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specItem: {
    width: '47%',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
  },
  specLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  bottomSpacer: {
    height: 32,
  },
});
