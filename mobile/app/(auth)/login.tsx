import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthStore } from '../../src/auth/store';
import { useLoginMutation } from '../../src/graphql/generated/graphql';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'parent' | 'teacher'>('parent');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loginMutation, { loading }] = useLoginMutation();

  async function handleLogin() {
    setErrorMessage(null);

    try {
      const { data } = await loginMutation({
        variables: { email, password, role },
      });

      if (!data) {
        setErrorMessage('No response from server');
        return;
      }

      const { login } = data;

      if (login.errors.length > 0) {
        setErrorMessage(login.errors[0].message);
        return;
      }

      const user = login.user;
      if (!user || !login.accessToken) {
        setErrorMessage('Invalid login response');
        return;
      }

      const typename = user.__typename;

      if (typename !== 'TeacherType' && typename !== 'ParentType') {
        setErrorMessage('This account type is not supported in this app');
        return;
      }

      const userType = typename === 'TeacherType' ? 'teacher' : 'parent';
      useAuthStore.getState().setAuth(login.accessToken, userType);

      if (userType === 'parent') {
        router.replace('/(app)/parent/children');
      } else {
        router.replace('/(app)/teacher');
      }
    } catch (e) {
      setErrorMessage(
        e instanceof Error ? e.message : 'An unexpected error occurred'
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GrewMe</Text>

      <View style={styles.roleToggle}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'parent' && styles.roleActive]}
          onPress={() => setRole('parent')}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.roleText,
              role === 'parent' && styles.roleTextActive,
            ]}
          >
            Parent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'teacher' && styles.roleActive]}
          onPress={() => setRole('teacher')}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.roleText,
              role === 'teacher' && styles.roleTextActive,
            ]}
          >
            Teacher
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="email-input"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="password-input"
      />

      {errorMessage && (
        <Text style={styles.error} testID="error-message">
          {errorMessage}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
        testID="login-button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
    color: '#1a1a1a',
  },
  roleToggle: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  roleActive: {
    backgroundColor: '#4f46e5',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  roleTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
