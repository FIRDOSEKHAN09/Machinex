from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'machine_rental')]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'machine-rental-secret-key-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Admin Security Configuration
ADMIN_SECRET_PASSWORD = os.environ.get('ADMIN_SECRET_PASSWORD', 'MachineRentalAdmin@2025Secure')

# Create the main app
app = FastAPI(title="Machine Rental API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserRole:
    ADMIN = "admin"  # App owner - can see everything
    OWNER = "owner"
    USER = "user"
    MANAGER = "manager"

class UserCreate(BaseModel):
    name: str
    phone_or_email: str
    password: str
    role: str  # owner, user, manager

class UserLogin(BaseModel):
    phone_or_email: str
    password: str

class OTPVerify(BaseModel):
    phone_or_email: str
    otp: str

class UserResponse(BaseModel):
    id: str
    name: str
    phone_or_email: str
    role: str
    created_at: datetime
    upi_id: Optional[str] = None
    qr_code_image: Optional[str] = None
    total_machines_owned: Optional[int] = 0

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class MachineCreate(BaseModel):
    model_name: str
    machine_type: str  # excavator, bulldozer, crane, etc.
    engine_capacity: str
    fuel_type: str
    hourly_rate: float
    description: Optional[str] = ""
    city: str
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    operational_radius_km: float = 50  # Default 50km radius
    images: Optional[List[str]] = []  # Array of base64 encoded images

class MachineUpdate(BaseModel):
    model_name: Optional[str] = None
    machine_type: Optional[str] = None
    engine_capacity: Optional[str] = None
    fuel_type: Optional[str] = None
    hourly_rate: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None
    images: Optional[List[str]] = None

class MachineResponse(BaseModel):
    id: str
    owner_id: str
    owner_name: Optional[str] = None  # Added for farmer view
    owner_contact: Optional[str] = None  # Added for farmer view
    model_name: str
    machine_type: str
    engine_capacity: str
    fuel_type: str
    hourly_rate: float
    description: str
    status: str
    city: Optional[str] = None
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    operational_radius_km: Optional[float] = 50
    images: Optional[List[str]] = []  # Array of base64 images
    created_at: datetime

class FuelPricesCreate(BaseModel):
    diesel_price: float
    engine_oil_price: float
    grease_oil_price: float
    hydraulic_oil_price: float

class FuelPricesResponse(BaseModel):
    id: str
    owner_id: str
    diesel_price: float
    engine_oil_price: float
    grease_oil_price: float
    hydraulic_oil_price: float
    updated_at: datetime

class ContractCreate(BaseModel):
    machine_id: str
    renter_name: str
    renter_contact: str
    total_days: int
    advance_amount: float
    total_amount: float
    transport_charges: float = 0
    transport_paid: float = 0
    initial_fuel_filled: bool = False  # Does machine already have fuel?
    initial_fuel_liters: float = 0
    # Negotiation fields
    proposed_hourly_rate: Optional[float] = None
    original_hourly_rate: Optional[float] = None
    negotiation_status: str = "none"  # none, pending, accepted, rejected

class ContractResponse(BaseModel):
    id: str
    machine_id: str
    owner_id: str
    renter_id: Optional[str]
    renter_name: str
    renter_contact: str
    total_days: int
    advance_amount: float
    total_amount: float
    remaining_amount: float
    deductions: float
    start_date: datetime
    status: str  # pending, approved, active, rejected, completed
    approval_status: str = "pending"  # pending, approved, rejected
    supervisor_id: Optional[str] = None
    supervisor_name: Optional[str] = None
    transport_charges: float = 0
    transport_paid: float = 0
    initial_fuel_filled: bool = False
    initial_fuel_liters: float = 0
    # Negotiation fields
    proposed_hourly_rate: Optional[float] = None
    original_hourly_rate: Optional[float] = None
    negotiation_status: str = "none"
    final_agreed_rate: Optional[float] = None
    counter_offer_rate: Optional[float] = None
    created_at: datetime
    machine_name: Optional[str] = None
    machine_type: Optional[str] = None

class DailyLogCreate(BaseModel):
    contract_id: str
    day_number: int
    diesel_filled: float = 0  # Changed from petrol to diesel (HSD)
    diesel_used: float = 0
    diesel_price_snapshot: float = 0  # Market price at time of entry
    engine_oil: float = 0
    grease_oil: float = 0
    hydraulic_oil: float = 0
    filled_by: str  # "owner" or "user"  
    notes: Optional[str] = ""

class DailyLogUpdate(BaseModel):
    diesel_filled: Optional[float] = None
    diesel_used: Optional[float] = None
    diesel_price_snapshot: Optional[float] = None
    engine_oil: Optional[float] = None
    grease_oil: Optional[float] = None
    hydraulic_oil: Optional[float] = None
    filled_by: Optional[str] = None
    notes: Optional[str] = None
    working_hours: Optional[float] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class DailyLogResponse(BaseModel):
    id: str
    contract_id: str
    day_number: int
    start_time: Optional[str]
    end_time: Optional[str]
    working_hours: float
    diesel_filled: float
    diesel_used: float
    diesel_price_snapshot: float
    engine_oil: float
    grease_oil: float
    hydraulic_oil: float
    filled_by: str
    expenses: float
    notes: str
    created_at: datetime

class EngineTimerUpdate(BaseModel):
    contract_id: str
    day_number: int
    action: str  # "start" or "stop"

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    message: str
    notification_type: str
    read: bool
    created_at: datetime


# Diesel Market Price Model
class DieselPriceCreate(BaseModel):
    price_per_liter: float
    city: str = "National Average"

class DieselPriceResponse(BaseModel):
    id: str
    price_per_liter: float
    city: str
    updated_at: datetime

# Consumables Model
class ConsumableCreate(BaseModel):
    contract_id: str
    day_number: int
    consumable_type: str  # engine_oil, hydraulic_oil, grease_oil
    quantity: float
    price_per_unit: float
    filled_by: str  # "owner" or "user" or "supervisor"

class ConsumableResponse(BaseModel):
    id: str
    contract_id: str
    day_number: int
    consumable_type: str
    quantity: float
    price_per_unit: float
    total_cost: float
    filled_by: str
    created_at: datetime

# Supervisor Assignment Model
class SupervisorAssignment(BaseModel):
    contract_id: str
    supervisor_id: str

# Negotiation Action Model
class NegotiationAction(BaseModel):
    action: str  # "accept", "reject", "counter"
    counter_rate: Optional[float] = None  # Required if action is "counter"
    message: Optional[str] = None

# Monthly Report Response
class MonthlyReportResponse(BaseModel):
    month: str  # "2025-01"
    machine_id: str
    machine_name: str
    total_working_hours: float
    diesel_consumed: float
    grease_consumed: float
    engine_oil_used: float
    hydraulic_oil_used: float
    total_earnings: float
    diesel_cost: float
    consumables_cost: float
    net_earnings: float


# Admin Security Models
class AdminPasswordVerify(BaseModel):
    admin_password: str

class AdminInviteCreate(BaseModel):
    invited_phone: str
    invited_name: str

class AdminInviteAccept(BaseModel):
    invite_code: str
    phone_number: str
    full_name: str

class SecurityAlertCreate(BaseModel):
    alert_type: str  # "wrong_password", "unauthorized_access", "impersonation"
    phone_number: str
    device_info: Optional[str] = None
    ip_address: Optional[str] = None


# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def generate_otp():
    """Generate 6-digit OTP"""
    import random
    return str(random.randint(100000, 999999))


# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"phone_or_email": user.phone_or_email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Store pending registration with OTP
    otp_record = {
        "id": str(uuid.uuid4()),
        "phone_or_email": user.phone_or_email,
        "name": user.name,
        "password_hash": hash_password(user.password),
        "role": user.role,
        "otp": "123456",  # Mock OTP for MVP
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    }
    
    await db.pending_registrations.delete_many({"phone_or_email": user.phone_or_email})
    await db.pending_registrations.insert_one(otp_record)
    
    logger.info(f"OTP sent to {user.phone_or_email}: 123456")
    return {"message": "OTP sent successfully", "phone_or_email": user.phone_or_email}

@api_router.post("/auth/verify-otp", response_model=TokenResponse)
async def verify_otp(data: OTPVerify):
    pending = await db.pending_registrations.find_one({"phone_or_email": data.phone_or_email})
    
    if not pending:
        raise HTTPException(status_code=400, detail="No pending registration found")
    
    if pending["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if datetime.utcnow() > pending["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": pending["name"],
        "phone_or_email": pending["phone_or_email"],
        "password_hash": pending["password_hash"],
        "role": pending["role"],
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    await db.pending_registrations.delete_one({"phone_or_email": data.phone_or_email})
    
    # Create default fuel prices for owners
    if pending["role"] == UserRole.OWNER:
        fuel_prices = {
            "id": str(uuid.uuid4()),
            "owner_id": user_id,
            "diesel_price": 100.0,
            "engine_oil_price": 500.0,
            "grease_oil_price": 300.0,
            "hydraulic_oil_price": 400.0,
            "updated_at": datetime.utcnow()
        }
        await db.fuel_prices.insert_one(fuel_prices)
    
    token = create_access_token(user_id, pending["role"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=pending["name"],
            phone_or_email=pending["phone_or_email"],
            role=pending["role"],
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"phone_or_email": data.phone_or_email})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user["id"], user["role"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            name=user["name"],
            phone_or_email=user["phone_or_email"],
            role=user["role"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        phone_or_email=current_user["phone_or_email"],
        role=current_user["role"],
        created_at=current_user["created_at"]
    )

@api_router.post("/auth/forgot-password")
async def forgot_password(data: UserLogin):
    """Request OTP for password reset"""
    user = await db.users.find_one({"phone_or_email": data.phone_or_email})
    if not user:
        # For security, don't reveal if the email/phone exists
        return {"message": "If this account exists, an OTP has been sent"}
    
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Store OTP in pending_registrations collection for reset
    await db.pending_registrations.update_one(
        {"phone_or_email": data.phone_or_email},
        {"$set": {"otp": otp, "expires_at": expires_at, "purpose": "password_reset"}},
        upsert=True
    )
    
    print(f"🔑 Password Reset OTP for {data.phone_or_email}: {otp}")
    return {"message": "OTP sent successfully"}

@api_router.post("/auth/reset-password")
async def reset_password(phone_or_email: str, otp: str, new_password: str):
    """Reset password with OTP verification"""
    pending = await db.pending_registrations.find_one({
        "phone_or_email": phone_or_email,
        "purpose": "password_reset"
    })
    
    if not pending:
        raise HTTPException(status_code=400, detail="No password reset request found")
    
    if pending["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if datetime.utcnow() > pending["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    # Update user's password
    password_hash = hash_password(new_password)
    await db.users.update_one(
        {"phone_or_email": phone_or_email},
        {"$set": {"password_hash": password_hash}}
    )
    
    # Delete the pending reset request
    await db.pending_registrations.delete_one({"phone_or_email": phone_or_email, "purpose": "password_reset"})
    
    return {"message": "Password reset successfully"}



# ==================== ADMIN SECURITY ENDPOINTS (HIDDEN) ====================

async def log_security_alert(alert_type: str, phone_number: str, device_info: str = None, ip_address: str = None):
    """Log security alert and notify all admins"""
    # Log the alert
    alert_id = str(uuid.uuid4())
    alert_doc = {
        "id": alert_id,
        "alert_type": alert_type,
        "phone_number": phone_number,
        "device_info": device_info,
        "ip_address": ip_address,
        "timestamp": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    await db.security_alerts.insert_one(alert_doc)
    
    # Get all admins
    admins = await db.users.find({"role": "admin"}).to_list(100)
    
    # Send notification to all admins
    for admin in admins:
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": admin["id"],
            "message": f"⚠️ SECURITY ALERT: Someone attempted to access Admin Panel\nPhone: {phone_number}\nType: {alert_type}\nTime: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
            "notification_type": "security_alert",
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)
    
    print(f"🚨 SECURITY ALERT: {alert_type} attempt from {phone_number}")

@api_router.post("/auth/verify-admin-access")
async def verify_admin_access(
    data: AdminPasswordVerify,
    current_user: dict = Depends(get_current_user)
):
    """
    Verify admin password - CRITICAL SECURITY ENDPOINT
    This endpoint is called AFTER phone + OTP login
    Returns true only if password matches exactly
    """
    # Check if password matches
    if data.admin_password == ADMIN_SECRET_PASSWORD:
        # Update user role to admin if password is correct
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"role": "admin", "is_primary_admin": current_user.get("is_primary_admin", False)}}
        )
        
        print(f"✅ Admin access granted to {current_user['phone_or_email']}")
        
        # Return new token with admin role
        new_token = create_access_token(current_user["id"], "admin")
        return {
            "success": True,
            "is_admin": True,
            "is_primary_admin": current_user.get("is_primary_admin", False),
            "token": new_token
        }
    else:
        # Wrong password - log security alert
        await log_security_alert(
            "wrong_password",
            current_user.get("phone_or_email", "unknown"),
            device_info=None
        )
        
        print(f"🚨 Wrong admin password attempt: {current_user['phone_or_email']}")
        
        # Return false without any hints
        return {
            "success": False,
            "is_admin": False,
            "message": "Access denied"
        }

@api_router.post("/admin/create-invite")
async def create_admin_invite(
    invite: AdminInviteCreate,
    current_user: dict = Depends(get_current_user)
):
    """Primary admin creates invite for Admin 2"""
    # Only primary admin can create invites
    if not current_user.get("is_primary_admin"):
        await log_security_alert("unauthorized_access", current_user.get("phone_or_email", "unknown"))
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Generate unique invite code
    invite_code = str(uuid.uuid4())[:8].upper()
    
    invite_doc = {
        "id": str(uuid.uuid4()),
        "invite_code": invite_code,
        "invited_phone": invite.invited_phone,
        "invited_name": invite.invited_name,
        "created_by": current_user["id"],
        "status": "pending",  # pending, accepted, expired
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=7)
    }
    
    await db.admin_invites.insert_one(invite_doc)
    
    return {
        "invite_code": invite_code,
        "message": "Admin invite created successfully",
        "expires_in_days": 7
    }

