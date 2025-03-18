from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timedelta
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from passlib.context import CryptContext

from backend.database import get_db
from backend.models import User, VerificationToken
from config import settings
from logging_config import logger

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Email configuration
EMAIL_HOST = settings.EMAIL_HOST
EMAIL_PORT = settings.EMAIL_PORT
EMAIL_USER = settings.EMAIL_USER
EMAIL_PASSWORD = settings.EMAIL_PASSWORD
EMAIL_FROM = settings.EMAIL_FROM
FRONTEND_URL = settings.FRONTEND_URL

async def send_email(to_email: str, subject: str, html_content: str):
    """Send an email"""
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = EMAIL_FROM
        message["To"] = to_email
        
        # Create HTML part
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_FROM, to_email, message.as_string())
        
        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False

@router.post("/register")
async def register_user(
    user_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Check if user already exists
    email = user_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = pwd_context.hash(user_data.get("password"))
    new_user = User(
        email=email,
        name=user_data.get("name"),
        password=hashed_password,
        email_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create verification token
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=24)
    
    verification = VerificationToken(
        token=token,
        user_id=new_user.id,
        type="email_verification",
        expires=expires
    )
    db.add(verification)
    db.commit()
    
    # Send verification email
    verification_url = f"{FRONTEND_URL}/verify-email?token={token}"
    html_content = f"""
    <html>
    <body>
        <h2>Verify your email address</h2>
        <p>Thank you for registering with OpenAGI Web App. Please click the link below to verify your email address:</p>
        <p><a href="{verification_url}">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
    </body>
    </html>
    """
    
    background_tasks.add_task(send_email, email, "Verify Your Email Address", html_content)
    
    return {
        "id": new_user.id,
        "email": new_user.email,
        "name": new_user.name,
        "message": "User registered successfully. Please check your email to verify your account."
    }

@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    # Find verification token
    verification = db.query(VerificationToken).filter(
        VerificationToken.token == token,
        VerificationToken.type == "email_verification",
        VerificationToken.expires > datetime.utcnow()
    ).first()
    
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Update user
    user = db.query(User).filter(User.id == verification.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.email_verified = True
    db.commit()
    
    # Delete token
    db.delete(verification)
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.post("/forgot-password")
async def forgot_password(
    request_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    email = request_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Find user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Don't reveal that the user doesn't exist
        return {"message": "If your email is registered, you will receive a password reset link"}
    
    # Create reset token
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=1)
    
    # Delete any existing reset tokens for this user
    db.query(VerificationToken).filter(
        VerificationToken.user_id == user.id,
        VerificationToken.type == "password_reset"
    ).delete()
    db.commit()
    
    # Create new reset token
    reset_token = VerificationToken(
        token=token,
        user_id=user.id,
        type="password_reset",
        expires=expires
    )
    db.add(reset_token)
    db.commit()
    
    # Send reset email
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    html_content = f"""
    <html>
    <body>
        <h2>Reset your password</h2>
        <p>You requested a password reset for your OpenAGI Web App account. Please click the link below to reset your password:</p>
        <p><a href="{reset_url}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
    </body>
    </html>
    """
    
    background_tasks.add_task(send_email, email, "Reset Your Password", html_content)
    
    return {"message": "If your email is registered, you will receive a password reset link"}

@router.post("/reset-password")
async def reset_password(request_data: Dict[str, Any], db: Session = Depends(get_db)):
    token = request_data.get("token")
    new_password = request_data.get("password")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and password are required")
    
    # Find reset token
    reset_token = db.query(VerificationToken).filter(
        VerificationToken.token == token,
        VerificationToken.type == "password_reset",
        VerificationToken.expires > datetime.utcnow()
    ).first()
    
    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Update user password
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password = pwd_context.hash(new_password)
    db.commit()
    
    # Delete token
    db.delete(reset_token)
    db.commit()
    
    return {"message": "Password reset successfully"}

