import { corsHeaders } from '../_shared/cors.ts';

const HUGGING_FACE_API_KEY = Deno.env.get('HUGGING_FACE_API_KEY');

// AI text detection models
const AI_DETECTION_MODELS = {
  primary: 'openai-detector-roberta-base',
  gpt2: 'gpt2-detector',
  roberta: 'roberta-base-openai-detector',
  fallback: 'microsoft/DialoGPT-medium'
};

interface AITextAnalysisResult {
  result: 'real' | 'deepfake';
  confidence: number;
  issues_detected: string[];
  analysis_type: 'text';
  ai_fingerprint: AIFingerprint;
  explanation_data: {
    model_used: string;
    processing_time: number;
    ai_fingerprint: AIFingerprint;
  };
}

interface AIFingerprint {
  detected_models: ModelProbability[];
  linguistic_patterns: LinguisticPattern[];
  generation_confidence: number;
  human_likelihood: number;
}

interface ModelProbability {
  model_name: string;
  probability: number;
  confidence: number;
  characteristics: string[];
}

interface LinguisticPattern {
  pattern_type: string;
  description: string;
  confidence: number;
  examples: string[];
}

function analyzeTextForAI(text: string): AITextAnalysisResult {
  const startTime = Date.now();
  
  // Initialize analysis results
  const detectedModels: ModelProbability[] = [];
  const linguisticPatterns: LinguisticPattern[] = [];
  const issues: string[] = [];
  
  // Text preprocessing
  const words = text.toLowerCase().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  // GPT-style patterns
  let gptScore = 0;
  const gptCharacteristics: string[] = [];
  
  // Check for GPT-like sentence structures
  if (avgWordsPerSentence > 15 && avgWordsPerSentence < 25) {
    gptScore += 20;
    gptCharacteristics.push('Consistent sentence length typical of GPT');
  }
  
  // GPT often uses certain transitional phrases
  const gptTransitions = [
    'furthermore', 'moreover', 'additionally', 'consequently', 'therefore',
    'in conclusion', 'to summarize', 'it is important to note', 'it should be noted'
  ];
  
  const transitionCount = gptTransitions.filter(phrase => 
    text.toLowerCase().includes(phrase)
  ).length;
  
  if (transitionCount > 2) {
    gptScore += 25;
    gptCharacteristics.push('Excessive use of formal transitions');
    linguisticPatterns.push({
      pattern_type: 'formal_transitions',
      description: 'Overuse of formal transitional phrases',
      confidence: 0.8,
      examples: gptTransitions.filter(phrase => text.toLowerCase().includes(phrase))
    });
  }
  
  // Check for GPT's tendency to be overly explanatory
  const explanatoryPhrases = [
    'it is worth noting', 'it is essential to understand', 'it is crucial to',
    'one must consider', 'it becomes clear that', 'this highlights the importance'
  ];
  
  const explanatoryCount = explanatoryPhrases.filter(phrase => 
    text.toLowerCase().includes(phrase)
  ).length;
  
  if (explanatoryCount > 1) {
    gptScore += 20;
    gptCharacteristics.push('Overly explanatory language patterns');
  }
  
  // Claude-style patterns
  let claudeScore = 0;
  const claudeCharacteristics: string[] = [];
  
  // Claude tends to use more nuanced language
  const claudePhrases = [
    'i appreciate', 'i understand', 'that said', 'to be fair',
    'it\'s worth considering', 'from my perspective', 'i think it\'s important',
    'i\'d be happy to', 'i hope this helps'
  ];
  
  const claudeCount = claudePhrases.filter(phrase => 
    text.toLowerCase().includes(phrase)
  ).length;
  
  if (claudeCount > 1) {
    claudeScore += 30;
    claudeCharacteristics.push('Anthropic Claude conversational patterns');
    linguisticPatterns.push({
      pattern_type: 'conversational_markers',
      description: 'Claude-style conversational markers',
      confidence: 0.75,
      examples: claudePhrases.filter(phrase => text.toLowerCase().includes(phrase))
    });
  }
  
  // LLaMA/Meta AI patterns
  let llamaScore = 0;
  const llamaCharacteristics: string[] = [];
  
  // LLaMA often has more direct, less flowery language
  if (avgWordLength < 5.5 && avgWordsPerSentence < 18) {
    llamaScore += 15;
    llamaCharacteristics.push('Direct communication style typical of LLaMA');
  }
  
  // Check for repetitive patterns (common in AI text)
  const repetitivePatterns = findRepetitivePatterns(text);
  if (repetitivePatterns.length > 0) {
    issues.push('Repetitive sentence structures detected');
    linguisticPatterns.push({
      pattern_type: 'repetitive_structures',
      description: 'Repetitive sentence patterns',
      confidence: 0.7,
      examples: repetitivePatterns
    });
  }
  
  // Check for lack of personal anecdotes or specific details
  const personalMarkers = [
    'i remember', 'last week', 'yesterday', 'my friend', 'my experience',
    'when i was', 'i once', 'personally', 'in my case'
  ];
  
  const personalCount = personalMarkers.filter(marker => 
    text.toLowerCase().includes(marker)
  ).length;
  
  if (personalCount === 0 && text.length > 200) {
    issues.push('Lack of personal anecdotes or specific experiences');
    linguisticPatterns.push({
      pattern_type: 'impersonal_tone',
      description: 'Absence of personal experiences or anecdotes',
      confidence: 0.6,
      examples: ['No personal markers found in text']
    });
  }
  
  // Check for perfect grammar (AI rarely makes typos)
  const typoPatterns = [
    /\b(teh|hte|adn|nad|taht|thier|recieve|seperate)\b/gi,
    /\b\w+\1+\b/g, // repeated letters
    /[.]{2,}|[!]{2,}|[?]{2,}/g // multiple punctuation
  ];
  
  const hasTypos = typoPatterns.some(pattern => pattern.test(text));
  if (!hasTypos && text.length > 100) {
    issues.push('Suspiciously perfect grammar and spelling');
    linguisticPatterns.push({
      pattern_type: 'perfect_grammar',
      description: 'Unnaturally perfect grammar and spelling',
      confidence: 0.5,
      examples: ['No typos or grammatical errors found']
    });
  }
  
  // Compile model probabilities
  if (gptScore > 0) {
    detectedModels.push({
      model_name: 'GPT (OpenAI)',
      probability: Math.min(gptScore / 100, 0.95),
      confidence: 0.8,
      characteristics: gptCharacteristics
    });
  }
  
  if (claudeScore > 0) {
    detectedModels.push({
      model_name: 'Claude (Anthropic)',
      probability: Math.min(claudeScore / 100, 0.95),
      confidence: 0.75,
      characteristics: claudeCharacteristics
    });
  }
  
  if (llamaScore > 0) {
    detectedModels.push({
      model_name: 'LLaMA (Meta)',
      probability: Math.min(llamaScore / 100, 0.95),
      confidence: 0.7,
      characteristics: llamaCharacteristics
    });
  }
  
  // Calculate overall AI generation confidence
  const maxModelScore = Math.max(gptScore, claudeScore, llamaScore);
  const generationConfidence = Math.min(maxModelScore / 100, 0.95);
  const humanLikelihood = 1 - generationConfidence;
  
  // Determine if text is AI-generated
  const isAIGenerated = generationConfidence > 0.4;
  const finalConfidence = Math.round(generationConfidence * 100);
  
  const aiFingerprint: AIFingerprint = {
    detected_models: detectedModels.sort((a, b) => b.probability - a.probability),
    linguistic_patterns: linguisticPatterns,
    generation_confidence: generationConfidence,
    human_likelihood: humanLikelihood
  };
  
  const processingTime = (Date.now() - startTime) / 1000;
  
  return {
    result: isAIGenerated ? 'deepfake' : 'real',
    confidence: finalConfidence,
    issues_detected: isAIGenerated ? issues : [],
    analysis_type: 'text',
    ai_fingerprint: aiFingerprint,
    explanation_data: {
      model_used: 'Advanced AI Text Detection v2.0',
      processing_time: processingTime,
      ai_fingerprint: aiFingerprint
    }
  };
}

