import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface AgeVerificationScreenProps {
  onComplete: (dateOfBirth: string) => void;
  onCancel: () => void;
}

export default function AgeVerificationScreen({
  onComplete,
  onCancel,
}: AgeVerificationScreenProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const validateDate = (): boolean => {
    // Validate day
    const dayNum = parseInt(day);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      Alert.alert('Invalid Date', 'Please enter a valid day (1-31)');
      return false;
    }

    // Validate month
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      Alert.alert('Invalid Date', 'Please enter a valid month (1-12)');
      return false;
    }

    // Validate year
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      Alert.alert('Invalid Date', `Please enter a valid year (1900-${currentYear})`);
      return false;
    }

    // Check if date is valid
    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (
      date.getDate() !== dayNum ||
      date.getMonth() !== monthNum - 1 ||
      date.getFullYear() !== yearNum
    ) {
      Alert.alert('Invalid Date', 'The date you entered does not exist');
      return false;
    }

    return true;
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const handleConfirm = () => {
    if (!day || !month || !year) {
      Alert.alert('Incomplete Date', 'Please enter the full date of birth');
      return;
    }

    if (!validateDate()) {
      return;
    }

    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const age = calculateAge(birthDate);

    if (age < 18) {
      Alert.alert(
        'Age Verification Failed',
        `The recipient is ${age} years old and must be 18 or older to receive this delivery.`,
        [
          {
            text: 'Cancel Delivery',
            style: 'destructive',
            onPress: onCancel,
          },
          {
            text: 'Re-enter Date',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    // Format date as DD/MM/YYYY
    const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    onComplete(formattedDate);
  };

  const handleDayChange = (text: string) => {
    // Only allow numbers and max 2 digits
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
    setDay(cleaned);
  };

  const handleMonthChange = (text: string) => {
    // Only allow numbers and max 2 digits
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
    setMonth(cleaned);
  };

  const handleYearChange = (text: string) => {
    // Only allow numbers and max 4 digits
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
    setYear(cleaned);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Age Verification</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="shield-checkmark" size={32} color="#FF9800" />
          <View style={styles.warningText}>
            <Text style={styles.warningTitle}>Age Restricted Item</Text>
            <Text style={styles.warningSubtitle}>
              Recipient must be 18 years or older
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Verify Recipient's Age</Text>
          <Text style={styles.instructionText}>
            Ask the recipient for their date of birth and enter it below. You may request to see their ID for verification.
          </Text>
        </View>

        {/* Date Input */}
        <View style={styles.dateInputContainer}>
          <Text style={styles.dateLabel}>Date of Birth</Text>

          <View style={styles.dateInputRow}>
            {/* Day Input */}
            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateInputLabel}>DD</Text>
              <TextInput
                style={styles.dateInput}
                value={day}
                onChangeText={handleDayChange}
                placeholder="DD"
                placeholderTextColor="#CCCCCC"
                keyboardType="number-pad"
                maxLength={2}
                returnKeyType="next"
              />
            </View>

            <Text style={styles.dateSeparator}>/</Text>

            {/* Month Input */}
            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateInputLabel}>MM</Text>
              <TextInput
                style={styles.dateInput}
                value={month}
                onChangeText={handleMonthChange}
                placeholder="MM"
                placeholderTextColor="#CCCCCC"
                keyboardType="number-pad"
                maxLength={2}
                returnKeyType="next"
              />
            </View>

            <Text style={styles.dateSeparator}>/</Text>

            {/* Year Input */}
            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateInputLabel}>YYYY</Text>
              <TextInput
                style={styles.dateInput}
                value={year}
                onChangeText={handleYearChange}
                placeholder="YYYY"
                placeholderTextColor="#CCCCCC"
                keyboardType="number-pad"
                maxLength={4}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* Info Notice */}
        <View style={styles.infoNotice}>
          <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
          <Text style={styles.infoNoticeText}>
            If the recipient cannot provide valid ID or is under 18, you must refuse the delivery.
          </Text>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.refuseButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={24} color="#FF5252" />
            <Text style={styles.refuseButtonText}>Refuse Delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!day || !month || !year) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            activeOpacity={0.7}
            disabled={!day || !month || !year}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>Verify & Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9800',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  warningSubtitle: {
    fontSize: 14,
    color: '#F57C00',
    fontFamily: 'Poppins',
  },
  instructionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  dateInputContainer: {
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
  dateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 16,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  dateInputWrapper: {
    alignItems: 'center',
  },
  dateInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  dateInput: {
    width: 80,
    height: 56,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  dateSeparator: {
    fontSize: 28,
    fontWeight: '700',
    color: '#CCCCCC',
    fontFamily: 'Poppins',
    marginTop: 28,
  },
  infoNotice: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  infoNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    fontFamily: 'Poppins',
    lineHeight: 18,
  },
  spacer: {
    flex: 1,
  },
  actionsContainer: {
    gap: 12,
  },
  refuseButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#FF5252',
  },
  refuseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF5252',
    fontFamily: 'Poppins',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
});
