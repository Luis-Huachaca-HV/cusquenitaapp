// screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const usuarioId = await AsyncStorage.getItem('usuario_id');
      if (usuarioId) {
        navigation.replace('Nfc');
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    setError('');

    const { data, error: dbError } = await supabase
      .from('usuarios')
      .select('id, nombre_usuario, contraseña_hash, rol, empresa_id')
      .eq('nombre_usuario', usuario)
      .maybeSingle();

    if (dbError || !data) {
      setError('Usuario no encontrado');
      return;
    }

    const match = await bcrypt.compare(pass, data.contraseña_hash);
    if (!match) {
      setError('Contraseña incorrecta');
      return;
    }

    // ✅ Guardar datos de sesión en AsyncStorage
    await AsyncStorage.setItem('usuario_id', String(data.id));
    await AsyncStorage.setItem('nombre_usuario', data.nombre_usuario);
    await AsyncStorage.setItem('rol', data.rol || '');
    await AsyncStorage.setItem('empresa_id', data.empresa_id ? String(data.empresa_id) : '');

    navigation.replace('Nfc');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={require('../assets/app_logo.png')} style={styles.logo} />

        <Text style={styles.title}>Ingresa tus credenciales</Text>

        <TextInput
          placeholder="Usuario"
          value={usuario}
          onChangeText={setUsuario}
          style={styles.input}
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Contraseña"
            value={pass}
            onChangeText={setPass}
            secureTextEntry={!showPass}
            style={styles.inputPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Text style={styles.eye}>{showPass ? 'Ocultar' : 'Mostrar'}</Text>
          </TouchableOpacity>
        </View>

        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Ingresar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    flexGrow: 1,
  },
  logo: { width: 100, height: 100, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    paddingRight: 10,
  },
  inputPassword: {
    flex: 1,
    padding: 12,
  },
  eye: {
    fontSize: 18,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#003366',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
