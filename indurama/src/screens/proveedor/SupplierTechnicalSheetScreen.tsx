import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../styles/theme';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { loadAllSupplierData, getInternalManagement } from '../../services/supplierDataService';
import { useTranslation } from 'react-i18next';

interface SupplierTechnicalSheetScreenProps {
  supplierId: string;
  onNavigateBack?: () => void;
}

const SupplierTechnicalSheetScreen: React.FC<SupplierTechnicalSheetScreenProps> = ({
  supplierId,
  onNavigateBack,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [supplierData, setSupplierData] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([1, 2, 3, 4]));

  useEffect(() => {
    const loadSupplierData = async () => {
      try {
        setLoading(true);

        // Load from subcollections
        const [supplierInfo, internalInfo, userDoc] = await Promise.all([
          loadAllSupplierData(supplierId),
          getInternalManagement(supplierId),
          getDoc(doc(db, 'users', supplierId))
        ]);

        // Merge all data
        const userData = userDoc.exists() ? userDoc.data() : {};

        setSupplierData({
          // Basic user data
          companyName: userData.companyName || '',
          email: userData.email || '',
          category: userData.category || '',

          // Company Profile
          ...supplierInfo.companyProfile,

          // Contacts (flatten)
          generalManagerName: supplierInfo.contacts?.generalManager?.name,
          generalManagerEmail: supplierInfo.contacts?.generalManager?.email,
          commercialContactName: supplierInfo.contacts?.commercial?.name,
          commercialContactEmail: supplierInfo.contacts?.commercial?.email,
          qualityContactName: supplierInfo.contacts?.quality?.name,
          qualityContactEmail: supplierInfo.contacts?.quality?.email,

          // Banking
          ...supplierInfo.banking,

          // Credit
          ...supplierInfo.credit,

          // Internal Management
          ...internalInfo
        });
      } catch (error) {
        console.error('Error loading supplier data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSupplierData();
  }, [supplierId]);

  const toggleSection = (section: number) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Image source={require('../../../assets/icons/arrow-left.png')} style={styles.backIcon} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('proveedor.technicalSheet.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('proveedor.technicalSheet.subtitle')}</Text>
        </View>

        <TouchableOpacity>
          <Image source={require('../../../assets/icons/star.png')} style={styles.starIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Supplier Header Card */}
        <View style={styles.supplierCard}>
          <Text style={styles.supplierName}>{supplierData?.companyName || t('proveedor.technicalSheet.noName')}</Text>
          <Text style={styles.supplierLocation}>
            {supplierData?.category || t('proveedor.technicalSheet.supplier')} • {supplierData?.country || 'N/A'}
          </Text>

          <View style={styles.supplierIds}>
            <View style={styles.idBadge}>
              <Text style={styles.idLabel}>ID: {supplierData?.taxId || supplierData?.ruc || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* 1. Información General */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection(1)}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>{t('proveedor.technicalSheet.generalInfo')}</Text>
            </View>
            <Image
              source={require('../../../assets/icons/chevron-down.png')}
              style={[styles.chevronIcon, expandedSections.has(1) && styles.chevronIconUp]}
            />
          </TouchableOpacity>

          {expandedSections.has(1) && (
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('proveedor.technicalSheet.fiscalAddress')}</Text>
                <Text style={styles.infoValue}>{supplierData?.fiscalAddress || supplierData?.address || t('proveedor.technicalSheet.notSpecified')}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('proveedor.technicalSheet.centralPhone')}</Text>
                <Text style={styles.infoValueLink}>{supplierData?.centralPhone || supplierData?.phone || t('proveedor.technicalSheet.notSpecified')}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('proveedor.technicalSheet.website')}</Text>
                <Text style={styles.infoValueLink}>{supplierData?.website || t('proveedor.technicalSheet.notSpecified')}</Text>
              </View>

              <View style={styles.infoRowHeader}>
                <Text style={styles.infoLabel}>{t('proveedor.technicalSheet.internalManagement')}</Text>
                <TouchableOpacity>
                  <Text style={styles.editLink}>{t('common.edit')}</Text>
                </TouchableOpacity>
              </View>

              {!supplierData?.induramaExecutive && !supplierData?.epiAuditor ? (
                <View style={styles.warningCard}>
                  <Image source={require('../../../assets/icons/clock.png')} style={styles.warningIcon} />
                  <Text style={styles.warningText}>{t('proveedor.technicalSheet.assignEvaluator')}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoGridItem}>
                      <Text style={styles.infoLabel}>{t('proveedor.technicalSheet.executive')}</Text>
                      <Text style={styles.infoValue}>{supplierData?.induramaExecutive || t('proveedor.technicalSheet.notAssigned')}</Text>
                    </View>
                    <View style={styles.infoGridItem}>
                      <Text style={styles.infoLabel}>{t('proveedor.technicalSheet.epiAuditor')}</Text>
                      <Text style={styles.infoValue}>{supplierData?.epiAuditor || t('proveedor.technicalSheet.notAssigned')}</Text>
                    </View>
                  </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoGridItem}>
                      <Text style={styles.infoLabel}>{t('proveedor.technicalSheet.auditType')}</Text>
                      <Text style={styles.infoValue}>{supplierData?.auditType || t('proveedor.technicalSheet.notSpecified')}</Text>
                    </View>
                    <View style={styles.infoGridItem}>
                      <Text style={styles.infoLabel}>{t('proveedor.technicalSheet.evalDate')}</Text>
                      <Text style={styles.infoValue}>{supplierData?.evalDate || t('proveedor.technicalSheet.notSpecified')}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* 2. Perfil Operativo */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection(2)}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>{t('proveedor.technicalSheet.operationalProfile')}</Text>
            </View>
            <Image
              source={require('../../../assets/icons/chevron-down.png')}
              style={[styles.chevronIcon, expandedSections.has(2) && styles.chevronIconUp]}
            />
          </TouchableOpacity>

          {expandedSections.has(2) && (
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PRODUCTOS QUE FABRICA</Text>
                <Text style={styles.infoValue}>Pernos industriales, Tuercas de seguridad, Arandelas de presión, Varillas roscadas.</Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoLabel}>MATERIAS PRIMAS</Text>
                  <Text style={styles.infoValue}>Acero 1040, 304</Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoLabel}>PROVEEDORES PRINCIPALES</Text>
                  <Text style={styles.infoValue}>Acería del Ecuador, Importadora Andina</Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoLabel}>CAPACIDAD</Text>
                  <Text style={styles.infoValue}>50k unid/mes</Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoLabel}>TURNOS</Text>
                  <Text style={styles.infoValue}>2 Turnos</Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoLabel}>EMPLEADOS</Text>
                  <Text style={styles.infoValue}>120</Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoLabel}>ÁREA FÁBRICA</Text>
                  <Text style={styles.infoValue}>2,500 m²</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>VENTAS ANUALES (USD)</Text>
              </View>
              <View style={styles.salesGrid}>
                <View style={styles.salesItem}>
                  <Text style={styles.salesYear}>2024</Text>
                  <Text style={styles.salesValue}>$1.2M</Text>
                </View>
                <View style={styles.salesItem}>
                  <Text style={styles.salesYear}>2023</Text>
                  <Text style={styles.salesValue}>$1.5M</Text>
                </View>
                <View style={styles.salesItem}>
                  <Text style={styles.salesYear}>2022</Text>
                  <Text style={styles.salesValue}>$1.8M</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PRINCIPALES CLIENTES</Text>
                <Text style={styles.infoValue}>General Motors, Mabe, Indurama (15%)</Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoLabel}>PATENTES</Text>
                  <Text style={styles.infoValue}>N/A</Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoLabel}>REGISTRO TRAYACTACIA</Text>
                  <Text style={styles.infoValue}>N/A</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 3. Contactos y Certif. */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection(3)}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>3</Text>
              </View>
              <Text style={styles.sectionTitle}>{t('proveedor.technicalSheet.contactsCerts')}</Text>
            </View>
            <Image
              source={require('../../../assets/icons/chevron-down.png')}
              style={[styles.chevronIcon, expandedSections.has(3) && styles.chevronIconUp]}
            />
          </TouchableOpacity>

          {expandedSections.has(3) && (
            <View style={styles.sectionContent}>
              {supplierData?.generalManagerName && (
                <View style={styles.contactCard}>
                  <Image source={require('../../../assets/icons/profile.png')} style={styles.contactIcon} />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>GERENTE GENERAL</Text>
                    <Text style={styles.contactName}>{supplierData.generalManagerName}</Text>
                    <Text style={styles.contactEmail}>{supplierData.generalManagerEmail || 'N/A'}</Text>
                  </View>
                </View>
              )}

              {supplierData?.commercialContactName && (
                <View style={styles.contactCard}>
                  <Image source={require('../../../assets/icons/home.png')} style={styles.contactIcon} />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>COMERCIAL / VENTAS</Text>
                    <Text style={styles.contactName}>{supplierData.commercialContactName}</Text>
                    <Text style={styles.contactEmail}>{supplierData.commercialContactEmail || 'N/A'}</Text>
                  </View>
                </View>
              )}

              {supplierData?.qualityContactName && (
                <View style={styles.contactCard}>
                  <Image source={require('../../../assets/icons/key.png')} style={styles.contactIcon} />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>CALIDAD / TÉCNICO</Text>
                    <Text style={styles.contactName}>{supplierData.qualityContactName}</Text>
                    <Text style={styles.contactEmail}>{supplierData.qualityContactEmail || 'N/A'}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 4. Datos Bancarios */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection(4)}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>4</Text>
              </View>
              <Text style={styles.sectionTitle}>{t('proveedor.technicalSheet.bankingData')}</Text>
            </View>
            <Image
              source={require('../../../assets/icons/chevron-down.png')}
              style={[styles.chevronIcon, expandedSections.has(4) && styles.chevronIconUp]}
            />
          </TouchableOpacity>

          {expandedSections.has(4) && (
            <View style={styles.sectionContent}>
              {supplierData?.creditDays && (
                <View style={styles.warningCard}>
                  <Image source={require('../../../assets/icons/clock.png')} style={styles.warningIcon} />
                  <Text style={styles.warningText}>Crédito Otorgado: {supplierData.creditDays} Días</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>MODO DE PAGO</Text>
                <Text style={styles.infoValue}>{supplierData?.paymentMethod || 'No especificado'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>BANCO</Text>
                <Text style={styles.infoValue}>{supplierData?.bankName || 'No especificado'}</Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoLabel}>CUENTA</Text>
                  <Text style={styles.infoValue}>{supplierData?.accountNumber || 'N/A'}</Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoLabel}>TIPO</Text>
                  <Text style={styles.infoValue}>{supplierData?.accountType || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoLabel}>SWIFT</Text>
                  <Text style={styles.infoValue}>{supplierData?.bicSwift || 'N/A'}</Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoLabel}>IBAN</Text>
                  <Text style={styles.infoValue}>{supplierData?.iban || 'N/A'}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView >

      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.editMasterButton}>
          <Image source={require('../../../assets/icons/edit.png')} style={styles.editMasterIcon} />
          <Text style={styles.editMasterText}>{t('proveedor.technicalSheet.editMasterData')}</Text>
        </TouchableOpacity>
      </View>
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    zIndex: 0,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFF',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerDecoration: {
    position: 'absolute',
    right: -40,
    top: 10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 2,
  },
  starIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  supplierCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  cardDecoration: {
    position: 'absolute',
    right: -30,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  supplierName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  supplierLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  supplierIds: {
    flexDirection: 'row',
    gap: 12,
  },
  idBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  idLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  chevronIcon: {
    width: 22,
    height: 12,
    tintColor: '#9CA3AF',
  },
  chevronIconUp: {
    transform: [{ rotate: '180deg' }],
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  infoRow: {
    marginBottom: 14,
  },
  infoRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  infoValueLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  editLink: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  infoGridItem: {
    flex: 1,
  },
  salesGrid: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  salesItem: {
    alignItems: 'center',
  },
  salesYear: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  salesValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  contactIcon: {
    width: 20,
    height: 20,
    tintColor: '#6B7280',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  certCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 10,
  },
  certLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certIcon: {
    width: 20,
    height: 20,
    tintColor: '#10B981',
    marginRight: 12,
  },
  certTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  certDate: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 2,
  },
  certLink: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningIcon: {
    width: 18,
    height: 18,
    tintColor: '#F59E0B',
    marginRight: 10,
  },
  warningText: {
    fontSize: 11,
    color: '#78350F',
    flex: 1,
    fontWeight: '500',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 10,
  },
  downloadIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
    marginRight: 12,
  },
  downloadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  downloadLink: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  editMasterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  editMasterIcon: {
    width: 18,
    height: 18,
    tintColor: '#1F2937',
    marginRight: 8,
  },
  editMasterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
});

export default SupplierTechnicalSheetScreen;
