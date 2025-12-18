# backend/api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SurveyViewSet, ResponseViewSet, RegisterView, LoginView

# Router kurulumu
router = DefaultRouter()
router.register(r'surveys', SurveyViewSet, basename='survey')     # Anketleri listeleme
router.register(r'responses', ResponseViewSet, basename='response') # Cevap gönderme

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
]