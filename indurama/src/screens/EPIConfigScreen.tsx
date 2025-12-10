import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const EPIConfigScreen: React.FC<{ onNavigateBack?: () => void }> = ({ onNavigateBack }) => {
  const [activeTab, setActiveTab] = React.useState<'calidad' | 'abastecimiento'>('calidad');
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Image source={require('../../assets/icons/arrow-left.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración EPI</Text>
        <Image source={require('../../assets/icono_indurama.png')} style={styles.logo} />
      </View>
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderTitle}>Gestión de Pesos</Text>
        <View style={styles.totalCalidadBox}>
            <View style={styles.totalCalidadLeft}>
            <Text style={styles.totalCalidadLabel}>TOTAL CALIDAD</Text>
            <Text style={styles.totalCalidadDesc}>Suma de Secciones 1-6</Text>
            </View>
            <View style={styles.totalCalidadRight}>
            <Text style={styles.totalCalidadValue}>100%</Text>
            <View style={styles.totalCalidadCheck}><Text style={{color:'#fff'}}>✓</Text></View>
            </View>
      </View>
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab==='calidad'&&styles.tabActive]} onPress={()=>setActiveTab('calidad')}><Text style={[styles.tabText,activeTab==='calidad'&&styles.tabTextActive]}>CALIDAD</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab==='abastecimiento'&&styles.tabActive]} onPress={()=>setActiveTab('abastecimiento')}><Text style={[styles.tabText,activeTab==='abastecimiento'&&styles.tabTextActive]}>ABASTECIMIENTO</Text></TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {activeTab==='calidad'? (
          <View>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionCircle}><Text style={styles.sectionCircleText}>1</Text></View>
                <View style={{flex:1}}>
                  <Text style={styles.sectionTitle}>Objetivos y Liderazgo</Text>
                  <Text style={styles.sectionSubtitle}>3 Preguntas Existentes</Text>
                </View>
                <View style={styles.sectionPercent}><Text style={styles.sectionPercentText}>15%</Text></View>
              </View>
              <View style={styles.questionBox}><Text style={styles.questionText}>Objetivos estratégicos definidos y monitoreados</Text><View style={styles.questionInput}><Text style={styles.questionInputText}>33</Text></View></View>
              <View style={styles.questionBox}><Text style={styles.questionText}>Estrategia de Mejora Continua vinculada</Text><View style={styles.questionInput}><Text style={styles.questionInputText}>33</Text></View></View>
              <View style={styles.newQuestionRow}><Text style={styles.newLabel}>New</Text><View style={styles.newInput}><Text style={styles.newInputText}>Nueva pregunta (Requisito)</Text></View><View style={styles.newPercent}><Text style={styles.newPercentText}>%</Text></View></View>
              <View style={styles.evidenceBox}><Text style={styles.evidenceText}>Evidencias esperadas</Text><TouchableOpacity style={styles.addButton}><Text style={styles.addButtonText}>+</Text></TouchableOpacity></View>
            </View>
            {["Gestión de Calidad","Desarrollo de Nuevos","Gestión de Materiales","Control de Procesos","Acciones Correctivas"].map((title,i)=>(
              <View key={i} style={styles.sectionCardSimple}>
                <View style={styles.sectionHeaderSimple}>
                  <View style={styles.sectionCircle}><Text style={styles.sectionCircleText}>{i+2}</Text></View>
                  <Text style={styles.sectionTitleSimple}>{title}</Text>
                  <View style={styles.sectionPercent}><Text style={styles.sectionPercentText}>15%</Text></View>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.createSectionButton}><Text style={styles.createSectionText}>Crear Nueva Sección en Calidad</Text></TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionCircle}><Text style={styles.sectionCircleText}>1</Text></View>
                <View style={{flex:1}}>
                  <Text style={styles.sectionTitle}>Resp. Social y Ambiente</Text>
                </View>
                <View style={styles.sectionPercent}><Text style={styles.sectionPercentText}>15%</Text></View>
              </View>
              </View>
            <View style={styles.sectionCardSimple}>
              <View style={styles.sectionHeaderSimple}>
                <View style={styles.sectionCircle}><Text style={styles.sectionCircleText}>2</Text></View>
                <Text style={styles.sectionTitleSimple}>Abastecimiento</Text>
                <View style={styles.sectionPercent}><Text style={styles.sectionPercentText}>15%</Text></View>
                
              </View>
              <View style={styles.questionBox}><Text style={styles.questionText}>8.1 Contrato de Calidad Firmado</Text><View style={styles.questionInput}><Text style={styles.questionInputText}>10</Text></View></View>
              <View style={styles.newQuestionRow}><Text style={styles.newLabel}>New</Text><View style={styles.newInput}><Text style={styles.newInputText}>8.1 Contrato de Calidad Firmado</Text></View><TouchableOpacity style={styles.addButton}><Text style={styles.addButtonText}>+</Text></TouchableOpacity></View>
            
            </View>
            <TouchableOpacity style={styles.createSectionButton}><Text style={styles.createSectionText}>Crear Nueva Sección en Abastecimiento</Text></TouchableOpacity>
          </View>
        )}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.restoreButton}><Text style={styles.restoreText}>Restaurar</Text></TouchableOpacity>
          <TouchableOpacity style={styles.saveButton}>
            <MaterialCommunityIcons name="lock" size={22} color="#fff" />
            <Text style={styles.saveButtonText}>Guardar Configuración</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#003E85', paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingHorizontal: 20, paddingBottom: 10, justifyContent: 'space-between' },
  backButton: { padding: 8 },
  backIcon: { width: 24, height: 24, tintColor: '#fff' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  logo: { width: 48, height: 48 },
  subHeader: { backgroundColor: '#003E85', paddingHorizontal: 20, paddingBottom: 10 },
  subHeaderTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  totalCalidadBox: { flexDirection: 'row', backgroundColor: 'rgba(126, 150, 176, 0.27)', borderRadius: 12, margin: 20, padding: 16, alignItems: 'center', justifyContent: 'space-between', shadowColor: 'rgba(126, 150, 176, 0.27)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  totalCalidadLeft: {},
  totalCalidadLabel: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  totalCalidadDesc: { color: '#E0E7EF', fontSize: 12 },
  totalCalidadRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalCalidadValue: { color: '#10B981', fontWeight: 'bold', fontSize: 28 },
  totalCalidadCheck: { backgroundColor: '#10B981', borderRadius: 16, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  tabs: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#E5E7EB', marginHorizontal: 20 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  content: { flex: 1, padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionCircleText: { color: '#003E85', fontWeight: 'bold', fontSize: 16 },
  sectionSubtitle: { fontSize: 13, color: '#6B7280' },
  questionText: { flex: 1, color: '#1F2937', fontSize: 14 },
  newQuestionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  newLabel: { backgroundColor: '#003E85', color: '#fff', fontWeight: 'bold', fontSize: 12, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  newInputText: { color: '#6B7280', fontSize: 14 },
  evidenceText: { flex: 1, color: '#6B7280', fontSize: 13 },
  sectionHeaderSimple: { flexDirection: 'row', alignItems: 'center' },
  bottomActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 24 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 18, borderWidth: 2, borderColor: 'rgba(0, 0, 0, 0.14)', shadowColor: '#111316ff', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  sectionCardSimple: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#E5E7EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  sectionCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2563EB' },
  sectionTitleSimple: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#60646dff', marginLeft: 8 },
  sectionPercent: { backgroundColor: '#F8F9FB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionPercentText: { color: '#2563EB', fontWeight: 'bold', fontSize: 15 },
  questionBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FB', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  questionInput: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, minWidth: 40, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  questionInputText: { color: '#2563EB', fontWeight: 'bold', fontSize: 15 },
  newInput: { flex: 1, backgroundColor: '#F8F9FB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  newPercent: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, marginLeft: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  newPercentText: { color: '#2563EB', fontWeight: 'bold', fontSize: 15 },
  evidenceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FB', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  addButton: { backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  createSectionButton: { borderWidth: 2, borderColor: 'rgba(0, 62, 133, 0.83)', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 24, backgroundColor: '#fff', borderStyle: 'dashed' },
  createSectionText: { color: 'rgba(0, 62, 133, 0.83)', fontWeight: 'bold', fontSize: 15 },
  restoreButton: { backgroundColor: '#fff', borderRadius: 8, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', flex: 1, marginRight: 12 },
  restoreText: { color: '#111', fontWeight: 'bold', fontSize: 16 },
  saveButton: { backgroundColor: '#111', borderRadius: 8, padding: 16, alignItems: 'center', flex: 2, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  tabActive: { borderBottomColor: '#2563EB' },
  tabTextActive: { color: '#2563EB', fontWeight: 'bold' },
});

export default EPIConfigScreen;
