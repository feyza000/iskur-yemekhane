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
        user = self.context['request'].user
        response = Response.objects.create(user=user, **validated_data)

        # 2. Prepare Answer objects for BULK INSERT
        try:
            answers_to_create = []

            for answer_data in answers_data:
                val_str = answer_data.get('value', '')
                
                # --- NUMERIC OPTIMIZATION ---
                num_val = None
                try:
                    cleaned_val = str(val_str).replace(',', '.')
                    if cleaned_val.strip():
                        num_val = float(cleaned_val)
                except (ValueError, TypeError):
                    pass
                
                answers_to_create.append(
                    Answer(
                        response=response,
                        question=answer_data['question'],
                        value=val_str,
                        numeric_value=num_val
                    )
                )

            # 3. Perform BULK INSERT (One SQL Query instead of N)
            if answers_to_create:
                Answer.objects.bulk_create(answers_to_create)
                
        except Exception as e:
            import traceback
            with open("crash.log", "w") as f:
                f.write(traceback.format_exc())
            raise e

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
                
                # Update Numeric
                try:
                    ans.numeric_value = float(str(new_value).replace(',', '.'))
                except (ValueError, TypeError):
                    ans.numeric_value = None
                    
                ans.save()
                processed_question_ids.append(q_id)
            else:
                # CREATE new
                # Need to handle numeric here too
                num_val = None
                try:
                    num_val = float(str(new_value).replace(',', '.'))
                except (ValueError, TypeError):
                    pass
                    
                Answer.objects.create(
                    response=instance, 
                    question=answer_data.get('question'), 
                    value=new_value,
                    numeric_value=num_val
                )
                
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