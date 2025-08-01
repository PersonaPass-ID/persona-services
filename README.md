# PersonaPass Backend Services - AWS Serverless Infrastructure

**Microservices Architecture for Identity Verification**  
Built with AWS Lambda, DynamoDB, and API Gateway

## 🌟 Overview

PersonaPass backend services provide secure, scalable identity verification through serverless microservices. The architecture supports phone/email verification, password authentication, DID creation, and credential management with comprehensive cost optimization.

## 🏗️ Architecture

- **Compute**: 8 AWS Lambda functions with intelligent scaling
- **Storage**: 3 DynamoDB tables with on-demand billing
- **API**: API Gateway with request validation and CORS
- **Security**: IAM roles, KMS encryption, comprehensive logging

## ⚡ Lambda Functions

### Authentication Services
1. **Email Verification Start** (`email-verification-start`)
   - Initiates email verification with SES
   - Generates secure verification codes
   - Rate limiting and spam protection

2. **Email Verification Complete** (`email-verification-complete`)
   - Validates verification codes
   - Issues verifiable credentials
   - DID creation on PersonaChain

3. **Phone Verification Start** (`phone-verification-start`)
   - SMS verification via SNS
   - International phone number support
   - Fraud detection integration

4. **Phone Verification Complete** (`phone-verification-complete`)
   - Code validation and VC issuance
   - Blockchain DID registration
   - Zero-knowledge proof generation

5. **Password Authentication** (`password-auth`)
   - Secure bcrypt password hashing
   - Session management
   - Account creation and login

### Blockchain Integration
6. **DID Management** (`did-create`)
   - PersonaChain blockchain integration
   - Decentralized identifier creation
   - Transaction monitoring and confirmations

7. **Credential Issuance** (`credential-issue`)
   - W3C Verifiable Credentials standard
   - Digital signature and proof generation
   - Credential storage and retrieval

8. **Health Check** (`health-check`)
   - System status monitoring
   - Service availability checks
   - Performance metrics collection

## 💾 DynamoDB Tables

### Users Table
```json
{
  "TableName": "persona-users",
  "KeySchema": [
    {"AttributeName": "id", "KeyType": "HASH"}
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "email-index",
      "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}]
    },
    {
      "IndexName": "phone-index", 
      "KeySchema": [{"AttributeName": "phone", "KeyType": "HASH"}]
    }
  ],
  "BillingMode": "ON_DEMAND"
}
```

### Credentials Table
```json
{
  "TableName": "persona-credentials",
  "KeySchema": [
    {"AttributeName": "id", "KeyType": "HASH"}
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "user-id-index",
      "KeySchema": [{"AttributeName": "userId", "KeyType": "HASH"}]
    },
    {
      "IndexName": "did-index",
      "KeySchema": [{"AttributeName": "did", "KeyType": "HASH"}] 
    }
  ],
  "BillingMode": "ON_DEMAND"
}
```

### Sessions Table
```json
{
  "TableName": "persona-sessions",
  "KeySchema": [
    {"AttributeName": "sessionId", "KeyType": "HASH"}
  ],
  "TimeToLiveSpecification": {
    "AttributeName": "expiresAt",
    "Enabled": true
  },
  "BillingMode": "ON_DEMAND"
}
```

## 🛡️ Security Features

### IAM Role Structure
- **Lambda Execution Role**: Minimal permissions for each function
- **DynamoDB Access**: Table-specific read/write permissions
- **SES/SNS Integration**: Service-specific communication rights
- **CloudWatch Logging**: Comprehensive audit trail

### Encryption
- **Environment Variables**: KMS encryption for sensitive data
- **Data at Rest**: DynamoDB encryption enabled
- **Data in Transit**: HTTPS/TLS 1.2 enforced
- **API Gateway**: Request/response validation

### Rate Limiting
- **API Gateway**: 1000 requests per minute per IP
- **Lambda Concurrency**: Reserved capacity for critical functions
- **DynamoDB**: On-demand scaling with burst capacity
- **SES/SNS**: Service-level rate limiting integration

## 💰 Cost Optimization

### On-Demand Pricing Model
- **Lambda**: Pay per invocation and execution time
- **DynamoDB**: Pay per request (no idle capacity costs)
- **API Gateway**: Pay per API call
- **S3**: Intelligent tiering for credential storage

### Cost Controls
- **Billing Alerts**: $10, $25, $50 thresholds
- **Budget Limits**: $100 monthly budget with alerts
- **Reserved Capacity**: Only where cost-effective
- **Log Retention**: 7-day CloudWatch retention

