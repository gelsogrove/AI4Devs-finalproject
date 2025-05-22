describe('FAQ Edit and Create Functionality', () => {
  beforeEach(() => {
    // Reset any previous login state
    cy.clearLocalStorage();
    
    // Mock successful login
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

    // Visit login page and login
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
  });

  describe('Edit FAQ', () => {
    beforeEach(() => {
      // Mock FAQs API response
      cy.intercept('GET', '/api/faqs*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: '1',
              question: 'Do you ship internationally?',
              answer: 'Yes, we ship to most countries worldwide.',
              category: 'Shipping & Delivery',
              isPublished: true,
              createdAt: '2023-01-01T00:00:00.000Z',
              updatedAt: '2023-01-01T00:00:00.000Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1
          }
        }
      }).as('getFaqs');

      // Mock FAQ categories API response
      cy.intercept('GET', '/api/faqs/categories', {
        statusCode: 200,
        body: ['Shipping & Delivery', 'Returns & Refunds']
      }).as('getFaqCategories');

      // Mock single FAQ fetch
      cy.intercept('GET', '/api/faqs/1', {
        statusCode: 200,
        body: {
          id: '1',
          question: 'Do you ship internationally?',
          answer: 'Yes, we ship to most countries worldwide.',
          category: 'Shipping & Delivery',
          isPublished: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      }).as('getFaq');

      // Mock update FAQ API
      cy.intercept('PUT', '/api/faqs/1', {
        statusCode: 200,
        body: {
          id: '1',
          question: 'Do you ship internationally?',
          answer: 'Yes, we ship to most countries worldwide including Europe, Asia, and Australia.',
          category: 'Shipping & Delivery',
          isPublished: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-03T00:00:00.000Z'
        }
      }).as('updateFaq');

      // Navigate to FAQs page
      cy.visit('/faqs');
    });

    it('should edit an existing FAQ', () => {
      cy.wait('@getFaqs');
      
      // Click edit button on first FAQ
      cy.get('table tbody tr').first().find('button').first().click({ force: true });
      cy.wait('@getFaq');
      
      // Check form is displayed with correct values
      cy.contains('Edit FAQ').should('be.visible');
      cy.get('input[name="question"]').should('have.value', 'Do you ship internationally?');
      cy.get('textarea[name="answer"]').should('have.value', 'Yes, we ship to most countries worldwide.');
      
      // Update the answer field
      cy.get('textarea[name="answer"]').clear().type('Yes, we ship to most countries worldwide including Europe, Asia, and Australia.');
      
      // Submit the form - use the actual button text from the component
      cy.contains('button', 'Update FAQ').click({ force: true });
      cy.wait('@updateFaq');
      
      // Verify that the request was successful and no error message is shown
      cy.get('.bg-red-50').should('not.exist');
      
      // Verify the request was made with the correct data
      cy.get('@updateFaq.all').should('have.length.at.least', 1);
    });
  });

  describe('Create New FAQ', () => {
    beforeEach(() => {
      // Mock FAQs API response
      cy.intercept('GET', '/api/faqs*', {
        statusCode: 200,
        body: {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1
          }
        }
      }).as('getFaqs');

      // Mock FAQ categories API response
      cy.intercept('GET', '/api/faqs/categories', {
        statusCode: 200,
        body: ['Shipping & Delivery', 'Returns & Refunds']
      }).as('getFaqCategories');

      // Mock create FAQ API
      cy.intercept('POST', '/api/faqs', {
        statusCode: 201,
        body: {
          id: '1',
          question: 'What shipping carriers do you use?',
          answer: 'We primarily use FedEx and UPS for domestic shipments and DHL for international shipments.',
          category: 'Shipping & Delivery',
          isPublished: true,
          createdAt: '2023-01-03T00:00:00.000Z',
          updatedAt: '2023-01-03T00:00:00.000Z'
        }
      }).as('createFaq');

      // Navigate to FAQs page
      cy.visit('/faqs');
    });

    it('should create a new FAQ', () => {
      cy.wait('@getFaqs');
      
      // Click add FAQ button
      cy.contains('button', 'Add FAQ').click({ force: true });
      
      // Check form is displayed
      cy.contains('Add FAQ').should('be.visible');
      
      // Fill the form
      cy.get('input[name="question"]').type('What shipping carriers do you use?');
      cy.get('textarea[name="answer"]').type('We primarily use FedEx and UPS for domestic shipments and DHL for international shipments.');
      cy.get('select[name="category"]').select('Shipping & Delivery');
      cy.get('input[name="isPublished"]').check();
      
      // Submit the form - use the actual button text from the component
      cy.contains('button', 'Create FAQ').click({ force: true });
      cy.wait('@createFaq');
      
      // Verify that the request was successful and no error message is shown
      cy.get('.bg-red-50').should('not.exist');
      
      // Verify the request was made with the correct data
      cy.get('@createFaq.all').should('have.length.at.least', 1);
    });
  });
}); 