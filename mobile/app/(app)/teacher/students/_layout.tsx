import { Stack } from 'expo-router';

export default function StudentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Students' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Student Detail' }} />
      <Stack.Screen name="bulk-score" options={{ title: 'Bulk Score' }} />
      <Stack.Screen name="[id]/behavior" options={{ title: 'Behavior' }} />
      <Stack.Screen name="[id]/health" options={{ title: 'Health' }} />
    </Stack>
  );
}
