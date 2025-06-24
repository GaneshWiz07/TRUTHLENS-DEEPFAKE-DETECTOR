import jsPDF from 'jspdf';
import { AnalysisResult } from '../types';

interface ReportData {
  fileName: string;
  fileSize: number;
  result: AnalysisResult;
  analysisType: 'media' | 'voice' | 'combined' | 'text' | 'location';
  timestamp: string;
}

export async function generatePDFReport(data: ReportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header
  doc.setFillColor(37, 99, 235); // Primary blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo and title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DeepFake Detector', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Media Authentication Report', 20, 35);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Report ID and timestamp
  const reportId = data.result.report_id || generateReportId();
  doc.setFontSize(10);
  doc.text(`Report ID: ${reportId}`, pageWidth - 80, 15);
  doc.text(`Generated: ${new Date(data.timestamp).toLocaleString()}`, pageWidth - 80, 25);
  
  let yPosition = 60;
  
  // Analysis Summary
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Analysis Summary', 20, yPosition);
  yPosition += 15;
  
  // Result box
  const resultColor = data.result.result === 'real' ? [34, 197, 94] : [239, 68, 68];
  doc.setFillColor(resultColor[0], resultColor[1], resultColor[2]);
  doc.roundedRect(20, yPosition, pageWidth - 40, 25, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  
  let resultText = '';
  switch (data.analysisType) {
    case 'text':
      resultText = data.result.result === 'real' ? 'HUMAN-WRITTEN' : 'AI-GENERATED';
      break;
    case 'location':
      resultText = data.result.result === 'real' ? 'LOCATION VERIFIED' : 'LOCATION SUSPICIOUS';
      break;
    case 'voice':
      resultText = data.result.result === 'real' ? 'HUMAN VOICE' : 'AI VOICE DETECTED';
      break;
    default:
      resultText = data.result.result === 'real' ? 'AUTHENTIC' : 'DEEPFAKE DETECTED';
  }
  
  const textWidth = doc.getTextWidth(resultText);
  doc.text(resultText, (pageWidth - textWidth) / 2, yPosition + 16);
  
  doc.setTextColor(0, 0, 0);
  yPosition += 40;
  
  // File Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Analysis Information', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const analysisInfo = [
    `File Name: ${data.fileName}`,
    data.analysisType === 'text' 
      ? `Content Length: ${data.result.ai_fingerprint?.detected_models.length || 0} AI models detected`
      : `File Size: ${(data.fileSize / 1024 / 1024).toFixed(2)} MB`,
    `Analysis Type: ${getAnalysisTypeLabel(data.analysisType)}`,
    `Confidence Level: ${data.result.confidence}%`,
    `Model Used: ${data.result.explanation_data?.model_used || 'Advanced AI Detection'}`
  ];
  
  analysisInfo.forEach(info => {
    yPosition += 8;
    doc.text(info, 25, yPosition);
  });
  
  yPosition += 20;
  
  // Analysis-specific information
  if (data.analysisType === 'text' && data.result.ai_fingerprint) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Model Detection', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    if (data.result.ai_fingerprint.detected_models.length > 0) {
      data.result.ai_fingerprint.detected_models.slice(0, 3).forEach(model => {
        yPosition += 8;
        doc.text(`• ${model.model_name}: ${Math.round(model.probability * 100)}% probability`, 25, yPosition);
      });
    } else {
      yPosition += 8;
      doc.text('• No specific AI models detected', 25, yPosition);
    }
    yPosition += 15;
  }
  
  if (data.analysisType === 'voice' && data.result.voice_engine) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Voice Engine Detection', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    if (data.result.voice_engine.detected_engine !== 'Unknown') {
      yPosition += 8;
      doc.text(`• Detected Engine: ${data.result.voice_engine.detected_engine}`, 25, yPosition);
      yPosition += 8;
      doc.text(`• Confidence: ${Math.round(data.result.voice_engine.confidence * 100)}%`, 25, yPosition);
    } else {
      yPosition += 8;
      doc.text('• No specific voice engine detected', 25, yPosition);
    }
    yPosition += 15;
  }
  
  if (data.analysisType === 'location' && data.result.location_analysis) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Location Verification', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    yPosition += 8;
    doc.text(`• Consistency Score: ${Math.round(data.result.location_analysis.consistency_score * 100)}%`, 25, yPosition);
    
    if (data.result.location_analysis.extracted_locations.length > 0) {
      yPosition += 8;
      doc.text(`• Extracted Locations: ${data.result.location_analysis.extracted_locations.map(l => l.location_name).join(', ')}`, 25, yPosition);
    }
    yPosition += 15;
  }
  
  // Issues Detected
  if (data.result.issues_detected.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Issues Detected', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    data.result.issues_detected.forEach(issue => {
      yPosition += 8;
      doc.text(`• ${issue}`, 25, yPosition);
    });
    yPosition += 15;
  }
  
  // Confidence Chart (simple bar representation)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Confidence Analysis', 20, yPosition);
  yPosition += 15;
  
  // Draw confidence bar
  const barWidth = 150;
  const barHeight = 20;
  const confidenceWidth = (data.result.confidence / 100) * barWidth;
  
  // Background bar
  doc.setFillColor(229, 231, 235);
  doc.rect(20, yPosition, barWidth, barHeight, 'F');
  
  // Confidence bar
  doc.setFillColor(resultColor[0], resultColor[1], resultColor[2]);
  doc.rect(20, yPosition, confidenceWidth, barHeight, 'F');
  
  // Confidence text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.result.confidence}%`, 25, yPosition + 13);
  
  doc.setTextColor(0, 0, 0);
  yPosition += 35;
  
  // Verification Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Verification', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const verificationInfo = [
    `This report certifies the analysis of the submitted ${data.analysisType === 'text' ? 'text content' : 'media file'}.`,
    `Analysis performed using state-of-the-art AI detection models.`,
    `Report generated on ${new Date(data.timestamp).toLocaleDateString()}.`,
    `Report ID: ${reportId} can be used for verification purposes.`
  ];
  
  verificationInfo.forEach(info => {
    yPosition += 8;
    doc.text(info, 25, yPosition);
  });
  
  // Footer
  const footerY = pageHeight - 30;
  doc.setFillColor(243, 244, 246);
  doc.rect(0, footerY, pageWidth, 30, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('This report is generated by DeepFake Detector AI system.', 20, footerY + 15);
  doc.text('For verification, contact support with the Report ID.', 20, footerY + 25);
  
  // Save the PDF
  doc.save(`deepfake-analysis-${reportId}.pdf`);
}

function getAnalysisTypeLabel(type: 'media' | 'voice' | 'combined' | 'text' | 'location'): string {
  switch (type) {
    case 'voice':
      return 'Voice/Audio Analysis';
    case 'text':
      return 'AI Text Generation Analysis';
    case 'location':
      return 'Location Verification Analysis';
    case 'combined':
      return 'Combined Media & Text Analysis';
    default:
      return 'Media Analysis';
  }
}

function generateReportId(): string {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}