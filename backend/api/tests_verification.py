from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Survey, Question, Response, Answer

User = get_user_model()

class PerformanceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'pass123')
        self.client.force_authenticate(user=self.admin_user)

        self.survey = Survey.objects.create(title="Perf Survey", is_active=True)
        
        # Create 20 questions
        self.questions = []
        for i in range(20):
            q = Question.objects.create(
                survey=self.survey,
                text=f"Question {i}",
                question_type="text",
                order=i
            )
            self.questions.append(q)

        # Create 10 responses
        for i in range(10):
            r = Response.objects.create(survey=self.survey) # user can be null
            for q in self.questions:
                Answer.objects.create(response=r, question=q, value=f"Answer {i}")

    def test_n_plus_one_results(self):
        """
        Fetching results should not execute N queries (one per question).
        With 20 questions, previously it would do 20+ queries.
        Optimized version should be constant (approx 3-5 queries).
        """
        # Warmup if needed (optional)
        
        with self.assertNumQueries(lambda n: n < 10): # Strict limit
             response = self.client.get(f'/api/surveys/{self.survey.id}/results/')
             self.assertEqual(response.status_code, 200)

class IntegrityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('student', 's@e.com', 'pass123')
        self.client.force_authenticate(user=self.user)

        self.survey = Survey.objects.create(title="Update Survey", is_active=True)
        self.q1 = Question.objects.create(survey=self.survey, text="Q1", question_type="text", order=1)
        self.q2 = Question.objects.create(survey=self.survey, text="Q2", question_type="text", order=2)

        # Initial Response
        self.response_obj = Response.objects.create(survey=self.survey, user=self.user)
        self.a1 = Answer.objects.create(response=self.response_obj, question=self.q1, value="Old A1")
        self.a2 = Answer.objects.create(response=self.response_obj, question=self.q2, value="Old A2")

    def test_update_preserves_ids(self):
        """
        Updating a response should update existing Answer records, not delete and recreate them.
        """
        new_payload = {
            "survey": self.survey.id,
            "answers": [
                {"question": self.q1.id, "value": "New A1"}, # Update
                {"question": self.q2.id, "value": "Old A2"}  # Keep same
            ]
        }

        # Call PATCH (using ResponseViewSet logic)
        resp = self.client.patch(f'/api/responses/{self.response_obj.id}/', new_payload, format='json')
        self.assertEqual(resp.status_code, 200)

        # Re-fetch answers
        a1_new = Answer.objects.get(question=self.q1, response=self.response_obj)
        a2_new = Answer.objects.get(question=self.q2, response=self.response_obj)

        self.assertEqual(a1_new.value, "New A1")
        
        # KEY CHECK: IDs must match original IDs
        self.assertEqual(a1_new.id, self.a1.id, "Answer ID changed! It was deleted and recreated.")
        self.assertEqual(a2_new.id, self.a2.id, "Answer ID changed! It was deleted and recreated.")
