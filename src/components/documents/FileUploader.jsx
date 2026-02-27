import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';
import Select from '../common/Select';
import Input from '../common/Input';
import { Upload, File, X, CheckCircle } from 'lucide-react';

const FileUploader = ({ onClose }) => {
  const { addDocument, grants } = useApp();
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState('');
  const [grantId, setGrantId] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const categoryOptions = [
    { value: 'grant', label: 'Grant Document' },
    { value: 'budget', label: 'Budget Document' },
    { value: 'report', label: 'Report' },
    { value: 'meeting', label: 'Meeting Minutes' },
    { value: 'template', label: 'Template' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'other', label: 'Other' },
  ];

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select at least one file');
      return;
    }

    if (!category) {
      alert('Please select a category');
      return;
    }

    setUploading(true);

    try {
      // Process each file
      for (const file of files) {
        // In a real app, you would upload to a server/cloud storage
        // For now, we'll store file metadata and convert to base64 for local storage
        const reader = new FileReader();

        await new Promise((resolve, reject) => {
          reader.onload = (e) => {
            const fileData = {
              name: file.name,
              type: 'uploaded',
              category: category,
              grantId: grantId || undefined,
              fileUrl: e.target.result, // Base64 data URL
              fileSize: file.size,
              fileType: file.type,
              metadata: {
                uploadedAt: new Date().toISOString(),
                originalName: file.name,
                size: file.size,
                type: file.type,
              },
            };

            addDocument(fileData);
            resolve();
          };

          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      alert(`Successfully uploaded ${files.length} file(s)!`);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault();
          const droppedFiles = Array.from(e.dataTransfer.files);
          setFiles(prev => [...prev, ...droppedFiles]);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all"
      >
        <Upload size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-700 font-medium mb-2">
          Click to upload or drag and drop
        </p>
        <p className="text-sm text-gray-500">
          PDF, DOC, DOCX, XLS, XLSX, TXT, PNG, JPG (Max 10MB per file)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">Selected Files ({files.length})</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <File size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Selection */}
      <Select
        label="Document Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        options={categoryOptions}
        required
      />

      {/* Grant Association */}
      {grants.length > 0 && (
        <Select
          label="Associate with Grant (Optional)"
          value={grantId}
          onChange={(e) => setGrantId(e.target.value)}
          options={grants.map(g => ({ value: g.id, label: g.title }))}
        />
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <CheckCircle size={16} className="mr-1" />
              Upload {files.length} File{files.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>

      {/* Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Files are stored locally in your browser. For production use,
          consider implementing cloud storage (Firebase Storage, AWS S3, etc.) for better
          performance and accessibility across devices.
        </p>
      </div>
    </div>
  );
};

export default FileUploader;
