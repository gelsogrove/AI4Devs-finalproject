describe('ShopMe MVP Smoke Test', () => {
  it('loads the homepage', () => {
    cy.visit('/');
    cy.contains('Vite'); // Default Vite text, replace with real app text later
  });
}); 