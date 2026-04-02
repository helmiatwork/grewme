import { Stack } from 'expo-router';

export default function CalendarLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Calendar' }} />
    </Stack>
  );
}
