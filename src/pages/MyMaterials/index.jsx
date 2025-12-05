import { useState, useEffect } from 'react'
import {
  FileText,
  Video,
  Image,
  Music,
  Archive,
  Upload,
  Plus,
  Search,
  Settings,
  Filter,
  Grid3X3,
  List,
  Download,
  Eye,
  Trash2,
  Edit3,
  X,
  Calendar,
  Bookmark,
  Tag,
  FolderPlus,
  File
} from 'lucide-react'
import { useCategories } from '../../contexts/CategoryContext'
import './MyMaterials.css'

const MyMaterials = () => {
  const [viewMode, setViewMode] = useState('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [userModules, setUserModules] = useState([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedModule, setSelectedModule] = useState(null)
  const [showViewer, setShowViewer] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1')
  const [editingCategory, setEditingCategory] = useState(null)
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'general',
    tags: '',
    file: null
  })


  // Load user modules from API on component mount
  useEffect(() => {
    const fetchModules = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found. User must be logged in to see materials.');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/materials/documents`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch materials');
        }

        const data = await response.json();
        const formattedModules = data.documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          category: doc.category_id,
          tags: doc.tags || [],
          fileName: doc.file_name,
          fileSize: doc.file_size,
          fileType: doc.file_type,
          uploadDate: doc.upload_date,
          lastAccessed: doc.last_accessed,
          bookmarked: doc.bookmarked,
          fileUrl: doc.file_url,
        }));
        setUserModules(formattedModules);
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    };

    fetchModules();
  }, []);

  // Helper functions
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
    if (fileType.includes('video')) return <Video className="h-5 w-5 text-blue-500" />
    if (fileType.includes('image')) return <Image className="h-5 w-5 text-green-500" />
    if (fileType.includes('audio')) return <Music className="h-5 w-5 text-purple-500" />
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-5 w-5 text-orange-500" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        file: file
      }))
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadForm.title || !uploadForm.file) {
      alert('Please provide a title and select a file');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('You must be logged in to upload materials.');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    // Send null if category is 'general' or not a number
    const categoryId = isNaN(parseInt(uploadForm.category, 10)) ? null : uploadForm.category;
    formData.append('category_id', categoryId);
    
    const tags = uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    formData.append('tags', JSON.stringify(tags));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/materials/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload material');
      }

      // The backend returns a 'document' object. Map its fields to the frontend's 'module' structure.
      const newModule = {
        id: result.document.id,
        title: result.document.title,
        description: result.document.description,
        category: result.document.category_id,
        tags: result.document.tags || [],
        fileName: result.document.file_name,
        fileSize: result.document.file_size,
        fileType: result.document.file_type,
        uploadDate: result.document.upload_date,
        lastAccessed: result.document.last_accessed,
        bookmarked: result.document.bookmarked,
        fileUrl: result.document.file_url,
      };
      
      setUserModules(prev => [newModule, ...prev]);
      setUploadForm({
        title: '',
        description: '',
        category: 'general',
        tags: '',
        file: null,
      });
      setShowUploadModal(false);
      
      alert('Material uploaded successfully!');

    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    }
  };

  const handleDownload = async (module) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('You must be logged in to download materials.');
      return;
    }

    // A better way would be to store the file ID from Drive in the database.
    // For now, let's assume the ID can be parsed from the webViewLink.
    // e.g., https://drive.google.com/file/d/DRIVE_FILE_ID/view?usp=sharing
    // or https://docs.google.com/document/d/DRIVE_FILE_ID/edit?usp=sharing
    const match = module.fileUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)|docs\.google\.com\/[a-z]+\/d\/([a-zA-Z0-9_-]+)/);
    const fileId = match ? (match[1] || match[2]) : null;

    if (!fileId) {
        alert('Could not determine the file ID for download.');
        console.error('Could not parse file ID from URL:', module.fileUrl);
        return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/materials/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('File download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', module.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert(error.message);
    }
  };

  const deleteModule = async (moduleId) => {
    if (confirm('Are you sure you want to delete this module?')) {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('You must be logged in to delete materials.');
        return;
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/materials/${moduleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to delete material');
        }
        // Remove deleted module from state
        const updatedModules = userModules.filter(module => module.id !== moduleId);
        setUserModules(updatedModules);
        alert('Material deleted successfully.');
      } catch (error) {
        console.error('Delete error:', error);
        alert(`Delete failed: ${error.message}`);
      }
    }
  }

  const toggleBookmark = (moduleId) => {
    // TODO: Implement API call to update bookmark status
    const updatedModules = userModules.map(module => 
      module.id === moduleId 
        ? { ...module, bookmarked: !module.bookmarked }
        : module
    )
    setUserModules(updatedModules)
  }

  const openModule = async (module) => {
    // TODO: Implement API call to update last_accessed time
    // Update last accessed time locally for immediate feedback
    setUserModules(prev => prev.map(m =>
      m.id === module.id
        ? { ...m, lastAccessed: new Date().toISOString() }
        : m
    ))
    setSelectedModule(module)
    setShowViewer(true)

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('You must be logged in to view materials.');
      return;
    }

    // Extract file ID from URL
    const match = module.fileUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)|docs\.google\.com\/[a-z]+\/d\/([a-zA-Z0-9_-]+)/);
    const fileId = match ? (match[1] || match[2]) : null;

    if (!fileId) {
      alert('Could not determine the file ID for viewing.');
      console.error('Could not parse file ID from URL:', module.fileUrl);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/materials/view/${fileId}?inline=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('File view failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Optionally revokeObjectURL after some time
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('View error:', error);
      alert(error.message);
    }
  }

  // Category management functions
  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      const newCategoryPayload = {
        name: newCategoryName,
        color: newCategoryColor,
        icon: 'FileText'
      }
      const result = await addCategory(newCategoryPayload)
      if (result.success) {
        setNewCategoryName('')
        setNewCategoryColor('#6366f1')
        notifyDataSaved('Category added successfully')
      } else {
        alert('Failed to add category: ' + result.error)
      }
    }
  }

  const handleEditCategory = async (categoryId, newName, newColor) => {
    const updates = {
      name: newName,
      color: newColor
    }
    const result = await updateCategory(categoryId, updates)
    if (result.success) {
      // Update all modules with this category
      const updatedModules = userModules.map(module =>
        module.category === categoryId
          ? { ...module, category: categoryId }
          : module
      )
      setUserModules(updatedModules)
      // saveUserModules(updatedModules) // Data is now managed by the backend

      setEditingCategory(null)
      notifyDataSaved('Category updated successfully')
    } else {
      alert('Failed to update category: ' + result.error)
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? Materials will be moved to General.')) {
      const result = await deleteCategory(categoryId)
      if (result.success) {
        // Move all modules with this category to 'general'
        const updatedModules = userModules.map(module =>
          module.category === categoryId
            ? { ...module, category: 'general' }
            : module
        )
        setUserModules(updatedModules)
        // saveUserModules(updatedModules) // Data is now managed by the backend

        notifyDataSaved('Category deleted successfully')
      } else {
        alert('Failed to delete category: ' + result.error)
      }
    }
  }

