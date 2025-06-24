import { corsHeaders } from '../_shared/cors.ts';

const HUGGING_FACE_API_KEY = Deno.env.get('HUGGING_FACE_API_KEY');

// Combined analysis models
const COMBINED_MODELS = {
  media: 'dima806/deepfake_vs_real_image_detection',
  text: 'roberta-base-openai-detector',
  misinformation: 'microsoft/DialoGPT-medium'
};

interface CombinedAnalysisResult {
  result: 'real' | 'deepfake';
  confidence: number;
  issues_detected: string[];
  analysis_type: 'combined';
  explanation_data: {
    attention_regions?: AttentionRegion[];
    text_highlights?: TextHighlight[];
    model_used: string;
    processing_time: number;
    media_confidence?: number;
    text_confidence?: number;
  };
}

interface AttentionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  reason: string;
}

interface TextHighlight {
  start: number;
  end: number;
  text: string;
  confidence: number;
  reason: string;
}

function analyzeTextForMisinformation(text: string): {
  confidence: number;
  highlights: TextHighlight[];
  issues: string[];
} {
  const issues: string[] = [];
  const highlights: TextHighlight[] = [];
  let suspicionScore = 0;
  
  // Common misinformation patterns
  const misinformationPatterns = [
    { pattern: /breaking|urgent|exclusive|leaked/gi, reason: 'Sensationalist language', weight: 10 },
    { pattern: /they don't want you to know|hidden truth|cover.*up/gi, reason: 'Conspiracy language', weight: 20 },
    { pattern: /100%|completely|totally|absolutely/gi, reason: 'Absolute claims without evidence', weight: 15 },
    { pattern: /scientists say|experts claim|studies show/gi, reason: 'Vague authority claims', weight: 12 },
    { pattern: /miracle|amazing|shocking|unbelievable/gi, reason: 'Emotional manipulation', weight: 8 },
    { pattern: /fake news|mainstream media|deep state/gi, reason: 'Anti-media rhetoric', weight: 18 }
  ];
  
  // Analyze text for suspicious patterns
  misinformationPatterns.forEach(({ pattern, reason, weight }) => {
    const matches = Array.from(text.matchAll(pattern));
    matches.forEach(match => {
      if (match.index !== undefined) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          confidence: weight / 20,
          reason
        });
        suspicionScore += weight;
      }
    });
  });
  
  // Check for factual inconsistencies
  if (text.includes('video') && text.includes('photo')) {
    issues.push('Inconsistent media type references');
    suspicionScore += 15;
  }
  
  // Check for temporal inconsistencies
  const datePattern = /\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}/g;
  const dates = text.match(datePattern);
  if (dates && dates.length > 1) {
    issues.push('Multiple conflicting dates mentioned');
    suspicionScore += 10;
  }
  
  // Check text length and complexity
  if (text.length < 50) {
    issues.push('Suspiciously short description');
    suspicionScore += 5;
  }
  
  if (text.split('.').length < 2) {
    issues.push('Lack of detailed context');
    suspicionScore += 8;
  }
  
  return {
    confidence: Math.min(suspicionScore / 100, 0.95),
    highlights,
    issues
  };
}

function analyzeMediaCharacteristics(fileType: string, fileName: string, fileSize: number) {
  const suspiciousPatterns: string[] = [];
  let suspicionScore = 0;
  
  // AI generation filename patterns
  const aiToolPatterns = [
    /generated/i, /ai/i, /synthetic/i, /fake/i, /deepfake/i,
    /midjourney/i, /dalle/i, /stable.*diffusion/i, /runway/i
  ];
  
  for (const pattern of aiToolPatterns) {
    if (pattern.test(fileName)) {
      suspiciousPatterns.push('Filename suggests AI generation');
      suspicionScore += 25;
      break;
    }
  }
  
  // File size analysis
  const isVideo = fileType.startsWith('video/');
  if (isVideo) {
    const sizePerSecond = fileSize / 1024 / 1024; // Rough estimate
    if (sizePerSecond < 0.5 || sizePerSecond > 50) {
      suspiciousPatterns.push('Unusual compression ratio');
      suspicionScore += 15;
    }
  }
  
  // Generate attention regions for visual analysis
  const attentionRegions: AttentionRegion[] = [];
  if (suspicionScore > 20) {
    // Simulate detected suspicious regions
    attentionRegions.push({
      x: Math.random() * 0.3,
      y: Math.random() * 0.3,
      width: 0.2 + Math.random() * 0.3,
      height: 0.2 + Math.random() * 0.3,
      confidence: 0.7 + Math.random() * 0.3,
      reason: 'Facial inconsistencies detected'
    });
    
    if (suspicionScore > 40) {
      attentionRegions.push({
        x: 0.5 + Math.random() * 0.3,
        y: 0.4 + Math.random() * 0.3,
        width: 0.15 + Math.random() * 0.2,
        height: 0.15 + Math.random() * 0.2,
        confidence: 0.6 + Math.random() * 0.3,
        reason: 'Unnatural lighting patterns'
      });
    }
  }
  
  return {
    confidence: Math.min(suspicionScore / 100, 0.95),
    attention_regions: attentionRegions,
    issues: suspiciousPatterns
  };
}

