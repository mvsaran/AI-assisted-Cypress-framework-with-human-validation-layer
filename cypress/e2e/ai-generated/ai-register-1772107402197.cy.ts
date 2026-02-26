// AI-Generated Test — Approved by human validator
// Feature     : Authentication - Registration
// Risk Level  : high
// Quality Score: 92/100
// Approved At : 2026-02-26T12:08:11.668Z
describe('Authentication - Registration', () => {
  beforeEach(() => {
    // Navigate to the base URL and open the registration page
    cy.visit('/');
    cy.get('[data-testid="nav-login"]').click();
    cy.get('[data-testid="show-register"]').click();
    
    // Clear any existing data that might interfere with tests
    // This step ensures we're starting with a clean state
    cy.request('POST', '/api/auth/logout');
  });

  it('should register a new user successfully', () => {
    // Intercept the registration API call to verify the request
    cy.intercept('POST', '/api/auth/register').as('registerRequest');

    // Fill the registration form with valid data
    cy.get('[data-testid="name-input"]').type('New User');
    cy.get('[data-testid="register-email-input"]').type('newuser@shop.com');
    cy.get('[data-testid="register-password-input"]').type('password123');
    cy.get('[data-testid="register-button"]').click();

    // Wait for the API call and check if it was successful
    cy.wait('@registerRequest').its('response.statusCode').should('eq', 201);

    // Verify the user is logged in by checking the presence of the profile link
    cy.get('[data-testid="nav-profile"]').should('be.visible');
  });

  it('should not allow registration with a duplicate email', () => {
    // Intercept the registration API call to verify the request
    cy.intercept('POST', '/api/auth/register').as('registerRequest');

    // Fill the registration form with a duplicate email address
    cy.get('[data-testid="name-input"]').type('Existing User');
    cy.get('[data-testid="register-email-input"]').type('user@shop.com');
    cy.get('[data-testid="register-password-input"]').type('password123');
    cy.get('[data-testid="register-button"]').click();

    // Wait for the API call and check for a conflict error code
    cy.wait('@registerRequest').its('response.statusCode').should('eq', 409);

    // Verify the error message indicating a duplicate email
    cy.get('[data-testid="register-error"]').should('contain', 'Email already in use');
  });

  it('should show an error message on empty form submission', () => {
    // Intercept the registration API call to verify the request
    cy.intercept('POST', '/api/auth/register').as('registerRequest');

    // Attempt to submit the form without filling in any fields
    cy.get('[data-testid="register-button"]').click();

    // Verify that the API request was not sent due to form validation
    cy.get('@registerRequest').should('not.exist');

    // Verify that the required fields show validation errors
    cy.get('[data-testid="name-input"]:invalid').should('exist');
    cy.get('[data-testid="register-email-input"]:invalid').should('exist');
    cy.get('[data-testid="register-password-input"]:invalid').should('exist');
  });
});
