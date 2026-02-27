import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import FileUploader from '../components/documents/FileUploader';
import DocumentFormatter from '../components/documents/DocumentFormatter';
import { Plus, FileText, Download, Trash2, Eye, Upload, Star, Copy, Wand2 } from 'lucide-react';
import { format } from 'date-fns';

const Documents = () => {
  const { documents, deleteDocument, updateDocument, addDocument, grants } = useApp();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'templates', or 'formatter'

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocument(id);
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

  const handleView = (doc) => {
    setSelectedDoc(doc);
  };

  const handleMarkAsTemplate = (doc) => {
    updateDocument(doc.id, { isTemplate: !doc.isTemplate });
  };

  const handleUseTemplate = (doc) => {
    // Create a copy of the document
    const newDoc = {
      ...doc,
      name: doc.name + ' (Copy)',
      isTemplate: false,
      templateSource: doc.id
    };
    delete newDoc.id;
    delete newDoc.createdAt;
    delete newDoc.updatedAt;
    addDocument(newDoc);
    alert(`Created a copy of "${doc.name}"! You can now edit it.`);
  };

  // Filter documents
  const displayedDocs = viewMode === 'templates'
    ? documents.filter(d => d.isTemplate)
    : documents;

  const templateCount = documents.filter(d => d.isTemplate).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
          <p className="text-gray-600">Manage your project documents and templates</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsUploadOpen(true)}
        >
          <Upload size={20} className="mr-2" />
          Upload Documents
        </Button>
      </div>

      {/* View Mode Tabs */}
      <Card className="mb-6">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'all' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('all')}
            className="flex items-center gap-2"
          >
            <FileText size={16} />
            All Documents ({documents.length})
          </Button>
          <Button
            variant={viewMode === 'templates' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('templates')}
            className="flex items-center gap-2"
          >
            <Star size={16} />
            My Document Templates ({templateCount})
          </Button>
          <Button
            variant={viewMode === 'formatter' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('formatter')}
            className="flex items-center gap-2"
          >
            <Wand2 size={16} />
            AI Format to Howard Standards
          </Button>
        </div>
      </Card>

      {/* AI Document Formatter */}
      {viewMode === 'formatter' && (
        <DocumentFormatter />
      )}

      {viewMode === 'templates' && templateCount === 0 && (
        <Card className="mb-6 bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <Star size={24} className="text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How to Use Documents as Templates</h3>
              <p className="text-sm text-blue-800 mb-3">
                Mark any document as a template to reuse it without alterations. Perfect for PRFs, forms, and standard documents.
              </p>
              <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                <li>Upload or find a document you want to reuse (like your PRF form)</li>
                <li>Click the star icon to mark it as a template</li>
                <li>Switch to "My Document Templates" view</li>
                <li>Click "Use Template" to create a copy you can fill out</li>
              </ol>
            </div>
          </div>
        </Card>
      )}

      {viewMode !== 'formatter' && displayedDocs.length === 0 && viewMode === 'all' ? (
        <Card>
          <div className="text-center py-12">
            <FileText size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-6">Upload your grant documents, forms, and templates</p>
            <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
              <Upload size={20} className="mr-2" />
              Upload Documents
            </Button>
          </div>
        </Card>
      ) : displayedDocs.length === 0 && viewMode === 'templates' ? (
        <Card>
          <div className="text-center py-12">
            <Star size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No document templates yet</h3>
            <p className="text-gray-500 mb-6">Mark documents as templates to reuse them</p>
            <Button variant="primary" onClick={() => setViewMode('all')}>
              View All Documents
            </Button>
          </div>
        </Card>
      ) : viewMode !== 'formatter' ? (
        <div className="space-y-4">
          {displayedDocs.map(doc => (
            <Card key={doc.id} className={`hover:shadow-xl transition-shadow ${doc.isTemplate ? 'border-2 border-yellow-300' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${doc.isTemplate ? 'bg-yellow-100' : 'bg-primary-100'}`}>
                    {doc.isTemplate ? (
                      <Star size={24} className="text-yellow-600" fill="currentColor" />
                    ) : (
                      <FileText size={24} className="text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{doc.name}</h3>
                      {doc.isTemplate && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          Template
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                        {doc.category}
                      </span>
                      <span>{format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                      {doc.fileSize && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                        </>
                      )}
                      {doc.grantId && grants.find(g => g.id === doc.grantId) && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-primary-600">
                            {grants.find(g => g.id === doc.grantId)?.title}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.isTemplate && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleUseTemplate(doc)}
                      title="Create a copy from this template"
                    >
                      <Copy size={16} className="mr-1" />
                      Use Template
                    </Button>
                  )}
                  {doc.fileUrl && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                        <Eye size={16} className="mr-1" />
                        View
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleDownload(doc)}>
                        <Download size={16} />
                      </Button>
                    </>
                  )}
                  <Button
                    variant={doc.isTemplate ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleMarkAsTemplate(doc)}
                    title={doc.isTemplate ? "Remove from templates" : "Mark as template"}
                  >
                    <Star size={16} className={doc.isTemplate ? "fill-current" : ""} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(doc.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Documents"
        size="lg"
      >
        <FileUploader onClose={() => setIsUploadOpen(false)} />
      </Modal>

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.name}
          size="xl"
        >
          <div className="space-y-4">
            {selectedDoc.fileUrl && (
              <div className="border rounded-lg overflow-hidden">
                {selectedDoc.fileType?.startsWith('image/') ? (
                  <img
                    src={selectedDoc.fileUrl}
                    alt={selectedDoc.name}
                    className="w-full h-auto"
                  />
                ) : selectedDoc.fileType === 'application/pdf' ? (
                  <iframe
                    src={selectedDoc.fileUrl}
                    className="w-full h-[600px]"
                    title={selectedDoc.name}
                  />
                ) : (
                  <div className="text-center py-12">
                    <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-4">
                      Preview not available for this file type
                    </p>
                    <Button variant="primary" onClick={() => handleDownload(selectedDoc)}>
                      <Download size={16} className="mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Document Details</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Category:</strong> {selectedDoc.category}</p>
                <p><strong>Uploaded:</strong> {format(new Date(selectedDoc.createdAt), 'MMM d, yyyy h:mm a')}</p>
                {selectedDoc.fileSize && (
                  <p><strong>Size:</strong> {(selectedDoc.fileSize / 1024).toFixed(1)} KB</p>
                )}
                {selectedDoc.fileType && (
                  <p><strong>Type:</strong> {selectedDoc.fileType}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSelectedDoc(null)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => handleDownload(selectedDoc)}>
                <Download size={16} className="mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Documents;
