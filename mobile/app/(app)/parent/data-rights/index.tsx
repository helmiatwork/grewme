import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ErrorState from '../../../../src/components/ErrorState';
import LoadingState from '../../../../src/components/LoadingState';
import {
  useExportChildDataMutation,
  useMyChildrenQuery,
  useRequestAccountDeletionMutation,
  useRequestChildDataDeletionMutation,
} from '../../../../src/graphql/generated/graphql';

export default function DataRightsScreen() {
  const { data, loading, error } = useMyChildrenQuery();
  const [exportChildData, { loading: exporting }] =
    useExportChildDataMutation();
  const [requestChildDataDeletion, { loading: deleting }] =
    useRequestChildDataDeletionMutation();
  const [requestAccountDeletion, { loading: requestingDeletion }] =
    useRequestAccountDeletionMutation();
  const [busyChildId, setBusyChildId] = useState<string | null>(null);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  const children = data?.myChildren ?? [];

  const handleExportData = (childId: string, childName: string) => {
    Alert.alert(
      'Export Data',
      `Export all data for ${childName}? You will receive a JSON export of their learning records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setBusyChildId(childId);
            try {
              const result = await exportChildData({
                variables: { studentId: childId },
              });
              const errors = result.data?.exportChildData?.errors ?? [];
              if (errors.length > 0) {
                Alert.alert('Error', errors[0].message);
              } else {
                Alert.alert(
                  'Export Complete',
                  `Data for ${childName} has been exported successfully.`
                );
              }
            } catch (e: unknown) {
              const msg =
                e instanceof Error ? e.message : 'Failed to export data';
              Alert.alert('Error', msg);
            } finally {
              setBusyChildId(null);
            }
          },
        },
      ]
    );
  };

  const handleRequestDeletion = (childId: string, childName: string) => {
    Alert.alert(
      'Delete Child Data',
      `This will permanently delete all learning data for ${childName} including daily scores, exam submissions, and mastery records. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              `Are you absolutely sure? All data for ${childName} will be permanently removed.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    setBusyChildId(childId);
                    try {
                      const result = await requestChildDataDeletion({
                        variables: { studentId: childId },
                      });
                      const errors =
                        result.data?.requestChildDataDeletion?.errors ?? [];
                      if (errors.length > 0) {
                        Alert.alert('Error', errors[0].message);
                      } else {
                        Alert.alert(
                          'Data Deleted',
                          `All learning data for ${childName} has been deleted.`
                        );
                      }
                    } catch (e: unknown) {
                      const msg =
                        e instanceof Error
                          ? e.message
                          : 'Failed to delete data';
                      Alert.alert('Error', msg);
                    } finally {
                      setBusyChildId(null);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleAccountDeletion = () => {
    Alert.alert(
      'Delete Account',
      'This will submit a request to delete your entire account and all associated data. A grace period will apply before the deletion is processed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await requestAccountDeletion();
              const errors = result.data?.requestAccountDeletion?.errors ?? [];
              if (errors.length > 0) {
                Alert.alert('Error', errors[0].message);
              } else {
                const gracePeriod =
                  result.data?.requestAccountDeletion?.deletionRequest
                    ?.gracePeriodEndsAt;
                Alert.alert(
                  'Request Submitted',
                  `Your account deletion request has been submitted.${
                    gracePeriod
                      ? ` Grace period ends: ${new Date(gracePeriod).toLocaleDateString()}`
                      : ''
                  }`
                );
              }
            } catch (e: unknown) {
              const msg =
                e instanceof Error ? e.message : 'Failed to request deletion';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const renderChild = ({ item }: { item: { id: string; name: string } }) => {
    const isBusy = busyChildId === item.id;

    return (
      <View style={styles.childCard} testID={`child-card-${item.id}`}>
        <Text style={styles.childName}>{item.name}</Text>

        <Pressable
          style={[styles.actionButton, styles.exportButton]}
          onPress={() => handleExportData(item.id, item.name)}
          disabled={isBusy}
          testID={`export-button-${item.id}`}
        >
          {isBusy && exporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="download-outline"
                size={18}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.actionButtonText}>Export Data</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.deleteDataButton]}
          onPress={() => handleRequestDeletion(item.id, item.name)}
          disabled={isBusy}
          testID={`delete-data-button-${item.id}`}
        >
          {isBusy && deleting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="trash-outline"
                size={18}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.actionButtonText}>Delete Learning Data</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container} testID="data-rights-screen">
      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark-outline" size={24} color="#1565C0" />
        <Text style={styles.infoText}>
          Under COPPA, you have the right to review, export, and request
          deletion of your child's data collected by this application.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Your Children</Text>

      {children.length === 0 ? (
        <View style={styles.emptyState} testID="data-rights-empty">
          <Text style={styles.emptyText}>
            No children linked to your account
          </Text>
        </View>
      ) : (
        <FlatList
          data={children}
          keyExtractor={(item) => item.id}
          renderItem={renderChild}
          contentContainerStyle={styles.list}
          testID="children-list"
        />
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Account</Text>
      <Pressable
        style={[styles.actionButton, styles.accountDeleteButton]}
        onPress={handleAccountDeletion}
        disabled={requestingDeletion}
        testID="account-deletion-button"
      >
        {requestingDeletion ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons
              name="person-remove-outline"
              size={18}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.actionButtonText}>
              Request Account Deletion
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  list: {
    paddingBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  exportButton: {
    backgroundColor: '#1565C0',
  },
  deleteDataButton: {
    backgroundColor: '#E65100',
  },
  accountDeleteButton: {
    backgroundColor: '#C62828',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
  },
});
