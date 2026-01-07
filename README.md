# Scalable Order Backend System

Production-ready backend system for product ordering with race-condition safety, caching, and background processing.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)

### Setup

1. Clone and configure:

```bash
git clone <repository-url>
cd scalable-order-backend
cp .env.example .env
# Edit .env with your configuration
```

2. Start services:

```bash
docker-compose up -d
```

3. Check health:

```bash
curl http://localhost:3000/health
```

### Local Development

```bash
npm install
npm run dev
```

## Architecture

### Layer Separation

- **API Layer**: HTTP handling, request validation
- **Service Layer**: Business logic, transactions
- **Data Access Layer**: Database queries
- **Task Layer**: Background processing

### Tech Stack

- Runtime: Node.js
- Framework: Express.js
- Database: PostgreSQL
- Cache/Queue: Redis
- ORM: Sequelize
- Worker: Celery

## Development

### View Logs

```bash
docker-compose logs -f api
docker-compose logs -f worker
```

### Stop Services

```bash
docker-compose down
```

### Clean Restart

```bash
docker-compose down -v
docker-compose up -d --build
```

---

## Quick Start Commands

```bash
# 1. Create project directory
mkdir scalable-order-backend && cd scalable-order-backend

# 2. Copy .env.example to .env
cp .env.example .env

# 3. Edit .env with your settings
nano .env

# 4. Start all services
docker-compose up -d

# 5. Check health
curl http://localhost:3000/health

# 6. View logs
docker-compose logs -f
```
