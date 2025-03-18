from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.models import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=schemas.LLMConfigResponse)
def create_llm_config(
        llm_config: schemas.LLMConfigCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_llm = models.LLMConfig(
        name=llm_config.name,
        provider=llm_config.provider,
        model=llm_config.model,
        api_key=llm_config.api_key,
        api_base=llm_config.api_base,
        parameters=llm_config.parameters,
        user_id=current_user.id
    )

    db.add(db_llm)
    db.commit()
    db.refresh(db_llm)

    return db_llm


@router.get("/", response_model=List[schemas.LLMConfigResponse])
def list_llm_configs(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    llms = db.query(models.LLMConfig).filter(
        models.LLMConfig.user_id == current_user.id
    ).all()

    return llms


@router.get("/{llm_id}", response_model=schemas.LLMConfigResponse)
def get_llm_config(
        llm_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_llm = db.query(models.LLMConfig).filter(
        models.LLMConfig.id == llm_id,
        models.LLMConfig.user_id == current_user.id
    ).first()

    if db_llm is None:
        raise HTTPException(status_code=404, detail="LLM configuration not found")

    return db_llm


@router.put("/{llm_id}", response_model=schemas.LLMConfigResponse)
def update_llm_config(
        llm_id: str,
        llm_config: schemas.LLMConfigCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_llm = db.query(models.LLMConfig).filter(
        models.LLMConfig.id == llm_id,
        models.LLMConfig.user_id == current_user.id
    ).first()

    if db_llm is None:
        raise HTTPException(status_code=404, detail="LLM configuration not found")

    # Update fields
    db_llm.name = llm_config.name
    db_llm.provider = llm_config.provider
    db_llm.model = llm_config.model

    # Only update API key if provided
    if llm_config.api_key:
        db_llm.api_key = llm_config.api_key

    if llm_config.api_base:
        db_llm.api_base = llm_config.api_base

    db_llm.parameters = llm_config.parameters

    db.commit()
    db.refresh(db_llm)

    return db_llm


@router.delete("/{llm_id}")
def delete_llm_config(
        llm_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_llm = db.query(models.LLMConfig).filter(
        models.LLMConfig.id == llm_id,
        models.LLMConfig.user_id == current_user.id
    ).first()

    if db_llm is None:
        raise HTTPException(status_code=404, detail="LLM configuration not found")

    db.delete(db_llm)
    db.commit()

    return {"detail": "LLM configuration deleted successfully"}

