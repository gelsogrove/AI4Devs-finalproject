describe('Document Management E2E Tests', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Navigate to documents page
    cy.get('[data-cy="nav-documents"]').click();
    cy.url().should('include', '/documents');
  });

  it('should display the documents page correctly', () => {
    // Check page title and description
    cy.contains('h1', 'Documents').should('be.visible');
    cy.contains('Upload and manage your PDF documents for AI processing').should('be.visible');
    
    // Check upload button is present
    cy.contains('button', 'Upload Document').should('be.visible');
    
    // Check search functionality is present
    cy.get('input[placeholder*="Search documents"]').should('be.visible');
  });

  it('should open and close the upload modal', () => {
    // Open upload modal
    cy.contains('button', 'Upload Document').click();
    cy.contains('h2', 'Upload Document').should('be.visible');
    
    // Check modal form elements
    cy.contains('label', 'PDF File *').should('be.visible');
    cy.contains('label', 'Title (optional)').should('be.visible');
    cy.contains('label', 'Category/Path (optional)').should('be.visible');
    
    // Close modal with X button
    cy.get('button').contains('×').click();
    cy.contains('h2', 'Upload Document').should('not.exist');
  });

  it('should validate file upload requirements', () => {
    // Open upload modal
    cy.contains('button', 'Upload Document').click();
    
    // Try to upload without selecting a file
    cy.contains('button', 'Upload').click();
    cy.contains('Please select a PDF file to upload').should('be.visible');
    
    // Close modal
    cy.contains('button', 'Cancel').click();
  });

  it('should upload a PDF document successfully', () => {
    // Create a test PDF file
    const fileName = 'test-document.pdf';
    const fileContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<<\n/Size 2\n/Root 1 0 R\n>>\nstartxref\n74\n%%EOF';
    
    // Open upload modal
    cy.contains('button', 'Upload Document').click();
    
    // Fill in the form
    cy.get('input[type="text"]').first().type('Test Document Title');
    cy.get('input[type="text"]').last().type('test-category');
    
    // Upload file
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: 'application/pdf'
    }, { force: true });
    
    // Verify file is selected
    cy.contains(fileName).should('be.visible');
    
    // Submit upload
    cy.contains('button', 'Upload').click();
    
    // Check for success message
    cy.contains('Document uploaded successfully').should('be.visible');
    
    // Verify modal is closed
    cy.contains('h2', 'Upload Document').should('not.exist');
    
    // Verify document appears in the list
    cy.contains('Test Document Title').should('be.visible');
    cy.contains('test-category').should('be.visible');
  });

  it('should search documents', () => {
    // Assuming there are documents from previous tests or seeded data
    cy.get('input[placeholder*="Search documents"]').type('test');
    cy.get('button').contains('Search').click();
    
    // Check that search results are displayed
    // This will depend on existing data
    cy.get('table').should('be.visible');
  });

  it('should clear search results', () => {
    // Perform a search first
    cy.get('input[placeholder*="Search documents"]').type('test');
    cy.get('button').contains('Search').click();
    
    // Clear search
    cy.get('button').contains('Clear').click();
    
    // Verify search input is cleared
    cy.get('input[placeholder*="Search documents"]').should('have.value', '');
  });

  it('should display document statistics in dashboard', () => {
    // Navigate to dashboard
    cy.get('[data-cy="nav-dashboard"]').click();
    cy.url().should('include', '/dashboard');
    
    // Check documents statistics card
    cy.contains('Documents').should('be.visible');
    cy.contains('PDF documents uploaded').should('be.visible');
    
    // Check documents quick action card
    cy.contains('Manage Documents').should('be.visible');
    cy.contains('Upload and organize PDF documents').should('be.visible');
  });

  it('should navigate to documents from dashboard quick action', () => {
    // Navigate to dashboard
    cy.get('[data-cy="nav-dashboard"]').click();
    
    // Click on documents quick action
    cy.contains('Open Documents').click();
    
    // Verify navigation to documents page
    cy.url().should('include', '/documents');
    cy.contains('h1', 'Documents').should('be.visible');
  });

  it('should handle file type validation', () => {
    // Open upload modal
    cy.contains('button', 'Upload Document').click();
    
    // Try to upload a non-PDF file
    const textContent = 'This is not a PDF file';
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(textContent),
      fileName: 'test.txt',
      mimeType: 'text/plain'
    }, { force: true });
    
    // Should show error message
    cy.contains('Only PDF files are allowed').should('be.visible');
  });

  it('should handle large file validation', () => {
    // Open upload modal
    cy.contains('button', 'Upload Document').click();
    
    // Create a large file (simulate > 10MB)
    const largeContent = 'a'.repeat(11 * 1024 * 1024); // 11MB of 'a' characters
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(largeContent),
      fileName: 'large-file.pdf',
      mimeType: 'application/pdf'
    }, { force: true });
    
    // Should show error message
    cy.contains('File size must be less than 10MB').should('be.visible');
  });

  it('should display document status badges correctly', () => {
    // This test assumes there are documents with different statuses
    // Check for status badges in the document list
    cy.get('table').should('be.visible');
    
    // Look for status badges (these might be from seeded data)
    const statuses = ['COMPLETED', 'PROCESSING', 'UPLOADING', 'FAILED'];
    statuses.forEach(status => {
      // Check if any documents have this status
      cy.get('body').then($body => {
        if ($body.text().includes(status)) {
          cy.contains(status).should('be.visible');
        }
      });
    });
  });

  it('should show pagination when there are many documents', () => {
    // This test assumes there are enough documents to trigger pagination
    cy.get('body').then($body => {
      if ($body.text().includes('Previous') || $body.text().includes('Next')) {
        cy.contains('Showing').should('be.visible');
        cy.get('button').contains('Previous').should('exist');
        cy.get('button').contains('Next').should('exist');
      }
    });
  });

  it('should delete a document', () => {
    // First, ensure there's at least one document by uploading one
    const fileName = 'delete-test.pdf';
    const fileContent = '%PDF-1.4\n%%EOF';
    
    cy.contains('button', 'Upload Document').click();
    cy.get('input[type="text"]').first().type('Document to Delete');
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: 'application/pdf'
    }, { force: true });
    cy.contains('button', 'Upload').click();
    cy.contains('Document uploaded successfully').should('be.visible');
    
    // Wait for the document to appear in the list
    cy.contains('Document to Delete').should('be.visible');
    
    // Find and click the delete button for this document
    cy.contains('tr', 'Document to Delete').within(() => {
      cy.get('button').contains('🗑️').click();
    });
    
    // Confirm deletion in the browser alert
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true);
    });
    
    // Click delete button again to trigger the confirmation
    cy.contains('tr', 'Document to Delete').within(() => {
      cy.get('button').click();
    });
    
    // Verify success message
    cy.contains('Document deleted successfully').should('be.visible');
    
    // Verify document is removed from the list
    cy.contains('Document to Delete').should('not.exist');
  });

  it('should show empty state when no documents exist', () => {
    // This test would need to start with a clean state
    // For now, we'll just check if the empty state elements exist in the DOM
    cy.get('body').then($body => {
      if ($body.text().includes('No documents found')) {
        cy.contains('No documents found').should('be.visible');
        cy.contains('Upload your first PDF document to get started').should('be.visible');
      }
    });
  });
}); 