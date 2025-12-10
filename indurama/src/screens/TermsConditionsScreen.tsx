import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export const TermsConditionsScreen: React.FC<{ onAccept?: () => void; onReject?: () => void }> = ({ onAccept, onReject }) => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBox}>
          <Image source={require('../../assets/icons/terms.png')} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>TÉRMINOS Y CONDICIONES</Text>
        </View>
        <View style={styles.termsBox}>
          <Text style={styles.termsText}>
            {`
TÉRMINOS Y CONDICIONES DE USO PLATAFORMA DE GESTIÓN DE PROVEEDORES – INDURAMA
Última actualización: 26 de Noviembre de 2024
1. INTRODUCCIÓN Y ACEPTACIÓN
Bienvenido a la Plataforma de Gestión de Proveedores de Indurama. Esta aplicación, desarrollada tecnológicamente por JESKI Tech, es propiedad exclusiva de INDURAMA.
El acceso y uso de LA PLATAFORMA, disponible en sus versiones Web y Móvil, implica la aceptación plena y sin reservas de los presentes Términos y Condiciones.
Si usted no está de acuerdo con estos términos, deberá abstenerse de utilizar el sistema.
            `}
          </Text>
          <Text style={styles.linkText}>Ver más</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.rejectButton} onPress={onReject}><Text style={styles.buttonText}>RECHAZAR</Text></TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={onAccept}><Text style={styles.buttonText}>ACEPTAR</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  headerBox: { backgroundColor: '#003E85', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24 },
  headerIcon: { width: 64, height: 64, marginBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  termsBox: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB', padding: 24, marginBottom: 24 },
  termsText: { color: '#222', fontSize: 15, marginBottom: 16 },
  linkText: { color: '#003E85', fontWeight: 'bold', fontSize: 15, marginBottom: 18 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rejectButton: { backgroundColor: '#E53935', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginRight: 8 },
  acceptButton: { backgroundColor: '#003E85', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginLeft: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default TermsConditionsScreen;
