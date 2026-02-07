// Example Cypress test for authentication (manually written)
describe('Authentication', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should login with valid credentials', () => {
        cy.get('[data-testid="email-input"]').type('user@shop.com');
        cy.get('[data-testid="password-input"]').type('user123');
        cy.get('[data-testid="login-button"]').click();

        // Verify successful login
        cy.url().should('not.include', '/login');
        cy.get('[data-testid="nav-profile"]').should('be.visible');
        cy.get('[data-testid="nav-logout"]').should('be.visible');
    });

    it('should show error with invalid credentials', () => {
        cy.get('[data-testid="email-input"]').type('invalid@test.com');
        cy.get('[data-testid="password-input"]').type('wrongpass');
        cy.get('[data-testid="login-button"]').click();

        // Verify error message
        cy.get('[data-testid="login-error"]').should('be.visible');
        cy.get('[data-testid="login-error"]').should('contain', 'Invalid credentials');
    });

    it('should register a new user', () => {
        cy.get('[data-testid="show-register"]').click();

        cy.get('[data-testid="name-input"]').type('New User');
        cy.get('[data-testid="register-email-input"]').type(`newuser${Date.now()}@test.com`);
        cy.get('[data-testid="register-password-input"]').type('password123');
        cy.get('[data-testid="register-button"]').click();

        // Verify successful registration
        cy.get('[data-testid="nav-profile"]').should('be.visible');
    });

    it('should logout successfully', () => {
        // Login first
        cy.login('user@shop.com', 'user123');

        // Logout
        cy.get('[data-testid="nav-logout"]').click();

        // Verify logout
        cy.get('[data-testid="nav-login"]').should('be.visible');
        cy.get('[data-testid="nav-profile"]').should('not.be.visible');
    });
});
