import React, { useState } from 'react';
import { Upload, BarChart3 } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { AnalysisResult } from './AnalysisResult';
import { Dashboard } from './Dashboard';
import { AnalysisResult as AnalysisResultType } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export function AnalysisSection() {
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard'>('upload');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResultType | null>(null);
  const [currentFile, setCurrentFile] = useState<{ name: string; size: number } | null>(null);
  const [analysisType, setAnalysisType] = useState<'media' | 'voice' | 'combined' | 'text' | 'location'>('media');
  const { user } = useAuth();

  const handleFileUpload = async (file: File, textContent?: string, uploadAnalysisType?: 'media' | 'voice' | 'combined' | 'text' | 'location' | 'media-only' | 'text-only') => {
    setLoading(true);
    setResult(null);
    setCurrentFile({ name: file.name, size: file.size });
    
    let currentAnalysisType: 'media' | 'voice' | 'combined' | 'text' | 'location' = 'media';
    
    // Map the analysis types
    if (uploadAnalysisType === 'voice') {
      currentAnalysisType = 'voice';
    } else if (uploadAnalysisType === 'text') {
      currentAnalysisType = 'text';
    } else if (uploadAnalysisType === 'location') {
      currentAnalysisType = 'location';
    } else if (uploadAnalysisType === 'combined' || uploadAnalysisType === 'media-only' || uploadAnalysisType === 'text-only') {
      currentAnalysisType = 'combined';
    } else {
      currentAnalysisType = 'media';
    }
    
    setAnalysisType(currentAnalysisType);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('analysis_type', currentAnalysisType);
      
      if (textContent && (currentAnalysisType === 'combined' || currentAnalysisType === 'text' || currentAnalysisType === 'location' || uploadAnalysisType === 'text-only')) {
        formData.append('text_content', textContent);
      }

      if (uploadAnalysisType === 'media-only' || uploadAnalysisType === 'text-only') {
        formData.append('sub_analysis_type', uploadAnalysisType);
      }
      
      // Determine which edge function to call based on analysis type
      let functionName = 'analyze-deepfake';
      if (currentAnalysisType === 'voice') {
        functionName = 'analyze-voice-deepfake';
      } else if (currentAnalysisType === 'text') {
        functionName = 'analyze-text-ai';
      } else if (currentAnalysisType === 'location') {
        functionName = 'analyze-location-verification';
      } else if (currentAnalysisType === 'combined') {
        functionName = 'analyze-combined-deepfake';
      }
      
      // Call our edge function for analysis
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const analysisResult = await response.json();
      
      // Generate report ID
      const reportId = Math.random().toString(36).substr(2, 9).toUpperCase();
      analysisResult.report_id = reportId;
      
      // Save to database
      await supabase.from('analyses').insert({
        user_id: user?.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        result: analysisResult.result,
        confidence: analysisResult.confidence,
        issues_detected: analysisResult.issues_detected,
        analysis_type: currentAnalysisType,
        text_content: textContent || null,
        explanation_data: analysisResult.explanation_data || null,
        report_id: reportId,
      });

      setResult(analysisResult);
    } catch (error: any) {
      throw new Error(error.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Tab Navigation - Responsive */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-xl backdrop-blur-xl border border-white/10">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
            activeTab === 'upload'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload & Analyze</span>
          <span className="sm:hidden">Upload</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
          <span className="sm:hidden">Stats</span>
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div className="space-y-6">
          <FileUpload onFileUpload={handleFileUpload} loading={loading} />
          {result && currentFile && (
            <AnalysisResult 
              result={result} 
              fileName={currentFile.name}
              fileSize={currentFile.size}
              analysisType={analysisType}
            />
          )}
        </div>
      ) : (
        <Dashboard />
      )}
    </div>
  );
}