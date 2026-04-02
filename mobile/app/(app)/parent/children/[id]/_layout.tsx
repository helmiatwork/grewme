import { useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AttendanceScreen from './attendance';
import BehaviorScreen from './behavior';
import ExamsScreen from './exams';
import HealthScreen from './health';
import HistoryScreen from './history';
import ProgressScreen from './progress';
import RadarScreen from './radar';

const TABS = [
  { key: 'radar', label: 'Radar' },
  { key: 'progress', label: 'Progress' },
  { key: 'history', label: 'History' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'behavior', label: 'Behavior' },
  { key: 'exams', label: 'Exams' },
  { key: 'health', label: 'Health' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function ChildDetailLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('radar');
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={styles.container} testID="child-detail-layout">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
        testID="child-detail-tabs"
      >
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
            testID={`tab-${tab.key}`}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.content}>
        {activeTab === 'radar' && <RadarScreen id={id ?? ''} />}
        {activeTab === 'progress' && <ProgressScreen id={id ?? ''} />}
        {activeTab === 'history' && <HistoryScreen id={id ?? ''} />}
        {activeTab === 'attendance' && <AttendanceScreen id={id ?? ''} />}
        {activeTab === 'behavior' && <BehaviorScreen id={id ?? ''} />}
        {activeTab === 'exams' && <ExamsScreen id={id ?? ''} />}
        {activeTab === 'health' && <HealthScreen id={id ?? ''} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexGrow: 0,
  },
  tabBarContent: {
    paddingHorizontal: 4,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  activeTabLabel: {
    color: '#4CAF50',
  },
  content: {
    flex: 1,
  },
});
