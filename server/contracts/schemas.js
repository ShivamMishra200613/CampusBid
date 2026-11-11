/**
 * CampusBid JSON Schema and Validator Contract Definitions
 */

export const RegisterSchema = {
  type: 'object',
  required: ['fullName', 'email', 'classBranch', 'rollNo', 'password', 'confirmPassword', 'agreeTerms'],
  properties: {
    fullName: { type: 'string', minLength: 2 },
    email: { 
      type: 'string', 
      format: 'email',
      pattern: '^[a-zA-Z0-9._%+-]+@ves\\.ac\\.in$',
      errorMessage: 'Email must be a valid @ves.ac.in address'
    },
    classBranch: { type: 'string', minLength: 2 },
    rollNo: { type: 'string', minLength: 1 },
    password: { type: 'string', minLength: 8 },
    confirmPassword: { type: 'string', minLength: 8 },
    agreeTerms: { type: 'boolean', const: true }
  }
};

export const LoginSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 1 }
  }
};

export const CreateProductSchema = {
  type: 'object',
  required: ['title', 'category', 'condition', 'description', 'startingBid', 'minIncrement', 'duration', 'images'],
  properties: {
    title: { type: 'string', minLength: 3, maxLength: 120 },
    category: { 
      type: 'string', 
      enum: ['electronics', 'books', 'furniture', 'fashion', 'sports', 'others'] 
    },
    condition: { type: 'string', minLength: 2 },
    description: { type: 'string', minLength: 10 },
    startingBid: { type: 'number', minimum: 1 },
    minIncrement: { type: 'number', minimum: 1 },
    duration: { type: 'string', enum: ['24h', '3d', '7d'] },
    images: { 
      type: 'array', 
      items: { type: 'string' },
      minItems: 1 
    },
    isDraft: { type: 'boolean' }
  }
};

export const PlaceBidSchema = {
  type: 'object',
  required: ['amount'],
  properties: {
    amount: { type: 'number', minimum: 1 }
  }
};

export const ModerateListingSchema = {
  type: 'object',
  required: ['action'],
  properties: {
    action: { type: 'string', enum: ['approve', 'reject'] },
    reason: { type: 'string' }
  }
};

export const ResolveReportSchema = {
  type: 'object',
  required: ['resolutionAction'],
  properties: {
    resolutionAction: { 
      type: 'string', 
      enum: ['dismiss', 'remove_listing', 'suspend_user', 'warn_seller'] 
    },
    notes: { type: 'string' }
  }
};
