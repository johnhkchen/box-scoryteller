/**
 * Server hooks - runs once when the server starts
 * Loads environment variables from .env file
 */
import { config } from 'dotenv';

// Load .env file
config();
