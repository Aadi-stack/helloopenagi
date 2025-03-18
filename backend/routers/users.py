from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.models import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user, get_password_hash

router = APIRouter()


@router.get("/", response_model=List[schemas.UserResponse])
def read_users(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Only admins should be able to list all users
    # This is a placeholder for admin check
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(
        user_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Users should only be able to access their own data
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
        user_id: str,
        user: schemas.UserBase,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Users should only be able to update their own data
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Update user fields
    for key, value in user.dict(exclude_unset=True).items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/api-keys", response_model=schemas.APIKeyResponse)
def create_api_key(
        api_key: schemas.APIKeyCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    import secrets
    import datetime

    # Generate a secure API key
    key = f"sk-{secrets.token_hex(24)}"

    # Create API key with 1 year expiration
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=365)

    db_api_key = models.APIKey(
        key=key,
        name=api_key.name,
        user_id=current_user.id,
        expires_at=expires_at
    )

    db.add(db_api_key)
    db.commit()
    db.refresh(db_api_key)

    return db_api_key


@router.get("/api-keys", response_model=List[schemas.APIKeyResponse])
def list_api_keys(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    api_keys = db.query(models.APIKey).filter(models.APIKey.user_id == current_user.id).all()
    return api_keys


@router.delete("/api-keys/{key_id}")
def delete_api_key(
        key_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_api_key = db.query(models.APIKey).filter(
        models.APIKey.id == key_id,
        models.APIKey.user_id == current_user.id
    ).first()

    if db_api_key is None:
        raise HTTPException(status_code=404, detail="API key not found")

    db.delete(db_api_key)
    db.commit()

    return {"detail": "API key deleted successfully"}

