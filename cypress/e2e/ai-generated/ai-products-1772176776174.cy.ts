// AI-Generated Test — Approved by human validator
// Feature     : Product Catalog
// Risk Level  : medium
// Quality Score: 85/100
// Approved At : 2026-02-27T07:53:30.921Z
describe('Product Catalog Feature', () => {
  beforeEach(() => {
    // Clear the cart and login before each test for consistency
    cy.request('DELETE', '/api/cart/user/1')  // Assuming userId 1 as placeholder
    cy.login('user@shop.com', 'user123');
    cy.visit('/');
  });

  it('should render product catalog and allow browsing products', () => {
    // Navigate to the products page
    cy.get('[data-testid="nav-products"]').click();
    
    // Ensure the product grid is visible indicating products are loaded
    cy.get('[data-testid="product-grid"]').should('be.visible');

    // Validate the API call to fetch products
    cy.intercept('GET', '/api/products').as('getProducts');
    cy.wait('@getProducts').its('response.statusCode').should('eq', 200);
  });

  it('should allow searching products by text', () => {
    // Navigate to the products page
    cy.get('[data-testid="nav-products"]').click();

    // Type a search term and validate the product grid updates
    cy.get('[data-testid="search-input"]').type('Laptop');
    cy.get('[data-testid="product-grid"]').should('contain.text', 'Laptop');
  });

  it('should allow filtering products by category', () => {
    // Navigate to the products page
    cy.get('[data-testid="nav-products"]').click();

    // Select a category filter and validate the product grid updates
    cy.get('[data-testid="category-filter"]').select('Electronics');
    cy.get('[data-testid="product-grid"]').should('contain.text', 'Electronics');
  });

  it('should handle login failure with wrong password', () => {
    // Attempt login with incorrect credentials
    cy.login('user@shop.com', 'wrongpassword');

    // Validate the error message is displayed
    cy.get('[data-testid="login-error"]').should('be.visible').and('contain.text', 'Invalid credentials');
  });

  it('should add a product to the cart', () => {
    // Navigate to the products page
    cy.get('[data-testid="nav-products"]').click();

    // Interact with add-to-cart button for a specific product (assuming product ID is 1 for this example)
    cy.get('[data-testid="add-to-cart-1"]').click();

    // Validate the cart count increment
    cy.get('[data-testid="cart-count"]').should('have.text', '1');
  });
});
