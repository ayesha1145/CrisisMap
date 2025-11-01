"""
File: server.py
Author: [Ayesha Habib]
Project: CrisisMap – Multi-Disaster Tracker

Purpose:
--------
This file defines the main FastAPI application for CrisisMap.
It handles:
- API routes for disaster data
- MongoDB connection
- Mock and live data ingestion (USGS earthquakes)
- Google Maps configuration
- Middleware for frontend access
"""


from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
import asyncio
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# -------------------------------
# ENUMS
# -------------------------------

class DisasterType(str, Enum):

    """
    Enumeration of all disaster categories supported by CrisisMap.

    These values keep the system consistent across:
    - Database records
    - API requests and responses
    - Frontend filtering and visualization
    """

    EARTHQUAKE = "earthquake"
    WILDFIRE = "wildfire"
    FLOOD = "flood"
    TORNADO = "tornado"
    AIR_QUALITY = "air_quality"

class SeverityLevel(str, Enum):

 """
    Standardized severity scale for disasters.

    Used across the system to provide a consistent risk rating:
    - LOW: minimal risk
    - MODERATE: noticeable but limited impact
    - HIGH: significant impact, wider area or population
    - SEVERE: critical event, high threat to life/property
    """

    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"

# Models
class DisasterEvent(BaseModel): 
 
 """
    Schema for a disaster record stored in MongoDB.

    Contains both required fields (id, type, severity, location, etc.)
    and optional fields specific to certain disaster categories
    (magnitude for earthquakes, acres_burned for wildfires, etc.).
    """ 

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    disaster_type: DisasterType
    title: str
    description: str
    severity: SeverityLevel
    latitude: float
    longitude: float
    location_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: str
    magnitude: Optional[float] = None  # For earthquakes
    depth: Optional[float] = None  # For earthquakes
    acres_burned: Optional[float] = None  # For wildfires
    containment: Optional[int] = None  # For wildfires (percentage)
    water_level: Optional[float] = None  # For floods
    wind_speed: Optional[int] = None  # For tornadoes
    aqi_value: Optional[int] = None  # For air quality
    pollutant: Optional[str] = None  # For air quality

class DisasterEventCreate(BaseModel): 
    
    """
    Schema for creating new disaster records.

    Used by POST requests to validate incoming data.
    Shares most fields with DisasterEvent except auto-generated
    ones (id, timestamp, last_updated).
    """

    disaster_type: DisasterType
    title: str
    description: str
    severity: SeverityLevel
    latitude: float
    longitude: float
    location_name: str
    source: str
    magnitude: Optional[float] = None
    depth: Optional[float] = None
    acres_burned: Optional[float] = None
    containment: Optional[int] = None
    water_level: Optional[float] = None
    wind_speed: Optional[int] = None
    aqi_value: Optional[int] = None
    pollutant: Optional[str] = None

# Mock data generator
async def generate_mock_disasters(): 

