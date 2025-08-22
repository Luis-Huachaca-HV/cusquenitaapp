import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TextInput, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';

function getTurnoPorHora(turnos) {
  const now = new Date();
  const minutosActuales = now.getHours() * 60 + now.getMinutes();

  for (const turno of turnos) {
    const [hInicio, mInicio] = turno.hora_inicio.split(':').map(Number);
    const [hFin, mFin] = turno.hora_fin.split(':').map(Number);
    const minInicio = hInicio * 60 + mInicio;
    const minFin = hFin * 60 + mFin;

    if (minInicio <= minFin) {
      if (minutosActuales >= minInicio && minutosActuales <= minFin) {
        return turno.id;
      }
    } else {
      if (minutosActuales >= minInicio || minutosActuales <= minFin) {
        return turno.id;
      }
    }
  }

  return null;
}

export default function RegisterDialog({ visible, onClose, onConfirm }) {
  const [cantidad, setCantidad] = useState('');
  const [empresa, setEmpresa] = useState(null);
  const [turno, setTurno] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setCantidad('');
      setEmpresa(null);
      setTurno(null);
      fetchEmpresas();
      fetchTurnos();
    }
  }, [visible]);

  const fetchEmpresas = async () => {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al cargar empresas:', error.message);
      setEmpresas([]);
    } else {
      setEmpresas(data);
      if (empresa === null && data.length > 0) {
        setEmpresa(data[0].id);
      }
    }
  };

  const fetchTurnos = async () => {
    const { data, error } = await supabase
      .from('turnos')
      .select('id, nombre, hora_inicio, hora_fin')
      .order('hora_inicio', { ascending: true });

    if (error) {
      console.error('Error al cargar turnos:', error.message);
      setTurnos([]);
    } else {
      setTurnos(data);
      if (turno === null) {
        const idPorHora = getTurnoPorHora(data);
        if (idPorHora) setTurno(idPorHora);
      }
    }
  };

  const turnoSeleccionado = turnos.find((t) => t.id === turno);
  const empresaSeleccionada = empresas.find((e) => e.id === empresa);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Image source={require('../assets/Register.png')} style={styles.icon} />
          <Text style={styles.title}>Registrar Almuerzos</Text>
          <Text style={styles.subtitle}>Mié, 18 Junio 2025</Text>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Cantidad:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={cantidad}
              onChangeText={setCantidad}
              placeholder="Ej: 30"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Empresa:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={empresa}
                onValueChange={(val) => setEmpresa(val)}
                style={[styles.picker, { color: empresa ? '#000' : '#9ca3af' }]}
                dropdownIconColor="#000"
                mode="dropdown"
              >
                <Picker.Item label="Selecciona una empresa" value={null} color="#9ca3af" />
                {empresas.map((e) => (
                  <Picker.Item key={e.id} label={e.nombre} value={e.id} color="#000" />
                ))}
              </Picker>
            </View>
          </View>


          <View style={styles.inputRow}>
            <Text style={styles.label}>Turno:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={turno}
                onValueChange={(val) => setTurno(val)}
                style={[styles.picker, { color: turno ? '#000' : '#9ca3af' }]}
                dropdownIconColor="#000"
                mode="dropdown"
              >
                <Picker.Item label="Selecciona un turno" value={null} color="#9ca3af" />
                {turnos.map((t) => (
                  <Picker.Item key={t.id} label={t.nombre} value={t.id} color="#000" />
                ))}
              </Picker>
            </View>
          </View>


          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setConfirmVisible(true)}
              disabled={!cantidad || !empresa || !turno}
            >
              <Text style={styles.buttonText}>Aceptar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal de confirmación final */}
        <Modal visible={confirmVisible} transparent animationType="fade">
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={{ fontSize: 16, marginBottom: 10, textAlign: 'center' }}>
                ¿Confirmas registrar {cantidad} comida(s){'\n'}
                en el turno <Text style={{ fontWeight: 'bold' }}>{turnoSeleccionado?.nombre}</Text>{'\n'}
                para la empresa <Text style={{ fontWeight: 'bold' }}>{empresaSeleccionada?.nombre}</Text>?
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 }}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#aaa' }]}
                  onPress={() => setConfirmVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    setConfirmVisible(false);
                    onConfirm(parseInt(cantidad), empresa, turno);
                  }}
                >
                  <Text style={styles.buttonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContainer: {
    width: '90%', backgroundColor: '#fff',
    borderRadius: 16, padding: 20, alignItems: 'center',
  },
  icon: { width: 60, height: 60, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 15,
  },
  label: { flex: 1, fontSize: 16 },
  input: {
    flex: 2, borderBottomWidth: 1, borderColor: '#000',
    padding: 4, fontSize: 16,
  },
  pickerContainer: {
    flex: 2, borderBottomWidth: 1, borderColor: '#000',
  },
  picker: {
    height: 30, width: '100%',
  },
  buttonRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 20, width: '100%',
  },
  button: {
    backgroundColor: '#000', paddingVertical: 10,
    paddingHorizontal: 20, borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },

  confirmOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  confirmBox: {
    backgroundColor: '#fff', padding: 20,
    borderRadius: 12, width: '85%',
  },
});
