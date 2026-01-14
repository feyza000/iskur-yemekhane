from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Survey, Question, Response

User = get_user_model()

class ModelTests(TestCase):
    def test_survey_creation(self):
        survey = Survey.objects.create(title="Test Survey", description="Test Description")
        self.assertEqual(survey.title, "Test Survey")
        self.assertTrue(survey.is_active)

    def test_question_options_json(self):
        """Test if options are correctly stored as a list in JSONField."""
        survey = Survey.objects.create(title="Q Survey")
        question = Question.objects.create(
            survey=survey,
            text="Favorite Color?",
            question_type="choice",
            options=["Red", "Blue", "Green"],
            order=1
        )
        self.assertIsInstance(question.options, list)
        self.assertEqual(len(question.options), 3)
        self.assertIn("Red", question.options)

class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/register/'
        self.login_url = '/api/login/'
        
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpassword123'
        }

    def test_register_user(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('username', response.data)
        self.assertIn('email', response.data)

    def test_login_user(self):
        User.objects.create_user(**self.user_data)
        response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'testpassword123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

class SurveyAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'pass123')
        self.regular_user = User.objects.create_user('user', 'user@example.com', 'pass123')
        
        # Admin Login to get token
        response = self.client.post('/api/login/', {'username': 'admin', 'password': 'pass123'})
        self.admin_token = response.data['token']
        
        # Regular User Login
        response = self.client.post('/api/login/', {'username': 'user', 'password': 'pass123'})
        self.user_token = response.data['token']

        self.survey = Survey.objects.create(title="API Survey", is_active=True)

    def test_get_surveys_authenticated(self):
        """Authenticated user should see surveys."""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.user_token)
        response = self.client.get('/api/surveys/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_survey_admin_only(self):
        """Only admin/staff can create surveys."""
        # Try with regular user
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.user_token)
        response = self.client.post('/api/surveys/', {'title': 'User Survey'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Try with admin
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token)
        response = self.client.post('/api/surveys/', {'title': 'Admin Survey'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

class ResponseSubmissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('resp_user', 'u@e.com', 'Password123')
        
        # User Login
        response = self.client.post('/api/login/', {'username': 'resp_user', 'password': 'Password123'})
        self.token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token)

        # Create Survey & Question
        self.survey = Survey.objects.create(title="Feedback", is_active=True)
        self.question = Question.objects.create(
            survey=self.survey,
            text="How are you?",
            question_type="text",
            order=1
        )

    def test_submit_response(self):
        payload = {
            "survey": self.survey.id,
            "answers": [
                {
                    "question": self.question.id,
                    "value": "I am fine."
                }
            ]
        }
        response = self.client.post('/api/responses/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Response.objects.count(), 1)
        self.assertEqual(Response.objects.first().answers.first().value, "I am fine.")
