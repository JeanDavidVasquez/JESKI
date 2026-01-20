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
    TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { QuotationService } from '../../services/quotationService';
import { Request, Quotation, QuotationInvitation, User } from '../../types';
import { theme } from '../../styles/theme';
import { QuotationComments } from '../../components/QuotationComments';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';
import { RequestProcessStepper } from '../../components/RequestProcessStepper';
import { ProcessHeader } from '../../components/ProcessHeader';

interface QuotationCompareScreenProps {
    requestId: string;
    onNavigateBack: () => void;
    onSuccess?: () => void;
    onNavigateToPurchaseOrder?: (requestId: string, quotationId: string) => void;
    onNavigateToSearch?: (requestId: string) => void;
    currentUser?: any; // Optional passed user
}

export const QuotationCompareScreen: React.FC<QuotationCompareScreenProps> = ({
    requestId,
    onNavigateBack,
    onSuccess,
    onNavigateToPurchaseOrder,
    onNavigateToSearch,
    currentUser,
}) => {
    const { width, isDesktopView, isMobileView } = useResponsive();

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

    // Invite Modal States
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [availableSuppliers, setAvailableSuppliers] = useState<User[]>([]);
    const [selectedForInvite, setSelectedForInvite] = useState<string[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [sendingInvites, setSendingInvites] = useState(false);
    const [inviteSearchText, setInviteSearchText] = useState('');

    // Responsive layout calculations
    const containerMaxWidth = isDesktopView ? 1200 : undefined;
    const cardWidth = width >= BREAKPOINTS.wide ? '48%' : '100%';

    useEffect(() => {
        loadData();
    }, [requestId]);

    const loadData = async () => {
        // Validate requestId before making Firebase calls
        if (!requestId || requestId.trim() === '') {
            console.warn('requestId is empty, cannot load data');
            setLoading(false);
            return;
        }

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

    // Load suppliers that are NOT already invited
    const loadAvailableSuppliers = async () => {
        try {
            setLoadingSuppliers(true);

            // Get all approved suppliers
            const suppliersQuery = query(
                collection(db, 'users'),
                where('role', '==', 'proveedor'),
                where('status', '==', 'approved')
            );
            const suppliersSnap = await getDocs(suppliersQuery);
            const allSuppliers = suppliersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

            // Filter out already invited suppliers
            const invitedIds = invitations.map(inv => inv.supplierId);
            const available = allSuppliers.filter(s => !invitedIds.includes(s.id));

            setAvailableSuppliers(available);
        } catch (error) {
            console.error('Error loading available suppliers:', error);
            Alert.alert('Error', 'No se pudieron cargar los proveedores');
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const openInviteModal = () => {
        setSelectedForInvite([]);
        setInviteSearchText('');
        setShowInviteModal(true);
        loadAvailableSuppliers();
    };

    const toggleSupplierSelection = (supplierId: string) => {
        setSelectedForInvite(prev =>
            prev.includes(supplierId)
                ? prev.filter(id => id !== supplierId)
                : [...prev, supplierId]
        );
    };

    const sendMoreInvitations = async () => {
        if (selectedForInvite.length === 0) {
            Alert.alert('Atención', 'Selecciona al menos un proveedor');
            return;
        }

        try {
            setSendingInvites(true);

            // Use 7 days as default due date
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);

            await QuotationService.sendInvitations(
                requestId,
                selectedForInvite,
                currentUser?.id || '',
                dueDate,
                ''
            );

            Alert.alert('Éxito', `Se enviaron ${selectedForInvite.length} invitaciones`);
            setShowInviteModal(false);
            setSelectedForInvite([]);
            loadData(); // Refresh the data
        } catch (error) {
            console.error('Error sending invitations:', error);
            Alert.alert('Error', 'No se pudieron enviar las invitaciones');
        } finally {
            setSendingInvites(false);
        }
    };

    // Filter suppliers by search text
    const filteredAvailableSuppliers = availableSuppliers.filter(s => {
        if (!inviteSearchText) return true;
        const search = inviteSearchText.toLowerCase();
        return (
            s.companyName?.toLowerCase().includes(search) ||
            s.email?.toLowerCase().includes(search) ||
            s.firstName?.toLowerCase().includes(search)
        );
    });

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
            <StatusBar style="dark" />

            <ProcessHeader
                title={request ? (request.code || 'SOLICITUD') : 'COMPARAR COTIZACIONES'}
                onBack={onNavigateBack}
            />

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

            {/* Compact Request Summary */}
            {request && (
                <View style={styles.compactRequestCard}>
                    <View style={styles.compactRequestMain}>
                        <View style={styles.compactRequestIcon}>
                            <Ionicons name="document-text" size={18} color="#FFF" />
                        </View>
                        <View style={styles.compactRequestInfo}>
                            <View style={styles.compactRequestTitleRow}>
                                <Text style={styles.compactRequestTitle} numberOfLines={1}>
                                    {request.title || 'Solicitud de Compra'}
                                </Text>
                                {request.priority && (
                                    <View style={[
                                        styles.compactPriorityBadge,
                                        request.priority === 'high' && styles.priorityHigh,
                                        request.priority === 'medium' && styles.priorityMedium,
                                        request.priority === 'low' && styles.priorityLow,
                                    ]}>
                                        <Text style={styles.compactPriorityText}>
                                            {request.priority === 'high' ? '🔴' : request.priority === 'medium' ? '🟡' : '🟢'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.compactRequestMeta}>
                                <Text style={styles.compactRequestCode}>{request.code}</Text>
                                <Text style={styles.compactMetaSeparator}>•</Text>
                                {request.items && request.items.length > 0 && (
                                    <>
                                        <Text style={styles.compactMetaText}>{request.items.length} items</Text>
                                        <Text style={styles.compactMetaSeparator}>•</Text>
                                    </>
                                )}
                                {request.category && (
                                    <Text style={styles.compactMetaText}>{request.category}</Text>
                                )}
                            </View>
                        </View>
                    </View>
                    {request.description && (
                        <Text style={styles.compactDescription} numberOfLines={1}>
                            {request.description}
                        </Text>
                    )}
                </View>
            )}

            {/* Content List */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={isDesktopView && { maxWidth: 1200, alignSelf: 'center', width: '100%' }}
            >

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

                                <View style={styles.gridContainer}>
                                    {quotations.map((quotation, index) => (
                                        <View
                                            key={quotation.id}
                                            style={[
                                                styles.quotationCard,
                                                index === 0 && styles.quotationCardBest,
                                                { width: cardWidth as any }
                                            ]}
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
                                </View>
                            </>
                        )}
                    </>
                )}

                {/* INVITATIONS TAB */}
                {activeTab === 'invitations' && (
                    <>
                        {/* Info Banner with invite button */}
                        <View style={styles.infoBanner}>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
                                <Text style={styles.infoBannerText}>
                                    {totalInvited} proveedor(es) invitado(s) • {quotedCount} cotizaron
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.inviteLinkButton}
                                onPress={openInviteModal}
                            >
                                <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                                <Text style={styles.inviteLinkText}>+ Invitar</Text>
                            </TouchableOpacity>
                        </View>

                        {invitations.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="mail-outline" size={48} color="#CCC" />
                                <Text style={styles.emptyTitle}>Sin invitaciones</Text>
                                <Text style={styles.emptyText}>Aún no has enviado invitaciones a cotizar.</Text>
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
                                user={currentUser}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* Invite More Suppliers Modal */}
            <Modal
                visible={showInviteModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowInviteModal(false)}
            >
                <View style={styles.inviteModalContainer}>
                    <View style={styles.inviteModalHeader}>
                        <View>
                            <Text style={styles.inviteModalTitle}>Invitar Proveedores</Text>
                            <Text style={styles.inviteModalSubtitle}>
                                {selectedForInvite.length} seleccionado(s)
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.inviteSearchContainer}>
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            style={styles.inviteSearchInput}
                            placeholder="Buscar proveedor..."
                            placeholderTextColor="#9CA3AF"
                            value={inviteSearchText}
                            onChangeText={setInviteSearchText}
                        />
                    </View>

                    {/* Supplier List */}
                    <ScrollView style={styles.inviteSupplierList}>
                        {loadingSuppliers ? (
                            <View style={styles.inviteLoadingContainer}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                                <Text style={styles.inviteLoadingText}>Cargando proveedores...</Text>
                            </View>
                        ) : filteredAvailableSuppliers.length === 0 ? (
                            <View style={styles.inviteEmptyState}>
                                <Ionicons name="people-outline" size={48} color="#CCC" />
                                <Text style={styles.inviteEmptyTitle}>Sin proveedores disponibles</Text>
                                <Text style={styles.inviteEmptyText}>
                                    {availableSuppliers.length === 0
                                        ? 'Todos los proveedores ya fueron invitados'
                                        : 'No se encontraron resultados'}
                                </Text>
                            </View>
                        ) : (
                            filteredAvailableSuppliers.map(supplier => {
                                const isSelected = selectedForInvite.includes(supplier.id);
                                return (
                                    <TouchableOpacity
                                        key={supplier.id}
                                        style={[
                                            styles.inviteSupplierCard,
                                            isSelected && styles.inviteSupplierCardSelected
                                        ]}
                                        onPress={() => toggleSupplierSelection(supplier.id)}
                                    >
                                        <View style={[
                                            styles.inviteCheckbox,
                                            isSelected && styles.inviteCheckboxSelected
                                        ]}>
                                            {isSelected && (
                                                <Ionicons name="checkmark" size={16} color="#FFF" />
                                            )}
                                        </View>
                                        <View style={styles.inviteSupplierInfo}>
                                            <Text style={styles.inviteSupplierName}>
                                                {supplier.companyName || supplier.firstName || 'Proveedor'}
                                            </Text>
                                            <Text style={styles.inviteSupplierEmail}>{supplier.email}</Text>
                                        </View>
                                        {supplier.epiScore && (
                                            <View style={styles.inviteSupplierScore}>
                                                <Text style={styles.inviteSupplierScoreText}>
                                                    {supplier.epiScore}
                                                </Text>
                                                <Text style={styles.inviteSupplierScoreLabel}>PTS</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>

                    {/* Send Button */}
                    {selectedForInvite.length > 0 && (
                        <View style={styles.inviteBottomBar}>
                            <TouchableOpacity
                                style={[
                                    styles.inviteSendButton,
                                    sendingInvites && styles.inviteSendButtonDisabled
                                ]}
                                onPress={sendMoreInvitations}
                                disabled={sendingInvites}
                            >
                                {sendingInvites ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="send" size={18} color="#FFF" />
                                        <Text style={styles.inviteSendButtonText}>
                                            Enviar {selectedForInvite.length} Invitación(es)
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB', // Standard
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
    // Header styles replaced by component 
    /*
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
    */
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
    // Grid
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
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
    // Invite More Button
    inviteMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
    },
    inviteMoreButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    // Request Summary Card
    requestSummaryCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginVertical: 12,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    requestSummaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    requestSummaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    requestSummaryInfo: {
        flex: 1,
    },
    requestSummaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    requestSummaryCode: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    requestSummaryDescription: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 12,
    },
    requestSummaryMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    metaTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 4,
    },
    metaTagText: {
        fontSize: 12,
        color: '#6B7280',
    },
    // Info Banner
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 16,
        gap: 8,
    },
    infoBannerText: {
        fontSize: 14,
        color: '#6B7280',
    },
    inviteLinkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#EFF6FF',
        borderRadius: 20,
        gap: 4,
    },
    inviteLinkText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    // Invite Modal Styles
    inviteModalContainer: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    inviteModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    inviteModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    inviteModalSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    inviteSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 10,
    },
    inviteSearchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937',
    },
    inviteSupplierList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    inviteLoadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    inviteLoadingText: {
        marginTop: 12,
        color: '#6B7280',
    },
    inviteEmptyState: {
        padding: 40,
        alignItems: 'center',
    },
    inviteEmptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563',
        marginTop: 12,
    },
    inviteEmptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
    },
    inviteSupplierCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 14,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    inviteSupplierCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: '#EFF6FF',
    },
    inviteCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    inviteCheckboxSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    inviteSupplierInfo: {
        flex: 1,
    },
    inviteSupplierName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    inviteSupplierEmail: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    inviteSupplierScore: {
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    inviteSupplierScoreText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    inviteSupplierScoreLabel: {
        fontSize: 10,
        color: '#FFF',
    },
    inviteBottomBar: {
        backgroundColor: '#FFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    inviteSendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    inviteSendButtonDisabled: {
        opacity: 0.6,
    },
    inviteSendButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
    // Request Detail Card Styles
    requestDetailCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginVertical: 12,
        padding: 18,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    requestDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    requestDetailIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    requestDetailHeaderInfo: {
        flex: 1,
    },
    requestDetailTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
    },
    requestDetailCode: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
    },
    priorityHigh: {
        backgroundColor: '#FEE2E2',
    },
    priorityMedium: {
        backgroundColor: '#FEF3C7',
    },
    priorityLow: {
        backgroundColor: '#D1FAE5',
    },
    priorityBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#374151',
    },
    requestDetailSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    requestDetailSectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        letterSpacing: 0.5,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    requestDetailDescription: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    itemsList: {
        marginTop: 4,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    itemBullet: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    itemBulletText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    itemQuantity: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    itemsMoreText: {
        fontSize: 13,
        color: theme.colors.primary,
        fontWeight: '500',
        marginTop: 8,
    },
    requestMetaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 16,
    },
    requestMetaItem: {
        minWidth: '40%',
        gap: 2,
    },
    requestMetaLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    requestMetaValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    requestDeliveryAddress: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 10,
        marginTop: 12,
        gap: 8,
    },
    requestDeliveryAddressText: {
        flex: 1,
        fontSize: 13,
        color: '#4B5563',
    },
    // Compact Request Card Styles
    compactRequestCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    compactRequestMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    compactRequestIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    compactRequestInfo: {
        flex: 1,
    },
    compactRequestTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    compactRequestTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    compactPriorityBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactPriorityText: {
        fontSize: 10,
    },
    compactRequestMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        gap: 4,
    },
    compactRequestCode: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    compactMetaSeparator: {
        fontSize: 12,
        color: '#D1D5DB',
    },
    compactMetaText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    compactDescription: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
});

export default QuotationCompareScreen;
