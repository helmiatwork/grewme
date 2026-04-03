import { Stack } from 'expo-router';

export default function LeaveRequestsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Leave Requests' }} />
    </Stack>
  );
}
