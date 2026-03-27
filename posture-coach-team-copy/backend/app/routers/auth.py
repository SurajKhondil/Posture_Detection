from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db, User
from ..schemas import SignUpRequest, SignInRequest, TokenResponse
from ..auth_utils import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse)
def signup(data: SignUpRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    try:
        existing_user = db.query(User).filter(User.email == data.email).first()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        user = User(
            name=data.name,
            email=data.email,
            password_hash=hash_password(data.password),
            age=data.age,
            height_cm=data.height_cm,
            weight_kg=data.weight_kg,
            sitting_hours=data.sitting_hours
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"User creation failed: {str(e)}")

    return TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name or "",
        email=user.email,
        age=user.age,
        height_cm=user.height_cm,
        weight_kg=user.weight_kg
    )


@router.post("/signin", response_model=TokenResponse)
def signin(data: SignInRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name or "",
        email=user.email,
        age=user.age,
        height_cm=user.height_cm,
        weight_kg=user.weight_kg
    )


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id, 
        "name": current_user.name, 
        "email": current_user.email,
        "age": current_user.age,
        "height_cm": current_user.height_cm,
        "weight_kg": current_user.weight_kg
    }
