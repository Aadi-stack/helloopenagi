# OpenAGI Stack Builder

A visual drag-and-drop interface for building AI stacks with OpenAGI.

## Overview

OpenAGI Stack Builder is a web application that allows users to visually create, configure, and deploy AI stacks using a drag-and-drop interface. It integrates various LLMs, agents, and tools into cohesive workflows that can be deployed and interacted with through a chat interface.

## Features

- **Visual Builder**: Drag-and-drop interface for creating AI stacks
- **Component Library**: Pre-built components including LLMs, agents, and tools
- **Configuration Panel**: Easily configure each component in your stack
- **Chat Interface**: Test your AI stack with a built-in chat interface
- **User Authentication**: Secure login and registration system
- **Stack Management**: Save, load, and share your AI stacks

## Architecture

The application follows a modern web architecture:

- **Frontend**: Next.js with React, Tailwind CSS, and shadcn/ui components
- **Backend**: FastAPI with SQLAlchemy for database operations
- **Database**: PostgreSQL for data persistence
- **Authentication**: JWT-based authentication with OAuth providers support
- **Deployment**: Docker and Kubernetes for containerization and orchestration

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- Docker (optional, for containerized deployment)

### Installation

#### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Aadi-stack/helloopenagi.git
   cd helloopenagi

