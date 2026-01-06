import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import {
    BUSINESS_TYPES,
    PRODUCT_CATEGORIES,
    PRODUCT_TAGS,
    INDUSTRIES,
    getTagsForCategory
} from '../constants/supplierCategories';

interface SupplierProfileSetupScreenProps {
    onNavigateBack?: () => void;
    onComplete?: () => void;
}

export const SupplierProfileSetupScreen: React.FC<SupplierProfileSetupScreenProps> = ({
    onNavigateBack,
    onComplete
}) => {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Form state
    const [businessType, setBusinessType] = useState<string>(user?.businessType || '');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(user?.productCategories || []);
    const [selectedProductTags, setSelectedProductTags] = useState<string[]>(user?.productTags || []);
    const [selectedServiceTags, setSelectedServiceTags] = useState<string[]>(user?.serviceTags || []);
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>(user?.industries || []);
    const [capabilities, setCapabilities] = useState<string>(user?.capabilities || '');

    // Custom tags state
    const [customProductInput, setCustomProductInput] = useState('');
    const [customProductTags, setCustomProductTags] = useState<string[]>(user?.customProductTags || []);
    const [customServiceInput, setCustomServiceInput] = useState('');
    const [customServiceTags, setCustomServiceTags] = useState<string[]>(user?.customServiceTags || []);

    const toggleCategory = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter(c => c !== category));
        } else {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const toggleTag = (tag: string, type: 'product' | 'service') => {
        if (type === 'product') {
            if (selectedProductTags.includes(tag)) {
                setSelectedProductTags(selectedProductTags.filter(t => t !== tag));
            } else {
                setSelectedProductTags([...selectedProductTags, tag]);
            }
        } else {
            if (selectedServiceTags.includes(tag)) {
                setSelectedServiceTags(selectedServiceTags.filter(t => t !== tag));
            } else {
                setSelectedServiceTags([...selectedServiceTags, tag]);
            }
        }
    };

    const toggleIndustry = (industry: string) => {
        if (selectedIndustries.includes(industry)) {
            setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
        } else {
            setSelectedIndustries([...selectedIndustries, industry]);
        }
    };

    const addCustomProductTag = () => {
        if (customProductInput.trim() && !customProductTags.includes(customProductInput.trim())) {
            setCustomProductTags([...customProductTags, customProductInput.trim()]);
            setCustomProductInput('');
        }
    };

    const removeCustomProductTag = (tag: string) => {
        setCustomProductTags(customProductTags.filter(t => t !== tag));
    };

    const addCustomServiceTag = () => {
        if (customServiceInput.trim() && !customServiceTags.includes(customServiceInput.trim())) {
            setCustomServiceTags([...customServiceTags, customServiceInput.trim()]);
            setCustomServiceInput('');
        }
    };

    const removeCustomServiceTag = (tag: string) => {
        setCustomServiceTags(customServiceTags.filter(t => t !== tag));
    };

    const handleSave = async () => {
        if (!user) return;

        // Validaciones
        if (!businessType) {
            Alert.alert('Error', 'Por favor selecciona el tipo de negocio');
            return;
        }

        if (selectedCategories.length === 0) {
            Alert.alert('Error', 'Por favor selecciona al menos una categoría');
            return;
        }

        if (selectedProductTags.length === 0 && selectedServiceTags.length === 0 &&
            customProductTags.length === 0 && customServiceTags.length === 0) {
            Alert.alert('Error', 'Por favor selecciona o agrega al menos un producto o servicio');
            return;
        }

        setSaving(true);
        try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
                businessType,
                productCategories: selectedCategories,
                productTags: selectedProductTags,
                serviceTags: selectedServiceTags,
                customProductTags,
                customServiceTags,
                industries: selectedIndustries,
                capabilities
            });

            Alert.alert(
                'Perfil Actualizado',
                'Tu perfil de productos y servicios ha sido guardado exitosamente',
                [{ text: 'OK', onPress: onComplete || onNavigateBack }]
            );
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'No se pudo guardar el perfil');
        } finally {
            setSaving(false);
        }
    };

    const getAvailableTags = (): string[] => {
        const allTags: string[] = [];
        selectedCategories.forEach(cat => {
            allTags.push(...getTagsForCategory(cat));
        });
        return [...new Set(allTags)]; // Remove duplicates
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            <View style={[styles.step, currentStep === 1 && styles.stepActive]}>
                <Text style={[styles.stepText, currentStep === 1 && styles.stepTextActive]}>1</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={[styles.step, currentStep === 2 && styles.stepActive]}>
                <Text style={[styles.stepText, currentStep === 2 && styles.stepTextActive]}>2</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={[styles.step, currentStep === 3 && styles.stepActive]}>
                <Text style={[styles.stepText, currentStep === 3 && styles.stepTextActive]}>3</Text>
            </View>
        </View>
    );

    const renderStep1 = () => (
        <View>
            <Text style={styles.stepTitle}>Paso 1: Tipo de Negocio</Text>
            <Text style={styles.stepSubtitle}>¿Qué tipo de proveedor eres?</Text>

            {BUSINESS_TYPES.map(type => (
                <TouchableOpacity
                    key={type.value}
                    style={[
                        styles.optionCard,
                        businessType === type.value && styles.optionCardSelected
                    ]}
                    onPress={() => setBusinessType(type.value)}
                >
                    <View style={styles.radio}>
                        {businessType === type.value && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.optionTitle}>{type.label}</Text>
                        <Text style={styles.optionDescription}>{type.description}</Text>
                    </View>
                </TouchableOpacity>
            ))}

            <TouchableOpacity
                style={[styles.nextButton, !businessType && styles.nextButtonDisabled]}
                onPress={() => businessType && setCurrentStep(2)}
                disabled={!businessType}
            >
                <Text style={styles.nextButtonText}>Siguiente</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View>
            <Text style={styles.stepTitle}>Paso 2: Categorías y Productos/Servicios</Text>
            <Text style={styles.stepSubtitle}>Selecciona las categorías que manejas</Text>

            {PRODUCT_CATEGORIES.map(category => (
                <TouchableOpacity
                    key={category.value}
                    style={[
                        styles.categoryCard,
                        selectedCategories.includes(category.value) && styles.categoryCardSelected
                    ]}
                    onPress={() => toggleCategory(category.value)}
                >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.categoryTitle}>{category.label}</Text>
                        <Text style={styles.categoryDescription}>{category.description}</Text>
                    </View>
                    {selectedCategories.includes(category.value) && (
                        <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
                    )}
                </TouchableOpacity>
            ))}

            {selectedCategories.length > 0 && (
                <>
                    <Text style={[styles.stepSubtitle, { marginTop: 24 }]}>
                        Selecciona productos/servicios específicos
                    </Text>
                    <View style={styles.tagsContainer}>
                        {getAvailableTags().map(tag => {
                            const isProduct = selectedCategories.some(cat =>
                                cat !== 'servicios' && getTagsForCategory(cat).includes(tag)
                            );
                            const isSelected = isProduct
                                ? selectedProductTags.includes(tag)
                                : selectedServiceTags.includes(tag);

                            return (
                                <TouchableOpacity
                                    key={tag}
                                    style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                                    onPress={() => toggleTag(tag, isProduct ? 'product' : 'service')}
                                >
                                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                                        {tag}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={[styles.stepSubtitle, { marginTop: 16 }]}>
                        ¿Ofreces algo que no está en la lista?
                    </Text>

                    <View style={styles.customTagSection}>
                        <Text style={styles.customTagLabel}>Productos personalizados:</Text>
                        <View style={styles.customTagInput}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Remaches especiales titanio"
                                value={customProductInput}
                                onChangeText={setCustomProductInput}
                                onSubmitEditing={addCustomProductTag}
                            />
                            <TouchableOpacity onPress={addCustomProductTag} style={styles.addButton}>
                                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.customTagsDisplay}>
                            {customProductTags.map(tag => (
                                <View key={tag} style={styles.customTagChip}>
                                    <Text style={styles.customTagText}>{tag}</Text>
                                    <TouchableOpacity onPress={() => removeCustomProductTag(tag)}>
                                        <MaterialCommunityIcons name="close" size={16} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.customTagSection}>
                        <Text style={styles.customTagLabel}>Servicios personalizados:</Text>
                        <View style={styles.customTagInput}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Estampado en frío"
                                value={customServiceInput}
                                onChangeText={setCustomServiceInput}
                                onSubmitEditing={addCustomServiceTag}
                            />
                            <TouchableOpacity onPress={addCustomServiceTag} style={styles.addButton}>
                                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.customTagsDisplay}>
                            {customServiceTags.map(tag => (
                                <View key={tag} style={styles.customTagChip}>
                                    <Text style={styles.customTagText}>{tag}</Text>
                                    <TouchableOpacity onPress={() => removeCustomServiceTag(tag)}>
                                        <MaterialCommunityIcons name="close" size={16} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                </>
            )}

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setCurrentStep(1)}
                >
                    <MaterialCommunityIcons name="arrow-left" size={20} color="#374151" />
                    <Text style={styles.backButtonText}>Atrás</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        selectedCategories.length === 0 && styles.nextButtonDisabled
                    ]}
                    onPress={() => selectedCategories.length > 0 && setCurrentStep(3)}
                    disabled={selectedCategories.length === 0}
                >
                    <Text style={styles.nextButtonText}>Siguiente</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View>
            <Text style={styles.stepTitle}>Paso 3: Industrias y Capacidades</Text>
            <Text style={styles.stepSubtitle}>¿A qué industrias atiendes?</Text>

            <View style={styles.industryGrid}>
                {INDUSTRIES.map(industry => (
                    <TouchableOpacity
                        key={industry.value}
                        style={[
                            styles.industryChip,
                            selectedIndustries.includes(industry.value) && styles.industryChipSelected
                        ]}
                        onPress={() => toggleIndustry(industry.value)}
                    >
                        <Text style={[
                            styles.industryText,
                            selectedIndustries.includes(industry.value) && styles.industryTextSelected
                        ]}>
                            {industry.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.stepSubtitle, { marginTop: 24 }]}>
                Descripción adicional de capacidades (opcional)
            </Text>
            <TextInput
                style={styles.textArea}
                placeholder="Describe cualquier capacidad adicional, certificaciones especiales, o información relevante..."
                value={capabilities}
                onChangeText={setCapabilities}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
            />

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setCurrentStep(2)}
                >
                    <MaterialCommunityIcons name="arrow-left" size={20} color="#374151" />
                    <Text style={styles.backButtonText}>Atrás</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>
                        {saving ? 'Guardando...' : 'Guardar Perfil'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onNavigateBack} style={styles.backIcon}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configurar Perfil de Proveedor</Text>
            </View>

            {renderStepIndicator()}

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    header: {
        backgroundColor: '#004CA3',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center'
    },
    backIcon: {
        marginRight: 12
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    step: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center'
    },
    stepActive: {
        backgroundColor: '#004CA3'
    },
    stepText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#9CA3AF'
    },
    stepTextActive: {
        color: '#fff'
    },
    stepLine: {
        width: 60,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8
    },
    content: {
        flex: 1,
        padding: 20
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8
    },
    stepSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB'
    },
    optionCardSelected: {
        borderColor: '#004CA3',
        backgroundColor: '#EFF6FF'
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#004CA3'
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4
    },
    optionDescription: {
        fontSize: 13,
        color: '#6B7280'
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB'
    },
    categoryCardSelected: {
        borderColor: '#10B981',
        backgroundColor: '#ECFDF5'
    },
    categoryIcon: {
        fontSize: 32,
        marginRight: 12
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4
    },
    categoryDescription: {
        fontSize: 13,
        color: '#6B7280'
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8
    },
    tagChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB'
    },
    tagChipSelected: {
        backgroundColor: '#DBEAFE',
        borderColor: '#3B82F6'
    },
    tagText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500'
    },
    tagTextSelected: {
        color: '#1E40AF'
    },
    customTagSection: {
        marginTop: 16
    },
    customTagLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8
    },
    customTagInput: {
        flexDirection: 'row',
        gap: 8
    },
    input: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14
    },
    addButton: {
        backgroundColor: '#10B981',
        width: 44,
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    customTagsDisplay: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8
    },
    customTagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FCD34D'
    },
    customTagText: {
        fontSize: 13,
        color: '#92400E',
        fontWeight: '500'
    },
    industryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8
    },
    industryChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB'
    },
    industryChipSelected: {
        backgroundColor: '#DBEAFE',
        borderColor: '#3B82F6'
    },
    industryText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500'
    },
    industryTextSelected: {
        color: '#1E40AF',
        fontWeight: '600'
    },
    textArea: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 100
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24
    },
    backButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#fff'
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151'
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#004CA3'
    },
    nextButtonDisabled: {
        opacity: 0.5
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff'
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#10B981'
    },
    saveButtonDisabled: {
        opacity: 0.5
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff'
    }
});

export default SupplierProfileSetupScreen;
