const swaggerJSDoc = require('swagger-jsdoc');
const config = require('./env');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Orion API Documentation',
    version: '1.0.0',
    description:
      'Comprehensive REST API documentation for the Orion (Farm Picked) grocery e-commerce platform.\n\n' +
      '### Authentication\n' +
      'Most customer and admin endpoints require a Bearer token.\n' +
      '1. Call `POST /api/v1/auth/login` (or `/api/v1/auth/admin/login`)\n' +
      '2. Copy the `token` from the response\n' +
      '3. Click the **Authorize** button at the top right and paste the token\n',
    contact: {
      name: 'Orion Support',
      email: 'support@yourstore.com',
    },
  },
  servers: [
    {
      url: `/api/v1`,
      description: 'API v1 Base URL',
    },
    {
      url: `http://localhost:${config.PORT || 5001}/api/v1`,
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Health', description: 'API health and status check' },
    { name: 'Auth', description: 'User registration, OTP verification, login and credentials' },
    { name: 'Users', description: 'User profile management' },
    { name: 'Products', description: 'Product catalogue, filters and admin inventory' },
    { name: 'Categories', description: 'Product categories' },
    { name: 'Cart', description: 'Customer shopping cart' },
    { name: 'Addresses', description: 'Customer delivery address book' },
    { name: 'Orders', description: 'Checkout, delivery slots and order lifecycle' },
    { name: 'Payments', description: 'Payment records and verification' },
    { name: 'Feedback', description: 'Customer reviews and ratings' },
    { name: 'Contact', description: 'Customer support messages' },
    { name: 'Admin', description: 'Administrative dashboard, order, customer and system management' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token (without the "Bearer " prefix).',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description' },
          errors: {
            type: 'array',
            items: { type: 'object' },
            example: [{ field: 'email', message: 'Email is invalid' }],
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66abc1234def567890123456' },
          name: { type: 'string', example: 'Aarav Sharma' },
          mobile: { type: 'string', example: '9876543210' },
          email: { type: 'string', format: 'email', example: 'aarav@example.com' },
          role: { type: 'string', enum: ['customer', 'admin'], example: 'customer' },
          status: { type: 'string', enum: ['active', 'blocked'], example: 'active' },
          isEmailVerified: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66abc1234def567890123457' },
          name: { type: 'string', example: 'Fresh Organic Tomatoes' },
          category: { type: 'string', example: 'Fresh Vegetables' },
          categoryId: { type: 'string', example: '66abc1234def567890123458' },
          price: { type: 'number', example: 45 },
          unit: { type: 'string', example: 'kg' },
          emoji: { type: 'string', example: '🍅' },
          imageUrl: { type: 'string', example: '/uploads/tomato.jpg' },
          description: { type: 'string', example: 'Farm fresh red tomatoes harvested daily.' },
          stock: { type: 'integer', example: 50 },
          dealFlags: {
            type: 'array',
            items: { type: 'string', enum: ['deal', 'dealOfWeek', 'bigPack', 'combo', 'rs30Corner'] },
            example: ['dealOfWeek'],
          },
          isActive: { type: 'boolean', example: true },
          dealOfWeek: { type: 'boolean', example: true },
          bigPack: { type: 'boolean', example: false },
          combo: { type: 'boolean', example: false },
          under30: { type: 'boolean', example: false },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66abc1234def567890123458' },
          name: { type: 'string', example: 'Fresh Vegetables' },
          slug: { type: 'string', example: 'fresh-vegetables' },
          description: { type: 'string', example: 'Crisp, seasonal local vegetables.' },
          imageUrl: { type: 'string', example: '' },
          isActive: { type: 'boolean', example: true },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          product: { $ref: '#/components/schemas/Product' },
          quantity: { type: 'integer', example: 2 },
        },
      },
      Cart: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/CartItem' },
          },
          subtotal: { type: 'number', example: 90 },
          itemCount: { type: 'integer', example: 2 },
        },
      },
      Address: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66abc1234def567890123459' },
          fullName: { type: 'string', example: 'Aarav Sharma' },
          mobile: { type: 'string', example: '9876543210' },
          line: { type: 'string', example: 'Flat 402, Green Park Apartments' },
          area: { type: 'string', example: 'Civil Lines' },
          city: { type: 'string', example: 'Meerut' },
          pincode: { type: 'string', example: '250001' },
          label: { type: 'string', enum: ['home', 'work', 'other'], example: 'home' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66abc1234def567890123460' },
          orderNumber: { type: 'string', example: 'FP1001' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product: { type: 'string' },
                name: { type: 'string', example: 'Fresh Organic Tomatoes' },
                price: { type: 'number', example: 45 },
                unit: { type: 'string', example: 'kg' },
                quantity: { type: 'integer', example: 2 },
              },
            },
          },
          subtotal: { type: 'number', example: 90 },
          deliveryCharge: { type: 'number', example: 30 },
          total: { type: 'number', example: 120 },
          address: { $ref: '#/components/schemas/Address' },
          deliveryDate: { type: 'string', example: '2026-10-27' },
          slotWindow: { type: 'string', example: '5-8 PM' },
          paymentMethod: { type: 'string', enum: ['cod', 'card', 'upi'], example: 'cod' },
          paymentStatus: {
            type: 'string',
            enum: ['pending-collection', 'pending', 'paid', 'failed', 'refunded'],
            example: 'pending-collection',
          },
          status: {
            type: 'string',
            enum: ['Placed', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'],
            example: 'Placed',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66abc1234def567890123461' },
          order: { type: 'string', example: '66abc1234def567890123460' },
          method: { type: 'string', enum: ['cod', 'card', 'upi'], example: 'upi' },
          gateway: { type: 'string', example: 'mock' },
          amount: { type: 'number', example: 120 },
          status: {
            type: 'string',
            enum: ['created', 'paid', 'failed', 'pending-collection', 'refunded'],
            example: 'paid',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Feedback: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66abc1234def567890123462' },
          name: { type: 'string', example: 'Pooja Verma' },
          phone: { type: 'string', example: '9123456789' },
          comment: { type: 'string', example: 'Great quality vegetables and on-time delivery!' },
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          product: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ContactRequest: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66abc1234def567890123463' },
          name: { type: 'string', example: 'Rahul Kumar' },
          email: { type: 'string', format: 'email', example: 'rahul@example.com' },
          mobile: { type: 'string', example: '9988776655' },
          message: { type: 'string', example: 'Interested in bulk orders for my restaurant.' },
          status: { type: 'string', enum: ['open', 'resolved'], example: 'open' },
          resolvedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'API health check',
        description: 'Verify that the Orion API backend is running and healthy.',
        responses: {
          200: {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Orion API is running' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new customer account',
        description: 'Creates a customer account in unverified status and dispatches a 6-digit email OTP.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'mobile', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Aarav Sharma' },
                  mobile: { type: 'string', example: '9876543210' },
                  email: { type: 'string', format: 'email', example: 'aarav@example.com' },
                  password: { type: 'string', minLength: 6, example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registration successful, OTP sent',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
          400: { description: 'Validation error / email or mobile already taken', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify customer email with OTP',
        description: 'Verifies the email address using the 6-digit OTP and returns an authentication token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otp'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'aarav@example.com' },
                  otp: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Email verified successfully with token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid or expired OTP', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/resend-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Resend registration email OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'aarav@example.com' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'New OTP dispatched', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          400: { description: 'Account already verified or rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset OTP',
        description: 'Sends a 6-digit random password reset code to the registered email address.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'aarav@example.com' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Reset code sent to email', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          404: { description: 'Account not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with OTP',
        description: 'Verifies the 6-digit reset code and sets a new password. Returns a new JWT token upon success.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otp', 'newPassword'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'aarav@example.com' },
                  otp: { type: 'string', example: '482910' },
                  newPassword: { type: 'string', format: 'password', minLength: 6, example: 'newPassword@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthSuccessResponse' } } } },
          400: { description: 'Invalid or expired OTP', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Customer login',
        description: 'Authenticates a customer and returns a JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'aarav@example.com' },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials or unverified email' },
        },
      },
    },
    '/auth/admin/login': {
      post: {
        tags: ['Auth'],
        summary: 'Admin login',
        description: 'Authenticates an administrator and returns a JWT token with admin privileges.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@yourstore.com' },
                  password: { type: 'string', example: 'adminpassword123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Admin login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials or not an admin' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Authenticated user profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Logged out successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/auth/change-password': {
      put: {
        tags: ['Auth'],
        summary: 'Change password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'secret123' },
                  newPassword: { type: 'string', minLength: 6, example: 'newSecret456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password changed successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          400: { description: 'Invalid current password' },
        },
      },
    },
    '/users/profile': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Profile data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Aarav S. Sharma' },
                  mobile: { type: 'string', example: '9876543210' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products catalogue',
        description: 'Browse catalogue with filters (category, search, price range, deal badges) and pagination.',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Category name or ID' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Text search keywords' },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'deal', in: 'query', schema: { type: 'string', enum: ['dealOfWeek', 'bigPack', 'combo', 'rs30Corner'] } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['price-asc', 'price-desc', 'newest', 'popular'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'List of products',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                    total: { type: 'integer', example: 42 },
                    page: { type: 'integer', example: 1 },
                    pages: { type: 'integer', example: 3 },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create product (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'price', 'unit'],
                properties: {
                  name: { type: 'string', example: 'Fresh Strawberries' },
                  category: { type: 'string', example: 'Fresh Fruits' },
                  categoryId: { type: 'string', example: '66abc1234def567890123458' },
                  price: { type: 'number', example: 120 },
                  unit: { type: 'string', example: 'box' },
                  stock: { type: 'integer', example: 25 },
                  emoji: { type: 'string', example: '🍓' },
                  imageUrl: { type: 'string', example: '/uploads/strawberries.jpg' },
                  description: { type: 'string', example: 'Sweet and juicy seasonal strawberries.' },
                  dealFlags: { type: 'array', items: { type: 'string' } },
                  isActive: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Product created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    product: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
          403: { description: 'Admin role required' },
        },
      },
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get product details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Product detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    product: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
          404: { description: 'Product not found' },
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Update product (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  unit: { type: 'string' },
                  stock: { type: 'integer' },
                  imageUrl: { type: 'string' },
                  description: { type: 'string' },
                  dealFlags: { type: 'array', items: { type: 'string' } },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Product updated successfully' },
          403: { description: 'Admin role required' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete product (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Product deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          403: { description: 'Admin role required' },
        },
      },
    },
    '/products/{id}/stock': {
      patch: {
        tags: ['Products'],
        summary: 'Update product stock level (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['stock'],
                properties: { stock: { type: 'integer', minimum: 0, example: 100 } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Stock updated successfully' },
        },
      },
    },
    '/products/upload-image': {
      post: {
        tags: ['Products'],
        summary: 'Upload product photo (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: { type: 'string', format: 'binary', description: 'Product image file (JPG/PNG, up to 5 MB)' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Image uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    imageUrl: { type: 'string', example: '/uploads/product-123456.jpg' },
                  },
                },
              },
            },
          },
          400: { description: 'No file or file too large' },
        },
      },
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List all categories',
        responses: {
          200: {
            description: 'Categories list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create category (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Exotic Fruits' },
                  description: { type: 'string', example: 'Imported and special fruits' },
                  imageUrl: { type: 'string', example: '' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Category created' },
          403: { description: 'Admin role required' },
        },
      },
    },
    '/categories/{id}': {
      get: {
        tags: ['Categories'],
        summary: 'Get category details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Category detail' },
          404: { description: 'Category not found' },
        },
      },
      put: {
        tags: ['Categories'],
        summary: 'Update category (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  imageUrl: { type: 'string' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Category updated' },
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete category (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Category deleted' },
        },
      },
    },
    '/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get customer shopping cart',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current cart',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    cart: { $ref: '#/components/schemas/Cart' },
                  },
                },
              },
            },
          },
          401: { description: 'Customer login required' },
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Clear customer shopping cart',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Cart emptied successfully' },
        },
      },
    },
    '/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Add item to shopping cart',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'string', example: '66abc1234def567890123457' },
                  quantity: { type: 'integer', minimum: 1, default: 1, example: 2 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Item added to cart' },
        },
      },
    },
    '/cart/items/{productId}': {
      put: {
        tags: ['Cart'],
        summary: 'Update item quantity in cart',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity'],
                properties: { quantity: { type: 'integer', minimum: 1, example: 3 } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Cart item updated' },
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Remove item from cart',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Item removed from cart' },
        },
      },
    },
    '/addresses': {
      get: {
        tags: ['Addresses'],
        summary: 'List customer saved addresses',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Address list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    addresses: { type: 'array', items: { $ref: '#/components/schemas/Address' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Addresses'],
        summary: 'Add new delivery address',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'mobile', 'line', 'pincode'],
                properties: {
                  fullName: { type: 'string', example: 'Aarav Sharma' },
                  mobile: { type: 'string', example: '9876543210' },
                  line: { type: 'string', example: 'Flat 402, Green Park' },
                  area: { type: 'string', example: 'Civil Lines' },
                  city: { type: 'string', default: 'Meerut', example: 'Meerut' },
                  pincode: { type: 'string', example: '250001' },
                  label: { type: 'string', enum: ['home', 'work', 'other'], default: 'home' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Address created' },
        },
      },
    },
    '/addresses/{id}': {
      put: {
        tags: ['Addresses'],
        summary: 'Update address',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Address' } } },
        },
        responses: {
          200: { description: 'Address updated' },
        },
      },
      delete: {
        tags: ['Addresses'],
        summary: 'Delete address',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Address deleted' },
        },
      },
    },
    '/orders/delivery-windows': {
      get: {
        tags: ['Orders'],
        summary: 'Get available checkout delivery slot windows',
        responses: {
          200: {
            description: 'Delivery windows',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    windows: { type: 'array', items: { type: 'string' }, example: ['6-9 AM', '9-12 PM', '2-5 PM', '5-8 PM'] },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Place order from shopping cart',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['deliveryDate', 'slotWindow', 'paymentMethod'],
                properties: {
                  addressId: { type: 'string', example: '66abc1234def567890123459' },
                  address: { $ref: '#/components/schemas/Address' },
                  deliveryDate: { type: 'string', example: '2026-10-27' },
                  slotWindow: { type: 'string', example: '5-8 PM' },
                  paymentMethod: { type: 'string', enum: ['cod', 'card', 'upi'], example: 'cod' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Order placed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    order: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            },
          },
          400: { description: 'Cart empty, out of stock, or validation error' },
        },
      },
    },
    '/orders/my': {
      get: {
        tags: ['Orders'],
        summary: 'Get customer order history',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of past orders',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order details by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Order details' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/orders/{id}/cancel': {
      put: {
        tags: ['Orders'],
        summary: 'Cancel placed order',
        description: 'Allowed only while order is in Placed or Confirmed status.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Order cancelled successfully' },
          400: { description: 'Cannot cancel order in current status' },
        },
      },
    },
    '/payments/my': {
      get: {
        tags: ['Payments'],
        summary: 'Get customer payment transaction history',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Payment transactions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    payments: { type: 'array', items: { $ref: '#/components/schemas/Payment' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/payments/verify': {
      post: {
        tags: ['Payments'],
        summary: 'Verify online payment transaction',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderId'],
                properties: {
                  orderId: { type: 'string', example: '66abc1234def567890123460' },
                  gatewayPaymentId: { type: 'string', example: 'pay_mock_123456' },
                  status: { type: 'string', enum: ['paid', 'failed'], default: 'paid' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Payment verified successfully' },
        },
      },
    },
    '/feedback': {
      get: {
        tags: ['Feedback'],
        summary: 'List customer feedback and reviews (Public)',
        responses: {
          200: {
            description: 'Reviews list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    feedback: { type: 'array', items: { $ref: '#/components/schemas/Feedback' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Feedback'],
        summary: 'Submit customer review / feedback',
        description: 'Submits feedback. If user is logged in, their token automatically links the submission.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'phone', 'comment'],
                properties: {
                  name: { type: 'string', example: 'Pooja Verma' },
                  phone: { type: 'string', example: '9123456789' },
                  comment: { type: 'string', example: 'Crisp vegetables, very satisfied!' },
                  rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                  product: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Feedback submitted' },
        },
      },
    },
    '/contact': {
      post: {
        tags: ['Contact'],
        summary: 'Submit customer support inquiry',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'mobile', 'message'],
                properties: {
                  name: { type: 'string', example: 'Rahul Kumar' },
                  email: { type: 'string', format: 'email', example: 'rahul@example.com' },
                  mobile: { type: 'string', example: '9988776655' },
                  message: { type: 'string', example: 'How can I schedule recurring morning deliveries?' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Contact message received' },
        },
      },
    },
    '/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Admin dashboard overview statistics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dashboard metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    stats: {
                      type: 'object',
                      properties: {
                        totalRevenue: { type: 'number', example: 45000 },
                        totalOrders: { type: 'integer', example: 120 },
                        totalCustomers: { type: 'integer', example: 85 },
                        activeProducts: { type: 'integer', example: 34 },
                        lowStockCount: { type: 'integer', example: 4 },
                      },
                    },
                    recentOrders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                  },
                },
              },
            },
          },
          403: { description: 'Admin privileges required' },
        },
      },
    },
    '/admin/customers': {
      get: {
        tags: ['Admin'],
        summary: 'List all registered customers',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Customers list' },
          403: { description: 'Admin privileges required' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create a new customer account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'mobile', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Pooja Verma' },
                  mobile: { type: 'string', example: '9123456789' },
                  email: { type: 'string', format: 'email', example: 'pooja@example.com' },
                  password: { type: 'string', minLength: 6, example: 'secret123' },
                  status: { type: 'string', enum: ['active', 'blocked'], default: 'active' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Customer created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error / email or mobile already exists' },
          403: { description: 'Admin privileges required' },
        },
      },
    },
    '/admin/customers/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Get customer detail with orders overview',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Customer details and order summary' },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Update customer information',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Pooja Verma' },
                  mobile: { type: 'string', example: '9123456789' },
                  email: { type: 'string', format: 'email', example: 'pooja.v@example.com' },
                  password: { type: 'string', minLength: 6, description: 'Leave blank to keep existing password' },
                  status: { type: 'string', enum: ['active', 'blocked'] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Customer updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error / email or mobile collision' },
          404: { description: 'Customer not found' },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete customer account (only if no existing order history)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Customer deleted successfully' },
          400: { description: 'Cannot delete customer with order history' },
          404: { description: 'Customer not found' },
        },
      },
    },
    '/admin/customers/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Activate or block customer account',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['active', 'blocked'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Customer status updated' },
        },
      },
    },
    '/admin/customers/{id}/verify': {
      patch: {
        tags: ['Admin'],
        summary: 'Verify or unverify customer account from Admin Panel',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { isVerified: { type: 'boolean', default: true } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Customer verification status updated' },
        },
      },
    },
    '/admin/orders': {
      get: {
        tags: ['Admin'],
        summary: 'List all store orders (Admin filterable)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'deliveryDate', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Orders list' },
        },
      },
    },
    '/admin/orders/{id}/status': {
      put: {
        tags: ['Admin'],
        summary: 'Update order processing status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['Placed', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'],
                    example: 'Confirmed',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Order status updated' },
        },
      },
    },
    '/admin/payments': {
      get: {
        tags: ['Admin'],
        summary: 'List all payments overview',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Payments list' },
        },
      },
    },
    '/admin/payments/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Get payment record details',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Payment detail' },
        },
      },
    },
    '/admin/feedback': {
      get: {
        tags: ['Admin'],
        summary: 'List all feedback entries for moderation',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Feedback list' },
        },
      },
    },
    '/admin/feedback/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete feedback review',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Feedback deleted' },
        },
      },
    },
    '/admin/contact-requests': {
      get: {
        tags: ['Admin'],
        summary: 'List all customer support contact requests',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Contact requests list' },
        },
      },
    },
    '/admin/contact-requests/{id}/resolve': {
      patch: {
        tags: ['Admin'],
        summary: 'Mark contact message as resolved',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Contact marked resolved' },
        },
      },
    },
    '/admin/contact-requests/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete contact request',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Contact request deleted' },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/modules/**/*.routes.js', './src/modules/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
