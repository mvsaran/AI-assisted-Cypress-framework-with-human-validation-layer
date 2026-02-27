// AI-Generated Test — Approved by human validator
// Feature     : Checkout & Order Placement
// Risk Level  : critical
// Quality Score: 90/100
// Approved At : 2026-02-27T07:53:34.943Z
describe('Checkout & Order Placement', () => {
  beforeEach(() => {
    // Log in using the custom command defined in Cypress commands
    cy.login('user@shop.com', 'user123');

    // Clear the cart before starting a test to ensure a clean state
    cy.request('POST', '/api/cart/clear');

    // Visit the home page to start the test
    cy.visit('/');
  });

  it('should successfully place an order with credit card payment', () => {
    // Spy on the order placement API call
    cy.intercept('POST', '/api/orders').as('placeOrder');

    // Start the checkout process
    cy.get('[data-testid="checkout-button"]').click();

    // Ensure the checkout form is visible
    cy.get('[data-testid="checkout-form"]').should('be.visible');

    // Select payment method
    cy.get('[data-testid="payment-method"]').select('credit-card');

    // Verify order summary is displayed
    cy.get('[data-testid="order-summary"]').should('be.visible');

    // Place the order
    cy.get('[data-testid="place-order-button"]').click();

    // Wait for the POST request to complete and confirm status
    cy.wait('@placeOrder').its('response.statusCode').should('eq', 201);

    // Verify that the cart is cleared after order placement
    cy.get('[data-testid="cart-count"]').should('have.text', '0');
  });

  it('should show error for unsuccessful order placement due to network issues', () => {
    // Simulate a network failure
    cy.intercept('POST', '/api/orders', {
      forceNetworkError: true,
    }).as('placeOrderFailure');

    // Start the checkout process
    cy.get('[data-testid="checkout-button"]').click();

    // Select payment method
    cy.get('[data-testid="payment-method"]').select('debit-card');

    // Place the order
    cy.get('[data-testid="place-order-button"]').click();

    // Wait for the POST request to complete and confirm error
    cy.wait('@placeOrderFailure').its('error').should('exist');

    // Verify that the cart is NOT cleared on failure
    cy.get('[data-testid="cart-count"]').should('not.have.text', '0');
  });

  it('should not allow checkout with empty cart', () => {
    // Ensure cart is empty
    cy.get('[data-testid="cart-count"]').should('have.text', '0');

    // Check that checkout button is disabled or not present
    cy.get('[data-testid="checkout-button"]').should('not.exist');
  });

  it('should show error when trying to place order without selecting payment method', () => {
    // Spy on the order placement API call
    cy.intercept('POST', '/api/orders').as('placeOrder');

    // Start the checkout process
    cy.get('[data-testid="checkout-button"]').click();

    // Attempt to place order without selecting payment method
    cy.get('[data-testid="place-order-button"]').click();

    // Ensure the order is not placed due to validation error
    cy.wait('@placeOrder').its('response.statusCode').should('not.eq', 201);

    // Ensure error message is displayed
    cy.contains('Please select a payment method').should('be.visible');
  });
});
