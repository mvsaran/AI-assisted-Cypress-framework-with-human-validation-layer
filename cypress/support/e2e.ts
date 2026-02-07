// Cypress support file for e2e tests
import './commands';

// Global before hook
before(() => {
    cy.log('Starting test suite');
});

// Global after hook
after(() => {
    cy.log('Test suite completed');
});