@api_router.post("/admin/accept-invite")
async def accept_admin_invite(data: AdminInviteAccept):
    """Admin 2 accepts invite with name and phone verification"""
    # Find invite
    invite = await db.admin_invites.find_one({
        "invite_code": data.invite_code,
        "status": "pending"
    })
    
    if not invite:
        await log_security_alert("impersonation", data.phone_number, device_info="Invalid invite code")
        raise HTTPException(status_code=404, detail="Invalid or expired invite code")
    
    # Check if expired
    if datetime.utcnow() > invite["expires_at"]:
        await log_security_alert("impersonation", data.phone_number, device_info="Expired invite")
        raise HTTPException(status_code=400, detail="Invite has expired")
    
    # Verify name and phone match
    if (data.phone_number.strip() != invite["invited_phone"].strip() or
        data.full_name.strip().lower() != invite["invited_name"].strip().lower()):
        # Mismatch - security alert!
        await log_security_alert("impersonation", data.phone_number, device_info="Name/phone mismatch")
        raise HTTPException(status_code=403, detail="Verification failed")
    
    # Find user by phone
    user = await db.users.find_one({"phone_or_email": data.phone_number})
    if not user:
        await log_security_alert("impersonation", data.phone_number, device_info="User not found")
        raise HTTPException(status_code=404, detail="User not found. Please register first.")
    
    # Grant admin access
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"role": "admin", "is_primary_admin": False}}
    )
    
    # Mark invite as accepted
    await db.admin_invites.update_one(
        {"id": invite["id"]},
        {"$set": {"status": "accepted", "accepted_at": datetime.utcnow()}}
    )
    
    print(f"✅ Admin 2 access granted to {data.phone_number}")
    
    return {"message": "Admin access granted successfully"}

