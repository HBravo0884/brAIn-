import { useState } from 'react';
import { Upload, FileText, Wand2, Download, Copy, Loader } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { formatDocumentToHowardStandards, formatDocumentByType, extractTextFromFile } from '../../utils/documentFormatter';

const DocumentFormatter = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('general');
  const [originalText, setOriginalText] = useState('');
  const [formattedText, setFormattedText] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const documentTypes = [
    { value: 'general', label: 'General Document' },
    { value: 'grant-proposal', label: 'Grant Proposal' },
    { value: 'progress-report', label: 'Progress Report' },
    { value: 'budget-justification', label: 'Budget Justification' },
    { value: 'meeting-minutes', label: 'Meeting Minutes' },
    { value: 'memo', label: 'Memorandum' },
    { value: 'letter', label: 'Official Letter' },
  ];

  const handleFileSelect = async (file) => {
    if (!file) return;

    setSelectedFile(file);
    setFormattedText('');

    try {
      const text = await extractTextFromFile(file);
      setOriginalText(text);
    } catch (error) {
      alert(`Error reading file: ${error.message}`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFormat = async () => {
    if (!originalText) {
      alert('Please upload a document first');
      return;
    }

    setIsFormatting(true);
    try {
      const formatted = documentType === 'general'
        ? await formatDocumentToHowardStandards(originalText, documentType)
        : await formatDocumentByType(originalText, documentType);

      setFormattedText(formatted);
    } catch (error) {
      alert(`Error formatting document: ${error.message}\n\nMake sure you've set up your API key in the .env file.`);
    } finally {
      setIsFormatting(false);
    }
  };

  const handleCopyFormatted = () => {
    navigator.clipboard.writeText(formattedText);
    alert('✅ Formatted document copied to clipboard!');
  };

  const handleDownloadFormatted = () => {
    const blob = new Blob([formattedText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile?.name.replace(/\.[^/.]+$/, '')}_formatted.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Wand2 size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Document Formatter</h2>
            <p className="text-sm text-gray-600">
              Upload any document and format it to Howard University brand standards
            </p>
          </div>
        </div>

        {/* Document Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          <Upload size={48} className={`mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />

          {selectedFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <FileText size={20} />
                <p className="font-medium">{selectedFile.name}</p>
              </div>
              <p className="text-sm text-gray-600">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setOriginalText('');
                  setFormattedText('');
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Choose different file
              </button>
            </div>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop your document here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports: .txt, .doc, .docx, .pdf, .md
              </p>
              <input
                type="file"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                accept=".txt,.doc,.docx,.pdf,.md"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer transition-colors"
              >
                Choose File
              </label>
            </>
          )}
        </div>

        {/* Format Button */}
        {selectedFile && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={handleFormat}
              disabled={isFormatting || !originalText}
              variant="primary"
              className="px-8 py-3"
            >
              {isFormatting ? (
                <>
                  <Loader className="animate-spin mr-2" size={20} />
                  Formatting with AI...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2" size={20} />
                  Format to Howard Standards
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Preview Section */}
      {(originalText || formattedText) && (
        <div className="grid grid-cols-2 gap-4">
          {/* Original Document */}
          <Card>
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText size={18} />
              Original Document
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                {originalText}
              </pre>
            </div>
          </Card>

          {/* Formatted Document */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Wand2 size={18} className="text-blue-600" />
                Formatted Document
              </h3>
              {formattedText && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyFormatted}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Copy to clipboard"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={handleDownloadFormatted}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Download as markdown"
                  >
                    <Download size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="bg-blue-50 rounded-lg p-4 h-96 overflow-y-auto border-2 border-blue-200">
              {formattedText ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900">
                    {formattedText}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Click "Format to Howard Standards" to see formatted version</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DocumentFormatter;
