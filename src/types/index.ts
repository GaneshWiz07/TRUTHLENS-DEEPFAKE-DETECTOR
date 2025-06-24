export interface Analysis {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  result: 'real' | 'deepfake';
  confidence: number;
  issues_detected: string[];
  created_at: string;
  updated_at: string;
  analysis_type?: 'media' | 'voice' | 'combined' | 'text' | 'location';
  text_content?: string;
  explanation_data?: ExplanationData;
  report_id?: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AnalysisResult {
  result: 'real' | 'deepfake';
  confidence: number;
  issues_detected: string[];
  analysis_type: 'media' | 'voice' | 'combined' | 'text' | 'location';
  explanation_data?: ExplanationData;
  report_id?: string;
  ai_fingerprint?: AIFingerprint;
  location_analysis?: LocationAnalysis;
  voice_engine?: VoiceEngineDetection;
}

export interface ExplanationData {
  attention_regions?: AttentionRegion[];
  frame_probabilities?: FrameProbability[];
  audio_segments?: AudioSegment[];
  text_highlights?: TextHighlight[];
  model_used: string;
  processing_time: number;
  ai_fingerprint?: AIFingerprint;
  location_analysis?: LocationAnalysis;
  voice_engine?: VoiceEngineDetection;
}

export interface AttentionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  reason: string;
}

export interface FrameProbability {
  frame: number;
  timestamp: number;
  probability: number;
  issues: string[];
}

export interface AudioSegment {
  start_time: number;
  end_time: number;
  confidence: number;
  issues: string[];
}

export interface TextHighlight {
  start: number;
  end: number;
  text: string;
  confidence: number;
  reason: string;
}

export interface AIFingerprint {
  detected_models: ModelProbability[];
  linguistic_patterns: LinguisticPattern[];
  generation_confidence: number;
  human_likelihood: number;
}

export interface ModelProbability {
  model_name: string;
  probability: number;
  confidence: number;
  characteristics: string[];
}

export interface LinguisticPattern {
  pattern_type: string;
  description: string;
  confidence: number;
  examples: string[];
}

export interface LocationAnalysis {
  extracted_locations: ExtractedLocation[];
  visual_landmarks: VisualLandmark[];
  consistency_score: number;
  discrepancies: LocationDiscrepancy[];
}

export interface ExtractedLocation {
  text: string;
  location_name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  confidence: number;
  source: 'ocr' | 'transcript' | 'metadata';
}

export interface VisualLandmark {
  landmark_name: string;
  confidence: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface LocationDiscrepancy {
  type: 'text_visual_mismatch' | 'impossible_geography' | 'landmark_inconsistency';
  description: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string[];
}

export interface VoiceEngineDetection {
  detected_engine: string;
  confidence: number;
  engine_probabilities: EngineProb[];
  signature_patterns: SignaturePattern[];
  synthesis_artifacts: string[];
}

export interface EngineProb {
  engine_name: string;
  probability: number;
  characteristics: string[];
}

export interface SignaturePattern {
  pattern_name: string;
  description: string;
  confidence: number;
  frequency_range?: {
    min: number;
    max: number;
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface CombinedAnalysisRequest {
  media_file: File;
  text_content: string;
}