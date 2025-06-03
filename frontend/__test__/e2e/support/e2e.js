// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands for authentication
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3001/api/auth/login',
    body: {
      email,
      password
    }
  }).then((response) => {
    window.localStorage.setItem('authToken', response.body.token);
  });
});

Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('authToken');
});

// Add command to wait for API to be ready
Cypress.Commands.add('waitForAPI', () => {
  cy.request({
    method: 'GET',
    url: 'http://localhost:3001/api/health',
    retryOnStatusCodeFailure: true,
    timeout: 30000
  });
}); 