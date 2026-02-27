"""
Analysis Routes — /api/v1/analysis
------------------------------------
Exposes conversation analysis data to the authenticated frontend.

Endpoints
─────────
GET  /analysis/dashboard            → aggregated stats for Dashboard.jsx
GET  /analysis/history?page=&size=  → paginated list of analyses for History.jsx
GET  /analysis/session/{session_id} → full analysis for a specific session
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies.auth import get_current_google_id
from app.services.analysis_service import (
    get_dashboard_stats,
    get_analyses_for_user,
    get_analysis_for_session,
)

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.get("/dashboard")
async def dashboard(google_id: str = Depends(get_current_google_id)):
    """
    Returns aggregated statistics across all completed analyses.
    Used by Dashboard.jsx to populate stats cards, fluency chart, 
    recent sessions sidebar, and grammar errors panel.
    """
    return await get_dashboard_stats(google_id)


@router.get("/history")
async def history(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    google_id: str = Depends(get_current_google_id),
):
    """
    Returns paginated list of completed analyses, newest first.
    Used by History.jsx to render the session list.
    """
    skip = (page - 1) * size
    analyses = await get_analyses_for_user(google_id, limit=size, skip=skip)
    return {
        "page": page,
        "size": size,
        "items": [a.model_dump() for a in analyses],
    }


@router.get("/session/{session_id}")
async def session_detail(
    session_id: str,
    google_id: str = Depends(get_current_google_id),
):
    """
    Returns the full analysis for a specific session.
    Includes status="pending" or status="failed" so the frontend
    can render appropriate loading/error states.
    """
    analysis = await get_analysis_for_session(google_id, session_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found for this session",
        )
    return analysis.model_dump()
