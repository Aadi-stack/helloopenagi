from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.models import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=schemas.AgentConfigResponse)
def create_agent_config(
        agent_config: schemas.AgentConfigCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_agent = models.AgentConfig(
        name=agent_config.name,
        role=agent_config.role,
        goal=agent_config.goal,
        backstory=agent_config.backstory,
        capability=agent_config.capability,
        task=agent_config.task,
        parameters=agent_config.parameters,
        user_id=current_user.id
    )

    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)

    return db_agent


@router.get("/", response_model=List[schemas.AgentConfigResponse])
def list_agent_configs(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    agents = db.query(models.AgentConfig).filter(
        models.AgentConfig.user_id == current_user.id
    ).all()

    return agents


@router.get("/{agent_id}", response_model=schemas.AgentConfigResponse)
def get_agent_config(
        agent_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_agent = db.query(models.AgentConfig).filter(
        models.AgentConfig.id == agent_id,
        models.AgentConfig.user_id == current_user.id
    ).first()

    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent configuration not found")

    return db_agent


@router.put("/{agent_id}", response_model=schemas.AgentConfigResponse)
def update_agent_config(
        agent_id: str,
        agent_config: schemas.AgentConfigCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_agent = db.query(models.AgentConfig).filter(
        models.AgentConfig.id == agent_id,
        models.AgentConfig.user_id == current_user.id
    ).first()

    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent configuration not found")

    # Update fields
    db_agent.name = agent_config.name
    db_agent.role = agent_config.role
    db_agent.goal = agent_config.goal
    db_agent.backstory = agent_config.backstory
    db_agent.capability = agent_config.capability
    db_agent.task = agent_config.task
    db_agent.parameters = agent_config.parameters

    db.commit()
    db.refresh(db_agent)

    return db_agent


@router.delete("/{agent_id}")
def delete_agent_config(
        agent_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_agent = db.query(models.AgentConfig).filter(
        models.AgentConfig.id == agent_id,
        models.AgentConfig.user_id == current_user.id
    ).first()

    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent configuration not found")

    db.delete(db_agent)
    db.commit()

    return {"detail": "Agent configuration deleted successfully"}

