#!/usr/bin/env python3
"""
Backend Testing for Secure Admin Authentication System
Tests admin login, role-based access control, and security.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://rental-mgmt-hub-1.preview.emergentagent.com/api"

# Test credentials
ADMIN_PHONE = "9966633111"
ADMIN_PASSWORD = "Zah*2336941"
OTP = "123456"

class TestResults:
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.results = []
    
    def add_result(self, test_name, passed, message=""):
        self.total += 1
        if passed:
            self.passed += 1
            self.results.append(f"✅ {test_name}")
            print(f"✅ {test_name}")
        else:
            self.failed += 1
            self.results.append(f"❌ {test_name} - {message}")
            print(f"❌ {test_name} - {message}")
    
    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"ADMIN AUTHENTICATION SYSTEM TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {self.total}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Success Rate: {(self.passed/self.total)*100:.1f}%")
        print(f"{'='*60}")
        
        if self.failed > 0:
            print("FAILED TESTS:")
            for result in self.results:
                if "❌" in result:
                    print(f"  {result}")

def test_admin_direct_login():
    """Test 1: Admin should be able to login directly without signup"""
    print("\n=== Test 1: Admin Direct Login (No Signup Required) ===")
    
    results = TestResults()
    
    # Test admin login
    login_data = {
        "phone_or_email": ADMIN_PHONE,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, timeout=30)
        
        if response.status_code == 200:
            login_response = response.json()
            
            # Check token exists
            if "access_token" in login_response:
                results.add_result("Admin login returns JWT token", True)
                
                # Check user object
                if "user" in login_response:
                    user = login_response["user"]
                    
                    # Check role is admin
                    if user.get("role") == "admin":
                        results.add_result("User object has role: admin", True)
                    else:
                        results.add_result("User object has role: admin", False, f"Got role: {user.get('role')}")
                    
                    # Check phone matches
                    if user.get("phone_or_email") == ADMIN_PHONE:
                        results.add_result("Admin phone matches expected", True)
                    else:
                        results.add_result("Admin phone matches expected", False, f"Got: {user.get('phone_or_email')}")
                    
                    return login_response["access_token"]
                else:
                    results.add_result("Login response contains user object", False)
            else:
                results.add_result("Admin login returns JWT token", False, "No access_token in response")
        else:
            results.add_result("Admin login successful", False, f"HTTP {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Admin login request", False, f"Request failed: {str(e)}")
    
    results.print_summary()
    return None

def test_admin_api_access(admin_token):
    """Test 2: Admin should have access to admin endpoints with 200 response"""
    print("\n=== Test 2: Admin API Access Control ===")
    
    results = TestResults()
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test admin/overview endpoint
    try:
        response = requests.get(f"{BACKEND_URL}/admin/overview", headers=headers, timeout=30)
        if response.status_code == 200:
            overview_data = response.json()
            if "users" in overview_data and "machines" in overview_data and "contracts" in overview_data:
                results.add_result("Admin /overview returns 200 with data structure", True)
            else:
                results.add_result("Admin /overview returns complete data", False, f"Missing keys in response")
        else:
            results.add_result("Admin /overview returns 200", False, f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Admin /overview request", False, f"Request failed: {str(e)}")
    
    # Test admin/users endpoint  
    try:
        response = requests.get(f"{BACKEND_URL}/admin/users", headers=headers, timeout=30)
        if response.status_code == 200:
            users_data = response.json()
            if isinstance(users_data, list):
                results.add_result("Admin /users returns 200 with user list", True)
            else:
                results.add_result("Admin /users returns user list", False, f"Response is not a list: {type(users_data)}")
        else:
            results.add_result("Admin /users returns 200", False, f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Admin /users request", False, f"Request failed: {str(e)}")
    
    # Test admin/recent-activity endpoint
    try:
        response = requests.get(f"{BACKEND_URL}/admin/recent-activity", headers=headers, timeout=30)
        if response.status_code == 200:
            activity_data = response.json()
            if isinstance(activity_data, list):
                results.add_result("Admin /recent-activity returns 200 with activity list", True)
            else:
                results.add_result("Admin /recent-activity returns activity list", False, f"Response is not a list: {type(activity_data)}")
        else:
            results.add_result("Admin /recent-activity returns 200", False, f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Admin /recent-activity request", False, f"Request failed: {str(e)}")
    
    results.print_summary()

def test_non_admin_access_blocked():
    """Test 3: Non-admin users should get 403 Forbidden on admin endpoints"""
    print("\n=== Test 3: Non-Admin Access Control (403 Forbidden) ===")
    
    results = TestResults()
    
    # First create a regular owner user
    owner_data = {
        "name": "Test Owner User",
        "phone_or_email": "testowner123@example.com",
        "password": "TestPass123!",
        "role": "owner"
    }
    
    # Register owner
    try:
        response = requests.post(f"{BACKEND_URL}/auth/register", json=owner_data, timeout=30)
        if response.status_code == 200:
            results.add_result("Non-admin user registration", True)
            
            # Verify OTP to complete registration
            verify_data = {
                "phone_or_email": owner_data["phone_or_email"],
                "otp": OTP
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/verify-otp", json=verify_data, timeout=30)
            if response.status_code == 200:
                owner_token_data = response.json()
                owner_token = owner_token_data.get("access_token")
                
                if owner_token:
                    results.add_result("Non-admin user OTP verification", True)
                    
                    # Test admin endpoints with non-admin token
                    headers = {"Authorization": f"Bearer {owner_token}"}
                    
                    # Test /admin/overview
                    response = requests.get(f"{BACKEND_URL}/admin/overview", headers=headers, timeout=30)
                    if response.status_code == 403:
                        results.add_result("Non-admin blocked from /admin/overview (403)", True)
                    else:
                        results.add_result("Non-admin blocked from /admin/overview (403)", False, f"Got HTTP {response.status_code}")
                    
                    # Test /admin/users
                    response = requests.get(f"{BACKEND_URL}/admin/users", headers=headers, timeout=30)
                    if response.status_code == 403:
                        results.add_result("Non-admin blocked from /admin/users (403)", True)
                    else:
                        results.add_result("Non-admin blocked from /admin/users (403)", False, f"Got HTTP {response.status_code}")
                    
                    # Test /admin/recent-activity
                    response = requests.get(f"{BACKEND_URL}/admin/recent-activity", headers=headers, timeout=30)
                    if response.status_code == 403:
                        results.add_result("Non-admin blocked from /admin/recent-activity (403)", True)
                    else:
                        results.add_result("Non-admin blocked from /admin/recent-activity (403)", False, f"Got HTTP {response.status_code}")
                        
                else:
                    results.add_result("Non-admin user OTP verification", False, "No access_token returned")
            else:
                results.add_result("Non-admin user OTP verification", False, f"HTTP {response.status_code}: {response.text}")
        else:
            if "already exists" in response.text.lower():
                # User already exists, try to login
                login_data = {
                    "phone_or_email": owner_data["phone_or_email"],
                    "password": owner_data["password"]
                }
                response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, timeout=30)
                if response.status_code == 200:
                    owner_token_data = response.json()
                    owner_token = owner_token_data.get("access_token")
                    
                    if owner_token:
                        results.add_result("Non-admin user login (existing user)", True)
                        
                        # Test admin endpoints with non-admin token
                        headers = {"Authorization": f"Bearer {owner_token}"}
                        
                        # Test /admin/overview
                        response = requests.get(f"{BACKEND_URL}/admin/overview", headers=headers, timeout=30)
                        if response.status_code == 403:
                            results.add_result("Non-admin blocked from /admin/overview (403)", True)
                        else:
                            results.add_result("Non-admin blocked from /admin/overview (403)", False, f"Got HTTP {response.status_code}")
                        
                        # Test /admin/users
                        response = requests.get(f"{BACKEND_URL}/admin/users", headers=headers, timeout=30)
                        if response.status_code == 403:
                            results.add_result("Non-admin blocked from /admin/users (403)", True)
                        else:
                            results.add_result("Non-admin blocked from /admin/users (403)", False, f"Got HTTP {response.status_code}")
                        
                        # Test /admin/recent-activity
                        response = requests.get(f"{BACKEND_URL}/admin/recent-activity", headers=headers, timeout=30)
                        if response.status_code == 403:
                            results.add_result("Non-admin blocked from /admin/recent-activity (403)", True)
                        else:
                            results.add_result("Non-admin blocked from /admin/recent-activity (403)", False, f"Got HTTP {response.status_code}")
                    else:
                        results.add_result("Non-admin user login (existing user)", False, "No access_token returned")
                else:
                    results.add_result("Non-admin user login (existing user)", False, f"HTTP {response.status_code}: {response.text}")
            else:
                results.add_result("Non-admin user registration", False, f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.add_result("Non-admin user setup", False, f"Request failed: {str(e)}")
    
    results.print_summary()

def test_old_endpoints_removed():
    """Test 4: Verify old endpoints are removed"""
    print("\n=== Test 4: Verify Old Endpoints Removed ===")
    
    results = TestResults()
    
    # Test that /api/auth/verify-admin-access returns 404
    try:
        response = requests.get(f"{BACKEND_URL}/auth/verify-admin-access", timeout=30)
        if response.status_code == 404:
            results.add_result("Old /auth/verify-admin-access endpoint removed (404)", True)
        else:
            results.add_result("Old /auth/verify-admin-access endpoint removed (404)", False, f"Got HTTP {response.status_code}")
    except Exception as e:
        results.add_result("Old endpoint removal check", False, f"Request failed: {str(e)}")
    
    results.print_summary()

def main():
    """Run all admin authentication tests"""
    print("🔐 SECURE ADMIN AUTHENTICATION SYSTEM TESTING")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Admin Phone: {ADMIN_PHONE}")
    print(f"Test OTP: {OTP}")
    print(f"Timestamp: {datetime.now()}")
    print("=" * 60)
    
    # Test 1: Admin Direct Login
    admin_token = test_admin_direct_login()
    
    if admin_token:
        # Test 2: Admin API Access  
        test_admin_api_access(admin_token)
    else:
        print("❌ Skipping admin API tests - admin login failed")
    
    # Test 3: Non-Admin Access Control
    test_non_admin_access_blocked()
    
    # Test 4: Old Endpoints Removed
    test_old_endpoints_removed()
    
    print(f"\n🔐 ADMIN AUTHENTICATION TESTING COMPLETED")
    print(f"Timestamp: {datetime.now()}")

if __name__ == "__main__":
    main()