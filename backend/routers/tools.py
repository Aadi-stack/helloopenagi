from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.models import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=schemas.ToolConfigResponse)
def create_tool_config(
        tool_config: schemas.ToolConfigCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_tool = models.ToolConfig(
        name=tool_config.name,
        tool_type=tool_config.tool_type,
        parameters=tool_config.parameters,
        credentials=tool_config.credentials,
        user_id=current_user.id
    )

    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)

    return db_tool


@router.get("/", response_model=List[schemas.ToolConfigResponse])
def list_tool_configs(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    tools = db.query(models.ToolConfig).filter(
        models.ToolConfig.user_id == current_user.id
    ).all()

    return tools


@router.get("/{tool_id}", response_model=schemas.ToolConfigResponse)
def get_tool_config(
        tool_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_tool = db.query(models.ToolConfig).filter(
        models.ToolConfig.id == tool_id,
        models.ToolConfig.user_id == current_user.id
    ).first()

    if db_tool is None:
        raise HTTPException(status_code=404, detail="Tool configuration not found")

    return db_tool


@router.put("/{tool_id}", response_model=schemas.ToolConfigResponse)
def update_tool_config(
        tool_id: str,
        tool_config: schemas.ToolConfigCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_tool = db.query(models.ToolConfig).filter(
        models.ToolConfig.id == tool_id,
        models.ToolConfig.user_id == current_user.id
    ).first()

    if db_tool is None:
        raise HTTPException(status_code=404, detail="Tool configuration not found")

    # Update fields
    db_tool.name = tool_config.name
    db_tool.tool_type = tool_config.tool_type
    db_tool.parameters = tool_config.parameters

    # Only update credentials if provided
    if tool_config.credentials:
        db_tool.credentials = tool_config.credentials

    db.commit()
    db.refresh(db_tool)

    return db_tool


@router.delete("/{tool_id}")
def delete_tool_config(
        tool_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_tool = db.query(models.ToolConfig).filter(
        models.ToolConfig.id == tool_id,
        models.ToolConfig.user_id == current_user.id
    ).first()

    if db_tool is None:
        raise HTTPException(status_code=404, detail="Tool configuration not found")

    db.delete(db_tool)
    db.commit()

    return {"detail": "Tool configuration deleted successfully"}

