import { FacialLandmark, FacialTemplate, Suspect, FaceMatchResult } from '../types';
import { calculateCosineSimilarity, generateBiometricVector, quickHash } from './crypto';

export interface FacialExtractionOptions {
  enhancedCCTV?: boolean;
  occlusionType?: 'NONE' | 'MASK' | 'GLASSES' | 'SHADOW' | 'HOODIE';
}

/**
 * Generate 68 standard facial landmarks mapped to normalized percentages (0-100%)
 */
export function generateFacialLandmarks(seedStr: string, hasOcclusion = false): FacialLandmark[] {
  const landmarks: FacialLandmark[] = [];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i);

  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const jitter = (val: number, max = 2) => val + (rand() * max * 2 - max);

  // Left Eye (38-41)
  landmarks.push({ x: jitter(36), y: jitter(38), type: 'LEFT_EYE', confidence: hasOcclusion ? 65 : 98 });
  landmarks.push({ x: jitter(39), y: jitter(37), type: 'LEFT_EYE', confidence: hasOcclusion ? 68 : 99 });
  landmarks.push({ x: jitter(42), y: jitter(39), type: 'LEFT_EYE', confidence: hasOcclusion ? 64 : 97 });
  landmarks.push({ x: jitter(39), y: jitter(40), type: 'LEFT_EYE', confidence: hasOcclusion ? 66 : 98 });

  // Right Eye (43-46)
  landmarks.push({ x: jitter(58), y: jitter(39), type: 'RIGHT_EYE', confidence: hasOcclusion ? 65 : 98 });
  landmarks.push({ x: jitter(61), y: jitter(37), type: 'RIGHT_EYE', confidence: hasOcclusion ? 69 : 99 });
  landmarks.push({ x: jitter(64), y: jitter(38), type: 'RIGHT_EYE', confidence: hasOcclusion ? 63 : 97 });
  landmarks.push({ x: jitter(61), y: jitter(40), type: 'RIGHT_EYE', confidence: hasOcclusion ? 67 : 98 });

  // Left Eyebrow (18-22)
  landmarks.push({ x: jitter(32), y: jitter(31), type: 'EYEBROW_L', confidence: 95 });
  landmarks.push({ x: jitter(37), y: jitter(29), type: 'EYEBROW_L', confidence: 97 });
  landmarks.push({ x: jitter(43), y: jitter(30), type: 'EYEBROW_L', confidence: 96 });

  // Right Eyebrow (23-27)
  landmarks.push({ x: jitter(57), y: jitter(30), type: 'EYEBROW_R', confidence: 96 });
  landmarks.push({ x: jitter(63), y: jitter(29), type: 'EYEBROW_R', confidence: 97 });
  landmarks.push({ x: jitter(68), y: jitter(31), type: 'EYEBROW_R', confidence: 95 });

  // Nose Bridge & Tip (28-34)
  landmarks.push({ x: jitter(50), y: jitter(37), type: 'NOSE_BRIDGE', confidence: 98 });
  landmarks.push({ x: jitter(50), y: jitter(44), type: 'NOSE_BRIDGE', confidence: 97 });
  landmarks.push({ x: jitter(50), y: jitter(51), type: 'NOSE_TIP', confidence: hasOcclusion ? 45 : 99 });
  landmarks.push({ x: jitter(46), y: jitter(53), type: 'NOSE_TIP', confidence: hasOcclusion ? 40 : 96 });
  landmarks.push({ x: jitter(54), y: jitter(53), type: 'NOSE_TIP', confidence: hasOcclusion ? 42 : 96 });

  // Mouth & Lips (49-60)
  landmarks.push({ x: jitter(42), y: jitter(65), type: 'MOUTH_L', confidence: hasOcclusion ? 30 : 98 });
  landmarks.push({ x: jitter(50), y: jitter(63), type: 'MOUTH_L', confidence: hasOcclusion ? 35 : 97 });
  landmarks.push({ x: jitter(58), y: jitter(65), type: 'MOUTH_R', confidence: hasOcclusion ? 32 : 98 });
  landmarks.push({ x: jitter(50), y: jitter(70), type: 'MOUTH_R', confidence: hasOcclusion ? 28 : 96 });

  // Chin & Jawline (1-17)
  landmarks.push({ x: jitter(24), y: jitter(46), type: 'JAW_LINE', confidence: 91 });
  landmarks.push({ x: jitter(27), y: jitter(60), type: 'JAW_LINE', confidence: 93 });
  landmarks.push({ x: jitter(34), y: jitter(74), type: 'JAW_LINE', confidence: 94 });
  landmarks.push({ x: jitter(44), y: jitter(82), type: 'JAW_LINE', confidence: 95 });
  landmarks.push({ x: jitter(50), y: jitter(84), type: 'CHIN', confidence: hasOcclusion ? 55 : 98 });
  landmarks.push({ x: jitter(56), y: jitter(82), type: 'JAW_LINE', confidence: 95 });
  landmarks.push({ x: jitter(66), y: jitter(74), type: 'JAW_LINE', confidence: 94 });
  landmarks.push({ x: jitter(73), y: jitter(60), type: 'JAW_LINE', confidence: 93 });
  landmarks.push({ x: jitter(76), y: jitter(46), type: 'JAW_LINE', confidence: 91 });

  return landmarks;
}

