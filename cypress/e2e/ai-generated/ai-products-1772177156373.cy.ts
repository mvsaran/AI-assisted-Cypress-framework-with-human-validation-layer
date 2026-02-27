// AI-Generated Test — Approved by human validator
// Feature     : Product Catalog
// Risk Level  : medium
// Quality Score: 91/100
// Approved At : 2026-02-27T07:53:44.370Z
describe('Product Catalog', () => {
  beforeEach(() => {
    // Clear the cart for a clean start
    cy.request('DELETE', '/api/cart/user/123/product/456');

    // Intercept the product fetching call to observe the network request
    cy.intercept('GET', '/api/products').as('getProducts');

    // Visit the homepage
    cy.visit('/');

    // Ensure the Products navigation is visible and click it to reveal the product catalog
    cy.get('[data-testid="nav-products"]').should('be.visible').click();

    // Wait for the products to be fetched and displayed
    cy.wait('@getProducts');
  });

  it('should display the product catalog with search and filter options', () => {
    // Validate the product grid is visible
    cy.get('[data-testid="product-grid"]').should('be.visible');

    // Validate the search input is usable
    cy.get('[data-testid="search-input"]').should('be.visible').type('Laptop');

    // Validate the category filter is usable
    cy.get('[data-testid="category-filter"]').should('be.visible').select('Electronics');

    // Check if the product grid reflects the search and filter criteria
    cy.get('[data-testid="product-grid"]').children().should('have.length.greaterThan', 0);
  });

  it('should allow adding a product to the cart', () => {
    // Ensure the page is showing products
    cy.get('[data-testid="product-grid"]').should('be.visible');
    
    // Simulate adding the first product to the cart
    cy.get('[data-testid="product-grid"]').children().first().within(() => {
      cy.get('button').contains('Add to Cart').click();
    });

    // Check if the cart count is updated
    cy.get('[data-testid="cart-count"]').should('have.text', '1');
  });

  it('should display an error for incorrect login details', () => {
    // Go to the login page
    cy.get('[data-testid="nav-login"]').should('be.visible').click();

    // Ensure the login form is visible
    cy.get('[data-testid="login-form"]').should('be.visible');

    // Attempt to login with incorrect credentials
    cy.get('[data-testid="email-input"]').type('incorrect@shop.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    // Validate error message is displayed
    cy.get('[data-testid="login-error"]').should('be.visible').and('contain.text', 'Invalid credentials');
  });
});
