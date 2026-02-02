import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EpiService } from '../../services/epiService';
import { EpiConfig, EpiCategory } from '../../types/epi';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';

export const EPIConfigScreen: React.FC<{ onNavigateBack?: () => void; onNavigateToProfile?: () => void }> = ({ onNavigateBack, onNavigateToProfile }) => {
  const { isDesktopView } = useResponsive();
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

    // Validate bilingual fields are complete
    const missingTranslations: string[] = [];
    ['calidad', 'abastecimiento'].forEach((category) => {
      const cat = category as 'calidad' | 'abastecimiento';
      config[cat].sections.forEach((section, sIndex) => {
        if (!section.title_en || section.title_en.trim() === '') {
          missingTranslations.push(`Sección ${sIndex + 1} (${category}): Falta título en inglés`);
        }
        section.questions.forEach((q, qIndex) => {
          if (!q.text_en || q.text_en.trim() === '') {
            missingTranslations.push(`Pregunta ${sIndex + 1}.${qIndex + 1} (${category}): Falta texto en inglés`);
          }
        });
      });
    });

    if (missingTranslations.length > 0) {
      const showAll = missingTranslations.length <= 5;
      const message = showAll
        ? missingTranslations.join('\n')
        : `${missingTranslations.slice(0, 5).join('\n')}\n... y ${missingTranslations.length - 5} más`;
      Alert.alert(
        'Traducciones Incompletas',
        `Todos los campos de inglés son obligatorios:\n\n${message}`
      );
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
          text_en: '',
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

  const updateSectionTitleEn = (sectionId: string, text: string) => {
    setConfig(prev => {
      if (!prev) return null;
      const newConfig = { ...prev };
      const section = newConfig[activeTab].sections.find(s => s.id === sectionId);
      if (section) section.title_en = text;
      return newConfig;
    });
    setHasChanges(true);
  };

  const updateQuestionTextEn = (sectionId: string, questionId: string, text: string) => {
    setConfig(prev => {
      if (!prev) return null;
      const newConfig = { ...prev };
      const section = newConfig[activeTab].sections.find(s => s.id === sectionId);
      if (section) {
        const question = section.questions.find(q => q.id === questionId);
        if (question) question.text_en = text;
      }
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

  // --- VISUAL HELPERS ---
  const getProgressColor = (weight: number) => {
    if (weight === 100) return '#4ADE80'; // Green
    if (weight > 100) return '#F87171'; // Red
    return '#FBBF24'; // Amber/Orange
  };

  const currentSections = config[activeTab].sections;
  const totalWeight = currentSections.reduce((sum, s) => sum + s.weight, 0);
  const isWeightCorrect = Math.abs(totalWeight - 100) < 0.1;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* --- PREMIUM HEADER --- */}
      <View style={styles.blueHeaderContainer}>
        <View style={[isDesktopView && { width: '100%', maxWidth: 1200, alignSelf: 'center' }]}>
          {/* Top Navbar */}
          <View style={styles.topNav}>
            <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image source={require('../../../assets/icono_indurama.png')} style={styles.logo} />
            </View>
          </View>

          {/* Titles & Context - CONDITIONAL DISPLAY */}
          {isDesktopView && (
            <View style={styles.headerContent}>
              <Text style={styles.headerTitleMain}>Configuración EPI</Text>
            </View>
          )}

          {/* Progress / Status Card - COMPACT FOR MOBILE */}
          <View style={[styles.summaryCard, !isDesktopView && styles.summaryCardMobile]}>
            <View style={styles.summaryInfo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>TOTAL {activeTab.toUpperCase()}</Text>
                {isDesktopView && <Text style={styles.summarySubLabel}>La suma debe ser exacta (100%)</Text>}
              </View>
              <View style={styles.summaryRight}>
                <Text style={[styles.summaryPercent, !isDesktopView && { fontSize: 24 }, { color: getProgressColor(totalWeight) }]}>
                  {Math.round(totalWeight)}%
                </Text>
                <View style={[styles.summaryCheck, !isDesktopView && { width: 20, height: 20 }, { backgroundColor: isWeightCorrect ? '#22C55E' : (totalWeight > 100 ? '#EF4444' : '#F59E0B') }]}>
                  <MaterialCommunityIcons name={isWeightCorrect ? "check" : "alert"} size={!isDesktopView ? 12 : 14} color="#fff" />
                </View>
              </View>
            </View>

            {/* Visual Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(totalWeight, 100)}%`,
                  backgroundColor: getProgressColor(totalWeight)
                }
              ]}
              />
            </View>
          </View>

          {/* Tabs with Question Count */}
          <View style={[styles.tabsContainer, !isDesktopView && { gap: 0 }]}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'calidad' && styles.tabItemActive]}
              onPress={() => setActiveTab('calidad')}
              activeOpacity={0.8}
            >
              <View style={styles.tabWithBadge}>
                <Text style={[styles.tabText, activeTab === 'calidad' && styles.tabTextActive, !isDesktopView && { fontSize: 13 }]}>CALIDAD</Text>
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{config.calidad.sections.reduce((sum, s) => sum + s.questions.length, 0)}</Text>
                </View>
              </View>
              {activeTab === 'calidad' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'abastecimiento' && styles.tabItemActive]}
              onPress={() => setActiveTab('abastecimiento')}
              activeOpacity={0.8}
            >
              <View style={styles.tabWithBadge}>
                <Text style={[styles.tabText, activeTab === 'abastecimiento' && styles.tabTextActive, !isDesktopView && { fontSize: 13 }]}>ABASTECIMIENTO</Text>
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{config.abastecimiento.sections.reduce((sum, s) => sum + s.questions.length, 0)}</Text>
                </View>
              </View>
              {activeTab === 'abastecimiento' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#F8F9FA' }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={[{ paddingBottom: 100, paddingTop: 10 }, isDesktopView && { alignItems: 'center' }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: 1200 }}>
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
                    <View style={styles.sectionLeft}>
                      <View style={styles.sectionCircle}>
                        <Text style={styles.sectionCircleText}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.sectionTitleStatic} numberOfLines={1}>{section.title}</Text>
                          {section.title_en ? (
                            <View style={styles.translatedBadge}>
                              <Text style={styles.translatedBadgeText}>EN ✓</Text>
                            </View>
                          ) : (
                            <View style={styles.missingBadge}>
                              <Text style={styles.missingBadgeText}>EN ✗</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.sectionSubtitle}>
                          {questionCount} Preguntas • {section.weight}% •
                          {section.questions.filter(q => q.text_en && q.text_en.trim()).length}/{questionCount} traducidas
                        </Text>
                      </View>
                    </View>

                    {/* Weight Pill always visible and Editable */}
                    <View style={styles.sectionRight}>
                      <View style={styles.sectionPercentPill}>
                        <TextInput
                          style={styles.sectionPercentInput}
                          value={section.weight.toString()}
                          onChangeText={(text) => updateSectionWeight(section.id, text)}
                          keyboardType="numeric"
                          maxLength={3}
                          selectTextOnFocus
                        />
                        <Text style={styles.sectionPercentSymbol}>%</Text>
                      </View>
                      <MaterialCommunityIcons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color="#9CA3AF"
                        style={{ marginLeft: 8 }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {/* Editable Title only when expanded */}
                      {/* Section Title - Bilingual */}
                      <View style={styles.inputGroup}>
                        <View style={styles.bilingualHeader}>
                          <Text style={styles.langFlag}>🇪🇸</Text>
                          <Text style={styles.inputLabel}>Título de la Sección (Español)</Text>
                        </View>
                        <TextInput
                          style={styles.sectionTitleInput}
                          value={section.title}
                          onChangeText={(text) => updateSectionTitle(section.id, text)}
                          placeholder="Nombre de la sección"
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <View style={styles.bilingualHeader}>
                          <Text style={styles.langFlag}>🇬🇧</Text>
                          <Text style={styles.inputLabel}>Section Title (English)</Text>
                        </View>
                        <TextInput
                          style={[styles.sectionTitleInput, styles.englishInput]}
                          value={section.title_en || ''}
                          onChangeText={(text) => updateSectionTitleEn(section.id, text)}
                          placeholder="Section name (optional)"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>

                      {/* Existing Questions List */}
                      {section.questions.filter(q => !q.isNew).map((question, qIndex) => (
                        <View key={question.id} style={styles.questionRow}>
                          <View style={styles.questionHeader}>
                            <View style={styles.questionNumberBox}>
                              <Text style={styles.questionNumber}>{i + 1}.{qIndex + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              {/* Spanish Question */}
                              <View style={styles.bilingualQuestionRow}>
                                <Text style={styles.langFlagSmall}>🇪🇸</Text>
                                <TextInput
                                  style={styles.questionTextInput}
                                  value={question.text}
                                  onChangeText={(text) => updateQuestionText(section.id, question.id, text)}
                                  placeholder="Escribe la pregunta aquí..."
                                  multiline
                                />
                              </View>
                              {/* English Question */}
                              <View style={[styles.bilingualQuestionRow, { marginTop: 8 }]}>
                                <Text style={styles.langFlagSmall}>🇬🇧</Text>
                                <TextInput
                                  style={[styles.questionTextInput, styles.englishInputSmall]}
                                  value={question.text_en || ''}
                                  onChangeText={(text) => updateQuestionTextEn(section.id, question.id, text)}
                                  placeholder="Write the question here (English)..."
                                  placeholderTextColor="#9CA3AF"
                                  multiline
                                />
                              </View>
                            </View>

                            <View style={styles.questionWeightContainer}>
                              <Text style={styles.weightLabel}>Peso</Text>
                              <View style={styles.questionWeightPill}>
                                <TextInput
                                  style={styles.questionWeightInput}
                                  value={question.weight.toString()}
                                  onChangeText={(text) => updateQuestionWeight(section.id, question.id, text)}
                                  keyboardType="numeric"
                                  maxLength={3}
                                  selectTextOnFocus
                                />
                                <Text style={styles.smallPercent}>%</Text>
                              </View>
                            </View>

                            <TouchableOpacity
                              onPress={() => deleteQuestion(section.id, question.id)}
                              style={styles.deleteIconButton}
                            >
                              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}

                      {/* New Questions Rendered Here */}
                      {section.questions.filter(q => q.isNew).map((question) => (
                        <View key={question.id} style={styles.newQuestionCard}>
                          <View style={styles.newQuestionHeaderRow}>
                            <View style={styles.newBadge}>
                              <Text style={styles.newBadgeText}>NUEVA / NEW</Text>
                            </View>
                            <TouchableOpacity onPress={() => deleteQuestion(section.id, question.id)}>
                              <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                          </View>

                          {/* Spanish Question */}
                          <View style={styles.bilingualQuestionRow}>
                            <Text style={styles.langFlagSmall}>🇪🇸</Text>
                            <TextInput
                              style={[styles.newQuestionInput, { flex: 1 }]}
                              value={question.text}
                              onChangeText={(text) => updateQuestionText(section.id, question.id, text)}
                              placeholder="Escribe la nueva pregunta..."
                              placeholderTextColor="#9CA3AF"
                              multiline
                            />
                          </View>

                          {/* English Question */}
                          <View style={[styles.bilingualQuestionRow, { marginTop: 8 }]}>
                            <Text style={styles.langFlagSmall}>🇬🇧</Text>
                            <TextInput
                              style={[styles.newQuestionInput, styles.englishInputSmall, { flex: 1 }]}
                              value={question.text_en || ''}
                              onChangeText={(text) => updateQuestionTextEn(section.id, question.id, text)}
                              placeholder="Write the new question (English)..."
                              placeholderTextColor="#9CA3AF"
                              multiline
                            />
                          </View>

                          <View style={styles.newQuestionFooter}>
                            <View style={styles.evidenceContainer}>
                              <MaterialCommunityIcons name="file-document-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                              <TextInput
                                style={styles.evidenceInput}
                                placeholder="Evidencia requerida (opcional)"
                                placeholderTextColor="#9CA3AF"
                                value={question.evidence || ''}
                                onChangeText={(text) => updateQuestionEvidence(section.id, question.id, text)}
                              />
                            </View>
                            <View style={styles.questionWeightPill}>
                              <TextInput
                                style={styles.questionWeightInput}
                                value={question.weight.toString()}
                                onChangeText={(text) => updateQuestionWeight(section.id, question.id, text)}
                                keyboardType="numeric"
                                maxLength={3}
                                selectTextOnFocus
                              />
                              <Text style={styles.smallPercent}>%</Text>
                            </View>
                          </View>
                        </View>
                      ))}

                      {/* Add Button Area */}
                      <View style={styles.sectionActions}>
                        <TouchableOpacity
                          style={styles.addQuestionButton}
                          onPress={() => addQuestion(section.id)}
                        >
                          <MaterialCommunityIcons name="plus" size={18} color="#2563EB" />
                          <Text style={styles.addQuestionText}>Agregar Pregunta</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteSectionButton}
                          onPress={() => deleteSection(section.id)}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" style={{ marginRight: 4 }} />
                          <Text style={styles.deleteSectionText}>Eliminar Sección</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.createSectionButton}
              onPress={addSection}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#4B5563" />
              <Text style={styles.createSectionText}>Crear Nueva Sección Global</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomActions}>
        <View style={[isDesktopView && { width: '100%', maxWidth: 1200, alignSelf: 'center', flexDirection: 'row', justifyContent: 'flex-end', gap: 16 }]}>
          {!isDesktopView ? (
            <>
              <TouchableOpacity
                style={[styles.restoreButton, !hasChanges && styles.disabledButton]}
                onPress={handleRestore}
                disabled={!hasChanges}
              >
                <Text style={[styles.restoreText, !hasChanges && styles.disabledText]}>Descartar</Text>
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
                    <MaterialCommunityIcons name="content-save-outline" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.restoreButton, !hasChanges && styles.disabledButton, { width: 150 }]}
                onPress={handleRestore}
                disabled={!hasChanges}
              >
                <Text style={[styles.restoreText, !hasChanges && styles.disabledText]}>Descartar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton, { width: 200 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save-outline" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
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
    paddingBottom: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 10
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  logoContainer: {},
  logo: { width: 110, height: 32, resizeMode: 'contain', tintColor: '#fff' },

  headerContent: { alignItems: 'center', marginBottom: 12 },
  headerTitleMain: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 12, color: '#BFDBFE', marginTop: 2, fontWeight: '500' },

  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  summaryCardMobile: {
    marginHorizontal: 16,
    padding: 10,
    marginBottom: 8,
    borderRadius: 10
  },
  summaryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  summaryLabel: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1, opacity: 0.9 },
  summarySubLabel: { color: '#BFDBFE', fontSize: 12, marginTop: 2 },
  summaryRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryPercent: { fontSize: 32, fontWeight: '700', letterSpacing: -1 },
  summaryCheck: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center'
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3
  },

  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    gap: 30
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative'
  },
  tabItemActive: {},
  tabText: { color: '#93C5FD', fontWeight: '600', fontSize: 14, letterSpacing: 0.5 },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff'
  },

  content: { padding: 20 },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    // Modern shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sectionRight: { flexDirection: 'row', alignItems: 'center' },
  sectionCircle: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16
  },
  sectionCircleText: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
  sectionTitleStatic: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  sectionSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },

  sectionPercentPill: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 54,
    justifyContent: 'center'
  },
  sectionPercentInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
    padding: 0,
    minWidth: 22
  },
  sectionPercentSymbol: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 2
  },

  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  },
  inputGroup: { marginBottom: 16, marginTop: 16 },
  inputLabel: { fontSize: 11, color: '#6B7280', fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  sectionTitleInput: {
    fontSize: 15, fontWeight: '600', color: '#111827',
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 8
  },

  questionRow: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  questionHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  questionNumberBox: {
    width: 26, height: 26, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2
  },
  questionNumber: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  questionTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    paddingTop: 0, // Align with number
    minHeight: 40
  },
  questionWeightContainer: {
    alignItems: 'center',
    marginLeft: 12
  },
  weightLabel: { fontSize: 9, color: '#9CA3AF', marginBottom: 2, fontWeight: '600' },
  questionWeightPill: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    minWidth: 48,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F9FAFB'
  },
  questionWeightInput: { textAlign: 'right', color: '#111827', fontWeight: '700', fontSize: 13, minWidth: 20, padding: 0 },
  smallPercent: { fontSize: 10, color: '#9CA3AF', marginLeft: 1 },
  deleteIconButton: { padding: 4, marginLeft: 8, marginTop: 2 },

  // NEW QUESTION CARD STYLES
  newQuestionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    padding: 16,
    marginTop: 12,
    shadowColor: "#4338CA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  newQuestionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10
  },
  newBadge: {
    backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  newBadgeText: { color: '#4F46E5', fontSize: 10, fontWeight: '800' },
  newQuestionInput: {
    fontSize: 14, color: '#1F2937', marginBottom: 12, minHeight: 40
  },
  newQuestionFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6'
  },
  evidenceContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 10 },
  evidenceInput: { flex: 1, fontSize: 12, color: '#4B5563' },

  // Bilingual styles
  bilingualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  langFlag: {
    fontSize: 16,
    marginRight: 8
  },
  langFlagSmall: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2
  },
  englishInput: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD'
  },
  englishInputSmall: {
    backgroundColor: '#F0F9FF',
    color: '#0369A1'
  },
  bilingualQuestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },

  // Tab badge styles
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center'
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700'
  },

  // Translation status badges
  translatedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8
  },
  translatedBadgeText: {
    color: '#166534',
    fontSize: 9,
    fontWeight: '700'
  },
  missingBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8
  },
  missingBadgeText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '700'
  },

  sectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  addQuestionButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8
  },
  addQuestionText: { color: '#2563EB', fontSize: 13, fontWeight: '600', marginLeft: 6 },

  deleteSectionButton: {
    flexDirection: 'row', alignItems: 'center', padding: 8
  },
  deleteSectionText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },

  createSectionButton: {
    borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 16, padding: 20,
    borderStyle: 'dashed', alignItems: 'center', marginBottom: 30,
    flexDirection: 'row', justifyContent: 'center', gap: 10,
    backgroundColor: '#F9FAFB'
  },
  createSectionText: { color: '#4B5563', fontWeight: '700', fontSize: 15 },

  // Footer Actions
  bottomActions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8
  },
  restoreButton: {
    alignItems: 'center', paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: '#fff'
  },
  restoreText: { color: '#4B5563', fontWeight: '700', fontSize: 14 },
  saveButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  disabledButton: { opacity: 0.5, backgroundColor: '#E5E7EB', shadowOpacity: 0 },
  disabledText: { color: '#9CA3AF' }
});

export default EPIConfigScreen;
