# Stage 1 – install dependencies in a uv-managed virtualenv
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS builder

WORKDIR /app

# Copy project metadata and source, then sync
COPY pyproject.toml README.md ./
COPY src/ src/

RUN uv sync --no-dev

# Stage 2 – lean runtime image
FROM python:3.13-slim-bookworm AS runtime

WORKDIR /app

# Bring in the virtualenv and source from the builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/src   /app/src

# Activate the virtualenv
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["python", "-m", "numbers_and_letters_app"]
