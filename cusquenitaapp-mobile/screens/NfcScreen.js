import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Button,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Camera } from 'expo-camera';
import { CameraView } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import AlertDialog from './AlertDialog';
import RegisterDialog from './RegisterDialog';

const now = new Date();
const horaLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
const playSuccessSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/succes.mp3')
    );
    await sound.playAsync();
  } catch(error) {
    console.error("Error al reproducir sonido:", error);
  }
};

const getTurnoDesdeDB = async () => {
  const now = new Date();
  const minutos = now.getHours() * 60 + now.getMinutes();

  if (minutos >= 240 && minutos <= 510) { // 4:00 - 8:30
    return { id: 1, nombre: "Desayuno" };
  }
  if (minutos >= 690 && minutos <= 870) { // 11:30 - 14:30
    return { id: 2, nombre: "Almuerzo" };
  }
  if (minutos >= 1051 && minutos <= 1380) { // 17:31 - 23:00
    return { id: 3, nombre: "Cena" };
  }
  if ((minutos >= 511 && minutos <= 689) || (minutos >= 871 && minutos <= 1050)) {
    // 8:31 - 11:29  ó  14:31 - 17:30
    return { id: 4, nombre: "Rancho Frio" };
  }

  return { id: 4, nombre: "Rancho Frio" };
};