@api_router.get("/admin/security-alerts")
async def get_security_alerts(current_user: dict = Depends(get_current_user)):
    """Get all security alerts - Primary admin only"""
    if not current_user.get("is_primary_admin"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    alerts = await db.security_alerts.find().sort("created_at", -1).limit(100).to_list(100)
    return alerts



# ==================== MACHINE ENDPOINTS ====================

@api_router.post("/machines", response_model=MachineResponse)
async def create_machine(machine: MachineCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Only owners can add machines")
    
    machine_id = str(uuid.uuid4())
    machine_doc = {
        "id": machine_id,
        "owner_id": current_user["id"],
        "model_name": machine.model_name,
        "machine_type": machine.machine_type,
        "engine_capacity": machine.engine_capacity,
        "fuel_type": machine.fuel_type,
        "hourly_rate": machine.hourly_rate,
        "description": machine.description or "",
        "city": machine.city,
        "gps_latitude": machine.gps_latitude,
        "gps_longitude": machine.gps_longitude,
        "operational_radius_km": machine.operational_radius_km,
        "status": "available",
        "created_at": datetime.utcnow()
    }
    
    await db.machines.insert_one(machine_doc)
    return MachineResponse(**machine_doc)

@api_router.get("/machines", response_model=List[MachineResponse])
async def get_machines(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == UserRole.OWNER:
        machines = await db.machines.find({"owner_id": current_user["id"]}).to_list(1000)
    else:
        # Users and managers can see all available machines
        machines = await db.machines.find({"status": "available"}).to_list(1000)
    
    return [MachineResponse(**m) for m in machines]

@api_router.get("/machines/all", response_model=List[MachineResponse])
async def get_all_machines(current_user: dict = Depends(get_current_user)):
    """Get all machines (for browsing)"""
    machines = await db.machines.find().to_list(1000)
    return [MachineResponse(**m) for m in machines]

@api_router.get("/machines/{machine_id}", response_model=MachineResponse)
async def get_machine(machine_id: str, current_user: dict = Depends(get_current_user)):
    machine = await db.machines.find_one({"id": machine_id})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return MachineResponse(**machine)

@api_router.put("/machines/{machine_id}", response_model=MachineResponse)
async def update_machine(machine_id: str, update: MachineUpdate, current_user: dict = Depends(get_current_user)):
    machine = await db.machines.find_one({"id": machine_id})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    if machine["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        await db.machines.update_one({"id": machine_id}, {"$set": update_data})
    
    updated = await db.machines.find_one({"id": machine_id})
    return MachineResponse(**updated)

@api_router.delete("/machines/{machine_id}")
async def delete_machine(machine_id: str, current_user: dict = Depends(get_current_user)):
    machine = await db.machines.find_one({"id": machine_id})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    if machine["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.machines.delete_one({"id": machine_id})
    return {"message": "Machine deleted"}


@api_router.get("/machines/discover/nearby")
async def discover_machines(
    user_lat: float,
    user_lon: float,
    machine_type: Optional[str] = None,
    max_distance_km: float = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Discover available machines near user location (like Rapido/OLX)
    Uses Haversine formula for distance calculation
    """
    import math
    
    def haversine_distance(lat1, lon1, lat2, lon2):
        """Calculate distance between two points in kilometers"""
        R = 6371  # Earth radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    # Get all available machines
    query = {"status": "available"}
    if machine_type:
        query["machine_type"] = machine_type
    
    machines = await db.machines.find(query).to_list(1000)
    
    # Filter by distance and add distance info
    nearby_machines = []
    for machine in machines:
        if machine.get("gps_latitude") and machine.get("gps_longitude"):
            distance = haversine_distance(
                user_lat, user_lon,
                machine["gps_latitude"], machine["gps_longitude"]
            )
            
            # Check if within operational radius
            operational_radius = machine.get("operational_radius_km", 50)
            if distance <= max_distance_km and distance <= operational_radius:
                # Get owner details
                owner = await db.users.find_one({"id": machine["owner_id"]})
                
                # Count total machines owned by this owner
                total_owned = await db.machines.count_documents({"owner_id": machine["owner_id"]})
                
                machine["distance_km"] = round(distance, 2)
                machine["owner_name"] = owner["name"] if owner else "Unknown"
                machine["owner_contact"] = owner["phone_or_email"] if owner else ""
                machine["owner_total_machines"] = total_owned
                nearby_machines.append(machine)
    
    # Sort by distance
    nearby_machines.sort(key=lambda x: x["distance_km"])
    
    return nearby_machines


# Get owner profile with all their machines
@api_router.get("/owners/{owner_id}/profile")
async def get_owner_profile(owner_id: str, current_user: dict = Depends(get_current_user)):
    """Get owner's profile including all their machines"""
    owner = await db.users.find_one({"id": owner_id})
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    # Get all machines owned by this owner
    machines = await db.machines.find({"owner_id": owner_id}).to_list(1000)
    
    # Get total contracts for this owner
    total_contracts = await db.contracts.count_documents({"owner_id": owner_id})
    active_contracts = await db.contracts.count_documents({"owner_id": owner_id, "status": "active"})
    
    return {
        "id": owner["id"],
        "name": owner["name"],
        "contact": owner["phone_or_email"],
        "upi_id": owner.get("upi_id"),
        "qr_code_image": owner.get("qr_code_image"),
        "total_machines": len(machines),
        "total_contracts": total_contracts,
        "active_contracts": active_contracts,
        "machines": [MachineResponse(**m) for m in machines]
    }

# Get machines with owner details for discovery
@api_router.get("/machines/browse/all")
async def browse_all_machines(current_user: dict = Depends(get_current_user)):
    """Get all available machines with owner details for farmers to browse"""
    machines = await db.machines.find({"status": "available"}).to_list(1000)
    
    result = []
    for machine in machines:
        # Get owner details
        owner = await db.users.find_one({"id": machine["owner_id"]})
        if owner:
            machine["owner_name"] = owner["name"]
            machine["owner_contact"] = owner["phone_or_email"]
            
            # Count total machines owned
            total_machines = await db.machines.count_documents({"owner_id": machine["owner_id"]})
            machine["owner_total_machines"] = total_machines
        
        result.append(MachineResponse(**machine))
    
    return result




# ==================== FUEL PRICES ENDPOINTS ====================

@api_router.get("/fuel-prices", response_model=FuelPricesResponse)
async def get_fuel_prices(current_user: dict = Depends(get_current_user)):
    owner_id = current_user["id"] if current_user["role"] == UserRole.OWNER else None
    
    if owner_id:
        prices = await db.fuel_prices.find_one({"owner_id": owner_id})
    else:
        # Get default prices from any owner or system default
        prices = await db.fuel_prices.find_one()
    
    if not prices:
        # Return default prices
        return FuelPricesResponse(
            id="default",
            owner_id=owner_id or "system",
            diesel_price=100.0,
            engine_oil_price=500.0,
            grease_oil_price=300.0,
            hydraulic_oil_price=400.0,
            updated_at=datetime.utcnow()
        )
    
    return FuelPricesResponse(**prices)

@api_router.put("/fuel-prices", response_model=FuelPricesResponse)
async def update_fuel_prices(prices: FuelPricesCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Only owners can update fuel prices")
    
    existing = await db.fuel_prices.find_one({"owner_id": current_user["id"]})
    
    price_data = {
        "owner_id": current_user["id"],
        "diesel_price": prices.diesel_price,
        "engine_oil_price": prices.engine_oil_price,
        "grease_oil_price": prices.grease_oil_price,
        "hydraulic_oil_price": prices.hydraulic_oil_price,
        "updated_at": datetime.utcnow()
    }
    
    if existing:
        await db.fuel_prices.update_one({"owner_id": current_user["id"]}, {"$set": price_data})
        price_data["id"] = existing["id"]
    else:
        price_data["id"] = str(uuid.uuid4())
        await db.fuel_prices.insert_one(price_data)
    
    return FuelPricesResponse(**price_data)


# ==================== DIESEL MARKET PRICE ENDPOINTS ====================

@api_router.get("/diesel-price", response_model=DieselPriceResponse)
async def get_diesel_price(city: Optional[str] = "National Average"):
    """Get current diesel (HSD) market price"""
    price = await db.diesel_prices.find_one({"city": city})
    
    if not price:
        # Return national average or default
        price = await db.diesel_prices.find_one({"city": "National Average"})
    
    if not price:
        # Create default if none exists
        default_price = {
            "id": str(uuid.uuid4()),
            "price_per_liter": 95.0,  # Default HSD price in INR
            "city": "National Average",
            "updated_at": datetime.utcnow()
        }
        await db.diesel_prices.insert_one(default_price)
        return DieselPriceResponse(**default_price)
    
    return DieselPriceResponse(**price)

@api_router.post("/diesel-price", response_model=DieselPriceResponse)
async def update_diesel_price(price: DieselPriceCreate, current_user: dict = Depends(get_current_user)):
    """Update diesel market price (Admin only)"""
    if current_user["role"] not in ["admin", UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only admin can update diesel prices")
    
    existing = await db.diesel_prices.find_one({"city": price.city})
    
    price_data = {
        "price_per_liter": price.price_per_liter,
        "city": price.city,
        "updated_at": datetime.utcnow()
    }
    
    if existing:
        await db.diesel_prices.update_one({"city": price.city}, {"$set": price_data})
        price_data["id"] = existing["id"]
    else:
        price_data["id"] = str(uuid.uuid4())
        await db.diesel_prices.insert_one(price_data)
    
    return DieselPriceResponse(**price_data)

# ==================== CONSUMABLES ENDPOINTS ====================

@api_router.post("/consumables", response_model=ConsumableResponse)
async def add_consumable(consumable: ConsumableCreate, current_user: dict = Depends(get_current_user)):
    """Add consumable (engine oil, hydraulic oil, grease) to daily log"""
    contract = await db.contracts.find_one({"id": consumable.contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Only owner, renter, or supervisor can add consumables
    is_authorized = (
        current_user["id"] == contract["owner_id"] or
        current_user["id"] == contract["renter_id"] or
        current_user["id"] == contract.get("supervisor_id")
    )
    
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to add consumables")
    
    consumable_id = str(uuid.uuid4())
    total_cost = consumable.quantity * consumable.price_per_unit
    
    consumable_doc = {
        "id": consumable_id,
        "contract_id": consumable.contract_id,
        "day_number": consumable.day_number,
        "consumable_type": consumable.consumable_type,
        "quantity": consumable.quantity,
        "price_per_unit": consumable.price_per_unit,
        "total_cost": total_cost,
        "filled_by": consumable.filled_by,
        "created_at": datetime.utcnow()
    }
    
    await db.consumables.insert_one(consumable_doc)
    
    # If filled by renter, deduct from contract amount
    if consumable.filled_by in ["user", "renter"]:
        await db.contracts.update_one(
            {"id": consumable.contract_id},
            {"$inc": {"deductions": total_cost, "remaining_amount": -total_cost}}
        )
    
    return ConsumableResponse(**consumable_doc)

@api_router.get("/consumables/{contract_id}")
async def get_consumables(contract_id: str, current_user: dict = Depends(get_current_user)):
    """Get all consumables for a contract"""
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    consumables = await db.consumables.find({"contract_id": contract_id}).to_list(1000)
    return consumables


# ==================== CONTRACT ENDPOINTS ====================

@api_router.post("/contracts", response_model=ContractResponse)
async def create_contract(contract: ContractCreate, current_user: dict = Depends(get_current_user)):
    """Create a contract request (Farmer requests, Owner must approve)"""
    machine = await db.machines.find_one({"id": contract.machine_id})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    # Only farmers/users can request contracts
    if current_user["role"] not in [UserRole.USER, "user"]:
        raise HTTPException(status_code=403, detail="Only renters can create contract requests")
    
    owner_id = machine["owner_id"]
    renter_id = current_user["id"]
    
    contract_id = str(uuid.uuid4())
    
    # Determine negotiation status and prepare negotiation fields
    has_negotiation = contract.proposed_hourly_rate is not None and contract.proposed_hourly_rate != contract.original_hourly_rate
    negotiation_status = "pending" if has_negotiation else "none"
    
    contract_doc = {
        "id": contract_id,
        "machine_id": contract.machine_id,
        "owner_id": owner_id,
        "renter_id": renter_id,
        "renter_name": contract.renter_name,
        "renter_contact": contract.renter_contact,
        "total_days": contract.total_days,
        "advance_amount": contract.advance_amount,
        "total_amount": contract.total_amount,
        "remaining_amount": contract.total_amount - contract.advance_amount,
        "deductions": 0,
        "transport_charges": contract.transport_charges,
        "transport_paid": contract.transport_paid,
        "initial_fuel_filled": contract.initial_fuel_filled,
        "initial_fuel_liters": contract.initial_fuel_liters,
        "start_date": datetime.utcnow(),
        "status": "pending",  # Changed: Starts as pending
        "approval_status": "pending",  # Requires owner approval
        "supervisor_id": None,
        "supervisor_name": None,
        # Negotiation fields
        "proposed_hourly_rate": contract.proposed_hourly_rate,
        "original_hourly_rate": contract.original_hourly_rate or machine.get("hourly_rate", 0),
        "negotiation_status": negotiation_status,
        "final_agreed_rate": None,
        "counter_offer_rate": None,
        "created_at": datetime.utcnow()
    }
    
    await db.contracts.insert_one(contract_doc)
    
    # Machine status remains "available" until approved
    
    # Create notification for owner to approve
    if has_negotiation:
        notification_message = f"💰 {contract.renter_name} wants to negotiate the rate for {machine['model_name']}. Proposed: ₹{contract.proposed_hourly_rate}/hr (Original: ₹{contract.original_hourly_rate}/hr)"
    else:
        notification_message = f"🔔 {contract.renter_name} is waiting for approval to rent {machine['model_name']}"
    
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": owner_id,
        "message": notification_message,
        "notification_type": "contract_approval_request",
        "contract_id": contract_id,
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(notification)
    
    contract_doc["machine_name"] = machine["model_name"]
    contract_doc["machine_type"] = machine.get("machine_type", "")
    return ContractResponse(**contract_doc)

@api_router.get("/contracts", response_model=List[ContractResponse])
async def get_contracts(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == UserRole.OWNER:
        contracts = await db.contracts.find({"owner_id": current_user["id"]}).to_list(1000)
    else:
        contracts = await db.contracts.find({"renter_id": current_user["id"]}).to_list(1000)
    
    result = []
    for c in contracts:
        machine = await db.machines.find_one({"id": c["machine_id"]})
        c["machine_name"] = machine["model_name"] if machine else "Unknown"
        result.append(ContractResponse(**c))
    
    return result

@api_router.get("/contracts/{contract_id}", response_model=ContractResponse)
async def get_contract(contract_id: str, current_user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    machine = await db.machines.find_one({"id": contract["machine_id"]})
    contract["machine_name"] = machine["model_name"] if machine else "Unknown"
    return ContractResponse(**contract)

@api_router.put("/contracts/{contract_id}/complete")
async def complete_contract(contract_id: str, current_user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract["owner_id"] != current_user["id"] and current_user["role"] != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.contracts.update_one({"id": contract_id}, {"$set": {"status": "completed"}})
    await db.machines.update_one({"id": contract["machine_id"]}, {"$set": {"status": "available"}})
    
    return {"message": "Contract completed"}

@api_router.delete("/contracts/{contract_id}")
async def delete_contract(contract_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a contract - only owner or admin can delete"""
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Only owner of the machine or admin can delete
    if contract["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this contract")
    
    # Delete associated daily logs
    await db.daily_logs.delete_many({"contract_id": contract_id})
    
    # Update machine status to available if contract was active
    if contract.get("status") == "active":
        await db.machines.update_one(
            {"id": contract["machine_id"]}, 
            {"$set": {"status": "available"}}
        )
    
    # Delete the contract
    await db.contracts.delete_one({"id": contract_id})
    
    return {"message": "Contract deleted successfully"}


@api_router.post("/contracts/{contract_id}/approve")
async def approve_contract(contract_id: str, current_user: dict = Depends(get_current_user)):
    """Owner approves a contract request"""
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Only owner can approve
    if contract["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only machine owner can approve contracts")
    
    if contract["approval_status"] != "pending":
        raise HTTPException(status_code=400, detail="Contract already processed")
    
    # Update contract to approved and active
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "approval_status": "approved",
            "status": "active",
            "start_date": datetime.utcnow()
        }}
    )
    
    # Update machine status to rented
    await db.machines.update_one(
        {"id": contract["machine_id"]},
        {"$set": {"status": "rented"}}
    )
    
    # Notify renter
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": contract["renter_id"],
        "message": f"✅ Your contract request has been approved! You can now start using the machine.",
        "notification_type": "contract_approved",
        "contract_id": contract_id,
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(notification)
    
    return {"message": "Contract approved successfully", "contract_id": contract_id}

@api_router.post("/contracts/{contract_id}/reject")
async def reject_contract(contract_id: str, reason: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Owner rejects a contract request"""
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Only owner can reject
    if contract["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only machine owner can reject contracts")
    
    if contract["approval_status"] != "pending":
        raise HTTPException(status_code=400, detail="Contract already processed")
    
    # Update contract to rejected
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "approval_status": "rejected",
            "status": "rejected"
        }}
    )
    
    # Notify renter
    rejection_msg = f"❌ Your contract request has been rejected."
    if reason:
        rejection_msg += f" Reason: {reason}"
    
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": contract["renter_id"],
        "message": rejection_msg,
        "notification_type": "contract_rejected",
        "contract_id": contract_id,
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(notification)
    
    return {"message": "Contract rejected", "contract_id": contract_id}

@api_router.post("/contracts/{contract_id}/assign-supervisor")
async def assign_supervisor(contract_id: str, assignment: SupervisorAssignment, current_user: dict = Depends(get_current_user)):
    """Owner assigns a supervisor to a contract"""
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Only owner can assign supervisor
    if contract["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only machine owner can assign supervisors")
    
    # Get supervisor details
    supervisor = await db.users.find_one({"id": assignment.supervisor_id})
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor not found")
    
    if supervisor["role"] not in ["manager", "supervisor"]:
        raise HTTPException(status_code=400, detail="User is not a supervisor/manager")
    
    # Update contract with supervisor
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "supervisor_id": assignment.supervisor_id,
            "supervisor_name": supervisor["name"]
        }}
    )
    
    # Notify supervisor
    machine = await db.machines.find_one({"id": contract["machine_id"]})
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": assignment.supervisor_id,
        "message": f"👷 You've been assigned as supervisor for {machine['model_name']} contract",
        "notification_type": "supervisor_assigned",
        "contract_id": contract_id,
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(notification)
    
    return {"message": "Supervisor assigned successfully"}



# ==================== DAILY LOG ENDPOINTS ====================

@api_router.post("/daily-logs", response_model=DailyLogResponse)
async def create_daily_log(log: DailyLogCreate, current_user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": log.contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check if log for this day already exists
    existing = await db.daily_logs.find_one({
        "contract_id": log.contract_id,
        "day_number": log.day_number
    })
    if existing:
        raise HTTPException(status_code=400, detail="Daily log already exists for this day")
    
    # Get fuel prices for expense calculation
    prices = await db.fuel_prices.find_one({"owner_id": contract["owner_id"]})
    if not prices:
        prices = {
            "diesel_price": 100.0,
            "engine_oil_price": 500.0,
            "grease_oil_price": 300.0,
            "hydraulic_oil_price": 400.0
        }
    
    # Calculate expenses
    expenses = (
        log.diesel_filled * prices.get("diesel_price", log.diesel_price_snapshot) +
        log.engine_oil * prices["engine_oil_price"] +
        log.grease_oil * prices["grease_oil_price"] +
        log.hydraulic_oil * prices["hydraulic_oil_price"]
    )
    
    log_id = str(uuid.uuid4())
    log_doc = {
        "id": log_id,
        "contract_id": log.contract_id,
        "day_number": log.day_number,
        "start_time": None,
        "end_time": None,
        "working_hours": 0,
        "diesel_filled": log.diesel_filled,
        "diesel_used": log.diesel_used,
        "diesel_price_snapshot": log.diesel_price_snapshot,
        "engine_oil": log.engine_oil,
        "grease_oil": log.grease_oil,
        "hydraulic_oil": log.hydraulic_oil,
        "filled_by": log.filled_by,
        "expenses": expenses,
        "notes": log.notes or "",
        "created_at": datetime.utcnow()
    }
    
    await db.daily_logs.insert_one(log_doc)
    
    # Update contract deductions if filled by user
    if log.filled_by == "user":
        new_deductions = contract["deductions"] + expenses
        new_remaining = contract["total_amount"] - contract["advance_amount"] - new_deductions
        await db.contracts.update_one(
            {"id": log.contract_id},
            {"$set": {"deductions": new_deductions, "remaining_amount": new_remaining}}
        )
        
        # Notify owner
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": contract["owner_id"],
            "message": f"User filled fuel/oil on Day {log.day_number}. Deducted: ₹{expenses:.2f}",
            "notification_type": "expense",
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)
    
    return DailyLogResponse(**log_doc)

@api_router.get("/daily-logs/{contract_id}", response_model=List[DailyLogResponse])
async def get_daily_logs(contract_id: str, current_user: dict = Depends(get_current_user)):
    logs = await db.daily_logs.find({"contract_id": contract_id}).sort("day_number", 1).to_list(1000)
    return [DailyLogResponse(**log) for log in logs]

@api_router.put("/daily-logs/{log_id}", response_model=DailyLogResponse)
async def update_daily_log(log_id: str, update: DailyLogUpdate, current_user: dict = Depends(get_current_user)):
    log = await db.daily_logs.find_one({"id": log_id})
    if not log:
        raise HTTPException(status_code=404, detail="Daily log not found")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    if update_data:
        # Recalculate expenses if fuel values changed
        contract = await db.contracts.find_one({"id": log["contract_id"]})
        prices = await db.fuel_prices.find_one({"owner_id": contract["owner_id"]})
        if not prices:
            prices = {
                "diesel_price": 100.0,
                "engine_oil_price": 500.0,
                "grease_oil_price": 300.0,
                "hydraulic_oil_price": 400.0
            }
        
        petrol = update_data.get("diesel_filled", log["diesel_filled"])
        engine_oil = update_data.get("engine_oil", log["engine_oil"])
        grease_oil = update_data.get("grease_oil", log["grease_oil"])
        hydraulic_oil = update_data.get("hydraulic_oil", log["hydraulic_oil"])
        
        expenses = (
            petrol * prices["diesel_price"] +
            engine_oil * prices["engine_oil_price"] +
            grease_oil * prices["grease_oil_price"] +
            hydraulic_oil * prices["hydraulic_oil_price"]
        )
        update_data["expenses"] = expenses
        
        await db.daily_logs.update_one({"id": log_id}, {"$set": update_data})
    
    updated = await db.daily_logs.find_one({"id": log_id})
    return DailyLogResponse(**updated)

@api_router.post("/engine-timer", response_model=DailyLogResponse)
async def engine_timer(data: EngineTimerUpdate, current_user: dict = Depends(get_current_user)):
    log = await db.daily_logs.find_one({
        "contract_id": data.contract_id,
        "day_number": data.day_number
    })
    
    if not log:
        # Create a new daily log if doesn't exist
        log_id = str(uuid.uuid4())
        log = {
            "id": log_id,
            "contract_id": data.contract_id,
            "day_number": data.day_number,
            "start_time": None,
            "end_time": None,
            "working_hours": 0,
            "diesel_filled": 0,
            "diesel_used": 0,
            "engine_oil": 0,
            "grease_oil": 0,
            "hydraulic_oil": 0,
            "filled_by": "owner",
            "expenses": 0,
            "notes": "",
            "created_at": datetime.utcnow()
        }
        await db.daily_logs.insert_one(log)
    
    current_time = datetime.utcnow().isoformat()
    
    if data.action == "start":
        await db.daily_logs.update_one(
            {"id": log["id"]},
            {"$set": {"start_time": current_time, "end_time": None}}
        )
    elif data.action == "stop":
        if log["start_time"]:
            start = datetime.fromisoformat(log["start_time"])
            end = datetime.utcnow()
            hours = (end - start).total_seconds() / 3600
            total_hours = log["working_hours"] + hours
            
            await db.daily_logs.update_one(
                {"id": log["id"]},
                {"$set": {
                    "end_time": current_time,
                    "working_hours": round(total_hours, 2)
                }}
            )
    
    updated = await db.daily_logs.find_one({"id": log["id"]})
    return DailyLogResponse(**updated)

# ==================== NOTIFICATION ENDPOINTS ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    return [NotificationResponse(**n) for n in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": notification_id}, {"$set": {"read": True}})
    return {"message": "Notification marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": current_user["id"]}, {"$set": {"read": True}})
    return {"message": "All notifications marked as read"}

# ==================== DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == UserRole.OWNER:
        machines = await db.machines.count_documents({"owner_id": current_user["id"]})
        active_contracts = await db.contracts.count_documents({"owner_id": current_user["id"], "status": "active"})
        total_contracts = await db.contracts.count_documents({"owner_id": current_user["id"]})
        
        # Calculate total earnings
        contracts = await db.contracts.find({"owner_id": current_user["id"], "status": "completed"}).to_list(1000)
        total_earnings = sum(c.get("total_amount", 0) for c in contracts)
        
        return {
            "total_machines": machines,
            "active_contracts": active_contracts,
            "total_contracts": total_contracts,
            "total_earnings": total_earnings
        }
    else:
        active_contracts = await db.contracts.count_documents({"renter_id": current_user["id"], "status": "active"})
        total_contracts = await db.contracts.count_documents({"renter_id": current_user["id"]})
        
        return {
            "active_contracts": active_contracts,
            "total_contracts": total_contracts
        }

@api_router.get("/")
async def root():
    return {"message": "Machine Rental API", "version": "1.0.0"}



@api_router.get("/reports/monthly/{machine_id}")
async def get_monthly_report(
    machine_id: str,
    month: str,  # Format: "2025-01"
    current_user: dict = Depends(get_current_user)
):
    """
    Get monthly summary for a machine (Machine Owner only)
    Aggregates: working hours, diesel consumed, oils used, earnings, costs
    """
    machine = await db.machines.find_one({"id": machine_id})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    # Only owner can view reports
    if machine["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Parse month
    from datetime import datetime
    try:
        year, month_num = map(int, month.split("-"))
        start_date = datetime(year, month_num, 1)
        # Get first day of next month
        if month_num == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month_num + 1, 1)
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    
    # Get all contracts for this machine in the month
    contracts = await db.contracts.find({
        "machine_id": machine_id,
        "start_date": {"$gte": start_date, "$lt": end_date}
    }).to_list(1000)
    
    if not contracts:
        return {
            "month": month,
            "machine_id": machine_id,
            "machine_name": machine["model_name"],
            "total_working_hours": 0,
            "diesel_consumed": 0,
            "grease_consumed": 0,
            "engine_oil_used": 0,
            "hydraulic_oil_used": 0,
            "total_earnings": 0,
            "diesel_cost": 0,
            "consumables_cost": 0,
            "net_earnings": 0
        }
    
    # Aggregate data from contracts
    total_working_hours = 0
    diesel_consumed = 0
    grease_consumed = 0
    engine_oil_used = 0
    hydraulic_oil_used = 0
    total_earnings = 0
    diesel_cost = 0
    consumables_cost = 0
    
    for contract in contracts:
        # Get daily logs for this contract
        daily_logs = await db.daily_logs.find({"contract_id": contract["id"]}).to_list(1000)
        
        for log in daily_logs:
            total_working_hours += log.get("working_hours", 0)
            diesel_consumed += log.get("diesel_filled", 0)
            grease_consumed += log.get("grease_oil", 0)
            engine_oil_used += log.get("engine_oil", 0)
            hydraulic_oil_used += log.get("hydraulic_oil", 0)
            
            # Calculate diesel cost
            diesel_cost += log.get("diesel_filled", 0) * log.get("diesel_price_snapshot", 95)
        
        # Get consumables for this contract
        consumables = await db.consumables.find({"contract_id": contract["id"]}).to_list(1000)
        for cons in consumables:
            consumables_cost += cons.get("total_cost", 0)
        
        # Total earnings from this contract
        total_earnings += contract.get("total_amount", 0)
    
    # Calculate net earnings
    net_earnings = total_earnings - diesel_cost - consumables_cost
    
    return {
        "month": month,
        "machine_id": machine_id,
        "machine_name": machine["model_name"],
        "total_working_hours": round(total_working_hours, 2),
        "diesel_consumed": round(diesel_consumed, 2),
        "grease_consumed": round(grease_consumed, 2),
        "engine_oil_used": round(engine_oil_used, 2),
        "hydraulic_oil_used": round(hydraulic_oil_used, 2),
        "total_earnings": round(total_earnings, 2),
        "diesel_cost": round(diesel_cost, 2),
        "consumables_cost": round(consumables_cost, 2),
        "net_earnings": round(net_earnings, 2)
    }


# ==================== ADMIN ENDPOINTS (App Owner Only) ====================

async def check_admin(current_user: dict):
    """Check if user is admin"""
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

@api_router.get("/admin/overview")
async def admin_overview(current_user: dict = Depends(get_current_user)):
    """Get complete overview for admin dashboard"""
    await check_admin(current_user)
    
    # Get counts
    total_users = await db.users.count_documents({})
    total_owners = await db.users.count_documents({"role": "owner"})
    total_renters = await db.users.count_documents({"role": "user"})
    total_managers = await db.users.count_documents({"role": "manager"})
    total_machines = await db.machines.count_documents({})
    available_machines = await db.machines.count_documents({"status": "available"})
    rented_machines = await db.machines.count_documents({"status": "rented"})
    total_contracts = await db.contracts.count_documents({})
    active_contracts = await db.contracts.count_documents({"status": "active"})
    completed_contracts = await db.contracts.count_documents({"status": "completed"})
    
    # Calculate total revenue
    all_contracts = await db.contracts.find({"status": "completed"}).to_list(10000)
    total_revenue = sum(c.get("total_amount", 0) for c in all_contracts)
    
    # Get machines currently running (engine is ON)
    running_logs = await db.daily_logs.find({
        "start_time": {"$ne": None},
        "end_time": None
    }).to_list(1000)
    
    running_machines_count = len(running_logs)
    
    return {
        "users": {
            "total": total_users,
            "owners": total_owners,
            "renters": total_renters,
            "managers": total_managers
        },
        "machines": {
            "total": total_machines,
            "available": available_machines,
            "rented": rented_machines,
            "running": running_machines_count
        },
        "contracts": {
            "total": total_contracts,
            "active": active_contracts,
            "completed": completed_contracts
        },
        "revenue": {
            "total": total_revenue
        }
    }

@api_router.get("/admin/users")
async def admin_get_all_users(current_user: dict = Depends(get_current_user)):
    """Get all users with their activity"""
    await check_admin(current_user)
    
    users = await db.users.find().sort("created_at", -1).to_list(10000)
    
    result = []
    for user in users:
        # Get user's contracts
        if user["role"] == "owner":
            contracts = await db.contracts.count_documents({"owner_id": user["id"]})
            machines = await db.machines.count_documents({"owner_id": user["id"]})
        else:
            contracts = await db.contracts.count_documents({"renter_id": user["id"]})
            machines = 0
        
        result.append({
            "id": user["id"],
            "name": user["name"],
            "phone_or_email": user["phone_or_email"],
            "role": user["role"],
            "created_at": user["created_at"],
            "total_contracts": contracts,
            "total_machines": machines
        })
    
    return result

@api_router.get("/admin/all-contracts")
async def admin_get_all_contracts(current_user: dict = Depends(get_current_user)):
    """Get all contracts across the platform"""
    await check_admin(current_user)
    
    contracts = await db.contracts.find().sort("created_at", -1).to_list(10000)
    
    result = []
    for c in contracts:
        machine = await db.machines.find_one({"id": c["machine_id"]})
        owner = await db.users.find_one({"id": c["owner_id"]})
        
        # Check if machine is running
        running_log = await db.daily_logs.find_one({
            "contract_id": c["id"],
            "start_time": {"$ne": None},
            "end_time": None
        })
        
        result.append({
            "id": c["id"],
            "machine_name": machine["model_name"] if machine else "Unknown",
            "machine_type": machine["machine_type"] if machine else "Unknown",
            "owner_name": owner["name"] if owner else "Unknown",
            "owner_contact": owner["phone_or_email"] if owner else "",
            "renter_name": c["renter_name"],
            "renter_contact": c["renter_contact"],
            "total_days": c["total_days"],
            "total_amount": c["total_amount"],
            "advance_amount": c["advance_amount"],
            "remaining_amount": c["remaining_amount"],
            "deductions": c["deductions"],
            "status": c["status"],
            "is_machine_running": running_log is not None,
            "start_date": c["start_date"],
            "created_at": c["created_at"]
        })
    
    return result

@api_router.get("/admin/all-machines")
async def admin_get_all_machines(current_user: dict = Depends(get_current_user)):
    """Get all machines with their current status"""
    await check_admin(current_user)
    
    machines = await db.machines.find().sort("created_at", -1).to_list(10000)
    
    result = []
    for m in machines:
        owner = await db.users.find_one({"id": m["owner_id"]})
        
        # Check if machine is currently running
        active_contract = await db.contracts.find_one({
            "machine_id": m["id"],
            "status": "active"
        })
        
        is_running = False
        current_renter = None
        running_hours_today = 0
        
        if active_contract:
            current_renter = active_contract["renter_name"]
            # Check if engine is running
            running_log = await db.daily_logs.find_one({
                "contract_id": active_contract["id"],
                "start_time": {"$ne": None},
                "end_time": None
            })
            is_running = running_log is not None
            
            # Get today's working hours
            today_logs = await db.daily_logs.find({
                "contract_id": active_contract["id"]
            }).to_list(100)
            running_hours_today = sum(log.get("working_hours", 0) for log in today_logs)
        
        result.append({
            "id": m["id"],
            "model_name": m["model_name"],
            "machine_type": m["machine_type"],
            "engine_capacity": m["engine_capacity"],
            "fuel_type": m["fuel_type"],
            "hourly_rate": m["hourly_rate"],
            "status": m["status"],
            "owner_name": owner["name"] if owner else "Unknown",
            "owner_contact": owner["phone_or_email"] if owner else "",
            "is_running": is_running,
            "current_renter": current_renter,
            "total_working_hours": running_hours_today,
            "created_at": m["created_at"]
        })
    
    return result

@api_router.get("/admin/running-machines")
async def admin_get_running_machines(current_user: dict = Depends(get_current_user)):
    """Get all machines that are currently running (engine ON)"""
    await check_admin(current_user)
    
    # Find all logs where engine is running (start_time set but no end_time)
    running_logs = await db.daily_logs.find({
        "start_time": {"$ne": None},
        "end_time": None
    }).to_list(1000)
    
    result = []
    for log in running_logs:
        contract = await db.contracts.find_one({"id": log["contract_id"]})
        if not contract:
            continue
            
        machine = await db.machines.find_one({"id": contract["machine_id"]})
        owner = await db.users.find_one({"id": contract["owner_id"]})
        
        # Calculate running time
        start_time = datetime.fromisoformat(log["start_time"])
        running_seconds = (datetime.utcnow() - start_time).total_seconds()
        running_hours = running_seconds / 3600
        
        result.append({
            "log_id": log["id"],
            "contract_id": contract["id"],
            "machine_id": machine["id"] if machine else None,
            "machine_name": machine["model_name"] if machine else "Unknown",
            "machine_type": machine["machine_type"] if machine else "Unknown",
            "owner_name": owner["name"] if owner else "Unknown",
            "renter_name": contract["renter_name"],
            "day_number": log["day_number"],
            "started_at": log["start_time"],
            "running_hours": round(running_hours, 2),
            "total_hours_today": log["working_hours"] + running_hours
        })
    
    return result

@api_router.get("/admin/recent-activity")
async def admin_get_recent_activity(current_user: dict = Depends(get_current_user)):
    """Get recent activity log"""
    await check_admin(current_user)
    
    activities = []
    
    # Recent user registrations
    recent_users = await db.users.find().sort("created_at", -1).limit(10).to_list(10)
    for user in recent_users:
        activities.append({
            "type": "user_registered",
            "message": f"New {user['role']} registered: {user['name']}",
            "details": {
                "user_id": user["id"],
                "name": user["name"],
                "role": user["role"],
                "contact": user["phone_or_email"]
            },
            "timestamp": user["created_at"]
        })
    
    # Recent contracts
    recent_contracts = await db.contracts.find().sort("created_at", -1).limit(10).to_list(10)
    for contract in recent_contracts:
        machine = await db.machines.find_one({"id": contract["machine_id"]})
        activities.append({
            "type": "contract_created",
            "message": f"New contract: {machine['model_name'] if machine else 'Unknown'} rented to {contract['renter_name']}",
            "details": {
                "contract_id": contract["id"],
                "machine_name": machine["model_name"] if machine else "Unknown",
                "renter_name": contract["renter_name"],
                "total_amount": contract["total_amount"],
                "status": contract["status"]
            },
            "timestamp": contract["created_at"]
        })
    
    # Recent daily logs (engine starts/stops)
    recent_logs = await db.daily_logs.find().sort("created_at", -1).limit(20).to_list(20)
    for log in recent_logs:
        contract = await db.contracts.find_one({"id": log["contract_id"]})
        if contract:
            machine = await db.machines.find_one({"id": contract["machine_id"]})
            if log["start_time"] and not log["end_time"]:
                activities.append({
                    "type": "engine_started",
                    "message": f"Engine started: {machine['model_name'] if machine else 'Unknown'} (Day {log['day_number']})",
                    "details": {
                        "machine_name": machine["model_name"] if machine else "Unknown",
                        "renter_name": contract["renter_name"],
                        "day_number": log["day_number"]
                    },
                    "timestamp": datetime.fromisoformat(log["start_time"]) if log["start_time"] else log["created_at"]
                })
            elif log["end_time"]:
                activities.append({
                    "type": "engine_stopped",
                    "message": f"Engine stopped: {machine['model_name'] if machine else 'Unknown'} ({log['working_hours']:.1f}h)",
                    "details": {
                        "machine_name": machine["model_name"] if machine else "Unknown",
                        "working_hours": log["working_hours"],
                        "day_number": log["day_number"]
                    },
                    "timestamp": datetime.fromisoformat(log["end_time"]) if log["end_time"] else log["created_at"]
                })
    
    # Sort by timestamp
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return activities[:50]

@api_router.get("/admin/daily-logs-all")
async def admin_get_all_daily_logs(current_user: dict = Depends(get_current_user)):
    """Get all daily logs with full details"""
    await check_admin(current_user)
    
    logs = await db.daily_logs.find().sort("created_at", -1).to_list(10000)
    
    result = []
    for log in logs:
        contract = await db.contracts.find_one({"id": log["contract_id"]})
        machine = None
        owner_name = "Unknown"
        
        if contract:
            machine = await db.machines.find_one({"id": contract["machine_id"]})
            owner = await db.users.find_one({"id": contract["owner_id"]})
            owner_name = owner["name"] if owner else "Unknown"
        
        result.append({
            "id": log["id"],
            "contract_id": log["contract_id"],
            "machine_name": machine["model_name"] if machine else "Unknown",
            "owner_name": owner_name,
            "renter_name": contract["renter_name"] if contract else "Unknown",
            "day_number": log["day_number"],
            "start_time": log["start_time"],
            "end_time": log["end_time"],
            "working_hours": log["working_hours"],
            "diesel_filled": log["diesel_filled"],
            "diesel_used": log["diesel_used"],
            "engine_oil": log["engine_oil"],
            "grease_oil": log["grease_oil"],
            "hydraulic_oil": log["hydraulic_oil"],
            "filled_by": log["filled_by"],
            "expenses": log["expenses"],
            "is_running": log["start_time"] is not None and log["end_time"] is None,
            "created_at": log["created_at"]
        })
    
    return result

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
