<div align="center">
  <h1>Real-Time Analytics Platform</h1>

  <p>
This monorepo contains the backend infrastructure for a scalable, high-throughput, real-time analytics and user behavior tracking platform. It is designed from the ground up to be deployed on Kubernetes and handle millions of events.
</p>

[![CI - Lint, Format & Test](https://github.com/bad-al-code/rta/actions/workflows/ci.yml/badge.svg)](https://github.com/bad-al-code/rta/actions/workflows/ci.yml)
[![CD - Build and Push on Tag](https://github.com/bad-al-code/rta/actions/workflows/cd.yml/badge.svg)](https://github.com/bad-al-code/rta/actions/workflows/cd.yml)

</div>
## Architecture Overview

This project utilizes a **polyglot persistence** architecture, leveraging multiple database technologies, each chosen for its specific strengths. This allows the system to handle diverse data types and workloads with high performance and efficiency.

- **`analytics-service`**: A Node.js + TypeScript application that serves as the core API. It handles user authentication, project management, and the high-speed ingestion of analytics events.
- **PostgreSQL**: The primary relational database and the single source of truth for structured data. It is responsible for managing core entities where data integrity is paramount (users, projects, etc.).
- **MongoDB**: A NoSQL document store used for ingesting and storing vast quantities of flexible, semi-structured analytics event data. Its schema-less nature is ideal for capturing diverse event types.
- **Redis**: An in-memory data store used as a high-speed buffer and cache. It serves two main purposes:
  1.  **Ingestion Buffer:** Acts as a write-ahead buffer for incoming analytics events, allowing the API to respond instantly while a background worker processes the data.
  2.  **Caching:** Caches frequently accessed data (like user profiles) to reduce load on PostgreSQL.
- **Kubernetes**: The entire stack is designed to be deployed and orchestrated by Kubernetes, enabling horizontal scaling, self-healing, and zero-downtime deployments.

---

## Monorepo Structure

This project is managed as a `pnpm` workspace.

```
/
├── apps/
│ └── analytics-service/
├── .github/
├── k8s/
└── ...
```

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- [**Node.js**](https://nodejs.org/) (v24.x or later recommended)
- [**pnpm**](https://pnpm.io/installation) (v8.x or later)
- [**Docker**](https://www.docker.com/get-started/) and Docker Compose
- [**k6**](https://k6.io/docs/getting-started/installation/) (for load testing)
- **(For Kubernetes Deployment)** [**KinD**](https://kind.sigs.k8s.io/docs/user/quick-start/) and [**kubectl**](https://kubernetes.io/docs/tasks/tools/install-kubectl/)

---

## Development Setup

Follow these steps to get the complete development environment running on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/bad-al-code/rta.git
cd rta
```

### 2. Install Dependencies

Install all dependencies for the entire workspace using `pnpm` from the root directory.
code

```
pnpm install
```

### 3. Set Up Environment Variables

Navigate to the analytics-service directory and create a local `.env` file from the sample.

```
cd apps/analytics-service
cp .env.sample .env
```

Review and update the `.env` file if necessary (the defaults are configured to work with the Docker Compose setup).

### 4. Launch the Docker Environment

From the root of the project, launch the entire application stack (databases and the Node.js service) using Docker Compose.

```
# Run in detached mode (in the background)
docker compose up -d --build
```

To view the logs for all services, run:

```
docker compose logs -f
```

### 5. Run Database Migrations

Once the containers are running, apply the initial database schema to the PostgreSQL container. This command must be run from within the `analytics-service` directory.

```
cd apps/analytics-service
pnpm db:migrate
```

Your environment is now ready! The API is accessible at http://localhost:4000.

- **Health Check**: `http://localhost:4000/api/v1/health`
- **API Documentation**: `http://localhost:4000/api/v1/api-docs`

## Available Scripts

Most scripts should be run from within the `apps/analytics-service` directory.

- `pnpm dev`: Runs the service in development mode with live-reloading. Note: For this to work, you must have the databases running via docker compose up.
- `pnpm test`: Runs the full suite of integration tests.
- `pnpm db:generate`: Generates a new migration file after you change src/db/schema.ts.
- `pnpm db:seed`: Populates the database with fake data for development.

## CI/CD Pipeline

This repository is configured with two GitHub Actions workflows:

1. **CI Pipeline (ci.yml)**: Automatically runs on every pull request and push to non-main branches. It performs linting, formatting checks, and runs the entire test suite against live database containers to ensure code quality and prevent regressions.
2. **CD Pipeline (cd.yml)**: Automatically runs only when a new Git tag (e.g., v1.0.1) is pushed. It builds a production-ready Docker image, versions it with the Git tag, and pushes it to Docker Hub.
