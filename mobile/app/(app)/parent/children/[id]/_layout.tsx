import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import HistoryScreen from './history';
import ProgressScreen from './progress';
import RadarScreen from './radar';

const TABS = [
  { key: 'radar', label: 'Radar' },
  { key: 'progress', label: 'Progress' },
  { key: 'history', label: 'History' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function ChildDetailLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('radar');

  return (
    <View style={styles.container} testID="child-detail-layout">
      <View style={styles.tabBar} testID="child-detail-tabs">
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
      </View>
      <View style={styles.content}>
        {activeTab === 'radar' && <RadarScreen id={id ?? ''} />}
        {activeTab === 'progress' && <ProgressScreen id={id ?? ''} />}
        {activeTab === 'history' && <HistoryScreen id={id ?? ''} />}
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
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
