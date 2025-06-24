import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Clock, FileText, Download, Eye, BarChart3, AudioWaveform as Waveform, Brain, MapPin, Mic } from 'lucide-react';
import { AnalysisResult as AnalysisResultType } from '../types';
import { ExplanationModal } from './ExplanationModal';
import { generatePDFReport } from '../utils/reportGenerator';

interface AnalysisResultProps {
  result: AnalysisResultType;
  fileName: string;
  fileSize: number;
  analysisType: 'media' | 'voice' | 'combined' | 'text' | 'location';
}

export function AnalysisResult({ result, fileName, fileSize, analysisType }: AnalysisResultProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const isReal = result.result === 'real';
  const confidenceColor = result.confidence > 70 
    ? (isReal ? 'text-green-400' : 'text-red-400')
    : 'text-yellow-400';

  const resultIcon = isReal 
    ? <CheckCircle className="h-8 w-8 text-green-400" />
    : <AlertTriangle className="h-8 w-8 text-red-400" />;

  const resultBgColor = isReal 
    ? 'bg-green-400/10 border-green-400/20 shadow-lg shadow-green-400/10' 
    : 'bg-red-400/10 border-red-400/20 shadow-lg shadow-red-400/10';

  const getAnalysisTypeIcon = () => {
    switch (analysisType) {
      case 'voice':
        return <Mic className="h-5 w-5 text-purple-400" />;
      case 'text':
        return <Brain className="h-5 w-5 text-blue-400" />;
      case 'location':
        return <MapPin className="h-5 w-5 text-green-400" />;
      case 'combined':
        return <BarChart3 className="h-5 w-5 text-orange-400" />;
      default:
        return <FileText className="h-5 w-5 text-cyan-400" />;
    }
  };

  const getAnalysisTypeLabel = () => {
    switch (analysisType) {
      case 'voice':
        return 'Voice & AI Engine Analysis';
      case 'text':
        return 'AI Text Generation Analysis';
      case 'location':
        return 'Location Verification Analysis';
      case 'combined':
        return 'Combined Media & Text Analysis';
      default:
        return 'Media Analysis';
    }
  };

  const getResultLabel = () => {
    switch (analysisType) {
      case 'text':
        return isReal ? 'Likely Human-Written' : 'Likely AI-Generated';
      case 'location':
        return isReal ? 'Location Verified' : 'Location Suspicious';
      case 'voice':
        return isReal ? 'Likely Human Voice' : 'Likely AI Voice';
      default:
        return isReal ? 'Likely Authentic' : 'Likely DeepFake';
    }
  };

  const handleDownloadReport = async () => {
    setGeneratingReport(true);
    try {
      await generatePDFReport({
        fileName,
        fileSize,
        result,
        analysisType,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Create explanation data for different analysis types
  const getExplanationData = () => {
    if (result.explanation_data) {
      return result.explanation_data;
    }

    // Generate explanation data based on analysis type
    const baseData = {
      model_used: 'Advanced Detection System',
      processing_time: Math.random() * 3 + 2
    };

    if (analysisType === 'text') {
      return {
        ...baseData,
        ai_fingerprint: result.ai_fingerprint || {
          detected_models: [],
          linguistic_patterns: [],
          generation_confidence: result.confidence / 100,
          human_likelihood: 1 - (result.confidence / 100)
        }
      };
    }

    if (analysisType === 'location') {
      return {
        ...baseData,
        location_analysis: result.location_analysis || {
          extracted_locations: [],
          visual_landmarks: [],
          consistency_score: isReal ? 0.8 : 0.3,
          discrepancies: []
        }
      };
    }

    if (analysisType === 'voice') {
      return {
        ...baseData,
        voice_engine: result.voice_engine || {
          detected_engine: 'Unknown',
          confidence: result.confidence / 100,
          engine_probabilities: [],
          signature_patterns: [],
          synthesis_artifacts: []
        },
        audio_segments: []
      };
    }

    return baseData;
  };

  const explanationData = getExplanationData();

  return (
    <div className="glass rounded-2xl p-6 space-y-6 animate-fade-in">
      <div className={`p-6 rounded-2xl border-2 ${resultBgColor}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {resultIcon}
            <div>
              <h3 className="text-2xl font-bold text-white">
                {getResultLabel()}
              </h3>
              <p className="text-sm text-gray-400 flex items-center space-x-2 mt-1">
                {getAnalysisTypeIcon()}
                <span>{getAnalysisTypeLabel()} completed with {result.confidence}% confidence</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${confidenceColor}`}>
              {result.confidence}%
            </div>
            <div className="text-sm text-gray-400">Confidence</div>
          </div>
        </div>

        <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
          <div 
            className={`h-4 rounded-full transition-all duration-1000 ${
              isReal ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-red-400 to-red-500'
            }`}
            style={{ width: `${result.confidence}%` }}
          />
        </div>
      </div>

      {/* Analysis-specific information */}
      {analysisType === 'text' && result.ai_fingerprint && (
        <div className="glass rounded-xl p-4">
          <h4 className="font-semibold text-blue-300 mb-3 flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Model Detection</span>
          </h4>
          {result.ai_fingerprint.detected_models.length > 0 ? (
            <div className="space-y-3">
              {result.ai_fingerprint.detected_models.slice(0, 3).map((model, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-blue-300 font-medium">{model.model_name}</span>
                  <span className="text-blue-400 font-semibold">{Math.round(model.probability * 100)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-blue-300">No specific AI models detected</p>
          )}
        </div>
      )}

      {analysisType === 'voice' && result.voice_engine && (
        <div className="glass rounded-xl p-4">
          <h4 className="font-semibold text-purple-300 mb-3 flex items-center space-x-2">
            <Mic className="h-5 w-5" />
            <span>Voice Engine Detection</span>
          </h4>
          {result.voice_engine.detected_engine !== 'Unknown' ? (
            <div>
              <div className="flex justify-between items-center mb-3 p-3 bg-white/5 rounded-lg">
                <span className="text-purple-300 font-medium">{result.voice_engine.detected_engine}</span>
                <span className="text-purple-400 font-semibold">{Math.round(result.voice_engine.confidence * 100)}% confidence</span>
              </div>
              {result.voice_engine.synthesis_artifacts.length > 0 && (
                <div className="text-sm text-purple-300">
                  <p className="font-medium mb-2">Detected artifacts:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {result.voice_engine.synthesis_artifacts.slice(0, 3).map((artifact, index) => (
                      <li key={index}>{artifact}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-purple-300">No specific voice engine detected</p>
          )}
        </div>
      )}

      {analysisType === 'location' && result.location_analysis && (
        <div className="glass rounded-xl p-4">
          <h4 className="font-semibold text-green-300 mb-3 flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Location Verification</span>
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-green-300">Consistency Score</span>
              <span className="text-green-400 font-semibold">{Math.round(result.location_analysis.consistency_score * 100)}%</span>
            </div>
            {result.location_analysis.extracted_locations.length > 0 && (
              <div className="text-sm text-green-300">
                <p className="font-medium mb-2">Extracted locations:</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.location_analysis.extracted_locations.slice(0, 3).map((location, index) => (
                    <li key={index}>{location.location_name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-white flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>File Information</span>
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">File Name:</span>
              <span className="font-medium text-white max-w-xs truncate">{fileName}</span>
            </div>
            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">File Size:</span>
              <span className="font-medium text-white">
                {(fileSize / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Analysis Time:</span>
              <span className="font-medium text-white">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Model Used:</span>
              <span className="font-medium text-white">
                {explanationData?.model_used || 'Advanced AI Detection'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-white flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Issues Detected</span>
          </h4>
          <div className="space-y-2">
            {result.issues_detected.length > 0 ? (
              result.issues_detected.map((issue, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm p-3 bg-white/5 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-300">{issue}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic p-3 bg-white/5 rounded-lg">No suspicious patterns detected</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 pt-6 border-t border-white/10">
        <button
          onClick={() => setShowExplanation(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20"
        >
          <Eye className="h-4 w-4" />
          <span>Explain This Result</span>
        </button>

        <button
          onClick={handleDownloadReport}
          disabled={generatingReport}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/20"
        >
          <Download className="h-4 w-4" />
          <span>{generatingReport ? 'Generating...' : 'Download Report'}</span>
        </button>
      </div>

      {/* Explanation Modal */}
      {showExplanation && explanationData && (
        <ExplanationModal
          isOpen={showExplanation}
          onClose={() => setShowExplanation(false)}
          explanationData={explanationData}
          fileName={fileName}
          analysisType={analysisType}
          result={result.result}
        />
      )}
    </div>
  );
}