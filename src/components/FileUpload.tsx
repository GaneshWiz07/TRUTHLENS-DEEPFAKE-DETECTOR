import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, Video, Music, FileText, X, AlertCircle, Loader2, MapPin, Brain, Mic } from 'lucide-react';
import { UploadProgress } from '../types';

interface FileUploadProps {
  onFileUpload: (file: File, textContent?: string, analysisType?: 'media' | 'voice' | 'combined' | 'text' | 'location' | 'media-only' | 'text-only') => Promise<void>;
  loading: boolean;
}

export function FileUpload({ onFileUpload, loading }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<'media' | 'voice' | 'combined' | 'text' | 'location'>('media');
  const [textContent, setTextContent] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [combinedAnalysisMode, setCombinedAnalysisMode] = useState<'both' | 'media-only' | 'text-only'>('both');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError('');
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      let finalAnalysisType = analysisType;
      
      // Handle combined analysis modes
      if (analysisType === 'combined') {
        if (combinedAnalysisMode === 'media-only') {
          finalAnalysisType = 'media-only' as any;
        } else if (combinedAnalysisMode === 'text-only') {
          finalAnalysisType = 'text-only' as any;
        }
      }

      await onFileUpload(file, textContent || undefined, finalAnalysisType);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploadProgress(null);
    }
  }, [onFileUpload, textContent, analysisType, combinedAnalysisMode]);

  const getAcceptedFiles = () => {
    switch (analysisType) {
      case 'voice':
        return {
          'audio/*': ['.wav', '.mp3', '.m4a', '.ogg']
        };
      case 'text':
        return {}; // No file needed for text-only analysis
      case 'location':
        return {
          'image/*': ['.jpeg', '.jpg', '.png'],
          'video/*': ['.mp4', '.mov', '.avi']
        };
      case 'combined':
        if (combinedAnalysisMode === 'text-only') {
          return {}; // No file needed for text-only analysis
        }
        return {
          'image/*': ['.jpeg', '.jpg', '.png'],
          'video/*': ['.mp4', '.mov', '.avi']
        };
      default:
        return {
          'image/*': ['.jpeg', '.jpg', '.png'],
          'video/*': ['.mp4', '.mov', '.avi']
        };
    }
  };

  const getMaxSize = () => {
    switch (analysisType) {
      case 'voice':
        return 20 * 1024 * 1024; // 20MB for audio
      case 'location':
        return 100 * 1024 * 1024; // 100MB for location analysis
      case 'combined':
        return 100 * 1024 * 1024; // 100MB for combined analysis
      default:
        return 50 * 1024 * 1024; // 50MB for media
    }
  };

  const { getRootProps, getInputProps, isDragActive, rejectedFiles } = useDropzone({
    onDrop,
    accept: getAcceptedFiles(),
    maxFiles: 1,
    maxSize: getMaxSize(),
    disabled: loading || (analysisType === 'combined' && combinedAnalysisMode === 'text-only') || analysisType === 'text'
  });

  const fileRejectionError = rejectedFiles && rejectedFiles.length > 0 
    ? rejectedFiles[0].errors[0]?.message 
    : null;

  const handleTextOnlyAnalysis = async () => {
    if (!textContent.trim()) {
      setError('Please enter text content for analysis');
      return;
    }

    setError('');
    try {
      // Create a dummy file for text-only analysis
      const dummyFile = new File([''], 'text-analysis.txt', { type: 'text/plain' });
      await onFileUpload(dummyFile, textContent, analysisType === 'text' ? 'text' : 'text-only' as any);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Type Selection */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Analysis Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => {
              setAnalysisType('media');
              setShowTextInput(false);
              setTextContent('');
            }}
            className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
              analysisType === 'media'
                ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`p-3 rounded-xl transition-all duration-300 ${
                analysisType === 'media' 
                  ? 'bg-cyan-400/20 shadow-lg shadow-cyan-400/20' 
                  : 'bg-white/10 group-hover:bg-white/20'
              }`}>
                <Image className={`h-6 w-6 transition-colors ${
                  analysisType === 'media' ? 'text-cyan-400' : 'text-gray-400 group-hover:text-white'
                }`} />
              </div>
              <div className="text-center">
                <h4 className="font-medium text-white">Media Analysis</h4>
                <p className="text-sm text-gray-400">Images & Videos</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setAnalysisType('voice');
              setShowTextInput(false);
              setTextContent('');
            }}
            className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
              analysisType === 'voice'
                ? 'border-purple-400 bg-purple-400/10 shadow-lg shadow-purple-400/20'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`p-3 rounded-xl transition-all duration-300 ${
                analysisType === 'voice' 
                  ? 'bg-purple-400/20 shadow-lg shadow-purple-400/20' 
                  : 'bg-white/10 group-hover:bg-white/20'
              }`}>
                <Music className={`h-6 w-6 transition-colors ${
                  analysisType === 'voice' ? 'text-purple-400' : 'text-gray-400 group-hover:text-white'
                }`} />
              </div>
              <div className="text-center">
                <h4 className="font-medium text-white">Voice Analysis</h4>
                <p className="text-sm text-gray-400">AI Voice Detection</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setAnalysisType('text');
              setShowTextInput(true);
            }}
            className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
              analysisType === 'text'
                ? 'border-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/20'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`p-3 rounded-xl transition-all duration-300 ${
                analysisType === 'text' 
                  ? 'bg-blue-400/20 shadow-lg shadow-blue-400/20' 
                  : 'bg-white/10 group-hover:bg-white/20'
              }`}>
                <Brain className={`h-6 w-6 transition-colors ${
                  analysisType === 'text' ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'
                }`} />
              </div>
              <div className="text-center">
                <h4 className="font-medium text-white">AI Text Detection</h4>
                <p className="text-sm text-gray-400">GPT, Claude, etc.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setAnalysisType('location');
              setShowTextInput(true);
            }}
            className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
              analysisType === 'location'
                ? 'border-green-400 bg-green-400/10 shadow-lg shadow-green-400/20'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`p-3 rounded-xl transition-all duration-300 ${
                analysisType === 'location' 
                  ? 'bg-green-400/20 shadow-lg shadow-green-400/20' 
                  : 'bg-white/10 group-hover:bg-white/20'
              }`}>
                <MapPin className={`h-6 w-6 transition-colors ${
                  analysisType === 'location' ? 'text-green-400' : 'text-gray-400 group-hover:text-white'
                }`} />
              </div>
              <div className="text-center">
                <h4 className="font-medium text-white">Location Verification</h4>
                <p className="text-sm text-gray-400">OCR + Visual Check</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setAnalysisType('combined');
              setShowTextInput(true);
            }}
            className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
              analysisType === 'combined'
                ? 'border-orange-400 bg-orange-400/10 shadow-lg shadow-orange-400/20'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`p-3 rounded-xl transition-all duration-300 ${
                analysisType === 'combined' 
                  ? 'bg-orange-400/20 shadow-lg shadow-orange-400/20' 
                  : 'bg-white/10 group-hover:bg-white/20'
              }`}>
                <FileText className={`h-6 w-6 transition-colors ${
                  analysisType === 'combined' ? 'text-orange-400' : 'text-gray-400 group-hover:text-white'
                }`} />
              </div>
              <div className="text-center">
                <h4 className="font-medium text-white">Combined Analysis</h4>
                <p className="text-sm text-gray-400">Multi-modal Detection</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Combined Analysis Mode Selection */}
      {analysisType === 'combined' && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Analysis Mode</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setCombinedAnalysisMode('both')}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                combinedAnalysisMode === 'both'
                  ? 'border-orange-400 bg-orange-400/10 shadow-lg shadow-orange-400/20'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="text-center">
                <h4 className="font-medium text-white">Both Together</h4>
                <p className="text-sm text-gray-400">Analyze media + text correlation</p>
              </div>
            </button>

            <button
              onClick={() => setCombinedAnalysisMode('media-only')}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                combinedAnalysisMode === 'media-only'
                  ? 'border-orange-400 bg-orange-400/10 shadow-lg shadow-orange-400/20'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="text-center">
                <h4 className="font-medium text-white">Media Only</h4>
                <p className="text-sm text-gray-400">Focus on visual content</p>
              </div>
            </button>

            <button
              onClick={() => setCombinedAnalysisMode('text-only')}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                combinedAnalysisMode === 'text-only'
                  ? 'border-orange-400 bg-orange-400/10 shadow-lg shadow-orange-400/20'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="text-center">
                <h4 className="font-medium text-white">Text Only</h4>
                <p className="text-sm text-gray-400">Analyze text for misinformation</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Text Input for Text/Location/Combined Analysis */}
      {showTextInput && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            {analysisType === 'text' ? 'Text Content for AI Detection' : 
             analysisType === 'location' ? 'Location Context (Optional)' : 'Text Content'}
          </h3>
          <div className="relative">
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={
                analysisType === 'text' 
                  ? 'Enter text to analyze for AI generation (GPT, Claude, etc.)...'
                  : analysisType === 'location'
                  ? 'Enter any text context about the location (optional)...'
                  : 'Enter news article, social media post, or any text content...'
              }
              className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none text-white placeholder-gray-400 transition-all duration-300"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {textContent.length} characters
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-3">
            {analysisType === 'text' 
              ? 'This text will be analyzed for AI generation patterns using advanced linguistic models.'
              : analysisType === 'location'
              ? 'Optional context about the claimed location for cross-verification with visual content.'
              : combinedAnalysisMode === 'both' 
              ? 'This text will be analyzed for misinformation and cross-referenced with the media content.'
              : combinedAnalysisMode === 'text-only'
              ? 'This text will be analyzed for misinformation patterns and false claims.'
              : 'This text will be used as context for media analysis.'
            }
          </p>

          {/* Text-only analysis button */}
          {(analysisType === 'text' || (combinedAnalysisMode === 'text-only')) && (
            <div className="mt-6">
              <button
                onClick={handleTextOnlyAnalysis}
                disabled={loading || !textContent.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20"
              >
                <Brain className="h-4 w-4" />
                <span>{loading ? 'Analyzing...' : analysisType === 'text' ? 'Analyze Text for AI' : 'Analyze Text'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* File Upload Area */}
      {(analysisType !== 'combined' || combinedAnalysisMode !== 'text-only') && analysisType !== 'text' && (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group
              ${isDragActive 
                ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20' 
                : 'border-white/20 hover:border-cyan-400/50 hover:bg-white/5'
              }
              ${loading ? 'cursor-not-allowed opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {loading ? (
              <div className="space-y-6">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 border-4 border-cyan-400/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-4 border-transparent border-t-purple-400 rounded-full animate-spin animate-reverse"></div>
                </div>
                <div>
                  <p className="text-lg font-medium text-white">
                    {analysisType === 'voice' ? 'Analyzing voice patterns and AI signatures...' :
                     analysisType === 'location' ? 'Extracting locations and verifying landmarks...' :
                     analysisType === 'combined' ? 'Analyzing media and text...' : 
                     'Analyzing your file...'}
                  </p>
                  <p className="text-sm text-gray-400">This may take a few moments</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/20">
                    <Upload className="h-10 w-10 text-white" />
                  </div>
                </div>
                
                <div>
                  <p className="text-xl font-medium text-white mb-2">
                    {isDragActive ? 'Drop your file here' : 
                     `Upload ${analysisType === 'voice' ? 'audio' : 
                              analysisType === 'location' ? 'media' :
                              analysisType === 'combined' ? 'media' : 'media'} for analysis`}
                  </p>
                  <p className="text-sm text-gray-400">
                    Drag and drop or click to select
                  </p>
                </div>

                <div className="flex justify-center space-x-8 text-sm text-gray-400">
                  {analysisType === 'voice' ? (
                    <div className="flex items-center space-x-2">
                      <Mic className="h-4 w-4" />
                      <span>Audio: WAV, MP3, M4A (max 20MB)</span>
                    </div>
                  ) : analysisType === 'location' ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <Image className="h-4 w-4" />
                        <span>Images: JPG, PNG</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4" />
                        <span>Videos: MP4, MOV (max 100MB)</span>
                      </div>
                    </>
                  ) : analysisType === 'combined' ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <Image className="h-4 w-4" />
                        <span>Images: JPG, PNG</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4" />
                        <span>Videos: MP4, MOV (max 100MB)</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <Image className="h-4 w-4" />
                        <span>Images: JPG, PNG (max 10MB)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4" />
                        <span>Videos: MP4 (max 50MB)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {uploadProgress && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="w-full max-w-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">Uploading...</span>
                    <span className="text-sm text-cyan-400">{uploadProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-purple-400 h-3 rounded-full transition-all duration-300 shadow-lg shadow-cyan-400/20"
                      style={{ width: `${uploadProgress.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {(error || fileRejectionError) && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-300 font-medium">Upload Error</p>
                <p className="text-red-400 text-sm mt-1">
                  {error || fileRejectionError}
                </p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}