/**
 * Generate synthetic FacialTemplate for a suspect
 */
export function createFacialTemplate(seedStr: string, options?: FacialExtractionOptions): FacialTemplate {
  const isOccluded = options?.occlusionType && options.occlusionType !== 'NONE';
  const landmarks = generateFacialLandmarks(seedStr, isOccluded);
  const vector = generateBiometricVector(`face_embedding_${seedStr}`);
  
  return {
    templateId: `FACE-TPL-${quickHash(seedStr).substring(0, 10).toUpperCase()}`,
    vectorEmbedding: vector,
    landmarks,
    qualityScore: options?.enhancedCCTV ? 88 : (isOccluded ? 62 : 95),
    resolution: options?.enhancedCCTV ? '1080x1080 (Super-Resolved 4x)' : '720x720 (Native ISO Mugshot)',
    poseAngles: {
      yaw: 2.1,
      pitch: -1.4,
      roll: 0.8
    },
    lightingScore: options?.enhancedCCTV ? 82 : 94,
    occlusionDetected: !!isOccluded,
    occlusionType: options?.occlusionType || 'NONE',
    cctvEnhanced: !!options?.enhancedCCTV,
    capturedAt: new Date().toISOString()
  };
}

/**
 * Compare an uploaded/captured photo embedding with repository suspects
 */
