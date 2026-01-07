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
import { ScoringService } from '../services/scoringService';
import { SupplierResponseService } from '../services/supplierResponseService';
import { useAuth } from '../hooks/useAuth';
import {
  takePhoto,
  pickFromGallery,
  pickDocument,
  uploadSupplierEvidence,
} from '../services/imagePickerService';

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
  evidenceUrl?: string; // File URL
  evidenceFileName?: string; // NEW: Store file name for display
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
  isLocked?: boolean; // NEW: Questionnaire is read-only if locked
}

export const QualityQuestionnaireScreen: React.FC<QualityQuestionnaireScreenProps> = ({
  supplierId: supplierIdProp,
  onNavigateBack,
  onComplete,
  onNavigateToSupplyQuestionnaire
}) => {
  const { user } = useAuth();

  // Use prop or fallback to current user's ID
  const supplierId = supplierIdProp || user?.id;

  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<UISection[]>([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [evaluation, setEvaluation] = useState<any>(null);
  // Flattened list for progress calculation only
  const allQuestions = sections.flatMap(s => s.questions);

  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeUploadQuestionId, setActiveUploadQuestionId] = useState<{ sectionId: string, questionId: string } | null>(null);

  console.log('Mounting QualityQuestionnaireScreen for supplier:', supplierId, 'user:', user?.id);

  useEffect(() => {
    if (!supplierId) {
      Alert.alert('Error', 'No se pudo identificar al proveedor. Por favor, intenta de nuevo.');
      onNavigateBack?.();
      return;
    }
    console.log('useEffect triggered');
    loadQuestions();
    loadLockStatus(); // NEW: Check if locked
  }, []);

  // NEW: Load lock status from submission
  const loadLockStatus = async () => {
    try {
      if (!supplierId) return;
      const canEdit = await SupplierResponseService.canEditEPI(supplierId);
      setIsLocked(!canEdit);
      console.log('Questionnaire locked:', !canEdit);
    } catch (error) {
      console.error('Error loading lock status:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      console.log('Calling EpiService.getEpiConfig()...');
      setLoading(true);
      const config = await EpiService.getEpiConfig();
      console.log('Config received:', JSON.stringify(config, null, 2));

      // Calculate points per question automatically using ScoringService
      const loadedSections: UISection[] = config.calidad.sections.map(s => {
        const pointsPerQuestion = ScoringService.calculateQuestionPoints(s);
        return {
          id: s.id,
          title: s.title,
          questions: s.questions.map(q => ({
            id: q.id,
            text: q.text,
            expectedEvidence: q.evidenceDescription,
            maxPoints: pointsPerQuestion, // AUTOMATIC CALCULATION
            sectionId: s.id,
            selectedAnswer: undefined,
            observation: '',
            score: 0
          }))
        };
      });

      // Load existing evaluation if any
      const existingEval = await SupplierResponseService.getSupplierEvaluation(supplierId);
      if (existingEval) {
        setEvaluation(existingEval);
        setCurrentScore(existingEval.calidadScore || 0);

        // Populate answers from existing responses
        const calidadResponses = existingEval.responses.filter(r => r.category === 'calidad');
        loadedSections.forEach(section => {
          section.questions.forEach(question => {
            const savedResponse = calidadResponses.find(r => r.questionId === question.id);
            if (savedResponse) {
              // Map response status to answer
              const answer = savedResponse.answer === 'cumple' ? 'SI' :
                savedResponse.answer === 'no_cumple' ? 'NO' : 'N/A';
              question.selectedAnswer = answer;
              question.score = savedResponse.pointsEarned || 0;
              question.observation = savedResponse.note || '';
            }
          });
        });

        console.log('✅ Loaded existing responses:', calidadResponses.length);
      }

      setSections(loadedSections);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (sectionId: string, questionId: string, answer: 'SI' | 'NO' | 'N/A') => {
    // Update UI immediately
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

    // Find question to get points
    const section = sections.find(s => s.id === sectionId);
    const question = section?.questions.find(q => q.id === questionId);
    if (!question) return;

    // Save response with SupplierResponseService (auto-updates score)
    try {
      const response = ScoringService.createResponse(
        questionId,
        sectionId,
        'calidad',
        answer === 'SI' ? 'cumple' : 'no_cumple',
        question.maxPoints
      );
      await SupplierResponseService.saveResponse(supplierId, response);

      // Refresh score
      const updatedEval = await SupplierResponseService.getSupplierEvaluation(supplierId);
      if (updatedEval) {
        setCurrentScore(updatedEval.calidadScore || 0);
      }
    } catch (error) {
      console.error('Error saving response:', error);
    }
  };

  const handleObservationChange = async (sectionId: string, questionId: string, text: string) => {
    // Update UI immediately
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

    // Save observation to existing response if it exists
    try {
      const existingEval = await SupplierResponseService.getSupplierEvaluation(supplierId);
      if (existingEval) {
        const existingResponse = existingEval.responses.find(r => r.questionId === questionId);
        if (existingResponse) {
          // Update existing response with new note
          const updatedResponse = { ...existingResponse, note: text };
          await SupplierResponseService.saveResponse(supplierId, updatedResponse);
          console.log('✅ Observation saved for question:', questionId);
        }
      }
    } catch (error) {
      console.error('Error saving observation:', error);
    }
  };

  const handleUploadEvidence = (sectionId: string, questionId: string) => {
    setActiveUploadQuestionId({ sectionId, questionId });
    setShowUploadModal(true);
  };

  const performUpload = async (type: 'camera' | 'gallery' | 'document') => {
    if (!supplierId || !activeUploadQuestionId) return;

    const { sectionId, questionId } = activeUploadQuestionId;

    try {
      setUploading(true);
      let media = null;

      if (type === 'camera') {
        media = await takePhoto();
      } else if (type === 'gallery') {
        media = await pickFromGallery();
      } else {
        media = await pickDocument();
      }

      if (!media) {
        setUploading(false);
        return;
      }

      const url = await uploadSupplierEvidence(
        supplierId,
        'quality',
        questionId,
        media.uri,
        media.name
      );

      // Update UI with URL and filename
      setSections(prev => prev.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          questions: s.questions.map(q => {
            if (q.id !== questionId) return q;
            return { ...q, evidenceUrl: url, evidenceFileName: media.name };
          })
        };
      }));

      // Update persisted data
      const existingEval = await SupplierResponseService.getSupplierEvaluation(supplierId);
      if (existingEval) {
        const existingResponse = existingEval.responses.find(r => r.questionId === questionId);
        if (existingResponse) {
          await SupplierResponseService.saveResponse(supplierId, {
            ...existingResponse,
            evidenceUrl: url
          });
        }
      }

      Alert.alert('Éxito', 'Evidencia subida correctamente');

    } catch (error) {
      console.error('Error uploading:', error);
      Alert.alert('Error', 'No se pudo subir el archivo');
    } finally {
      setUploading(false);
      setActiveUploadQuestionId(null);
    }
  };

  const handleSaveAndExit = async () => {
    if (!supplierId) {
      Alert.alert('Error', 'No se ha identificado al proveedor');
      return;
    }

    setSaving(true);
    try {
      // Since we're saving responses in real-time, just submit the evaluation
      const result = await SupplierResponseService.submitEvaluation(supplierId);

      if (result) {
        setShowSaveModal(true);
      } else {
        Alert.alert('Advertencia', 'La evaluación no está completa al 100%');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'No se pudo guardar la evaluación');
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

      {/* Progress Bar and Score Display */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Progreso: {answeredQuestions}/{totalQuestions}</Text>
          <View style={styles.scoreDisplay}>
            <Text style={styles.scoreLabel}>Score Calidad:</Text>
            <Text style={styles.scoreValue}>{Math.round(currentScore)}/100</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { width: `${totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0}%` }
          ]} />
        </View>
      </View>

      {/* NEW: Locked Banner */}
      {isLocked && (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedText}>
            Evaluación enviada - Solo lectura
          </Text>
        </View>
      )}

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
                        q.selectedAnswer === opt && styles.selectedAnswerButton,
                        isLocked && styles.disabledButton // NEW
                      ]}
                      onPress={() => handleAnswerSelect(section.id, q.id, opt as any)}
                      disabled={isLocked} // NEW
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
                    style={[styles.observationInput, isLocked && styles.disabledInput]}
                    value={q.observation || ''}
                    onChangeText={(text) => handleObservationChange(section.id, q.id, text)}
                    placeholder={isLocked ? "Sin observaciones" : "Evidencias..."}
                    placeholderTextColor="#999"
                    multiline
                    editable={!isLocked}
                  />

                  {/* Upload Button */}
                  {!isLocked && (
                    <TouchableOpacity
                      style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                      onPress={() => handleUploadEvidence(section.id, q.id)}
                      disabled={uploading}
                    >
                      <Image
                        source={require('../../assets/icons/camera.png')}
                        style={styles.uploadIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.uploadText}>
                        {q.evidenceUrl ? 'Cambiar Evidencia' : 'Adjuntar Evidencia'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Evidence Preview */}
                  {q.evidenceUrl && (
                    <View style={styles.evidencePreview}>
                      <Image
                        source={require('../../assets/icons/check.png')}
                        style={styles.evidenceCheckIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.evidenceText}>Evidencia adjuntada</Text>
                    </View>
                  )}
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

      {/* Upload Options Modal */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUploadModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={{ alignItems: 'center' }}>
            <View style={styles.uploadModalContainer}>
              <Text style={styles.uploadModalTitle}>Subir Evidencia</Text>

              <TouchableOpacity
                style={styles.uploadOptionButton}
                onPress={() => {
                  setShowUploadModal(false);
                  performUpload('camera');
                }}
              >
                <Text style={styles.uploadOptionText}>📷 Tomar Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadOptionButton}
                onPress={() => {
                  setShowUploadModal(false);
                  performUpload('gallery');
                }}
              >
                <Text style={styles.uploadOptionText}>🖼️ Desde Galería</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadOptionButton}
                onPress={() => {
                  setShowUploadModal(false);
                  performUpload('document');
                }}
              >
                <Text style={styles.uploadOptionText}>📄 Seleccionar Archivo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadCancelButton}
                onPress={() => setShowUploadModal(false)}
              >
                <Text style={styles.uploadCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressText: { color: '#666', fontSize: 14 },
  scoreDisplay: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreLabel: { color: '#666', fontSize: 13 },
  scoreValue: { fontSize: 18, fontWeight: 'bold', color: '#10B981' },
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
  modalButtonText: { color: '#fff', fontWeight: 'bold' },

  // NEW: Locked state styles
  lockedBanner: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
  },
  lockedIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  lockedText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#E0E0E0',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  // Upload Evidence Styles
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#E0E0E0',
  },
  uploadIcon: {
    width: 16,
    height: 16,
    tintColor: '#1976D2',
    marginRight: 8,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
  },
  evidencePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  evidenceCheckIcon: {
    width: 16,
    height: 16,
    tintColor: '#4CAF50',
    marginRight: 8,
  },
  evidenceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E7D32',
  },
  uploadModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  uploadModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003E85',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadOptionButton: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  uploadOptionText: {
    fontSize: 16,
    color: '#333',
  },
  uploadCancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  uploadCancelText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 15,
  },
});