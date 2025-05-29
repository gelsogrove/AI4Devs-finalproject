describe('Profile Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').clear().type('test@example.com');
    cy.get('[data-cy="password-input"]').clear().type('password123');
    cy.get('[data-cy="login-button"]').click();
    
    // Wait for redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Navigate to profile page
    cy.get('[data-cy="nav-profile"]').click();
    cy.url().should('include', '/profile');
  });

  it('should display the profile form with existing data', () => {
    // Check that the form loads with existing profile data
    cy.get('h1').should('contain', 'Company Profile');
    
    // Check that username field is disabled
    cy.get('input[name="username"]').should('be.disabled');
    cy.get('input[name="username"]').should('have.value', 'gusto_italiano');
    
    // Check that other fields have values
    cy.get('input[name="companyName"]').should('have.value', 'Gusto Italiano');
    cy.get('input[name="email"]').should('have.value', 'info@gusto-italiano.com');
    cy.get('textarea[name="description"]').should('not.be.empty');
    cy.get('input[name="phoneNumber"]').should('not.be.empty');
    cy.get('input[name="openingTime"]').should('not.be.empty');
    cy.get('textarea[name="address"]').should('not.be.empty');
    cy.get('input[name="sector"]').should('not.be.empty');
  });

  it('should update profile information successfully', () => {
    // Update company name
    cy.get('input[name="companyName"]').clear().type('Gusto Italiano Updated');
    
    // Update description
    cy.get('textarea[name="description"]').clear().type('Updated description for our premium Italian food e-commerce platform offering authentic products.');
    
    // Update email
    cy.get('input[name="email"]').clear().type('updated@gusto-italiano.com');
    
    // Update website
    cy.get('input[name="website"]').clear().type('https://www.updated-gusto-italiano.com');
    
    // Update opening hours
    cy.get('input[name="openingTime"]').clear().type('Monday-Saturday: 8:00-19:00, Sunday: 10:00-16:00');
    
    // Update address
    cy.get('textarea[name="address"]').clear().type('Via Roma 456, 00186 Roma, Italy');
    
    // Update sector
    cy.get('input[name="sector"]').clear().type('Premium Italian Food E-commerce');
    
    // Submit the form
    cy.get('button[type="submit"]').should('not.be.disabled').click();
    
    // Check for success message
    cy.get('.bg-green-50').should('be.visible');
    cy.get('.text-green-700').should('contain', 'Profile updated successfully!');
    
    // Verify the form still contains the updated values
    cy.get('input[name="companyName"]').should('have.value', 'Gusto Italiano Updated');
    cy.get('input[name="email"]').should('have.value', 'updated@gusto-italiano.com');
    cy.get('input[name="website"]').should('have.value', 'https://www.updated-gusto-italiano.com');
  });

  it('should validate required fields', () => {
    // Clear required fields
    cy.get('input[name="companyName"]').clear();
    cy.get('textarea[name="description"]').clear();
    cy.get('input[name="phoneNumber"]').clear();
    cy.get('input[name="email"]').clear();
    cy.get('input[name="openingTime"]').clear();
    cy.get('textarea[name="address"]').clear();
    cy.get('input[name="sector"]').clear();
    
    // Try to submit
    cy.get('button[type="submit"]').click();
    
    // Check for validation errors
    cy.get('.text-red-600').should('have.length.at.least', 1);
    cy.get('.text-red-600').should('contain', 'Company name must be at least 2 characters');
  });

  it('should validate email format', () => {
    // Enter invalid email
    cy.get('input[name="email"]').clear().type('invalid-email');
    
    // Try to submit
    cy.get('button[type="submit"]').click();
    
    // Check for email validation error
    cy.get('.text-red-600').should('contain', 'Email must be a valid email address');
  });

  it('should validate URL fields', () => {
    // Enter invalid website URL
    cy.get('input[name="website"]').clear().type('not-a-url');
    
    // Enter invalid logo URL
    cy.get('input[name="logoUrl"]').clear().type('also-not-a-url');
    
    // Try to submit
    cy.get('button[type="submit"]').click();
    
    // Check for URL validation errors
    cy.get('.text-red-600').should('contain', 'Website must be a valid URL');
    cy.get('.text-red-600').should('contain', 'Logo URL must be a valid URL');
  });

  it('should disable submit button when form is not dirty', () => {
    // Initially, the submit button should be disabled (form not dirty)
    cy.get('button[type="submit"]').should('be.disabled');
    
    // Make a change
    cy.get('input[name="companyName"]').clear().type('Gusto Italiano Modified');
    
    // Now submit button should be enabled
    cy.get('button[type="submit"]').should('not.be.disabled');
    
    // Reset the field to original value
    cy.get('input[name="companyName"]').clear().type('Gusto Italiano');
    
    // Submit button should be disabled again
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('should show loading state during form submission', () => {
    // Make a change
    cy.get('input[name="companyName"]').clear().type('Gusto Italiano Loading Test');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Check for loading state (button should show "Saving...")
    cy.get('button[type="submit"]').should('contain', 'Saving...');
    
    // Wait for completion
    cy.get('.bg-green-50', { timeout: 10000 }).should('be.visible');
  });

  it('should navigate back to dashboard from profile', () => {
    // Click on Dashboard in navigation
    cy.get('[data-cy="nav-dashboard"]').click();
    
    // Should be back on dashboard
    cy.url().should('include', '/dashboard');
    cy.get('h1').should('contain', 'Dashboard');
  });

  it('should maintain form state when navigating away and back', () => {
    // Make a change but don't submit
    cy.get('input[name="companyName"]').clear().type('Temporary Change');
    
    // Navigate away
    cy.get('[data-cy="nav-dashboard"]').click();
    cy.url().should('include', '/dashboard');
    
    // Navigate back to profile
    cy.get('[data-cy="nav-profile"]').click();
    cy.url().should('include', '/profile');
    
    // The form should have reloaded with original data (not the temporary change)
    cy.get('input[name="companyName"]').should('have.value', 'Gusto Italiano');
  });
}); 