### Expected Monthly Costs
```
Lambda (10K invocations):     $2.00
DynamoDB (1M requests):       $1.25  
API Gateway (10K calls):      $3.50
S3 Storage (10GB):           $0.23
SES (1K emails):             $0.10
SNS (1K SMS):                $0.75
CloudWatch Logs:             $0.50
Total Estimated:             $8.33/month
```

## 📊 Monitoring & Observability

### CloudWatch Integration
- **Lambda Metrics**: Execution time, error rates, concurrency
- **DynamoDB Metrics**: Request latency, throttling, consumed capacity
- **API Gateway**: Request/response metrics, latency distribution
- **Custom Metrics**: Business logic and user behavior tracking

### Alarms and Notifications
- **Error Rate > 1%**: Critical alert to development team
- **Response Time > 5s**: Performance degradation warning
- **DynamoDB Throttling**: Capacity adjustment recommendations
- **Cost Threshold**: Budget utilization notifications

### Dashboards
- **Service Health**: Real-time status of all components
- **Performance Metrics**: Response times and throughput graphs
- **Cost Analysis**: Usage patterns and cost breakdown
- **User Activity**: Registration and verification trends

## 🚀 API Endpoints

### Base URL
```
https://cabf8jj5t4.execute-api.us-east-1.amazonaws.com/prod
```

### Authentication Endpoints
```
POST /api/persona/email/verify-start
POST /api/persona/email/verify-complete
POST /api/persona/phone/verify-start  
POST /api/persona/phone/verify-complete
POST /auth/create-account
POST /auth/login
POST /auth/verify-token
```

### Blockchain Integration
```
POST /api/did/create
GET  /api/credentials/{walletAddress}
POST /api/zk-proof/generate
POST /api/zk-proof/verify
```

### System Monitoring
```
GET  /health
GET  /metrics
```

## 🔧 Configuration

### Environment Variables
```bash
# Database Configuration
USERS_TABLE=persona-users
CREDENTIALS_TABLE=persona-credentials
SESSIONS_TABLE=persona-sessions

# External Services
SES_REGION=us-east-1
SNS_REGION=us-east-1
PERSONACHAIN_RPC=https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com

# Security
JWT_SECRET_KEY=<kms-encrypted>
ENCRYPTION_KEY=<kms-encrypted>
API_VERSION=v1

# Cost Control
MAX_CONCURRENT_EXECUTIONS=100
LOG_RETENTION_DAYS=7
```

## 🧪 Testing & Validation

### Health Checks
```bash
# Service health
curl https://cabf8jj5t4.execute-api.us-east-1.amazonaws.com/prod/health

# Email verification flow
curl -X POST https://cabf8jj5t4.execute-api.us-east-1.amazonaws.com/prod/api/persona/email/verify-start \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Phone verification flow  
curl -X POST https://cabf8jj5t4.execute-api.us-east-1.amazonaws.com/prod/api/persona/phone/verify-start \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

### Load Testing
```bash
# Performance testing
ab -n 1000 -c 10 https://cabf8jj5t4.execute-api.us-east-1.amazonaws.com/prod/health

# Concurrent verification tests
for i in {1..100}; do
  curl -X POST https://cabf8jj5t4.execute-api.us-east-1.amazonaws.com/prod/api/persona/email/verify-start &
done
```

## 🌐 Integration

### Frontend Integration
```javascript
// PersonaPass API Client usage
import { personaApiClient } from './api-client'

// Start email verification
const result = await personaApiClient.startEmailVerification('user@example.com')

// Complete verification and get credentials
const credential = await personaApiClient.verifyEmailCodeAndIssueVC('user@example.com', '123456')

// Create DID on blockchain
const did = await personaApiClient.createDID(walletAddress, 'John', 'Doe', 'email', 'user@example.com')
```

### Blockchain Integration
```javascript
// PersonaChain RPC integration
const rpcUrl = 'https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com'

// Query blockchain for DIDs
const response = await fetch(`${rpcUrl}/did/${walletAddress}`)
const didDocument = await response.json()
```

## 📚 Documentation

- [API Reference](./docs/api.md)
- [Authentication Guide](./docs/auth.md)
- [Cost Optimization](./docs/cost.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-service`)
3. Commit changes (`git commit -m 'Add new verification service'`)
4. Push to branch (`git push origin feature/new-service`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## 🏆 Production Status

✅ **8 Lambda Functions**: All operational with monitoring  
✅ **DynamoDB Tables**: On-demand scaling enabled  
✅ **API Gateway**: Request validation and CORS configured  
✅ **Cost Controls**: Billing alerts and budgets active  
✅ **Security**: IAM roles and KMS encryption enabled  
✅ **Logging**: Comprehensive CloudWatch integration  

---

**PersonaPass Backend Services** - Scalable Identity Verification Infrastructure  
Built with ❤️ by the PersonaPass team