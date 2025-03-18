from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
from backend.models import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=schemas.StackResponse)
def create_stack(
        stack: schemas.StackCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Convert nodes and edges to JSON strings
    nodes_json = json.dumps([node.dict() for node in stack.nodes])
    edges_json = json.dumps([edge.dict() for edge in stack.edges])

    db_stack = models.Stack(
        name=stack.name,
        description=stack.description,
        nodes=nodes_json,
        edges=edges_json,
        owner_id=current_user.id
    )

    db.add(db_stack)
    db.commit()
    db.refresh(db_stack)

    # Convert JSON strings back to objects for response
    db_stack.nodes = stack.nodes
    db_stack.edges = stack.edges

    return db_stack


@router.get("/", response_model=List[schemas.StackResponse])
def read_stacks(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    stacks = db.query(models.Stack).filter(
        models.Stack.owner_id == current_user.id
    ).offset(skip).limit(limit).all()

    # Convert JSON strings to objects for each stack
    for stack in stacks:
        stack.nodes = json.loads(stack.nodes)
        stack.edges = json.loads(stack.edges)

    return stacks


@router.get("/{stack_id}", response_model=schemas.StackResponse)
def read_stack(
        stack_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_stack = db.query(models.Stack).filter(
        models.Stack.id == stack_id,
        models.Stack.owner_id == current_user.id
    ).first()

    if db_stack is None:
        raise HTTPException(status_code=404, detail="Stack not found")

    # Convert JSON strings to objects
    db_stack.nodes = json.loads(db_stack.nodes)
    db_stack.edges = json.loads(db_stack.edges)

    return db_stack


@router.put("/{stack_id}", response_model=schemas.StackResponse)
def update_stack(
        stack_id: str,
        stack: schemas.StackCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_stack = db.query(models.Stack).filter(
        models.Stack.id == stack_id,
        models.Stack.owner_id == current_user.id
    ).first()

    if db_stack is None:
        raise HTTPException(status_code=404, detail="Stack not found")

    # Convert nodes and edges to JSON strings
    nodes_json = json.dumps([node.dict() for node in stack.nodes])
    edges_json = json.dumps([edge.dict() for edge in stack.edges])

    # Update stack fields
    db_stack.name = stack.name
    db_stack.description = stack.description
    db_stack.nodes = nodes_json
    db_stack.edges = edges_json

    db.commit()
    db.refresh(db_stack)

    # Convert JSON strings back to objects for response
    db_stack.nodes = stack.nodes
    db_stack.edges = stack.edges

    return db_stack


@router.delete("/{stack_id}")
def delete_stack(
        stack_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_stack = db.query(models.Stack).filter(
        models.Stack.id == stack_id,
        models.Stack.owner_id == current_user.id
    ).first()

    if db_stack is None:
        raise HTTPException(status_code=404, detail="Stack not found")

    db.delete(db_stack)
    db.commit()

    return {"detail": "Stack deleted successfully"}