"""
    Generate mock disaster events for demonstration purposes.

    Currently includes earthquakes, wildfires, floods, tornadoes,
    and air quality alerts. These serve as placeholders until
    official data feeds are integrated.
    """

    mock_disasters = [
        # Earthquakes
        DisasterEventCreate(
            disaster_type=DisasterType.EARTHQUAKE,
            title="M 5.2 Earthquake - 23km NE of Bakersfield, CA",
            description="Moderate earthquake detected with shallow depth",
            severity=SeverityLevel.MODERATE,
            latitude=35.398,
            longitude=-118.843,
            location_name="Bakersfield, California",
            source="USGS",
            magnitude=5.2,
            depth=8.5
        ),
        DisasterEventCreate(
            disaster_type=DisasterType.EARTHQUAKE,
            title="M 3.8 Earthquake - 12km SE of Seattle, WA",
            description="Minor earthquake reported in urban area",
            severity=SeverityLevel.LOW,
            latitude=47.598,
            longitude=-122.331,
            location_name="Seattle, Washington",
            source="USGS",
            magnitude=3.8,
            depth=15.2
        ),
        # Wildfires
        DisasterEventCreate(
            disaster_type=DisasterType.WILDFIRE,
            title="Creek Fire - Fresno County",
            description="Large wildfire burning in mountainous terrain",
            severity=SeverityLevel.HIGH,
            latitude=37.175,
            longitude=-119.267,
            location_name="Fresno County, California",
            source="CAL FIRE",
            acres_burned=45000.0,
            containment=35
        ),
        DisasterEventCreate(
            disaster_type=DisasterType.WILDFIRE,
            title="Pine Ridge Fire - Colorado",
            description="Wildfire threatening residential areas",
            severity=SeverityLevel.SEVERE,
            latitude=40.015,
            longitude=-105.270,
            location_name="Boulder County, Colorado",
            source="Colorado Wildfire Information",
            acres_burned=12500.0,
            containment=10
        ),
        # Floods
        DisasterEventCreate(
            disaster_type=DisasterType.FLOOD,
            title="Mississippi River Flooding - St. Louis",
            description="River levels above flood stage",
            severity=SeverityLevel.MODERATE,
            latitude=38.627,
            longitude=-90.199,
            location_name="St. Louis, Missouri",
            source="USGS Water Resources",
            water_level=35.8
        ),
        # Tornadoes
        DisasterEventCreate(
            disaster_type=DisasterType.TORNADO,
            title="Tornado Warning - Moore, OK",
            description="EF3 tornado confirmed on the ground",
            severity=SeverityLevel.SEVERE,
            latitude=35.349,
            longitude=-97.486,
            location_name="Moore, Oklahoma",
            source="National Weather Service",
            wind_speed=165
        ),
        # Air Quality
        DisasterEventCreate(
            disaster_type=DisasterType.AIR_QUALITY,
            title="Unhealthy Air Quality - Los Angeles Basin",
            description="Poor air quality due to wildfire smoke",
            severity=SeverityLevel.HIGH,
            latitude=34.052,
            longitude=-118.243,
            location_name="Los Angeles, California",
            source="EPA AirNow",
            aqi_value=165,
            pollutant="PM2.5"
        ),
        DisasterEventCreate(
            disaster_type=DisasterType.AIR_QUALITY,
            title="Moderate Air Quality - Denver Metro",
            description="Elevated ozone levels",
            severity=SeverityLevel.MODERATE,
            latitude=39.739,
            longitude=-104.990,
            location_name="Denver, Colorado",
            source="EPA AirNow",
            aqi_value=85,
            pollutant="Ozone"
        )
    ]
    
    return mock_disasters

