// Example Cypress test for shopping cart (manually written)
describe('Shopping Cart', () => {
    beforeEach(() => {
        // Clear cart first via API to ensure clean state
        // Assuming user ID 2 for user@shop.com
        cy.request('DELETE', 'http://localhost:3000/api/cart/2');

        // Intercept API calls
        cy.intercept('GET', '/api/products').as('getProducts');
        cy.intercept('POST', '/api/auth/login').as('login');
        cy.intercept('GET', '/api/cart/**').as('getCart');

        cy.visit('/');
        cy.login('user@shop.com', 'user123');
        cy.wait('@login');
        cy.get('[data-testid="nav-products"]').click();
        cy.wait('@getProducts');
    });

    it('should add product to cart', () => {
        cy.intercept('POST', '/api/cart/**').as('addToCart');

        // Add first product to cart
        cy.get('[data-testid="add-to-cart-1"]').click();
        cy.wait('@addToCart');

        // Verify cart count updated
        cy.get('[data-testid="cart-count"]').should('contain', '1');
    });

    it('should display cart items correctly', () => {
        cy.intercept('POST', '/api/cart/**').as('addToCart');

        // Add products to cart
        cy.get('[data-testid="add-to-cart-1"]').click();
        cy.wait('@addToCart');
        cy.get('[data-testid="add-to-cart-2"]').click();
        cy.wait('@addToCart');

        // Navigate to cart
        cy.get('[data-testid="nav-cart"]').click();
        cy.wait('@getCart');

        // Verify cart items
        cy.get('[data-testid="cart-items"]').should('be.visible');
        cy.get('.cart-item').should('have.length', 2);
    });

    it('should remove item from cart', () => {
        cy.intercept('POST', '/api/cart/**').as('addToCart');
        cy.intercept('DELETE', '/api/cart/**').as('removeFromCart');

        // Add product and navigate to cart
        cy.get('[data-testid="add-to-cart-1"]').click();
        cy.wait('@addToCart');
        cy.get('[data-testid="nav-cart"]').click();
        cy.wait('@getCart');

        // Remove item
        cy.get('[data-testid="remove-from-cart-1"]').click();
        cy.wait('@removeFromCart');

        // Verify cart is empty
        cy.get('[data-testid="cart-items"]').should('contain', 'Your cart is empty');
        cy.get('[data-testid="cart-count"]').should('contain', '0');
    });

    it('should calculate cart total correctly', () => {
        cy.intercept('POST', '/api/cart/**').as('addToCart');

        // Add multiple products
        cy.get('[data-testid="add-to-cart-1"]').click(); // $999.99
        cy.wait('@addToCart');
        cy.get('[data-testid="add-to-cart-2"]').click(); // $699.99
        cy.wait('@addToCart');

        // Navigate to cart
        cy.get('[data-testid="nav-cart"]').click();
        cy.wait('@getCart');

        // Verify total
        cy.get('[data-testid="cart-total"]').should('contain', '1699.98');
    });

    it('should complete checkout process', () => {
        cy.intercept('POST', '/api/cart/**').as('addToCart');
        cy.intercept('POST', '/api/orders').as('placeOrder');

        // Add product to cart
        cy.get('[data-testid="add-to-cart-1"]').click();
        cy.wait('@addToCart');
        cy.get('[data-testid="nav-cart"]').click();
        cy.wait('@getCart');

        // Proceed to checkout
        cy.get('[data-testid="checkout-button"]').click();

        // Fill checkout form
        cy.get('[data-testid="payment-method"]').select('credit-card');

        // Stub the window alert
        cy.window().then((win) => {
            cy.stub(win as any, 'alert').as('alert');
        });

        cy.get('[data-testid="place-order-button"]').click();
        cy.wait('@placeOrder');

        // Verify order placed
        cy.get('@alert').should('have.been.calledWith', 'Order placed successfully!');
    });
});
