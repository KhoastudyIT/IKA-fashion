const config = {
  port:           parseInt(process.env.PORT          ?? '4000', 10),
  jwtSecret:      process.env.JWT_SECRET             ?? 'ika-fashion-dev-secret-change-in-prod',
  jwtExpiresIn:   process.env.JWT_EXPIRES_IN         ?? '7d',
  nodeEnv:        process.env.NODE_ENV               ?? 'development',
  openapiEnabled: process.env.OPENAPI_ENABLED        !== 'false',
  corsOrigin:     process.env.CORS_ORIGIN            ?? 'http://localhost:3000',
};

export default config;
