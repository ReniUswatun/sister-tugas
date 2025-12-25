FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create data and keys directories
RUN mkdir -p /app/data /app/keys && chmod 777 /app/data /app/keys

COPY . .

# Set default port (can be overridden via ENV)
ENV PEER_PORT=5000

# Expose ports for peer communication
EXPOSE 5000 5001 5002

# Run app with PEER_PORT from environment
CMD ["python", "-u", "app.py"]