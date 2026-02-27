// AI-Generated Test — Approved by human validator
// Feature     : Authentication - Login
// Risk Level  : critical
// Quality Score: 88/100
// Approved At : 2026-02-27T07:53:48.532Z
describe('Authentication - Login', () => {
  beforeEach(() => {
    // Intercepting login POST request to mock successful and failed responses
    cy.intercept('POST', '/api/auth/login', (req) => {
      const { email, password } = req.body;

      if (email === 'user@shop.com' && password === 'user123') {
        req.reply({ statusCode: 200, body: { success: true } });
      } else {
        req.reply({ statusCode: 401, body: { error: 'Invalid credentials' } });
      }
    }).as('loginRequest');

    // Resetting app state by visiting the home page
    cy.visit('/');
  });

  it('should successfully login with valid credentials and redirect to products page', () => {
    // Ensure the login link is visible and click to reveal the login form
    cy.get('[data-testid="nav-login"]').should('be.visible').click();

    // Ensure login form is visible
    cy.get('[data-testid="login-form"]').should('be.visible');

    // Enter valid credentials
    cy.get('[data-testid="email-input"]').type('user@shop.com');
    cy.get('[data-testid="password-input"]').type('user123');

    // Click login button
    cy.get('[data-testid="login-button"]').click();

    // Wait for login request to complete
    cy.wait('@loginRequest');

    // Verify the user is redirected to products page
    cy.url().should('include', '/products');

    // Verify profile link is now visible, indicating a successful login
    cy.get('[data-testid="nav-profile"]').should('be.visible');
  });

  it('should display an error message with invalid credentials', () => {
    // Ensure the login link is visible and click to reveal the login form
    cy.get('[data-testid="nav-login"]').should('be.visible').click();

    // Ensure login form is visible
    cy.get('[data-testid="login-form"]').should('be.visible');

    // Enter invalid credentials
    cy.get('[data-testid="email-input"]').type('user@shop.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');

    // Click login button
    cy.get('[data-testid="login-button"]').click();

    // Wait for login request to complete
    cy.wait('@loginRequest');

    // Verify an error message is displayed
    cy.get('[data-testid="login-error"]').should('be.visible').and('contain', 'Invalid credentials');
  });

  it('should not allow login with empty credentials', () => {
    // Ensure the login link is visible and click to reveal the login form
    cy.get('[data-testid="nav-login"]').should('be.visible').click();

    // Ensure login form is visible
    cy.get('[data-testid="login-form"]').should('be.visible');

    // Leave email and password fields empty and try to login
    cy.get('[data-testid="login-button"]').click();

    // Verify login form is still visible, indicating a failed login attempt
    cy.get('[data-testid="login-form"]').should('be.visible');

    // Verify an error message is displayed
    cy.get('[data-testid="login-error"]').should('be.visible');
  });
});
