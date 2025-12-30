import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { EpiService } from '../services/epiService';
import { EpiConfig, EpiCategory } from '../types/epi';
import { SupplierEvaluation, EvaluationResponse } from '../types/evaluation';

const { width } = Dimensions.get('window');

// Extended Question type for UI state
interface UIQuestion {
  id: string; // ID from config (e.g. "q1")
  text: string;
  expectedEvidence?: string;
  maxPoints: number; // weight from config
  sectionId: string;
  selectedAnswer?: 'SI' | 'NO' | 'N/A';
  observation?: string;
  score?: number;
}

interface UISection {
  id: string;
  title: string;
  questions: UIQuestion[];
}

interface QualityQuestionnaireScreenProps {
  supplierId: string;
  onNavigateBack?: () => void;
  onComplete?: () => void;
  onNavigateToSupplyQuestionnaire?: () => void;
}

export const QualityQuestionnaireScreen: React.FC<QualityQuestionnaireScreenProps> = ({
  supplierId,
  onNavigateBack,
  onComplete,
  onNavigateToSupplyQuestionnaire
}) => {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<UISection[]>([]);
  // Flattened list for progress calculation only
  const allQuestions = sections.flatMap(s => s.questions);

  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  console.log('Mounting QualityQuestionnaireScreen for supplier:', supplierId);

  useEffect(() => {
    console.log('useEffect triggered');
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      console.log('Calling EpiService.getEpiConfig()...');
      setLoading(true);
      const config = await EpiService.getEpiConfig();
      console.log('Config received:', JSON.stringify(config, null, 2));

      const loadedSections: UISection[] = config.calidad.sections.map(s => ({
        id: s.id,
        title: s.title,
        questions: s.questions.map(q => ({
          id: q.id,
          text: q.text,
          expectedEvidence: q.evidence,
          maxPoints: q.weight,
          sectionId: s.id,
          selectedAnswer: undefined,
          observation: '',
          score: 0
        }))
      }));

      setSections(loadedSections);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (sectionId: string, questionId: string, answer: 'SI' | 'NO' | 'N/A') => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        questions: s.questions.map(q => {
          if (q.id !== questionId) return q;
          let points = 0;
          if (answer === 'SI') points = q.maxPoints;
          return { ...q, selectedAnswer: answer, score: points };
        })
      };
    }));
  };

  const handleObservationChange = (sectionId: string, questionId: string, text: string) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        questions: s.questions.map(q => {
          if (q.id !== questionId) return q;
          return { ...q, observation: text };
        })
      };
    }));
  };

  const handleSaveAndExit = async () => {
    if (!supplierId) {
      Alert.alert('Error', 'No se ha identificado al proveedor');
      return;
    }

    setSaving(true);
    try {
      const flatQ = sections.flatMap(s => s.questions);
      const responses: EvaluationResponse[] = flatQ.map(q => ({
        questionId: q.id,
        questionText: q.text,
        sectionId: q.sectionId,
        answer: q.selectedAnswer || 'N/A',
        score: q.score || 0,
        maxScore: q.maxPoints,
        observation: q.observation
      }));

      const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
      const maxTotal = responses.reduce((sum, r) => sum + r.maxScore, 0);

      const evaluation: SupplierEvaluation = {
        supplierId: supplierId,
        type: 'CALIDAD',
        totalScore,
        maxTotalScore: maxTotal,
        responses,
        timestamp: Date.now(),
        status: 'COMPLETED'
      };

      await EpiService.saveEvaluation(evaluation);
      setShowSaveModal(true);

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar la evaluación');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#003E85" />
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text>No hay preguntas configuradas para Calidad.</Text>
        <TouchableOpacity onPress={onNavigateBack} style={{ marginTop: 20 }}>
          <Text style={{ color: '#003E85' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate Progress
  const totalQuestions = allQuestions.length;
  const answeredQuestions = allQuestions.filter(q => q.selectedAnswer).length;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Image
            source={require('../../assets/icons/arrow-left.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>CUESTIONARIO CALIDAD</Text>
        </View>

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icono_indurama.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Progress Bar (Global) */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Total Preguntas: {totalQuestions}</Text>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { width: `${totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0}%` }
          ]} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sections.map(section => (
          <View key={section.id} style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderTitle}>{section.title}</Text>

            {section.questions.map((q, index) => (
              <View key={q.id} style={styles.questionContainer}>
                <View style={styles.questionHeader}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.questionText}>{index + 1}. {q.text}</Text>
                    {q.expectedEvidence ? (
                      <Text style={styles.evidenceHint}>Evidencia esperada: {q.expectedEvidence}</Text>
                    ) : null}
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>{q.maxPoints} pts</Text>
                  </View>
                </View>

                {/* Answer Buttons */}
                <View style={styles.answerButtonsContainer}>
                  {['SI', 'NO', 'N/A'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.answerButton,
                        q.selectedAnswer === opt && styles.selectedAnswerButton
                      ]}
                      onPress={() => handleAnswerSelect(section.id, q.id, opt as any)}
                    >
                      <Text style={[
                        styles.answerButtonText,
                        q.selectedAnswer === opt && styles.selectedAnswerButtonText
                      ]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Observation */}
                <View style={styles.observationContainer}>
                  <Text style={styles.observationLabel}>Observación / Evidencia</Text>
                  <TextInput
                    style={styles.observationInput}
                    value={q.observation || ''}
                    onChangeText={(text) => handleObservationChange(section.id, q.id, text)}
                    placeholder="Evidencias..."
                    placeholderTextColor="#999"
                    multiline
                  />
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndExit} disabled={saving}>
          {saving ? <ActivityIndicator color="#666" /> : (
            <>
              <Image source={require('../../assets/icons/document.png')} style={styles.saveIcon} resizeMode="contain" />
              <Text style={styles.saveButtonText}>Guardar Evaluación</Text>
            </>
          )}
        </TouchableOpacity>

        {onNavigateToSupplyQuestionnaire && (
          <TouchableOpacity style={[styles.navigationButton, styles.nextButton]} onPress={onNavigateToSupplyQuestionnaire}>
            <Text style={[styles.navigationButtonText, styles.nextButtonText]}>Ir a Abastecimiento →</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Evaluación Guardada</Text>
            <Text style={styles.modalMessage}>
              Se ha registrado la evaluación de CALIDAD correctamente.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSaveModal(false);
                if (onComplete) onComplete();
              }}
            >
              <Text style={styles.modalButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

// ... Styles (keeping mostly same, ensuring used styles are defined)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 8 },
  backIcon: { width: 20, height: 20, tintColor: '#333333' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333333' },
  logoContainer: { alignItems: 'center' },
  logoImage: { width: 40, height: 40 },

  progressContainer: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  progressText: { textAlign: 'center', color: '#666', marginBottom: 5 },
  progressBar: { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4FC3F7' },

  content: { flex: 1, padding: 20 },
  sectionContainer: { marginBottom: 25 },
  sectionHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#003E85', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#CFD8DC', paddingBottom: 5 },

  questionContainer: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  questionText: { fontSize: 16, color: '#333', flex: 1, marginRight: 10 },
  pointsBadge: { backgroundColor: '#F0F0F0', padding: 5, borderRadius: 4, height: 26 },
  pointsText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  evidenceHint: { fontSize: 13, color: '#1B5E20', marginTop: 4, fontStyle: 'italic' },

  answerButtonsContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  answerButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 6, alignItems: 'center' },
  selectedAnswerButton: { backgroundColor: '#003E85', borderColor: '#003E85' },
  answerButtonText: { color: '#666' },
  selectedAnswerButtonText: { color: '#fff', fontWeight: 'bold' },

  observationContainer: {},
  observationLabel: { fontSize: 12, color: '#888', marginBottom: 5 },
  observationInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 6, padding: 10, height: 60, textAlignVertical: 'top'
  },

  bottomContainer: {
    flexDirection: 'row', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', gap: 10
  },
  saveButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12
  },
  saveIcon: { width: 16, height: 16, marginRight: 8, tintColor: '#666' },
  saveButtonText: { fontWeight: 'bold', color: '#666' },
  navigationButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  nextButton: { backgroundColor: '#003E85' },
  navigationButtonText: { fontWeight: 'bold' },
  nextButtonText: { color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 30, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalMessage: { textAlign: 'center', color: '#666', marginBottom: 20 },
  modalButton: { backgroundColor: '#4CAF50', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 6 },
  modalButtonText: { color: '#fff', fontWeight: 'bold' }
});