export default function ScannerScreen() {
  const navigation = useNavigation();
  const [recentHistory, setRecentHistory] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const [showDenied, setShowDenied] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [turnoActual, setTurnoActual] = useState('');
  const [usuarioNombre, setUsuarioNombre] = useState('');
  const [usuarioRol, setUsuarioRol] = useState('');
  const lastScanRef = useRef({ value: null, timestamp: 0 });

  // Nuevos estados para turno select y modal
  const [turnosList, setTurnosList] = useState([]);
const [selectedTurno, setSelectedTurno] = useState(null);
  const [turnoConfirmVisible, setTurnoConfirmVisible] = useState(false);
  const [trabajadorInfo, setTrabajadorInfo] = useState(null);
  const [trabajadorNoExiste, setTrabajadorNoExiste] = useState(false);

  useEffect(() => {
    fetchRecentHistory();
    
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');

        const nombre = await AsyncStorage.getItem('nombre_usuario');
        const rol = await AsyncStorage.getItem('rol');
        if (nombre) setUsuarioNombre(nombre);
        if (rol) setUsuarioRol(rol);

        // Obtener todos los turnos para picker
        //const { data: turnos, error } = await supabase.from('turnos').select('*');
        //if (error) throw error;
        //setTurnosList(turnos);

        // Obtener turno actual para mostrar y preseleccionar
        const turno = await getTurnoDesdeDB();

        console.log(turno);
        setTurnoActual(turno?.nombre || 'Turno desconocido');
        setSelectedTurno(turno || null);

      } catch (error) {
        console.error('Error en useEffect:', error.message);
      }
    })();
  }, []);

  const fetchRecentHistory = async () => {
    try {
      const { data: individuales, error: error1 } = await supabase
        .from('comidas')
        .select(`
          id,
          hora_registro,
          turno_id,
          trabajadores (
            nombres,
            apellidos,
            empresas (
              nombre
            )
          ),
          turnos (
            tipo_comida
          )
        `)
        .order('hora_registro', { ascending: false });
      if (error1) throw error1;

      const individualesFormatted = (individuales || []).map((item) => {
                const dt = new Date(item.hora_registro);

        return {
          id: `ind-${item.id}`,
          nombre: item.trabajadores
            ? `${item.trabajadores.nombres || ''} ${item.trabajadores.apellidos || ''}`.trim()
            : 'Trabajador desconocido',
          empresa: item.trabajadores?.empresas?.nombre || 'Empresa desconocida',
          tipoComida: item.turnos?.tipo_comida || 'Tipo desconocido',
          fechaHora: `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          hora_registro: item.hora_registro,
        };
      });

      const { data: masivos, error: error2 } = await supabase
        .from('comidas_terceros')
        .select(`
          id,
          hora_registro,
          cantidad,
          empresas (
            nombre
          ),
          turnos (
            tipo_comida
          )
        `)
        .order('hora_registro', { ascending: false })
        .limit(20);

      if (error2) throw error2;

      const masivosFormatted = (masivos || []).map((item) => {
                const dt = new Date(item.hora_registro);

        return {
          
          id: `mas-${item.id}`,
          nombre: `${item.cantidad} comidas`,
          empresa: item.empresas?.nombre || 'Empresa desconocida',
          tipoComida: item.turnos?.tipo_comida || 'Tipo desconocido',
          fechaHora: `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          hora_registro: item.hora_registro,
        };
      });

      // Función para formatear fecha y hora
      function formatFechaHora(hora_registro) {
        const dt = new Date(hora_registro);
        return `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      }

      const combined = [...individualesFormatted, ...masivosFormatted]
        .sort((a, b) => new Date(b.hora_registro) - new Date(a.hora_registro))
        .slice(0, 10);

      setRecentHistory(combined);
    } catch (err) {
      console.error('Error en fetchRecentHistory:', err.message);
    }
  };

  const handleBarcodeScanned = async ({ data }) => {
    const cleaned = data.trim();
    const now = Date.now();

    if (cleaned.length !== 8 || /\D/.test(cleaned)) return;
    if (lastScanRef.current.value === cleaned && now - lastScanRef.current.timestamp < 3000) return;

    lastScanRef.current = { value: cleaned, timestamp: now };
    setScannedData(cleaned);

    // Consultar trabajador por DNI
    try {
      const { data: trabajador, error } = await supabase
        .from('trabajadores')
        .select('nombres, apellidos, empresa_id, empresas (nombre)')
        .eq('dni', cleaned)
        .maybeSingle();

      if (error || !trabajador) {
        setTrabajadorInfo(null);
        setTrabajadorNoExiste(true);
      } else {
        setTrabajadorInfo({
          nombres: trabajador.nombres,
          apellidos: trabajador.apellidos,
          empresa: trabajador.empresas?.nombre || 'Empresa desconocida',
        });
        setTrabajadorNoExiste(false);
      }
    } catch (err) {
      setTrabajadorInfo(null);
      setTrabajadorNoExiste(true);
    }

    setTurnoConfirmVisible(true); // Abrir modal para seleccionar turno
  };

  const confirmTurnoAndRegister = async () => {
    setTurnoConfirmVisible(false);
    try {
      if (!selectedTurno) throw new Error('Debe seleccionar un turno válido');

      const today = new Date().toISOString().slice(0, 10);
      const usuarioId = await AsyncStorage.getItem('usuario_id');
      if (!usuarioId) throw new Error('Usuario no autenticado');

      const { data: trabajador, error: trabajadorError } = await supabase
        .from('trabajadores')
        .select('id, estado, limite_comidas_diario')
        .eq('dni', scannedData)
        .maybeSingle();

      if (trabajadorError || !trabajador || trabajador.estado !== 'activo') {
        setShowDenied(true);
        return;
      }

      const { count, error: countError } = await supabase
        .from('comidas')
        .select('*', { count: 'exact', head: true })
        .eq('trabajador_id', trabajador.id)
        .eq('fecha', today);

      if (countError) throw countError;
      if (count >= trabajador.limite_comidas_diario) {
        setShowLimit(true);
        return;
      }

      const { data: comida, error: insertError } = await supabase
        .from('comidas')
        .insert({
          trabajador_id: trabajador.id,
          turno_id: selectedTurno.id,
          fecha: today,
          estado: 'registrado',
          registrado_por: Number(usuarioId),
          hora_registro: horaLocal,
          validado: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await supabase.from('historial_pedidos').insert({
        usuario_id: Number(usuarioId),
        tipo_pedido: 'individual',
        comida_id: comida.id,
      });
    // ✅ Aquí cierras la cámara
    playSuccessSound();
    
    setShowCamera(false);
    setShowSuccess(true);
      fetchRecentHistory();
    } catch (err) {
          setShowCamera(false);

      setShowLimit(true);
      console.error('Error en confirmTurnoAndRegister:', err.message);
    }
  };

  const cancelScan = () => {
    setTurnoConfirmVisible(false);
    setScannedData(null);
  };

  // Encabezado de columnas
  const HistoryHeaderRow = () => (
    <View style={[styles.row, { backgroundColor: '#eef2ff' }]}>
      <Text style={[styles.rowName, { fontWeight: 'bold' }]}>Nombre</Text>
      <Text style={[styles.rowName, { fontWeight: 'bold' }]}>Empresa</Text>
      <Text style={[styles.rowName, { fontWeight: 'bold' }]}>Tipo comida</Text>
      <Text style={[styles.rowHour, { fontWeight: 'bold' }]}>Fecha y hora</Text>
    </View>
  );

  // Render de cada fila
  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.rowName}>{item.nombre}</Text>
      <Text style={styles.rowName}>{item.empresa}</Text>
      <Text style={styles.rowName}>{item.tipoComida}</Text>
    <Text style={styles.rowHour}>{item.fechaHora}</Text>
    </View>
  );

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  if (hasPermission === null) return <Text>Solicitando permiso de cámara...</Text>;
  if (hasPermission === false) return <Text>No se otorgó permiso para la cámara</Text>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Botón de cerrar sesión */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerName}>{usuarioNombre || 'Usuario'}</Text>
          <Text style={styles.headerSub}>{usuarioRol || 'Rol'} • Mozo</Text>
          <Text style={styles.turnoInfo}>Turno actual: {turnoActual}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Historial')}>
          <Text style={styles.openIcon}>historial</Text>
        </TouchableOpacity>
      </View>

      {/* Botón NUEVO: Registrar trabajador */}
      <TouchableOpacity
        style={styles.registerWorkerButton}
        onPress={() => navigation.navigate('RegistroTrabajador')}
      >
        <Text style={styles.registerWorkerButtonText}>Registrar Nuevo Trabajador</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.nfcCard} onPress={() => {
        setShowCamera(true);
        setScannedData(null);
      }}>
        <Text style={styles.nfcTitle}>Escanear Código</Text>
        <Text style={styles.nfcIcon}>📷</Text>
        <Text style={styles.hint}>Toca para activar la cámara</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.massButton} onPress={() => setShowRegisterModal(true)}>
        <Text style={styles.massButtonText}>Registrar Almuerzo Masivo</Text>
      </TouchableOpacity>

      <View style={styles.historyHeader}>
  <Text style={styles.historyTitle}>Historial de pedidos</Text>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <TouchableOpacity onPress={fetchRecentHistory} style={styles.refreshButton}>
      <Text style={styles.refreshButtonText}>Actualizar</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => navigation.navigate('Historial')}>
      <Text style={styles.historyFullLink}>Abrir ➜</Text>
    </TouchableOpacity>
  </View>
</View>


      {/* Agrega el encabezado de columnas antes del FlatList */}
      <HistoryHeaderRow />

      {recentHistory.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 10 }}>No hay historial reciente</Text>
      ) : (
        <FlatList
          data={recentHistory}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          style={{ flexGrow: 0 }}
        />
      )}

      {/* MODALS */}
      <AlertDialog visible={showSuccess} onClose={() => setShowSuccess(false)} onConfirm={() => setShowSuccess(false)} title="Almuerzo registrado" subtitle="¡Éxito!" date="" icon={require('../assets/Success.png')} />
      <AlertDialog visible={showLimit} onClose={() => setShowLimit(false)} onConfirm={() => setShowLimit(false)} title="Límite diario alcanzado" subtitle="El trabajador ya comió 3 veces hoy" icon={require('../assets/Limit.png')} showDate={false} />
      <AlertDialog visible={showDenied} onClose={() => setShowDenied(false)} onConfirm={() => setShowDenied(false)} title="Trabajador no autorizado" subtitle="Código inválido o estado inactivo" icon={require('../assets/Denied.png')} showDate={false} />

      <RegisterDialog
        visible={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onConfirm={async (cantidad, empresaId, turnoId) => {
          setShowRegisterModal(false);
          try {
            const usuarioId = await AsyncStorage.getItem('usuario_id');
            if (!usuarioId) throw new Error('Usuario no autenticado');

            const today = new Date().toISOString().slice(0, 10);

            // Verifica duplicados (empresa + turno + fecha)
            const { data: existente, error: checkError } = await supabase
              .from('comidas_terceros')
              .select('id')
              .eq('empresa_id', Number(empresaId))
              .eq('turno_id', Number(turnoId))
              .eq('fecha', today)
              .maybeSingle();

            if (checkError) throw checkError;
            if (existente) throw new Error('Ya existe un registro para esta empresa y turno hoy');

            const { data: comidaTercero, error: insertError } = await supabase
              .from('comidas_terceros')
              .insert({
                empresa_id: Number(empresaId),
                cantidad: Number(cantidad),
                turno_id: Number(turnoId),
                fecha: today,
                registrado_por: Number(usuarioId),
                hora_registro: horaLocal,
              })
              .select()
              .single();

            if (insertError) throw insertError;

            await supabase.from('historial_pedidos').insert({
              usuario_id: Number(usuarioId),
              tipo_pedido: 'masivo',
              comida_tercero_id: comidaTercero.id,
            });

            setShowSuccess(true);
            fetchRecentHistory();
            playSuccessSound();
                setShowCamera(false);   // 📷 Cierra cámara


          } catch (err) {
            console.error('Error al registrar comida masiva:', err.message);
            setShowDenied(true);
          }
        }}
      />

      <Modal visible={showCamera} animationType="fade">
        <View style={{ flex: 1 }}>
          <CameraView
            onBarcodeScanned={scannedData ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['code128', 'code39'] }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.overlayBox} />
          <View style={{ position: 'absolute', bottom: 30, alignSelf: 'center' }}>
            <Button title="Cancelar" onPress={() => setShowCamera(false)} />
          </View>
        </View>
      </Modal>

      {/* Modal para confirmar turno y mostrar info del trabajador */}
      <Modal visible={turnoConfirmVisible} transparent animationType="slide">
        <View style={styles.confirmContainer}>
          <View style={styles.confirmBox}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>¿Turno correcto?</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>{scannedData}</Text>

            {trabajadorInfo ? (
              <>
                <Text style={{ fontSize: 16, marginBottom: 4 }}>
                  <Text style={{ fontWeight: 'bold' }}>Nombre:</Text> {trabajadorInfo.nombres} {trabajadorInfo.apellidos}
                </Text>
                <Text style={{ fontSize: 16, marginBottom: 10 }}>
                  <Text style={{ fontWeight: 'bold' }}>Empresa:</Text> {trabajadorInfo.empresa}
                </Text>
              </>
                        ) : trabajadorNoExiste ? (
              <>
                <Text style={{ color: 'red', marginBottom: 10 }}>
                  Trabajador no registrado en la base de datos.
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Button
                    title="Cancelar"
                    onPress={cancelScan}
                  />
                  <Button
                    title="Registrar Nuevo Trabajador"
                    onPress={() => {
                      setTurnoConfirmVisible(false);
                      navigation.navigate('RegistroTrabajador');
                    }}
                  />
                </View>
              </>
            ) : null}

            {trabajadorInfo && (
              <>
                <View style={styles.pickerWrapper}>
                  <View style={styles.pickerWrapper}>
 <Picker
  selectedValue={selectedTurno ? selectedTurno.id : null}
  onValueChange={(itemValue) => {
    const turnoSeleccionado = {
      id: itemValue,
      nombre:
        itemValue === 1
          ? "Desayuno"
          : itemValue === 2
          ? "Almuerzo"
          : itemValue === 3
          ? "Cena"
          : "Rancho Frio",
    };
    setSelectedTurno(turnoSeleccionado);
    setTurnoActual(turnoSeleccionado.nombre);
  }}
>
  <Picker.Item label="Desayuno" value={1} />
  <Picker.Item label="Almuerzo" value={2} />
  <Picker.Item label="Cena" value={3} />
  <Picker.Item label="Rancho Frio" value={4} />
</Picker>

</View>

                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Button title="❌ Reintentar" onPress={cancelScan} />
                  <Button title="✅ Confirmar" onPress={confirmTurnoAndRegister} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  registerWorkerButton: {
    backgroundColor: '#007bff',
    paddingVertical: 6,           // reducido
    paddingHorizontal: 18,        // reducido
    borderRadius: 15,             // reducido
    alignSelf: 'center',
    marginVertical: 10,           // reducido
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // reducido
    shadowOpacity: 0.2,           // reducido
    shadowRadius: 2,              // reducido
    elevation: 3,                 // reducido
  },
  registerWorkerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,                 // reducido
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  headerName: { fontWeight: 'bold' },
  headerSub: { color: '#555' },
  openIcon: { fontSize: 22 },
  turnoInfo: { color: '#003366', fontWeight: 'bold', marginTop: 2 },
  nfcCard: { alignSelf: 'center', marginTop: 20, width: '80%', height: 200, borderRadius: 15, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  nfcTitle: { fontSize: 22, marginBottom: 10 },
  nfcIcon: { fontSize: 40 },
  hint: { fontSize: 12, color: '#666', marginTop: 6 },
  massButton: { backgroundColor: '#000', alignSelf: 'center', marginVertical: 20, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  massButtonText: { color: '#fff', fontWeight: 'bold' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20 },
  historyTitle: { fontWeight: 'bold' },
  historyFullLink: { fontWeight: 'bold', color: '#003366' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8, borderBottomColor: '#eee', borderBottomWidth: 1 },
  rowName: { flex: 1 },
  rowHour: { width: 60, textAlign: 'right' },
  overlayBox: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    height: '50%',
    borderWidth: 3,
    borderColor: '#0ff',
    borderRadius: 15,
  },
  confirmContainer: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    width: '100%',
  },
  logoutContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: -8,
  },
  logoutButton: {
    backgroundColor: '#eee',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    elevation: 2,
  },
  logoutText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  refreshButton: {
  backgroundColor: '#007bff',
  paddingVertical: 4,
  paddingHorizontal: 10,
  borderRadius: 8,
  marginRight: 10,
},
refreshButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 12,
},

});
