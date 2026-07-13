const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MapHome API Documentation",
      version: "1.0.0",
      description:
        "API documentation for MapHome backend - Property rental management system",
      contact: {
        name: "MapHome Team",
      },
    },
    servers: [
      {
        url: process.env.BACKEND_URL || "https://exe101-project.onrender.com",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