const filteredModules = userModules.filter(module => {
  const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory
  const matchesSearch = searchTerm === '' ||
    module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  const matchesBookmark = !showOnlyBookmarked || module.bookmarked
  return matchesCategory && matchesSearch && matchesBookmark
})

  return (
    <div className="materials-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">My Learning Materials</h1>
          <p className="page-subtitle">Upload and manage your study documents, videos, and resources</p>
        </div>
        <div className="page-header-actions">
          <button 
            className="action-btn primary"
            onClick={() => setShowUploadModal(true)}
          >
            <Plus size={16} />
            Upload Material
          </button>
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="course-search-container">
          <Search className="course-search-icon" />
          <input
            type="text"
            placeholder="Search your materials..."
            className="course-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">All</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button
          className="filter-button"
          onClick={() => setShowCategoryManager(true)}
          title="Manage Categories"
        >
          <Settings size={16} />
        </button>
        <button
  className={`filter-button ${showOnlyBookmarked ? 'active' : ''}`}
  onClick={() => setShowOnlyBookmarked(prev => !prev)}
  title="Show Bookmarked Only"
>
  <Bookmark size={16} />
</button>
      </div>

      {/* Empty State or Materials Display */}
      {filteredModules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <FolderPlus size={64} className="empty-state-icon" />
            <h3 className="empty-state-title">No materials uploaded yet</h3>
            <p className="empty-state-description">
              Start building your personal learning library by uploading your study materials.
              You can upload PDFs, videos, images, audio files, and more!
            </p>
            <button 
              className="action-btn primary"
              onClick={() => setShowUploadModal(true)}
            >
              <Plus size={16} />
              Upload Your First Material
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Materials Grid/List */}
          {viewMode === 'grid' ? (
            <div className="materials-gridd">
              {filteredModules.map((module) => (
                <div key={module.id} className="material-card">
                  <div className="material-header">
                    <div className="material-type">
                      <div className="material-type-icon">
                        {getFileIcon(module.fileType)}
                      </div>
                      <div>
                        <h3 className="material-title">{module.title}</h3>
                        <p className="material-subject">{formatFileSize(module.fileSize)}</p>
                      </div>
                      <button 
                        className={`material-action-btn ${module.bookmarked ? 'bookmarked' : ''}`}
                        onClick={() => toggleBookmark(module.id)}
                      >
                        <Bookmark size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="material-content">
                    {module.description && (
                      <p className="material-description">{module.description}</p>
                    )}
                    <div className="material-tags">
                      {module.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="material-tag">
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))}
                      {module.tags.length > 3 && (
                        <span className="material-tag">+{module.tags.length - 3} more</span>
                      )}
                    </div>
                    <div className="material-footer">
                      <span className="material-date">
                        <Calendar size={12} />
                        {new Date(module.uploadDate).toLocaleDateString()}
                      </span>
                      <div className="material-actionss">
                        <button 
                          className="material-action-btn"
                          onClick={() => openModule(module)}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="material-action-btn"
                          onClick={() => handleDownload(module)}
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          className="material-action-btn danger"
                          onClick={() => deleteModule(module.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="materials-list">
              {filteredModules.map((module) => (
                <div key={module.id} className="material-list-item">
                  <div className="material-list-content">
                    <div className="material-type-icon">
                      {getFileIcon(module.fileType)}
                    </div>
                    <div className="material-list-info">
                      <h3 className="material-list-title">{module.title}</h3>
                      <p className="material-list-meta">
                        {formatFileSize(module.fileSize)} • {new Date(module.uploadDate).toLocaleDateString()}
                      </p>
                      {module.description && (
                        <p className="material-description">{module.description}</p>
                      )}
                    </div>
                    <div className="material-tags">
                      {module.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="material-tag">
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="material-actionss">
                      <button
                        className={`material-action-btn ${module.bookmarked ? 'bookmarked' : ''}`}
                        onClick={() => toggleBookmark(module.id)}
                        title="Bookmark"
                      >
                        <Bookmark size={16} />
                      </button>
                      <button
                        className="material-action-btn"
                        onClick={() => openModule(module)}
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="material-action-btn"
                        onClick={() => handleDownload(module)}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        className="material-action-btn danger"
                        onClick={() => deleteModule(module.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload Learning Material</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowUploadModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-groupp">
                <label htmlFor="material-title">Title *</label>
                <input
                  id="material-title"
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter material title"
                  className="form-input"
                />
              </div>
              <div className="form-groupp">
                <label htmlFor="material-description">Description</label>
                <textarea
                  id="material-description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the material"
                  className="form-textarea"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-groupp">
                  <label htmlFor="material-category">Category</label>
                  <select
                    id="material-category"
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                    className="form-select"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-groupp">
                  <label htmlFor="material-tags">Tags</label>
                  <input
                    id="material-tags"
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-groupp">
                <label htmlFor="material-file">File *</label>
                <div className="file-upload-area">
                  <input
                    id="material-file"
                    type="file"
                    onChange={handleFileUpload}
                    className="file-input"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.avi,.mov,.mp3,.wav,.jpg,.jpeg,.png,.gif,.zip,.rar"
                  />
                  <div className="file-upload-content">
                    <Upload size={32} />
                    <p>Click to select a file or drag and drop</p>
                    <p className="file-upload-hint">
                      Supported: PDF, DOC, PPT, TXT, MP4, MP3, Images, Archives
                    </p>
                    {uploadForm.file && (
                      <div className="selected-file">
                        <File size={16} />
                        <span>{uploadForm.file.name}</span>
                        <span className="file-size">({formatFileSize(uploadForm.file.size)})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="action-btn secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button
                className="action-btn primary"
                onClick={handleUploadSubmit}
                disabled={!uploadForm.title || !uploadForm.file}
              >
                Upload Material
              </button>
            </div>
          </div>
        </div>
      )}

      

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="modal-overlay" onClick={() => setShowCategoryManager(false)}>
          <div className="modal-content category-manager-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Categories</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowCategoryManager(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Add New Category */}
              <div className="add-category-section">
                <h4>Add New Category</h4>
                <div className="add-category-form">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="form-input"
                  />
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="color-input"
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing Categories */}
              <div className="categories-list">
                <h4>Existing Categories</h4>
                {categories.map(category => (
                  <div key={category.id} className="category-item">
                    {editingCategory === category.id ? (
                      <div className="category-edit-form">
                        <input
                          type="text"
                          defaultValue={category.name}
                          onBlur={(e) => handleEditCategory(category.id, e.target.value, category.color)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditCategory(category.id, e.target.value, category.color)
                            }
                          }}
                          className="form-input"
                          autoFocus
                        />
                        <input
                          type="color"
                          defaultValue={category.color}
                          onChange={(e) => handleEditCategory(category.id, category.name, e.target.value)}
                          className="color-input"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="category-info">
                          <div
                            className="category-color-indicator"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="category-name">{category.name}</span>
                          <span className="category-count">
                            ({userModules.filter(m => m.category === category.id).length} materials)
                          </span>
                        </div>
                        <div className="category-actions">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditingCategory(category.id)}
                          >
                            <Edit3 size={14} />
                          </button>
                          {category.id !== 'general' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyMaterials
