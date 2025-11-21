"""
Simple script to run the blockchain API server.
Run with: python run.py
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("blockchain.main:app", host="0.0.0.0", port=8000, reload=True)

