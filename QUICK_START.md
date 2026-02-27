# Program Manager Hub - Quick Start Guide

## ✅ What's Been Implemented

### Phase 1: Core Infrastructure ✅
- ✅ Project setup with Vite + React + Tailwind CSS
- ✅ Global state management with Context API
- ✅ localStorage persistence
- ✅ Responsive layout with collapsible sidebar
- ✅ Routing for all main pages

### Phase 2: Template Management ✅
- ✅ Template library with 8 pre-built templates:
  - Grant Application Form
  - Progress Report
  - Budget Summary
  - Payment Request Form
  - Meeting Report
  - Budget Justification
  - Award Notification
  - Rejection Notification
- ✅ Create custom templates
- ✅ Edit and delete templates
- ✅ Template categorization

### Phase 3: Workflows - Partially Complete ✅
- ✅ Kanban board with drag-like functionality
- ✅ Create, edit, delete tasks
- ✅ Move tasks between columns (To Do, In Progress, Review, Done)
- ✅ Priority levels (low, medium, high)
- ✅ Link tasks to grants
- ✅ Due dates and assignees
- ⏳ Gantt chart (planned)
- ⏳ Progress dashboard with charts (planned)
- ⏳ Flowchart diagrams (planned)

### Phase 4: Budget Tracking ✅
- ✅ Budget overview with total, spent, remaining
- ✅ Visual progress bars
- ✅ Budget per grant
- ✅ Category breakdown display
- ⏳ Detailed budget entry forms (planned)

### Phase 5: Grant Management ✅
- ✅ Create, edit, delete grants
- ✅ Grant status tracking (pending, active, completed, rejected)
- ✅ Link budgets to grants
- ✅ Grant details with dates and funding agency
- ⏳ Aim/objective tracking (planned)
- ⏳ Milestone tracking (planned)

### Phase 6: Document Management ✅
- ✅ **File upload system (drag & drop + click)**
- ✅ **Support for multiple file types** (PDF, DOC, DOCX, XLS, XLSX, TXT, images)
- ✅ **Document categorization**
- ✅ **Link documents to grants**
- ✅ **Document viewer with preview for images and PDFs**
- ✅ **Download functionality**
- ✅ File metadata (size, type, upload date)
- ⏳ Word/PDF export from templates (utility functions created, UI integration pending)

### Phase 7: Dashboard ✅
- ✅ Overview with quick stats
- ✅ Active grants summary
- ✅ Budget visualization
- ✅ Recent documents
- ✅ Quick actions
- ✅ Budget progress indicators

---

## 🚀 How to Use Your New Features

### Uploading Your Existing Documents

1. **Navigate to Documents page** (click "Documents" in the sidebar)

2. **Click "Upload Documents"** button

3. **Add your files** in two ways:
   - Drag and drop files onto the upload zone
   - Click the upload zone to browse and select files

4. **Select file category**:
   - Grant Document
   - Budget Document
   - Report
   - Meeting Minutes
   - Template
   - Correspondence
   - Other

5. **Optionally link to a grant** (if you have grants created)

6. **Click "Upload"** - your files will be stored locally

### Viewing Uploaded Documents

- Click the **"View"** button to preview:
  - Images: Full preview
  - PDFs: Embedded viewer
  - Other files: Download option

- Click **"Download"** to save a copy to your computer

### Creating Grants

1. Go to **Grants** page
2. Click **"New Grant"**
3. Fill in:
   - Grant title
   - Funding agency
   - Amount
   - Status
   - Start/end dates
4. Your grant is now available for linking to tasks and documents!

### Using Pre-Built Templates

1. Go to **Templates** page
2. Click **"Template Library"**
3. Browse 8 pre-built templates
4. Click **"Preview"** to see all fields
5. Click **"Use Template"** to add it to your collection
6. Customize as needed

### Managing Tasks (Kanban Board)

1. Go to **Workflows** page
2. Click **"Kanban Board"** tab (default view)
3. Click **"Add Task"** to create a new task
4. Fill in details:
   - Title and description
   - Status column
   - Priority
   - Due date
   - Assignee
   - Related grant
5. Use the quick move buttons (→) at the bottom of each task card to move between columns

---

## 📁 Organizing Your Folder Structure

### Recommended Workflow for Your Documents

1. **Create Grants First**
   - Go to Grants page
   - Add all your active grants
   - This allows you to link documents and tasks

2. **Upload Documents**
   - Upload your existing grant documents
   - Link each document to its corresponding grant
   - Use consistent category naming

3. **Create Templates**
   - Use the pre-built templates as starting points
   - Customize or create new ones for your specific needs

4. **Set Up Tasks**
   - Create tasks for ongoing work
   - Link tasks to grants
   - Set priorities and due dates

---

## 💡 Tips & Best Practices

### File Organization
- Use descriptive file names
- Link documents to grants for easy filtering
- Use consistent categories across documents

### Grant Management
- Update grant status regularly
- Keep budget information current
- Link all related documents to each grant

### Task Management
- Review your Kanban board daily
- Keep task descriptions clear and actionable
- Set realistic due dates
- Use priority levels consistently

### Templates
- Start with pre-built templates
- Customize them to match your organization's requirements
- Create template variations for different funding agencies

---

## 🔧 Technical Notes

### Data Storage
- All data is stored **locally in your browser** (localStorage)
- No cloud storage by default (privacy-first)
- Files are converted to base64 and stored locally
- **Limitation**: Browser storage is typically limited to 5-10MB
  - For larger files or permanent storage, consider:
    - Firebase Storage (cloud solution)
    - External file server
    - Cloud storage service integration

### File Size Recommendations
- Keep individual files under 2MB for best performance
- Images: Compress before uploading
- PDFs: Use optimized/compressed versions
- For larger files: Store externally and add links as documents

### Browser Compatibility
- Best performance in Chrome, Firefox, Safari, Edge
- Requires modern browser with localStorage support
- JavaScript must be enabled

### Backup Your Data
To backup your data:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Find entries starting with `pm_hub_`
4. Copy and save the JSON data

Or use the export feature (coming in future update).

---

## 🎯 Next Steps

### Immediate Actions
1. ✅ Create your grants
2. ✅ Upload your existing documents
3. ✅ Try the template library
4. ✅ Set up your Kanban board

### Coming Soon
- Advanced budget entry and tracking
- Grant aim/milestone tracking
- Gantt chart for timeline visualization
- Progress dashboards with charts
- Export templates to Word/PDF
- Data backup/export functionality
- Search and filtering
- Advanced document management

---

## 🐛 Known Limitations

1. **File Storage**: Limited by browser localStorage (5-10MB)
2. **Large Files**: May cause performance issues
3. **No Cloud Sync**: Data is local to your browser/device
4. **Single User**: No collaboration features yet

---

## 📞 Support

For issues, questions, or feature requests:
- Check the README.md
- Review this Quick Start Guide
- Refer to the implementation plan

---

**Version**: 1.0.0 - Phase 1-6 Implementation
**Last Updated**: February 18, 2026