export function matchFaceAgainstRepository(
  probeEmbedding: number[],
  probeImageUrl: string,
  suspects: Suspect[],
  options?: {
    isCctvEnhanced?: boolean;
    occlusionType?: 'NONE' | 'MASK' | 'GLASSES' | 'SHADOW' | 'HOODIE';
    resolution?: string;
  }
): FaceMatchResult {
  let highestScore = 0;
  let bestMatchSuspect: Suspect | undefined;

  for (const suspect of suspects) {
    if (suspect.facialTemplate?.vectorEmbedding) {
      const similarity = calculateCosineSimilarity(probeEmbedding, suspect.facialTemplate.vectorEmbedding);
      if (similarity > highestScore) {
        highestScore = similarity;
        bestMatchSuspect = suspect;
      }
    }
  }

  const isMatched = highestScore >= 0.82 && !!bestMatchSuspect;
  const confidence = isMatched ? Number((highestScore * 0.98 + 0.01).toFixed(3)) : Number((highestScore * 0.7).toFixed(3));

  return {
    searchId: `F-SRCH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    matched: isMatched,
    confidence: Math.min(0.994, confidence),
    suspect: isMatched ? bestMatchSuspect : undefined,
    probeImageUrl,
    candidateMugshotUrl: bestMatchSuspect?.mugshotUrl,
    landmarkAlignmentScore: isMatched ? Math.floor(88 + Math.random() * 10) : Math.floor(40 + Math.random() * 20),
    vectorSimilarity: Number(highestScore.toFixed(4)),
    qualityAssessment: {
      resolution: options?.resolution || '720x720 HD',
      lighting: options?.isCctvEnhanced ? 'Histogram Equalized (CLAHE)' : 'Standard Studio Ambient (Pass)',
      pose: 'Frontal Yaw ≤ 4.2° (Compliant)',
      occlusion: options?.occlusionType && options.occlusionType !== 'NONE' ? `Partial (${options.occlusionType})` : 'None (Full Facial Oval Visible)',
      cctvSuperResolved: !!options?.isCctvEnhanced,
    }
  };
}

/**
 * Pre-configured presets for quick field testing (High-res, low-res CCTV, partial shadow, masked)
 */
export interface FieldPhotoPreset {
  id: string;
  label: string;
  category: 'CCTV' | 'FIELD_ARREST' | 'ARCHIVAL' | 'OBSTRUCTED';
  imageUrl: string;
  description: string;
  targetSuspectId: string;
  isCctv: boolean;
  occlusion: 'NONE' | 'MASK' | 'GLASSES' | 'SHADOW' | 'HOODIE';
}

export const PHOTO_SEARCH_PRESETS: FieldPhotoPreset[] = [
  {
    id: 'PRESET-EMEKA-MUGSHOT',
    label: 'Emeka Okafor (Scorpion of Mile 2)',
    category: 'FIELD_ARREST',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    description: 'High-definition field arrest photograph captured during Lekki-Ikoyi corridor interception.',
    targetSuspectId: 'SUSP-01J98K21',
    isCctv: false,
    occlusion: 'NONE'
  },
  {
    id: 'PRESET-FATIMA-CCTV',
    label: 'Fatima Mohammed (CCTV Night Frame)',
    category: 'CCTV',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    description: 'Low-lux 480p ATM CCTV surveillance grab from Garki Area 11 Abuja banking corridor.',
    targetSuspectId: 'SUSP-01J99M44',
    isCctv: true,
    occlusion: 'SHADOW'
  },
  {
    id: 'PRESET-IBRAHIM-HOODIE',
    label: 'Ibrahim Gwandu (Partial Hoodie / Shadow)',
    category: 'OBSTRUCTED',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    description: 'Highway checkpoint night capture with overhead cap shadow and high-contrast ambient flare.',
    targetSuspectId: 'SUSP-01J66C12',
    isCctv: true,
    occlusion: 'HOODIE'
  },
  {
    id: 'PRESET-BABAJIDE-SURV',
    label: 'Babajide Adeleke (ATM Forensics Capture)',
    category: 'CCTV',
    imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
    description: 'Surveillance feed crop from financial institution lobby during corporate BEC incident.',
    targetSuspectId: 'SUSP-01J77B33',
    isCctv: true,
    occlusion: 'GLASSES'
  },
  {
    id: 'PRESET-CHINEDU-HD',
    label: 'Chinedu Okonkwo (Archival Dossier)',
    category: 'ARCHIVAL',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    description: 'Calabar SCID formal intake frontal mugshot with color-calibrated neutral gray background.',
    targetSuspectId: 'SUSP-01J55D99',
    isCctv: false,
    occlusion: 'NONE'
  }
];

export const PYTHON_FASTAPI_CODE_SNIPPET = `# ==============================================================================
# N-CRIMS Backend: Visual Facial Embedding & pgvector Search Endpoint
# Framework: FastAPI + PyTorch / InsightFace / ArcFace + SQLAlchemy + pgvector
# Compliance: NDPA 2023 Sec. 24 + Zero-Trust Role-Based Enforcement
# ==============================================================================

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from pydantic import BaseModel
import numpy as np
import cv2
import torch
import insightface
from insightface.app import FaceAnalysis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Optional
import hashlib
import datetime

app = FastAPI(title="N-CRIMS Biometric & Facial Vector Search API", version="1.0.0")

# 1. Initialize ArcFace / InsightFace 512-dim embedding engine
face_app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640, 640))

class QualityAssessment(BaseModel):
    resolution: str
    lighting_snr: float
    pose_yaw: float
    pose_pitch: float
    occlusion_flag: bool
    cctv_enhanced: bool

class FaceSearchResponse(BaseModel):
    search_id: str
    match_found: bool
    confidence_score: float
    vector_distance: float
    suspect_id: Optional[str]
    system_ref: Optional[str]
    full_name: Optional[str]
    active_warrants_count: int
    risk_level: Optional[str]
    primary_mugshot_url: Optional[str]
    quality: QualityAssessment
    audit_hash: str

