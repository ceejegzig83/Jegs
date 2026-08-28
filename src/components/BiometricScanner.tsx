import React, { useState, useEffect, useRef } from 'react';
import { 
  Fingerprint, 
  Camera, 
  Upload, 
  Scan, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  HardDrive, 
  Sliders, 
  Radio, 
  RotateCcw,
  Sparkles,
  Lock,
  Cpu,
  Layers,
  MapPin,
  FileCheck2,
  Image as ImageIcon,
  Video,
  Eye,
  Crosshair,
  Maximize2,
  RefreshCw,
  Code2,
  BookOpen,
  Wand2
} from 'lucide-react';
import { 
  Suspect, 
  OfficerProfile, 
  SearchPurposeCode, 
  BiometricMatchResult, 
  FaceMatchResult,
  FingerPosition,
  ModalityType 
} from '../types';
import { 
  calculateCosineSimilarity, 
  generateBiometricVector, 
  generateMinutiaePoints, 
  quickHash 
} from '../utils/crypto';
import { 
  PHOTO_SEARCH_PRESETS, 
  FieldPhotoPreset, 
  matchFaceAgainstRepository, 
  generateFacialLandmarks,
  PYTHON_FASTAPI_CODE_SNIPPET,
  REACT_NATIVE_CODE_SNIPPET
} from '../utils/faceMatching';

interface BiometricScannerProps {
  suspects: Suspect[];
  currentOfficer: OfficerProfile;
  isOffline: boolean;
  onMatchFound: (suspect: Suspect, confidence: number) => void;
  onQueueOfflineScan: (scanData: {
    modality?: ModalityType;
    fingerPosition?: FingerPosition;
    qualityScore: number;
    minutiaeCount?: number;
    vectorEmbedding: number[];
    purposeCode: SearchPurposeCode;
    gpsLocation: string;
    state: string;
    faceImageBase64?: string;
    landmarksCount?: number;
    cctvEnhanced?: boolean;
  }) => void;
  onLogAudit: (
    action: 'BIOMETRIC_SEARCH' | 'FACIAL_SEARCH' | 'DOSSIER_VIEW' | 'OFFLINE_SCAN_QUEUED',
    purposeCode: SearchPurposeCode,
    resourceId: string,
    summary: string,
    status: 'MATCH_FOUND' | 'NO_MATCH' | 'AUTHORIZED_ACCESS',
    confidence?: number
  ) => void;
  onNavigateToDossier: (suspect: Suspect) => void;
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({
  suspects,
  currentOfficer,
  isOffline,
  onMatchFound,
  onQueueOfflineScan,
  onLogAudit,
  onNavigateToDossier
}) => {
  // Multimodal Tab Selection
  const [activeModality, setActiveModality] = useState<ModalityType>('FINGERPRINT');
  const [purposeCode, setPurposeCode] = useState<SearchPurposeCode>('CHECKPOINT_INTERCEPTION');
  const [gpsLocation, setGpsLocation] = useState<string>('Mile 2 Expressway Checkpoint, Lagos State (Lat: 6.4698, Long: 3.2833)');
  
  // ==========================================
  // FINGERPRINT SCANNER STATE
  // ==========================================
  const [selectedFingerPreset, setSelectedFingerPreset] = useState<string>('SUSP-01J98K21');
  const [selectedFinger, setSelectedFinger] = useState<FingerPosition>('RIGHT_THUMB');
  const [selectedDevice, setSelectedDevice] = useState<string>('Suprema RealScan-G10 (Station & Mobile)');
  const [isFingerScanning, setIsFingerScanning] = useState<boolean>(false);
  const [fingerProgress, setFingerProgress] = useState<number>(0);
  const [fingerStepLabel, setFingerStepLabel] = useState<string>('Scanner Idle');
  const [activeMinutiaeCount, setActiveMinutiaeCount] = useState<number>(0);
  const [fingerQualityScore, setFingerQualityScore] = useState<number>(94);
  const [fingerMatchResult, setFingerMatchResult] = useState<BiometricMatchResult | null>(null);
  const [laserPosition, setLaserPosition] = useState<number>(0);
  const [isHoveringSensor, setIsHoveringSensor] = useState<boolean>(false);

  // ==========================================
  // FACIAL RECOGNITION STATE
  // ==========================================
  const [photoSourceMode, setPhotoSourceMode] = useState<'PRESETS' | 'LIVE_CAMERA' | 'FILE_UPLOAD'>('PRESETS');
  const [selectedPhotoPreset, setSelectedPhotoPreset] = useState<FieldPhotoPreset>(PHOTO_SEARCH_PRESETS[0]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isEnhanceCctv, setIsEnhanceCctv] = useState<boolean>(false);
  const [isFaceScanning, setIsFaceScanning] = useState<boolean>(false);
  const [faceProgress, setFaceProgress] = useState<number>(0);
  const [faceStepLabel, setFaceStepLabel] = useState<string>('Facial Engine Ready');
  const [faceMatchResult, setFaceMatchResult] = useState<FaceMatchResult | null>(null);
  const [showMeshOverlay, setShowMeshOverlay] = useState<boolean>(true);
  const [detectedLandmarks, setDetectedLandmarks] = useState(generateFacialLandmarks('default'));
  
  // Developer/API Code Drawer
  const [showCodeSandbox, setShowCodeSandbox] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'FASTAPI_PGVECTOR' | 'REACT_NATIVE' | 'CCTV_EXPLANATION'>('FASTAPI_PGVECTOR');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fingerprint Scanner Timer Animation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFingerScanning) {
      const interval = setInterval(() => {
        setLaserPosition((prev) => (prev >= 100 ? 0 : prev + 4));
      }, 50);

      const runScanSteps = async () => {
        setFingerStepLabel('Acquiring optical capacitive ridge pattern...');
        setFingerProgress(20);
        await new Promise(r => setTimeout(r, 600));

        setFingerStepLabel('Extracting ISO/IEC 19794-2 Minutiae (Bifurcations & Endings)...');
        setFingerProgress(50);
        setActiveMinutiaeCount(Math.floor(40 + Math.random() * 12));
        await new Promise(r => setTimeout(r, 700));

        setFingerStepLabel('Synthesizing 128-dimensional biometric vector embedding...');
        setFingerProgress(75);
        await new Promise(r => setTimeout(r, 600));

        if (isOffline) {
          setFingerStepLabel('Offline Mode Active: Encrypting payload with AES-256-GCM & local caching...');
          setFingerProgress(100);
          await new Promise(r => setTimeout(r, 500));

          let vector: number[];
          if (selectedFingerPreset === 'UNKNOWN') {
            vector = generateBiometricVector('unknown_suspect_offline_' + Date.now());
          } else {
            const matchedTarget = suspects.find(s => s.id === selectedFingerPreset);
            vector = matchedTarget?.biometrics[0]?.vectorEmbedding || generateBiometricVector('seed_' + Date.now());
          }

          onQueueOfflineScan({
            modality: 'FINGERPRINT',
            fingerPosition: selectedFinger,
            qualityScore: fingerQualityScore,
            minutiaeCount: activeMinutiaeCount || 42,
            vectorEmbedding: vector,
            purposeCode,
            gpsLocation,
            state: 'Lagos',
          });

          onLogAudit(
            'OFFLINE_SCAN_QUEUED',
            purposeCode,
            'OFFLINE_QUEUE_BATCH',
            `Cached encrypted biometric scan (${selectedFinger}) at ${gpsLocation}`,
            'AUTHORIZED_ACCESS'
          );

          setFingerMatchResult({
            searchId: `OFF-RESOLVE-${Date.now()}`,
            timestamp: new Date().toISOString(),
            matched: false,
            confidence: 0,
            vectorDistance: 0,
            isOfflineResolved: true,
          });

          setIsFingerScanning(false);
          setFingerStepLabel('Scan Secured in Encrypted Offline Buffer');
          return;
        }

        setFingerStepLabel('Broadcasting 1:N vector similarity search against Central Criminal Registry...');
        setFingerProgress(90);
        await new Promise(r => setTimeout(r, 800));

        if (selectedFingerPreset === 'UNKNOWN') {
          const result: BiometricMatchResult = {
            searchId: `CCR-2026-SRCH-${Math.floor(100000 + Math.random() * 900000)}`,
            timestamp: new Date().toISOString(),
            matched: false,
            confidence: 0.12,
            matchMinutiaeCount: 6,
            vectorDistance: 0.88,
          };
          setFingerMatchResult(result);
          onLogAudit(
            'BIOMETRIC_SEARCH',
            purposeCode,
            'UNKNOWN_SUBJECT',
            `Biometric 1:N search executed with purpose ${purposeCode}; No matching record found in Central Criminal Registry.`,
            'NO_MATCH',
            0.12
          );
        } else {
          const matchedTarget = suspects.find(s => s.id === selectedFingerPreset) || suspects[0];
          const calculatedConfidence = 0.984;

          const result: BiometricMatchResult = {
            searchId: `CCR-2026-SRCH-${Math.floor(100000 + Math.random() * 900000)}`,
            timestamp: new Date().toISOString(),
            matched: true,
            confidence: calculatedConfidence,
            suspect: matchedTarget,
            matchMinutiaeCount: 38,
            vectorDistance: 0.016,
          };

          setFingerMatchResult(result);
          onMatchFound(matchedTarget, calculatedConfidence);
          onLogAudit(
            'BIOMETRIC_SEARCH',
            purposeCode,
            matchedTarget.id,
            `Biometric match verified for ${matchedTarget.firstName} ${matchedTarget.lastName} (${matchedTarget.systemRef}) with ${Math.round(calculatedConfidence * 100)}% confidence score.`,
            'MATCH_FOUND',
            calculatedConfidence
          );
        }

        setFingerProgress(100);
        setFingerStepLabel('Biometric Verification Complete');
        setIsFingerScanning(false);
      };

      runScanSteps();

      return () => {
        clearInterval(interval);
      };
    }
  }, [isFingerScanning]);

  // Clean up camera stream on unmount or switch
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Start live webcam feed
  const startLiveCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      setCameraStream(stream);
      setIsLiveCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError(err.message || 'Unable to access camera. Check device frame permissions.');
      setIsLiveCameraActive(false);
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsLiveCameraActive(false);
  };

  // Capture frame from webcam
  const captureLiveCameraSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setUploadedImageUrl(dataUrl);
        stopLiveCamera();
        setPhotoSourceMode('FILE_UPLOAD');
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImageUrl(event.target?.result as string);
        setPhotoSourceMode('FILE_UPLOAD');
      };
      reader.readAsDataURL(file);
    }
  };

  // Perform Facial Recognition Search
  const handleExecuteFaceSearch = async () => {
    setIsFaceScanning(true);
    setFaceProgress(15);
    setFaceStepLabel('Detecting facial bounding box and calculating pose orientation...');
    
    const activeImage = photoSourceMode === 'FILE_UPLOAD' && uploadedImageUrl 
      ? uploadedImageUrl 
      : selectedPhotoPreset.imageUrl;

    await new Promise(r => setTimeout(r, 600));
    setFaceProgress(45);
    setFaceStepLabel('Extracting 68 Deep Facial Landmarks (ISO 19794-5 Compliant)...');
    const landmarks = generateFacialLandmarks(
      selectedPhotoPreset.targetSuspectId || 'custom_face',
      selectedPhotoPreset.occlusion !== 'NONE'
    );
    setDetectedLandmarks(landmarks);

    await new Promise(r => setTimeout(r, 700));
    setFaceProgress(75);
    setFaceStepLabel(
      isEnhanceCctv 
        ? 'Applying CLAHE Histogram Equalization & Deep Super-Resolution 4x...' 
        : 'Generating 128-dimensional deep ArcFace facial embedding vector...'
    );

    await new Promise(r => setTimeout(r, 600));

    if (isOffline) {
      setFaceProgress(100);
      setFaceStepLabel('Offline Active: Image and facial vectors encrypted with AES-256 & queued.');
      
      const targetSuspect = suspects.find(s => s.id === selectedPhotoPreset.targetSuspectId);
      const vector = targetSuspect?.facialTemplate?.vectorEmbedding || generateBiometricVector('face_offline_' + Date.now());

      onQueueOfflineScan({
        modality: 'FACIAL',
        qualityScore: isEnhanceCctv ? 88 : 94,
        vectorEmbedding: vector,
        purposeCode,
        gpsLocation,
        state: 'Lagos',
        faceImageBase64: activeImage.substring(0, 80) + '...',
        landmarksCount: landmarks.length,
        cctvEnhanced: isEnhanceCctv,
      });

      onLogAudit(
        'OFFLINE_SCAN_QUEUED',
        purposeCode,
        'OFFLINE_FACE_QUEUE',
        `Cached encrypted field facial probe image at ${gpsLocation}`,
        'AUTHORIZED_ACCESS'
      );

      setFaceMatchResult({
        searchId: `OFF-FACE-${Date.now()}`,
        timestamp: new Date().toISOString(),
        matched: false,
        confidence: 0,
        probeImageUrl: activeImage,
        landmarkAlignmentScore: 0,
        vectorSimilarity: 0,
        qualityAssessment: {
          resolution: '720x720 (Cached Offline)',
          lighting: 'Offline Evaluated',
          pose: 'Yaw ≤ 5°',
          occlusion: 'Evaluated on server sync',
          cctvSuperResolved: isEnhanceCctv,
        },
        isOfflineResolved: true,
      });

      setIsFaceScanning(false);
      return;
    }

    setFaceProgress(90);
    setFaceStepLabel('Executing 1:N vector search against 36 States + FCT Mugshot Repository...');
    await new Promise(r => setTimeout(r, 700));

    // Generate match against suspect database
    let probeEmbedding: number[];
    if (selectedPhotoPreset.id === 'UNKNOWN') {
      probeEmbedding = generateBiometricVector('completely_unknown_face_' + Date.now());
    } else {
      const targetSuspect = suspects.find(s => s.id === selectedPhotoPreset.targetSuspectId);
      probeEmbedding = targetSuspect?.facialTemplate?.vectorEmbedding || generateBiometricVector('face_probe_' + Date.now());
    }

    const result = matchFaceAgainstRepository(probeEmbedding, activeImage, suspects, {
      isCctvEnhanced: isEnhanceCctv,
      occlusionType: selectedPhotoPreset.occlusion,
      resolution: isEnhanceCctv ? '1080x1080 (Super-Resolved)' : '720x720 HD',
    });

    setFaceMatchResult(result);
    setFaceProgress(100);
    setFaceStepLabel('Facial Matching & Cross-Jurisdiction Verification Complete');
    setIsFaceScanning(false);

    if (result.matched && result.suspect) {
      onMatchFound(result.suspect, result.confidence);
      onLogAudit(
        'FACIAL_SEARCH',
        purposeCode,
        result.suspect.id,
        `Visual facial match verified for ${result.suspect.firstName} ${result.suspect.lastName} (${result.suspect.systemRef}) with ${(result.confidence * 100).toFixed(1)}% confidence score.`,
        'MATCH_FOUND',
        result.confidence
      );
    } else {
      onLogAudit(
        'FACIAL_SEARCH',
        purposeCode,
        'UNKNOWN_PROBE_PHOTO',
        `Facial search executed with purpose ${purposeCode}; No matching record found in Central Criminal Registry.`,
        'NO_MATCH',
        result.confidence
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Multimodal Switcher & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
              <Crosshair className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Multimodal Identification & Verification Terminal
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v2.8 Live
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Dual biometric route: High-precision fingerprint minutiae vectors and deep facial recognition embeddings.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Purpose Code Pill */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">NDPA Statutory Purpose:</span>
                <select
                  value={purposeCode}
                  onChange={(e) => setPurposeCode(e.target.value as SearchPurposeCode)}
                  className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="CHECKPOINT_INTERCEPTION" className="bg-slate-900 text-white">Stop-and-Search / Checkpoint</option>
                  <option value="IDENTITY_VERIFICATION" className="bg-slate-900 text-white">Field Identity Verification</option>
                  <option value="ACTIVE_WARRANT_CHECK" className="bg-slate-900 text-white">Judicial Warrant Execution</option>
                  <option value="CRIMINAL_INVESTIGATION" className="bg-slate-900 text-white">SCID / Special Investigation</option>
                  <option value="BORDER_PATROL_SCREENING" className="bg-slate-900 text-white">Border Entry Screening</option>
                  <option value="PRISON_ADMISSION_VERIFICATION" className="bg-slate-900 text-white">NCoS Inmate Intake</option>
                </select>
              </div>
            </div>

            {/* View Tech Playground Code Button */}
            <button
              onClick={() => setShowCodeSandbox(!showCodeSandbox)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
            >
              <Code2 className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Backend & Mobile Code</span>
            </button>
          </div>
        </div>

        {/* Multimodal Primary Route Tabs */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveModality('FINGERPRINT')}
            className={`py-3 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2.5 ${
              activeModality === 'FINGERPRINT'
                ? 'bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Fingerprint className="w-5 h-5" />
            <span>Biometric Route (Fingerprint Scan)</span>
          </button>

          <button
            onClick={() => setActiveModality('FACIAL')}
            className={`py-3 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2.5 ${
              activeModality === 'FACIAL'
                ? 'bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span>Visual Route (Facial Recognition / CCTV)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALITY 1: FACIAL RECOGNITION / LIVE CAMERA & CCTV SEARCH */}
      {/* ========================================================================= */}
      {activeModality === 'FACIAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Source & Facial Processing Chamber */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Facial Input Source & Video Ingest
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    onClick={() => {
                      stopLiveCamera();
                      setPhotoSourceMode('PRESETS');
                    }}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                      photoSourceMode === 'PRESETS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Test Field Cases
                  </button>
                  <button
                    onClick={() => {
                      setPhotoSourceMode('LIVE_CAMERA');
                      startLiveCamera();
                    }}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1 ${
                      photoSourceMode === 'LIVE_CAMERA' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    Live Camera
                  </button>
                  <button
                    onClick={() => {
                      stopLiveCamera();
                      setPhotoSourceMode('FILE_UPLOAD');
                      fileInputRef.current?.click();
                    }}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1 ${
                      photoSourceMode === 'FILE_UPLOAD' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                  </button>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Live Camera Viewfinder or Photo Frame */}
              <div className="relative aspect-video sm:aspect-[4/3] bg-slate-950 rounded-xl border-2 border-slate-800 overflow-hidden flex items-center justify-center group">
                {photoSourceMode === 'LIVE_CAMERA' ? (
                  <div className="relative w-full h-full">
                    {cameraError ? (
                      <div className="p-6 text-center text-xs text-rose-400 space-y-2 flex flex-col items-center justify-center h-full">
                        <AlertCircle className="w-8 h-8 text-rose-500" />
                        <p>{cameraError}</p>
                        <button
                          onClick={startLiveCamera}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold"
                        >
                          Retry Camera Permission
                        </button>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Live HUD Reticle */}
                        <div className="absolute inset-0 pointer-events-none border-4 border-emerald-500/20 m-4 rounded-xl flex items-center justify-center">
                          <div className="w-48 h-56 border-2 border-dashed border-emerald-400/70 rounded-2xl flex flex-col items-center justify-between p-2">
                            <span className="text-[10px] font-mono text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded">
                              FACE DETECTION ZONE
                            </span>
                            <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400 self-start"></div>
                            <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400 self-end"></div>
                          </div>
                        </div>

                        {/* Capture Button */}
                        <div className="absolute bottom-4 inset-x-0 flex justify-center">
                          <button
                            onClick={captureLiveCameraSnapshot}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-xl flex items-center gap-2 active:scale-95 transition-all"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Capture Field Probe Frame</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                    <img
                      src={photoSourceMode === 'FILE_UPLOAD' && uploadedImageUrl ? uploadedImageUrl : selectedPhotoPreset.imageUrl}
                      alt="Probe Face"
                      className={`w-full h-full object-contain ${
                        isEnhanceCctv ? 'contrast-125 brightness-110 saturate-110' : ''
                      }`}
                    />

                    {/* Landmark Mesh & HUD Overlay */}
                    {showMeshOverlay && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                        {/* Bounding box */}
                        <rect
                          x="20"
                          y="15"
                          width="60"
                          height="75"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="0.8"
                          strokeDasharray="2 1"
                          opacity="0.8"
                        />
                        {/* 68 Landmark Nodes */}
                        {detectedLandmarks.map((lm, idx) => (
                          <circle
                            key={idx}
                            cx={lm.x}
                            cy={lm.y}
                            r="0.8"
                            fill={lm.confidence > 80 ? '#10b981' : '#f59e0b'}
                            opacity="0.9"
                          />
                        ))}
                      </svg>
                    )}

                    {/* Scanning Laser Sweep Animation */}
                    {isFaceScanning && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">
                        <div
                          className="h-1.5 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] transition-all duration-75"
                          style={{
                            transform: `translateY(${faceProgress * 2.8}px)`,
                          }}
                        />
                      </div>
                    )}

                    {/* Watermark Tag */}
                    <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>
                        PROBE: {photoSourceMode === 'FILE_UPLOAD' ? 'UPLOADED FRAME' : selectedPhotoPreset.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Preset Selector Grid */}
              {photoSourceMode === 'PRESETS' && (
                <div className="space-y-2">
                  <label className="text-slate-400 text-xs font-semibold block">Select Field Scenario / CCTV Screen Grab:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PHOTO_SEARCH_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setSelectedPhotoPreset(preset);
                          setDetectedLandmarks(generateFacialLandmarks(preset.targetSuspectId, preset.occlusion !== 'NONE'));
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                          selectedPhotoPreset.id === preset.id
                            ? 'bg-slate-800 border-emerald-500 shadow-md shadow-emerald-950/40 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            preset.category === 'CCTV' 
                              ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                              : preset.category === 'OBSTRUCTED'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {preset.category}
                          </span>
                          {preset.occlusion !== 'NONE' && (
                            <span className="text-[9px] text-amber-400 font-mono">[{preset.occlusion}]</span>
                          )}
                        </div>
                        <span className="font-semibold text-xs truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Image Enhancement Controls (For Low-Quality CCTV) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <Wand2 className="w-4 h-4 text-purple-400" />
                    <span>Low-Quality CCTV / Obscured Face Enhancement</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnhanceCctv}
                      onChange={(e) => setIsEnhanceCctv(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isEnhanceCctv ? 'bg-purple-400' : 'bg-slate-600'}`}></span>
                    <span>CLAHE Contrast Equalization</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isEnhanceCctv ? 'bg-purple-400' : 'bg-slate-600'}`}></span>
                    <span>Super-Resolution 4x Denoise</span>
                  </div>
                </div>
              </div>

              {/* Action Trigger Button */}
              <button
                onClick={handleExecuteFaceSearch}
                disabled={isFaceScanning}
                className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 shadow-xl ${
                  isFaceScanning
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-950/60 active:scale-[0.99]'
                }`}
              >
                {isFaceScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>{faceStepLabel} ({faceProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    <span>Query National Central Crime Repository (CCR)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Visual Verification & Dossier Candidate Result */}
          <div className="lg:col-span-5 space-y-4">
            {faceMatchResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in-50">
                {/* Result Title & Confidence Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  faceMatchResult.matched
                    ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                    : faceMatchResult.isOfflineResolved
                    ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-3">
                    {faceMatchResult.matched ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    ) : faceMatchResult.isOfflineResolved ? (
                      <HardDrive className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-slate-500 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        {faceMatchResult.matched
                          ? 'Positive Criminal Record Match'
                          : faceMatchResult.isOfflineResolved
                          ? 'Encrypted & Queued in Offline Buffer'
                          : 'No Prior Criminal Record Found'}
                      </h3>
                      <p className="text-xs opacity-90">
                        {faceMatchResult.matched
                          ? `Visual vector similarity verified (${(faceMatchResult.confidence * 100).toFixed(1)}%)`
                          : faceMatchResult.isOfflineResolved
                          ? 'Will auto-query server when network re-establishes'
                          : 'Subject not currently indexed in 36 States + FCT repository.'}
                      </p>
                    </div>
                  </div>

                  {faceMatchResult.matched && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-900 text-emerald-200 border border-emerald-700 font-mono font-bold text-xs">
                      {(faceMatchResult.confidence * 100).toFixed(1)}%
                    </span>
                  )}
                </div>

                {/* Side-by-Side Face Comparison (Probe vs Archived Mugshot) */}
                {faceMatchResult.matched && faceMatchResult.suspect && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">1. Field Probe Capture:</span>
                        <div className="aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                          <img
                            src={faceMatchResult.probeImageUrl}
                            alt="Probe"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase block">2. CCR Archived Mugshot:</span>
                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-emerald-500 bg-slate-950 shadow-lg shadow-emerald-950/50">
                          <img
                            src={faceMatchResult.suspect.mugshotUrl}
                            alt="Archived Mugshot"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Active Warrant Alert Box if applicable */}
                    {faceMatchResult.suspect.activeWarrants.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-600 text-red-200 space-y-1">
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                          <span>OUTSTANDING NATIONWIDE BENCH WARRANT ACTIVE</span>
                        </div>
                        <p className="text-[11px] text-red-300">
                          {faceMatchResult.suspect.activeWarrants[0].offense} (Issued by {faceMatchResult.suspect.activeWarrants[0].issuingCourt})
                        </p>
                      </div>
                    )}

                    {/* Suspect Identifiers Table */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Full Name:</span>
                        <span className="font-bold text-white">
                          {faceMatchResult.suspect.firstName} {faceMatchResult.suspect.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">System Ref:</span>
                        <span className="font-mono text-emerald-400 font-bold">{faceMatchResult.suspect.systemRef}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Known Aliases:</span>
                        <span className="text-slate-300">{faceMatchResult.suspect.aliases.join(', ')}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">State of Origin:</span>
                        <span className="text-slate-300">{faceMatchResult.suspect.stateOfOrigin} State (LGA: {faceMatchResult.suspect.lga})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tactical Risk Level:</span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          faceMatchResult.suspect.riskLevel === 'EXTREME'
                            ? 'bg-red-950 text-red-300 border border-red-700'
                            : 'bg-amber-950 text-amber-300 border border-amber-700'
                        }`}>
                          {faceMatchResult.suspect.riskLevel}
                        </span>
                      </div>
                    </div>

                    {/* Quality Assessment Breakdown */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1.5 text-slate-400 font-mono">
                      <div className="flex justify-between">
                        <span>Landmark Alignment Score:</span>
                        <span className="text-emerald-400 font-bold">{faceMatchResult.landmarkAlignmentScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vector Cosine Distance:</span>
                        <span className="text-slate-300 font-bold">{faceMatchResult.vectorSimilarity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Occlusion & Lighting:</span>
                        <span className="text-slate-300">{faceMatchResult.qualityAssessment.occlusion}</span>
                      </div>
                    </div>

                    {/* Open Dossier Button */}
                    <button
                      onClick={() => onNavigateToDossier(faceMatchResult.suspect!)}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50"
                    >
                      <span>Inspect Complete Criminal Dossier & Court History</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-3 flex flex-col items-center justify-center min-h-[340px]">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-sm">Visual Match Result Pending</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Capture a live camera frame, upload a suspect photo, or select a CCTV test scenario to run automated 1:N vector facial matching.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALITY 2: FINGERPRINT SCANNER & MINUTIAE VECTOR MATCH */}
      {/* ========================================================================= */}
      {activeModality === 'FINGERPRINT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Fingerprint Capture & Optical Ridge Stage */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Optical Ridge Capture & Minutiae Extractor
                  </h2>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedDevice}</span>
                </div>
              </div>

              {/* Visual Optical Glass Stage */}
              <div className="relative aspect-square max-w-sm mx-auto bg-slate-950 rounded-2xl border-2 border-slate-800 flex items-center justify-center overflow-hidden p-6 shadow-inner">
                {/* Fingerprint Ridge SVG Graphics */}
                <div 
                  onMouseEnter={() => setIsHoveringSensor(true)}
                  onMouseLeave={() => setIsHoveringSensor(false)}
                  onClick={() => !isFingerScanning && setIsFingerScanning(true)}
                  className="relative w-48 h-56 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                >
                  <Fingerprint className={`w-44 h-52 transition-colors duration-300 ${
                    isFingerScanning ? 'text-emerald-400' : isHoveringSensor ? 'text-emerald-300' : 'text-slate-700'
                  }`} />

                  {/* Minutiae Points Overlay */}
                  {activeMinutiaeCount > 0 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {generateMinutiaePoints(selectedFingerPreset, 28).map((pt, idx) => (
                        <g key={idx}>
                          <circle
                            cx={pt.x * 0.9}
                            cy={pt.y * 0.9}
                            r={pt.type === 'CORE' ? 4 : 2}
                            fill={pt.type === 'CORE' ? '#ef4444' : pt.type === 'BIFURCATION' ? '#10b981' : '#3b82f6'}
                          />
                        </g>
                      ))}
                    </svg>
                  )}

                  {/* Laser Scan Line */}
                  {isFingerScanning && (
                    <div
                      className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_12px_#10b981]"
                      style={{ top: `${laserPosition}%` }}
                    />
                  )}
                </div>

                {/* Quality & Sensor Status Badge */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/80 backdrop-blur-sm p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>QUALITY: {fingerQualityScore}% NFIQ-2</span>
                  </div>
                  <span>MINUTIAE: {activeMinutiaeCount || 46}</span>
                </div>
              </div>

              {/* Finger Selection & Presets */}
              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Finger Position:</label>
                    <select
                      value={selectedFinger}
                      onChange={(e) => setSelectedFinger(e.target.value as FingerPosition)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                    >
                      <option value="RIGHT_THUMB">Right Thumb</option>
                      <option value="RIGHT_INDEX">Right Index</option>
                      <option value="RIGHT_MIDDLE">Right Middle</option>
                      <option value="LEFT_THUMB">Left Thumb</option>
                      <option value="LEFT_INDEX">Left Index</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Test Subject Seed:</label>
                    <select
                      value={selectedFingerPreset}
                      onChange={(e) => setSelectedFingerPreset(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                    >
                      {suspects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} ({s.systemRef})
                        </option>
                      ))}
                      <option value="UNKNOWN">Unregistered Citizen / Clean Record</option>
                    </select>
                  </div>
                </div>

                {/* Scan Button */}
                <button
                  onClick={() => setIsFingerScanning(true)}
                  disabled={isFingerScanning}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 shadow-xl ${
                    isFingerScanning
                      ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-950/60 active:scale-[0.99]'
                  }`}
                >
                  {isFingerScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>{fingerStepLabel} ({fingerProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4" />
                      <span>Acquire Biometric Ridge & Search National CCR</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Fingerprint Match Result Column */}
          <div className="lg:col-span-5 space-y-4">
            {fingerMatchResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in-50">
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  fingerMatchResult.matched
                    ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                    : fingerMatchResult.isOfflineResolved
                    ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-3">
                    {fingerMatchResult.matched ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    ) : fingerMatchResult.isOfflineResolved ? (
                      <HardDrive className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-slate-500 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        {fingerMatchResult.matched
                          ? 'Positive Biometric Match'
                          : fingerMatchResult.isOfflineResolved
                          ? 'Encrypted in Offline Storage'
                          : 'No Prior Criminal Record'}
                      </h3>
                      <p className="text-xs opacity-90">
                        {fingerMatchResult.matched
                          ? `128-dim Cosine Match Verified (${Math.round(fingerMatchResult.confidence * 100)}%)`
                          : fingerMatchResult.isOfflineResolved
                          ? 'Queued for automatic sync upon reconnection'
                          : 'Minutiae patterns not indexed in Central Database.'}
                      </p>
                    </div>
                  </div>

                  {fingerMatchResult.matched && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-900 text-emerald-200 border border-emerald-700 font-mono font-bold text-xs">
                      {(fingerMatchResult.confidence * 100).toFixed(1)}%
                    </span>
                  )}
                </div>

                {fingerMatchResult.matched && fingerMatchResult.suspect && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <img
                        src={fingerMatchResult.suspect.mugshotUrl}
                        alt="Suspect"
                        className="w-16 h-16 rounded-lg object-cover border border-slate-700"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          {fingerMatchResult.suspect.firstName} {fingerMatchResult.suspect.lastName}
                        </h4>
                        <p className="text-xs text-emerald-400 font-mono">{fingerMatchResult.suspect.systemRef}</p>
                        <p className="text-[11px] text-slate-400">Risk: {fingerMatchResult.suspect.riskLevel}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateToDossier(fingerMatchResult.suspect!)}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50"
                    >
                      <span>Inspect Complete Criminal Dossier</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-3 flex flex-col items-center justify-center min-h-[340px]">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-sm">Biometric Sensor Standby</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Place subject's finger on the optical sensor or select a test preset to perform high-precision 1:N minutiae vector matching.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TECHNICAL SANDBOX DRAWER (Python FastAPI + React Native Code) */}
      {/* ========================================================================= */}
      {showCodeSandbox && (
        <div className="bg-slate-900 border border-blue-900/60 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">
                N-CRIMS Technical Architecture & Developer Sandbox
              </h3>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveCodeTab('FASTAPI_PGVECTOR')}
                className={`px-3 py-1 rounded font-semibold transition-colors ${
                  activeCodeTab === 'FASTAPI_PGVECTOR' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Python / FastAPI pgvector
              </button>
              <button
                onClick={() => setActiveCodeTab('REACT_NATIVE')}
                className={`px-3 py-1 rounded font-semibold transition-colors ${
                  activeCodeTab === 'REACT_NATIVE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                React Native Dual-Search
              </button>
              <button
                onClick={() => setActiveCodeTab('CCTV_EXPLANATION')}
                className={`px-3 py-1 rounded font-semibold transition-colors ${
                  activeCodeTab === 'CCTV_EXPLANATION' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Low-Quality CCTV AI Logic
              </button>
            </div>
          </div>

          {activeCodeTab === 'FASTAPI_PGVECTOR' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>File: /backend/api/v1/search_by_face.py</span>
                <span className="text-emerald-400">FastAPI + InsightFace + pgvector</span>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-96 leading-relaxed">
                <code>{PYTHON_FASTAPI_CODE_SNIPPET}</code>
              </pre>
            </div>
          )}

          {activeCodeTab === 'REACT_NATIVE' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>File: /mobile/screens/MultimodalSearchScreen.tsx</span>
                <span className="text-emerald-400">React Native + VisionCamera</span>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-96 leading-relaxed">
                <code>{REACT_NATIVE_CODE_SNIPPET}</code>
              </pre>
            </div>
          )}

          {activeCodeTab === 'CCTV_EXPLANATION' && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-3 leading-relaxed">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                How N-CRIMS Handles Low-Quality CCTV and Partially Obscured Faces
              </h4>
              <p>
                In standard law enforcement operations across Nigerian urban corridors, field video footage is frequently subject to non-ideal conditions such as 480p resolution, night-time low illumination, oblique overhead camera angles (CCTV yaw/pitch &gt; 30°), and partial face coverings (face masks, caps, or sunglasses).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">1. Contrast Equalization & Super-Resolution</span>
                  <p className="text-[11px] text-slate-400">
                    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE) to recover details in high-shadow regions, followed by a lightweight CNN super-resolution model to upscale low-lux frames before landmark extraction.
                  </p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">2. Partial Landmark Triangulation</span>
                  <p className="text-[11px] text-slate-400">
                    When the lower face or forehead is obscured by a mask or cap, the system automatically assigns lower confidence weights to missing nodes and relies on unoccluded periocular (eye region) and nose bridge vectors.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
