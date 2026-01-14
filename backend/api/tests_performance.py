from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Survey, Question, Response, Answer

User = get_user_model()

class PerformanceOptimizationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('perf_user', 'p@e.com', 'Pass123')
        self.admin = User.objects.create_superuser('admin', 'a@e.com', 'Pass123')
        
        # User Login
        response = self.client.post('/api/login/', {'username': 'perf_user', 'password': 'Pass123'})
        self.token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token)

        # Create Survey
        self.survey = Survey.objects.create(title="Perf Survey", is_active=True)
        
        # Questions
        self.q_star = Question.objects.create(survey=self.survey, text="Star Q", question_type="star", order=1)
        self.q_scale = Question.objects.create(survey=self.survey, text="Scale Q", question_type="scale", order=2)
        self.q_text = Question.objects.create(survey=self.survey, text="Text Q", question_type="text", order=3)

    def test_numeric_value_population(self):
        """
        Verify that creating a response automatically populates the 'numeric_value' field
        for star/scale questions.
        """
        payload = {
            "survey": self.survey.id,
            "answers": [
                {"question": self.q_star.id, "value": "4"},
                {"question": self.q_scale.id, "value": "8"},
                {"question": self.q_text.id, "value": "Some text"}
            ]
        }
        
        # This triggers ResponseSerializer.create which should use bulk_create and populate numeric_value
        response = self.client.post('/api/responses/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify DB values
        ans_star = Answer.objects.get(question=self.q_star)
        self.assertEqual(ans_star.numeric_value, 4.0)
        
        ans_scale = Answer.objects.get(question=self.q_scale)
        self.assertEqual(ans_scale.numeric_value, 8.0)
        
        ans_text = Answer.objects.get(question=self.q_text)
        self.assertIsNone(ans_text.numeric_value)

    def test_numeric_value_update(self):
        """
        Verify that updating a response updates the 'numeric_value' field.
        """
        # Create initial response
        resp_obj = Response.objects.create(survey=self.survey, user=self.user)
        # Manually create answer (or via serializer)
        Answer.objects.create(response=resp_obj, question=self.q_star, value="2", numeric_value=2.0)
        
        # Update via API
        payload = {
            "answers": [
                {"question": self.q_star.id, "value": "5"} # Change 2 -> 5
            ]
        }
        
        self.client.put(f'/api/responses/{resp_obj.id}/', payload, format='json')
        
        # Verify DB
        ans_star = Answer.objects.get(question=self.q_star)
        self.assertEqual(ans_star.numeric_value, 5.0)

    def test_aggregation_accuracy(self):
        """
        Verify that /results/ endpoint returns correct SQL-calculated averages.
        """
        # Create 3 responses: 3, 4, 5. Average should be 4.0
        r1 = Response.objects.create(survey=self.survey, user=self.user)
        Answer.objects.create(response=r1, question=self.q_star, value="3", numeric_value=3.0)
        
        u2 = User.objects.create_user('u2', 'u2@e.com', 'p')
        r2 = Response.objects.create(survey=self.survey, user=u2)
        Answer.objects.create(response=r2, question=self.q_star, value="4", numeric_value=4.0)

        u3 = User.objects.create_user('u3', 'u3@e.com', 'p')
        r3 = Response.objects.create(survey=self.survey, user=u3)
        Answer.objects.create(response=r3, question=self.q_star, value="5", numeric_value=5.0)

        # Get Results (Admin Only usually, or staff)
        # Login as admin
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(f'/api/surveys/{self.survey.id}/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        # Find Star Question Results
        star_res = next(item for item in data if item['id'] == self.q_star.id)
        
        self.assertEqual(star_res['total'], 3)
        self.assertEqual(star_res['results']['average'], 4.0)
        # Distribution check
        self.assertEqual(star_res['results']['distribution']['3'], 1)
        self.assertEqual(star_res['results']['distribution']['4'], 1)
        self.assertEqual(star_res['results']['distribution']['5'], 1)
        self.assertEqual(star_res['results']['distribution']['1'], 0)
