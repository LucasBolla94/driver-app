import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type TabType = 'map' | 'jobs' | 'board' | 'profile';

interface BottomNavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNavigation({ currentTab, onTabChange }: BottomNavigationProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleTabPress = (tab: TabType) => {
    console.log('BottomNavigation: Tab pressed:', tab);
    onTabChange(tab);

    // Animate indicator
    const tabIndex = ['map', 'jobs', 'board', 'profile'].indexOf(tab);
    Animated.spring(slideAnim, {
      toValue: tabIndex,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const indicatorWidth = width / 4;
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, indicatorWidth, indicatorWidth * 2, indicatorWidth * 3],
  });

  return (
    <View style={styles.bottomNav}>
      {/* Animated Indicator */}
      <Animated.View
        style={[
          styles.activeIndicator,
          {
            width: indicatorWidth,
            transform: [{ translateX }],
          },
        ]}
      />

      <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('map')}>
        <View style={styles.navItemContent}>
          <Ionicons name="map" size={24} color={currentTab === 'map' ? '#000000' : '#666666'} />
          <Text style={[styles.navLabel, currentTab !== 'map' && styles.navLabelInactive]}>MAP</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('jobs')}>
        <View style={styles.navItemContent}>
          <Ionicons name="briefcase-outline" size={24} color={currentTab === 'jobs' ? '#000000' : '#666666'} />
          <Text style={[styles.navLabel, currentTab !== 'jobs' && styles.navLabelInactive]}>JOBS</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('board')}>
        <View style={styles.navItemContent}>
          <Ionicons name="grid-outline" size={24} color={currentTab === 'board' ? '#000000' : '#666666'} />
          <Text style={[styles.navLabel, currentTab !== 'board' && styles.navLabelInactive]}>BOARD</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('profile')}>
        <View style={styles.navItemContent}>
          <Ionicons name="person-outline" size={24} color={currentTab === 'profile' ? '#000000' : '#666666'} />
          <Text style={[styles.navLabel, currentTab !== 'profile' && styles.navLabelInactive]}>PROFILE</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    paddingBottom: 24,
    paddingTop: 12,
    paddingHorizontal: 0,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navItemContent: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
    marginTop: 6,
    fontFamily: 'Poppins',
    letterSpacing: 0.5,
  },
  navLabelInactive: {
    color: '#666666',
  },
});
