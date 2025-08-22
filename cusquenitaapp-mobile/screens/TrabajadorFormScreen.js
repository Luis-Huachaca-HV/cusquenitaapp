import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Button, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';

export default function TrabajadorFormScreen({ navigation, route }) {
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState(null);
  const [dni, setDni] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [rol, setRol] = useState('trabajador');
  const [limiteComidas, setLimiteComidas] = useState('3');
  const [estado, setEstado] = useState('Activo');
  const { setShowCamera } = route.params || {};


  useEffect(() => {
    fetchEmpresas();
  }, []);

  async function fetchEmpresas() {
    const { data, error } = await supabase.from('empresas').select('id, nombre').order('nombre');
    if (error) {
      Alert.alert('Error', 'No se pudieron cargar las empresas');
      return;
    }
    setEmpresas(data);
    if (data.length > 0) setEmpresaId(data[0].id);
  }

  function validarDNI(dni) {
    return /^\d{8}$/.test(dni);
  }

  async function handleSubmit() {
    if (!empresaId) {
      Alert.alert('Error', 'Debe seleccionar una empresa');
      return;
    }
    if (!validarDNI(dni)) {
      Alert.alert('Error', 'El DNI debe tener 8 dígitos numéricos');
      return;
    }
    if (!nombres.trim()) {
      Alert.alert('Error', 'Ingrese los nombres');
      return;
    }
    if (!apellidos.trim()) {
      Alert.alert('Error', 'Ingrese los apellidos');
      return;
    }
    if (!rol.trim()) {
      Alert.alert('Error', 'Ingrese un rol válido');
      return;
    }
    const limite = parseInt(limiteComidas);
    if (isNaN(limite) || limite <= 0) {
      Alert.alert('Error', 'Límite de comidas debe ser un número positivo');
      return;
    }
    if (estado !== 'Activo' && estado !== 'Inactivo') {
      Alert.alert('Error', 'Estado inválido');
      return;
    }

    // Insertar en DB
    // Antes de insertar
try {
  const { data: existe, error: errorBuscar } = await supabase
    .from('trabajadores')
    .select('dni')
    .eq('dni', dni)
    .maybeSingle();

  if (errorBuscar) throw errorBuscar;

  if (existe) {
    alert('Ya existe un trabajador con ese DNI');
    return;
  }

  const { error: insertError } = await supabase
    .from('trabajadores')
    .insert({
      empresa_id: empresaId,
      dni,
      nombres,
      apellidos,
      rol,
      limite_comidas_diario: limite,
      estado: estado.toLowerCase(),
    });

  if (insertError) throw insertError;

  alert('Trabajador registrado con éxito');
// 🚀 Cierra cámara si existe
  if (setShowCamera) {
    setShowCamera(false);
  }
  navigation.goBack();
} catch (err) {
  alert('Error al registrar el trabajador: ' + err.message);
}}

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registro de nuevo trabajador</Text>

      <Text style={styles.label}>Empresa:</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={empresaId}
          onValueChange={itemValue => setEmpresaId(itemValue)}
          mode="dropdown"
        >
          {empresas.map(e => (
            <Picker.Item key={e.id} label={e.nombre} value={e.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>DNI</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingrese DNI (8 dígitos)"
        keyboardType="numeric"
        maxLength={8}
        value={dni}
        onChangeText={setDni}
      />

      <Text style={styles.label}>Nombres</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Juan Carlos"
        value={nombres}
        onChangeText={setNombres}
      />

      <Text style={styles.label}>Apellidos</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Pérez García"
        value={apellidos}
        onChangeText={setApellidos}
      />

      <Text style={styles.label}>Rol</Text>
      <TextInput
        style={styles.input}
        value={rol}
        onChangeText={setRol}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Límite de Comidas</Text>
      <TextInput
        style={styles.input}
        value={limiteComidas}
        keyboardType="numeric"
        onChangeText={setLimiteComidas}
      />

      <Text style={styles.label}>Estado</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={estado}
          onValueChange={itemValue => setEstado(itemValue)}
          mode="dropdown"
        >
          <Picker.Item label="Activo" value="Activo" />
          <Picker.Item label="Inactivo" value="Inactivo" />
        </Picker>
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="Registrar" onPress={handleSubmit} />
      </View>
       {/* 🔙 Botón Volver manual */}
      <View style={{ marginTop: 10 }}>
        <Button title="Volver" color="gray" onPress={() => navigation.goBack()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    marginTop: 10,
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 40,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 5,
  },

});
