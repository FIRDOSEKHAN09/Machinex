#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Machine Rental Management Platform
Tests all critical endpoints with realistic data and complete workflow
"""

import requests
import json
import time
from datetime import datetime
import os
import uuid

# Get backend URL from environment
BACKEND_URL = "https://machinehub-5.preview.emergentagent.com/api"

class MachineRentalTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.tokens = {}
        self.users = {}
        self.machines = {}
        self.contracts = {}
        self.notifications = {}
        self.test_results = []
        
        # Generate unique identifiers for this test run
        self.test_id = uuid.uuid4().hex[:8]
        self.owner_email = f"owner_{self.test_id}@example.com"
        self.farmer_email = f"farmer_{self.test_id}@example.com"
        self.supervisor_email = f"supervisor_{self.test_id}@example.com"
        
    def log_test(self, test_name, success, message="", data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "data": data
        })
        
    def make_request(self, method, endpoint, data=None, token=None, params=None):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method == "GET":
                response = self.session.get(url, headers=headers, params=params, timeout=30)
            elif method == "POST":
                response = self.session.post(url, headers=headers, json=data, timeout=30)
            elif method == "PUT":
                response = self.session.put(url, headers=headers, json=data, timeout=30)
            elif method == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            print(f"DEBUG: {method} {url} -> {response.status_code}")
            if response.status_code >= 400:
                print(f"DEBUG: Error response: {response.text}")
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            return None

    def test_authentication_flow(self):
        """Test complete authentication flow"""
        print("\n=== TESTING AUTHENTICATION FLOW ===")
        
        # Test 1: Register Owner
        owner_data = {
            "name": "Rajesh Kumar",
            "phone_or_email": self.owner_email,
            "password": "SecurePass123",
            "role": "owner"
        }
        
        response = self.make_request("POST", "/auth/register", owner_data)
        if response and response.status_code == 200:
            self.log_test("Owner Registration", True, "Owner registration successful")
        else:
            self.log_test("Owner Registration", False, f"Failed: {response.status_code if response else 'No response'}")
            return False
            
        # Test 2: Verify OTP for Owner
        otp_data = {
            "phone_or_email": self.owner_email,
            "otp": "123456"
        }
        
        response = self.make_request("POST", "/auth/verify-otp", otp_data)
        if response and response.status_code == 200:
            result = response.json()
            self.tokens["owner"] = result["access_token"]
            self.users["owner"] = result["user"]
            self.log_test("Owner OTP Verification", True, "OTP verified, token received")
        else:
            self.log_test("Owner OTP Verification", False, f"Failed: {response.status_code if response else 'No response'}")
            return False
            
        # Test 3: Register Farmer
        farmer_data = {
            "name": "Suresh Patel",
            "phone_or_email": self.farmer_email, 
            "password": "FarmPass456",
            "role": "user"
        }
        
        response = self.make_request("POST", "/auth/register", farmer_data)
        if response and response.status_code == 200:
            self.log_test("Farmer Registration", True, "Farmer registration successful")
        else:
            self.log_test("Farmer Registration", False, f"Failed: {response.status_code if response else 'No response'}")
            return False
            
        # Test 4: Verify OTP for Farmer
        otp_data = {
            "phone_or_email": self.farmer_email,
            "otp": "123456"
        }
        
        response = self.make_request("POST", "/auth/verify-otp", otp_data)
        if response and response.status_code == 200:
            result = response.json()
            self.tokens["farmer"] = result["access_token"]
            self.users["farmer"] = result["user"]
            self.log_test("Farmer OTP Verification", True, "OTP verified, token received")
        else:
            self.log_test("Farmer OTP Verification", False, f"Failed: {response.status_code if response else 'No response'}")
            return False
            
        # Test 5: Register Supervisor
        supervisor_data = {
            "name": "Amit Singh",
            "phone_or_email": self.supervisor_email,
            "password": "SuperPass789",
            "role": "manager"
        }
        
        response = self.make_request("POST", "/auth/register", supervisor_data)
        if response and response.status_code == 200:
            self.log_test("Supervisor Registration", True, "Supervisor registration successful")
        else:
            self.log_test("Supervisor Registration", False, f"Failed: {response.status_code if response else 'No response'}")
            return False
            
        # Test 6: Verify OTP for Supervisor
        otp_data = {
            "phone_or_email": self.supervisor_email,
            "otp": "123456"
        }
        
        response = self.make_request("POST", "/auth/verify-otp", otp_data)
        if response and response.status_code == 200:
            result = response.json()
            self.tokens["supervisor"] = result["access_token"]
            self.users["supervisor"] = result["user"]
            self.log_test("Supervisor OTP Verification", True, "OTP verified, token received")
        else:
            self.log_test("Supervisor OTP Verification", False, f"Failed: {response.status_code if response else 'No response'}")
            return False
            
        # Test 7: Login Test
        login_data = {
            "phone_or_email": self.owner_email,
            "password": "SecurePass123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if response and response.status_code == 200:
            self.log_test("Login Test", True, "Login successful")
        else:
            self.log_test("Login Test", False, f"Failed: {response.status_code if response else 'No response'}")
            
        # Test 8: Forgot Password
        forgot_data = {
            "phone_or_email": self.owner_email,
            "password": "dummy"  # Required by UserLogin model but not used
        }
        
        response = self.make_request("POST", "/auth/forgot-password", forgot_data)
        if response and response.status_code == 200:
            self.log_test("Forgot Password", True, "OTP sent for password reset")
        else:
            self.log_test("Forgot Password", False, f"Failed: {response.status_code if response else 'No response'}")
            
        return True

    def test_machine_management(self):
        """Test machine management endpoints"""
        print("\n=== TESTING MACHINE MANAGEMENT ===")
        
        if "owner" not in self.tokens:
            self.log_test("Machine Management", False, "No owner token available")
            return False
            
        # Test 1: Create Machine with Images
        machine_data = {
            "model_name": "JCB 3DX Super",
            "machine_type": "excavator",
            "engine_capacity": "74 HP",
            "fuel_type": "diesel",
            "hourly_rate": 1200.0,
            "description": "Heavy duty excavator for construction and farming work",
            "city": "Pune",
            "gps_latitude": 18.5204,
            "gps_longitude": 73.8567,
            "operational_radius_km": 75,
            "images": [
                "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            ]
        }
        
        response = self.make_request("POST", "/machines", machine_data, self.tokens["owner"])
        if response and response.status_code == 200:
            result = response.json()
            self.machines["jcb"] = result
            self.log_test("Create Machine", True, f"Machine created: {result['model_name']}")
        else:
            self.log_test("Create Machine", False, f"Failed: {response.status_code if response else 'No response'}")
            return False
            
        # Test 2: Get All Machines (Owner View)
        response = self.make_request("GET", "/machines", token=self.tokens["owner"])
        if response and response.status_code == 200:
            machines = response.json()
            self.log_test("Get Owner Machines", True, f"Retrieved {len(machines)} machines")
        else:
            self.log_test("Get Owner Machines", False, f"Failed: {response.status_code if response else 'No response'}")
            
        # Test 3: Browse All Machines (Farmer Discovery)
        response = self.make_request("GET", "/machines/browse/all", token=self.tokens["farmer"])
        if response and response.status_code == 200:
            machines = response.json()
            self.log_test("Browse All Machines", True, f"Found {len(machines)} available machines")
        else:
            self.log_test("Browse All Machines", False, f"Failed: {response.status_code if response else 'No response'}")
            
        # Test 4: Get Single Machine
        if "jcb" in self.machines:
            machine_id = self.machines["jcb"]["id"]
            response = self.make_request("GET", f"/machines/{machine_id}", token=self.tokens["farmer"])
            if response and response.status_code == 200:
                machine = response.json()
                self.log_test("Get Single Machine", True, f"Retrieved machine: {machine['model_name']}")
            else:
                self.log_test("Get Single Machine", False, f"Failed: {response.status_code if response else 'No response'}")
                
        # Test 5: Update Machine
        if "jcb" in self.machines:
            machine_id = self.machines["jcb"]["id"]
            update_data = {
                "hourly_rate": 1300.0,
                "description": "Updated: Heavy duty excavator with latest features"
            }
            response = self.make_request("PUT", f"/machines/{machine_id}", update_data, self.tokens["owner"])
            if response and response.status_code == 200:
                self.log_test("Update Machine", True, "Machine updated successfully")
            else:
                self.log_test("Update Machine", False, f"Failed: {response.status_code if response else 'No response'}")
                
        return True

    def test_owner_endpoints(self):
        """Test owner profile endpoints"""
        print("\n=== TESTING OWNER ENDPOINTS ===")
        
        if "owner" not in self.users:
            self.log_test("Owner Endpoints", False, "No owner user available")
            return False
            
        # Test: Get Owner Profile with All Machines
        owner_id = self.users["owner"]["id"]
        response = self.make_request("GET", f"/owners/{owner_id}/profile", token=self.tokens["farmer"])
        if response and response.status_code == 200:
            profile = response.json()
            self.log_test("Get Owner Profile", True, f"Owner: {profile['name']}, Machines: {profile['total_machines']}")
        else:
            self.log_test("Get Owner Profile", False, f"Failed: {response.status_code if response else 'No response'}")
            
        return True

    def test_contract_management(self):
        """Test contract management flow"""
        print("\n=== TESTING CONTRACT MANAGEMENT ===")
        
        if "jcb" not in self.machines or "farmer" not in self.tokens:
            self.log_test("Contract Management", False, "Missing machine or farmer token")
            return False
            
        # Test 1: Create Contract Request
        contract_data = {
            "machine_id": self.machines["jcb"]["id"],
            "renter_name": "Suresh Patel",
            "renter_contact": self.farmer_email,
            "total_days": 7,
            "advance_amount": 5000.0,
            "total_amount": 25000.0,
            "transport_charges": 2000.0,
            "transport_paid": 1000.0,
            "initial_fuel_filled": True,
            "initial_fuel_liters": 50.0
        }
        
        response = self.make_request("POST", "/contracts", contract_data, self.tokens["farmer"])
        if response and response.status_code == 200:
            result = response.json()
            self.contracts["main"] = result
            self.log_test("Create Contract", True, f"Contract created: {result['id']}")
        else:
            self.log_test("Create Contract", False, f"Failed: {response.status_code if response else 'No response'}")
            return False
            
        # Test 2: Get Contracts (Owner View)
        response = self.make_request("GET", "/contracts", token=self.tokens["owner"])
        if response and response.status_code == 200:
            contracts = response.json()
            self.log_test("Get Owner Contracts", True, f"Retrieved {len(contracts)} contracts")
        else:
            self.log_test("Get Owner Contracts", False, f"Failed: {response.status_code if response else 'No response'}")
            
        # Test 3: Get Single Contract
        if "main" in self.contracts:
            contract_id = self.contracts["main"]["id"]
            response = self.make_request("GET", f"/contracts/{contract_id}", token=self.tokens["owner"])
            if response and response.status_code == 200:
                contract = response.json()
                self.log_test("Get Single Contract", True, f"Contract status: {contract['status']}")
            else:
                self.log_test("Get Single Contract", False, f"Failed: {response.status_code if response else 'No response'}")
                
        # Test 4: Approve Contract
        if "main" in self.contracts:
            contract_id = self.contracts["main"]["id"]
            response = self.make_request("POST", f"/contracts/{contract_id}/approve", token=self.tokens["owner"])
            if response and response.status_code == 200:
                self.log_test("Approve Contract", True, "Contract approved successfully")
            else:
                self.log_test("Approve Contract", False, f"Failed: {response.status_code if response else 'No response'}")
                
        # Test 5: Start Engine
        if "main" in self.contracts:
            contract_id = self.contracts["main"]["id"]
            engine_data = {
                "contract_id": contract_id,
                "day_number": 1,
                "action": "start"
            }
            response = self.make_request("POST", "/engine-timer", engine_data, self.tokens["farmer"])
            if response and response.status_code == 200:
                self.log_test("Start Engine", True, "Engine started successfully")
            else:
                self.log_test("Start Engine", False, f"Failed: {response.status_code if response else 'No response'}")
                
        # Wait a moment then stop engine
        time.sleep(2)
        
        # Test 6: Stop Engine
        if "main" in self.contracts:
            contract_id = self.contracts["main"]["id"]
            engine_data = {
                "contract_id": contract_id,
                "day_number": 1,
                "action": "stop"
            }
            response = self.make_request("POST", "/engine-timer", engine_data, self.tokens["farmer"])
            if response and response.status_code == 200:
                self.log_test("Stop Engine", True, "Engine stopped successfully")
            else:
                self.log_test("Stop Engine", False, f"Failed: {response.status_code if response else 'No response'}")
                
        return True

    def test_daily_logs(self):
        """Test daily log management"""
        print("\n=== TESTING DAILY LOGS ===")
        
        if "main" not in self.contracts:
            self.log_test("Daily Logs", False, "No contract available")
            return False
            
        # Test 1: Create Daily Log
        log_data = {
            "contract_id": self.contracts["main"]["id"],
            "day_number": 2,  # Use day 2 since day 1 already exists from engine timer
            "diesel_filled": 25.0,
            "diesel_used": 20.0,
            "diesel_price_snapshot": 95.0,
            "engine_oil": 2.0,
            "grease_oil": 1.0,
            "hydraulic_oil": 3.0,
            "filled_by": "owner",
            "notes": "Second day of operation, machine running smoothly"
        }
        
        response = self.make_request("POST", "/daily-logs", log_data, self.tokens["owner"])
        if response and response.status_code == 200:
            result = response.json()
            self.log_test("Create Daily Log", True, f"Log created for day {result['day_number']}")
        else:
            self.log_test("Create Daily Log", False, f"Failed: {response.status_code if response else 'No response'}")
            
        # Test 2: Get Daily Logs
        contract_id = self.contracts["main"]["id"]
        response = self.make_request("GET", f"/daily-logs/{contract_id}", token=self.tokens["owner"])
        if response and response.status_code == 200:
            logs = response.json()
            self.log_test("Get Daily Logs", True, f"Retrieved {len(logs)} daily logs")
        else:
            self.log_test("Get Daily Logs", False, f"Failed: {response.status_code if response else 'No response'}")
            
        return True

    def test_notifications(self):
        """Test notification system"""
        print("\n=== TESTING NOTIFICATIONS ===")
        
        # Test 1: Get Notifications (Owner)
        response = self.make_request("GET", "/notifications", token=self.tokens["owner"])
        if response and response.status_code == 200:
            notifications = response.json()
            self.log_test("Get Owner Notifications", True, f"Retrieved {len(notifications)} notifications")
            if notifications:
                self.notifications["owner"] = notifications[0]
        else:
            self.log_test("Get Owner Notifications", False, f"Failed: {response.status_code if response else 'No response'}")
            
        # Test 2: Get Notifications (Farmer)
        response = self.make_request("GET", "/notifications", token=self.tokens["farmer"])
        if response and response.status_code == 200:
            notifications = response.json()
            self.log_test("Get Farmer Notifications", True, f"Retrieved {len(notifications)} notifications")
            if notifications:
                self.notifications["farmer"] = notifications[0]
        else:
            self.log_test("Get Farmer Notifications", False, f"Failed: {response.status_code if response else 'No response'}")
            
        # Test 3: Mark Notification as Read
        if "owner" in self.notifications:
            notification_id = self.notifications["owner"]["id"]
            response = self.make_request("PUT", f"/notifications/{notification_id}/read", token=self.tokens["owner"])
            if response and response.status_code == 200:
                self.log_test("Mark Notification Read", True, "Notification marked as read")
            else:
                self.log_test("Mark Notification Read", False, f"Failed: {response.status_code if response else 'No response'}")
                
        return True

    def test_reports(self):
        """Test reporting endpoints"""
        print("\n=== TESTING REPORTS ===")
        
        if "jcb" not in self.machines:
            self.log_test("Reports", False, "No machine available")
            return False
            
        # Test: Monthly Summary Report
        machine_id = self.machines["jcb"]["id"]
        current_month = datetime.now().strftime("%Y-%m")
        
        response = self.make_request("GET", f"/reports/monthly/{machine_id}", 
                                   params={"month": current_month}, 
                                   token=self.tokens["owner"])
        if response and response.status_code == 200:
            report = response.json()
            self.log_test("Monthly Summary Report", True, f"Report generated for {report['machine_name']}")
        else:
            self.log_test("Monthly Summary Report", False, f"Failed: {response.status_code if response else 'No response'}")
            
        return True

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("\n=== TESTING ADMIN ENDPOINTS ===")
        
        # Note: These tests will fail unless we have admin access
        # Testing with owner token to see expected behavior
        
        # Test 1: Admin Overview
        response = self.make_request("GET", "/admin/overview", token=self.tokens["owner"])
        if response:
            if response.status_code == 403:
                self.log_test("Admin Overview (Access Control)", True, "Correctly blocked non-admin access")
            elif response.status_code == 200:
                overview = response.json()
                self.log_test("Admin Overview", True, f"Total users: {overview['users']['total']}")
            else:
                self.log_test("Admin Overview", False, f"Unexpected response: {response.status_code}")
        else:
            self.log_test("Admin Overview", False, "No response received")
            
        # Test 2: Running Machines
        response = self.make_request("GET", "/admin/running-machines", token=self.tokens["owner"])
        if response:
            if response.status_code == 403:
                self.log_test("Running Machines (Access Control)", True, "Correctly blocked non-admin access")
            elif response.status_code == 200:
                machines = response.json()
                self.log_test("Running Machines", True, f"Found {len(machines)} running machines")
            else:
                self.log_test("Running Machines", False, f"Unexpected response: {response.status_code}")
        else:
            self.log_test("Running Machines", False, "No response received")
            
        # Test 3: Recent Activity
        response = self.make_request("GET", "/admin/recent-activity", token=self.tokens["owner"])
        if response:
            if response.status_code == 403:
                self.log_test("Recent Activity (Access Control)", True, "Correctly blocked non-admin access")
            elif response.status_code == 200:
                activity = response.json()
                self.log_test("Recent Activity", True, f"Retrieved recent activity data")
            else:
                self.log_test("Recent Activity", False, f"Unexpected response: {response.status_code}")
        else:
            self.log_test("Recent Activity", False, "No response received")
            
        return True

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n=== CLEANING UP TEST DATA ===")
        
        # Delete machine (this will cascade to contracts)
        if "jcb" in self.machines and "owner" in self.tokens:
            machine_id = self.machines["jcb"]["id"]
            response = self.make_request("DELETE", f"/machines/{machine_id}", token=self.tokens["owner"])
            if response and response.status_code == 200:
                self.log_test("Cleanup Machine", True, "Test machine deleted")
            else:
                self.log_test("Cleanup Machine", False, f"Failed to delete machine: {response.status_code if response else 'No response'}")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Machine Rental Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        try:
            # Run all test suites
            self.test_authentication_flow()
            self.test_machine_management()
            self.test_owner_endpoints()
            self.test_contract_management()
            self.test_daily_logs()
            self.test_notifications()
            self.test_reports()
            self.test_admin_endpoints()
            
            # Clean up
            self.cleanup_test_data()
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {e}")
            
        # Print summary
        self.print_summary()
        
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    tester = MachineRentalTester()
    tester.run_all_tests()