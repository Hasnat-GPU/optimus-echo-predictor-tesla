#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, List

class OptimusEchoAPITester:
    def __init__(self, base_url="https://echo-safety.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_scenario_id = None
        self.created_prediction_id = None
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "status": "PASSED" if success else "FAILED",
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Dict = None, headers: Dict = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if success:
                self.log_test(name, True)
                print(f"   Status: {response.status_code}")
                if response_data and isinstance(response_data, dict):
                    print(f"   Response keys: {list(response_data.keys())}")
            else:
                details = f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}"
                self.log_test(name, False, details)

            return success, response_data

        except Exception as e:
            details = f"Request failed: {str(e)}"
            self.log_test(name, False, details)
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        # Test root endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Test health check
        self.run_test("Health Check", "GET", "health", 200)

    def test_kpi_endpoints(self):
        """Test KPI endpoints"""
        print("\n" + "="*50)
        print("TESTING KPI ENDPOINTS")
        print("="*50)
        
        success, data = self.run_test("Get KPIs", "GET", "kpis", 200)
        
        if success and data:
            # Validate KPI structure
            required_fields = ['total_scenarios', 'total_predictions', 'avg_risk_score', 
                             'mitigated_errors_total', 'active_alerts', 'symbiosis_health']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("KPI Data Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("KPI Data Structure", True)
                print(f"   KPI Values: scenarios={data['total_scenarios']}, predictions={data['total_predictions']}")

    def test_scenario_crud(self):
        """Test scenario CRUD operations"""
        print("\n" + "="*50)
        print("TESTING SCENARIO CRUD")
        print("="*50)
        
        # Test GET scenarios (empty initially)
        self.run_test("Get Scenarios (Initial)", "GET", "scenarios", 200)
        
        # Test CREATE scenario
        scenario_data = {
            "name": "Test Assembly Line",
            "task_type": "assembly_line",
            "worker_count": 5,
            "robot_count": 3,
            "shift_duration_hours": 8.0,
            "proximity_threshold_meters": 1.5,
            "description": "Test scenario for API validation"
        }
        
        success, response = self.run_test("Create Scenario", "POST", "scenarios", 200, scenario_data)
        
        if success and response and 'id' in response:
            self.created_scenario_id = response['id']
            self.log_test("Scenario ID Retrieved", True)
            print(f"   Created scenario ID: {self.created_scenario_id}")
            
            # Test GET specific scenario
            self.run_test("Get Specific Scenario", "GET", f"scenarios/{self.created_scenario_id}", 200)
            
            # Test GET all scenarios (should have 1 now)
            success, scenarios = self.run_test("Get All Scenarios", "GET", "scenarios", 200)
            if success and isinstance(scenarios, list) and len(scenarios) > 0:
                self.log_test("Scenario List Populated", True)
            else:
                self.log_test("Scenario List Populated", False, "No scenarios returned")
        else:
            self.log_test("Scenario Creation Failed", False, "No ID in response")

    def test_prediction_workflow(self):
        """Test prediction workflow"""
        print("\n" + "="*50)
        print("TESTING PREDICTION WORKFLOW")
        print("="*50)
        
        if not self.created_scenario_id:
            self.log_test("Prediction Test Skipped", False, "No scenario ID available")
            return
        
        # Test run prediction
        success, response = self.run_test(
            "Run Prediction", 
            "POST", 
            f"predictions/{self.created_scenario_id}", 
            200
        )
        
        if success and response and 'id' in response:
            self.created_prediction_id = response['id']
            self.log_test("Prediction ID Retrieved", True)
            print(f"   Created prediction ID: {self.created_prediction_id}")
            
            # Validate prediction structure
            required_fields = ['overall_risk_score', 'risk_level', 'echo_risks', 
                             'mitigated_errors_percent', 'gesture_accuracy', 'symbiosis_index']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test("Prediction Data Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Prediction Data Structure", True)
                print(f"   Risk Level: {response.get('risk_level')}")
                print(f"   Risk Score: {response.get('overall_risk_score')}")
            
            # Test GET specific prediction
            self.run_test("Get Specific Prediction", "GET", f"predictions/{self.created_prediction_id}", 200)
            
            # Test GET all predictions
            success, predictions = self.run_test("Get All Predictions", "GET", "predictions", 200)
            if success and isinstance(predictions, list) and len(predictions) > 0:
                self.log_test("Prediction List Populated", True)
            else:
                self.log_test("Prediction List Populated", False, "No predictions returned")
        else:
            self.log_test("Prediction Creation Failed", False, "No prediction ID in response")

    def test_gesture_endpoints(self):
        """Test gesture data endpoints"""
        print("\n" + "="*50)
        print("TESTING GESTURE ENDPOINTS")
        print("="*50)
        
        # Test synthetic gesture generation
        success, response = self.run_test("Generate Synthetic Gestures", "GET", "gestures/synthetic?count=10", 200)
        
        if success and response:
            if 'gestures' in response and 'count' in response:
                gestures = response['gestures']
                if len(gestures) == 10:
                    self.log_test("Synthetic Gesture Count", True)
                else:
                    self.log_test("Synthetic Gesture Count", False, f"Expected 10, got {len(gestures)}")
                
                # Validate gesture structure
                if gestures and len(gestures) > 0:
                    gesture = gestures[0]
                    required_fields = ['gesture_type', 'confidence', 'timestamp', 'source']
                    missing_fields = [field for field in required_fields if field not in gesture]
                    
                    if missing_fields:
                        self.log_test("Gesture Data Structure", False, f"Missing fields: {missing_fields}")
                    else:
                        self.log_test("Gesture Data Structure", True)
                        print(f"   Sample gesture: {gesture['gesture_type']} (conf: {gesture['confidence']})")
            else:
                self.log_test("Synthetic Gesture Response", False, "Missing gestures or count field")

    def test_chart_endpoints(self):
        """Test chart data endpoints"""
        print("\n" + "="*50)
        print("TESTING CHART ENDPOINTS")
        print("="*50)
        
        # Test risk distribution
        success, data = self.run_test("Risk Distribution Chart", "GET", "charts/risk-distribution", 200)
        if success and isinstance(data, list):
            self.log_test("Risk Distribution Data", True)
        else:
            self.log_test("Risk Distribution Data", False, "Invalid response format")
        
        # Test error rates
        success, data = self.run_test("Error Rates Chart", "GET", "charts/error-rates", 200)
        if success and isinstance(data, list):
            self.log_test("Error Rates Data", True)
        else:
            self.log_test("Error Rates Data", False, "Invalid response format")
        
        # Test symbiosis trend
        success, data = self.run_test("Symbiosis Trend Chart", "GET", "charts/symbiosis-trend", 200)
        if success and isinstance(data, list):
            self.log_test("Symbiosis Trend Data", True)
        else:
            self.log_test("Symbiosis Trend Data", False, "Invalid response format")

    def test_alerts_endpoints(self):
        """Test alerts endpoints"""
        print("\n" + "="*50)
        print("TESTING ALERTS ENDPOINTS")
        print("="*50)
        
        # Test get alerts
        success, alerts = self.run_test("Get Alerts", "GET", "alerts", 200)
        if success and isinstance(alerts, list):
            self.log_test("Alerts List", True)
            print(f"   Found {len(alerts)} alerts")
        else:
            self.log_test("Alerts List", False, "Invalid response format")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n" + "="*50)
        print("CLEANING UP TEST DATA")
        print("="*50)
        
        if self.created_scenario_id:
            success, _ = self.run_test(
                "Delete Test Scenario", 
                "DELETE", 
                f"scenarios/{self.created_scenario_id}", 
                200
            )
            if success:
                print(f"   Cleaned up scenario: {self.created_scenario_id}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Optimus Echo Predictor API Tests")
        print(f"Base URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        
        try:
            self.test_health_endpoints()
            self.test_kpi_endpoints()
            self.test_scenario_crud()
            self.test_prediction_workflow()
            self.test_gesture_endpoints()
            self.test_chart_endpoints()
            self.test_alerts_endpoints()
            
        finally:
            self.cleanup_test_data()
        
        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed!")
            return 1

def main():
    tester = OptimusEchoAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())