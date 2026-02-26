// AI-Generated Test — Approved by human validator
// Feature     : Authentication - Login
// Risk Level  : critical
// Quality Score: 92/100
// Approved At : 2026-02-26T12:08:09.754Z
describe('Authentication - Login Feature', () => {
  beforeEach(() => {
    // Visit the homepage before each test to ensure a clean state
    cy.visit('/');
    // Click on the login link to navigate to the login page
    cy.get('[data-testid="nav-login"]').click();
  });

  it('should login successfully with valid credentials and redirect to products', () => {
    // Intercept the login POST request to validate the API call
    cy.intercept('POST', '/api/auth/login').as('loginRequest');

    // Fill in the login form with valid user credentials
    cy.get('[data-testid="email-input"]').type('user@shop.com');
    cy.get('[data-testid="password-input"]').type('user123');
    // Submit the login form
    cy.get('[data-testid="login-button"]').click();

    // Wait for the login request to complete and assert it was called
    cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

    // Check that the user is redirected to the products page
    cy.url().should('contain', '/products');
  });

  it('should show an error message with invalid credentials', () => {
    // Intercept the login POST request to validate the API call
    cy.intercept('POST', '/api/auth/login').as('loginRequest');

    // Fill in the login form with invalid credentials
    cy.get('[data-testid="email-input"]').type('user@shop.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    // Submit the login form
    cy.get('[data-testid="login-button"]').click();

    // Wait for the login request to complete and assert it was called
    cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);

    // Check that an error message is displayed
    cy.get('[data-testid="login-error"]').should('be.visible').and('contain', 'Invalid credentials');
  });

  it('should show an error message for empty form submission', () => {
    // Attempt to submit the form without filling it out
    cy.get('[data-testid="login-button"]').click();

    // Since the form fields are required, we expect errors on the form
    cy.get('[data-testid="email-input"]:invalid').should('exist');
    cy.get('[data-testid="password-input"]:invalid').should('exist');
  });
});
