import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import DragDropFileZone from '../common/DragDropFileZone';
import { FileText, Download, Eye, Trash2, Plus, Upload, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';

const DeliverablesSection = ({
  grantId,
  aimId = null,
  subAimId = null,
  activityId = null,
  title = "Deliverables",
  compact = false
}) => {
  const { documents, addDocument, updateDocument, deleteDocument } = useApp();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMetadata, setUploadMetadata] = useState({
    category: 'Grant Document',
    description: ''
  });

  // Filter documents linked to this specific context
  const linkedDocuments = documents.filter(doc => {
    if (activityId) return doc.activityId === activityId;
    if (subAimId) return doc.subAimId === subAimId;
    if (aimId) return doc.aimId === aimId;
    if (grantId) return doc.grantId === grantId && !doc.aimId && !doc.subAimId && !doc.activityId;
    return false;
  });

  const handleFilesSelected = (files) => {
    setSelectedFiles(files);
  };

  const handleUploadSubmit = () => {
    selectedFiles.forEach(file => {
      // Create a document entry
      const documentData = {
        name: file.name,
        category: uploadMetadata.category,
        description: uploadMetadata.description || '',
        size: file.size,
        type: file.type,
        grantId: grantId,
        aimId: aimId,
        subAimId: subAimId,
        activityId: activityId,
        uploadDate: new Date().toISOString(),
        isTemplate: false,
        // In a real app, you'd upload to a server and store the URL
        // For now, we'll create a local object URL
        fileUrl: URL.createObjectURL(file),
        file: file // Store file object temporarily (in real app, this would be uploaded)
      };

      addDocument(documentData);
    });

    // Reset and close
    setSelectedFiles([]);
    setUploadMetadata({ category: 'Grant Document', description: '' });
    setIsUploadModalOpen(false);
  };

  const handleDelete = (docId) => {
    if (window.confirm('Are you sure you want to remove this document?')) {
      deleteDocument(docId);
    }
  };

  const handleDownload = (doc) => {
    if (doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.name;
      link.click();
    }
  };

  const handleQuickUpload = (files) => {
    files.forEach(file => {
      const documentData = {
        name: file.name,
        category: 'Grant Document',
        description: '',
        size: file.size,
        type: file.type,
        grantId: grantId,
        aimId: aimId,
        subAimId: subAimId,
        activityId: activityId,
        uploadDate: new Date().toISOString(),
        isTemplate: false,
        fileUrl: URL.createObjectURL(file),
        file: file
      };

      addDocument(documentData);
    });
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h6 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText size={14} />
            {title} ({linkedDocuments.length})
          </h6>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus size={12} className="mr-1" />
            Add
          </Button>
        </div>

        {linkedDocuments.length === 0 ? (
          <DragDropFileZone
            onFilesSelected={handleQuickUpload}
            compact={true}
            multiple={true}
          />
        ) : (
          <div className="space-y-2">
            {linkedDocuments.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-gray-900 truncate">{doc.name}</span>
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Download"
                  >
                    <Download size={12} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={12} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
            <DragDropFileZone
              onFilesSelected={handleQuickUpload}
              compact={true}
              multiple={true}
            />
          </div>
        )}

        {/* Upload Modal */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload Documents"
          size="lg"
        >
          <div className="space-y-4">
            <DragDropFileZone
              onFilesSelected={handleFilesSelected}
              multiple={true}
            />

            {selectedFiles.length > 0 && (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={uploadMetadata.category}
                      onChange={(e) => setUploadMetadata({ ...uploadMetadata, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    >
                      <option value="Grant Document">Grant Document</option>
                      <option value="Report">Report</option>
                      <option value="Budget">Budget</option>
                      <option value="Deliverable">Deliverable</option>
                      <option value="Data">Data</option>
                      <option value="Correspondence">Correspondence</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={uploadMetadata.description}
                      onChange={(e) => setUploadMetadata({ ...uploadMetadata, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="Brief description..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleUploadSubmit}>
                    <Upload size={16} className="mr-2" />
                    Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    );
  }

  // Full/expanded view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="font-semibold text-gray-900 flex items-center gap-2">
          <FolderOpen size={18} />
          {title} ({linkedDocuments.length})
        </h5>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsUploadModalOpen(true)}
        >
          <Plus size={14} className="mr-1" />
          Upload Documents
        </Button>
      </div>

      {linkedDocuments.length === 0 ? (
        <DragDropFileZone
          onFilesSelected={handleQuickUpload}
          multiple={true}
        />
      ) : (
        <div className="space-y-3">
          {linkedDocuments.map(doc => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FileText size={20} className="text-primary-600 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h6 className="font-semibold text-gray-900 mb-1 truncate">{doc.name}</h6>
                    {doc.description && (
                      <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">{doc.category}</span>
                      <span>{(doc.size / 1024).toFixed(2)} KB</span>
                      {doc.uploadDate && (
                        <span>{format(new Date(doc.uploadDate), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download size={14} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <div className="pt-2">
            <DragDropFileZone
              onFilesSelected={handleQuickUpload}
              compact={true}
              multiple={true}
            />
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Documents"
        size="lg"
      >
        <div className="space-y-4">
          <DragDropFileZone
            onFilesSelected={handleFilesSelected}
            multiple={true}
          />

          {selectedFiles.length > 0 && (
            <>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={uploadMetadata.category}
                    onChange={(e) => setUploadMetadata({ ...uploadMetadata, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="Grant Document">Grant Document</option>
                    <option value="Report">Report</option>
                    <option value="Budget">Budget</option>
                    <option value="Deliverable">Deliverable</option>
                    <option value="Data">Data</option>
                    <option value="Correspondence">Correspondence</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={uploadMetadata.description}
                    onChange={(e) => setUploadMetadata({ ...uploadMetadata, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="Brief description..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleUploadSubmit}>
                  <Upload size={16} className="mr-2" />
                  Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DeliverablesSection;
