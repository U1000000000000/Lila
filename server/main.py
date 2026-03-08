import uvicorn
from app.core.config import settings

# PROTOTYPE WARNING:
# The OAuth code store uses in-memory dict, which only works with a single worker.
# If you increase 'workers' > 1, login will break unless you switch to Redis or another shared store.
# For production, set workers > 1 and update google_auth.py to use Redis.
# Restricting to a single worker for prototype reliability.

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=settings.PORT,
        workers=1,  # DO NOT INCREASE unless you fix google_auth.py to use Redis
    )
