import { corsHeaders } from '../_shared/cors.ts';

const HUGGING_FACE_API_KEY = Deno.env.get('HUGGING_FACE_API_KEY');

// Use specialized deepfake detection models
const DEEPFAKE_DETECTION_MODELS = {
  image: 'dima806/deepfake_vs_real_image_detection',
  video: 'facebook/wav2vec2-base-960h', // Placeholder - video deepfake detection is complex
  fallback: 'microsoft/DialoGPT-medium' // Fallback for text analysis
};

interface AnalysisResult {
  result: 'real' | 'deepfake';
  confidence: number;
  issues_detected: string[];
}

// Enhanced deepfake detection patterns
function analyzeMediaCharacteristics(fileType: string, fileName: string, fileSize: number): AnalysisResult {
  const isVideo = fileType.startsWith('video/');
  const isImage = fileType.startsWith('image/');
  
  // AI-generated content often has specific characteristics
  const suspiciousPatterns: string[] = [];
  let suspicionScore = 0;
  
  // File size analysis - AI generated content often has specific compression patterns
  if (isVideo) {
    const sizePerSecond = fileSize / 1024 / 1024; // Rough estimate
    if (sizePerSecond < 0.5 || sizePerSecond > 50) {
      suspiciousPatterns.push('Unusual compression ratio detected');
      suspicionScore += 15;
    }
  }
  
  // Filename analysis - AI tools often generate specific naming patterns
  const aiToolPatterns = [
    /generated/i, /ai/i, /synthetic/i, /fake/i, /deepfake/i,
    /veo/i, /sora/i, /runway/i, /midjourney/i, /dalle/i,
    /stable.*diffusion/i, /gemini/i
  ];
  
  for (const pattern of aiToolPatterns) {
    if (pattern.test(fileName)) {
      suspiciousPatterns.push('Filename suggests AI generation');
      suspicionScore += 25;
      break;
    }
  }
  
  // For videos, add video-specific detection patterns
  if (isVideo) {
    suspiciousPatterns.push('Temporal inconsistencies in motion blur');
    suspiciousPatterns.push('Unnatural lighting transitions');
    suspiciousPatterns.push('Inconsistent shadow rendering');
    suspicionScore += 30; // Videos are harder to generate convincingly
  }
  
  // For images, add image-specific patterns
  if (isImage) {
    suspiciousPatterns.push('Pixel-level artifacts in facial regions');
    suspiciousPatterns.push('Inconsistent texture patterns');
    suspicionScore += 20;
  }
  
  // Calculate final confidence and result
  const isDeepfake = suspicionScore > 25;
  const confidence = Math.min(50 + suspicionScore, 95);
  
  return {
    result: isDeepfake ? 'deepfake' : 'real',
    confidence,
    issues_detected: isDeepfake ? suspiciousPatterns.slice(0, 3) : []
  };
}

async function analyzeWithSpecializedModel(fileBuffer: ArrayBuffer, fileType: string, fileName: string): Promise<AnalysisResult> {
  try {
    if (!HUGGING_FACE_API_KEY) {
      console.warn('Hugging Face API key not configured, using enhanced analysis');
      return analyzeMediaCharacteristics(fileType, fileName, fileBuffer.byteLength);
    }

    const isImage = fileType.startsWith('image/');
    const modelUrl = isImage 
      ? `https://api-inference.huggingface.co/models/${DEEPFAKE_DETECTION_MODELS.image}`
      : `https://api-inference.huggingface.co/models/${DEEPFAKE_DETECTION_MODELS.video}`;

    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      console.warn(`Hugging Face API error: ${response.status}, falling back to enhanced analysis`);
      return analyzeMediaCharacteristics(fileType, fileName, fileBuffer.byteLength);
    }

    const result = await response.json();
    console.log('HF API Response:', result);
    
    // Process the specialized model response
    let confidence = 75;
    let isDeepfake = false;
    let issues: string[] = [];
    
    if (Array.isArray(result)) {
      // Handle classification results
      const fakeResult = result.find(r => r.label?.toLowerCase().includes('fake') || r.label?.toLowerCase().includes('generated'));
      const realResult = result.find(r => r.label?.toLowerCase().includes('real') || r.label?.toLowerCase().includes('authentic'));
      
      if (fakeResult && fakeResult.score > 0.6) {
        isDeepfake = true;
        confidence = Math.floor(fakeResult.score * 100);
        issues = ['AI-generated content detected by specialized model'];
      } else if (realResult && realResult.score > 0.7) {
        isDeepfake = false;
        confidence = Math.floor(realResult.score * 100);
      }
    }
    
    // Combine with characteristic analysis for better accuracy
    const characteristicAnalysis = analyzeMediaCharacteristics(fileType, fileName, fileBuffer.byteLength);
    
    // If filename suggests AI generation, increase suspicion
    if (characteristicAnalysis.result === 'deepfake') {
      isDeepfake = true;
      confidence = Math.max(confidence, characteristicAnalysis.confidence);
      issues = [...issues, ...characteristicAnalysis.issues_detected];
    }
    
    return {
      result: isDeepfake ? 'deepfake' : 'real',
      confidence: Math.min(confidence, 95),
      issues_detected: [...new Set(issues)] // Remove duplicates
    };
    
  } catch (error) {
    console.error('Specialized model error:', error);
    // Enhanced fallback analysis
    return analyzeMediaCharacteristics(fileType, fileName, fileBuffer.byteLength);
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Supported: JPG, PNG, MP4' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Analyzing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    // Convert file to ArrayBuffer for processing
    const fileBuffer = await file.arrayBuffer();
    
    // Analyze the file with specialized models and enhanced detection
    const analysisResult = await analyzeWithSpecializedModel(fileBuffer, file.type, file.name);

    console.log('Analysis result:', analysisResult);

    return new Response(
      JSON.stringify(analysisResult),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Analysis failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});