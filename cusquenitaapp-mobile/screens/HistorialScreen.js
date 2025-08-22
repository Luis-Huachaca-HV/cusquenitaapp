import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export default function HistorialScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState('Hoy');
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    fetchHistorial();
  }, []);

  useEffect(() => {
    aplicarFiltro();
  }, [selected, allData]);

  const fetchHistorial = async () => {
    try {
      const { data: individuales, error: error1 } = await supabase
        .from('comidas')
        .select(`
        id,
        hora_registro,
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
        .order('hora_registro', { ascending: false });

      const individualesFormatted = (individuales || []).map((item) => {
        const dt = new Date(item.hora_registro);
        return {
          id: `ind-${item.id}`,
          nombre: `${item.trabajadores?.nombres || '¿?'} ${item.trabajadores?.apellidos || ''}`.trim(),
          empresa: item.trabajadores?.empresas?.nombre || 'Empresa desconocida',
          tipoComida: item.turnos?.tipo_comida || 'Tipo desconocido',
          fechaHora: `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          hora_registro: item.hora_registro, // Guardar el valor original
        };
      });

      const masivosFormatted = (masivos || []).map((item) => {
        const dt = new Date(item.hora_registro);
        return {
          id: `mas-${item.id}`,
          nombre: `${item.cantidad} comidas`,
          empresa: item.empresas?.nombre || 'Empresa desconocida',
          tipoComida: item.turnos?.tipo_comida || 'Tipo desconocido',
          fechaHora: `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          hora_registro: item.hora_registro, // Guardar el valor original
        };
      });

      const total = [...individualesFormatted, ...masivosFormatted]
        .sort((a, b) => new Date(b.hora_registro) - new Date(a.hora_registro)); // Ordenar por hora_registro

      setAllData(total);
    } catch (err) {
      console.error('Error en fetchHistorial:', err.message);
    }
  };

  const aplicarFiltro = () => {
    const now = new Date();
    let fromDate = null;

    switch (selected) {
      case 'Hoy':
        fromDate = new Date();
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'Ayer':
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 1);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'Semana':
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case 'Mes':
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
        break;
      default:
        fromDate = null;
    }

    let result = allData;

    if (selected === 'Hoy') {
      result = allData.filter(d => {
        const dt = new Date(d.hora_registro);
        return dt.toDateString() === new Date().toDateString();
      });
    } else if (selected === 'Ayer') {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      result = allData.filter(d => {
        const dt = new Date(d.hora_registro);
        return dt.toDateString() === ayer.toDateString();
      });
    } else if (fromDate) {
      result = allData.filter(d => new Date(d.hora_registro) >= fromDate);
    }

    // Ordenar por hora_registro después de filtrar
    result = result.sort((a, b) => new Date(b.hora_registro) - new Date(a.hora_registro));

    setFilteredData(result);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 2 }]}>{item.nombre}</Text>
      <Text style={styles.cell}>{item.empresa}</Text>
      <Text style={styles.cell}>{item.tipoComida}</Text>
      <Text style={styles.cell}>{item.fechaHora}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de pedidos</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filtros */}
      <View style={styles.filters}>
        {['Hoy', 'Ayer', 'Semana', 'Mes'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, selected === f && styles.filterBtnActive]}
            onPress={() => setSelected(f)}
          >
            <Text style={selected === f ? styles.filterTxtActive : styles.filterTxt}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tabla */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderTxt, { flex: 2 }]}>Nombre</Text>
        <Text style={styles.tableHeaderTxt}>Empresa</Text>
        <Text style={styles.tableHeaderTxt}>Tipo comida</Text>
        <Text style={styles.tableHeaderTxt}>Fecha y hora</Text>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  back: { fontSize: 24 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  filters: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  filterBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15,
    backgroundColor: '#f2f2f2',
  },
  filterBtnActive: { backgroundColor: '#dbe4ff' },
  filterTxt: { color: '#333' },
  filterTxtActive: { color: '#333', fontWeight: '600' },
  tableHeader: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 8,
    backgroundColor: '#eef2ff',
  },
  tableHeaderTxt: { fontWeight: 'bold', flex: 1 },
  row: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 0.5, borderColor: '#ddd',
  },
  cell: { flex: 1 },
});
