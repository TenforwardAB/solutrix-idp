import dotenv from 'dotenv';
import {Logger} from "logtrek";

dotenv.config();

export const logger = new Logger('debug', 'console');