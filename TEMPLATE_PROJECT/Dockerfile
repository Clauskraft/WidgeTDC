# WidgetTDC Platform Template - Docker Image
# Run cascade orchestrator in containerized environment

FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi && \
    pip install pyyaml

# Copy project files
COPY . .

# Create logs directory
RUN mkdir -p .claude/logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=utf-8

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD test -f .claude/agent-cascade-state.json || exit 1

# Default command: run orchestrator
CMD ["python", "cascade-orchestrator.py"]

# Labels
LABEL description="WidgetTDC Platform Template - Autonomous Agent Orchestration"
LABEL maintainer="Claude Code"
LABEL version="1.0"
