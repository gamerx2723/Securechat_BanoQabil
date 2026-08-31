from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from .routers import analyze, copilot, context, learn

app = FastAPI(
    title="SecureChat AI Security Microservice",
    version="1.0.0",
    description="Multilingual Zero-Trust Security Classifier (Phishing, Social Engineering, DLP, Context, Adaptive Continuous Learning, Deep Cognitive Intent)"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(copilot.router)
app.include_router(context.router)
app.include_router(learn.router)

@app.get("/", response_class=HTMLResponse)
async def root_dashboard():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>SecureChat AI Security Microservice</title>
        <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0b0f17; color: #e2e8f0; margin: 0; padding: 40px; }
            .container { max-width: 800px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 32px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
            h1 { color: #38bdf8; display: flex; align-items: center; gap: 12px; margin-top: 0; }
            .badge { background: #0284c7; color: white; padding: 4px 10px; border-radius: 20px; font-size: 13px; }
            .card { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .btn { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; margin-top: 12px; }
            .btn:hover { background: #1d4ed8; }
            ul { line-height: 1.8; color: #94a3b8; }
            code { background: #1e293b; color: #38bdf8; padding: 2px 6px; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🛡️ SecureChat AI Security Microservice <span class="badge">Active & Ready</span></h1>
            <p>Welcome! The FastAPI Zero-Trust AI Microservice is running locally on port <code>8000</code>.</p>
            
            <div class="card">
                <h3>📖 Interactive API Documentation</h3>
                <p>Explore and test all security models and endpoints interactively in Swagger UI:</p>
                <a href="/docs" class="btn">Open Swagger API Docs (/docs) &rarr;</a>
                <a href="/redoc" class="btn" style="background: #475569; margin-left: 8px;">ReDoc (/redoc)</a>
            </div>

            <div class="card">
                <h3>🔍 Active Intelligence Services:</h3>
                <ul>
                    <li><code>POST /api/v1/analyze</code> &mdash; Cascaded Level 0/1/2 Threat & Phishing Classifier</li>
                    <li><code>POST /api/v1/context/evaluate</code> &mdash; Multi-Turn Conversation Risk Timeline Escalation</li>
                    <li><code>POST /api/v1/copilot/query</code> &mdash; Interactive Security Copilot Assistant</li>
                    <li><code>POST /api/v1/learn/feedback</code> &mdash; Continuous Active Online Learning & Dynamic Memory</li>
                    <li><code>GET /api/v1/learn/stats</code> &mdash; Dynamic Exemplar Memory & Feedback Telemetry</li>
                    <li><code>GET /health</code> &mdash; System Health & Model Telemetry Status</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    """

@app.get("/health")
@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "SecureChat AI Security Engine",
        "models_loaded": [
            "PhishingClassifier",
            "SocialEngDetector",
            "UrduScamDetector",
            "ZeroDayCognitiveEngine",
            "DeepCognitiveEngine",
            "AdaptiveLearningEngine",
            "DlpEngine",
            "ContextEngine",
            "ExplainabilityEngine"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
