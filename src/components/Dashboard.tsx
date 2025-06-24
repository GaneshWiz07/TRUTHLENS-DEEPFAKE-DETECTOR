import React, { useState, useEffect } from 'react';
import { Calendar, FileText, TrendingUp, AlertTriangle, CheckCircle, Trash2, MoreVertical, Music, BarChart3, Image, Key, Copy, RefreshCw, Eye, EyeOff, Brain, MapPin, Mic } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Analysis } from '../types';
import { useAuth } from '../hooks/useAuth';

export function Dashboard() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [apiToken, setApiToken] = useState<string>('');
  const [showToken, setShowToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAnalyses();
      generateOrLoadApiToken();
    }
  }, [user]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateOrLoadApiToken = async () => {
    try {
      // Check if user already has an API token
      const { data, error } = await supabase
        .from('user_api_tokens')
        .select('token')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.token) {
        setApiToken(data.token);
      } else {
        // Generate new token
        const newToken = generateApiToken();
        
        // Save to database with proper conflict resolution
        const { error: insertError } = await supabase
          .from('user_api_tokens')
          .upsert({
            user_id: user?.id,
            token: newToken,
            created_at: new Date().toISOString(),
            last_used: null
          }, { onConflict: 'user_id' });

        if (!insertError) {
          setApiToken(newToken);
        }
      }
    } catch (error) {
      console.error('Error managing API token:', error);
      // Generate a client-side token as fallback
      const fallbackToken = generateApiToken();
      setApiToken(fallbackToken);
    }
  };

  const generateApiToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = 'tl_'; // TruthLens prefix
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const regenerateApiToken = async () => {
    const newToken = generateApiToken();
    
    try {
      const { error } = await supabase
        .from('user_api_tokens')
        .upsert({
          user_id: user?.id,
          token: newToken,
          created_at: new Date().toISOString(),
          last_used: null
        }, { onConflict: 'user_id' });

      if (!error) {
        setApiToken(newToken);
        alert('API token regenerated successfully!');
      }
    } catch (error) {
      console.error('Error regenerating token:', error);
      setApiToken(newToken);
      alert('API token regenerated (stored locally)!');
    }
  };

  const copyApiToken = async () => {
    try {
      await navigator.clipboard.writeText(apiToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy token:', error);
    }
  };

  const deleteAnalysis = async (id: string) => {
    if (!user?.id) {
      console.error('No user ID available');
      alert('Authentication error. Please refresh the page and try again.');
      return;
    }

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    setDeleting(id);
    
    try {
      console.log('Attempting to delete analysis:', id, 'for user:', user.id);
      
      // First, verify the analysis exists and belongs to the user
      const { data: existingAnalysis, error: fetchError } = await supabase
        .from('analyses')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching analysis for verification:', fetchError);
        throw new Error('Analysis not found or access denied');
      }

      if (!existingAnalysis) {
        throw new Error('Analysis not found');
      }

      console.log('Analysis verified, proceeding with deletion');

      // Perform the delete operation
      const { error: deleteError, count } = await supabase
        .from('analyses')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Delete operation failed:', deleteError);
        throw deleteError;
      }

      console.log('Delete operation completed. Rows affected:', count);

      if (count === 0) {
        throw new Error('No rows were deleted. The analysis may have already been removed.');
      }

      // Update local state only after successful deletion
      setAnalyses(prev => {
        const updated = prev.filter(analysis => analysis.id !== id);
        console.log('Updated local state. Remaining analyses:', updated.length);
        return updated;
      });
      
      setSelectedItems(prev => prev.filter(item => item !== id));
      
      console.log('Analysis successfully deleted');
      
    } catch (error: any) {
      console.error('Error deleting analysis:', error);
      alert(`Failed to delete analysis: ${error.message || 'Unknown error'}`);
    } finally {
      setDeleting(null);
    }
  };

  const deleteBulkAnalyses = async () => {
    if (selectedItems.length === 0 || !user?.id) {
      console.error('No items selected or no user ID');
      return;
    }

    // Confirm bulk deletion
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} selected analyses?`)) {
      return;
    }
    
    setDeleting('bulk');
    
    try {
      console.log('Attempting bulk delete of analyses:', selectedItems, 'for user:', user.id);
      
      // First, verify all analyses exist and belong to the user
      const { data: existingAnalyses, error: fetchError } = await supabase
        .from('analyses')
        .select('id, user_id')
        .in('id', selectedItems)
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching analyses for verification:', fetchError);
        throw new Error('Error verifying analyses for deletion');
      }

      const verifiedIds = existingAnalyses?.map(a => a.id) || [];
      console.log('Verified analyses for deletion:', verifiedIds);

      if (verifiedIds.length === 0) {
        throw new Error('No analyses found for deletion');
      }

      if (verifiedIds.length !== selectedItems.length) {
        console.warn(`Only ${verifiedIds.length} of ${selectedItems.length} analyses can be deleted`);
      }

      // Perform the bulk delete operation
      const { error: deleteError, count } = await supabase
        .from('analyses')
        .delete({ count: 'exact' })
        .in('id', verifiedIds)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Bulk delete operation failed:', deleteError);
        throw deleteError;
      }

      console.log('Bulk delete operation completed. Rows affected:', count);

      if (count === 0) {
        throw new Error('No rows were deleted');
      }

      // Update local state only after successful deletion
      setAnalyses(prev => {
        const updated = prev.filter(analysis => !verifiedIds.includes(analysis.id));
        console.log('Updated local state after bulk delete. Remaining analyses:', updated.length);
        return updated;
      });
      
      setSelectedItems([]);
      setShowBulkActions(false);
      
      console.log(`Successfully deleted ${count} analyses`);
      
    } catch (error: any) {
      console.error('Error bulk deleting analyses:', error);
      alert(`Failed to delete analyses: ${error.message || 'Unknown error'}`);
    } finally {
      setDeleting(null);
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === analyses.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(analyses.map(a => a.id));
    }
  };

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <Mic className="h-5 w-5 text-purple-400" />;
      case 'text':
        return <Brain className="h-5 w-5 text-blue-400" />;
      case 'location':
        return <MapPin className="h-5 w-5 text-green-400" />;
      case 'combined':
        return <BarChart3 className="h-5 w-5 text-orange-400" />;
      default:
        return <Image className="h-5 w-5 text-gray-400" />;
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'voice':
        return 'Voice';
      case 'text':
        return 'AI Text';
      case 'location':
        return 'Location';
      case 'combined':
        return 'Combined';
      default:
        return 'Media';
    }
  };

  const stats = {
    total: analyses.length,
    deepfakes: analyses.filter(a => a.result === 'deepfake').length,
    authentic: analyses.filter(a => a.result === 'real').length,
    avgConfidence: analyses.length > 0 
      ? Math.round(analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length)
      : 0,
    byType: {
      media: analyses.filter(a => (a.analysis_type || 'media') === 'media').length,
      voice: analyses.filter(a => a.analysis_type === 'voice').length,
      text: analyses.filter(a => a.analysis_type === 'text').length,
      location: analyses.filter(a => a.analysis_type === 'location').length,
      combined: analyses.filter(a => a.analysis_type === 'combined').length
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin animate-reverse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass glass-hover rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Analyses</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="glass glass-hover rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">DeepFakes Found</p>
              <p className="text-3xl font-bold text-red-400">{stats.deepfakes}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="glass glass-hover rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Authentic Files</p>
              <p className="text-3xl font-bold text-green-400">{stats.authentic}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="glass glass-hover rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg. Confidence</p>
              <p className="text-3xl font-bold text-blue-400">{stats.avgConfidence}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* API Token Section */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Key className="h-6 w-6 text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">API Token</h3>
              <p className="text-sm text-gray-400">Use this token for Chrome extension and API access</p>
            </div>
          </div>
          <button
            onClick={regenerateApiToken}
            className="flex items-center space-x-2 px-3 py-2 text-sm glass glass-hover rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Regenerate</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={apiToken}
                readOnly
                className="w-full px-4 py-3 glass rounded-lg font-mono text-sm text-white"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={copyApiToken}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                tokenCopied 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/20' 
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
              }`}
            >
              <Copy className="h-4 w-4" />
              <span>{tokenCopied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="glass rounded-lg p-4">
            <h4 className="font-medium text-blue-300 mb-2">Chrome Extension Setup</h4>
            <ol className="text-sm text-gray-300 space-y-1">
              <li>1. Download and install the Chrome extension</li>
              <li>2. Copy the API token above</li>
              <li>3. Open the extension popup and paste the token</li>
              <li>4. Set the API Base URL to: <code className="bg-white/10 px-1 rounded">{window.location.origin}</code></li>
              <li>5. Right-click any image or video online to scan it!</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Analysis Type Breakdown */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Analysis Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Image className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.byType.media}</p>
            <p className="text-sm text-gray-400">Media</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Mic className="h-6 w-6 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.byType.voice}</p>
            <p className="text-sm text-gray-400">Voice</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Brain className="h-6 w-6 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.byType.text}</p>
            <p className="text-sm text-gray-400">AI Text</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MapPin className="h-6 w-6 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.byType.location}</p>
            <p className="text-sm text-gray-400">Location</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="h-6 w-6 text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.byType.combined}</p>
            <p className="text-sm text-gray-400">Combined</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Analysis History</h3>
              <p className="text-sm text-gray-400 mt-1">
                {analyses.length > 0 ? `${analyses.length} total analyses` : 'No analyses yet'}
              </p>
            </div>
            
            {analyses.length > 0 && (
              <div className="flex items-center space-x-3">
                {selectedItems.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">
                      {selectedItems.length} selected
                    </span>
                    <button
                      onClick={deleteBulkAnalyses}
                      disabled={deleting === 'bulk'}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{deleting === 'bulk' ? 'Deleting...' : 'Delete Selected'}</span>
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm glass glass-hover rounded-lg transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span>Actions</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                {showBulkActions && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === analyses.length && analyses.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-600 bg-white/10 text-purple-500 focus:ring-purple-500"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {analyses.length === 0 ? (
                <tr>
                  <td colSpan={showBulkActions ? 7 : 6} className="px-6 py-12 text-center text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-lg font-medium">No analyses yet</p>
                    <p className="text-sm">Upload your first file to get started</p>
                  </td>
                </tr>
              ) : (
                analyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-white/5 transition-colors">
                    {showBulkActions && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(analysis.id)}
                          onChange={() => toggleSelectItem(analysis.id)}
                          className="rounded border-gray-600 bg-white/10 text-purple-500 focus:ring-purple-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg glass flex items-center justify-center">
                            {getAnalysisTypeIcon(analysis.analysis_type || 'media')}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white max-w-xs truncate">
                            {analysis.file_name}
                          </div>
                          <div className="text-sm text-gray-400">
                            {analysis.analysis_type === 'text' ? 
                              `${analysis.text_content?.length || 0} characters` :
                              `${(analysis.file_size / 1024 / 1024).toFixed(2)} MB`
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300">
                        {getAnalysisTypeLabel(analysis.analysis_type || 'media')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        analysis.result === 'real' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/20' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/20'
                      }`}>
                        {analysis.analysis_type === 'text' ? 
                          (analysis.result === 'real' ? 'Human' : 'AI Generated') :
                          analysis.analysis_type === 'location' ?
                          (analysis.result === 'real' ? 'Verified' : 'Suspicious') :
                          (analysis.result === 'real' ? 'Authentic' : 'DeepFake')
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="flex items-center">
                        <div className="w-16 bg-white/20 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${
                              analysis.result === 'real' ? 'bg-green-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${analysis.confidence}%` }}
                          />
                        </div>
                        <span className="font-medium">{analysis.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <button
                        onClick={() => deleteAnalysis(analysis.id)}
                        disabled={deleting === analysis.id}
                        className="flex items-center space-x-1 px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete analysis"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleting === analysis.id && (
                          <span className="text-xs">Deleting...</span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}