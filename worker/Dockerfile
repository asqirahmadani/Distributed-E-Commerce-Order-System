FROM python:3.11-slim

WORKDIR /app

# install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy worker code
COPY celery_app.py .

# create non-root user
RUN useradd -m -u 1001 celeryuser && \
    chown -R celeryuser:celeryuser /app

USER celeryuser

# run Celery worker
CMD ["celery", "-A", "celery_app", "worker", "--loglevel=info", "--concurrency=4"]