@app.post("/api/v1/search-by-face", response_model=FaceSearchResponse)
async def search_by_face(
    file: UploadFile = File(...),
    purpose_code: str = Form(..., description="Mandatory NDPA Purpose Code e.g., CHECKPOINT_INTERCEPTION"),
    officer_badge: str = Form(...),
    device_id: str = Form(...),
    enhance_cctv: bool = Form(False),
    db: AsyncSession = Depends(get_db_session),
    current_officer = Depends(verify_jwt_officer)
):
    # Validate file format
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid image payload format.")

    # Read binary bytes into OpenCV matrix
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Unable to decode image frame.")

    # Low-Quality CCTV Enhancement (CLAHE + Bilateral Filtering if requested)
    if enhance_cctv:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

    # Detect faces and extract normalized 512-dim ArcFace embedding vector
    faces = face_app.get(img)
    if len(faces) == 0:
        return FaceSearchResponse(
            search_id=f"F-SRCH-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            match_found=False,
            confidence_score=0.0,
            vector_distance=1.0,
            suspect_id=None,
            system_ref=None,
            full_name=None,
            active_warrants_count=0,
            risk_level=None,
            primary_mugshot_url=None,
            quality=QualityAssessment(
                resolution=f"{img.shape[1]}x{img.shape[0]}",
                lighting_snr=0.0,
                pose_yaw=0.0,
                pose_pitch=0.0,
                occlusion_flag=True,
                cctv_enhanced=enhance_cctv
            ),
            audit_hash=generate_audit_hash(officer_badge, "NO_FACE_DETECTED")
        )

    # Select most prominent detected face
    primary_face = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
    embedding = primary_face.embedding
    norm_embedding = (embedding / np.linalg.norm(embedding)).tolist()

    # 2. Query PostgreSQL pgvector with Cosine Distance (<=>)
    # Cosine distance = 1 - cosine_similarity. Threshold < 0.28 implies high-confidence match.
    sql_query = text("""
        SELECT 
            s.id AS suspect_id,
            s.system_ref,
            s.first_name,
            s.last_name,
            s.risk_level,
            s.mugshot_url,
            (SELECT COUNT(*) FROM warrants w WHERE w.suspect_id = s.id AND w.status = 'ACTIVE') AS active_warrants,
            (ft.vector_embedding <=> :embedding::vector) AS cosine_distance
        FROM facial_templates ft
        JOIN suspects s ON ft.suspect_id = s.id
        ORDER BY ft.vector_embedding <=> :embedding::vector
        LIMIT 1;
    """)

    result = await db.execute(sql_query, {"embedding": norm_embedding})
    row = result.fetchone()

    match_found = False
    confidence_score = 0.0
    suspect_data = None
    dist = 1.0

    if row and row.cosine_distance < 0.32: # Match threshold
        match_found = True
        dist = float(row.cosine_distance)
        # Cosine similarity to percentage confidence mapping
        confidence_score = round(max(0.0, min(1.0, 1.0 - (dist * 0.75))), 4)
        suspect_data = row

    # 3. Write Immutable NDPA 2023 Audit Log Entry
    audit_hash = await record_ndpa_audit_entry(
        db=db,
        officer_badge=officer_badge,
        action="FACIAL_SEARCH",
        purpose_code=purpose_code,
        result_status="MATCH_FOUND" if match_found else "NO_MATCH",
        confidence=confidence_score,
        target_suspect_id=suspect_data.suspect_id if suspect_data else None
    )

    return FaceSearchResponse(
        search_id=f"F-SRCH-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        match_found=match_found,
        confidence_score=confidence_score,
        vector_distance=dist,
        suspect_id=suspect_data.suspect_id if suspect_data else None,
        system_ref=suspect_data.system_ref if suspect_data else None,
        full_name=f"{suspect_data.first_name} {suspect_data.last_name}" if suspect_data else None,
        active_warrants_count=suspect_data.active_warrants if suspect_data else 0,
        risk_level=suspect_data.risk_level if suspect_data else None,
        primary_mugshot_url=suspect_data.mugshot_url if suspect_data else None,
        quality=QualityAssessment(
            resolution=f"{img.shape[1]}x{img.shape[0]}",
            lighting_snr=round(float(primary_face.det_score) * 100, 1),
            pose_yaw=round(float(primary_face.pose[0]), 1) if hasattr(primary_face, 'pose') else 0.0,
            pose_pitch=round(float(primary_face.pose[1]), 1) if hasattr(primary_face, 'pose') else 0.0,
            occlusion_flag=bool(primary_face.det_score < 0.75),
            cctv_enhanced=enhance_cctv
        ),
        audit_hash=audit_hash
    )
`;

export const REACT_NATIVE_CODE_SNIPPET = `// ==============================================================================
// N-CRIMS Mobile Frontend: React Native Multimodal Dual-Search Screen
// Features: Fingerprint BLE Scanner + Camera / Photo Picker + Offline Buffer
// ==============================================================================

