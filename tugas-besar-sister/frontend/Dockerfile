FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Pastikan port sesuai dengan yang ada di vite.config / react-router config
EXPOSE 5173

# Tambahkan --host agar bisa diakses dari browser host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]