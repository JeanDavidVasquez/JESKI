import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EpiService } from '../services/epiService';
import { EpiConfig, EpiCategory } from '../types/epi';

export const EPIConfigScreen: React.FC<{ onNavigateBack?: () => void; onNavigateToProfile?: () => void }> = ({ onNavigateBack, onNavigateToProfile }) => {
  const [activeTab, setActiveTab] = useState<EpiCategory>('calidad');
  const [config, setConfig] = useState<EpiConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await EpiService.getEpiConfig();
      setConfig(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo cargar la configuración. Verifique su conexión.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!config) return;

    const validation = EpiService.validateWeights(config);
    if (!validation.isValid) {
      Alert.alert('Error de Validación', validation.messages.join('\n'));
      return;
    }

    setSaving(true);
    try {
      await EpiService.saveEpiConfig(config);
      setHasChanges(false);
      Alert.alert(
        'Configuración Guardada',
        'Los cambios se han guardado exitosamente en la base de datos.',
        [
          {
            text: 'Ir al Perfil',
            onPress: () => {
              if (onNavigateToProfile) onNavigateToProfile();
              else if (onNavigateBack) onNavigateBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = () => {
    Alert.alert(
      'Restaurar Cambios',
      '¿Estás seguro de descartar los cambios no guardados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: () => {
            loadConfig();
            setHasChanges(false);
          }
        }
      ]
    );
  };

  const updateSectionWeight = (sectionId: string, text: string) => {
    if (!config) return;
    const value = parseInt(text) || 0;

    setConfig(prev => {
      if (!prev) return null;
      const newConfig = { ...prev };
      const sections = newConfig[activeTab].sections.map(s =>
        s.id === sectionId ? { ...s, weight: value } : s
      );
      newConfig[activeTab].sections = sections;
      return newConfig;
    });
    setHasChanges(true);
  };

  const addSection = () => {
    setConfig(prev => {
      if (!prev) return null;
      const newConfig = { ...prev };
      const newId = Date.now().toString();
      newConfig[activeTab].sections.push({
        id: newId,
        title: 'Nueva Sección',
        weight: 0,
        questions: []
      });
      // Auto expand new section
      setExpandedSections(prevSet => new Set(prevSet).add(newId));
      return newConfig;
    });
    setHasChanges(true);
  };

  const addQuestion = (sectionId: string) => {
    setConfig(prev => {
      if (!prev) return null;
      const newConfig = { ...prev };
      const sectionIndex = newConfig[activeTab].sections.findIndex(s => s.id === sectionId);
      if (sectionIndex !== -1) {
        newConfig[activeTab].sections[sectionIndex].questions.push({
          id: Date.now().toString(),
          text: '',
          weight: 0,
          isNew: true
        });
      }
      return newConfig;
    });
    setHasChanges(true);
  };

  const updateQuestionText = (sectionId: string, questionId: string, text: string) => {
    setConfig(prev => {
      if (!prev) return null;
      const newConfig = { ...prev };
      const section = newConfig[activeTab].sections.find(s => s.id === sectionId);
      if (section) {
        const question = section.questions.find(q => q.id === questionId);
        if (question) question.text = text;
      }
      return newConfig;
    });
    setHasChanges(true);
  };

  const updateQuestionWeight = (sectionId: string, questionId: string, text: string) => {
    setConfig(prev => {
      if (!prev) return null;
      const newConfig = { ...prev };
      const section = newConfig[activeTab].sections.find(s => s.id === sectionId);
      if (section) {
        const question = section.questions.find(q => q.id === questionId);
        if (question) question.weight = parseInt(text) || 0;
      }
      return newConfig;
    });
    setHasChanges(true);
  };

  const updateQuestionEvidence = (sectionId: string, questionId: string, text: string) => {
    setConfig(prev => {
      if (!prev) return null;
      const newConfig = { ...prev };
      const section = newConfig[activeTab].sections.find(s => s.id === sectionId);
      if (section) {
        const question = section.questions.find(q => q.id === questionId);
        if (question) question.evidence = text;
      }
      return newConfig;
    });
    setHasChanges(true);
  };

  const deleteSection = (sectionId: string) => {
    Alert.alert(
      'Eliminar Sección',
      '¿Estás seguro de eliminar esta sección y todas sus preguntas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setConfig(prev => {
              if (!prev) return null;
              const newConfig = { ...prev };
              newConfig[activeTab].sections = newConfig[activeTab].sections.filter(s => s.id !== sectionId);
              return newConfig;
            });
            setHasChanges(true);
          }
        }
      ]
    );
  };

  const deleteQuestion = (sectionId: string, questionId: string) => {
    setConfig(prev => {
      if (!prev) return null;
      const newConfig = { ...prev };
      const section = newConfig[activeTab].sections.find(s => s.id === sectionId);
      if (section) {
        section.questions = section.questions.filter(q => q.id !== questionId);
      }
      return newConfig;
    });
    setHasChanges(true);
  };

  const updateSectionTitle = (sectionId: string, text: string) => {
    setConfig(prev => {
      if (!prev) return null;
      const newConfig = { ...prev };
      const section = newConfig[activeTab].sections.find(s => s.id === sectionId);
      if (section) section.title = text;
      return newConfig;
    });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#003E85" />
      </View>
    );
  }

  if (!config) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={{ color: '#EF4444', marginBottom: 16 }}>No se pudo cargar la configuración.</Text>
        <TouchableOpacity
          style={{ paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' }}
          onPress={loadConfig}
        >
          <Text style={{ color: '#374151', fontWeight: 'bold' }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentSections = config[activeTab].sections;
  const totalWeight = currentSections.reduce((sum, s) => sum + s.weight, 0);
  const isWeightCorrect = Math.abs(totalWeight - 100) < 0.1;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* --- NEW BLUE HEADER BLOCK START --- */}
      <View style={styles.blueHeaderContainer}>
        {/* Top Navbar */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/icono_indurama.png')} style={styles.logo} />
          </View>
        </View>

        {/* Titles */}
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitleMain}>Configuración EPI</Text>
          <Text style={styles.headerSubtitle}>Gestión de Pesos</Text>
        </View>

        {/* Total Summary Card */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>TOTAL {activeTab.toUpperCase()}</Text>
            <Text style={styles.summarySubLabel}>Suma de Secciones</Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={[styles.summaryPercent, !isWeightCorrect && styles.summaryPercentError]}>
              {Math.round(totalWeight)}%
            </Text>
            <View style={[styles.summaryCheck, !isWeightCorrect && styles.summaryCheckError]}>
              <MaterialCommunityIcons name={isWeightCorrect ? "check" : "alert-circle"} size={16} color="#fff" />
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'calidad' && styles.tabItemActive]}
            onPress={() => setActiveTab('calidad')}
          >
            <Text style={[styles.tabText, activeTab === 'calidad' && styles.tabTextActive]}>CALIDAD</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'abastecimiento' && styles.tabItemActive]}
            onPress={() => setActiveTab('abastecimiento')}
          >
            <Text style={[styles.tabText, activeTab === 'abastecimiento' && styles.tabTextActive]}>ABASTECIMIENTO</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* --- NEW BLUE HEADER BLOCK END --- */}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
          {currentSections.map((section, i) => {
            const isExpanded = expandedSections.has(section.id);
            const questionCount = section.questions.filter(q => !q.isNew).length;

            return (
              <View key={section.id} style={styles.sectionCard}>
                {/* Header Clickable for Accordion */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleSection(section.id)}
                  style={styles.sectionHeader}
                >
                  <View style={styles.sectionCircle}>
                    <Text style={styles.sectionCircleText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitleStatic}>{section.title}</Text>
                    <Text style={styles.sectionSubtitle}>{questionCount} Preguntas Existentes</Text>
                  </View>

                  {/* Weight Pill always visible and Editable */}
                  <View style={styles.sectionPercentPill}>
                    <TextInput
                      style={styles.sectionPercentInput}
                      value={section.weight.toString()}
                      onChangeText={(text) => updateSectionWeight(section.id, text)}
                      keyboardType="numeric"
                      maxLength={3}
                      placeholder="0"
                    />
                    <Text style={styles.sectionPercentSymbol}>%</Text>
                  </View>
                </TouchableOpacity>

                {/* Expanded Content */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Editable Title only when expanded */}
                    <TextInput
                      style={styles.sectionTitleInput}
                      value={section.title}
                      onChangeText={(text) => updateSectionTitle(section.id, text)}
                      placeholder="Editar Título"
                    />

                    {/* Existing Questions List */}
                    {section.questions.filter(q => !q.isNew).map((question) => (
                      <View key={question.id} style={styles.questionRow}>
                        <View style={styles.questionNumberBox}>
                          <Text style={styles.questionNumber}>{i + 1}.{section.questions.indexOf(question) + 1}</Text>
                        </View>
                        <TextInput
                          style={styles.questionTextInput}
                          value={question.text}
                          onChangeText={(text) => updateQuestionText(section.id, question.id, text)}
                          placeholder="Texto de la pregunta..."
                          multiline
                        />
                        <View style={styles.questionWeightPill}>
                          <TextInput
                            style={styles.questionWeightInput}
                            value={question.weight.toString()}
                            onChangeText={(text) => updateQuestionWeight(section.id, question.id, text)}
                            keyboardType="numeric"
                            maxLength={3}
                          />
                        </View>

                        <TouchableOpacity onPress={() => deleteQuestion(section.id, question.id)} style={{ marginLeft: 8 }}>
                          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* New Questions Rendered Here */}
                    {section.questions.filter(q => q.isNew).map((question) => (
                      <View key={question.id} style={styles.newQuestionCard}>
                        {/* Header of New Card */}
                        <View style={styles.newQuestionHeader}>
                          <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>New</Text>
                          </View>
                          <TextInput
                            style={styles.newQuestionInput}
                            value={question.text}
                            onChangeText={(text) => updateQuestionText(section.id, question.id, text)}
                            placeholder="Nueva pregunta (Requisito)"
                            placeholderTextColor="#9CA3AF"
                          />
                          <View style={styles.newWeightBox}>
                            <TextInput
                              style={styles.questionWeightInput}
                              value={question.weight.toString()}
                              onChangeText={(text) => updateQuestionWeight(section.id, question.id, text)}
                              keyboardType="numeric"
                              maxLength={3}
                            />
                            <Text style={styles.percentSymbol}>%</Text>
                          </View>
                          <TouchableOpacity onPress={() => deleteQuestion(section.id, question.id)} style={{ marginLeft: 8 }}>
                            <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
                          </TouchableOpacity>
                        </View>

                        {/* Evidence Input */}
                        <View style={styles.evidenceInputContainer}>
                          <TextInput
                            style={styles.evidenceInput}
                            placeholder="Evidencias esperadas / Documentos requeridos"
                            placeholderTextColor="#9CA3AF"
                            value={question.evidence || ''}
                            onChangeText={(text) => updateQuestionEvidence(section.id, question.id, text)}
                          />
                        </View>
                      </View>
                    ))}

                    {/* Add Button Area */}
                    <TouchableOpacity
                      style={styles.addQuestionDashedButton}
                      onPress={() => addQuestion(section.id)}
                    >
                      <Text style={styles.addQuestionDashedText}>+ Agregar Pregunta</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteSectionButton}
                      onPress={() => deleteSection(section.id)}
                    >
                      <Text style={styles.deleteSectionText}>Eliminar Sección</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            style={styles.createSectionButton}
            onPress={addSection}
          >
            <Text style={styles.createSectionText}>Crear Nueva Sección</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.restoreButton, !hasChanges && styles.disabledButton]}
          onPress={handleRestore}
          disabled={!hasChanges}
        >
          <Text style={[styles.restoreText, !hasChanges && styles.disabledText]}>Restaurar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save" size={22} color="#fff" />
              <Text style={styles.saveButtonText}>Guardar Configuración</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  blueHeaderContainer: {
    backgroundColor: '#004CA3',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10
  },
  backButton: { padding: 8 },
  logoContainer: {},
  logo: { width: 100, height: 30, resizeMode: 'contain', tintColor: '#fff' }, // Adjust tint if logo is an image that supports it, or remove tint if it's a colored PNG

  headerTitles: { alignItems: 'center', marginBottom: 20 },
  headerTitleMain: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#A0C4FF', marginTop: 4 },

  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.15)', // Glassy look or specific color like #366896
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  summaryLabel: { color: '#fff', fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline' },
  summarySubLabel: { color: '#E0E7FF', fontSize: 12 },
  summaryRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryPercent: { fontSize: 32, fontWeight: 'bold', color: '#4ADE80' }, // Green text
  summaryPercentError: { color: '#F87171' },
  summaryCheck: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center'
  },
  summaryCheckError: { backgroundColor: '#EF4444' },

  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 0,
    width: '100%'
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'
  },
  tabItemActive: { borderBottomColor: '#38BDF8' }, // Light blue indicator
  tabText: { color: '#93C5FD', fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#fff', fontWeight: 'bold' },

  content: { padding: 20 },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    // Shadow for card feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff'
  },
  sectionCircle: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: '#003E85',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12
  },
  sectionCircleText: { fontSize: 18, fontWeight: 'bold', color: '#003E85' },
  sectionTitleStatic: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  sectionSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  sectionPercentPill: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    justifyContent: 'center'
  },
  sectionPercentInput: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    padding: 0,
    minWidth: 20
  },
  sectionPercentSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 2
  },

  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#fff'
  },
  sectionTitleInput: {
    fontSize: 16, fontWeight: 'bold', color: '#1F2937',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    paddingVertical: 8, marginBottom: 16
  },

  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  questionNumberBox: {
    width: 24, height: 24, backgroundColor: '#E5E7EB', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 8
  },
  questionNumber: { fontSize: 10, fontWeight: 'bold', color: '#6B7280' },
  questionTextInput: { flex: 1, fontSize: 13, color: '#374151' },
  questionWeightPill: {
    borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, minWidth: 40
  },
  questionWeightInput: { textAlign: 'center', color: '#2563EB', fontWeight: 'bold' },

  // NEW QUESTION CARD STYLES
  newQuestionCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    padding: 16,
    marginTop: 8
  },
  newQuestionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12
  },
  newBadge: {
    backgroundColor: '#BFDBFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 8
  },
  newBadgeText: { color: '#1E40AF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  newQuestionInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8
  },
  newWeightBox: {
    backgroundColor: '#fff', borderRadius: 6, width: 44, height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 2
  },
  percentSymbol: { color: '#9CA3AF', fontSize: 10, marginLeft: 1 },

  evidenceInputContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  evidenceInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 10, fontSize: 13, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8
  },
  addStartButton: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center'
  },
  plusText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  addQuestionDashedButton: {
    marginTop: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 8, alignItems: 'center'
  },
  addQuestionDashedText: { color: '#6B7280', fontSize: 13 },

  deleteSectionButton: {
    marginTop: 20, alignSelf: 'flex-start'
  },
  deleteSectionText: { color: '#EF4444', fontSize: 13, fontWeight: '500' },

  createSectionButton: {
    borderWidth: 1, borderColor: '#9CA3AF', borderRadius: 8, padding: 16, borderStyle: 'dashed', alignItems: 'center', marginBottom: 30
  },
  createSectionText: { color: '#4B5563', fontWeight: 'bold' },

  bottomActions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    flexDirection: 'row', justifyContent: 'space-between', gap: 16
  },
  restoreButton: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  restoreText: { color: '#374151', fontWeight: 'bold' },
  saveButton: { flex: 2, backgroundColor: '#003E85', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', paddingVertical: 14, borderRadius: 8, gap: 8 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  disabledButton: { opacity: 0.5 },
  disabledText: { color: '#9CA3AF' }
});

export default EPIConfigScreen;
