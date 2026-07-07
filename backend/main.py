import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import engine, Base
import models
from routers import chat, progress

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("codecoach")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CodeCoach API")

# Allow the React dev server (and later, your deployed frontend) to call this API.
# Add your production frontend URL here once you deploy it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catch-all so an unexpected error never returns a raw stack trace to the
    client. Logs the real error server-side for debugging, but the person
    using the app just sees a clean, friendly message.
    """
    logger.exception(f"Unhandled error on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on our end. Please try again."},
    )


app.include_router(chat.router)
app.include_router(progress.router)


@app.get("/")
def root():
    return {"message": "CodeCoach API is running"}
