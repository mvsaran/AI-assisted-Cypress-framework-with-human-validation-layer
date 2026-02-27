// AI-Generated Test — Approved by human validator
// Feature     : Checkout & Order Placement
// Risk Level  : critical
// Quality Score: 86/100
// Approved At : 2026-02-27T07:53:47.028Z
describe('Checkout & Order Placement Feature', () => {
  beforeEach(() => {
    // Clear cart before each test to ensure independent test cases
    cy.request('POST', 'http://localhost:3000/api/cart/clear');

    // Log in before each test
    cy.login('user@shop.com', 'user123');

    // Intercept the order placement API call
    cy.intercept('POST', '/api/orders').as('placeOrder');
  });

  it('should successfully complete the checkout and order placement', () => {
    // Navigate to the cart page to ensure checkout button is present
    cy.get('[data-testid="nav-cart"]').click();
    cy.get('[data-testid="checkout-button"]').should('be.visible').click();

    // Confirm checkout form is visible
    cy.get('[data-testid="checkout-form"]').should('be.visible');

    // Select a payment method
    cy.get('[data-testid="payment-method"]').select('credit-card');

    // Confirm order summary is visible before placing the order
    cy.get('[data-testid="order-summary"]').should('be.visible');

    // Place the order
    cy.get('[data-testid="place-order-button"]').should('be.visible').click();

    // Wait for the order to be placed and confirm via intercept
    cy.wait('@placeOrder').its('response.statusCode').should('eq', 201);

    // Confirm cart is cleared upon successful order placement
    cy.get('[data-testid="cart-count"]').should('have.text', '0');
  });

  it('should show an error message for an incomplete checkout form', () => {
    // Navigate to the cart page to ensure checkout button is present
    cy.get('[data-testid="nav-cart"]').click();
    cy.get('[data-testid="checkout-button"]').should('be.visible').click();

    // Confirm checkout form is visible
    cy.get('[data-testid="checkout-form"]').should('be.visible');

    // Do not select a payment method to simulate an incomplete form
    // Attempt to place the order
    cy.get('[data-testid="place-order-button"]').should('be.visible').click();

    // Wait for any possible order placement attempt
    cy.wait('@placeOrder').its('response.statusCode').should('not.eq', 201);

    // Confirm that an error message is displayed
    cy.get('[data-testid="checkout-error"]').should('be.visible');
  });
});
