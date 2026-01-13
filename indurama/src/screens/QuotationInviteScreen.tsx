/**
 * QuotationInviteScreen - Pantalla para que el Gestor invite proveedores a cotizar
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput,
    Alert,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { QuotationService } from '../services/quotationService';
import { Request, User } from '../types';
import { getSuppliersList, SupplierSummary } from '../services/supplierDataService';
import { theme } from '../styles/theme';

interface QuotationInviteScreenProps {
    requestId: string;
    request?: Request;
    onNavigateBack: () => void;
    onSuccess?: () => void;
    gestorId: string;
    initialSelectedSuppliers?: string[];
}

interface SelectableSupplier extends SupplierSummary {
    selected: boolean;
}

export const QuotationInviteScreen: React.FC<QuotationInviteScreenProps> = ({
    requestId,
    request,
    onNavigateBack,
    onSuccess,
    gestorId,
    initialSelectedSuppliers = [],
}) => {
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [suppliers, setSuppliers] = useState<SelectableSupplier[]>([]);
    const [message, setMessage] = useState('');
    const [daysToQuote, setDaysToQuote] = useState('7');
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        loadQualifiedSuppliers();
    }, []);

    const loadQualifiedSuppliers = async () => {
        try {
            setLoading(true);
            const list = await getSuppliersList();

            const supplierList = list.map(s => ({
                ...s,
                selected: false
            }));

            // Apply pre-selection if IDs provided
            if (initialSelectedSuppliers && initialSelectedSuppliers.length > 0) {
                supplierList.forEach(s => {
                    if (initialSelectedSuppliers.includes(s.id)) {
                        s.selected = true;
                    }
                });
            }

            setSuppliers(supplierList);
        } catch (error) {
            console.error('Error loading suppliers:', error);
            Alert.alert('Error', 'No se pudieron cargar los proveedores');
        } finally {
            setLoading(false);
        }
    };

    const toggleSupplier = (supplierId: string) => {
        setSuppliers(prev =>
            prev.map(s => (s.id === supplierId ? { ...s, selected: !s.selected } : s))
        );
    };

    const selectAll = () => {
        setSuppliers(prev => prev.map(s => ({ ...s, selected: true })));
    };

    const deselectAll = () => {
        setSuppliers(prev => prev.map(s => ({ ...s, selected: false })));
    };

    const selectedCount = suppliers.filter(s => s.selected).length;

    const handleSendInvitations = async () => {
        const selectedSuppliers = suppliers.filter(s => s.selected);
        if (selectedSuppliers.length === 0) {
            Alert.alert('Error', 'Selecciona al menos un proveedor');
            return;
        }

        const days = parseInt(daysToQuote);
        if (isNaN(days) || days < 1) {
            Alert.alert('Error', 'Ingresa un número válido de días');
            return;
        }

        try {
            setSending(true);
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + days);

            await QuotationService.sendInvitations(
                requestId,
                selectedSuppliers.map(s => s.id),
                gestorId,
                dueDate,
                message || undefined
            );

            Alert.alert(
                'Éxito',
                `Se enviaron ${selectedSuppliers.length} invitaciones a cotizar`,
                [{ text: 'OK', onPress: () => onSuccess?.() }]
            );
        } catch (error) {
            console.error('Error sending invitations:', error);
            Alert.alert('Error', 'No se pudieron enviar las invitaciones');
        } finally {
            setSending(false);
        }
    };

    const filteredSuppliers = suppliers.filter(s => {
        if (!searchText) return true;
        const search = searchText.toLowerCase();
        return (
            s.name?.toLowerCase().includes(search) ||
            s.email?.toLowerCase().includes(search) ||
            s.tags?.some(t => t.toLowerCase().includes(search))
        );
    });

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Cargando proveedores calificados...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                        <Image
                            source={require('../../assets/icons/arrow-left.png')}
                            style={styles.backIcon}
                        />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>{request?.code || requestId || 'SOLICITUD'}</Text>
                    </View>
                </View>
                <Image
                    source={require('../../assets/icono_indurama.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.mainTitle}>INVITAR A COTIZAR</Text>
                <Text style={styles.subTitle}>
                    {request?.description || 'Configure la invitación y envíe a los proveedores seleccionados'}
                </Text>

                {/* Progress Steps - Step 3 Active */}
                <View style={styles.stepsContainer}>
                    <View style={styles.stepItem}>
                        <View style={styles.stepCircle}>
                            <Text style={styles.stepNumber}>1</Text>
                        </View>
                        <Text style={styles.stepLabel}>Identificar{'\n'}Necesidad</Text>
                    </View>
                    <View style={styles.stepLine} />
                    <View style={styles.stepItem}>
                        <View style={styles.stepCircle}>
                            <Text style={styles.stepNumber}>2</Text>
                        </View>
                        <Text style={styles.stepLabel}>Búsqueda</Text>
                    </View>
                    <View style={styles.stepLine} />
                    <View style={styles.stepItem}>
                        <View style={[styles.stepCircle, styles.stepActive]}>
                            <Text style={[styles.stepNumber, styles.stepTextActive]}>3</Text>
                        </View>
                        <Text style={[styles.stepLabel, styles.stepLabelActive]}>Cotización</Text>
                    </View>
                </View>

                {/* Configuration Section */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Configuración de la Invitación</Text>

                    <View style={styles.configRow}>
                        <Text style={styles.configLabel}>Días para cotizar:</Text>
                        <TextInput
                            style={styles.daysInput}
                            value={daysToQuote}
                            onChangeText={setDaysToQuote}
                            keyboardType="numeric"
                            maxLength={2}
                        />
                    </View>

                    <Text style={styles.configLabel}>Mensaje (Opcional):</Text>
                    <TextInput
                        style={styles.messageInput}
                        placeholder="Mensaje para los proveedores..."
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Selection Bar */}
                <View style={styles.selectionBar}>
                    <Text style={styles.selectedText}>
                        {selectedCount} de {suppliers.length} seleccionados
                    </Text>
                    <View style={styles.selectionActions}>
                        <TouchableOpacity onPress={selectAll} style={styles.textButton}>
                            <Text style={styles.textButtonLabel}>Todos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={deselectAll} style={styles.textButton}>
                            <Text style={styles.textButtonLabel}>Ninguno</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Suppliers List */}
                {suppliers.map(supplier => (
                    <TouchableOpacity
                        key={supplier.id}
                        style={[styles.card, supplier.selected && styles.cardSelected]}
                        onPress={() => toggleSupplier(supplier.id)}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.checkboxContainer}>
                                {supplier.selected ? (
                                    <Ionicons name="checkbox" size={24} color={theme.colors.primary} />
                                ) : (
                                    <Ionicons name="square-outline" size={24} color="#D1D5DB" />
                                )}
                            </View>

                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{(supplier.name || supplier.email || '?').charAt(0).toUpperCase()}</Text>
                            </View>

                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle}>{supplier.name || 'Sin Nombre'}</Text>
                                <View style={styles.locationRow}>
                                    <Image source={require('../../assets/icons/inbox.png')} style={styles.iconSmall} />
                                    <Text style={styles.cardSubtitle}>{supplier.email}</Text>
                                </View>
                            </View>

                            <View style={styles.scoreBadge}>
                                <Text style={styles.scoreText}>{supplier.score || 0}</Text>
                                <Text style={styles.scorePTS}>PTS</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.sendButton, (sending || selectedCount === 0) && styles.sendButtonDisabled]}
                    onPress={handleSendInvitations}
                    disabled={sending || selectedCount === 0}
                >
                    {sending ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.sendButtonText}>
                                Enviar {selectedCount} Invitación{selectedCount !== 1 ? 'es' : ''}
                            </Text>
                            <Ionicons name="paper-plane-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                        </>
                    )}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#F3F4F6',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 12,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#1F2937',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    logo: {
        width: 100,
        height: 30,
    },
    content: { padding: 20 },
    mainTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    subTitle: { fontSize: 14, color: '#666', marginBottom: 20 },

    // Steps
    stepsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    stepItem: { alignItems: 'center', width: 80 },
    stepCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#00BFFF', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', marginBottom: 5 },
    stepActive: { backgroundColor: '#E0F7FF' },
    stepNumber: { color: '#00BFFF', fontWeight: 'bold', fontSize: 16 },
    stepTextActive: { color: '#003E85' },
    stepLabel: { fontSize: 10, textAlign: 'center', color: '#666' },
    stepLabelActive: { color: '#003E85', fontWeight: 'bold' },
    stepLine: { height: 1, backgroundColor: '#00BFFF', flex: 1, marginTop: -20 },

    sectionCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    configRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    configLabel: {
        fontSize: 14,
        color: '#4B5563',
        marginRight: 10,
    },
    daysInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 6,
        width: 60,
        paddingVertical: 4,
        paddingHorizontal: 8,
        textAlign: 'center',
        color: '#333',
        fontWeight: 'bold',
    },
    messageInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        textAlignVertical: 'top',
        color: '#333',
        minHeight: 80,
    },

    selectionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    selectedText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    selectionActions: {
        flexDirection: 'row',
        gap: 12,
    },
    textButton: {
        paddingVertical: 4,
    },
    textButtonLabel: {
        color: theme.colors.primary,
        fontWeight: '600',
        fontSize: 13,
    },

    // Card Styles
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: '#F0F9FF',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconSmall: {
        width: 12,
        height: 12,
        tintColor: '#6B7280',
        marginRight: 4,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    scoreBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignItems: 'center',
        marginLeft: 8,
    },
    scoreText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    scorePTS: {
        color: '#FFF',
        fontSize: 8,
        opacity: 0.8,
    },

    bottomSpacing: { height: 100 },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    sendButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    sendButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    }
});

export default QuotationInviteScreen;
