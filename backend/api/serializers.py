# backend/api/serializers.py

from rest_framework import serializers
from .models import Survey, Question, Response, Answer, User
from rest_framework.authtoken.models import Token # Login için
from django.contrib.auth import authenticate # Login için

# --- KULLANICI İŞLEMLERİ (Aynı kalabilir) ---
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

# --- ANKET SİSTEMİ SERIALIZERLARI ---

class QuestionSerializer(serializers.ModelSerializer):
    """Anketin içindeki soruları listeler"""
    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'order', 'options']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'survey', 'text', 'question_type', 'options', 'order', 'page_number']

class SurveySerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Survey
        fields = ['id', 'title', 'description', 'questions', 'is_active', 'created_at']

class AnswerSerializer(serializers.ModelSerializer):
    """Cevap verirken kullanılacak yapı"""
    class Meta:
        model = Answer
        fields = ['question', 'value']

class ResponseSerializer(serializers.ModelSerializer):
    """Öğrenci anketi gönderdiğinde çalışacak"""
    answers = AnswerSerializer(many=True) # İçinde cevaplar listesi olacak

    survey_title = serializers.CharField(source='survey.title', read_only=True)

    class Meta:
        model = Response
        fields = ['id', 'survey', 'survey_title', 'answers', 'submitted_at']

    def create(self, validated_data):
        # DRF standart create metodu nested (iç içe) yazmayı desteklemez,
        # o yüzden burayı elimizle yazıyoruz (Mid-Level hareket)
        answers_data = validated_data.pop('answers')
        
        # 1. Önce Cevap Paketini (Response) oluştur
        # user bilgisini view içerisinden perform_create ile alacağız veya context'ten
        user = self.context['request'].user
        response = Response.objects.create(user=user, **validated_data)

        # 2. Sonra içindeki tekil cevapları (Answer) oluştur ve pakete bağla
        for answer_data in answers_data:
            Answer.objects.create(response=response, **answer_data)

        return response
    
    def update(self, instance, validated_data):
        # 1. Gelen yeni cevapları al
        answers_data = validated_data.pop('answers', [])
        
        # 2. Cevap Paketinin (Response) kendisini güncelle (tarih vs.)
        instance = super().update(instance, validated_data)
        
        # 3. ESKİ CEVAPLARI SİL (En temiz yöntem budur)
        instance.answers.all().delete()

        # 4. YENİ CEVAPLARI OLUŞTUR
        for answer_data in answers_data:
            Answer.objects.create(response=instance, **answer_data)
            
        return instance

# --- ADMIN KULLANICI YÖNETİMİ İÇİN ---
class UserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Admin bu alanları görecek ve değiştirebilecek
        fields = ['id', 'username', 'email', 'is_staff', 'is_superuser', 'date_joined']
        read_only_fields = ['date_joined'] # Kayıt tarihi değiştirilemesin