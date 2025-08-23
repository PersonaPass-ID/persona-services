# PersonaPass Backend API Module  

**Parent**: @../AGENT.md (Root configuration)

Express.js backend API server providing authentication services and blockchain integration for PersonaPass.

## Module Overview

**Technology Stack:**
- Express.js with TypeScript patterns
- Winston logging with structured output
- JWT authentication with bcrypt
- Supabase database integration
- PersonaChain blockchain connectivity

## Development Commands

```bash
# Development
npm start                    # Start server (port 3001)
npm run dev                  # Development with auto-reload
npm test                     # Run test suite

# Production  
npm run build                # Build for production
npm run start:prod           # Production server

# Monitoring
curl http://localhost:3001/health              # Health check
curl http://localhost:3001/api/status          # Service status
curl http://localhost:3001/api/blockchain/status # Blockchain connectivity
```

## Code Standards

**Security First:**
- All inputs validated and sanitized
- Rate limiting: 100 req/min per IP
- CORS configured for production domains
- JWT tokens with 7-day expiration
- Helmet.js security headers

**API Patterns:**
- RESTful endpoints with proper HTTP status codes
- Structured JSON responses with success/error format
- Comprehensive error handling with logging
- Environment variable configuration

## Key Files

- `src/server.js`: Main Express.js application
- `package.json`: Production dependencies
- `logs/`: Winston structured logging output

## AI Agent Instructions

When modifying this module:
- Follow existing Express.js patterns
- Maintain security standards (no shortcuts)
- Log all operations with appropriate levels
- Test API endpoints after changes
- Reference blockchain IP: 44.220.177.56