import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  Alert 
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function MultimodalSearchScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState<'fingerprint' | 'facial'>('fingerprint');
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [purposeCode, setPurposeCode] = useState('CHECKPOINT_INTERCEPTION');
  const [isOffline, setIsOffline] = useState(false);

  // VisionCamera device
  const devices = useCameraDevices();
  const device = devices.back;

  // Handle Photo Picker (Gallery / CCTV Screen Grab)
  const handlePickFromGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.9,
    });
    if (result.assets && result.assets.length > 0) {
      setCapturedPhotoUri(result.assets[0].uri || null);
    }
  };

  // Perform Visual 1:N Facial Query
  const handleExecuteFaceSearch = async () => {
    if (!capturedPhotoUri) {
      Alert.alert('Missing Image', 'Please capture a photo or select an image file first.');
      return;
    }

    setIsSearching(true);
    try {
      if (isOffline) {
        // Buffer encrypted scan into SQLite / MMKV local offline queue
        Alert.alert('Offline Mode', 'Photo encrypted with AES-256 and queued for automatic sync.');
        setIsSearching(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', {
        uri: capturedPhotoUri,
        type: 'image/jpeg',
        name: 'field_probe.jpg',
      } as any);
      formData.append('purpose_code', purposeCode);
      formData.append('officer_badge', 'NPF-AP-84920');
      formData.append('device_id', 'MOB-NPF-FIELD-01');

      const response = await fetch('https://api.ncrims.gov.ng/api/v1/search-by-face', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer <SECURE_JWT_TOKEN>',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      if (data.match_found) {
        navigation.navigate('SuspectDossier', { suspectId: data.suspect_id });
      } else {
        Alert.alert('No Criminal Match Found', 'Subject not present in National Crime Registry.');
      }
    } catch (err) {
      Alert.alert('Search Error', 'Unable to reach Central Criminal Registry server.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Multimodal Switcher Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'fingerprint' && styles.tabButtonActive]}
          onPress={() => setActiveTab('fingerprint')}
        >
          <Ionicons 
            name="finger-print-outline" 
            size={18} 
            color={activeTab === 'fingerprint' ? '#10b981' : '#94a3b8'} 
          />
          <Text style={[styles.tabText, activeTab === 'fingerprint' && styles.tabTextActive]}>
            Scan Fingerprint
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'facial' && styles.tabButtonActive]}
          onPress={() => setActiveTab('facial')}
        >
          <Ionicons 
            name="camera-outline" 
            size={18} 
            color={activeTab === 'facial' ? '#10b981' : '#94a3b8'} 
          />
          <Text style={[styles.tabText, activeTab === 'facial' && styles.tabTextActive]}>
            Upload / Take Photo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      {activeTab === 'fingerprint' ? (
        <View style={styles.fingerprintContainer}>
          <Ionicons name="finger-print" size={100} color="#10b981" />
          <Text style={styles.sensorStatus}>Bluetooth Scanner Connected: Suprema G10</Text>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.buttonText}>Capture Ridge Pattern</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.facialContainer}>
          {capturedPhotoUri ? (
            <Image source={{ uri: capturedPhotoUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.emptyPhotoBox}>
              <Ionicons name="person-outline" size={60} color="#64748b" />
              <Text style={styles.emptyPhotoText}>No Field Photo Selected</Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handlePickFromGallery}>
              <Ionicons name="images-outline" size={16} color="#ffffff" />
              <Text style={styles.buttonTextSmall}>Gallery / CCTV</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryButton, isSearching && { opacity: 0.6 }]}
              onPress={handleExecuteFaceSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <>
                  <Ionicons name="scan-outline" size={16} color="#0f172a" />
                  <Text style={[styles.buttonText, { color: '#0f172a' }]}>Query Facial AI</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  tabBar: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 4, margin: 12, borderRadius: 12 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  tabButtonActive: { backgroundColor: '#1e293b' },
  tabText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#ffffff', fontWeight: 'bold' },
  fingerprintContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  sensorStatus: { color: '#94a3b8', marginVertical: 16, fontSize: 12 },
  facialContainer: { alignItems: 'center', padding: 16 },
  previewImage: { width: 240, height: 280, borderRadius: 16, borderWidth: 2, borderColor: '#10b981' },
  emptyPhotoBox: { width: 240, height: 280, borderRadius: 16, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16' },
  emptyPhotoText: { color: '#64748b', fontSize: 12, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%', maxWidth: 320 },
  primaryButton: { flex: 1, backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  secondaryButton: { flex: 1, backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  buttonText: { fontWeight: 'bold', fontSize: 13 },
  buttonTextSmall: { color: '#ffffff', fontWeight: '600', fontSize: 12 },
});
`;
