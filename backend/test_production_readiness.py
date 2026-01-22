"""
Production Readiness Test Suite
Tests critical functionality, security, and error handling
"""
import requests
import json
from datetime import datetime

API_URL = "http://localhost:8080"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name, passed, message=""):
    status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed else f"{Colors.RED}✗ FAIL{Colors.END}"
    print(f"{status} - {name}")
    if message:
        print(f"      {message}")

def test_health_check():
    """Test API health endpoint"""
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        passed = response.status_code == 200
        print_test("Health Check", passed, f"Status: {response.status_code}")
        return passed
    except Exception as e:
        print_test("Health Check", False, f"Error: {str(e)}")
        return False

def test_registration_validation():
    """Test input validation on registration"""
    print(f"\n{Colors.BLUE}Testing Registration Validation{Colors.END}")
    
    # Test 1: Invalid email format
    try:
        response = requests.post(f"{API_URL}/register", json={
            "email": "invalid-email",
            "password": "test123",
            "full_name": "Test User"
        })
        passed = response.status_code == 422  # Validation error
        print_test("Invalid Email Format", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Invalid Email Format", False, f"Error: {str(e)}")
    
    # Test 2: Missing required fields
    try:
        response = requests.post(f"{API_URL}/register", json={
            "email": "test@example.com"
        })
        passed = response.status_code == 422
        print_test("Missing Required Fields", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Missing Required Fields", False, f"Error: {str(e)}")
    
    # Test 3: SQL Injection attempt
    try:
        response = requests.post(f"{API_URL}/register", json={
            "email": "test@example.com'; DROP TABLE users; --",
            "password": "test123",
            "full_name": "Test User"
        })
        # Should either reject or safely handle
        passed = response.status_code in [400, 422]
        print_test("SQL Injection Protection", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("SQL Injection Protection", False, f"Error: {str(e)}")

def test_authentication_flow():
    """Test complete authentication flow"""
    print(f"\n{Colors.BLUE}Testing Authentication Flow{Colors.END}")
    
    # Create unique test user
    test_email = f"test_{datetime.now().timestamp()}@example.com"
    test_password = "SecurePass123!"
    
    # Test 1: Register new user
    try:
        response = requests.post(f"{API_URL}/register", json={
            "email": test_email,
            "password": test_password,
            "full_name": "Test User"
        })
        passed = response.status_code == 200
        print_test("User Registration", passed, f"Status: {response.status_code}")
        if not passed:
            print(f"      Response: {response.text}")
            return None
    except Exception as e:
        print_test("User Registration", False, f"Error: {str(e)}")
        return None
    
    # Test 2: Login with correct credentials
    try:
        response = requests.post(f"{API_URL}/login", data={
            "username": test_email,
            "password": test_password
        })
        passed = response.status_code == 200
        token = response.json().get("access_token") if passed else None
        print_test("Login Success", passed, f"Status: {response.status_code}")
        if not passed:
            print(f"      Response: {response.text}")
            return None
    except Exception as e:
        print_test("Login Success", False, f"Error: {str(e)}")
        return None
    
    # Test 3: Login with wrong password
    try:
        response = requests.post(f"{API_URL}/login", data={
            "username": test_email,
            "password": "WrongPassword123"
        })
        passed = response.status_code == 403
        print_test("Wrong Password Rejection", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Wrong Password Rejection", False, f"Error: {str(e)}")
    
    # Test 4: Access protected endpoint with token
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/api/users/me", headers=headers)
        passed = response.status_code == 200
        print_test("Protected Endpoint Access", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Protected Endpoint Access", False, f"Error: {str(e)}")
    
    # Test 5: Access protected endpoint without token
    try:
        response = requests.get(f"{API_URL}/api/users/me")
        passed = response.status_code == 401
        print_test("Unauthorized Access Rejection", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Unauthorized Access Rejection", False, f"Error: {str(e)}")
    
    # Test 6: Access with invalid token
    try:
        headers = {"Authorization": "Bearer invalid_token_12345"}
        response = requests.get(f"{API_URL}/api/users/me", headers=headers)
        passed = response.status_code == 401
        print_test("Invalid Token Rejection", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Invalid Token Rejection", False, f"Error: {str(e)}")
    
    return token

def test_watchlist_operations(token):
    """Test watchlist CRUD operations"""
    if not token:
        print(f"\n{Colors.YELLOW}Skipping watchlist tests (no token){Colors.END}")
        return
    
    print(f"\n{Colors.BLUE}Testing Watchlist Operations{Colors.END}")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Get empty watchlist
    try:
        response = requests.get(f"{API_URL}/api/watchlist/", headers=headers)
        passed = response.status_code == 200
        print_test("Get Watchlist", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Get Watchlist", False, f"Error: {str(e)}")
    
    # Test 2: Add movie to watchlist (assuming movie ID 1 exists)
    try:
        response = requests.post(f"{API_URL}/api/watchlist/", 
                                headers=headers,
                                json={"movie_id": 1})
        passed = response.status_code in [200, 404]  # 404 if movie doesn't exist
        print_test("Add to Watchlist", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Add to Watchlist", False, f"Error: {str(e)}")

def test_movie_endpoints():
    """Test movie listing endpoints"""
    print(f"\n{Colors.BLUE}Testing Movie Endpoints{Colors.END}")
    
    # Test 1: Get featured movies
    try:
        response = requests.get(f"{API_URL}/api/movies/featured")
        passed = response.status_code == 200
        print_test("Get Featured Movies", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Get Featured Movies", False, f"Error: {str(e)}")
    
    # Test 2: Get movies with pagination
    try:
        response = requests.get(f"{API_URL}/api/movies/?page=1&page_size=10")
        passed = response.status_code == 200
        print_test("Get Movies with Pagination", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Get Movies with Pagination", False, f"Error: {str(e)}")
    
    # Test 3: Invalid pagination parameters
    try:
        response = requests.get(f"{API_URL}/api/movies/?page=-1&page_size=1000")
        passed = response.status_code == 422  # Validation error
        print_test("Invalid Pagination Rejection", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Invalid Pagination Rejection", False, f"Error: {str(e)}")

def test_error_handling():
    """Test error handling"""
    print(f"\n{Colors.BLUE}Testing Error Handling{Colors.END}")
    
    # Test 1: Non-existent endpoint
    try:
        response = requests.get(f"{API_URL}/api/nonexistent")
        passed = response.status_code == 404
        print_test("404 for Non-existent Endpoint", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("404 for Non-existent Endpoint", False, f"Error: {str(e)}")
    
    # Test 2: Invalid JSON
    try:
        response = requests.post(f"{API_URL}/register", 
                                data="invalid json",
                                headers={"Content-Type": "application/json"})
        passed = response.status_code in [400, 422]
        print_test("Invalid JSON Rejection", passed, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Invalid JSON Rejection", False, f"Error: {str(e)}")

def main():
    print(f"\n{'='*70}")
    print(f"{Colors.BLUE}STREAMIFY PRODUCTION READINESS TEST SUITE{Colors.END}")
    print(f"{'='*70}\n")
    
    # Test 1: Health Check
    if not test_health_check():
        print(f"\n{Colors.RED}API is not running. Please start the backend server.{Colors.END}")
        return
    
    # Test 2: Registration Validation
    test_registration_validation()
    
    # Test 3: Authentication Flow
    token = test_authentication_flow()
    
    # Test 4: Watchlist Operations
    test_watchlist_operations(token)
    
    # Test 5: Movie Endpoints
    test_movie_endpoints()
    
    # Test 6: Error Handling
    test_error_handling()
    
    print(f"\n{'='*70}")
    print(f"{Colors.BLUE}TEST SUITE COMPLETED{Colors.END}")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
