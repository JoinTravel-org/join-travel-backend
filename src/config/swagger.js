import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JoinTravel Backend API',
      version: '1.0.0',
      description: 'API documentation for JoinTravel backend application',
    },
    servers: [
      {
        url: 'http://localhost:3005',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Place: {
          type: 'object',
          required: ['name', 'address', 'latitude', 'longitude'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the place',
            },
            name: {
              type: 'string',
              description: 'Name of the place from Google Maps',
              example: 'Eiffel Tower',
            },
            address: {
              type: 'string',
              description: 'Formatted address from Google Maps',
              example: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
            },
            latitude: {
              type: 'number',
              format: 'float',
              description: 'Latitude coordinate',
              example: 48.8584,
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: 'number',
              format: 'float',
              description: 'Longitude coordinate',
              example: 2.2945,
              minimum: -180,
              maximum: 180,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        User: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the user',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password (hashed)',
              minLength: 8,
            },
            isEmailConfirmed: {
              type: 'boolean',
              description: 'Whether the user has confirmed their email',
              default: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of validation errors',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // Paths to files containing OpenAPI definitions
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };