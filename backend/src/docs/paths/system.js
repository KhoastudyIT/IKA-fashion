export const systemPaths = {
  '/api/health': {
    get: {
      tags: ['Hệ thống'],
      summary: 'Health check',
      description: 'Không cần token. Dùng cho healthcheck của Docker và load balancer.',
      responses: {
        200: {
          description: 'Server đang sống',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'ok' },
                  timestamp: { type: 'string', format: 'date-time', example: '2026-07-15T08:00:00.000Z' },
                },
              },
            },
          },
        },
      },
    },
  },
};
