# AI Review Portal API

This is the backbone of the portal containing authentication routes and version routes.

# Prerequisites

To start this service a postgresql-database needs to be correctly setup with correct table structure. See ai-review-portal-data-model for setup.

# Installation & startup

```bash
npm i
npm run dev

# API Documentation

## Overview

This API is designed to handle authentication via JWT access and refresh tokens. It supports login, logout, and secure authentication with refresh tokens for session maintenance. Additionally, the API provides database model management using Sequelize and GitHub Actions for automated deployments.

---

## Authentication Flow

### 1. **Login**
The login endpoint allows a user to authenticate with their credentials (username and password). Upon successful authentication, the API returns:
- An **access token**: A short-lived JWT used for API requests.
- A **refresh token**: A long-lived JWT used to obtain new access tokens without requiring the user to log in again.

#### **Endpoint**
```
POST /api/auth/login
```
**Body**:
```json
{
  "username": "example_user",
  "password": "example_password"
}
```

# Code formatter - Prettier

Prettier is used for code formatting. To ensure consistent formatting across the codebase, download extension: Prettier - Code formatter.

![Screenshot from 2024-09-23 11-22-41](https://github.com/user-attachments/assets/943fac5a-76d5-4779-a3e4-d039dbd104dd)

# Usage

See scripts in dev-scripts for example usage

# Run container

docker build -t your-app-name .
docker run -p 5000:5000 your-app-name

if using podman just exchage "docker" to "podman"

**Response**:
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

### 2. **Logout**
The logout endpoint allows users to invalidate their tokens and securely log out.

#### **Endpoint**
```
POST /api/auth/logout
```

**Body**:
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### 3. **Refresh Token**
To maintain a valid session without re-authenticating, the client can use the refresh token to request a new access token.

#### **Endpoint**
```
POST /api/auth/refresh
```

**Body**:
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response**:
```json
{
  "accessToken": "new-jwt-access-token"
}
```

### 4. **Token Validation (Well-Known Endpoint)**
The API supports a well-known endpoint to expose public keys or necessary metadata for token validation.

#### **Endpoint**
```
GET /.well-known/jwks.json
```

This provides the public key used to validate the access tokens.

---

## Database Management with Sequelize

The API uses **Sequelize ORM** to manage its database schema and run migrations. Models represent database tables, and migrations ensure that database changes are applied smoothly across different environments.

### 1. **Creating a New Model**

To generate a new Sequelize model, run the following command:
```bash
npx sequelize-cli model:generate --name <ModelName> --attributes <field:type>
```
For example, to create a `User` model:
```bash
npx sequelize-cli model:generate --name User --attributes username:string,email:string,passwordhash:string
```

### 2. **Running Migrations**

After modifying or creating a model, you need to run a migration to apply changes to the database schema.

```bash
npx sequelize-cli db:migrate
```

If you need to undo the last migration:
```bash
npx sequelize-cli db:migrate:undo
```

---

## GitHub Actions and Deployment

We use **GitHub Actions** to automate the deployment process. The workflow is set up to perform different actions depending on whether you push to the `test` or `main` branch. 

### GitHub Action Overview

1. **CI/CD Pipeline**:
   - The pipeline checks out the code, installs dependencies, runs database migrations, and deploys the API to an Azure Web Service.
   
2. **Branch-based Workflow**:
   - Pushing to the `test` branch triggers deployment to the **testing environment**.
   - Pushing to the `main` branch triggers deployment to the **production environment**.

### Action Workflow File Example

Here's an overview of the workflow YAML file:

```yaml
name: Deploy API to Azure

on:
  push:
    branches:
      - main
      - test

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v2

    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18.x'

    - name: Install dependencies
      run: npm install

    - name: Run database migrations
      run: npx sequelize-cli db:migrate
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}

    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Deploy to Azure Web App
      run: |
        az webapp up --name ${{ secrets.WEB_APP_NAME }}                      --resource-group ${{ secrets.RESOURCE_GROUP }}                      --location ${{ secrets.AZURE_LOCATION }}                      --runtime "NODE|18-lts"
```

### Secrets Management

You need to set secrets in GitHub under **Settings > Secrets and variables** for secure handling of sensitive data like API keys and connection strings.

- **Secrets required for `test` and `main`**:
  - `AZURE_CREDENTIALS`: Azure Service Principal credentials in JSON format.
  - `DATABASE_URL`: Connection string to the database (test or production).
  - `WEB_APP_NAME`: Name of the Azure Web App.
  - `RESOURCE_GROUP`: Azure resource group.
  - `AZURE_LOCATION`: Location of the Azure data center.

### Setting Environment-Specific Secrets

You can configure the action to use different secrets for **test** and **production** environments by checking the branch before deployment:

```yaml
    - name: Set environment-specific secrets
      run: |
        if [ "${{ github.ref }}" == "refs/heads/main" ]; then
          echo "Deploying to production database"
          export DATABASE_URL=${{ secrets.PROD_DATABASE_URL }}
          export WEB_APP_NAME=${{ secrets.PROD_WEB_APP_NAME }}
        else
          echo "Deploying to test database"
          export DATABASE_URL=${{ secrets.TEST_DATABASE_URL }}
          export WEB_APP_NAME=${{ secrets.TEST_WEB_APP_NAME }}
        fi
```

---

## Summary

This API handles authentication using JWT with access and refresh tokens and dynamically manages the database schema using Sequelize. GitHub Actions automate the deployment process, allowing different configurations based on the branch that is pushed.

- **Login** and **Logout** via JWT
- **Database migrations** and schema updates via Sequelize
- **Automated deployments** to Azure using GitHub Actions
- **Secrets management** for environment-specific deployments

For more detailed instructions or to customize the pipeline further, refer to the configuration and deployment scripts in the repository.
