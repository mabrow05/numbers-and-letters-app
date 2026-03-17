import uvicorn

if __name__ == "__main__":
    uvicorn.run("numbers_and_letters_app.app:app", host="0.0.0.0", port=8000, reload=True)
