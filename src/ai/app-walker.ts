import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

export interface PageInfo {
    id: string;
    name: string;
    description: string;
    selectors: string[];
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    apiEndpoints: string[];
}

export interface ApiRoute {
    method: string;
    path: string;
}

export interface AppWalkResult {
    baseUrl: string;
    pages: PageInfo[];
    allSelectors: string[];
    apiRoutes: ApiRoute[];
    htmlSnapshot: string;
    credentials: {
        user: { email: string; password: string };
        admin: { email: string; password: string };
    };
}

export class AppWalker {
    private baseUrl: string;
    private staticHtmlPath: string;
    private serverJsPath: string;

    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.staticHtmlPath = path.resolve('demo-app', 'public', 'index.html');
        this.serverJsPath = path.resolve('demo-app', 'server.js');
    }

    /**
     * Check if the server is running by hitting the health endpoint
     */
    async isServerRunning(): Promise<boolean> {
        return new Promise((resolve) => {
            const req = http.get(`${this.baseUrl}/api/health`, { timeout: 3000 }, (res) => {
                resolve(res.statusCode === 200);
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    /**
     * Fetch raw HTML from the live server
     */
    private fetchHtml(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const req = http.get(url, { timeout: 5000 }, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Timeout fetching ${url}`));
            });
        });
    }

    /**
     * Extract all data-testid values from HTML content
     */
    private extractTestIds(html: string): string[] {
        const regex = /data-testid="([^"]+)"/g;
        const ids: string[] = [];
        let match;
        while ((match = regex.exec(html)) !== null) {
            if (!ids.includes(match[1])) {
                ids.push(match[1]);
            }
        }
        return ids;
    }

    /**
     * Extract API routes from server.js source code
     */
    private extractApiRoutes(): ApiRoute[] {
        const routes: ApiRoute[] = [];
        try {
            const source = fs.readFileSync(this.serverJsPath, 'utf-8');
            const methodRegex = /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/gi;
            let match;
            while ((match = methodRegex.exec(source)) !== null) {
                routes.push({
                    method: match[1].toUpperCase(),
                    path: match[2],
                });
            }
        } catch (err) {
            console.warn('⚠️  Could not read server.js to extract API routes');
        }
        return routes;
    }

    /**
     * Build the structured list of app pages with their selectors and risk levels
     */
    private buildPageMap(allSelectors: string[], apiRoutes: ApiRoute[]): PageInfo[] {
        const pages: PageInfo[] = [
            {
                id: 'login',
                name: 'Authentication - Login',
                description: 'User login with email and password. Validates credentials via POST /api/auth/login, shows error on failure, redirects to products on success.',
                riskLevel: 'critical',
                selectors: allSelectors.filter((s) =>
                    ['email-input', 'password-input', 'login-button', 'login-error', 'login-form', 'show-register', 'nav-login'].includes(s)
                ),
                apiEndpoints: apiRoutes
                    .filter((r) => r.path.includes('auth'))
                    .map((r) => `${r.method} ${r.path}`),
            },
            {
                id: 'register',
                name: 'Authentication - Registration',
                description: 'New user registration. Submits name, email, password to POST /api/auth/register. Validates duplicate email rejection, logs user in on success.',
                riskLevel: 'high',
                selectors: allSelectors.filter((s) =>
                    ['name-input', 'register-email-input', 'register-password-input', 'register-button', 'register-form', 'register-error', 'show-login'].includes(s)
                ),
                apiEndpoints: apiRoutes
                    .filter((r) => r.path.includes('auth'))
                    .map((r) => `${r.method} ${r.path}`),
            },
            {
                id: 'products',
                name: 'Product Catalog',
                description: 'Browse products fetched from GET /api/products. Supports search by text (search-input) and filter by category (category-filter). Products are rendered into product-grid with add-to-cart-{id} buttons.',
                riskLevel: 'medium',
                selectors: allSelectors.filter((s) =>
                    s.startsWith('search') || s.startsWith('category') || s.startsWith('product') || s.startsWith('add-to-cart') || s === 'nav-products'
                ),
                apiEndpoints: apiRoutes
                    .filter((r) => r.path.includes('product'))
                    .map((r) => `${r.method} ${r.path}`),
            },
            {
                id: 'cart',
                name: 'Shopping Cart',
                description: 'Shopping cart management. Items fetched from GET /api/cart/:userId. Add via POST /api/cart/:userId, remove via DELETE /api/cart/:userId/:productId. Cart count shown in nav badge.',
                riskLevel: 'high',
                selectors: allSelectors.filter((s) =>
                    s.startsWith('cart') || s.startsWith('remove-from-cart') || s === 'nav-cart'
                ),
                apiEndpoints: apiRoutes
                    .filter((r) => r.path.includes('cart'))
                    .map((r) => `${r.method} ${r.path}`),
            },
            {
                id: 'checkout',
                name: 'Checkout & Order Placement',
                description: 'Checkout flow. User selects payment method (credit-card, debit-card, paypal) and places order via POST /api/orders. Order summary shown before placement. Cart cleared on success.',
                riskLevel: 'critical',
                selectors: allSelectors.filter((s) =>
                    ['checkout-button', 'payment-method', 'place-order-button', 'checkout-form', 'order-summary'].includes(s)
                ),
                apiEndpoints: apiRoutes
                    .filter((r) => r.path.includes('order'))
                    .map((r) => `${r.method} ${r.path}`),
            },
            {
                id: 'profile',
                name: 'Profile & Order History',
                description: 'User profile page showing account info (profile-info) and order history (order-history) fetched from GET /api/orders/:userId.',
                riskLevel: 'medium',
                selectors: allSelectors.filter((s) =>
                    ['profile-info', 'order-history', 'nav-profile', 'nav-logout'].includes(s)
                ),
                apiEndpoints: apiRoutes
                    .filter((r) => r.path.includes('orders') || r.path.includes('profile'))
                    .map((r) => `${r.method} ${r.path}`),
            },
        ];

        // Only return pages that have at least some selectors
        return pages.filter((p) => p.selectors.length > 0);
    }

    /**
     * Walk the application - fetch real HTML and extract selectors, routes, and page structure
     */
    async walk(): Promise<AppWalkResult> {
        let htmlSnapshot = '';

        // Try live server first, fall back to static file
        const serverRunning = await this.isServerRunning();
        if (serverRunning) {
            try {
                htmlSnapshot = await this.fetchHtml(`${this.baseUrl}/`);
                console.log(`  ✅ Fetched live HTML from ${this.baseUrl}`);
            } catch {
                console.warn('  ⚠️  Could not fetch live HTML, falling back to static file');
            }
        }

        if (!htmlSnapshot && fs.existsSync(this.staticHtmlPath)) {
            htmlSnapshot = fs.readFileSync(this.staticHtmlPath, 'utf-8');
            console.log(`  ✅ Loaded HTML from static file: ${this.staticHtmlPath}`);
        }

        if (!htmlSnapshot) {
            throw new Error(
                '❌ Could not load application HTML. Make sure the demo server is running:\n   npm run demo:start'
            );
        }

        const allSelectors = this.extractTestIds(htmlSnapshot);
        const apiRoutes = this.extractApiRoutes();
        const pages = this.buildPageMap(allSelectors, apiRoutes);

        return {
            baseUrl: this.baseUrl,
            pages,
            allSelectors,
            apiRoutes,
            htmlSnapshot,
            credentials: {
                user: { email: 'user@shop.com', password: 'user123' },
                admin: { email: 'admin@shop.com', password: 'admin123' },
            },
        };
    }

    /**
     * Format a clean summary of what was discovered
     */
    static formatWalkSummary(result: AppWalkResult): string {
        const lines: string[] = [
            '',
            '═══════════════════════════════════════════════════════════',
            ' 🔍  APP WALKTHROUGH COMPLETE',
            '═══════════════════════════════════════════════════════════',
            `  Base URL    : ${result.baseUrl}`,
            `  Pages found : ${result.pages.length}`,
            `  Selectors   : ${result.allSelectors.length} data-testid attributes`,
            `  API Routes  : ${result.apiRoutes.length}`,
            '',
            ' 📋  DISCOVERED PAGES:',
        ];

        result.pages.forEach((page) => {
            const riskIcon = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[page.riskLevel];
            lines.push(`  ${riskIcon}  ${page.name} (${page.selectors.length} selectors)`);
            lines.push(`       ${page.selectors.map((s) => `[data-testid="${s}"]`).join(', ')}`);
        });

        lines.push('');
        lines.push(' 🌐  API ROUTES:');
        result.apiRoutes.forEach((r) => {
            lines.push(`     ${r.method.padEnd(7)} ${r.path}`);
        });

        lines.push('');
        lines.push('═══════════════════════════════════════════════════════════');

        return lines.join('\n');
    }
}
