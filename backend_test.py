"""
File: backend_test.py
Project: CrisisMap – Multi-Disaster Tracker

Purpose:
--------
Custom API test harness for CrisisMap backend (FastAPI).

Responsibilities:
- Calls CrisisMap backend endpoints and verifies status codes.
- Confirms correct structure for disaster data (type, severity, coordinates).
- Tests mock disaster initialization, filtering, and summaries.
- Validates real-time earthquake synchronization from USGS.
- Checks Google Maps config availability.

Notes:
- Uses requests.Session for HTTP calls with JSON headers.
- Designed as an integration test runner (not just unit tests).
- Prints human-friendly test output with ✅ / ❌ results.
"""


#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class CrisisMapAPITester:
    def __init__(self, base_url="https://api.crisismap.org"):

        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
           
            """Run a single API test against the CrisisMap backend"""
    # Build the full URL for the API call

        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, params=params, timeout=30)
            elif method == 'POST':
                response = self.session.post(url, json=data, params=params, timeout=30)
            elif method == 'PUT':
                response = self.session.put(url, json=data, params=params, timeout=30)
            elif method == 'DELETE':
                response = self.session.delete(url, params=params, timeout=30)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Expected {expected_status}, got {response.status_code}")
                
                # Try to parse JSON response
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                        if len(response_data) > 0:
                            print(f"   Sample item keys: {list(response_data[0].keys()) if response_data[0] else 'Empty item'}")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                    return success, response_data
                except:
                    print(f"   Response: {response.text[:200]}...")
                    return success, response.text
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:500]}...")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ FAILED - Request timed out after 30 seconds")
            return False, {}
        except requests.exceptions.ConnectionError:
            print(f"❌ FAILED - Connection error")
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_get_disasters(self):
        """Test getting all disasters"""
        return self.run_test("Get All Disasters", "GET", "disasters", 200)

    def test_get_disasters_filtered(self):
        """Test getting disasters filtered by type"""
        success1, data1 = self.run_test("Get Earthquakes Only", "GET", "disasters", 200, params={"disaster_type": "earthquake"})
        success2, data2 = self.run_test("Get Wildfires Only", "GET", "disasters", 200, params={"disaster_type": "wildfire"})
        success3, data3 = self.run_test("Get Floods Only", "GET", "disasters", 200, params={"disaster_type": "flood"})
        return success1 and success2 and success3, [data1, data2, data3]

    def test_disaster_summary(self):
        """Test getting disaster summary statistics"""
        return self.run_test("Get Disaster Summary", "GET", "disasters/summary", 200)

    def test_maps_config(self):
        """Test getting Google Maps configuration"""
        return self.run_test("Get Maps Config", "GET", "maps/config", 200)

    def test_initialize_mock_data(self):
        """Test initializing mock disaster data"""
        return self.run_test("Initialize Mock Data", "POST", "disasters/initialize", 200)

    def test_sync_earthquakes(self):
        """Test syncing real earthquake data from USGS"""
        return self.run_test("Sync USGS Earthquake Data", "POST", "disasters/sync-earthquakes", 200)

    def validate_disaster_structure(self, disasters):
            """Validate that each disaster object has required fields"""

        if not isinstance(disasters, list):
            print("❌ Disasters data is not a list")
            return False
        
        if len(disasters) == 0:
            print("⚠️  No disasters found in response")
            return True
        # Define which fields must be present

        required_fields = ['id', 'disaster_type', 'title', 'description', 'severity', 
                          'latitude', 'longitude', 'location_name', 'timestamp', 'source']
        
        sample_disaster = disasters[0]
        missing_fields = [field for field in required_fields if field not in sample_disaster]
        
        if missing_fields:
            print(f"❌ Missing required fields in disaster data: {missing_fields}")
            return False
        
        # Validate disaster types
        valid_types = ['earthquake', 'wildfire', 'flood', 'tornado', 'air_quality']
        invalid_types = [d['disaster_type'] for d in disasters if d['disaster_type'] not in valid_types]
        if invalid_types:
            print(f"❌ Invalid disaster types found: {set(invalid_types)}")
            return False
        
        # Validate severity levels
        valid_severities = ['low', 'moderate', 'high', 'severe']
        invalid_severities = [d['severity'] for d in disasters if d['severity'] not in valid_severities]
        if invalid_severities:
            print(f"❌ Invalid severity levels found: {set(invalid_severities)}")
            return False
        
        print(f"✅ Disaster data structure is valid ({len(disasters)} disasters)")
        
        # Print summary by type and severity
        type_counts = {}
        severity_counts = {}
        for disaster in disasters:
            dtype = disaster['disaster_type']
            severity = disaster['severity']
            type_counts[dtype] = type_counts.get(dtype, 0) + 1
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        print(f"   Types: {type_counts}")
        print(f"   Severities: {severity_counts}")
        
        return True

def main():
    print("🚨 CrisisMap Multi-Disaster Tracker API Testing")
    print("=" * 60)
    
    tester = CrisisMapAPITester()
    
    # Test 1: Root endpoint
    success, data = tester.test_root_endpoint()
    if not success:
        print("❌ Root endpoint failed - API may be down")
        return 1
    
    # Test 2: Get disasters (might be empty initially)
    success, disasters = tester.test_get_disasters()
    if success:
        tester.validate_disaster_structure(disasters)
    
    # Test 3: Initialize mock data
    success, init_response = tester.test_initialize_mock_data()
    if not success:
        print("❌ Failed to initialize mock data")
        return 1
    
    # Test 4: Get disasters again (should have data now)
    success, disasters_after_init = tester.test_get_disasters()
    if success:
        if tester.validate_disaster_structure(disasters_after_init):
            print(f"✅ Mock data initialization successful")
        else:
            print("❌ Mock data structure validation failed")
    
    # Test 5: Test filtering
    success, filtered_data = tester.test_get_disasters_filtered()
    if success:
        print("✅ Disaster filtering by type works")
    
    # Test 6: Test summary endpoint
    success, summary = tester.test_disaster_summary()
    if success and isinstance(summary, dict):
        print("✅ Disaster summary endpoint works")
    
    # Test 7: Test maps config
    success, maps_config = tester.test_maps_config()
    if success and isinstance(maps_config, dict):
        if 'apiKey' in maps_config:
            print("✅ Maps configuration available")
        else:
            print("⚠️  Maps API key not found in config")
    
    # Test 8: Sync earthquake data (this might take longer)
    print("\n🌍 Testing USGS earthquake data sync (may take 10-15 seconds)...")
    success, sync_response = tester.test_sync_earthquakes()
    if success:
        print("✅ USGS earthquake sync successful")
        
        # Verify earthquake data was synced
        success, earthquakes = tester.run_test("Verify Synced Earthquakes", "GET", "disasters", 200, params={"disaster_type": "earthquake"})
        if success and isinstance(earthquakes, list):
            earthquake_count = len(earthquakes)
            print(f"✅ Found {earthquake_count} earthquakes after sync")
            
            # Check if earthquakes have USGS source
            usgs_earthquakes = [eq for eq in earthquakes if eq.get('source') == 'USGS']
            print(f"   {len(usgs_earthquakes)} earthquakes from USGS source")
    else:
        print("❌ USGS earthquake sync failed")
    
    # Final summary
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED! Backend API is working correctly.")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} test(s) failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 

    # Final summary of all tests
print("\n" + "=" * 60)
print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
