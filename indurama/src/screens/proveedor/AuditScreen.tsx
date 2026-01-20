import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Image,
  TextInput,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../styles/theme';

interface AuditScreenProps {
  supplierId: string;
  onNavigateBack?: () => void;
}

interface Question {
  id: string;
  number: string;
  text: string;
  points: number;
  providerStatus: 'SI CUMPLE' | 'NO CUMPLE';
  validationStatus: 'Cumple' | 'No Cumple';
  recalibration: number;
  evidenceRequired: boolean;
  evidenceDescription: string;
  pdfFile?: string;
}

const AuditScreen: React.FC<AuditScreenProps> = ({
  supplierId,
  onNavigateBack,
}) => {
  const [activeTab, setActiveTab] = useState<'CALIDAD' | 'ABASTECIMIENTO'>('CALIDAD');
  
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      number: '2.1',
      text: '¿Dispone de certificaciones de SGC (ISO 9001)?',
      points: 15,
      providerStatus: 'SI CUMPLE',
      validationStatus: 'No Cumple',
      recalibration: 0,
      evidenceRequired: true,
      evidenceDescription: 'Describa por qué no cumple',
      pdfFile: 'ISO_9001.pdf',
    },
    {
      id: '2',
      number: '5.10',
      text: '¿Se aplican herramientas estandarizadas 5s?',
      points: 15,
      providerStatus: 'SI CUMPLE',
      validationStatus: 'Cumple',
      recalibration: 0,
      evidenceRequired: false,
      evidenceDescription: '',
      pdfFile: 'ISO_9001.pdf',
    },
  ]);

  const toggleValidation = (id: string) => {
    setQuestions(questions.map(q => 
      q.id === id 
        ? { ...q, validationStatus: q.validationStatus === 'Cumple' ? 'No Cumple' : 'Cumple' }
        : q
    ));
  };

  const autoScore = 88;
  const auditScore = 82;
  const scoreDiff = -6;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Image source={require('../../../assets/icons/arrow-left.png')} style={styles.backIcon} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Auditoría</Text>
            <Text style={styles.headerSubtitle}>Proveedor: Tornillos S.A.</Text>
          </View>

          <TouchableOpacity>
            <Image source={require('../../../assets/icono_indurama.png')} style={styles.settingsIcon} />
          </TouchableOpacity>
        </View>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreSection}>
            <Text style={styles.scoreLabel}>AUTOEVALUACIÓN</Text>
            <Text style={styles.scoreValue}>{autoScore}</Text>
          </View>
          
          <View style={styles.scoreCenter}>
            <Text style={styles.recalibrating}>Recalibrando</Text>
            <Image source={require('../../../assets/icons/arrow-right.png')} style={styles.arrowIcon} />
          </View>
          
          <View style={styles.scoreSection}>
            <Text style={[styles.scoreLabel, styles.scoreLabelGreen]}>PUNTUACIÓN{' \n'}AUDITORÍA</Text>
            <Text style={styles.scoreValue}>{auditScore}</Text>
            <View style={styles.scoreDiffBadge}>
              <Text style={styles.scoreDiffText}>{scoreDiff} Pts</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'CALIDAD' && styles.tabActive]}
            onPress={() => setActiveTab('CALIDAD')}
          >
            <Text style={[styles.tabText, activeTab === 'CALIDAD' && styles.tabTextActive]}>
              CALIDAD
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'ABASTECIMIENTO' && styles.tabActive]}
            onPress={() => setActiveTab('ABASTECIMIENTO')}
          >
            <Text style={[styles.tabText, activeTab === 'ABASTECIMIENTO' && styles.tabTextActive]}>
              ABASTECIMIENTO
            </Text>
          </TouchableOpacity>
        </View>

        {/* Questions List */}
        {questions.map((question) => (
          <View 
            key={question.id} 
            style={[
              styles.questionCard,
              question.validationStatus === 'No Cumple' && styles.questionCardError
            ]}
          >
            {/* Question Header */}
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>{question.number} {question.text}</Text>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{question.points} pts</Text>
              </View>
            </View>

            {/* Provider Status */}
            <View style={styles.providerStatus}>
              <Text style={styles.providerLabel}>PROVEEDOR DECLARÓ:</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{question.providerStatus}</Text>
              </View>
            </View>

            {/* PDF Link */}
            {question.pdfFile && (
              <TouchableOpacity style={styles.pdfLink}>
                <Image source={require('../../../assets/icons/document.png')} style={styles.pdfIcon} />
                <Text style={styles.pdfText}>{question.pdfFile}</Text>
              </TouchableOpacity>
            )}

            {/* Validation Toggle */}
            <View style={styles.validationRow}>
              <Text style={styles.validationLabel}>Validación:</Text>
              <View style={styles.validationToggle}>
                <Switch
                  value={question.validationStatus === 'Cumple'}
                  onValueChange={() => toggleValidation(question.id)}
                  trackColor={{ false: '#EF4444', true: '#10B981' }}
                  thumbColor="#FFF"
                />
                <Text style={[
                  styles.validationStatus,
                  question.validationStatus === 'Cumple' ? styles.validationStatusSuccess : styles.validationStatusError
                ]}>
                  {question.validationStatus}
                </Text>
              </View>
            </View>

            {/* Recalibration (shown when No Cumple) */}
            {question.validationStatus === 'No Cumple' && (
              <>
                <View style={styles.recalibrationRow}>
                  <Text style={styles.recalibrationLabel}>Recalibración:</Text>
                  <Text style={styles.recalibrationValue}>{question.recalibration} Puntos</Text>
                </View>

                {question.evidenceRequired && (
                  <View style={styles.evidenceSection}>
                    <Text style={styles.evidenceLabel}>EVIDENCIA DEL HALLAZGO (OBLIGATORIO)</Text>
                    <TextInput
                      style={styles.evidenceInput}
                      placeholder={question.evidenceDescription}
                      placeholderTextColor="#9CA3AF"
                      multiline
                    />
                  </View>
                )}

                <TouchableOpacity style={styles.adjustButton}>
                  <Image source={require('../../../assets/icons/img.png')} style={styles.adjustIcon} />
                  <Text style={styles.adjustText}>Adjuntar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={onNavigateBack}>
          <Image source={require('../../../assets/icons/check.png')} style={styles.saveIcon} />
          <Text style={styles.saveText}>Guardar Auditoría</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerContainer: {
    backgroundColor: theme.colors.primary,
    paddingBottom: 24,
  },
  header: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFF',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 2,
  },
  settingsIcon: {
    width: 80,
    height: 55,
    tintColor: '#FFF',
  },
  content: {
    flex: 1,
    marginTop: 0,
  },
  scoreCard: {
    backgroundColor: 'rgba(126, 150, 176, 0.27)',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 0,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreSection: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  scoreLabelGreen: {
    color: '#6EE7B7',
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFF',
    lineHeight: 68,
  },
  scoreDiffBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
  },
  scoreDiffText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  scoreCenter: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  recalibrating: {
    fontSize: 11,
    color: '#FFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  arrowIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginHorizontal: 0,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 0,
    padding: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 0,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'transparent',
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  questionCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 18,
    borderRadius: 12,
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  questionCardError: {
    borderLeftColor: '#EF4444',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  pointsBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  providerStatus: {
    marginBottom: 12,
  },
  providerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  pdfLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pdfIcon: {
    width: 16,
    height: 16,
    tintColor: theme.colors.primary,
    marginRight: 8,
  },
  pdfText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  validationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  validationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  validationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validationStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
  },
  validationStatusSuccess: {
    color: '#10B981',
  },
  validationStatusError: {
    color: '#EF4444',
  },
  recalibrationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recalibrationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  recalibrationValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  evidenceSection: {
    marginBottom: 12,
  },
  evidenceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  evidenceInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    fontSize: 13,
    color: '#1F2937',
    minHeight: 70,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
  },
  adjustIcon: {
    width: 16,
    height: 16,
    tintColor: theme.colors.primary,
    marginRight: 8,
  },
  adjustText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
  },
  saveIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFF',
    marginRight: 8,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default AuditScreen;
