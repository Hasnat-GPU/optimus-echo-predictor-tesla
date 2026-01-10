import { useState, useCallback } from 'react';
import axios from 'axios';
import { 
  Upload, 
  FileJson, 
  FileSpreadsheet, 
  Waves,
  CheckCircle,
  AlertCircle,
  Download,
  Eye
} from 'lucide-react';
import { HUDCard } from '@/components/HUDCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DataUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [syntheticData, setSyntheticData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  }, []);

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file) => {
    const validTypes = ['text/csv', 'application/json'];
    const validExtensions = ['.csv', '.json'];
    
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast.error('Only CSV and JSON files are supported');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/gestures/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        status: 'success',
        message: response.data.message,
        uploadedAt: new Date().toISOString()
      };

      setUploadedFiles(prev => [uploadedFile, ...prev]);
      toast.success('File uploaded successfully');
    } catch (error) {
      const failedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'error',
        message: error.response?.data?.detail || 'Upload failed',
        uploadedAt: new Date().toISOString()
      };
      
      setUploadedFiles(prev => [failedFile, ...prev]);
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const generateSyntheticData = async (count = 50) => {
    setGenerating(true);
    try {
      const response = await axios.get(`${API}/gestures/synthetic?count=${count}`);
      setSyntheticData(response.data);
      toast.success(`Generated ${response.data.count} synthetic gesture samples`);
    } catch (error) {
      toast.error('Failed to generate synthetic data');
    } finally {
      setGenerating(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getGestureTypeColor = (type) => {
    const colors = {
      stop: 'bg-red-500/20 text-red-400',
      proceed: 'bg-green-500/20 text-green-400',
      slow_down: 'bg-yellow-500/20 text-yellow-400',
      handover: 'bg-blue-500/20 text-blue-400',
      point: 'bg-purple-500/20 text-purple-400',
      wave: 'bg-cyan-500/20 text-cyan-400',
      emergency: 'bg-orange-500/20 text-orange-400'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="space-y-6" data-testid="data-upload">
      {/* Header */}
      <div>
        <h2 className="font-rajdhani text-2xl font-bold text-optimus-silver uppercase tracking-wide">
          Data Management
        </h2>
        <p className="text-sm text-optimus-steel mt-1">
          Upload gesture datasets or generate synthetic samples for testing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <HUDCard title="Upload Dataset" subtitle="CSV or JSON Format" icon={Upload}>
          <div className="mt-4">
            <div
              className={cn(
                "border-2 border-dashed transition-colors p-8 text-center cursor-pointer",
                dragActive 
                  ? "border-optimus-cyan bg-optimus-cyan/5" 
                  : "border-optimus-border hover:border-optimus-cyan/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
              data-testid="upload-dropzone"
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="file-input"
              />
              
              {loading ? (
                <div className="space-y-4">
                  <div className="spinner mx-auto" />
                  <p className="text-sm text-optimus-steel">Uploading...</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center gap-4 mb-4">
                    <div className="p-3 bg-optimus-cyan/10 border border-optimus-cyan/30">
                      <FileJson className="h-8 w-8 text-optimus-cyan" />
                    </div>
                    <div className="p-3 bg-optimus-cyan/10 border border-optimus-cyan/30">
                      <FileSpreadsheet className="h-8 w-8 text-optimus-cyan" />
                    </div>
                  </div>
                  <p className="text-sm text-optimus-silver mb-2">
                    Drag & drop your gesture dataset here
                  </p>
                  <p className="text-xs text-optimus-steel">
                    or click to browse • CSV, JSON supported
                  </p>
                </>
              )}
            </div>

            {/* Upload History */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs text-optimus-steel uppercase tracking-wider mb-2">
                  Recent Uploads
                </h4>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className={cn(
                          "flex items-center justify-between p-2 border",
                          file.status === 'success'
                            ? 'border-optimus-green/30 bg-optimus-green/5'
                            : 'border-optimus-orange/30 bg-optimus-orange/5'
                        )}
                        data-testid={`uploaded-file-${file.id}`}
                      >
                        <div className="flex items-center gap-2">
                          {file.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-optimus-green" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-optimus-orange" />
                          )}
                          <div>
                            <p className="text-xs text-optimus-silver">{file.name}</p>
                            <p className="text-[10px] text-optimus-steel">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-optimus-steel font-mono">
                          {new Date(file.uploadedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </HUDCard>

        {/* Synthetic Data Generation */}
        <HUDCard title="Synthetic Data" subtitle="Generated Samples" icon={Waves}>
          <div className="mt-4 space-y-4">
            <p className="text-sm text-optimus-steel">
              Generate synthetic gesture data for testing and demonstration purposes.
              Includes common gestures: stop, proceed, slow_down, handover, point, wave, emergency.
            </p>

            <div className="flex gap-2">
              <Button
                onClick={() => generateSyntheticData(50)}
                disabled={generating}
                className="btn-primary flex-1"
                data-testid="generate-50-btn"
              >
                {generating ? <div className="spinner w-4 h-4" /> : 'Generate 50'}
              </Button>
              <Button
                onClick={() => generateSyntheticData(100)}
                disabled={generating}
                className="btn-secondary flex-1"
                data-testid="generate-100-btn"
              >
                Generate 100
              </Button>
              <Button
                onClick={() => generateSyntheticData(200)}
                disabled={generating}
                className="btn-secondary flex-1"
                data-testid="generate-200-btn"
              >
                Generate 200
              </Button>
            </div>

            {syntheticData && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-optimus-steel uppercase tracking-wider">
                    Generated: {syntheticData.count} samples
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-optimus-cyan"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(syntheticData.gestures, null, 2)], {
                        type: 'application/json'
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'synthetic_gestures.json';
                      a.click();
                    }}
                    data-testid="download-synthetic-btn"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download JSON
                  </Button>
                </div>

                <ScrollArea className="h-48 border border-optimus-border p-2">
                  <div className="space-y-2">
                    {syntheticData.gestures.slice(0, 20).map((gesture, index) => (
                      <div
                        key={gesture.id}
                        className="flex items-center justify-between p-2 bg-optimus-subtle"
                        data-testid={`gesture-${index}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 uppercase font-mono",
                            getGestureTypeColor(gesture.gesture_type)
                          )}>
                            {gesture.gesture_type}
                          </span>
                          <span className="text-xs text-optimus-steel font-mono">
                            Conf: {(gesture.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-optimus-steel font-mono">
                          {gesture.source}
                        </span>
                      </div>
                    ))}
                    {syntheticData.gestures.length > 20 && (
                      <p className="text-xs text-optimus-steel text-center py-2">
                        ... and {syntheticData.gestures.length - 20} more
                      </p>
                    )}
                  </div>
                </ScrollArea>

                {/* Gesture Type Distribution */}
                <div className="p-3 border border-optimus-border">
                  <h5 className="text-xs text-optimus-steel uppercase tracking-wider mb-2">
                    Gesture Distribution
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(
                      syntheticData.gestures.reduce((acc, g) => {
                        acc[g.gesture_type] = (acc[g.gesture_type] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([type, count]) => (
                      <span
                        key={type}
                        className={cn(
                          "text-[10px] px-2 py-1 font-mono",
                          getGestureTypeColor(type)
                        )}
                      >
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </HUDCard>
      </div>

      {/* Data Format Info */}
      <HUDCard title="Supported Data Formats" icon={Eye}>
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div>
            <h4 className="text-sm font-rajdhani font-semibold text-optimus-silver uppercase mb-2">
              CSV Format
            </h4>
            <pre className="text-xs font-mono text-optimus-steel bg-black/50 p-3 overflow-x-auto">
{`gesture_type,confidence,timestamp,source
stop,0.95,2026-01-01T10:00:00Z,roboflow
proceed,0.88,2026-01-01T10:00:01Z,opencv
handover,0.92,2026-01-01T10:00:02Z,synthetic`}
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-rajdhani font-semibold text-optimus-silver uppercase mb-2">
              JSON Format
            </h4>
            <pre className="text-xs font-mono text-optimus-steel bg-black/50 p-3 overflow-x-auto">
{`[
  {
    "gesture_type": "stop",
    "confidence": 0.95,
    "timestamp": "2026-01-01T10:00:00Z",
    "source": "roboflow"
  }
]`}
            </pre>
          </div>
        </div>
        <p className="text-xs text-optimus-steel mt-4">
          Note: This MVP uses mocked data processing. Real OpenCV integration and Roboflow API 
          compatibility available for production deployments.
        </p>
      </HUDCard>
    </div>
  );
}
