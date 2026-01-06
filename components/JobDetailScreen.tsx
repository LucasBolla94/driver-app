import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import PhotoCaptureScreen from './PhotoCaptureScreen';
import SignatureScreen from './SignatureScreen';
import AgeVerificationScreen from './AgeVerificationScreen';

interface Stop {
  id: string;
  type: 'collect' | 'drop';
  address: string;
  postcode: string;
  jobRef: string;
  itemDescription?: string;
  requiresAgeVerification?: boolean;
  collectStatus?: 'pending' | 'arrived' | 'completed';
  dropStatus?: 'pending' | 'arrived' | 'completed';
  photoUrl?: string;
  signatureUrl?: string;
}

interface JobDetailScreenProps {
  stop: Stop;
  onBack?: () => void;
}

type WorkflowStep =
  | 'overview'
  | 'collect-photo'
  | 'drop-photo'
  | 'signature'
  | 'age-verification';

export default function JobDetailScreen({ stop, onBack }: JobDetailScreenProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('overview');
  const [collectPhotoUri, setCollectPhotoUri] = useState<string | null>(null);
  const [dropPhotoUri, setDropPhotoUri] = useState<string | null>(null);
  const [signatureUri, setSignatureUri] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<'pending' | 'arrived' | 'completed'>('pending');

  const isCollect = stop.type === 'collect';
  const isDrop = stop.type === 'drop';

  const getStopStatus = () => {
    // Use local status instead of stop status
    return localStatus;
  };

  const handleArrivedAtLocation = () => {
    Alert.alert(
      'Confirm Arrival',
      `Have you arrived at the ${isCollect ? 'collection' : 'drop-off'} location?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Update local status to 'arrived'
            setLocalStatus('arrived');
            console.log('Arrived at location, status updated to arrived');
            // TODO: Update status in Supabase
          },
        },
      ]
    );
  };

  const handleCollectPhotoTaken = (photoUri: string) => {
    setCollectPhotoUri(photoUri);
    setCurrentStep('overview');
    // TODO: Upload photo to Supabase storage
  };

  const handleMarkCollected = () => {
    if (!collectPhotoUri) {
      Alert.alert('Photo Required', 'Please take a photo of the item first');
      return;
    }

    Alert.alert(
      'Complete Collection',
      'Confirm that you have collected the item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            // TODO: Update collect status to 'completed' in Supabase
            console.log('Collection completed');
            if (onBack) onBack();
          },
        },
      ]
    );
  };

  const handleArrivedAtDropOff = () => {
    Alert.alert(
      'Confirm Arrival',
      'Have you arrived at the drop-off location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Update local status to 'arrived'
            setLocalStatus('arrived');
            console.log('Arrived at drop-off, status updated to arrived');
            // TODO: Update status in Supabase
          },
        },
      ]
    );
  };

  const handleDropPhotoTaken = (photoUri: string) => {
    setDropPhotoUri(photoUri);

    // If age verification required, go to that step
    if (stop.requiresAgeVerification) {
      setCurrentStep('age-verification');
    } else {
      // Otherwise go to signature
      setCurrentStep('signature');
    }

    // TODO: Upload photo to Supabase storage
  };

  const handleAgeVerificationComplete = (dob: string) => {
    setDateOfBirth(dob);
    setCurrentStep('signature');
  };

  const handleSignatureComplete = (signatureData: string) => {
    setSignatureUri(signatureData);
    setCurrentStep('overview');
    // TODO: Upload signature to Supabase storage
  };

  const handleCompleteDropOff = () => {
    if (!dropPhotoUri) {
      Alert.alert('Photo Required', 'Please take a photo of the delivered item first');
      return;
    }

    if (!signatureUri) {
      Alert.alert('Signature Required', 'Please get the recipient\'s signature first');
      return;
    }

    if (stop.requiresAgeVerification && !dateOfBirth) {
      Alert.alert('Age Verification Required', 'Please verify the recipient\'s age first');
      return;
    }

    Alert.alert(
      'Complete Drop-Off',
      'Confirm that the delivery is complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            // TODO: Update drop status to 'completed' in Supabase
            console.log('Drop-off completed', {
              dropPhotoUri,
              signatureUri,
              dateOfBirth,
            });
            if (onBack) onBack();
          },
        },
      ]
    );
  };

  // Photo Capture Screen
  if (currentStep === 'collect-photo') {
    return (
      <PhotoCaptureScreen
        title="Photo of Item"
        instruction="Take a clear photo of the item you are collecting"
        onPhotoTaken={handleCollectPhotoTaken}
        onCancel={() => setCurrentStep('overview')}
      />
    );
  }

  if (currentStep === 'drop-photo') {
    return (
      <PhotoCaptureScreen
        title="Delivery Photo"
        instruction="Take a photo of the item being delivered"
        onPhotoTaken={handleDropPhotoTaken}
        onCancel={() => setCurrentStep('overview')}
      />
    );
  }

  // Age Verification Screen
  if (currentStep === 'age-verification') {
    return (
      <AgeVerificationScreen
        onComplete={handleAgeVerificationComplete}
        onCancel={() => setCurrentStep('overview')}
      />
    );
  }

  // Signature Screen
  if (currentStep === 'signature') {
    return (
      <SignatureScreen
        onComplete={handleSignatureComplete}
        onCancel={() => setCurrentStep('overview')}
      />
    );
  }

  // Overview Screen
  const status = getStopStatus();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{stop.jobRef}</Text>
          <Text style={styles.headerSubtitle}>
            {isCollect ? 'Collection' : 'Drop-Off'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              isCollect ? styles.statusBadgeCollect : styles.statusBadgeDrop,
            ]}
          >
            <Ionicons
              name={isCollect ? 'arrow-up' : 'arrow-down'}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.statusBadgeText}>
              {isCollect ? 'COLLECTION' : 'DROP-OFF'}
            </Text>
          </View>
        </View>

        {/* Address Card */}
        <View style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <Ionicons name="location" size={24} color="#000000" />
            <Text style={styles.addressLabel}>
              {isCollect ? 'COLLECTION ADDRESS' : 'DELIVERY ADDRESS'}
            </Text>
          </View>
          <Text style={styles.address}>{stop.address}</Text>
          <Text style={styles.postcode}>{stop.postcode}</Text>

          {/* Open in Maps */}
          <TouchableOpacity style={styles.mapsButton} activeOpacity={0.7}>
            <Ionicons name="navigate" size={20} color="#2196F3" />
            <Text style={styles.mapsButtonText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Item Info */}
        {stop.itemDescription && (
          <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Ionicons name="cube" size={24} color="#000000" />
              <Text style={styles.itemLabel}>ITEM DESCRIPTION</Text>
            </View>
            <Text style={styles.itemDescription}>{stop.itemDescription}</Text>
          </View>
        )}

        {/* Age Verification Notice */}
        {stop.requiresAgeVerification && (
          <View style={styles.ageNotice}>
            <Ionicons name="shield-checkmark" size={24} color="#FF9800" />
            <View style={styles.ageNoticeText}>
              <Text style={styles.ageNoticeTitle}>Age Verification Required</Text>
              <Text style={styles.ageNoticeSubtitle}>
                You must verify the recipient is 18+ before completing this delivery
              </Text>
            </View>
          </View>
        )}

        {/* Workflow Steps */}
        <View style={styles.workflowCard}>
          <Text style={styles.workflowTitle}>
            {isCollect ? 'Collection Steps' : 'Delivery Steps'}
          </Text>

          {isCollect ? (
            <>
              {/* Collect Step 1: Arrived */}
              <View style={styles.workflowStep}>
                <View
                  style={[
                    styles.stepNumber,
                    status !== 'pending' && styles.stepNumberComplete,
                  ]}
                >
                  {status !== 'pending' ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNumberText}>1</Text>
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Arrived at Collection</Text>
                  <Text style={styles.stepDescription}>
                    Confirm when you arrive at the location
                  </Text>
                </View>
              </View>

              {/* Collect Step 2: Take Photo */}
              <View style={styles.stepConnector} />
              <View style={styles.workflowStep}>
                <View
                  style={[
                    styles.stepNumber,
                    collectPhotoUri && styles.stepNumberComplete,
                  ]}
                >
                  {collectPhotoUri ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNumberText}>2</Text>
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Take Photo</Text>
                  <Text style={styles.stepDescription}>
                    Photo of item being collected
                  </Text>
                  {collectPhotoUri && (
                    <View style={styles.stepComplete}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.stepCompleteText}>Photo taken</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Collect Step 3: Mark Collected */}
              <View style={styles.stepConnector} />
              <View style={styles.workflowStep}>
                <View
                  style={[
                    styles.stepNumber,
                    status === 'completed' && styles.stepNumberComplete,
                  ]}
                >
                  {status === 'completed' ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNumberText}>3</Text>
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Mark as Collected</Text>
                  <Text style={styles.stepDescription}>
                    Complete the collection process
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Drop Step 1: Arrived */}
              <View style={styles.workflowStep}>
                <View
                  style={[
                    styles.stepNumber,
                    status !== 'pending' && styles.stepNumberComplete,
                  ]}
                >
                  {status !== 'pending' ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNumberText}>1</Text>
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Arrived at Drop-Off</Text>
                  <Text style={styles.stepDescription}>
                    Confirm when you arrive at the location
                  </Text>
                </View>
              </View>

              {/* Drop Step 2: Take Photo */}
              <View style={styles.stepConnector} />
              <View style={styles.workflowStep}>
                <View
                  style={[
                    styles.stepNumber,
                    dropPhotoUri && styles.stepNumberComplete,
                  ]}
                >
                  {dropPhotoUri ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNumberText}>2</Text>
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Take Photo</Text>
                  <Text style={styles.stepDescription}>
                    Photo of item being delivered
                  </Text>
                  {dropPhotoUri && (
                    <View style={styles.stepComplete}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.stepCompleteText}>Photo taken</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Drop Step 3: Age Verification (if required) */}
              {stop.requiresAgeVerification && (
                <>
                  <View style={styles.stepConnector} />
                  <View style={styles.workflowStep}>
                    <View
                      style={[
                        styles.stepNumber,
                        dateOfBirth && styles.stepNumberComplete,
                      ]}
                    >
                      {dateOfBirth ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : (
                        <Text style={styles.stepNumberText}>3</Text>
                      )}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Verify Age</Text>
                      <Text style={styles.stepDescription}>
                        Confirm recipient is 18+
                      </Text>
                      {dateOfBirth && (
                        <View style={styles.stepComplete}>
                          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          <Text style={styles.stepCompleteText}>Age verified</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </>
              )}

              {/* Drop Step 4: Get Signature */}
              <View style={styles.stepConnector} />
              <View style={styles.workflowStep}>
                <View
                  style={[
                    styles.stepNumber,
                    signatureUri && styles.stepNumberComplete,
                  ]}
                >
                  {signatureUri ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNumberText}>
                      {stop.requiresAgeVerification ? '4' : '3'}
                    </Text>
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Get Signature</Text>
                  <Text style={styles.stepDescription}>
                    Recipient's signature confirmation
                  </Text>
                  {signatureUri && (
                    <View style={styles.stepComplete}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.stepCompleteText}>Signature obtained</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Drop Step 5: Complete */}
              <View style={styles.stepConnector} />
              <View style={styles.workflowStep}>
                <View
                  style={[
                    styles.stepNumber,
                    status === 'completed' && styles.stepNumberComplete,
                  ]}
                >
                  {status === 'completed' ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNumberText}>
                      {stop.requiresAgeVerification ? '5' : '4'}
                    </Text>
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Complete Drop-Off</Text>
                  <Text style={styles.stepDescription}>
                    Finish the delivery process
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isCollect && (
            <>
              {status === 'pending' && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleArrivedAtLocation}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Arrived at Collection</Text>
                </TouchableOpacity>
              )}

              {status === 'arrived' && (
                <>
                  {!collectPhotoUri && (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => setCurrentStep('collect-photo')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="camera" size={24} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>Take Photo of Item</Text>
                    </TouchableOpacity>
                  )}

                  {collectPhotoUri && (
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={handleMarkCollected}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="checkmark-done-circle" size={24} color="#FFFFFF" />
                      <Text style={styles.completeButtonText}>Mark as Collected</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </>
          )}

          {isDrop && (
            <>
              {status === 'pending' && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleArrivedAtDropOff}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Arrived at Drop-Off</Text>
                </TouchableOpacity>
              )}

              {status === 'arrived' && (
                <>
                  {!dropPhotoUri && (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => setCurrentStep('drop-photo')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="camera" size={24} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>Take Delivery Photo</Text>
                    </TouchableOpacity>
                  )}

                  {dropPhotoUri && stop.requiresAgeVerification && !dateOfBirth && (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => setCurrentStep('age-verification')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>Verify Age (18+)</Text>
                    </TouchableOpacity>
                  )}

                  {dropPhotoUri &&
                    (!stop.requiresAgeVerification || dateOfBirth) &&
                    !signatureUri && (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => setCurrentStep('signature')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create" size={24} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>Get Signature</Text>
                    </TouchableOpacity>
                  )}

                  {dropPhotoUri &&
                    signatureUri &&
                    (!stop.requiresAgeVerification || dateOfBirth) && (
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={handleCompleteDropOff}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="checkmark-done-circle" size={24} color="#FFFFFF" />
                      <Text style={styles.completeButtonText}>Complete Drop-Off</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  statusBadgeCollect: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeDrop: {
    backgroundColor: '#FF5252',
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    letterSpacing: 1,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
    fontFamily: 'Poppins',
    letterSpacing: 1,
  },
  address: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  postcode: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Poppins',
    marginBottom: 16,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  mapsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2196F3',
    fontFamily: 'Poppins',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
    fontFamily: 'Poppins',
    letterSpacing: 1,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  ageNotice: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  ageNoticeText: {
    flex: 1,
  },
  ageNoticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF9800',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  ageNoticeSubtitle: {
    fontSize: 13,
    color: '#F57C00',
    fontFamily: 'Poppins',
  },
  workflowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workflowTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 20,
  },
  workflowStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginLeft: 15,
    marginVertical: 4,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberComplete: {
    backgroundColor: '#4CAF50',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666666',
    fontFamily: 'Poppins',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 4,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  stepComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  stepCompleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    fontFamily: 'Poppins',
  },
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  completeButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
});
