// screens/AlertDialog.js
import React from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity } from 'react-native';


export default function AlertDialog({ visible, onClose, title, subtitle, icon, date, onConfirm, showDate = true }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image source={icon} style={styles.icon} resizeMode="contain" />
          <Text style={styles.title}>{title}</Text>
          {showDate && <Text style={styles.subtitle}>{subtitle}</Text>}
          {date && <Text style={styles.date}>{date}</Text>}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.btn} onPress={onConfirm}><Text style={styles.btnText}>Aceptar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose}><Text style={styles.btnText}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)'
  },
  card: {
    backgroundColor: '#fff', padding: 20, borderRadius: 15,
    width: '80%', alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25,
    shadowRadius: 4, elevation: 5,
  },
  icon: { width: 60, height: 60, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subtitle: { textAlign: 'center', fontSize: 14, color: '#333' },
  date: { marginTop: 10, fontSize: 16, fontWeight: 'bold' },
  buttons: {
    flexDirection: 'row', justifyContent: 'space-around', marginTop: 20,
    width: '100%',
  },
  btn: {
    flex: 1, padding: 12, marginHorizontal: 5,
    backgroundColor: '#000', borderRadius: 8,
  },
  cancel: { backgroundColor: '#999' },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});

// Usa este componente así:
/*
<AlertDialog
  visible={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={registrarAlmuerzo}
  title="Almuerzo registrado"
  subtitle="Mié, 18 Junio 2025"
  date="Hora de registro: 13:52"
  icon={require('../assets/success.png')}
/>
*/
