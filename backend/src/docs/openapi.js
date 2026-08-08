// Lớp tài liệu OpenAPI 3.0 — không chứa business logic.

import { apiReference } from '@scalar/express-api-reference';
import { meta } from './info.js';
import { components } from './components.js';
import { paths } from './paths/index.js';

export const spec = {
  openapi: '3.0.3',
  ...meta,
  components,
  paths,
};

export function setupDocs(app) {
  // Spec thô cho Postman / Bruno / Insomnia / sinh SDK.
  app.get('/openapi.json', (_req, res) => res.json(spec));

  app.use('/api-docs', apiReference({
    url: '/openapi.json',
    pageTitle: 'IKA Fashion — API Docs',
    layout: 'modern',
    defaultOpenAllTags: false,
    authentication: { preferredSecurityScheme: 'bearerAuth' },
  }));
}
