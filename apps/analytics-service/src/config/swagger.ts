import swaggerJsdoc from 'swagger-jsdoc';

import { env } from './env';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Real-Time Analytics Service API',
      version: '1.0.0',
      description:
        'API documentation for the Analytics Service, handling user auth, project management, and event tracking.',
    },

    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],

    components: {
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: 'A description of the error.',
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  apis: ['./src/routes/*.ts', './src/schemas/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
