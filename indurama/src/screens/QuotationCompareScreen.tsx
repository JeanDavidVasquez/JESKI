/**
 * QuotationCompareScreen - Pantalla para que el Gestor compare cotizaciones y elija ganador
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
    Alert,
    Platform,
    Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { QuotationService } from '../services/quotationService';
import { Request, Quotation, QuotationInvitation } from '../types';
import { theme } from '../styles/theme';
import { QuotationComments } from '../components/QuotationComments';

interface QuotationCompareScreenProps {
    requestId: string;
    onNavigateBack: () => void;
    onSuccess?: () => void;
    onNavigateToPurchaseOrder?: (requestId: string, quotationId: string) => void;
}

export const QuotationCompareScreen: React.FC<QuotationCompareScreenProps> = ({
    requestId,
    onNavigateBack,
    onSuccess,
    onNavigateToPurchaseOrder,
}) => {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [request, setRequest] = useState<Request | null>(null);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [invitations, setInvitations] = useState<QuotationInvitation[]>([]);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Chat states
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatSupplierId, setChatSupplierId] = useState<string | null>(null);
    const [chatSupplierName, setChatSupplierName] = useState<string>('');
    const [chatQuotationId, setChatQuotationId] = useState<string | undefined>(undefined);

    // UI states
    const [activeTab, setActiveTab] = useState<'quotations' | 'invitations'>('quotations');

    useEffect(() => {
        loadData();
    }, [requestId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Cargar solicitud
            const reqDoc = await getDoc(doc(db, 'requests', requestId));
            if (reqDoc.exists()) {
                setRequest({ id: reqDoc.id, ...reqDoc.data() } as Request);
            }

            // Cargar invitaciones y cotizaciones
            const [invs, quotes] = await Promise.all([
                QuotationService.getRequestInvitations(requestId),
                QuotationService.getRequestQuotations(requestId),
            ]);

            setInvitations(invs);

            // Calcular ranking de cotizaciones
            // Obtener scores EPI de proveedores
            const supplierScores: Record<string, number> = {};
            for (const q of quotes) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', q.supplierId));
                    if (userDoc.exists()) {
                        supplierScores[q.supplierId] = userDoc.data()?.epiScore || userDoc.data()?.score || 0;
                    }
                } catch (e) {
                    supplierScores[q.supplierId] = 0;
                }
            }

            const rankedQuotations = QuotationService.calculateRanking(quotes, supplierScores);
            setQuotations(rankedQuotations);
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'No se pudieron cargar las cotizaciones');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectWinner = (quotation: Quotation) => {
        setSelectedQuotation(quotation);
        setShowConfirmModal(true);
    };

    const confirmSelectWinner = async () => {
        if (!selectedQuotation || !request) return;

        try {
            setProcessing(true);
            await QuotationService.selectWinner(
                selectedQuotation.id,
                requestId,
                request.userId // Notificar al solicitante
            );

            setShowConfirmModal(false);
            Alert.alert(
                '🏆 Ganador Seleccionado',
                `Se ha seleccionado a ${selectedQuotation.supplierName} como ganador. Se notificó a todos los proveedores.`,
                [{ text: 'OK', onPress: () => onSuccess?.() }]
            );
        } catch (error) {
            console.error('Error selecting winner:', error);
            Alert.alert('Error', 'No se pudo seleccionar el ganador');
        } finally {
            setProcessing(false);
        }
    };

    const handleOpenChat = (supplierId: string, supplierName: string, quotationId?: string) => {
        setChatSupplierId(supplierId);
        setChatSupplierName(supplierName);
        setChatQuotationId(quotationId);
        setShowChatModal(true);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return { label: 'Pendiente', color: '#FFA726' };
            case 'viewed': return { label: 'Visto', color: '#2196F3' };
            case 'quoted': return { label: 'Cotizado', color: '#4CAF50' };
            case 'declined': return { label: 'Rechazado', color: '#F44336' };
            default: return { label: status, color: '#999' };
        }
    };

    const pendingCount = invitations.filter(i => i.status === 'pending' || i.status === 'viewed').length;
    const quotedCount = quotations.length;
    const totalInvited = invitations.length;

    const formatCurrency = (amount: number, currency: string) => {
        return `$${amount.toLocaleString()} ${currency}`;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Cargando cotizaciones...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Comparar Cotizaciones</Text>
                    <Text style={styles.headerSubtitle}>
                        #{requestId.slice(-6).toUpperCase()}
                    </Text>
                </View>
                <Image
                    source={require('../../assets/icono_indurama.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalInvited}</Text>
                    <Text style={styles.statLabel}>Invitados</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#4CAF50' }]}>{quotedCount}</Text>
                    <Text style={styles.statLabel}>Cotizaron</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#FFA726' }]}>{pendingCount}</Text>
                    <Text style={styles.statLabel}>Pendientes</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'quotations' && styles.activeTab]}
                    onPress={() => setActiveTab('quotations')}
                >
                    <Text style={[styles.tabText, activeTab === 'quotations' && styles.activeTabText]}>
                        Cotizaciones ({quotations.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'invitations' && styles.activeTab]}
                    onPress={() => setActiveTab('invitations')}
                >
                    <Text style={[styles.tabText, activeTab === 'invitations' && styles.activeTabText]}>
                        Invitaciones ({invitations.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Request Summary */}
            {request && (
                <View style={styles.requestSummary}>
                    <Text style={styles.requestDescription} numberOfLines={2}>
                        {request.description}
                    </Text>
                </View>
            )}

            {/* Content List */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* QUOTATIONS TAB */}
                {activeTab === 'quotations' && (
                    <>
                        {quotations.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-text-outline" size={64} color="#CCC" />
                                <Text style={styles.emptyTitle}>Sin cotizaciones aún</Text>
                                <Text style={styles.emptyText}>
                                    Los proveedores invitados aún no han enviado sus ofertas
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Best Offer Banner */}
                                {quotations.length > 0 && (
                                    <View style={styles.bestOfferBanner}>
                                        <Ionicons name="star" size={20} color="#FFF" />
                                        <Text style={styles.bestOfferText}>
                                            Mejor oferta: {quotations[0].supplierName} - {formatCurrency(quotations[0].totalAmount, quotations[0].currency)}
                                        </Text>
                                    </View>
                                )}

                                {quotations.map((quotation, index) => (
                                    <View
                                        key={quotation.id}
                                        style={[styles.quotationCard, index === 0 && styles.quotationCardBest]}
                                    >
                                        {/* Ranking Badge */}
                                        <View style={[styles.rankBadge, index === 0 && styles.rankBadgeBest]}>
                                            <Text style={styles.rankText}>#{index + 1}</Text>
                                        </View>

                                        {/* Header */}
                                        <View style={styles.cardHeader}>
                                            <View>
                                                <Text style={styles.supplierName}>{quotation.supplierName}</Text>
                                                <Text style={styles.rankingScore}>
                                                    Score: {quotation.rankingScore?.toFixed(1)} pts
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                {/* Chat Button */}
                                                <TouchableOpacity
                                                    style={styles.chatIconButton}
                                                    onPress={() => handleOpenChat(quotation.supplierId, quotation.supplierName, quotation.id)}
                                                >
                                                    <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.primary} />
                                                </TouchableOpacity>

                                                {index === 0 && (
                                                    <View style={styles.bestBadge}>
                                                        <Ionicons name="trophy" size={14} color="#FFF" />
                                                        <Text style={styles.bestBadgeText}>MEJOR</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* Price */}
                                        <View style={styles.priceRow}>
                                            <Text style={styles.priceLabel}>Precio:</Text>
                                            <Text style={styles.priceValue}>
                                                {formatCurrency(quotation.totalAmount, quotation.currency)}
                                            </Text>
                                        </View>

                                        {/* Details Grid */}
                                        <View style={styles.detailsGrid}>
                                            <View style={styles.detailItem}>
                                                <Ionicons name="time-outline" size={16} color="#666" />
                                                <Text style={styles.detailText}>{quotation.deliveryDays} días</Text>
                                            </View>
                                            <View style={styles.detailItem}>
                                                <Ionicons name="card-outline" size={16} color="#666" />
                                                <Text style={styles.detailText}>{quotation.paymentTerms}</Text>
                                            </View>
                                        </View>

                                        {/* Notes */}
                                        {quotation.notes && (
                                            <View style={styles.notesBox}>
                                                <Text style={styles.notesLabel}>Observaciones:</Text>
                                                <Text style={styles.notesText}>{quotation.notes}</Text>
                                            </View>
                                        )}

                                        {/* Select Button */}
                                        {/* Actions */}
                                        {request?.status === 'awarded' || (request?.status as string) === 'adjudicado' ? (
                                            quotation.isWinner || quotation.id === request?.winnerQuotationId ? (
                                                <TouchableOpacity
                                                    style={styles.poButton}
                                                    onPress={() => onNavigateToPurchaseOrder?.(requestId, quotation.id)}
                                                >
                                                    <Ionicons name="document-text" size={20} color="#FFF" />
                                                    <Text style={styles.selectButtonText}>Generar Orden de Compra</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={styles.rejectedBadge}>
                                                    <Text style={styles.rejectedText}>No seleccionado</Text>
                                                </View>
                                            )
                                        ) : (
                                            <TouchableOpacity
                                                style={[styles.selectButton, index === 0 && styles.selectButtonBest]}
                                                onPress={() => handleSelectWinner(quotation)}
                                            >
                                                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                                <Text style={styles.selectButtonText}>Seleccionar como Ganador</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </>
                        )}
                    </>
                )}

                {/* INVITATIONS TAB */}
                {activeTab === 'invitations' && (
                    <>
                        {invitations.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No hay invitaciones enviadas.</Text>
                            </View>
                        ) : (
                            invitations.map((inv) => {
                                const statusInfo = getStatusLabel(inv.status);
                                return (
                                    <View key={inv.id} style={styles.invitationCard}>
                                        <View style={styles.invitationRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.invitationSupplierName}>Proveedor (ID: {inv.supplierId.slice(0, 5)})</Text>
                                                <View style={[styles.statusTag, { backgroundColor: statusInfo.color + '20' }]}>
                                                    <Text style={[styles.statusTagText, { color: statusInfo.color }]}>
                                                        {statusInfo.label}
                                                    </Text>
                                                </View>
                                                <Text style={styles.invitationDate}>
                                                    Enviado: {inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                style={styles.chatButtonOutline}
                                                onPress={() => handleOpenChat(inv.supplierId, "Proveedor", inv.quotationId)}
                                            >
                                                <Ionicons name="chatbubble-outline" size={18} color={theme.colors.primary} />
                                                <Text style={styles.chatButtonOutlineText}>Chat</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Confirmation Modal */}
            <Modal
                visible={showConfirmModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowConfirmModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <Ionicons name="trophy" size={40} color="#4CAF50" />
                        </View>
                        <Text style={styles.modalTitle}>Confirmar Selección</Text>
                        <Text style={styles.modalText}>
                            ¿Estás seguro de seleccionar a <Text style={styles.modalBold}>{selectedQuotation?.supplierName}</Text> como ganador?
                        </Text>
                        <Text style={styles.modalSubtext}>
                            Monto: {selectedQuotation && formatCurrency(selectedQuotation.totalAmount, selectedQuotation.currency)}
                        </Text>
                        <Text style={styles.modalWarning}>
                            Se notificará a todos los proveedores el resultado.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButtonCancel}
                                onPress={() => setShowConfirmModal(false)}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalButtonConfirm}
                                onPress={confirmSelectWinner}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Text style={styles.modalButtonConfirmText}>Confirmar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Chat Modal */}
            <Modal
                visible={showChatModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowChatModal(false)}
            >
                <View style={styles.chatModalContainer}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatHeaderTitle}>{chatSupplierName}</Text>
                        <TouchableOpacity onPress={() => setShowChatModal(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
                        {chatSupplierId && (
                            <QuotationComments
                                requestId={requestId}
                                supplierId={chatSupplierId}
                                currentUserRole="gestor"
                                quotationId={chatQuotationId}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: '#666',
    },
    header: {
        backgroundColor: theme.colors.primary,
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        flex: 1,
        marginLeft: 8,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    logo: {
        width: 40,
        height: 40,
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 16,
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#EEE',
    },
    requestSummary: {
        backgroundColor: '#FFF',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    requestDescription: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    bestOfferBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
        gap: 8,
    },
    bestOfferText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    quotationCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    quotationCardBest: {
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    rankBadge: {
        position: 'absolute',
        top: -10,
        right: 16,
        backgroundColor: '#666',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    rankBadgeBest: {
        backgroundColor: '#4CAF50',
    },
    rankText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    supplierName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    rankingScore: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    bestBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    bestBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    priceValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
        color: '#666',
    },
    notesBox: {
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    notesLabel: {
        fontSize: 11,
        color: '#666',
        marginBottom: 4,
    },
    notesText: {
        fontSize: 13,
        color: '#333',
    },
    selectButton: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    selectButtonBest: {
        backgroundColor: '#4CAF50',
    },
    selectButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    poButton: {
        backgroundColor: '#8B5CF6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    rejectedBadge: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    rejectedText: {
        color: '#999',
        fontSize: 14,
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    modalIcon: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    modalText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalBold: {
        fontWeight: 'bold',
        color: '#333',
    },
    modalSubtext: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 12,
    },
    modalWarning: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButtonCancel: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    modalButtonCancelText: {
        color: '#666',
        fontSize: 15,
        fontWeight: '600',
    },
    modalButtonConfirm: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
    },
    modalButtonConfirmText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
    },

    // New Styles
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    chatIconButton: {
        padding: 6,
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
    },
    // Invitation card styles
    invitationCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        elevation: 1,
    },
    invitationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    invitationSupplierName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    statusTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 4,
    },
    statusTagText: {
        fontSize: 11,
        fontWeight: '600',
    },
    invitationDate: {
        fontSize: 11,
        color: '#999',
    },
    chatButtonOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        gap: 6,
    },
    chatButtonOutlineText: {
        color: theme.colors.primary,
        fontWeight: '600',
        fontSize: 13,
    },
    // Chat Modal
    chatModalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        backgroundColor: '#FFF',
    },
    chatHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default QuotationCompareScreen;
