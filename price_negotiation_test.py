#!/usr/bin/env python3

import requests
import json
import time
import os
from datetime import datetime

# Backend URL - use the EXPO_PUBLIC_BACKEND_URL
BACKEND_URL = "https://rental-mgmt-hub-1.preview.emergentagent.com/api"

# Test data
OWNER_PHONE = "+919876543210"  # Owner phone
FARMER_PHONE = "+919876543211"  # Farmer phone
OWNER_PASSWORD = "SecurePass@123"
FARMER_PASSWORD = "FarmerPass@456"

# Mock OTP as per review request
MOCK_OTP = "123456"

class Color:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log_test(test_name, status, message=""):
    status_color = Color.GREEN if status == "PASS" else Color.RED
    print(f"[{status_color}{status}{Color.END}] {test_name}")
    if message:
        print(f"      {message}")

def print_section(title):
    print(f"\n{Color.BLUE}{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}{Color.END}")

class PriceNegotiationTester:
    def __init__(self):
        self.owner_token = None
        self.farmer_token = None
        self.machine_id = None
        self.contract_id = None
        self.owner_id = None
        self.farmer_id = None

    def register_user(self, phone, name, password, role):
        """Register a new user"""
        try:
            data = {
                "name": name,
                "phone_or_email": phone,
                "password": password,
                "role": role
            }
            response = requests.post(f"{BACKEND_URL}/auth/register", json=data)
            
            if response.status_code == 200:
                return True, "User registered successfully"
            else:
                return False, f"Registration failed: {response.text}"
        except Exception as e:
            return False, f"Registration error: {str(e)}"

    def verify_otp(self, phone):
        """Verify OTP for user"""
        try:
            data = {
                "phone_or_email": phone,
                "otp": MOCK_OTP
            }
            response = requests.post(f"{BACKEND_URL}/auth/verify-otp", json=data)
            
            if response.status_code == 200:
                return True, "OTP verified successfully"
            else:
                return False, f"OTP verification failed: {response.text}"
        except Exception as e:
            return False, f"OTP verification error: {str(e)}"

    def login_user(self, phone, password):
        """Login user and get token"""
        try:
            data = {
                "phone_or_email": phone,
                "password": password
            }
            response = requests.post(f"{BACKEND_URL}/auth/login", json=data)
            
            if response.status_code == 200:
                result = response.json()
                token = result["access_token"]
                user_id = result["user"]["id"]
                return True, token, user_id, "Login successful"
            else:
                return False, None, None, f"Login failed: {response.text}"
        except Exception as e:
            return False, None, None, f"Login error: {str(e)}"

    def create_machine(self, token):
        """Create a machine for the owner"""
        try:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            machine_data = {
                "model_name": "CAT 320D Excavator",
                "machine_type": "excavator",
                "engine_capacity": "122 HP",
                "fuel_type": "diesel",
                "hourly_rate": 1500,
                "description": "Heavy duty excavator for construction work",
                "city": "Mumbai",
                "gps_latitude": 19.0760,
                "gps_longitude": 72.8777,
                "operational_radius_km": 25,
                "images": []
            }
            
            response = requests.post(f"{BACKEND_URL}/machines", json=machine_data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                return True, result["id"], "Machine created successfully"
            else:
                return False, None, f"Machine creation failed: {response.text}"
        except Exception as e:
            return False, None, f"Machine creation error: {str(e)}"

    def create_contract_with_negotiation(self, farmer_token, machine_id, proposed_rate):
        """Create a contract request with proposed hourly rate for negotiation"""
        try:
            headers = {
                "Authorization": f"Bearer {farmer_token}",
                "Content-Type": "application/json"
            }
            
            contract_data = {
                "machine_id": machine_id,
                "start_date": "2025-01-20",
                "end_date": "2025-01-25",
                "estimated_hours": 40,
                "work_description": "Land excavation for foundation work",
                "work_location": "Site Alpha, Mumbai",
                "proposed_hourly_rate": proposed_rate,
                "negotiation_status": "pending"
            }
            
            response = requests.post(f"{BACKEND_URL}/contracts", json=contract_data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                return True, result["id"], "Contract with negotiation created successfully"
            else:
                return False, None, f"Contract creation failed: {response.text}"
        except Exception as e:
            return False, None, f"Contract creation error: {str(e)}"

    def verify_contract_negotiation_fields(self, contract_id, farmer_token):
        """Verify that negotiation fields are saved correctly"""
        try:
            headers = {
                "Authorization": f"Bearer {farmer_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(f"{BACKEND_URL}/contracts/{contract_id}", headers=headers)
            
            if response.status_code == 200:
                contract = response.json()
                
                # Check if negotiation fields exist
                has_proposed_rate = "proposed_hourly_rate" in contract
                has_negotiation_status = "negotiation_status" in contract
                has_counter_offer = "counter_offer_rate" in contract
                
                if has_proposed_rate and has_negotiation_status and has_counter_offer is not None:
                    return True, f"Contract fields verified - Status: {contract.get('negotiation_status')}, Proposed Rate: {contract.get('proposed_hourly_rate')}"
                else:
                    return False, f"Missing negotiation fields in contract"
            else:
                return False, f"Failed to retrieve contract: {response.text}"
        except Exception as e:
            return False, f"Contract verification error: {str(e)}"

    def handle_negotiation(self, owner_token, contract_id, action, counter_rate=None, message=None):
        """Handle price negotiation by owner"""
        try:
            headers = {
                "Authorization": f"Bearer {owner_token}",
                "Content-Type": "application/json"
            }
            
            negotiation_data = {
                "action": action
            }
            
            if counter_rate:
                negotiation_data["counter_rate"] = counter_rate
            if message:
                negotiation_data["message"] = message
            
            response = requests.post(f"{BACKEND_URL}/contracts/{contract_id}/negotiate", 
                                   json=negotiation_data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                return True, result, f"Negotiation action '{action}' successful"
            else:
                return False, None, f"Negotiation failed: {response.text}"
        except Exception as e:
            return False, None, f"Negotiation error: {str(e)}"

    def respond_to_counter(self, farmer_token, contract_id, action):
        """Farmer responds to owner's counter-offer"""
        try:
            headers = {
                "Authorization": f"Bearer {farmer_token}",
                "Content-Type": "application/json"
            }
            
            params = {"action": action}
            response = requests.post(f"{BACKEND_URL}/contracts/{contract_id}/respond-counter", 
                                   params=params, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                return True, result, f"Counter-offer response '{action}' successful"
            else:
                return False, None, f"Counter-offer response failed: {response.text}"
        except Exception as e:
            return False, None, f"Counter-offer response error: {str(e)}"

    def get_notifications(self, token):
        """Get notifications for user"""
        try:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(f"{BACKEND_URL}/notifications", headers=headers)
            
            if response.status_code == 200:
                notifications = response.json()
                return True, notifications, "Notifications retrieved successfully"
            else:
                return False, None, f"Failed to get notifications: {response.text}"
        except Exception as e:
            return False, None, f"Notifications error: {str(e)}"

    def test_unauthorized_negotiation(self, farmer_token, contract_id):
        """Test that non-owner cannot handle negotiation"""
        try:
            headers = {
                "Authorization": f"Bearer {farmer_token}",
                "Content-Type": "application/json"
            }
            
            negotiation_data = {"action": "accept"}
            response = requests.post(f"{BACKEND_URL}/contracts/{contract_id}/negotiate", 
                                   json=negotiation_data, headers=headers)
            
            # Should return 403 or 400 for unauthorized access
            if response.status_code in [403, 400]:
                return True, "Unauthorized access properly blocked"
            else:
                return False, f"Expected authorization error but got: {response.status_code}"
        except Exception as e:
            return False, f"Authorization test error: {str(e)}"

    def run_full_test_suite(self):
        """Run the complete price negotiation test suite"""
        print_section("PRICE NEGOTIATION FEATURE TESTING")
        
        # Test counters
        total_tests = 0
        passed_tests = 0
        
        # Step 1: Register and setup users
        print_section("USER SETUP")
        
        # Register Owner
        total_tests += 1
        success, msg = self.register_user(OWNER_PHONE, "Test Owner", OWNER_PASSWORD, "owner")
        if success:
            passed_tests += 1
            log_test("Owner Registration", "PASS", msg)
        else:
            log_test("Owner Registration", "FAIL", msg)
            
        # Register Farmer  
        total_tests += 1
        success, msg = self.register_user(FARMER_PHONE, "Test Farmer", FARMER_PASSWORD, "user")
        if success:
            passed_tests += 1
            log_test("Farmer Registration", "PASS", msg)
        else:
            log_test("Farmer Registration", "FAIL", msg)

        # Verify OTPs
        total_tests += 1
        success, msg = self.verify_otp(OWNER_PHONE)
        if success:
            passed_tests += 1
            log_test("Owner OTP Verification", "PASS", msg)
        else:
            log_test("Owner OTP Verification", "FAIL", msg)

        total_tests += 1
        success, msg = self.verify_otp(FARMER_PHONE)
        if success:
            passed_tests += 1
            log_test("Farmer OTP Verification", "PASS", msg)
        else:
            log_test("Farmer OTP Verification", "FAIL", msg)

        # Login users
        total_tests += 1
        success, self.owner_token, self.owner_id, msg = self.login_user(OWNER_PHONE, OWNER_PASSWORD)
        if success:
            passed_tests += 1
            log_test("Owner Login", "PASS", msg)
        else:
            log_test("Owner Login", "FAIL", msg)
            return

        total_tests += 1
        success, self.farmer_token, self.farmer_id, msg = self.login_user(FARMER_PHONE, FARMER_PASSWORD)
        if success:
            passed_tests += 1
            log_test("Farmer Login", "PASS", msg)
        else:
            log_test("Farmer Login", "FAIL", msg)
            return

        # Create machine
        total_tests += 1
        success, self.machine_id, msg = self.create_machine(self.owner_token)
        if success:
            passed_tests += 1
            log_test("Machine Creation", "PASS", msg)
        else:
            log_test("Machine Creation", "FAIL", msg)
            return

        # Step 2: Test Contract Creation with Negotiation
        print_section("CONTRACT CREATION WITH NEGOTIATION")
        
        # Create contract with proposed rate (lower than original)
        original_rate = 1500
        proposed_rate = 1200
        
        total_tests += 1
        success, self.contract_id, msg = self.create_contract_with_negotiation(
            self.farmer_token, self.machine_id, proposed_rate
        )
        if success:
            passed_tests += 1
            log_test("Contract Creation with Negotiation", "PASS", msg)
        else:
            log_test("Contract Creation with Negotiation", "FAIL", msg)
            return

        # Verify negotiation fields are saved
        total_tests += 1
        success, msg = self.verify_contract_negotiation_fields(self.contract_id, self.farmer_token)
        if success:
            passed_tests += 1
            log_test("Negotiation Fields Verification", "PASS", msg)
        else:
            log_test("Negotiation Fields Verification", "FAIL", msg)

        # Step 3: Test Negotiation Endpoints
        print_section("NEGOTIATION ENDPOINT TESTING")
        
        # Test unauthorized negotiation (farmer trying to handle negotiation)
        total_tests += 1
        success, msg = self.test_unauthorized_negotiation(self.farmer_token, self.contract_id)
        if success:
            passed_tests += 1
            log_test("Unauthorized Negotiation Access", "PASS", msg)
        else:
            log_test("Unauthorized Negotiation Access", "FAIL", msg)

        # Test counter-offer by owner
        counter_rate = 1350
        total_tests += 1
        success, result, msg = self.handle_negotiation(
            self.owner_token, self.contract_id, "counter", counter_rate, "Let's meet in the middle"
        )
        if success:
            passed_tests += 1
            log_test("Owner Counter-offer", "PASS", f"{msg} - Rate: ₹{counter_rate}/hr")
        else:
            log_test("Owner Counter-offer", "FAIL", msg)

        # Test notifications for farmer (counter-offer notification)
        total_tests += 1
        success, notifications, msg = self.get_notifications(self.farmer_token)
        if success and notifications:
            # Check if there's a counter-offer notification
            counter_notification = any("counter" in notif.get("message", "").lower() 
                                     for notif in notifications)
            if counter_notification:
                passed_tests += 1
                log_test("Counter-offer Notification to Farmer", "PASS", "Notification created successfully")
            else:
                log_test("Counter-offer Notification to Farmer", "FAIL", "No counter-offer notification found")
        else:
            log_test("Counter-offer Notification to Farmer", "FAIL", msg)

        # Step 4: Test Counter-offer Response
        print_section("COUNTER-OFFER RESPONSE TESTING")
        
        # Test farmer accepting counter-offer
        total_tests += 1
        success, result, msg = self.respond_to_counter(self.farmer_token, self.contract_id, "accept")
        if success:
            passed_tests += 1
            log_test("Farmer Accept Counter-offer", "PASS", msg)
        else:
            log_test("Farmer Accept Counter-offer", "FAIL", msg)

        # Test notifications for owner (acceptance notification)
        total_tests += 1
        success, notifications, msg = self.get_notifications(self.owner_token)
        if success and notifications:
            # Check if there's an acceptance notification
            accept_notification = any("accepted" in notif.get("message", "").lower() 
                                    for notif in notifications)
            if accept_notification:
                passed_tests += 1
                log_test("Counter-offer Acceptance Notification to Owner", "PASS", "Notification created successfully")
            else:
                log_test("Counter-offer Acceptance Notification to Owner", "FAIL", "No acceptance notification found")
        else:
            log_test("Counter-offer Acceptance Notification to Owner", "FAIL", msg)

        # Step 5: Test additional negotiation scenarios
        print_section("ADDITIONAL NEGOTIATION SCENARIOS")
        
        # Create another contract to test reject scenario
        total_tests += 1
        success, contract_id2, msg = self.create_contract_with_negotiation(
            self.farmer_token, self.machine_id, 1100  # Very low proposed rate
        )
        if success:
            passed_tests += 1
            log_test("Second Contract Creation", "PASS", msg)
            
            # Test owner rejecting negotiation
            total_tests += 1
            success, result, msg = self.handle_negotiation(
                self.owner_token, contract_id2, "reject"
            )
            if success:
                passed_tests += 1
                log_test("Owner Reject Negotiation", "PASS", msg)
            else:
                log_test("Owner Reject Negotiation", "FAIL", msg)
        else:
            log_test("Second Contract Creation", "FAIL", msg)

        # Create third contract to test accept scenario
        total_tests += 1
        success, contract_id3, msg = self.create_contract_with_negotiation(
            self.farmer_token, self.machine_id, 1450  # Close to original rate
        )
        if success:
            passed_tests += 1
            log_test("Third Contract Creation", "PASS", msg)
            
            # Test owner accepting negotiation
            total_tests += 1
            success, result, msg = self.handle_negotiation(
                self.owner_token, contract_id3, "accept"
            )
            if success:
                passed_tests += 1
                log_test("Owner Accept Negotiation", "PASS", msg)
            else:
                log_test("Owner Accept Negotiation", "FAIL", msg)
        else:
            log_test("Third Contract Creation", "FAIL", msg)

        # Print final results
        print_section("TEST RESULTS SUMMARY")
        success_rate = (passed_tests / total_tests) * 100
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print(f"{Color.GREEN}✅ PRICE NEGOTIATION FEATURE WORKING CORRECTLY{Color.END}")
        elif success_rate >= 70:
            print(f"{Color.YELLOW}⚠️  PRICE NEGOTIATION FEATURE HAS SOME ISSUES{Color.END}")
        else:
            print(f"{Color.RED}❌ PRICE NEGOTIATION FEATURE HAS MAJOR ISSUES{Color.END}")

        return success_rate

if __name__ == "__main__":
    tester = PriceNegotiationTester()
    tester.run_full_test_suite()