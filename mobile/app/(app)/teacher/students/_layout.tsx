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
    </Stack>
  );
}
