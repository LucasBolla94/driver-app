import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  PanResponder,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SignatureScreenProps {
  onComplete: (signatureData: string) => void;
  onCancel: () => void;
}

interface Point {
  x: number;
  y: number;
}

export default function SignatureScreen({
  onComplete,
  onCancel,
}: SignatureScreenProps) {
  const [paths, setPaths] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [hasSignature, setHasSignature] = useState(false);
  const currentPathRef = useRef<Point[]>([]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current = [{ x: locationX, y: locationY }];
        setCurrentPath([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current = [...currentPathRef.current, { x: locationX, y: locationY }];
        setCurrentPath([...currentPathRef.current]);
      },
      onPanResponderRelease: () => {
        if (currentPathRef.current.length > 0) {
          const newPath = [...currentPathRef.current];
          console.log('Adding path with', newPath.length, 'points');
          setPaths((prev) => {
            const updated = [...prev, newPath];
            console.log('Total paths now:', updated.length);
            return updated;
          });
          setHasSignature(true);
          currentPathRef.current = [];
          setCurrentPath([]);
        }
      },
    })
  ).current;

  const pathToSvgPath = (points: Point[]): string => {
    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  const handleClear = () => {
    setPaths([]);
    setCurrentPath([]);
    setHasSignature(false);
  };

  const handleConfirm = () => {
    if (!hasSignature) {
      Alert.alert('Signature Required', 'Please get the recipient\'s signature before confirming');
      return;
    }

    // Convert signature to data format
    const signatureData = `signature-${Date.now()}`;
    onComplete(signatureData);
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.headerTitle}>Signature Required</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionContainer}>
          <Ionicons name="create-outline" size={32} color="#000000" />
          <Text style={styles.instructionText}>
            Ask the recipient to sign below with their finger
          </Text>
        </View>

        {/* Signature Canvas */}
        <View style={styles.canvasContainer} {...panResponder.panHandlers}>
          <Svg style={styles.svg}>
            {/* Draw completed paths */}
            {paths.map((path, index) => {
              console.log(`Rendering path ${index} with ${path.length} points`);
              return (
                <Path
                  key={`path-${index}`}
                  d={pathToSvgPath(path)}
                  stroke="#000000"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              );
            })}
            {/* Draw current path */}
            {currentPath.length > 0 && (
              <Path
                key="current-path"
                d={pathToSvgPath(currentPath)}
                stroke="#000000"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>

          {/* Signature Line */}
          <View style={styles.signatureLine} />

          {/* Placeholder Text */}
          {!hasSignature && (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>Sign here</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
            disabled={!hasSignature}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={hasSignature ? '#000000' : '#CCCCCC'}
            />
            <Text
              style={[
                styles.clearButtonText,
                !hasSignature && styles.clearButtonTextDisabled,
              ]}
            >
              Clear
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              !hasSignature && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            activeOpacity={0.7}
            disabled={!hasSignature}
          >
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.confirmButtonText}>Confirm Signature</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1976D2',
    fontFamily: 'Poppins',
    flex: 1,
  },
  canvasContainer: {
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    borderStyle: 'dashed',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  svg: {
    flex: 1,
  },
  signatureLine: {
    position: 'absolute',
    bottom: 60,
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: '#CCCCCC',
    pointerEvents: 'none',
  },
  placeholderContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  placeholderText: {
    fontSize: 16,
    color: '#CCCCCC',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#000000',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  clearButtonTextDisabled: {
    color: '#CCCCCC',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
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