function findRepetitivePatterns(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const patterns: string[] = [];
  
  // Check for sentences starting with similar patterns
  const startPatterns: { [key: string]: number } = {};
  
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    const firstThreeWords = trimmed.split(' ').slice(0, 3).join(' ').toLowerCase();
    
    if (firstThreeWords.length > 5) {
      startPatterns[firstThreeWords] = (startPatterns[firstThreeWords] || 0) + 1;
    }
  });
  
  Object.entries(startPatterns).forEach(([pattern, count]) => {
    if (count > 2) {
      patterns.push(`Repeated sentence start: "${pattern}"`);
    }
  });
  
  return patterns;
}

async function analyzeWithHuggingFace(text: string): Promise<AITextAnalysisResult> {
  try {
    if (!HUGGING_FACE_API_KEY) {
      console.warn('Hugging Face API key not configured, using local analysis');
      return analyzeTextForAI(text);
    }

    // Try multiple models for better accuracy
    const modelResults = await Promise.allSettled([
      fetch(`https://api-inference.huggingface.co/models/${AI_DETECTION_MODELS.primary}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }),
      fetch(`https://api-inference.huggingface.co/models/${AI_DETECTION_MODELS.roberta}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      })
    ]);

    let aiProbability = 0;
    let modelUsed = 'Local Analysis';

    // Process successful API responses
    for (const result of modelResults) {
      if (result.status === 'fulfilled' && result.value.ok) {
        const data = await result.value.json();
        console.log('HF API Response:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          const aiResult = data.find(item => 
            item.label?.toLowerCase().includes('generated') || 
            item.label?.toLowerCase().includes('ai') ||
            item.label?.toLowerCase().includes('fake')
          );
          
          if (aiResult && aiResult.score > aiProbability) {
            aiProbability = aiResult.score;
            modelUsed = 'Hugging Face + Local Analysis';
          }
        }
      }
    }

    // Combine with local analysis
    const localAnalysis = analyzeTextForAI(text);
    
    // Use the higher confidence score
    const combinedConfidence = Math.max(aiProbability, localAnalysis.ai_fingerprint.generation_confidence);
    
    return {
      ...localAnalysis,
      confidence: Math.round(combinedConfidence * 100),
      result: combinedConfidence > 0.4 ? 'deepfake' : 'real',
      explanation_data: {
        ...localAnalysis.explanation_data,
        model_used: modelUsed
      }
    };

  } catch (error) {
    console.error('Hugging Face API error:', error);
    return analyzeTextForAI(text);
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
    const textContent = formData.get('text_content') as string;
    
    if (!textContent || textContent.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text content provided for AI analysis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (textContent.length < 50) {
      return new Response(
        JSON.stringify({ error: 'Text too short for reliable AI detection (minimum 50 characters)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`AI text analysis: text length: ${textContent.length}`);

    const analysisResult = await analyzeWithHuggingFace(textContent);

    console.log('AI text analysis result:', analysisResult);

    return new Response(
      JSON.stringify(analysisResult),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('AI text analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'AI text analysis failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});