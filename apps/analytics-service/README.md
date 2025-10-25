# Real-Time Analytics Platform

This monorepo contains the backend service for a high-throughput, real-time analytics and user behavior tracking platform. The service is designed to ingest millions of events, process them, and provide powerful querying capabilities.

---

## Features (Planned)

- **High-Volume Data Ingestion** – A robust API endpoint designed to handle millions of requests with low latency.
- **Multi-Database Architecture** – Utilizes PostgreSQL for structured data (users, projects), MongoDB for flexible event data, and Redis for caching and real-time metrics.
- **Real-Time Processing** – Data is buffered and processed to be available for querying in near real-time.
- **Scalable & Reliable** – Architected for horizontal scaling and resilience using Docker and Kubernetes.
- **Comprehensive Testing** – Rigorous unit, integration, and end-to-end tests using Vitest and Supertest.
- **Monitoring & Observability** – Integrated with Prometheus and Grafana for deep insights into application performance.
- **Code Quality** – Enforced by ESLint for error checking, Prettier for consistent formatting, and Husky for automated pre-commit checks.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [pnpm](https://pnpm.io/installation)
- [Docker](https://www.docker.com/get-started/) and Docker Compose

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/bad-al-code/rta
cd rta
```

---

### 2. Install Dependencies

Install all dependencies for all services in the workspace using **pnpm** from the root directory.

```bash
pnpm install
```

---

### 3. Set Up Environment Variables

Navigate to the analytics service directory and create your `.env` file:

```bash
cd apps/analytics-service
cp .env.sample .env
```

Review and update the `.env` file as needed for your local setup.

---

## Available Scripts

All scripts should be run from within the `apps/analytics-service` directory.

---

### Running the Application

To start the service in development mode with live reloading (via **nodemon**):

```bash
pnpm dev
```

The service will be available at [http://localhost:4000](http://localhost:4000).

---

### Code Quality Scripts

Check for linting errors:

```bash
pnpm lint
```

Automatically fix fixable linting errors:

```bash
pnpm lint:fix
```

Format all code with **Prettier**:

```bash
pnpm format
```
