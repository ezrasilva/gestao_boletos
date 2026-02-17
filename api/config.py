from dotenv import load_dotenv
import os

load_dotenv('.env.local')

DATABASE_URL = os.getenv("DATABASE_URL")