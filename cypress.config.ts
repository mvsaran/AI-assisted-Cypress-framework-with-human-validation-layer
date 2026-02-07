import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3000',
        supportFile: 'cypress/support/e2e.ts',
        specPattern: 'cypress/e2e/**/*.cy.ts',
        video: true,
        screenshotOnRunFailure: true,
        viewportWidth: 1280,
        viewportHeight: 720,
        setupNodeEvents(on, config) {
            // implement node event listeners here
            return config;
        },
    },
    env: {
        AI_GENERATED_TESTS_DIR: 'cypress/e2e/ai-generated',
        RISK_CONFIG_PATH: 'config/risk-config.json',
    },
});
