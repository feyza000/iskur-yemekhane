import os
import django
import sys

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from api.models import Survey, Question
from api.serializers import ResponseSerializer

User = get_user_model()

print("DEBUG SCRIPT STARTED", flush=True)

def run_debug():
    try:
        print("SETTING UP DATA", flush=True)
        # 1. Setup Data
        user = User.objects.first()
        if not user:
            user = User.objects.create_user('debug_user', 'd@d.com', 'p')
            
        survey = Survey.objects.first()
        if not survey:
            survey = Survey.objects.create(title="Debug Survey")
            
        question = Question.objects.filter(survey=survey).first()
        if not question:
            question = Question.objects.create(survey=survey, text="Q1", question_type="text")

        # 2. Simulate Payload
        payload = {
            "survey": survey.id,
            "answers": [
                {
                    "question": question.id,
                    "value": "Test Value"
                }
            ]
        }
        
        # 3. Invoke Serializer
        # We need a mock request for context because ReponseSerializer uses expects 'request' in context
        from unittest.mock import Mock
        request = Mock()
        request.user = user
        
        serializer = ResponseSerializer(data=payload, context={'request': request})
        if serializer.is_valid():
            print("Serializer is valid.")
            try:
                serializer.save()
                print("Save successful.")
            except Exception as e:
                import traceback
                traceback.print_exc()
        else:
            print("Serializer Invalid:", serializer.errors)

    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_debug()
