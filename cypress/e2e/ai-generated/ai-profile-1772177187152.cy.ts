// AI-Generated Test — Approved by human validator
// Feature     : Profile & Order History
// Risk Level  : medium
// Quality Score: 88/100
// Approved At : 2026-02-27T07:53:47.824Z
describe('Profile & Order History', () => {
  beforeEach(() => {
    // Using cy.request to perform API-level login for the test user
    cy.request('POST', '/api/login', { email: 'user@shop.com', password: 'user123' })
      .then(() => {
        // Visit the homepage after logging in
        cy.visit('/');
      });
  });

  it('should display profile info and order history correctly', () => {
    // Intercepting the GET request to fetch the order history
    cy.intercept('GET', '/api/orders/*').as('getOrderHistory');

    // Ensure the profile link is visible and click to navigate to profile page
    cy.get('[data-testid="nav-profile"]').should('be.visible').click();

    // Wait for the order history API call to complete
    cy.wait('@getOrderHistory');

    // Verify the profile information section is visible
    cy.get('[data-testid="profile-info"]').should('be.visible');

    // Verify the order history section is visible
    cy.get('[data-testid="order-history"]').should('be.visible');
  });

  it('should handle login with incorrect password', () => {
    // Logging out to test login
    cy.get('[data-testid="nav-logout"]').click();

    // Ensure the login page is visible and perform incorrect login
    cy.get('[data-testid="nav-login"]').should('be.visible').click();
    cy.get('[data-testid="email-input"]').type('user@shop.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    // Verify the error message is displayed
    cy.get('[data-testid="login-error"]')
      .should('be.visible')
      .and('contain.text', 'Invalid email or password');
  });

  it('should handle viewing profile and order history after login', () => {
    // Intercepting the GET request to fetch the order history
    cy.intercept('GET', '/api/orders/*').as('getOrderHistory');

    // Ensure the profile link is visible and click to navigate to profile page
    cy.get('[data-testid="nav-profile"]').should('be.visible').click();

    // Wait for the order history API call to complete
    cy.wait('@getOrderHistory');

    // Verify the profile information section is visible
    cy.get('[data-testid="profile-info"]').should('be.visible');

    // Verify the order history section is visible
    cy.get('[data-testid="order-history"]').should('be.visible');
  });
});