# USGS Earthquake API integration
async def fetch_usgs_earthquakes():
   
   """
    Fetch earthquake data from the USGS GeoJSON feed (last 7 days).

    Steps:
    1. Call the USGS API.
    2. Parse top 20 events.
    3. Map magnitude → severity.
    4. Normalize into DisasterEventCreate schema.
    """
    # Call the USGS GeoJSON endpoint
    # Parse coordinates: [longitude, latitude, depth]
    # Map magnitude into CrisisMap severity categories 

    try:
        async with httpx.AsyncClient() as client:
            # Get earthquakes from the past 7 days
            response = await client.get(
                "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                earthquakes = []
                
                for feature in data.get('features', [])[:20]:  # Limit to 20 recent earthquakes
                    props = feature['properties']
                    coords = feature['geometry']['coordinates']
                    
                    # Determine severity based on magnitude
                    magnitude = props.get('mag', 0)
                    if magnitude >= 6.0:
                        severity = SeverityLevel.SEVERE
                    elif magnitude >= 4.5:
                        severity = SeverityLevel.HIGH
                    elif magnitude >= 3.0:
                        severity = SeverityLevel.MODERATE
                    else:
                        severity = SeverityLevel.LOW
                    
                    earthquake = DisasterEventCreate(
                        disaster_type=DisasterType.EARTHQUAKE,
                        title=props.get('title', 'Earthquake'),
                        description=f"Magnitude {magnitude} earthquake",
                        severity=severity,
                        latitude=coords[1],
                        longitude=coords[0],
                        location_name=props.get('place', 'Unknown location'),
                        source="USGS",
                        magnitude=magnitude,
                        depth=coords[2] if len(coords) > 2 else None
                    )
                    earthquakes.append(earthquake)
                
                return earthquakes
            
    except Exception as e:
        logging.error(f"Error fetching USGS earthquake data: {e}")
        return []

# API Routes
@api_router.get("/")
async def root(): 

     """Health check endpoint for CrisisMap API."""
     
    return {"message": "CrisisMap API - Multi-Disaster Tracker"}

@api_router.get("/disasters", response_model=List[DisasterEvent])
async def get_disasters(disaster_type: Optional[DisasterType] = None):
    
    """
    Get a list of disasters from MongoDB.

    - Optional query: filter by disaster_type
    - Sorted by most recent timestamp
    - Returns up to 1000 records
    """ 

python
Copy code

    query = {}
    if disaster_type:
        query["disaster_type"] = disaster_type.value
    
    disasters = await db.disasters.find(query).sort("timestamp", -1).to_list(1000)
    return [DisasterEvent(**disaster) for disaster in disasters]

@api_router.post("/disasters", response_model=DisasterEvent)
async def create_disaster(disaster: DisasterEventCreate):
    
     """
    Create a new disaster record.

    Steps:
    1. Validate request body.
    2. Normalize datetime fields.
    3. Insert into MongoDB.
    4. Return the stored record.
    """ 

    disaster_dict = disaster.dict()
    disaster_obj = DisasterEvent(**disaster_dict)
    
    # Convert datetime objects to ISO strings for MongoDB
    disaster_data = disaster_obj.dict()
    if isinstance(disaster_data.get('timestamp'), datetime):
        disaster_data['timestamp'] = disaster_data['timestamp'].isoformat()
    if isinstance(disaster_data.get('last_updated'), datetime):
        disaster_data['last_updated'] = disaster_data['last_updated'].isoformat()
    
    await db.disasters.insert_one(disaster_data)
    return disaster_obj

@api_router.get("/disasters/summary")
async def get_disaster_summary():
    
    """
    Return a summary of disasters grouped by type.

    Includes:
    - Count of records for each disaster type
    - Timestamp of the latest event in each category
    """
    pipeline = [
        {
            "$group": {
                "_id": "$disaster_type",
                "count": {"$sum": 1},
                "latest": {"$max": "$timestamp"}
            }
        }
    ]
    
    summary = await db.disasters.aggregate(pipeline).to_list(10)
    return {"summary": summary}

@api_router.post("/disasters/initialize")
async def initialize_mock_data():
    
     """
    Reset the database and seed with mock data.

    Deletes all existing records and re-populates
    with generated mock disasters.
    """

    try:
        # Clear existing data
        await db.disasters.delete_many({})
        
        # Add mock disasters
        mock_disasters = await generate_mock_disasters()
        for disaster in mock_disasters:
            disaster_obj = DisasterEvent(**disaster.dict())
            disaster_data = disaster_obj.dict()
            
            # Convert datetime objects to ISO strings for MongoDB
            if isinstance(disaster_data.get('timestamp'), datetime):
                disaster_data['timestamp'] = disaster_data['timestamp'].isoformat()
            if isinstance(disaster_data.get('last_updated'), datetime):
                disaster_data['last_updated'] = disaster_data['last_updated'].isoformat()
            
            await db.disasters.insert_one(disaster_data)
        
        return {"message": f"Initialized database with {len(mock_disasters)} mock disasters"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing data: {str(e)}")

@api_router.post("/disasters/sync-earthquakes")
async def sync_earthquake_data():
    
    """
    Sync new earthquake data from USGS.

    Steps:
    - Fetch earthquakes via fetch_usgs_earthquakes()
    - Insert into MongoDB if not already present
    - Return number of new records added
    """

    try:
        # Remove existing earthquake data
        await db.disasters.delete_many({"disaster_type": DisasterType.EARTHQUAKE.value})
        
        # Fetch and store new earthquake data
        earthquakes = await fetch_usgs_earthquakes()
        count = 0
        
        for earthquake in earthquakes:
            disaster_obj = DisasterEvent(**earthquake.dict())
            disaster_data = disaster_obj.dict()
            
            # Convert datetime objects to ISO strings for MongoDB
            if isinstance(disaster_data.get('timestamp'), datetime):
                disaster_data['timestamp'] = disaster_data['timestamp'].isoformat()
            if isinstance(disaster_data.get('last_updated'), datetime):
                disaster_data['last_updated'] = disaster_data['last_updated'].isoformat()
            
            await db.disasters.insert_one(disaster_data)
            count += 1
        
        return {"message": f"Synced {count} earthquake events from USGS"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing earthquake data: {str(e)}")

@api_router.get("/maps/config")
async def get_maps_config():

"""
    Return the Google Maps API key to the frontend.

    Reads key from environment variable and delivers
    it securely to the client.
    """

    return {"apiKey": os.environ.get('GOOGLE_MAPS_API_KEY')}

# Include the router in the main app
app.include_router(api_router)

# Configure CORS middleware
# Allows the React frontend to communicate with this API
# Even when served from different origins (e.g., http://localhost:3000)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():

     """Close MongoDB client cleanly when the server shuts down."""
     
    client.close()#   c o n n e c t e d   U S G S   +   N O A A   A P I   m o c k   i n t e g r a t i o n  
 