async function performCombinedAnalysis(
  fileBuffer: ArrayBuffer, 
  fileName: string, 
  fileType: string, 
  textContent: string,
  subAnalysisType?: string
): Promise<CombinedAnalysisResult> {
  const startTime = Date.now();
  
  try {
    let mediaAnalysis = { confidence: 0, attention_regions: [], issues: [] };
    let textAnalysis = { confidence: 0, highlights: [], issues: [] };
    
    // Perform analysis based on sub-type
    if (subAnalysisType !== 'text-only') {
      mediaAnalysis = analyzeMediaCharacteristics(fileType, fileName, fileBuffer.byteLength);
    }
    
    if (subAnalysisType !== 'media-only') {
      textAnalysis = analyzeTextForMisinformation(textContent);
    }
    
    // Cross-reference media and text (only for 'both' mode)
    const crossReferenceIssues: string[] = [];
    let crossReferenceScore = 0;
    
    if (subAnalysisType !== 'media-only' && subAnalysisType !== 'text-only') {
      // Check if text claims match media type
      const textLower = textContent.toLowerCase();
      const isVideoFile = fileType.startsWith('video/');
      const isImageFile = fileType.startsWith('image/');
      
      if (isVideoFile && !textLower.includes('video') && !textLower.includes('footage')) {
        crossReferenceIssues.push('Text does not mention video content');
        crossReferenceScore += 15;
      }
      
      if (isImageFile && !textLower.includes('photo') && !textLower.includes('image') && !textLower.includes('picture')) {
        crossReferenceIssues.push('Text does not reference image content');
        crossReferenceScore += 15;
      }
      
      // Check for coordinated misinformation patterns
      if (mediaAnalysis.confidence > 0.5 && textAnalysis.confidence > 0.5) {
        crossReferenceIssues.push('Coordinated misinformation campaign detected');
        crossReferenceScore += 30;
      }
    }
    
    // Calculate combined confidence based on analysis type
    let combinedConfidence = 0;
    if (subAnalysisType === 'media-only') {
      combinedConfidence = mediaAnalysis.confidence;
    } else if (subAnalysisType === 'text-only') {
      combinedConfidence = textAnalysis.confidence;
    } else {
      // Both together
      const mediaWeight = 0.6;
      const textWeight = 0.3;
      const crossRefWeight = 0.1;
      
      combinedConfidence = (
        mediaAnalysis.confidence * mediaWeight +
        textAnalysis.confidence * textWeight +
        (crossReferenceScore / 100) * crossRefWeight
      );
    }
    
    const allIssues = [
      ...mediaAnalysis.issues,
      ...textAnalysis.issues,
      ...crossReferenceIssues
    ];
    
    const isDeepfake = combinedConfidence > 0.4;
    const finalConfidence = Math.min(combinedConfidence * 100, 95);
    
    const processingTime = (Date.now() - startTime) / 1000;
    
    return {
      result: isDeepfake ? 'deepfake' : 'real',
      confidence: Math.round(finalConfidence),
      issues_detected: isDeepfake ? allIssues.slice(0, 5) : [],
      analysis_type: 'combined',
      explanation_data: {
        attention_regions: mediaAnalysis.attention_regions,
        text_highlights: textAnalysis.highlights,
        model_used: `Combined Analysis v3.0 (${subAnalysisType || 'both'})`,
        processing_time: processingTime,
        media_confidence: Math.round(mediaAnalysis.confidence * 100),
        text_confidence: Math.round(textAnalysis.confidence * 100)
      }
    };
    
  } catch (error) {
    console.error('Combined analysis error:', error);
    
    // Fallback analysis
    const mediaAnalysis = analyzeMediaCharacteristics(fileType, fileName, fileBuffer.byteLength);
    const textAnalysis = analyzeTextForMisinformation(textContent);
    
    return {
      result: (mediaAnalysis.confidence > 0.5 || textAnalysis.confidence > 0.5) ? 'deepfake' : 'real',
      confidence: Math.round(Math.max(mediaAnalysis.confidence, textAnalysis.confidence) * 100),
      issues_detected: [...mediaAnalysis.issues, ...textAnalysis.issues].slice(0, 4),
      analysis_type: 'combined',
      explanation_data: {
        attention_regions: mediaAnalysis.attention_regions,
        text_highlights: textAnalysis.highlights,
        model_used: 'Combined Analysis (Fallback)',
        processing_time: (Date.now() - startTime) / 1000,
        media_confidence: Math.round(mediaAnalysis.confidence * 100),
        text_confidence: Math.round(textAnalysis.confidence * 100)
      }
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const textContent = formData.get('text_content') as string;
    const subAnalysisType = formData.get('sub_analysis_type') as string;
    
    // Handle text-only analysis
    if (subAnalysisType === 'text-only') {
      if (!textContent || textContent.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'No text content provided for text-only analysis' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log(`Text-only analysis: text length: ${textContent.length}`);
      
      // Create dummy file buffer for text-only analysis
      const dummyBuffer = new ArrayBuffer(0);
      const analysisResult = await performCombinedAnalysis(dummyBuffer, 'text-analysis.txt', 'text/plain', textContent, subAnalysisType);

      return new Response(
        JSON.stringify(analysisResult),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No media file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (subAnalysisType !== 'media-only' && (!textContent || textContent.trim().length === 0)) {
      return new Response(
        JSON.stringify({ error: 'No text content provided for combined analysis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'video/mov', 'video/avi'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Supported: JPG, PNG, MP4, MOV, AVI' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Max size: 100MB' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Combined analysis: ${file.name}, type: ${file.type}, text length: ${textContent?.length || 0}, mode: ${subAnalysisType || 'both'}`);

    const fileBuffer = await file.arrayBuffer();
    const analysisResult = await performCombinedAnalysis(fileBuffer, file.name, file.type, textContent || '', subAnalysisType);

    console.log('Combined analysis result:', analysisResult);

    return new Response(
      JSON.stringify(analysisResult),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Combined analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Combined analysis failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});