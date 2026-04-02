import { Stack } from 'expo-router';

export default function TeacherExamsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Exams' }} />
      <Stack.Screen name="new" options={{ title: 'Create Exam' }} />
      <Stack.Screen
        name="[examId]/index"
        options={{ title: 'Exam Detail' }}
      />
      <Stack.Screen
        name="[examId]/grade/[submissionId]"
        options={{ title: 'Grade Submission' }}
      />
    </Stack>
  );
}
