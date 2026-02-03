#!/usr/bin/env python3
"""
Machine Rental Management API Backend Test Suite
Tests all API endpoints with complete workflow
"""

import requests
import json
import time
from datetime import datetime
import sys

# Backend URL from frontend .env
BACKEND_URL = "https://machinehub-5.preview.emergentagent.com/api"

class MachineRentalAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.owner_token = None
        self.user_token = None
        self.machine_id = None
        self.contract_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        })
        
    def make_request(self, method, endpoint, data=None, headers=None, token=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {"Content-Type": "application/json"}
            
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
            
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("\n=== Testing Authentication Flow ===")
        
        # Test 1: Register Owner
        owner_data = {
            "name": "John Smith",
            "phone_or_email": "john.smith@example.com",
            "password": "securepass123",
            "role": "owner"
        }
        
        response = self.make_request("POST", "/auth/register", owner_data)
        if response and response.status_code == 200:
            self.log_test("Owner Registration", True, "Owner registered successfully")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Owner Registration", False, f"Failed: {error_msg}")
            return False
            
        # Test 2: Verify OTP for Owner
        otp_data = {
            "phone_or_email": "john.smith@example.com",
            "otp": "123456"
        }
        
        response = self.make_request("POST", "/auth/verify-otp", otp_data)
        if response and response.status_code == 200:
            data = response.json()
            self.owner_token = data.get("access_token")
            self.log_test("Owner OTP Verification", True, "OTP verified, token received")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Owner OTP Verification", False, f"Failed: {error_msg}")
            return False
            
        # Test 3: Register User
        user_data = {
            "name": "Alice Johnson",
            "phone_or_email": "alice.johnson@example.com", 
            "password": "userpass456",
            "role": "user"
        }
        
        response = self.make_request("POST", "/auth/register", user_data)
        if response and response.status_code == 200:
            self.log_test("User Registration", True, "User registered successfully")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("User Registration", False, f"Failed: {error_msg}")
            
        # Test 4: Verify OTP for User
        user_otp_data = {
            "phone_or_email": "alice.johnson@example.com",
            "otp": "123456"
        }
        
        response = self.make_request("POST", "/auth/verify-otp", user_otp_data)
        if response and response.status_code == 200:
            data = response.json()
            self.user_token = data.get("access_token")
            self.log_test("User OTP Verification", True, "User OTP verified, token received")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("User OTP Verification", False, f"Failed: {error_msg}")
            
        # Test 5: Login Owner
        login_data = {
            "phone_or_email": "john.smith@example.com",
            "password": "securepass123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if response and response.status_code == 200:
            data = response.json()
            self.owner_token = data.get("access_token")
            self.log_test("Owner Login", True, "Owner login successful")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Owner Login", False, f"Failed: {error_msg}")
            
        # Test 6: Get Current User Profile
        response = self.make_request("GET", "/auth/me", token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Get User Profile", True, f"Profile retrieved: {data.get('name')}")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get User Profile", False, f"Failed: {error_msg}")
            
        return self.owner_token is not None
    
    def test_machines(self):
        """Test machine management endpoints"""
        print("\n=== Testing Machine Management ===")
        
        if not self.owner_token:
            self.log_test("Machine Tests", False, "No owner token available")
            return False
            
        # Test 1: Add Machine
        machine_data = {
            "model_name": "CAT 320D Excavator",
            "machine_type": "excavator",
            "engine_capacity": "6.4L",
            "fuel_type": "diesel",
            "hourly_rate": 2500.0,
            "daily_rate": 18000.0,
            "description": "Heavy duty excavator for construction work"
        }
        
        response = self.make_request("POST", "/machines", machine_data, token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            self.machine_id = data.get("id")
            self.log_test("Add Machine", True, f"Machine added: {data.get('model_name')}")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Add Machine", False, f"Failed: {error_msg}")
            return False
            
        # Test 2: Get Owner's Machines
        response = self.make_request("GET", "/machines", token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Get Owner Machines", True, f"Retrieved {len(data)} machines")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Owner Machines", False, f"Failed: {error_msg}")
            
        # Test 3: Get All Machines
        response = self.make_request("GET", "/machines/all", token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Get All Machines", True, f"Retrieved {len(data)} total machines")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get All Machines", False, f"Failed: {error_msg}")
            
        # Test 4: Get Single Machine
        if self.machine_id:
            response = self.make_request("GET", f"/machines/{self.machine_id}", token=self.owner_token)
            if response and response.status_code == 200:
                data = response.json()
                self.log_test("Get Single Machine", True, f"Retrieved machine: {data.get('model_name')}")
            else:
                error_msg = response.text if response else "No response"
                self.log_test("Get Single Machine", False, f"Failed: {error_msg}")
                
        return self.machine_id is not None
    
    def test_contracts(self):
        """Test contract management endpoints"""
        print("\n=== Testing Contract Management ===")
        
        if not self.owner_token or not self.machine_id:
            self.log_test("Contract Tests", False, "Missing owner token or machine ID")
            return False
            
        # Test 1: Create Contract
        contract_data = {
            "machine_id": self.machine_id,
            "renter_name": "Construction Corp Ltd",
            "renter_contact": "+91-9876543210",
            "total_days": 15,
            "advance_amount": 50000.0,
            "total_amount": 270000.0
        }
        
        response = self.make_request("POST", "/contracts", contract_data, token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            self.contract_id = data.get("id")
            self.log_test("Create Contract", True, f"Contract created for {data.get('renter_name')}")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Create Contract", False, f"Failed: {error_msg}")
            return False
            
        # Test 2: Get All Contracts
        response = self.make_request("GET", "/contracts", token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Get Contracts", True, f"Retrieved {len(data)} contracts")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Contracts", False, f"Failed: {error_msg}")
            
        # Test 3: Get Single Contract
        if self.contract_id:
            response = self.make_request("GET", f"/contracts/{self.contract_id}", token=self.owner_token)
            if response and response.status_code == 200:
                data = response.json()
                self.log_test("Get Single Contract", True, f"Retrieved contract for {data.get('renter_name')}")
            else:
                error_msg = response.text if response else "No response"
                self.log_test("Get Single Contract", False, f"Failed: {error_msg}")
                
        return self.contract_id is not None
    
    def test_daily_logs(self):
        """Test daily log management endpoints"""
        print("\n=== Testing Daily Log Management ===")
        
        if not self.owner_token or not self.contract_id:
            self.log_test("Daily Log Tests", False, "Missing owner token or contract ID")
            return False
            
        # Test 1: Create Daily Log
        log_data = {
            "contract_id": self.contract_id,
            "day_number": 1,
            "petrol_filled": 50.0,
            "petrol_used": 45.0,
            "engine_oil": 2.0,
            "grease_oil": 1.0,
            "hydraulic_oil": 3.0,
            "filled_by": "owner",
            "notes": "First day of operation, machine running smoothly"
        }
        
        response = self.make_request("POST", "/daily-logs", log_data, token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            log_id = data.get("id")
            self.log_test("Create Daily Log", True, f"Daily log created for day {data.get('day_number')}")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Create Daily Log", False, f"Failed: {error_msg}")
            return False
            
        # Test 2: Get Daily Logs for Contract
        response = self.make_request("GET", f"/daily-logs/{self.contract_id}", token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Get Daily Logs", True, f"Retrieved {len(data)} daily logs")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Daily Logs", False, f"Failed: {error_msg}")
            
        # Test 3: Update Daily Log
        if log_id:
            update_data = {
                "working_hours": 8.5,
                "notes": "Updated: Machine worked 8.5 hours today"
            }
            
            response = self.make_request("PUT", f"/daily-logs/{log_id}", update_data, token=self.owner_token)
            if response and response.status_code == 200:
                data = response.json()
                self.log_test("Update Daily Log", True, f"Daily log updated with {data.get('working_hours')} hours")
            else:
                error_msg = response.text if response else "No response"
                self.log_test("Update Daily Log", False, f"Failed: {error_msg}")
                
        return True
    
    def test_engine_timer(self):
        """Test engine timer functionality"""
        print("\n=== Testing Engine Timer ===")
        
        if not self.owner_token or not self.contract_id:
            self.log_test("Engine Timer Tests", False, "Missing owner token or contract ID")
            return False
            
        # Test 1: Start Engine Timer
        timer_data = {
            "contract_id": self.contract_id,
            "day_number": 2,
            "action": "start"
        }
        
        response = self.make_request("POST", "/engine-timer", timer_data, token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Start Engine Timer", True, f"Engine timer started for day {data.get('day_number')}")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Start Engine Timer", False, f"Failed: {error_msg}")
            
        # Wait a moment to simulate work time
        time.sleep(2)
        
        # Test 2: Stop Engine Timer
        timer_data["action"] = "stop"
        
        response = self.make_request("POST", "/engine-timer", timer_data, token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            working_hours = data.get("working_hours", 0)
            self.log_test("Stop Engine Timer", True, f"Engine timer stopped, total hours: {working_hours}")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Stop Engine Timer", False, f"Failed: {error_msg}")
            
        return True
    
    def test_fuel_prices(self):
        """Test fuel price management"""
        print("\n=== Testing Fuel Price Management ===")
        
        if not self.owner_token:
            self.log_test("Fuel Price Tests", False, "Missing owner token")
            return False
            
        # Test 1: Get Current Fuel Prices
        response = self.make_request("GET", "/fuel-prices", token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Get Fuel Prices", True, f"Retrieved fuel prices: Petrol ₹{data.get('petrol_price')}")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Fuel Prices", False, f"Failed: {error_msg}")
            
        # Test 2: Update Fuel Prices
        price_data = {
            "petrol_price": 105.0,
            "engine_oil_price": 520.0,
            "grease_oil_price": 310.0,
            "hydraulic_oil_price": 420.0
        }
        
        response = self.make_request("PUT", "/fuel-prices", price_data, token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Update Fuel Prices", True, f"Fuel prices updated: Petrol ₹{data.get('petrol_price')}")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Update Fuel Prices", False, f"Failed: {error_msg}")
            
        return True
    
    def test_dashboard_notifications(self):
        """Test dashboard and notification endpoints"""
        print("\n=== Testing Dashboard & Notifications ===")
        
        if not self.owner_token:
            self.log_test("Dashboard Tests", False, "Missing owner token")
            return False
            
        # Test 1: Get Dashboard Stats
        response = self.make_request("GET", "/dashboard/stats", token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Get Dashboard Stats", True, f"Stats: {data.get('total_machines')} machines, {data.get('active_contracts')} active contracts")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Dashboard Stats", False, f"Failed: {error_msg}")
            
        # Test 2: Get Notifications
        response = self.make_request("GET", "/notifications", token=self.owner_token)
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Get Notifications", True, f"Retrieved {len(data)} notifications")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Notifications", False, f"Failed: {error_msg}")
            
        return True
    
    def test_complete_contract(self):
        """Test contract completion"""
        print("\n=== Testing Contract Completion ===")
        
        if not self.owner_token or not self.contract_id:
            self.log_test("Contract Completion", False, "Missing owner token or contract ID")
            return False
            
        response = self.make_request("PUT", f"/contracts/{self.contract_id}/complete", token=self.owner_token)
        if response and response.status_code == 200:
            self.log_test("Complete Contract", True, "Contract completed successfully")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Complete Contract", False, f"Failed: {error_msg}")
            
        return True
    
    def test_machine_deletion(self):
        """Test machine deletion"""
        print("\n=== Testing Machine Deletion ===")
        
        if not self.owner_token or not self.machine_id:
            self.log_test("Machine Deletion", False, "Missing owner token or machine ID")
            return False
            
        response = self.make_request("DELETE", f"/machines/{self.machine_id}", token=self.owner_token)
        if response and response.status_code == 200:
            self.log_test("Delete Machine", True, "Machine deleted successfully")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Delete Machine", False, f"Failed: {error_msg}")
            
        return True
    
    def run_all_tests(self):
        """Run complete test suite"""
        print(f"🚀 Starting Machine Rental API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run tests in sequence
        auth_success = self.test_auth_flow()
        if auth_success:
            self.test_machines()
            self.test_contracts()
            self.test_daily_logs()
            self.test_engine_timer()
            self.test_fuel_prices()
            self.test_dashboard_notifications()
            self.test_complete_contract()
            self.test_machine_deletion()
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        return passed, total, failed_tests

if __name__ == "__main__":
    tester = MachineRentalAPITester()
    passed, total, failed_tests = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if failed_tests:
        sys.exit(1)
    else:
        print("\n🎉 All tests passed!")
        sys.exit(0)