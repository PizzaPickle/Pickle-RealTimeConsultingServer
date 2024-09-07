import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

export function getEnv(key, defaultValue = undefined) {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    console.warn(`Environment variable ${key} is not set and no default value provided.`);
  }
  return value !== undefined ? value : defaultValue;
}

export const ENV = {
  RABBITMQ_USER: getEnv('RABBITMQ_USER'),
  RABBITMQ_PASSWORD: getEnv('RABBITMQ_PASSWORD'),
  RABBITMQ_HOST: getEnv('RABBITMQ_HOST', 'localhost'),
  RABBITMQ_PORT: getEnv('RABBITMQ_PORT', '5672'),
  REACT_APP_ORIGIN: getEnv('REACT_APP_ORIGIN', 'http://localhost:5173'),
  REDIS_HOST: getEnv('REDIS_HOST', 'localhost'),
  REDIS_PORT: getEnv('REDIS_PORT', '6379'),
};

export default ENV;
