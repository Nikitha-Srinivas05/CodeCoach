from fastapi import FastAPI
from database import engine, Base
import models
from routers import chat, progress

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CodeCoach API")

app.include_router(chat.router)
app.include_router(progress.router)


@app.get("/")
def root():
    return {"message": "CodeCoach API is running"}