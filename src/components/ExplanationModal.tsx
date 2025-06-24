import React from 'react';
import { X, Eye, BarChart3, AudioWaveform as Waveform, FileText, Brain, MapPin, Mic } from 'lucide-react';
import { ExplanationData, AIFingerprint, LocationAnalysis, VoiceEngineDetection } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  explanationData: ExplanationData;
  fileName: string;
  analysisType: 'media' | 'voice' | 'combined' | 'text' | 'location';
  result: 'real' | 'deepfake';
}

const COLORS = ['#00F5FF', '#FF00FF', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];

export function ExplanationModal({ 
  isOpen, 
  onClose, 
  explanationData, 
  fileName, 
  analysisType, 
  result 
}: ExplanationModalProps) {
  if (!isOpen) return null;

  const renderAIFingerprint = (aiFingerprint: AIFingerprint) => {
    const modelData = aiFingerprint.detected_models.map((model, index) => ({
      name: model.model_name,
      probability: Math.round(model.probability * 100),
      fill: COLORS[index % COLORS.length]
    }));

    return (
      <div className="space-y-6">
        <h4 className="font-semibold text-white flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>AI Model Detection</span>
        </h4>
        
        {modelData.length > 0 && (
          <div className="glass rounded-xl p-4">
            <h5 className="font-medium text-blue-300 mb-3">Detected AI Models</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={modelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, probability }) => `${name}: ${probability}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="probability"
                  >
                    {modelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-3">
                {aiFingerprint.detected_models.map((model, index) => (
                  <div key={index} className="glass rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">{model.model_name}</span>
                      <span className="text-sm px-2 py-1 bg-blue-400/20 text-blue-300 rounded">
                        {Math.round(model.probability * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {model.characteristics.slice(0, 2).map((char, i) => (
                        <div key={i}>• {char}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {aiFingerprint.linguistic_patterns.length > 0 && (
          <div className="glass rounded-xl p-4">
            <h5 className="font-medium text-blue-300 mb-3">Linguistic Patterns</h5>
            <div className="space-y-3">
              {aiFingerprint.linguistic_patterns.map((pattern, index) => (
                <div key={index} className="glass rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-white">{pattern.pattern_type}</span>
                    <span className="text-xs px-2 py-1 bg-yellow-400/20 text-yellow-300 rounded">
                      {Math.round(pattern.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{pattern.description}</p>
                  {pattern.examples.length > 0 && (
                    <div className="text-xs text-gray-400">
                      Examples: {pattern.examples.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(aiFingerprint.generation_confidence * 100)}%
              </div>
              <div className="text-sm text-blue-300">AI Generation Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {Math.round(aiFingerprint.human_likelihood * 100)}%
              </div>
              <div className="text-sm text-green-300">Human Likelihood</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVoiceEngine = (voiceEngine: VoiceEngineDetection) => {
    const engineData = voiceEngine.engine_probabilities.map((engine, index) => ({
      name: engine.engine_name,
      probability: Math.round(engine.probability * 100)
    }));

    return (
      <div className="space-y-6">
        <h4 className="font-semibold text-white flex items-center space-x-2">
          <Mic className="h-5 w-5" />
          <span>Voice Engine Analysis</span>
        </h4>
        
        <div className="glass rounded-xl p-4">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-purple-400">{voiceEngine.detected_engine}</div>
            <div className="text-sm text-purple-300">
              Detected Engine ({Math.round(voiceEngine.confidence * 100)}% confidence)
            </div>
          </div>
        </div>

        {engineData.length > 0 && (
          <div className="glass rounded-xl p-4">
            <h5 className="font-medium text-purple-300 mb-3">Engine Probabilities</h5>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={engineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke="#9CA3AF" />
                <YAxis label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Bar dataKey="probability" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {voiceEngine.signature_patterns.length > 0 && (
          <div className="glass rounded-xl p-4">
            <h5 className="font-medium text-purple-300 mb-3">Signature Patterns</h5>
            <div className="space-y-3">
              {voiceEngine.signature_patterns.map((pattern, index) => (
                <div key={index} className="glass rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-white">{pattern.pattern_name}</span>
                    <span className="text-xs px-2 py-1 bg-purple-400/20 text-purple-300 rounded">
                      {Math.round(pattern.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{pattern.description}</p>
                  {pattern.frequency_range && (
                    <div className="text-xs text-gray-400 mt-1">
                      Frequency: {pattern.frequency_range.min}Hz - {pattern.frequency_range.max}Hz
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {voiceEngine.synthesis_artifacts.length > 0 && (
          <div className="glass rounded-xl p-4">
            <h5 className="font-medium text-purple-300 mb-3">Synthesis Artifacts</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {voiceEngine.synthesis_artifacts.map((artifact, index) => (
                <div key={index} className="glass rounded-lg p-2 text-sm text-gray-300">
                  • {artifact}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLocationAnalysis = (locationAnalysis: LocationAnalysis) => {
    return (
      <div className="space-y-6">
        <h4 className="font-semibold text-white flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Location Verification</span>
        </h4>
        
        <div className="glass rounded-xl p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {Math.round(locationAnalysis.consistency_score * 100)}%
            </div>
            <div className="text-sm text-green-300">Location Consistency Score</div>
          </div>
        </div>

        {locationAnalysis.extracted_locations.length > 0 && (
          <div className="glass rounded-xl p-4">
            <h5 className="font-medium text-green-300 mb-3">Extracted Locations</h5>
            <div className="space-y-3">
              {locationAnalysis.extracted_locations.map((location, index) => (
                <div key={index} className="glass rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-white">{location.location_name}</span>
                    <span className="text-xs px-2 py-1 bg-blue-400/20 text-blue-300 rounded">
                      {Math.round(location.confidence * 100)}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">
                    Source: {location.source} | Text: "{location.text}"
                  </div>
                  {location.coordinates && (
                    <div className="text-xs text-gray-400 mt-1">
                      Coordinates: {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {locationAnalysis.visual_landmarks.length > 0 && (
          <div className="glass rounded-xl p-4">
            <h5 className="font-medium text-green-300 mb-3">Visual Landmarks</h5>
            <div className="space-y-3">
              {locationAnalysis.visual_landmarks.map((landmark, index) => (
                <div key={index} className="glass rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-white">{landmark.landmark_name}</span>
                    <span className="text-xs px-2 py-1 bg-green-400/20 text-green-300 rounded">
                      {Math.round(landmark.confidence * 100)}%
                    </span>
                  </div>
                  {landmark.coordinates && (
                    <div className="text-xs text-gray-400">
                      Coordinates: {landmark.coordinates.latitude.toFixed(4)}, {landmark.coordinates.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {locationAnalysis.discrepancies.length > 0 && (
          <div className="glass rounded-xl p-4 border border-red-400/20">
            <h5 className="font-medium text-red-300 mb-3">Location Discrepancies</h5>
            <div className="space-y-3">
              {locationAnalysis.discrepancies.map((discrepancy, index) => (
                <div key={index} className="glass rounded-lg p-3 border border-red-400/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-white">{discrepancy.type.replace(/_/g, ' ')}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      discrepancy.severity === 'high' ? 'bg-red-400/20 text-red-300' :
                      discrepancy.severity === 'medium' ? 'bg-yellow-400/20 text-yellow-300' :
                      'bg-gray-400/20 text-gray-300'
                    }`}>
                      {discrepancy.severity} severity
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{discrepancy.description}</p>
                  {discrepancy.evidence.length > 0 && (
                    <div className="text-xs text-gray-400">
                      Evidence: {discrepancy.evidence.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAttentionHeatmap = () => {
    if (!explanationData.attention_regions?.length) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-white flex items-center space-x-2">
          <Eye className="h-5 w-5" />
          <span>Attention Heatmap</span>
        </h4>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-300 mb-4">
            Red regions indicate areas where the AI model detected suspicious patterns:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {explanationData.attention_regions.map((region, index) => (
              <div key={index} className="glass rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-white">Region {index + 1}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    region.confidence > 0.7 ? 'bg-red-400/20 text-red-300' : 'bg-yellow-400/20 text-yellow-300'
                  }`}>
                    {Math.round(region.confidence * 100)}% suspicious
                  </span>
                </div>
                <p className="text-xs text-gray-300">{region.reason}</p>
                <div className="text-xs text-gray-400 mt-1">
                  Position: ({region.x.toFixed(2)}, {region.y.toFixed(2)}) Size: {region.width.toFixed(2)}×{region.height.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFrameAnalysis = () => {
    if (!explanationData.frame_probabilities?.length) return null;

    const chartData = explanationData.frame_probabilities.map(frame => ({
      frame: frame.frame,
      timestamp: frame.timestamp.toFixed(2),
      probability: Math.round(frame.probability * 100),
      issues: frame.issues.length
    }));

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-white flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Frame-by-Frame Analysis</span>
        </h4>
        <div className="glass rounded-xl p-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
                stroke="#9CA3AF"
              />
              <YAxis 
                label={{ value: 'Deepfake Probability (%)', angle: -90, position: 'insideLeft' }}
                stroke="#9CA3AF"
              />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}%`, 
                  name === 'probability' ? 'Deepfake Probability' : name
                ]}
                labelFormatter={(label) => `Time: ${label}s`}
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Line 
                type="monotone" 
                dataKey="probability" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-300 mt-2">
            Higher values indicate frames more likely to contain deepfake artifacts.
          </p>
        </div>
      </div>
    );
  };

  const renderAudioAnalysis = () => {
    if (!explanationData.audio_segments?.length) return null;

    const chartData = explanationData.audio_segments.map((segment, index) => ({
      segment: `${segment.start_time.toFixed(1)}-${segment.end_time.toFixed(1)}s`,
      confidence: Math.round(segment.confidence * 100),
      issues: segment.issues.length
    }));

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-white flex items-center space-x-2">
          <Waveform className="h-5 w-5" />
          <span>Audio Segment Analysis</span>
        </h4>
        <div className="glass rounded-xl p-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="segment" stroke="#9CA3AF" />
              <YAxis label={{ value: 'Confidence (%)', angle: -90, position: 'insideLeft' }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Bar dataKey="confidence" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {explanationData.audio_segments.map((segment, index) => (
              <div key={index} className="glass rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-white">
                    {segment.start_time.toFixed(1)}s - {segment.end_time.toFixed(1)}s
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    segment.confidence > 0.7 ? 'bg-red-400/20 text-red-300' : 'bg-green-400/20 text-green-300'
                  }`}>
                    {Math.round(segment.confidence * 100)}% confidence
                  </span>
                </div>
                {segment.issues.length > 0 && (
                  <div className="text-xs text-gray-300">
                    Issues: {segment.issues.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTextAnalysis = () => {
    if (!explanationData.text_highlights?.length) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-white flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Text Analysis Highlights</span>
        </h4>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-300 mb-4">
            Highlighted text segments show potential misinformation or suspicious claims:
          </p>
          <div className="space-y-3">
            {explanationData.text_highlights.map((highlight, index) => (
              <div key={index} className="glass rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    highlight.confidence > 0.7 ? 'bg-red-400/20 text-red-300' : 'bg-yellow-400/20 text-yellow-300'
                  }`}>
                    {Math.round(highlight.confidence * 100)}% suspicious
                  </span>
                </div>
                <p className="text-sm font-medium text-white mb-1">
                  "{highlight.text}"
                </p>
                <p className="text-xs text-gray-300">{highlight.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-black/50 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">Analysis Explanation</h3>
            <p className="text-sm text-gray-400">
              Understanding why "{fileName}" was classified as {result === 'real' ? 'authentic' : 'deepfake'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Model Information */}
          <div className="glass rounded-xl p-4">
            <h4 className="font-semibold text-cyan-300 mb-2">Model Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-cyan-400">Model Used:</span>
                <span className="ml-2 font-medium text-white">{explanationData.model_used}</span>
              </div>
              <div>
                <span className="text-cyan-400">Processing Time:</span>
                <span className="ml-2 font-medium text-white">{explanationData.processing_time.toFixed(2)}s</span>
              </div>
            </div>
          </div>

          {/* Analysis Type Specific Explanations */}
          {analysisType === 'text' && explanationData.ai_fingerprint && renderAIFingerprint(explanationData.ai_fingerprint)}
          {analysisType === 'voice' && explanationData.voice_engine && renderVoiceEngine(explanationData.voice_engine)}
          {analysisType === 'location' && explanationData.location_analysis && renderLocationAnalysis(explanationData.location_analysis)}
          {analysisType === 'media' && renderAttentionHeatmap()}
          {analysisType === 'media' && renderFrameAnalysis()}
          {analysisType === 'combined' && (
            <>
              {renderAttentionHeatmap()}
              {renderTextAnalysis()}
            </>
          )}
          {(analysisType === 'voice' || analysisType === 'combined') && renderAudioAnalysis()}

          {/* General Explanation */}
          <div className="glass rounded-xl p-4">
            <h4 className="font-semibold text-white mb-3">How This Analysis Works</h4>
            <div className="text-sm text-gray-300 space-y-2">
              {analysisType === 'text' && (
                <p>
                  AI text detection analyzes linguistic patterns, vocabulary choices, and writing style 
                  to identify content generated by models like GPT, Claude, or LLaMA. It looks for 
                  characteristic patterns in sentence structure, word choice, and stylistic consistency.
                </p>
              )}
              {analysisType === 'voice' && (
                <p>
                  Voice deepfake detection analyzes audio waveforms, spectrograms, and vocal patterns 
                  to identify synthetic speech generation artifacts. It also fingerprints specific AI 
                  voice engines like ElevenLabs, Google TTS, and Coqui by their unique synthesis signatures.
                </p>
              )}
              {analysisType === 'location' && (
                <p>
                  Location verification uses OCR to extract location claims from text overlays and 
                  cross-references them with visual landmark detection. It identifies geographical 
                  inconsistencies and impossible location combinations to detect fake event videos.
                </p>
              )}
              {analysisType === 'media' && (
                <p>
                  Media analysis uses computer vision models trained on millions of real and synthetic images/videos 
                  to detect pixel-level inconsistencies, unnatural facial movements, lighting anomalies, 
                  and compression artifacts typical of AI-generated content.
                </p>
              )}
              {analysisType === 'combined' && (
                <p>
                  Combined analysis cross-references visual/audio content with accompanying text to detect 
                  coordinated misinformation campaigns, checking for consistency between claims and evidence, 
                  and identifying potential deepfake media paired with false narratives.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}