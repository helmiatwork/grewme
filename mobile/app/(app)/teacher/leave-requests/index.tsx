import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MyLeaveTab from './my-leave';
import StudentLeaveTab from './student-leave';

type Tab = 'my-leave' | 'student-leave';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'my-leave', label: 'My Leave' },
  { id: 'student-leave', label: 'Student Leave' },
];

export default function LeaveRequestsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('my-leave');

  return (
    <View style={styles.container} testID="leave-requests-screen">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leave Requests</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar} testID="leave-tab-bar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              testID={`tab-${tab.id}`}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'my-leave' ? <MyLeaveTab /> : <StudentLeaveTab />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});
