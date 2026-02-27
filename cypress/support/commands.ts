/// <reference types="cypress" />

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to login to the demo app
             * @example cy.login('user@example.com', 'password123')
             */
            login(email: string, password: string): Chainable<void>;

            /**
             * Custom command to add item to cart
             * @example cy.addToCart('product-id-123')
             */
            addToCart(productId: string): Chainable<void>;
        }
    }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
    cy.visit('/');
    // Reveal the login section
    cy.get('[data-testid="nav-login"]').click();
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    // Wait for navigation to complete
    cy.get('[data-testid="nav-profile"]').should('be.visible');
});

// Add to cart command
Cypress.Commands.add('addToCart', (productId: string) => {
    cy.get(`[data-testid="add-to-cart-${productId}"]`).click();
    cy.get('[data-testid="cart-count"]').should('be.visible');
});

export { };
