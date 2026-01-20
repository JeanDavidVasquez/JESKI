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
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { QuotationService } from '../../services/quotationService';
import { Request, User } from '../../types';
import { getSuppliersList, SupplierSummary } from '../../services/supplierDataService';
import { theme } from '../../styles/theme';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';
import { RequestProcessStepper } from '../../components/RequestProcessStepper';
import { ProcessHeader } from '../../components/ProcessHeader';

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

    const { width, isDesktopView } = useResponsive();

    // Grid Card Width
    const getCardWidth = () => {
        if (width >= BREAKPOINTS.wide) return '31%';
        if (width >= BREAKPOINTS.desktop) return '48%';
        return '100%';
    };

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
                message || ''
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

            <ProcessHeader
                title={request ? (request.code || 'SOLICITUD') : 'SOLICITUD'}
                onBack={onNavigateBack}
            />

            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    isDesktopView && { maxWidth: 1200, alignSelf: 'center', width: '100%' }
                ]}
            >
                <Text style={styles.mainTitle}>INVITAR A COTIZAR</Text>
                <Text style={styles.subTitle}>
                    {request?.description || 'Configure la invitación y envíe a los proveedores seleccionados'}
                </Text>

                {/* Progress Steps - Step 3 Active */}
                <RequestProcessStepper currentStep={3} />

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

                {/* Suppliers List - Grid */}
                <View style={styles.gridContainer}>
                    {suppliers.map(supplier => (
                        <TouchableOpacity
                            key={supplier.id}
                            style={[
                                styles.card,
                                supplier.selected && styles.cardSelected,
                                { width: getCardWidth() as any }
                            ]}
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
                                        <Image source={require('../../../assets/icons/inbox.png')} style={styles.iconSmall} />
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
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footerContainer}>
                <View style={styles.footerContent}>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB', // Standard
    },
    // Header styles removed
    content: {
        padding: 24,
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subTitle: {
        fontSize: 15,
        color: '#6B7280',
        marginBottom: 32,
        lineHeight: 24,
    },

    // Grid
    // Grid

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
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        paddingLeft: 12,
    },
    configRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    configLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginRight: 16,
    },
    daysInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        width: 80,
        paddingVertical: 8,
        paddingHorizontal: 12,
        textAlign: 'center',
        color: '#111827',
        fontWeight: 'bold',
        fontSize: 16,
    },
    messageInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        textAlignVertical: 'top',
        color: '#1F2937',
        minHeight: 120,
    },

    selectionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    selectedText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '600',
    },
    selectionActions: {
        flexDirection: 'row',
        gap: 16,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    textButton: {
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    textButtonLabel: {
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 13,
    },

    // Card Styles
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: '#F5F3FF', // Very light indigo
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#C7D2FE'
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4338CA',
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconSmall: {
        width: 14,
        height: 14,
        tintColor: '#6B7280',
        marginRight: 6,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#6B7280',
    },
    scoreBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
        marginLeft: 12,
        minWidth: 44,
    },
    scoreText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    scorePTS: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 9,
        fontWeight: '600',
    },

    bottomSpacing: { height: 120 },

    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
        zIndex: 100,
        paddingVertical: 16,
    },
    footerContent: {
        paddingHorizontal: 24,
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
    },
    sendButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6
    },
    sendButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
    },
    sendButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB'
    },
    loadingText: {
        marginTop: 16,
        color: '#4B5563',
        fontSize: 15,
        fontWeight: '500'
    }
});

export default QuotationInviteScreen;
