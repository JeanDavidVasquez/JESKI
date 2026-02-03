import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking, Alert, Platform, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { Request, RequestStatus } from '../../types';

import { getRelativeTime, confirmReceipt } from '../../services/requestService';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { theme } from '../../styles/theme';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';

interface RequestDetailScreenProps {
  requestId: string;
  userId?: string;
  onBack: () => void;
  onNavigateToEdit?: (request: Request) => void;
  onNavigateToPurchaseOrder?: (requestId: string, quotationId: string) => void;
  onReceiptConfirmed?: () => void;
}

export const RequestDetailScreen: React.FC<RequestDetailScreenProps> = ({
  requestId,
  userId,
  onBack,
  onNavigateToEdit,
  onNavigateToPurchaseOrder,
  onReceiptConfirmed
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const currentUserId = userId || user?.id;
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  // Responsive
  const { isDesktopView } = useResponsive();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const docRef = doc(db, 'requests', requestId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() } as Request);
        }
      } catch (error) {
        console.error("Error fetching request:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const handleOpenDocument = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), t('requests.details.openError'));
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert(t('common.error'), t('requests.details.openError'));
    }
  };

  const handleConfirmReceipt = async () => {
    if (!currentUserId || !request) return;

    const doConfirm = async () => {
      setConfirming(true);
      try {
        await confirmReceipt(request.id, currentUserId);
        setRequest({
          ...request,
          status: RequestStatus.COMPLETED,
          receivedAt: new Date(),
          receivedConfirmedBy: currentUserId
        });

        if (Platform.OS === 'web') {
          alert(t('requests.details.confirmReceiptSuccess'));
        } else {
          Alert.alert(t('common.success'), t('requests.details.confirmReceiptSuccess'));
        }
        onReceiptConfirmed?.();
      } catch (error) {
        console.error('Error confirming receipt:', error);
        if (Platform.OS === 'web') {
          alert(t('requests.details.confirmReceiptError'));
        } else {
          Alert.alert(t('common.error'), t('requests.details.confirmReceiptError'));
        }
      } finally {
        setConfirming(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(t('requests.details.confirmReceiptQuestion'))) {
        await doConfirm();
      }
    } else {
      Alert.alert(
        t('solicitante.alerts.confirmReceiptTitle'),
        t('requests.details.confirmReceiptQuestion'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('requests.details.yesReceived'), onPress: doConfirm, style: 'default' }
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <Text>{t('requests.details.notFound')}</Text>
        <TouchableOpacity onPress={onBack}><Text>{t('requests.details.back')}</Text></TouchableOpacity>
      </View>
    );
  }

  // --- TIMELINE LOGIC ---
  const timelineEvents = [
    {
      title: t('timeline.steps.created'),
      user: request.userName || t('common.user'),
      role: t('solicitante.title'),
      date: request.createdAt,
      icon: 'document-text-outline',
      active: true
    }
  ];

  if (request.status === RequestStatus.PENDING) {
    timelineEvents.push({
      title: t('timeline.steps.waitingApproval'),
      user: t('roles.gestor'),
      role: t('solicitante.status.pending'),
      date: null,
      icon: 'time-outline',
      active: false
    });
  } else {
    timelineEvents.push({
      title: t('timeline.steps.inReview'),
      user: t('roles.gestor'),
      role: t('roles.gestor'),
      date: request.updatedAt,
      icon: 'search-outline',
      active: true
    });
  }

  if (request.status === RequestStatus.COMPLETED) {
    timelineEvents.push({
      title: t('timeline.steps.approved'),
      user: t('roles.gestor'),
      role: t('roles.gestor'),
      date: (request as any).completedAt || request.updatedAt,
      icon: 'checkmark-circle-outline',
      active: true
    });
  } else if (request.status === RequestStatus.REJECTED) {
    timelineEvents.push({
      title: t('timeline.steps.rejected'),
      user: t('roles.gestor'),
      role: t('roles.gestor'),
      date: (request as any).reviewedAt || request.updatedAt,
      icon: 'close-circle-outline',
      active: true
    });
  } else if (request.status === RequestStatus.QUOTING || (request.status as string) === 'cotizacion') {
    timelineEvents.push({
      title: t('timeline.steps.quoting'),
      user: t('timeline.invitedProviders'),
      role: t('timeline.process'),
      date: (request as any).quotationStartedAt || request.updatedAt,
      icon: 'pricetags-outline',
      active: true
    });
  } else if (request.status === RequestStatus.AWARDED || (request.status as string) === 'adjudicado') {
    timelineEvents.push({
      title: t('timeline.steps.awarded'),
      user: t('roles.gestor'),
      role: t('roles.gestor'),
      date: (request as any).adjudicatedAt || request.updatedAt,
      icon: 'ribbon-outline',
      active: true
    });
    // If not yet received
    if (!request.receivedAt) {
      timelineEvents.push({
        title: t('timeline.steps.pendingReceipt'),
        user: t('solicitante.title'),
        role: t('solicitante.requireAction'),
        date: null,
        icon: 'cube-outline',
        active: false
      });
    }
  } else if (request.status === RequestStatus.RECTIFICATION_REQUIRED) {
    timelineEvents.push({
      title: t('timeline.steps.correctionRequired'),
      user: t('roles.gestor'),
      role: t('roles.gestor'),
      date: (request as any).reviewedAt || request.updatedAt,
      icon: 'alert-circle-outline',
      active: true
    });
  }

  // Receipt confirmation step
  if (request.status === RequestStatus.COMPLETED && request.receivedAt) {
    timelineEvents.push({
      title: t('timeline.steps.receiptConfirmed'),
      user: request.receivedConfirmedBy === currentUserId ? t('common.you') : t('solicitante.title'),
      role: t('solicitante.status.completed'),
      date: request.receivedAt,
      icon: 'cube',
      active: true
    });
  }

  // --- RENDER ---
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Image
            source={require('../../../assets/icono_indurama.png')}
            style={{ width: 100, height: 36, tintColor: '#FFF' }}
            resizeMode="contain"
          />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroCode}>{request.code}</Text>
          <Text style={styles.heroDescription} numberOfLines={2}>
            {request.description}
          </Text>

          <View style={styles.badgeRow}>
            <View style={[
              styles.statusBadge,
              (request.status === 'awarded' || (request.status as string) === 'adjudicado') && { backgroundColor: '#9C27B0' },
              request.status === 'completed' && { backgroundColor: '#4CAF50' },
              request.status === 'pending' && { backgroundColor: '#FFA726' },
              (request.status === 'quoting' || (request.status as string) === 'cotizacion') && { backgroundColor: '#F59E0B' },
              (request.status === 'in_progress') && { backgroundColor: '#2196F3' },
              request.status === 'rejected' && { backgroundColor: '#F44336' },
            ]}>
              <Ionicons
                name={(request.status === 'awarded' || (request.status as string) === 'adjudicado') ? 'ribbon' :
                  request.status === 'completed' ? 'checkmark-circle' :
                    request.status === 'pending' ? 'time' :
                      request.status === 'in_progress' ? 'sync' : 'alert-circle'}
                size={14}
                color="#FFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.statusBadgeText}>
                {request.status === 'awarded' || (request.status as string) === 'adjudicado' ? t('solicitante.status.awarded').toUpperCase() :
                  request.status === 'completed' ? t('solicitante.status.completed').toUpperCase() :
                    request.status === 'pending' ? t('solicitante.status.pending').toUpperCase() :
                      (request.status === 'quoting' || (request.status as string) === 'cotizacion') ? t('solicitante.status.quoting').toUpperCase() :
                        request.status === 'in_progress' ? t('solicitante.status.inProgress').toUpperCase() :
                          request.status === 'rejected' ? t('solicitante.status.rejected').toUpperCase() :
                            request.status === 'rectification_required' ? t('solicitante.status.rectificationRequired').toUpperCase() :
                              request.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Responsive Layout Content */}
        {/* Responsive Layout Content */}
        <View style={[
          styles.contentWrapper,
          isDesktopView && { maxWidth: 1200, alignSelf: 'center', width: '100%' }
        ]}>

          {/* 0. ACTION CARD (For Rectification Required) */}
          {/* @ts-ignore */}
          {request.status === 'rectification_required' && (
            <View style={[styles.actionCard, { borderLeftColor: '#FF9800', backgroundColor: '#FFF' }]}>
              <View style={styles.actionCardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="alert-circle-outline" size={28} color="#F57C00" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionCardTitle, { color: '#E65100' }]}>{t('requests.details.rectificationRequired')}</Text>
                  <Text style={styles.actionCardSubtitle}>
                    {t('requests.details.rectificationSubtitle')}
                  </Text>
                </View>
              </View>

              {/* @ts-ignore */}
              {request.rectificationComment && (
                <View style={{ backgroundColor: '#FFF8E1', padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#FFE0B2' }}>
                  <Text style={{ fontWeight: 'bold', color: '#E65100', marginBottom: 5 }}>{t('requests.details.managerComment')}</Text>
                  {/* @ts-ignore */}
                  <Text style={{ fontStyle: 'italic', color: '#5D4037' }}>"{request.rectificationComment}"</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.btnPrimary, { backgroundColor: '#FF9800', shadowColor: '#FF9800' }]}
                  onPress={() => onNavigateToEdit?.(request)}
                >
                  <Ionicons name="create-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.btnPrimaryText}>{t('requests.details.editAndFix')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {(request.status === 'awarded' || (request.status as string) === 'adjudicado') && currentUserId && (
            <View style={styles.actionCard}>
              <View style={styles.actionCardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="cube-outline" size={28} color="#4CAF50" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionCardTitle}>{t('requests.details.statusUpdate')}</Text>
                  <Text style={styles.actionCardSubtitle}>
                    {t('requests.details.awardedSubtitle')}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                {request.winnerQuotationId && onNavigateToPurchaseOrder && (
                  <TouchableOpacity
                    style={styles.btnOutline}
                    onPress={() => onNavigateToPurchaseOrder(request.id, request.winnerQuotationId!)}
                  >
                    <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.btnOutlineText}>{t('requests.details.viewOrder')}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.btnPrimary, confirming && { opacity: 0.7 }]}
                  onPress={handleConfirmReceipt}
                  disabled={confirming}
                >
                  {confirming ? (
                    <ActivityIndicator color="#FFF" size="small" style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  )}
                  <Text style={styles.btnPrimaryText}>
                    {confirming ? t('requests.details.confirming') : t('requests.details.confirmReceipt')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 2. QUICK INFO GRID */}
          <View style={[styles.grid, isDesktopView && styles.gridDesktop]}>
            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="person" size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.gridLabel}>{t('requests.details.requestor')}</Text>
                <Text style={styles.gridValue}>{request.userName || 'Usuario'}</Text>
              </View>
            </View>

            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="business" size={20} color="#EF6C00" />
              </View>
              <View>
                <Text style={styles.gridLabel}>{t('requests.details.department')}</Text>
                <Text style={styles.gridValue}>{request.department || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="calendar" size={20} color="#2E7D32" />
              </View>
              <View>
                <Text style={styles.gridLabel}>{t('requests.details.created')}</Text>
                <Text style={styles.gridValue}>{getRelativeTime(request.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: '#FCE4EC' }]}>
                <Ionicons name="alarm" size={20} color="#C2185B" />
              </View>
              <View>
                <Text style={styles.gridLabel}>{t('requests.details.dueDate')}</Text>
                <Text style={styles.gridValue}>{request.dueDate ? String(request.dueDate) : 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* 3. PROJECT INFO */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="briefcase-outline" size={22} color={theme.colors.primary} style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>{t('requests.details.projectDetails')}</Text>
            </View>

            <View style={[styles.infoRow, !isDesktopView && { flexDirection: 'column' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t('requests.details.projectType')}</Text>
                <Text style={styles.value}>{request.tipoProyecto}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t('requests.details.searchClass')}</Text>
                <Text style={styles.value}>{request.claseBusqueda}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>{t('requests.details.needDescription')}</Text>
            <Text style={styles.descriptionText}>{request.description}</Text>

            {/* Criteria Tags */}
            {(request.requiredBusinessType || request.requiredCategories?.length || request.requiredTags?.length) && (
              <View style={styles.criteriaContainer}>
                <Text style={[styles.label, { marginBottom: 8 }]}>{t('requests.details.providerCriteria')}</Text>
                <View style={styles.chipContainer}>
                  {request.requiredBusinessType && (
                    <View style={styles.chip}><Text style={styles.chipText}>{request.requiredBusinessType}</Text></View>
                  )}
                  {request.requiredCategories?.map((cat, i) => (
                    <View key={`cat-${i}`} style={styles.chip}><Text style={styles.chipText}>{cat}</Text></View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* 4. DOCUMENTS */}
          {request.documents && request.documents.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="folder-open-outline" size={22} color={theme.colors.primary} style={{ marginRight: 10 }} />
                <Text style={styles.cardTitle}>{t('requests.details.attachments')}</Text>
              </View>
              {request.documents.map((doc: any, index: number) => (
                <View key={index} style={styles.docItem}>
                  <View style={styles.docIcon}>
                    <Ionicons name="document-text" size={24} color="#1976D2" />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.docName}>{doc.name || `Documento ${index + 1}`}</Text>
                    <Text style={styles.docSize}>{t('requests.details.attached')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleOpenDocument(doc.url)} style={styles.downloadBtn}>
                    <Ionicons name="cloud-download-outline" size={20} color="#555" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* 5. TIMELINE */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="git-network-outline" size={22} color={theme.colors.primary} style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>{t('requests.details.statusHistory')}</Text>
            </View>

            <View style={styles.timelineContainer}>
              {timelineEvents.map((event, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineLine} />
                    <View style={[
                      styles.timelineDot,
                      event.active ? { backgroundColor: theme.colors.primary, borderColor: '#BBDEFB' } : { backgroundColor: '#E0E0E0', borderColor: '#F5F5F5' }
                    ]}>
                      <Ionicons name={event.icon as any} size={14} color={event.active ? "#FFF" : "#9E9E9E"} />
                    </View>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, !event.active && { color: '#9E9E9E' }]}>{event.title}</Text>
                    <View style={styles.timelineMeta}>
                      <Text style={styles.timelineUser}>{event.user} · {event.role}</Text>
                      <Text style={styles.timelineDate}>{event.date ? getRelativeTime(event.date) : ''}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Premium light gray background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA'
  },
  content: {
    flex: 1,
    marginTop: -40, // Overlap effect
  },
  contentWrapper: {
    paddingHorizontal: 16,
    width: '100%',
  },

  // HERO HEADER
  heroHeader: {
    backgroundColor: theme.colors.primary, // Indurama Blue
    paddingTop: 60,
    paddingBottom: 60, // Extra padding for overlap
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'flex-start',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  heroCode: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  heroDescription: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // CARDS
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#263238',
  },

  // ACTION CARD
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
    marginLeft: 16,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: '#546E7A',
    marginLeft: 16,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 12,
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF',
  },
  btnOutlineText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  btnPrimaryText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // GRID INFO
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  gridDesktop: {
    flexWrap: 'nowrap',
  },
  gridItem: {
    flex: 1,
    minWidth: 140, // For mobile wrapping
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gridLabel: {
    fontSize: 12,
    color: '#90A4AE',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#37474F',
  },

  // TEXT STYLES
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 20,
  },
  label: {
    fontSize: 13,
    color: '#78909C',
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: '#263238',
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#37474F',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#ECEFF1',
    marginVertical: 20,
  },

  // CHIPS
  criteriaContainer: {
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CFD8DC',
  },
  chipText: {
    fontSize: 12,
    color: '#546E7A',
    fontWeight: '500',
  },

  // DOCUMENTS
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    marginBottom: 10,
  },
  docIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#37474F',
    marginBottom: 2,
  },
  docSize: {
    fontSize: 12,
    color: '#90A4AE',
  },
  downloadBtn: {
    padding: 8,
  },

  // TIMELINE
  timelineContainer: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24, // Spacing between items
  },
  timelineLeft: {
    alignItems: 'center',
    width: 30,
    marginRight: 16,
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    bottom: -24, // Connect to next item
    width: 2,
    backgroundColor: '#F5F5F5',
    zIndex: -1,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2, // Align with dot
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#263238',
    marginBottom: 4,
  },
  timelineMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineUser: {
    fontSize: 13,
    color: '#78909C',
  },
  timelineDate: {
    fontSize: 13,
    color: '#90A4AE',
  }
});


