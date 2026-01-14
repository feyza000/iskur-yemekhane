# backend/api/serializers.py

from rest_framework import serializers
from .models import Survey, Question, Response, Answer, User
from rest_framework.authtoken.models import Token # For Login
from django.contrib.auth import authenticate # For Login

# --- USER OPERATIONS ---
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ('username', 'email', 'password')
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return {'user': user}
        raise serializers.ValidationError("Giriş bilgileri hatalı.")

# --- SURVEY SYSTEM SERIALIZERS ---
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'survey', 'text', 'question_type', 'options', 'order', 'page_number', 'required']

class SurveySerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Survey
        fields = ['id', 'title', 'description', 'questions', 'is_active', 'created_at']

class AnswerSerializer(serializers.ModelSerializer):
    """Structure used when submitting an answer"""
    class Meta:
        model = Answer
        fields = ['question', 'value']

class ResponseSerializer(serializers.ModelSerializer):
    """Executed when a student submits a survey"""
    answers = AnswerSerializer(many=True) # List of answers inside

    survey_title = serializers.CharField(source='survey.title', read_only=True)

    class Meta:
        model = Response
        fields = ['id', 'survey', 'survey_title', 'answers', 'submitted_at']

    def create(self, validated_data):
        # DRF standard create method does not support nested writes by default,
        # so we implement it manually.
        answers_data = validated_data.pop('answers')
        
        # 1. First, create the Response package
        # We will get user info from view via perform_create or context
        user = self.context['request'].user
        response = Response.objects.create(user=user, **validated_data)

        # 2. Then create individual answers (Answer) inside and link to package
        for answer_data in answers_data:
            Answer.objects.create(response=response, **answer_data)

        return response
    
    def update(self, instance, validated_data):
        # 1. Get new answers list
        answers_data = validated_data.pop('answers', [])
        
        # 2. Update the Response package itself (date etc.)
        instance = super().update(instance, validated_data)
        
        # 3. SMART UPDATE (Preserve IDs)
        # Fetch existing answers and map by Question ID for quick lookup
        existing_answers = {ans.question_id: ans for ans in instance.answers.all()}
        
        # Track which questions we have processed to identify deletions later
        processed_question_ids = []

        for answer_data in answers_data:
            q_id = answer_data.get('question').id # 'question' is a model instance from validated_data
            new_value = answer_data.get('value')
            
            if q_id in existing_answers:
                # UPDATE existing
                ans = existing_answers[q_id]
                ans.value = new_value
                ans.save()
                processed_question_ids.append(q_id)
            else:
                # CREATE new
                Answer.objects.create(response=instance, **answer_data)
                
        # 4. OPTIONAL: Delete answers that are NOT in the new payload?
        # If the form logic sends ALL answers every time, then yes, delete missing ones.
        # Use set difference for efficiency
        for q_id, ans in existing_answers.items():
            if q_id not in processed_question_ids:
                ans.delete()

        return instance

# --- FOR ADMIN USER MANAGEMENT ---
class UserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Admin can see and edit these fields
        fields = ['id', 'username', 'email', 'is_staff', 'is_superuser', 'date_joined']
        read_only_fields = ['date_joined'] # Registration date cannot be changed