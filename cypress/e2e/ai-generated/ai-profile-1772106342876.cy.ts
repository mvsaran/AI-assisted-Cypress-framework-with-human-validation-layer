// AI-Generated Test — Approved by human validator
// Feature     : Profile & Order History
// Risk Level  : medium
// Quality Score: 90/100
// Approved At : 2026-02-26T12:08:07.071Z
describe('Profile & Order History Feature', () => {
  beforeEach(() => {
    // Set up initial state by logging in the user via API and visiting the profile page
    cy.request('POST', '/api/login', { email: 'user@shop.com', password: 'user123' }).then(() => {
      cy.visit('/');
      cy.get('[data-testid="nav-profile"]').click();
    });
  });

  it('should display user profile info and order history on profile page', () => {
    // Intercept the order history API call to verify it's made and wait for it
    cy.intercept('GET', '/api/orders/*').as('getOrderHistory');
    
    // Assert that profile info and order history are visible
    cy.get('[data-testid="profile-info"]').should('be.visible');
    cy.get('[data-testid="order-history"]').should('be.visible');
    
    // Wait for the order history API call to complete
    cy.wait('@getOrderHistory').its('response.statusCode').should('eq', 200);
    
    // Further assertions can be made here to verify content of the order history
  });

  it('should show error when login with incorrect password', () => {
    // Use cy.login with wrong credentials to simulate a failed login attempt
    cy.login('user@shop.com', 'wrongpassword');

    // Assert that an error message is shown
    cy.get('[data-testid="login-error"]').should('be.visible').and('contain', 'Invalid credentials');
  });

  it('should handle logout and redirect to the login page', () => {
    // Click on the logout link to log the user out
    cy.get('[data-testid="nav-logout"]').click();

    // Assert that the user is redirected to the login page
    cy.get('[data-testid="login-form"]').should('be.visible');
  });
});
