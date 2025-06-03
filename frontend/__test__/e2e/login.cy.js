describe('Login Page', () => {
  beforeEach(() => {
    // Reset any previous login state
    cy.clearLocalStorage();
    // Use cy.visit() with a timeout and failOnStatusCode false to be more resilient
    cy.visit('/', { timeout: 10000, failOnStatusCode: false });
  });

  // Add a simple test that just checks if the page loads
  it('should load the login page', () => {
    cy.log('Login page loaded');
    cy.get('body').should('exist');
  });

  it('should display login form', () => {
    cy.get('form').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });
  
  it('should pre-fill the test credentials', () => {
    cy.get('input[type="email"]').should('have.value', 'test@example.com');
    cy.get('input[type="password"]').should('have.value', 'password123');
  });
  
  it('should allow entering custom credentials', () => {
    cy.get('input[type="email"]').clear().type('custom@example.com');
    cy.get('input[type="password"]').clear().type('custompassword');
    
    cy.get('input[type="email"]').should('have.value', 'custom@example.com');
    cy.get('input[type="password"]').should('have.value', 'custompassword');
  });
  
  it('should display an error for invalid credentials', () => {
    // Intercept the login API call and mock a failed response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { error: 'Invalid email or password' }
    }).as('loginRequest');
    
    cy.get('input[type="email"]').clear().type('wrong@example.com');
    cy.get('input[type="password"]').clear().type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    cy.wait('@loginRequest');
    
    // Check that the toast notification appears
    cy.contains('Login failed').should('be.visible');
  });
  
  it('should successfully log in with valid credentials', () => {
    // Intercept the login API call and mock a successful response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        message: 'Login successful',
        token: 'test-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        }
      }
    }).as('loginRequest');
    
    cy.get('button[type="submit"]').click();
    
    cy.wait('@loginRequest').then(interception => {
      // Verify the payload
      expect(interception.request.body).to.deep.equal({
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Should store auth data in localStorage
    cy.window().then(window => {
      expect(window.localStorage.getItem('token')).to.equal('test-token');
      expect(window.localStorage.getItem('user')).to.not.be.null;
    });
  });
}); 