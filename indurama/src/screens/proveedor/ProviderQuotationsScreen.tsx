/**
 * ProviderQuotationsScreen - Pantalla para que el Proveedor vea sus invitaciones y cotizaciones
 * Usa ResponsiveNavShell para navegación consistente en web/móvil
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { QuotationService } from '../../services/quotationService';
import { QuotationInvitation, Quotation } from '../../types';
import { db } from '../../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { theme } from '../../styles/theme';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';

interface ProviderQuotationsScreenProps {
    supplierId: string;
    onNavigateBack: () => void;
    onNavigateToDashboard?: () => void;
    onNavigateToProfile?: () => void;
    onLogout?: () => void;
    onNavigateToQuotationForm: (invitationId: string, requestId: string) => void;
    onNavigateToQuotationDetail?: (quotationId: string) => void;
    onNavigateToNotifications?: () => void;
}

export const ProviderQuotationsScreen: React.FC<ProviderQuotationsScreenProps> = ({
    supplierId,
    onNavigateBack,
    onNavigateToDashboard,
    onNavigateToProfile,
    onLogout,
    onNavigateToQuotationForm,
    onNavigateToQuotationDetail,
    onNavigateToNotifications,
}) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'invitations' | 'sent' | 'won' | 'history'>('invitations');
    const [invitations, setInvitations] = useState<(QuotationInvitation & { requestDescription?: string })[]>([]);
    const [quotations, setQuotations] = useState<(Quotation & { _paymentStatus?: string; _requestDescription?: string })[]>([]);

    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    useEffect(() => {
        loadData();
    }, [supplierId]);

    const loadData = async () => {
        try {
            if (!refreshing) setLoading(true);
            const [invs, quotes] = await Promise.all([
                QuotationService.getProviderInvitations(supplierId),
                QuotationService.getProviderQuotations(supplierId),
            ]);

            // Enriched Invitations
            const enrichedInvitations = await Promise.all(
                invs.map(async (inv) => {
                    try {
                        const reqDoc = await getDoc(doc(db, 'requests', inv.requestId));
                        return { ...inv, requestDescription: reqDoc.exists() ? reqDoc.data()?.description : 'Sin descripción' };
                    } catch { return { ...inv, requestDescription: 'Sin descripción' }; }
                })
            );

            // Enriched Quotations
            const enrichedQuotations = await Promise.all(
                quotes.map(async (q) => {
                    try {
                        const reqDoc = await getDoc(doc(db, 'requests', q.requestId));
                        const reqData = reqDoc.exists() ? reqDoc.data() : null;
                        return {
                            ...q,
                            _paymentStatus: reqData?.paymentStatus,
                            _requestDescription: reqData?.description || 'Sin descripción'
                        };
                    } catch { return { ...q, _requestDescription: 'Sin descripción' }; }
                })
            );

            setInvitations(enrichedInvitations);
            setQuotations(enrichedQuotations);
        } catch (error) {
            console.error('Error loading quotations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // Filter quotations by status
    const pendingInvitations = invitations.filter(i => i.status === 'pending' || i.status === 'viewed');
    const sentQuotations = quotations.filter(q => q.status === 'submitted' && !q.isWinner);
    const wonQuotations = quotations.filter(q =>
        q.isWinner === true && q._paymentStatus !== 'paid' && q._paymentStatus !== 'verified'
    );
    const historyQuotations = quotations.filter(q =>
        q.status === 'rejected' ||
        (q.status === 'selected' && !q.isWinner) ||
        (q.isWinner === true && (q._paymentStatus === 'paid' || q._paymentStatus === 'verified'))
    );

    // Navigation Items for Shell
    const navItems = [
        { key: 'Dashboard', label: 'Inicio', iconName: 'home' as any, onPress: onNavigateToDashboard || onNavigateBack },
        { key: 'Quotations', label: 'Cotizaciones', iconName: 'pricetags-outline' as any, onPress: () => { } },
        { key: 'Profile', label: 'Perfil', iconName: 'person-outline' as any, onPress: onNavigateToProfile || (() => { }) },
        { key: 'Logout', label: 'Salir', iconName: 'log-out-outline' as any, onPress: onLogout || (() => { }) },
    ];

    const getStatusBadge = (status: string, isWinner?: boolean, paymentStatus?: string) => {
        let label = '';
        let color = '#666';
        let backgroundColor = '#F5F5F5';

        switch (status) {
            case 'pending':
                label = 'PENDIENTE'; color = '#B45309'; backgroundColor = '#FEF3C7'; break;
            case 'viewed':
                label = 'VISTA'; color = '#1D4ED8'; backgroundColor = '#EFF6FF'; break;
            case 'submitted':
                label = 'ENVIADA'; color = '#047857'; backgroundColor = '#D1FAE5'; break;
            case 'selected':
                if (isWinner) {
                    if (paymentStatus === 'verified') { label = '✅ COMPLETADO'; color = '#047857'; backgroundColor = '#D1FAE5'; }
                    else if (paymentStatus === 'paid') { label = '💰 PAGADO'; color = '#059669'; backgroundColor = '#ECFDF5'; }
                    else { label = '🏆 GANADORA'; color = '#B45309'; backgroundColor = '#FEF3C7'; }
                } else { label = 'NO SELECCIONADA'; color = '#B91C1C'; backgroundColor = '#FEE2E2'; }
                break;
            case 'rejected':
                label = 'NO SELECCIONADA'; color = '#B91C1C'; backgroundColor = '#FEE2E2'; break;
            default:
                label = status.toUpperCase();
        }

        return (
            <View style={[styles.statusBadge, { backgroundColor }]}>
                <Text style={[styles.statusText, { color }]}>{label}</Text>
            </View>
        );
    };

    const getPaymentStatusBadge = (paymentStatus?: string) => {
        if (!paymentStatus || paymentStatus === 'pending') {
            return (
                <View style={[styles.paymentBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="time-outline" size={12} color="#B45309" />
                    <Text style={[styles.paymentBadgeText, { color: '#B45309' }]}>Pendiente de Pago</Text>
                </View>
            );
        } else if (paymentStatus === 'paid') {
            return (
                <View style={[styles.paymentBadge, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="checkmark-circle" size={12} color="#047857" />
                    <Text style={[styles.paymentBadgeText, { color: '#047857' }]}>Pagado</Text>
                </View>
            );
        } else if (paymentStatus === 'verified') {
            return (
                <View style={[styles.paymentBadge, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="shield-checkmark" size={12} color="#1D4ED8" />
                    <Text style={[styles.paymentBadgeText, { color: '#1D4ED8' }]}>Verificado</Text>
                </View>
            );
        }
        return null;
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const handleViewInvitation = async (invitation: QuotationInvitation) => {
        if (invitation.status === 'pending') {
            await QuotationService.markInvitationViewed(invitation.id);
        }
        onNavigateToQuotationForm(invitation.id, invitation.requestId);
    };

    return (
        <ResponsiveNavShell
            currentScreen="Quotations"
            navItems={navItems}
            title="INDURAMA"
            logo={require('../../../assets/icono_indurama.png')}
            onNavigateToNotifications={onNavigateToNotifications}
        >
            <View style={styles.container}>
                <StatusBar style="light" />

                {/* Header */}
                <View style={[styles.header, !isMobile && styles.headerWeb]}>
                    <Text style={styles.headerTitle}>Cotizaciones</Text>
                    {isMobile && <View style={{ width: 40 }} />}
                </View>

                {/* Tabs */}
                <View style={styles.tabsWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 4, flexGrow: 1, justifyContent: isMobile ? 'flex-start' : 'center' }}
                    >
                        <View style={styles.tabsContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'invitations' && styles.tabActive]}
                                onPress={() => setActiveTab('invitations')}
                            >
                                <Ionicons name="mail-outline" size={16} color={activeTab === 'invitations' ? theme.colors.primary : '#6B7280'} style={{ marginRight: 4 }} />
                                <Text style={[styles.tabText, activeTab === 'invitations' && styles.tabTextActive]}>Invitaciones</Text>
                                {pendingInvitations.length > 0 && !loading && (
                                    <View style={styles.badge}><Text style={styles.badgeText}>{pendingInvitations.length}</Text></View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
                                onPress={() => setActiveTab('sent')}
                            >
                                <Ionicons name="paper-plane-outline" size={16} color={activeTab === 'sent' ? theme.colors.primary : '#6B7280'} style={{ marginRight: 4 }} />
                                <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>Enviadas</Text>
                                {sentQuotations.length > 0 && !loading && (
                                    <View style={[styles.badge, { backgroundColor: '#3B82F6' }]}><Text style={styles.badgeText}>{sentQuotations.length}</Text></View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'won' && styles.tabActive]}
                                onPress={() => setActiveTab('won')}
                            >
                                <Ionicons name="trophy-outline" size={16} color={activeTab === 'won' ? '#10B981' : '#6B7280'} style={{ marginRight: 4 }} />
                                <Text style={[styles.tabText, activeTab === 'won' && styles.tabTextActive, activeTab === 'won' && { color: '#10B981' }]}>Ganadas</Text>
                                {wonQuotations.length > 0 && !loading && (
                                    <View style={[styles.badge, { backgroundColor: '#10B981' }]}><Text style={styles.badgeText}>{wonQuotations.length}</Text></View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'history' && styles.tabActive]}
                                onPress={() => setActiveTab('history')}
                            >
                                <Ionicons name="time-outline" size={16} color={activeTab === 'history' ? theme.colors.primary : '#6B7280'} style={{ marginRight: 4 }} />
                                <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Historial</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    <View style={styles.responsiveContainer}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                                <Text style={styles.loadingText}>Cargando cotizaciones...</Text>
                            </View>
                        ) : (
                            <>
                                {/* Tab: Invitations */}
                                {activeTab === 'invitations' && (
                                    <>
                                        {pendingInvitations.length === 0 ? (
                                            <View style={styles.emptyState}>
                                                <Ionicons name="mail-open-outline" size={64} color="#E5E7EB" />
                                                <Text style={styles.emptyText}>No tienes invitaciones pendientes</Text>
                                                <Text style={styles.emptySubtext}>Cuando un gestor te invite a cotizar, aparecerá aquí</Text>
                                            </View>
                                        ) : (
                                            pendingInvitations.map(invitation => (
                                                <TouchableOpacity
                                                    key={invitation.id}
                                                    style={styles.card}
                                                    activeOpacity={0.7}
                                                    onPress={() => handleViewInvitation(invitation)}
                                                >
                                                    <View style={styles.cardHeader}>
                                                        <View style={styles.codeContainer}>
                                                            <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
                                                            <Text style={styles.cardCode}>{invitation.requestId.slice(-6).toUpperCase()}</Text>
                                                        </View>
                                                        {getStatusBadge(invitation.status)}
                                                    </View>
                                                    <Text style={styles.cardTitle} numberOfLines={2}>{invitation.requestDescription}</Text>
                                                    <View style={styles.divider} />
                                                    <View style={styles.cardFooter}>
                                                        <View style={styles.dateRow}>
                                                            <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                                                            <Text style={styles.dateLabel}>Límite: </Text>
                                                            <Text style={[styles.dateText, { fontWeight: '600', color: '#EF4444' }]}>{formatDate(invitation.dueDate)}</Text>
                                                        </View>
                                                        <View style={styles.actionPrompt}>
                                                            <Text style={styles.actionPromptText}>Cotizar</Text>
                                                            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </>
                                )}

                                {/* Tab: Sent Quotations */}
                                {activeTab === 'sent' && (
                                    <>
                                        {sentQuotations.length === 0 ? (
                                            <View style={styles.emptyState}>
                                                <Ionicons name="paper-plane-outline" size={64} color="#E5E7EB" />
                                                <Text style={styles.emptyText}>No has enviado cotizaciones</Text>
                                                <Text style={styles.emptySubtext}>Las cotizaciones enviadas esperando resultado aparecerán aquí</Text>
                                            </View>
                                        ) : (
                                            sentQuotations.map(quotation => (
                                                <TouchableOpacity
                                                    key={quotation.id}
                                                    style={styles.card}
                                                    activeOpacity={0.7}
                                                    onPress={() => onNavigateToQuotationForm(quotation.invitationId, quotation.requestId)}
                                                >
                                                    <View style={styles.cardHeader}>
                                                        <View style={styles.codeContainer}>
                                                            <Text style={styles.cardCode}>#{quotation.requestId.slice(-6).toUpperCase()}</Text>
                                                        </View>
                                                        {getStatusBadge(quotation.status)}
                                                    </View>
                                                    <Text style={styles.cardTitle} numberOfLines={2}>{quotation._requestDescription}</Text>
                                                    <View style={styles.amountContainer}>
                                                        <Text style={styles.amountLabel}>Tu oferta</Text>
                                                        <Text style={styles.amountValue}>${quotation.totalAmount.toLocaleString()} {quotation.currency}</Text>
                                                    </View>
                                                    <View style={styles.infoRow}>
                                                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                                                        <Text style={styles.infoText}>Entrega en {quotation.deliveryDays} días</Text>
                                                    </View>
                                                    <View style={styles.divider} />
                                                    <View style={styles.cardFooter}>
                                                        <Text style={styles.dateText}>Enviada el {formatDate(quotation.submittedAt)}</Text>
                                                        <Text style={styles.waitingText}>⏳ Esperando resultado</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </>
                                )}

                                {/* Tab: Won Quotations */}
                                {activeTab === 'won' && (
                                    <>
                                        {wonQuotations.length === 0 ? (
                                            <View style={styles.emptyState}>
                                                <Ionicons name="trophy-outline" size={64} color="#E5E7EB" />
                                                <Text style={styles.emptyText}>Aún no tienes cotizaciones ganadas</Text>
                                                <Text style={styles.emptySubtext}>Cuando ganes una cotización, aparecerá aquí</Text>
                                            </View>
                                        ) : (
                                            wonQuotations.map(quotation => (
                                                <TouchableOpacity
                                                    key={quotation.id}
                                                    style={[styles.card, styles.cardWinner]}
                                                    activeOpacity={0.7}
                                                    onPress={() => onNavigateToQuotationForm(quotation.invitationId, quotation.requestId)}
                                                >
                                                    <View style={styles.cardHeader}>
                                                        <View style={styles.codeContainer}>
                                                            <Ionicons name="trophy" size={14} color="#059669" />
                                                            <Text style={[styles.cardCode, { color: '#059669' }]}>#{quotation.requestId.slice(-6).toUpperCase()}</Text>
                                                        </View>
                                                        {getStatusBadge('selected', true, quotation._paymentStatus)}
                                                    </View>
                                                    <Text style={styles.cardTitle} numberOfLines={2}>{quotation._requestDescription}</Text>
                                                    <View style={styles.amountContainer}>
                                                        <Text style={styles.amountLabel}>Monto Adjudicado</Text>
                                                        <Text style={[styles.amountValue, { color: '#059669' }]}>${quotation.totalAmount.toLocaleString()} {quotation.currency}</Text>
                                                    </View>
                                                    {getPaymentStatusBadge(quotation._paymentStatus)}
                                                    <View style={styles.divider} />
                                                    <View style={styles.cardFooter}>
                                                        <Text style={styles.dateText}>Adjudicada el {formatDate(quotation.selectedAt || quotation.submittedAt)}</Text>
                                                        <View style={styles.actionPrompt}>
                                                            <Text style={styles.actionPromptText}>Ver detalle</Text>
                                                            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </>
                                )}

                                {/* Tab: History */}
                                {activeTab === 'history' && (
                                    <>
                                        {historyQuotations.length === 0 ? (
                                            <View style={styles.emptyState}>
                                                <Ionicons name="file-tray-outline" size={64} color="#E5E7EB" />
                                                <Text style={styles.emptyText}>Sin historial</Text>
                                                <Text style={styles.emptySubtext}>Las cotizaciones pagadas o no seleccionadas aparecerán aquí</Text>
                                            </View>
                                        ) : (
                                            historyQuotations.map(quotation => (
                                                <TouchableOpacity
                                                    key={quotation.id}
                                                    style={styles.card}
                                                    activeOpacity={0.7}
                                                    onPress={() => onNavigateToQuotationForm(quotation.invitationId, quotation.requestId)}
                                                >
                                                    <View style={styles.cardHeader}>
                                                        <View style={styles.codeContainer}>
                                                            <Text style={styles.cardCode}>#{quotation.requestId.slice(-6).toUpperCase()}</Text>
                                                        </View>
                                                        {getStatusBadge(quotation._paymentStatus === 'paid' || quotation._paymentStatus === 'verified' ? 'selected' : quotation.status, quotation.isWinner, quotation._paymentStatus)}
                                                    </View>
                                                    <Text style={styles.cardTitle} numberOfLines={2}>{quotation._requestDescription}</Text>
                                                    <View style={styles.amountContainer}>
                                                        <Text style={styles.amountLabel}>Monto</Text>
                                                        <Text style={styles.amountValue}>${quotation.totalAmount.toLocaleString()} {quotation.currency}</Text>
                                                    </View>
                                                    {quotation.isWinner ? getPaymentStatusBadge(quotation._paymentStatus) : (
                                                        <View style={styles.rejectedBanner}>
                                                            <Ionicons name="close-circle" size={16} color="#991B1B" />
                                                            <Text style={styles.rejectedText}>No seleccionada</Text>
                                                        </View>
                                                    )}
                                                    <View style={[styles.cardFooter, { marginTop: 12 }]}>
                                                        <Text style={styles.dateText}>Fecha: {formatDate(quotation.submittedAt)}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </View>
                </ScrollView>
            </View>
        </ResponsiveNavShell>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        color: '#666',
    },
    header: {
        backgroundColor: theme.colors.primary,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10,
    },
    headerWeb: {
        paddingTop: 24,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    tabsWrapper: {
        backgroundColor: '#FFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 5,
    },
    tabsContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    tabActive: {
        backgroundColor: '#E8F4FF',
    },
    tabText: {
        fontSize: 14,
        color: '#6B7280',
    },
    tabTextActive: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    badge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    responsiveContainer: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#D1D5DB',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    cardWinner: {
        borderWidth: 2,
        borderColor: '#10B981',
        backgroundColor: '#ECFDF5',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardCode: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 12,
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    dateText: {
        fontSize: 12,
        color: '#6B7280',
    },
    actionPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionPromptText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    amountContainer: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    amountLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#6B7280',
    },
    waitingText: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '500',
    },
    paymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    paymentBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    rejectedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEE2E2',
        padding: 10,
        borderRadius: 8,
        marginTop: 8,
    },
    rejectedText: {
        fontSize: 13,
        color: '#991B1B',
        fontWeight: '500',
    },
});

export default ProviderQuotationsScreen;