// AI-Generated Test — Approved by human validator
// Feature     : Authentication - Registration
// Risk Level  : high
// Quality Score: 88/100
// Approved At : 2026-02-27T07:53:42.660Z
describe('Authentication - Registration', () => {
  beforeEach(() => {
    // Clear database or necessary state setup using API requests
    cy.request('POST', '/api/testing/reset');

    // Intercept the registration API request
    cy.intercept('POST', '/api/auth/register').as('register');

    // Visit the base URL and ensure the registration page is visible
    cy.visit('/');
    cy.get('[data-testid="nav-login"]').click();
    cy.get('[data-testid="show-register"]').click();
    cy.get('[data-testid="register-form"]').should('be.visible');
  });

  it('should register a new user successfully', () => {
    // Fill out the registration form with valid data
    cy.get('[data-testid="name-input"]').type('New User');
    cy.get('[data-testid="register-email-input"]').type('newuser@example.com');
    cy.get('[data-testid="register-password-input"]').type('password123');

    // Submit the registration form
    cy.get('[data-testid="register-button"]').click();

    // Wait for the registration API response
    cy.wait('@register').its('response.statusCode').should('eq', 201);

    // Verify the user is logged in by checking the visibility of profile link
    cy.get('[data-testid="nav-profile"]').should('be.visible');
    cy.get('[data-testid="nav-login"]').should('not.be.visible');
  });

  it('should show error when trying to register with an existing email', () => {
    // Fill out the registration form with an existing email
    cy.get('[data-testid="name-input"]').type('Existing User');
    cy.get('[data-testid="register-email-input"]').type('user@shop.com');
    cy.get('[data-testid="register-password-input"]').type('password123');

    // Submit the registration form
    cy.get('[data-testid="register-button"]').click();

    // Wait for the registration API response
    cy.wait('@register').its('response.statusCode').should('eq', 409);

    // Verify the error message is displayed
    cy.get('[data-testid="register-error"]').should('be.visible')
      .and('contain', 'Email already exists');
  });

  it('should show error when submitting an empty form', () => {
    // Attempt to submit the registration form without filling it out
    cy.get('[data-testid="register-button"]').click();

    // Since we don't expect an API call, we directly check for form validation errors
    cy.get('[data-testid="name-input"]:invalid').should('exist');
    cy.get('[data-testid="register-email-input"]:invalid').should('exist');
    cy.get('[data-testid="register-password-input"]:invalid').should('exist');
  });
});
